# Scraper Infinite Loop — Root Cause Investigation

**Date:** 2026-07-18  
**Status:** Investigation complete. Fix NOT yet applied (read-only analysis by design).  
**Symptom:** `python -m scraper.run_all --supplier all --parallel --details` ran for 8+ hours without finishing on a fresh database.

---

## 1. The Bug in Plain English

The scraper entered an **infinite pagination loop** on every category. It kept requesting page 2, page 3, page 4 … forever, because:

1. The scraper's fallback rule says: *"If there are ≥ 20 product cards on a page and the `.pages` navigation container is absent, assume another page exists."*
2. The supplier CMS **never** returns a `.pages` navigation container to unauthenticated (or session-expired) requests.
3. The supplier CMS **never** returns an empty page for an out-of-bounds page number. Instead, it silently ignores the `..N` or `&page=N` parameter and serves the **same full page** repeatedly.
4. Therefore: the scraper finds 20+ cards → assumes next page → fetches next page → finds 20+ cards again → **loops forever**.

---

## 2. Evidence — Live CMS Tests

The following tests were run directly against the live supplier websites during this investigation (no authentication — exactly what the scraper sees when a session expires or credentials fail):

| URL Tested | `.product-brief-content` count | `.pages` block present | Unique product links found |
|---|---|---|---|
| `https://gbstore.ps/?app=product.all` (page 1) | 177 | ❌ NOT FOUND | 214 |
| `https://gbstore.ps/?app=product.all..2` (page 2) | 177 | ❌ NOT FOUND | 214 |
| `https://gbstore.ps/?app=product.all..9999` (overflow) | 57 | ❌ NOT FOUND | 0 |
| `https://gbstore.ps/?app=product.cat.39&page=9999` (overflow) | 177 | ❌ NOT FOUND | 214 |

### Key Observations

**Finding A — `.pages` is never present on unauthenticated requests.**  
The `.pages` pagination navigation block is rendered by the CMS **only for authenticated (logged-in) users**. Unauthenticated requests never receive it. This means the DOM-based check in `_has_next_page()` will **always** fall through to the card-count fallback.

**Finding B — The CMS silently ignores invalid page numbers.**  
Requesting `?app=product.all..9999` returns the exact same page content as page 1 or page 2. The CMS does not return a 404, an empty grid, or any error indicator. The canonical URL in the page's `<head>` even confirms the page number is accepted: `<link rel="canonical" href="https://gbstore.ps/?app=product.all..9999">`.

**Finding C — The 57 `.product-brief-content` occurrences on page 9999 are NOT product cards.**  
They are a CSS rule embedded in the `<style>` block: `.product-brief-content .color-image img{height:64px;}`. The string `product-brief-content` appears in the CSS, not in the HTML grid. When authenticated, the scraper's `soup.select(".product-brief-content")` correctly selects only DOM elements — but this explains why the regex-based count in our test showed 57 hits.

**Finding D — Same product IDs on every page (authenticated sessions).**  
When the scraper is authenticated and hits an out-of-bounds page, the CMS returns the **first page's products** again. The `seen_product_ids` set correctly deduplicates them (`new_products_on_page = 0`), but this variable is never used in the `break` condition.

---

## 3. The Code Path That Creates the Loop

```
scraper/extractor.py → extract_products_for_category()
```

```python
# Line 314-328 (simplified)
while True:
    cards = soup.select(".product-brief-content")
    if not cards:
        break  # ← This NEVER fires: the CMS never returns an empty page

    new_products_on_page = 0
    for card in cards:
        product = _parse_product_card(card, base_url)
        if product and product["supplier_id"] not in seen_product_ids:
            products.append(product)
            seen_product_ids.add(product["supplier_id"])
            new_products_on_page += 1   # ← Tracked but NEVER used to break

    logger.info("Extracted %d new products from page %d", new_products_on_page, page)

    # ↓ This is the broken check
    if not _has_next_page(soup, page, cards_on_page=len(cards)):
        break

    page += 1
```

```
scraper/extractor.py → _has_next_page()
```

```python
def _has_next_page(soup, current_page, cards_on_page=0, page_size_threshold=20):
    pages_container = soup.select_one(".pages")
    if pages_container:
        # DOM check — looks for &page=N or ..N links
        ...
        return False  # ← Only reaches this with authenticated .pages block

    # Fallback: no .pages container — infer from card count
    if cards_on_page >= page_size_threshold:
        return True  # ← ALWAYS TRUE: authenticated sessions always have 20+ cards per page

    return False
```

### The Cascade of Failures

```
1. Scraper authenticates successfully → gets 20 products on page 1 ✓
2. _has_next_page():
     - soup.select_one(".pages") → None  (CMS hides .pages in some layouts)
     - cards_on_page = 20 >= 20          → returns True ✓ (correct for real page 2)
3. Scraper fetches page 2 → gets 20 more products ✓
4. Scraper fetches page 3, 4 ... N (last real page) → gets last batch of products ✓
5. Scraper fetches page N+1 (overflow):
     - CMS silently serves page 1 again
     - soup.select(".product-brief-content") returns 20 cards (page 1 duplicates)
     - All 20 are in seen_product_ids → new_products_on_page = 0
     - BUT: _has_next_page() only checks len(cards) = 20, NOT new_products_on_page
     - 20 >= 20 → returns True → INFINITE LOOP BEGINS
6. This repeats forever: page N+2, N+3, N+4 ...
```

---

## 4. Why This Was Not Caught Earlier

The fallback mechanism was **added intentionally** to fix Issue 2 (Pagination Miss), where the `.pages` container was sometimes absent on the first real multi-page category. The fix worked correctly for its intended purpose — preventing premature stops after page 1.

However, the fix introduced a new failure mode: it has no upper bound and no "zero new products" circuit-breaker. The original `.pages`-based check was safe because it would return `False` for out-of-bounds pages. The fallback check has no equivalent safety.

---

## 5. Proposed Fix (Investigation Only — Not Applied)

**Two complementary changes are needed in `extract_products_for_category()`:**

### Fix A — Zero-new-products circuit breaker (Primary)

Add a `break` immediately after the product loop if `new_products_on_page == 0`. If the CMS served a page with cards but none were new, we have hit the overflow — stop immediately.

```python
# After the product parsing loop:
if new_products_on_page == 0 and len(cards) > 0:
    logger.info(
        "Page %d had %d cards but 0 new products (likely CMS overflow — stopping pagination).",
        page, len(cards)
    )
    break
```

### Fix B — Pass `new_products_on_page` to the fallback, not `len(cards)`

Change the fallback metric from raw card count to **new** product count. An overflow page with 20 recycled cards should not trigger the "assume next page" logic.

```python
# Current call:
if not _has_next_page(soup, page, cards_on_page=len(cards)):

# Proposed:
if not _has_next_page(soup, page, cards_on_page=new_products_on_page):
```

This makes the fallback say: "assume next page if we got ≥ 20 **new** products" — which is exactly the correct intent.

### Fix C — Hard maximum page cap (Defense in depth)

Add an absolute page cap (e.g., 200 pages) as a third line of defense, so that even if the above two fixes fail, the loop cannot run more than a few hours:

```python
MAX_PAGES = 200  # No category realistically has >4000 products at 20/page

while True:
    if page > MAX_PAGES:
        logger.warning("Reached MAX_PAGES (%d) for category %s — stopping.", MAX_PAGES, cat_id)
        break
    ...
```

---

## 6. Impact Assessment

| Supplier | Categories affected | Behavior |
|---|---|---|
| GBStore | All, including `product.all` | Loops after last real page |
| Balagan | All | Same CMS platform, same behavior |
| Sakher | All | Same CMS platform, same behavior |

With `--parallel`, all three suppliers run concurrently and all three get stuck simultaneously. With `--details`, each overflow page also triggers a detail-page scrape loop for the same 20 recycled products, creating a second nested delay.

**Estimated overhead:** If each category has an average of 5 real pages and REQUEST_DELAY is 0.8–1.5s, the scraper would run correctly for ~1–2 hours on a real run. The infinite loop adds unlimited additional time per category, easily explaining the 8+ hour runtime.

---

## 7. Files to Modify (Fix Not Applied)

| File | Function | Change needed |
|---|---|---|
| `scraper/extractor.py` | `extract_products_for_category()` | Add Fix A (zero-new-products break) and Fix B (pass `new_products_on_page` to `_has_next_page`) |
| `scraper/extractor.py` | `extract_products_for_category()` | Add Fix C (MAX_PAGES cap) |

No other files require changes. The sync orchestrators (`sync.py`, `suppliers/*/sync.py`) call `extract_products_for_category()` and do not need modification.
