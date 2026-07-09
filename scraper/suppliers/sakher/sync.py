"""
Sakher Scraper — Main Orchestrator
Runs the complete sync workflow for sakherbrands.com: login → categories → brands → products → images → DB → cleanup.
Specializes in syncing clothing colors and sizes per color.
"""

import logging
import sys
import time
import random
from datetime import datetime, timezone
from pathlib import Path

scraper_root = Path(__file__).resolve().parent.parent.parent
if str(scraper_root) not in sys.path:
    sys.path.insert(0, str(scraper_root))

from scraper.suppliers.sakher.config import load_config
from scraper.suppliers.sakher.extractor import extract_product_details
from scraper.extractor import (
    extract_categories,
    extract_brands,
    extract_products_for_category,
)
from scraper.auth import create_authenticated_session
from scraper.image_pipeline import (
    create_r2_client,
    delete_from_r2,
    process_product_images,
)
from scraper.db import (
    create_supabase_client,
    upsert_categories,
    upsert_brands,
    get_existing_products,
    upsert_product,
    diff_product,
    reconcile_products,
    create_sync_log,
    complete_sync_log,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("sakher.sync")

PRODUCT_MAX_RETRIES = 3
PRODUCT_RETRY_BACKOFF = 3


def _quick_diff_listing(existing, scraped_product):
    if not existing:
        return True
    if float(existing.get("wholesale_price", 0)) != float(scraped_product.get("wholesale_price", 0)):
        return True
    if existing.get("name") != scraped_product.get("name"):
        return True
    if existing.get("supplier_image_url") != scraped_product.get("supplier_image_url"):
        return True
    return False


def main():
    started_at = datetime.now(timezone.utc).isoformat()
    logger.info("=" * 60)
    logger.info("Sakher Brands — Product Sync Starting")
    logger.info("=" * 60)

    config = load_config()
    logger.info("[OK] Configuration loaded for Sakher (%s)", config["SUPPLIER_BASE_URL"])

    supabase = create_supabase_client(config)
    r2_client = create_r2_client(config)
    logger.info("[OK] Supabase and R2 clients initialized")

    sync_log_id = create_sync_log(supabase, started_at)

    stats = {
        "products_added": 0,
        "products_updated": 0,
        "products_deactivated": 0,
        "products_deleted": 0,
        "images_deleted": 0,
        "categories_found": 0,
        "error_message": None,
    }

    try:
        logger.info("Authenticating with Sakher Brands...")
        session = create_authenticated_session(config)
        logger.info("[OK] Authenticated successfully")

        logger.info("Discovering categories...")
        categories = extract_categories(session, config)
        stats["categories_found"] = len(categories)

        category_id_map = upsert_categories(supabase, categories)
        logger.info("[OK] %d categories synced", len(category_id_map))

        logger.info("Discovering brands...")
        brands = extract_brands(session, config)
        brand_id_map = upsert_brands(supabase, brands)
        logger.info("[OK] %d brands synced", len(brand_id_map))

        supplier_code = config.get("SUPPLIER_CODE", "sakher")
        existing_products = get_existing_products(supabase, supplier_code)

        all_scraped_ids = set()
        scrape_details = config.get("SCRAPE_PRODUCT_DETAILS", True)
        failed_products = []
        skipped_unchanged = 0

        for cat in categories:
            cat_id = cat["supplier_id"]
            cat_name = cat["name"]

            try:
                logger.info("─" * 40)
                logger.info("Processing category: %s (id=%s)", cat_name, cat_id)

                products = extract_products_for_category(session, config, cat)
                logger.info("Extracted %d products from category %s", len(products), cat_name)

                for product in products:
                    sid = product["supplier_id"]
                    all_scraped_ids.add(sid)
                    product["category_supplier_id"] = cat_id
                    product["supplier_code"] = supplier_code

                    processed = False
                    for attempt in range(1, PRODUCT_MAX_RETRIES + 1):
                        try:
                            existing = existing_products.get(sid)
                            needs_detail = _quick_diff_listing(existing, product)

                            if scrape_details and needs_detail:
                                details = extract_product_details(session, config, sid, product=product)
                                product["description"] = details.get("description")
                                product["quantity"] = details.get("quantity")
                                product["color_variants"] = details.get("color_variants", [])
                                if details.get("brand_supplier_id"):
                                    product["brand_supplier_id"] = details["brand_supplier_id"]
                            elif scrape_details and not needs_detail:
                                logger.debug("Product %s unchanged at listing level — skipping detail page", sid)
                                skipped_unchanged += 1
                                processed = True
                                break

                            if not diff_product(existing, product):
                                logger.debug("Product %s unchanged after full diff — skipping", sid)
                                skipped_unchanged += 1
                                processed = True
                                break

                            existing_image_url = existing.get("image_url") if existing else None
                            main_img, additional_imgs, r2_color_variants = process_product_images(
                                session, r2_client, config, product,
                                existing_image_url=existing_image_url,
                            )

                            product["r2_image_url"] = main_img
                            product["r2_additional_images"] = additional_imgs
                            product["r2_color_variants"] = r2_color_variants

                            action, product_id = upsert_product(
                                supabase, product, category_id_map, brand_id_map
                            )

                            if action == "upserted":
                                if existing:
                                    stats["products_updated"] += 1
                                else:
                                    stats["products_added"] += 1

                            processed = True
                            break

                        except Exception as e:
                            if attempt < PRODUCT_MAX_RETRIES:
                                wait = PRODUCT_RETRY_BACKOFF ** attempt + random.uniform(0, 1)
                                logger.warning("[Product Retry %d/%d] Product %s failed: %s — retrying in %.1fs", attempt, PRODUCT_MAX_RETRIES, sid, e, wait)
                                time.sleep(wait)
                            else:
                                logger.error("[PRODUCT FAILED] Product %s failed after %d attempts: %s", sid, PRODUCT_MAX_RETRIES, e)
                                failed_products.append({
                                    "supplier_id": sid,
                                    "name": product.get("name", "unknown"),
                                    "error": str(e)[:200],
                                })

                    if not processed:
                        logger.error("Product %s permanently failed — will NOT be skipped silently", sid)

            except Exception as e:
                logger.error("Error processing category %s: %s", cat_name, e)
                continue

        logger.info("─" * 40)
        logger.info("Performance: Skipped %d unchanged products", skipped_unchanged)
        if failed_products:
            logger.warning("[WARNING] %d products failed after %d retries each:", len(failed_products), PRODUCT_MAX_RETRIES)
            for fp in failed_products:
                logger.warning("  - %s (%s): %s", fp["supplier_id"], fp["name"], fp["error"])

        logger.info("─" * 40)
        logger.info("Reconciling products (cleanup)...")
        cleanup_stats = reconcile_products(
            supabase, all_scraped_ids, existing_products, config
        )

        stats["products_deleted"] = cleanup_stats["products_deleted"]
        stats["products_deactivated"] = cleanup_stats["deactivated"]

        keys_to_delete = cleanup_stats["images_to_delete_keys"]
        if keys_to_delete:
            deleted_count = delete_from_r2(
                r2_client, config["R2_BUCKET"], keys_to_delete
            )
            stats["images_deleted"] = deleted_count

        if failed_products:
            stats["error_message"] = (
                f"{len(failed_products)} products failed after {PRODUCT_MAX_RETRIES} retries: "
                + ", ".join(fp["supplier_id"] for fp in failed_products[:20])
            )[:500]

        stats["status"] = "success"
        stats["completed_at"] = datetime.now(timezone.utc).isoformat()
        complete_sync_log(supabase, sync_log_id, stats)

        logger.info("=" * 60)
        logger.info("[OK] SAKHER BRANDS SYNC COMPLETE")
        logger.info("   Categories found:     %d", stats["categories_found"])
        logger.info("   Brands found:         %d", len(brand_id_map))
        logger.info("   Products added:       %d", stats["products_added"])
        logger.info("   Products updated:     %d", stats["products_updated"])
        logger.info("   Products skipped:     %d (unchanged)", skipped_unchanged)
        logger.info("   Products failed:      %d (after %d retries)", len(failed_products), PRODUCT_MAX_RETRIES)
        logger.info("   Products deleted:     %d", stats["products_deleted"])
        logger.info("   Products deactivated: %d", stats["products_deactivated"])
        logger.info("   Images deleted:       %d", stats["images_deleted"])
        logger.info("=" * 60)

    except Exception as e:
        logger.error("[ERROR] SAKHER BRANDS SYNC FAILED: %s", e, exc_info=True)
        stats["status"] = "failed"
        stats["completed_at"] = datetime.now(timezone.utc).isoformat()
        stats["error_message"] = str(e)[:500]
        complete_sync_log(supabase, sync_log_id, stats)
        sys.exit(1)


if __name__ == "__main__":
    main()
