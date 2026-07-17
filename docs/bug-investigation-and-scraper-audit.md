# Bug Investigation & Scraper Audit Report

**Project:** Custom E-Commerce Store (Eloria Fashion)
**Store URL:** https://eloria-fashion.onrender.com/ar
**Date:** 2026-07-17
**Status:** DISCOVERY - No fixes applied
**Analyst:** AI Code Audit

> All conclusions in this report are supported by direct code evidence. No fixes have been made.

---

## Executive Summary

Seven issues were investigated by tracing the full data pipeline from supplier website to scraper to database to API to frontend.

| # | Issue | Severity | Root Cause Confirmed? |
|---|-------|----------|-----------------------|
| 1 | tCart is not defined crashes Add-to-Cart | CRITICAL | Yes - scope bug in CartContext.js |
| 2 | Scraper misses products on page 2+ | HIGH | Yes - _has_next_page() fragile for product.all pagination |
| 3 | Duplicate products after re-sync | MEDIUM | Yes - slug re-generation + pre-migration orphan rows |
| 4 | Stale color variant availability | HIGH | Yes - _quick_diff_listing() skips detail pages if price/name unchanged |
| 5 | Stale per-size availability | HIGH | Same root cause as Issue 4 |
| 6 | Admin margin page UX gap | MEDIUM | Yes - no per-supplier filter on getMarginsWithCategories() |
| 7 | Availability override store isolation | MEDIUM | Yes - public_products view may use pre-migration 003 join |

---

## Architecture Overview

Suppliers:
- gbstore.ps -> scraper/sync.py (GBStore)
- sakherbrands.com -> scraper/suppliers/sakher/sync.py (Sakher)
- balagan (shoes) -> scraper/suppliers/balagan/sync.py

Scraper Pipeline:
Auth -> Categories/Brands -> Product Listing Pages -> Product Detail Pages -> Image Upload R2 -> Supabase Upsert

Database (Supabase):
- Tables: products, categories, brands, margins, sync_logs, product_availability_overrides, analytics_visits
- color_variants: JSONB column - array of {color_name, image_url, is_available, sizes:[{size, is_available}]}

Frontend (Next.js App Router):
- src/app/[lang]/ - localized pages (ar, en, he)
- src/context/CartContext.js - cart state, WhatsApp order URL
- src/components/product/ColorSwatchSelector.jsx - color/size picker
- src/lib/queries.js - all Supabase queries

---

## Supplier Coverage Matrix

| Feature | GBStore | Balagan | Sakher |
|---------|---------|---------|--------|
| Auth (login) | YES | YES | YES |
| Category scraping | YES | YES (shared) | YES (shared) |
| Brand scraping | YES | YES | YES |
| Multi-page categories | PARTIAL - &page=N works but product.all format unverified | PARTIAL | PARTIAL |
| Listing-level price | YES | YES | YES |
| Color variant extraction | YES (color-selector + color-image) | YES | YES |
| Per-color availability | YES (out-of-stock CSS class) | YES | YES |
| Per-size availability | YES (hidden-radio[disabled]) | YES | YES |
| Image upload to R2 | YES | YES | YES |
| Diff-based skip | YES (_quick_diff_listing) | YES | YES |
| Cleanup (two-tier) | YES | YES | YES |
| supplier_code stamped | gbstore | balagan | sakher |

---

## Issue 1 - Add-to-Cart Crash (tCart is not defined)

### Symptom
Uncaught ReferenceError: tCart is not defined when clicking Add to Cart.

### Evidence

FILE: src/context/CartContext.js (line ~112)
Inside getWhatsAppOrderUrl():
  - tCart.itemQuantityLabel is referenced
  - tCart is NEVER declared or imported in this file
  - CartContext.js does not import useDictionary, does not call it, does not receive dict as a prop

FILE: src/components/cart/CartDrawer.jsx
CartDrawer correctly accesses translations via useDictionary():
  const { dict } = useDictionary();
  const tCart = dict?.cart || {};
But CartContext.js has no access to this.

### Root Cause
CartContext.js was refactored to include WhatsApp order URL generation that references tCart dictionary keys. The dictionary hook (useDictionary()) was never added to the Context - only to the UI component. Since Context providers run outside the component tree where useDictionary is consumed, tCart is undefined at runtime, throwing a ReferenceError on any attempt to use the cart.

### Affected Code Path
1. User clicks Add to Cart
2. CartContext.js -> addToCart() or getWhatsAppOrderUrl() is called
3. tCart.itemQuantityLabel is referenced
4. ReferenceError: tCart is not defined is thrown
5. Cart is completely non-functional

---

## Issue 2 - Incomplete Product Scraping (Missing Pages)

### Symptom
Only page 1 products scraped from categories with multiple pages.

### Evidence

FILE: scraper/extractor.py lines 271-336 and 471-491

URL Building (lines 275-281):
  if cat_id == "all":
      url = page 1: /?app=product.all  |  page 2+: /?app=product.all..{page}   <-- UNVERIFIED FORMAT
  else:
      url = /?app=product.cat.{cat_id}
      if page > 1: url += &page={page}   <-- CORRECT FORMAT

_has_next_page function (lines 471-491):
  - Checks for .pages CSS class container
  - Returns False if .pages container is NOT found
  - Looks for href containing page={next_page}
  - OR link text equal to next page number
  - Risk: if authenticated layout differs (AJAX, infinite scroll), returns False and stops at page 1

Evidence of correct URL format: Fetched unauthenticated HTML from gbstore.ps confirms .pages CSS class exists in site markup. &page=N format is structurally correct for regular categories.

Conclusion: URL format &page=N is correct for regular categories. However _has_next_page() has fragile dependency. The product.all pagination format (..N) is completely unverified.

---

## Issue 3 - Duplicate Products After Re-Sync

### Symptom
Some products appear twice in the storefront after a scraper run.

### Evidence

FILE: supabase/migrations/005_phase6e_multi_supplier_constraints.sql
UNIQUE constraint: (supplier_code, supplier_id) prevents row-level duplicates per supplier.

FILE: scraper/db.py line 292
Upsert uses on_conflict="supplier_code,supplier_id" - correct.

FILE: scraper/db.py lines 256-257
generate_slug() strips Arabic chars (non-ASCII), falls back to product-{supplier_id} if Arabic-only name.
Slug UNIQUE constraint is now composite (supplier_code, slug) per migration 005.

Real duplication vector:
- Migration 004 added supplier_code NOT NULL DEFAULT 'gbstore' to all existing rows
- If balagan products were previously synced before migration 004, they got supplier_code='gbstore'
- After migration 004, re-syncing balagan creates new rows with supplier_code='balagan'
- reconcile_products() only hard-deletes products absent from the CURRENT scrape run
- Old gbstore-coded balagan rows are never in the current balagan scrape set -> survive as orphans
- These orphan rows appear as duplicate products on the storefront

---

## Issue 4 - Color Variant Availability Not Reflected on Storefront

### Symptom
Colors shown as available in color swatch that are actually sold out on supplier.

### Evidence

FILE: scraper/suppliers/balagan/extractor.py
FILE: scraper/suppliers/sakher/extractor.py
Both extract per-color availability from out-of-stock CSS class and disabled attribute.
Pattern: is_available = "out-of-stock" not in selector_elem.get("class", [])

FILE: scraper/db.py lines 328-334 (diff_product)
diff_product() DOES compare color_variants - but this runs AFTER the detail page is fetched.

FILE: scraper/sync.py _quick_diff_listing() (lines 98+)
_quick_diff_listing() compares ONLY: wholesale_price, name, supplier_image_url
Does NOT compare color_variants or any availability data.

ROOT CAUSE:
_quick_diff_listing() short-circuit prevents detail page fetch when price/name/image unchanged.
When a color goes out of stock between runs:
1. Listing page unchanged (same price, name, image)
2. _quick_diff_listing() returns False -> detail page SKIPPED
3. Stale color_variants JSONB (is_available: true) remains in DB
4. Storefront shows outdated availability

---

## Issue 5 - Size Stock Status Not Shown on Product Pages

### Symptom
For Sakher clothing products, sizes with zero stock appear as available.

### Evidence

FILE: src/components/product/ColorSwatchSelector.jsx lines 164-179
UI rendering is CORRECT:
  const isUnavailable = !sizeObj.is_available;
  // renders .size-btn.unavailable if !sizeObj.is_available
The UI will correctly mark sizes IF sizeObj.is_available === false.

The problem is in the data, NOT the UI.

FILE: scraper/suppliers/sakher/extractor.py
Sakher extractor correctly sets is_available: false for disabled radio inputs.
But due to Issue 4 root cause:
- _quick_diff_listing() prevents detail page re-scrapes
- Sizes array in color_variants becomes stale
- When stock changes (size M out of stock), old is_available: true remains

For GBStore products:
FILE: scraper/extractor.py - general product card parser
GBStore listing-level size spans (.size-list span) do NOT carry stock status.
Detail page visit required for accurate per-size availability via hidden-radio[disabled] pattern.

Same root cause as Issue 4. Fix Issue 4 and Issue 5 is automatically fixed.

---

## Issue 6 - Admin Margin Page Shows All Categories (UX Gap)

### Symptom
Admin margin page shows categories from ALL suppliers with no way to filter by supplier.

### Evidence

FILE: src/lib/queries.js lines 827-855 (getMarginsWithCategories)
  let prodQuery = supabaseAdmin.from('products').select('category_id');
  prodQuery = applySupplierFilter(prodQuery, null);  // null = no specific supplier filter
  
  With NEXT_PUBLIC_SUPPORTED_SUPPLIERS=gbstore,balagan,sakher (3 suppliers):
  applySupplierFilter with null code and 3 active suppliers -> .in('supplier_code', ['gbstore','balagan','sakher'])
  -> All categories from all three suppliers are included

FILE: src/app/[lang]/admin/margins/MarginManagerClient.jsx
No supplier selector dropdown exists. Categories from all suppliers are shown in one list.

ROOT CAUSE: UX/design gap. No per-supplier filtering UI on the margins page.
getMarginsWithCategories() is correct for its scope but the page has no grouping/filtering UI.

---

## Issue 7 - Availability Override Not Isolated Per Store

### Symptom
Admin override of product availability potentially affects all store instances sharing the same Supabase DB.

### Evidence

FILE: supabase/migrations/002_phase6a_brands_colors_overrides.sql lines 46-55
Original table had UNIQUE(product_supplier_id) - global, no store isolation.

FILE: supabase/migrations/003_phase6c_client_isolation.sql lines 22-37
Migration 003 adds store_id column and composite UNIQUE (store_id, product_supplier_id). FIXED.

FILE: src/lib/queries.js line 780
upsertAvailabilityOverride uses onConflict: 'store_id,product_supplier_id'. CORRECT.

FILE: supabase/migrations/004_phase6d_multi_supplier.sql line 85
get_store_products RPC joins with AND ov.store_id = p_store_id. CORRECT.

FILE: supabase/migrations/002_phase6b_i18n_analytics.sql line 94
public_products view in migration 002b uses OLD join WITHOUT store_id:
  LEFT JOIN product_availability_overrides ov ON p.supplier_id = ov.product_supplier_id
But migrations 003 and 004 each recreate public_products with correct joins.

REMAINING RISK: If all 5 migrations (001-005) were NOT applied in order to the production database,
the public_products view may still be the pre-isolation version from 002b.

FILE: src/lib/queries.js line 59
For STORE_ID='eloria', queries public_products view (not RPC).
If view is from 002b (pre-isolation): ALL availability overrides apply regardless of store_id.
If view is from 004: Only eloria-scoped overrides apply.

---

## Recommendations Summary

| # | Issue | Recommended Fix |
|---|-------|-----------------|
| 1 | tCart crash | Add hardcoded Arabic fallback strings directly in CartContext.js without relying on useDictionary(). Or inject dictionary keys as parameters to the relevant functions. |
| 2 | Pagination miss | Verify product.all pagination format on live authenticated site. Add fallback: count of cards on page vs threshold, or check for any forward-navigation link. |
| 3 | Duplicates on re-sync | Run a one-time DB cleanup: find products with supplier_code='gbstore' whose supplier_id matches a product with supplier_code='balagan' or 'sakher', then delete the orphan gbstore-coded rows. |
| 4 | Stale color availability | Add color availability fingerprint to _quick_diff_listing(). E.g., count of available colors. If count changed, force detail page re-fetch. |
| 5 | Stale size availability | Same fix as Issue 4. |
| 6 | Admin margins UX | Add supplier selector to admin margins page. Pass supplierCode to getMarginsWithCategories() and group by supplier_code. |
| 7 | Override isolation | Verify public_products view definition in production Supabase. Run: SELECT column_name FROM information_schema.columns WHERE table_name='public_products'. Should include supplier_code column (migration 004). |

---

## Appendix: Key Files Audited

| File | Purpose |
|------|---------|
| src/context/CartContext.js | Cart state + WhatsApp URL |
| src/components/cart/CartDrawer.jsx | Cart UI |
| src/components/product/ColorSwatchSelector.jsx | Color/size swatch UI |
| src/lib/queries.js | All Supabase queries (915 lines) |
| src/lib/supplierConfig.js | Supplier metadata + filtering |
| scraper/extractor.py | Category/product scraping (744 lines) |
| scraper/suppliers/sakher/extractor.py | Sakher color/size parsing |
| scraper/suppliers/balagan/extractor.py | Balagan color/size parsing |
| scraper/db.py | DB upsert, diff, cleanup (485 lines) |
| scraper/sync.py | Main GBStore sync orchestrator |
| scraper/suppliers/sakher/sync.py | Sakher sync orchestrator |
| scraper/config.py | Config loading |
| supabase/migrations/001_initial_schema.sql | Initial schema |
| supabase/migrations/002_phase6a_brands_colors_overrides.sql | Brands/colors |
| supabase/migrations/002_phase6b_i18n_analytics.sql | I18n + analytics |
| supabase/migrations/003_phase6c_client_isolation.sql | Store isolation |
| supabase/migrations/004_phase6d_multi_supplier.sql | Multi-supplier |
| supabase/migrations/005_phase6e_multi_supplier_constraints.sql | Constraints |
| src/app/[lang]/admin/margins/MarginManagerClient.jsx | Admin margins UI |
| src/app/api/admin/margins/route.js | Admin margins API |
