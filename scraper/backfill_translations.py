"""
Standalone Backfill Script for Product, Category, and Brand Translations

Fetches existing categories, brands, and products from Supabase where `name_en` or `name_he`
is missing (`NULL`), translates them using `scraper.translator.translate_entity`, and updates
the records in Supabase.

Usage:
    python -m scraper.backfill_translations
    python -m scraper.backfill_translations --batch-size 50
"""

import argparse
import logging
import sys
from scraper.config import load_config
from scraper.db import create_supabase_client
from scraper.translator import translate_entity

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scraper.backfill_translations")


def backfill_categories(supabase) -> int:
    """Scan and backfill missing translations for categories."""
    logger.info("Scanning `categories` table for missing translations...")
    try:
        # Fetch all categories
        res = supabase.table("categories").select("*").execute()
        categories = res.data or []
    except Exception as e:
        logger.error("Failed to fetch categories: %s", e)
        return 0

    updated_count = 0
    for cat in categories:
        if not cat.get("name_en") or not cat.get("name_he"):
            logger.info("Translating category [%s]: '%s'", cat.get("slug", cat["id"]), cat.get("name"))
            updated_cat = translate_entity(cat.copy(), name_key="name", desc_key=None)
            updates = {}
            if updated_cat.get("name_en") and not cat.get("name_en"):
                updates["name_en"] = updated_cat["name_en"]
            if updated_cat.get("name_he") and not cat.get("name_he"):
                updates["name_he"] = updated_cat["name_he"]

            if updates:
                try:
                    supabase.table("categories").update(updates).eq("id", cat["id"]).execute()
                    updated_count += 1
                    logger.info(" -> Updated category [%s]: %s", cat["id"], updates)
                except Exception as e:
                    logger.error("Failed to update category [%s]: %s", cat["id"], e)

    logger.info("Category backfill complete. Updated %d categories.", updated_count)
    return updated_count


def backfill_brands(supabase) -> int:
    """Scan and backfill missing translations for brands."""
    logger.info("Scanning `brands` table for missing translations...")
    try:
        res = supabase.table("brands").select("*").execute()
        brands = res.data or []
    except Exception as e:
        logger.error("Failed to fetch brands: %s", e)
        return 0

    updated_count = 0
    for brand in brands:
        if not brand.get("name_en") or not brand.get("name_he"):
            logger.info("Translating brand [%s]: '%s'", brand.get("slug", brand["id"]), brand.get("name"))
            updated_brand = translate_entity(brand.copy(), name_key="name", desc_key=None)
            updates = {}
            if updated_brand.get("name_en") and not brand.get("name_en"):
                updates["name_en"] = updated_brand["name_en"]
            if updated_brand.get("name_he") and not brand.get("name_he"):
                updates["name_he"] = updated_brand["name_he"]

            if updates:
                try:
                    supabase.table("brands").update(updates).eq("id", brand["id"]).execute()
                    updated_count += 1
                    logger.info(" -> Updated brand [%s]: %s", brand["id"], updates)
                except Exception as e:
                    logger.error("Failed to update brand [%s]: %s", brand["id"], e)

    logger.info("Brand backfill complete. Updated %d brands.", updated_count)
    return updated_count


def backfill_products(supabase, batch_size: int = 100) -> int:
    """Scan and backfill missing translations for products in paginated batches."""
    logger.info("Scanning `products` table for missing translations (batch_size=%d)...", batch_size)
    offset = 0
    updated_count = 0

    while True:
        try:
            # Fetch batch of products
            res = (
                supabase.table("products")
                .select("id, name, description, name_en, name_he, description_en, description_he")
                .range(offset, offset + batch_size - 1)
                .execute()
            )
            products = res.data or []
            if not products:
                break
        except Exception as e:
            logger.error("Failed to fetch products at offset %d: %s", offset, e)
            break

        logger.info("Processing product batch [%d to %d] (%d items)...", offset, offset + len(products), len(products))

        for prod in products:
            needs_trans = (
                not prod.get("name_en")
                or not prod.get("name_he")
                or (prod.get("description") and (not prod.get("description_en") or not prod.get("description_he")))
            )
            if needs_trans:
                updated_prod = translate_entity(prod.copy(), name_key="name", desc_key="description")
                updates = {}
                if updated_prod.get("name_en") and not prod.get("name_en"):
                    updates["name_en"] = updated_prod["name_en"]
                if updated_prod.get("name_he") and not prod.get("name_he"):
                    updates["name_he"] = updated_prod["name_he"]
                if prod.get("description"):
                    if updated_prod.get("description_en") and not prod.get("description_en"):
                        updates["description_en"] = updated_prod["description_en"]
                    if updated_prod.get("description_he") and not prod.get("description_he"):
                        updates["description_he"] = updated_prod["description_he"]

                if updates:
                    try:
                        supabase.table("products").update(updates).eq("id", prod["id"]).execute()
                        updated_count += 1
                        logger.debug(" -> Updated product [%s]", prod["id"])
                    except Exception as e:
                        logger.error("Failed to update product [%s]: %s", prod["id"], e)

        if len(products) < batch_size:
            break
        offset += batch_size

    logger.info("Product backfill complete. Updated %d products.", updated_count)
    return updated_count


def main():
    parser = argparse.ArgumentParser(description="Backfill missing translations in Supabase database.")
    parser.add_argument("--batch-size", type=int, default=100, help="Batch size for product queries")
    args = parser.parse_args()

    config = load_config()
    if not config.get("SUPABASE_URL") or not config.get("SUPABASE_SERVICE_KEY"):
        logger.error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing from environment configuration.")
        sys.exit(1)

    supabase = create_supabase_client(config)

    logger.info("=== Starting Translations Backfill ===")
    cat_count = backfill_categories(supabase)
    brand_count = backfill_brands(supabase)
    prod_count = backfill_products(supabase, batch_size=args.batch_size)
    logger.info("=== Backfill Complete ===")
    logger.info("Summary: %d categories, %d brands, %d products updated.", cat_count, brand_count, prod_count)


if __name__ == "__main__":
    main()
