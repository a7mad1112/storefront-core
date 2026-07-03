"""
GB Store Scraper — Main Orchestrator
Runs the complete sync workflow: login → categories → products → images → DB → cleanup.
"""

import logging
import sys
from datetime import datetime, timezone

from config import load_config
from auth import create_authenticated_session
from extractor import extract_categories, extract_products_for_category
from image_pipeline import (
    create_r2_client,
    delete_from_r2,
    process_product_images,
)
from db import (
    create_supabase_client,
    upsert_categories,
    get_existing_products,
    upsert_product,
    diff_product,
    reconcile_products,
    create_sync_log,
    complete_sync_log,
)

# ---------------------------------------------------------------------------
# Logging Setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("sync")


def main():
    """
    Main entry point for the product sync workflow.
    """
    started_at = datetime.now(timezone.utc).isoformat()
    logger.info("=" * 60)
    logger.info("GB Store — Product Sync Starting")
    logger.info("=" * 60)

    # --- 1. Load configuration ---
    config = load_config()
    logger.info("[OK] Configuration loaded")

    # --- 2. Initialize clients ---
    supabase = create_supabase_client(config)
    r2_client = create_r2_client(config)
    logger.info("[OK] Supabase and R2 clients initialized")

    # --- 3. Create sync log ---
    sync_log_id = create_sync_log(supabase, started_at)

    # Stats tracking
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
        # --- 4. Authenticate with supplier ---
        logger.info("Authenticating with supplier...")
        session = create_authenticated_session(config)
        logger.info("[OK] Authenticated successfully")

        # --- 5. Discover and upsert categories ---
        logger.info("Discovering categories...")
        categories = extract_categories(session, config)
        stats["categories_found"] = len(categories)

        category_id_map = upsert_categories(supabase, categories)
        logger.info("[OK] %d categories synced", len(category_id_map))

        # --- 6. Get existing products for diff ---
        existing_products = get_existing_products(supabase)

        # --- 7. Scrape and sync products ---
        all_scraped_ids = set()

        for cat in categories:
            cat_id = cat["supplier_id"]
            cat_name = cat["name"]

            try:
                logger.info("─" * 40)
                logger.info("Processing category: %s (id=%s)", cat_name, cat_id)

                products = extract_products_for_category(session, config, cat)
                logger.info(
                    "Extracted %d products from category %s",
                    len(products), cat_name,
                )

                for product in products:
                    try:
                        sid = product["supplier_id"]
                        all_scraped_ids.add(sid)

                        existing = existing_products.get(sid)

                        # Check if product needs update
                        if not diff_product(existing, product):
                            logger.debug("Product %s unchanged — skipping", sid)
                            continue

                        # Process images (skip if unchanged)
                        existing_image_url = existing.get("image_url") if existing else None
                        main_img, additional_imgs = process_product_images(
                            session, r2_client, config, product,
                            existing_image_url=existing_image_url,
                        )

                        product["r2_image_url"] = main_img
                        product["r2_additional_images"] = additional_imgs

                        # Upsert to database
                        action, product_id = upsert_product(
                            supabase, product, category_id_map
                        )

                        if action == "upserted":
                            if existing:
                                stats["products_updated"] += 1
                            else:
                                stats["products_added"] += 1

                    except Exception as e:
                        logger.error(
                            "Error processing product %s: %s",
                            product.get("supplier_id", "unknown"), e,
                        )
                        continue

            except Exception as e:
                logger.error(
                    "Error processing category %s: %s", cat_name, e
                )
                continue

        # --- 8. Reconcile — two-tier cleanup ---
        logger.info("─" * 40)
        logger.info("Reconciling products (cleanup)...")
        cleanup_stats = reconcile_products(
            supabase, all_scraped_ids, existing_products, config
        )

        stats["products_deleted"] = cleanup_stats["products_deleted"]
        stats["products_deactivated"] = cleanup_stats["deactivated"]

        # Delete orphaned R2 images
        keys_to_delete = cleanup_stats["images_to_delete_keys"]
        if keys_to_delete:
            deleted_count = delete_from_r2(
                r2_client, config["R2_BUCKET"], keys_to_delete
            )
            stats["images_deleted"] = deleted_count

        # --- 9. Finalize sync log ---
        stats["status"] = "success"
        stats["completed_at"] = datetime.now(timezone.utc).isoformat()
        complete_sync_log(supabase, sync_log_id, stats)

        logger.info("=" * 60)
        logger.info("[OK] SYNC COMPLETE")
        logger.info("   Categories found:   %d", stats["categories_found"])
        logger.info("   Products added:     %d", stats["products_added"])
        logger.info("   Products updated:   %d", stats["products_updated"])
        logger.info("   Products deleted:   %d", stats["products_deleted"])
        logger.info("   Products deactivated: %d", stats["products_deactivated"])
        logger.info("   Images deleted:     %d", stats["images_deleted"])
        logger.info("=" * 60)

    except Exception as e:
        logger.error("[ERROR] SYNC FAILED: %s", e, exc_info=True)
        stats["status"] = "failed"
        stats["completed_at"] = datetime.now(timezone.utc).isoformat()
        stats["error_message"] = str(e)[:500]
        complete_sync_log(supabase, sync_log_id, stats)
        sys.exit(1)


if __name__ == "__main__":
    main()
