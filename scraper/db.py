"""
GB Store Scraper — Database Operations Module
Supabase upsert logic with diff-based updates and two-tier cleanup.
"""

import logging
import re
import unicodedata

from supabase import create_client

logger = logging.getLogger(__name__)


def create_supabase_client(config):
    """
    Create a Supabase client using the service_role key (bypasses RLS).

    Args:
        config: Dict with SUPABASE_URL, SUPABASE_SERVICE_KEY.

    Returns:
        Supabase client instance.
    """
    return create_client(
        config["SUPABASE_URL"],
        config["SUPABASE_SERVICE_KEY"],
    )


# ---------------------------------------------------------------------------
# Slug Generation
# ---------------------------------------------------------------------------

def generate_slug(text, supplier_id):
    """
    Generate a URL-friendly slug from Arabic/English text.
    Falls back to supplier_id if text produces an empty slug.

    Args:
        text: Product or category name (may be Arabic).
        supplier_id: Fallback identifier.

    Returns:
        URL-safe slug string.
    """
    if not text:
        return f"product-{supplier_id}"

    # Normalize unicode
    slug = unicodedata.normalize("NFKD", text.strip())

    # Replace Arabic/special chars with hyphens, keep alphanumeric + Arabic
    slug = re.sub(r"[^\w\u0600-\u06FF\s-]", "", slug)  # Keep Arabic range
    slug = re.sub(r"[\s_]+", "-", slug)  # Spaces/underscores → hyphens
    slug = re.sub(r"-+", "-", slug)      # Collapse multiple hyphens
    slug = slug.strip("-").lower()

    if not slug:
        return f"product-{supplier_id}"

    # Append supplier_id for uniqueness
    return f"{slug}-{supplier_id}"


# ---------------------------------------------------------------------------
# Category Operations
# ---------------------------------------------------------------------------

def upsert_categories(supabase, categories):
    """
    Upsert categories into the database.

    Args:
        supabase: Supabase client.
        categories: List of category dicts from extractor.

    Returns:
        Dict mapping supplier_id → category UUID.
    """
    logger.info("Upserting %d categories", len(categories))
    id_map = {}

    for cat in categories:
        try:
            slug = generate_slug(cat["name"], cat["supplier_id"])

            data = {
                "supplier_id": cat["supplier_id"],
                "name": cat["name"],
                "slug": slug,
                "image_url": cat.get("image_url"),
                "is_active": True,
            }

            # Upsert by supplier_id
            result = (
                supabase.table("categories")
                .upsert(data, on_conflict="supplier_id")
                .execute()
            )

            if result.data:
                row = result.data[0]
                id_map[cat["supplier_id"]] = row["id"]
                logger.debug(
                    "Upserted category: %s → %s", cat["name"], row["id"]
                )

        except Exception as e:
            logger.error(
                "Failed to upsert category %s: %s", cat["supplier_id"], e
            )

    # Handle parent_id relationships (second pass)
    for cat in categories:
        parent_sid = cat.get("parent_supplier_id")
        if parent_sid and parent_sid in id_map and cat["supplier_id"] in id_map:
            try:
                supabase.table("categories").update(
                    {"parent_id": id_map[parent_sid]}
                ).eq("id", id_map[cat["supplier_id"]]).execute()
            except Exception as e:
                logger.warning(
                    "Failed to set parent for category %s: %s",
                    cat["supplier_id"], e,
                )

    logger.info("Category upsert complete. %d categories mapped.", len(id_map))
    return id_map


# ---------------------------------------------------------------------------
# Product Operations
# ---------------------------------------------------------------------------

def get_existing_products(supabase):
    """
    Fetch all existing products from the database for diff comparison.

    Returns:
        Dict mapping supplier_id → product row dict.
    """
    logger.info("Fetching existing products from database")
    products = {}

    try:
        # Fetch in pages of 1000 to handle large catalogs
        offset = 0
        page_size = 1000

        while True:
            result = (
                supabase.table("products")
                .select(
                    "id, supplier_id, name, wholesale_price, quantity, "
                    "image_url, additional_images, supplier_image_url, "
                    "consecutive_zero_qty, is_available, is_active"
                )
                .range(offset, offset + page_size - 1)
                .execute()
            )

            if not result.data:
                break

            for row in result.data:
                products[row["supplier_id"]] = row

            if len(result.data) < page_size:
                break

            offset += page_size

    except Exception as e:
        logger.error("Failed to fetch existing products: %s", e)

    logger.info("Found %d existing products in database", len(products))
    return products


def upsert_product(supabase, product, category_id_map):
    """
    Insert or update a single product in the database.

    Args:
        supabase: Supabase client.
        product: Product dict from extractor + image pipeline.
        category_id_map: Dict mapping category supplier_id → UUID.

    Returns:
        Tuple of (action, product_id) where action is 'added', 'updated', or 'skipped'.
    """
    supplier_id = product["supplier_id"]
    cat_sid = product.get("category_supplier_id")
    category_id = category_id_map.get(cat_sid) if cat_sid else None

    slug = generate_slug(product["name"], supplier_id)

    data = {
        "supplier_id": supplier_id,
        "name": product["name"],
        "slug": slug,
        "description": product.get("description"),
        "wholesale_price": product.get("wholesale_price", 0),
        "image_url": product.get("r2_image_url"),
        "additional_images": product.get("r2_additional_images", []),
        "supplier_image_url": product.get("supplier_image_url"),
        "quantity": product.get("quantity", 1),
        "is_available": (product.get("quantity", 1) or 0) > 0,
        "tags": product.get("tags", []),
    }

    if category_id:
        data["category_id"] = category_id

    # Reset consecutive_zero_qty if product has stock
    if data["quantity"] and data["quantity"] > 0:
        data["consecutive_zero_qty"] = 0
        data["is_available"] = True

    try:
        result = (
            supabase.table("products")
            .upsert(data, on_conflict="supplier_id")
            .execute()
        )

        if result.data:
            return ("upserted", result.data[0]["id"])

    except Exception as e:
        logger.error("Failed to upsert product %s: %s", supplier_id, e)

    return ("error", None)


def diff_product(existing, scraped):
    """
    Compare existing DB product with scraped data to determine if update needed.

    Returns:
        True if the product data has changed and needs updating.
    """
    if not existing:
        return True  # New product

    # Compare key fields
    checks = [
        float(existing.get("wholesale_price", 0)) != float(scraped.get("wholesale_price", 0)),
        existing.get("name") != scraped.get("name"),
        existing.get("supplier_image_url") != scraped.get("supplier_image_url"),
    ]

    # Quantity change
    existing_qty = existing.get("quantity", 0) or 0
    scraped_qty = scraped.get("quantity", 1) or 1
    if existing_qty != scraped_qty:
        checks.append(True)

    return any(checks)


# ---------------------------------------------------------------------------
# Two-Tier Cleanup
# ---------------------------------------------------------------------------

def reconcile_products(supabase, scraped_supplier_ids, existing_products, config):
    """
    Two-tier cleanup strategy:
    1. Hard delete products removed from supplier catalog
    2. Track and threshold-delete zero-quantity products

    Args:
        supabase: Supabase client.
        scraped_supplier_ids: Set of supplier_ids found in current scrape.
        existing_products: Dict of supplier_id → product row from DB.
        config: Dict with ZERO_QTY_DELETE_THRESHOLD.

    Returns:
        Dict with cleanup stats: {products_deleted, images_to_delete_keys, deactivated}
    """
    threshold = config["ZERO_QTY_DELETE_THRESHOLD"]
    stats = {
        "products_deleted": 0,
        "images_to_delete_keys": [],
        "deactivated": 0,
    }

    for supplier_id, product in existing_products.items():
        # Skip admin-deactivated products (respect admin intent)
        if not product.get("is_active", True):
            continue

        product_uuid = product["id"]

        if supplier_id not in scraped_supplier_ids:
            # --- TIER 1: Product removed from supplier catalog → hard delete ---
            logger.info(
                "Product %s removed from supplier — hard deleting", supplier_id
            )
            _collect_image_keys(product, stats)
            _hard_delete_product(supabase, product_uuid)
            stats["products_deleted"] += 1

        elif product.get("quantity", 0) == 0:
            # --- TIER 2: Zero quantity — increment counter ---
            new_count = (product.get("consecutive_zero_qty", 0) or 0) + 1

            if new_count >= threshold:
                logger.info(
                    "Product %s zero qty for %d syncs (threshold=%d) — hard deleting",
                    supplier_id, new_count, threshold,
                )
                _collect_image_keys(product, stats)
                _hard_delete_product(supabase, product_uuid)
                stats["products_deleted"] += 1
            else:
                logger.debug(
                    "Product %s zero qty (%d/%d) — deactivating",
                    supplier_id, new_count, threshold,
                )
                try:
                    supabase.table("products").update({
                        "consecutive_zero_qty": new_count,
                        "is_available": False,
                    }).eq("id", product_uuid).execute()
                    stats["deactivated"] += 1
                except Exception as e:
                    logger.error(
                        "Failed to update zero-qty counter for %s: %s",
                        supplier_id, e,
                    )

    return stats


def _hard_delete_product(supabase, product_uuid):
    """Hard delete a product row from the database."""
    try:
        supabase.table("products").delete().eq("id", product_uuid).execute()
    except Exception as e:
        logger.error("Failed to hard delete product %s: %s", product_uuid, e)


def _collect_image_keys(product, stats):
    """Collect R2 image keys from a product for later batch deletion."""
    image_url = product.get("image_url") or ""
    additional = product.get("additional_images") or []

    for url in [image_url] + list(additional):
        if url and "r2.dev/" in url:
            key = url.split("r2.dev/", 1)[-1]
            if key:
                stats["images_to_delete_keys"].append(key)


# ---------------------------------------------------------------------------
# Sync Logging
# ---------------------------------------------------------------------------

def create_sync_log(supabase, started_at):
    """
    Insert a new sync_log entry with status 'running'.

    Returns:
        The sync_log UUID, or None on failure.
    """
    try:
        result = (
            supabase.table("sync_logs")
            .insert({
                "started_at": started_at,
                "status": "running",
            })
            .execute()
        )
        if result.data:
            log_id = result.data[0]["id"]
            logger.info("Created sync_log: %s", log_id)
            return log_id
    except Exception as e:
        logger.error("Failed to create sync_log: %s", e)
    return None


def complete_sync_log(supabase, log_id, stats):
    """
    Update the sync_log with final stats and status.

    Args:
        supabase: Supabase client.
        log_id: UUID of the sync_log row.
        stats: Dict with status, completed_at, products_added, products_updated,
               products_deactivated, products_deleted, images_deleted,
               categories_found, error_message.
    """
    if not log_id:
        return

    try:
        supabase.table("sync_logs").update(stats).eq("id", log_id).execute()
        logger.info(
            "Sync log updated: status=%s, added=%d, updated=%d, deleted=%d",
            stats.get("status"),
            stats.get("products_added", 0),
            stats.get("products_updated", 0),
            stats.get("products_deleted", 0),
        )
    except Exception as e:
        logger.error("Failed to update sync_log %s: %s", log_id, e)
