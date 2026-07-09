"""
GB Store Scraper — Data Extraction Module
Parses HTML from gbstore.ps to extract categories, brands, and products.
"""

import logging
import re
import time
import random

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Retry Helper — 3 tries with exponential backoff
# ---------------------------------------------------------------------------

MAX_RETRIES = 3
BASE_BACKOFF = 2  # seconds


def retry_request(session, method, url, description="request", **kwargs):
    """
    Execute an HTTP request with up to MAX_RETRIES attempts.
    Uses exponential backoff between retries.

    Args:
        session: requests.Session.
        method: HTTP method ('get' or 'post').
        url: Request URL.
        description: Human-readable description for log messages.
        **kwargs: Passed to session.get/post (timeout, data, etc.).

    Returns:
        requests.Response on success.

    Raises:
        RuntimeError: If all retries are exhausted.
    """
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            if method.lower() == "post":
                response = session.post(url, **kwargs)
            else:
                response = session.get(url, **kwargs)
            response.raise_for_status()
            return response
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES:
                wait = BASE_BACKOFF ** attempt + random.uniform(0, 1)
                logger.warning(
                    "[Retry %d/%d] %s failed: %s — retrying in %.1fs",
                    attempt, MAX_RETRIES, description, e, wait,
                )
                time.sleep(wait)
            else:
                logger.error(
                    "[FAILED] %s failed after %d attempts: %s",
                    description, MAX_RETRIES, e,
                )
    raise RuntimeError(
        f"{description} failed after {MAX_RETRIES} attempts: {last_error}"
    )

# Regex to extract IDs from URL patterns
CAT_ID_RE = re.compile(r"\?app=product\.cat\.(\d+)")
BRAND_ID_RE = re.compile(r"\?app=product\.brand\.(\d+)")
PRODUCT_ID_RE = re.compile(r"\?app=product\.show\.(\d+)")
PRICE_RE = re.compile(r"([\d,]+(?:\.\d+)?)")


# ---------------------------------------------------------------------------
# Category Extraction
# ---------------------------------------------------------------------------

def extract_categories(session, config):
    """
    Discover all categories from the sidebar navigation.

    Args:
        session: Authenticated requests.Session.
        config: Dict with SUPPLIER_BASE_URL.

    Returns:
        List of dicts: [{supplier_id, name, image_url, parent_supplier_id}, ...]
    """
    base_url = config["SUPPLIER_BASE_URL"]
    logger.info("Discovering categories from %s", base_url)

    response = session.get(f"{base_url}/", timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    categories = []
    seen_ids = set()

    # Parse sidebar navigation menu
    menu = soup.select_one("#site-menu-area")
    if not menu:
        logger.error("Could not find sidebar menu #site-menu-area")
        return categories

    # Process top-level <li> elements
    for li in menu.find_all("li", recursive=False):
        _parse_category_li(li, None, categories, seen_ids, base_url)

    logger.info("Discovered %d unique categories", len(categories))
    supplier_code = config.get("SUPPLIER_CODE", "gbstore")
    for cat in categories:
        cat["supplier_code"] = supplier_code
    return categories


def _parse_category_li(li, parent_supplier_id, categories, seen_ids, base_url):
    """
    Recursively parse a <li> element to extract category data,
    including sub-categories from nested <ul>.
    """
    link = li.find("a", href=True)
    if not link:
        return

    href = link.get("href", "")
    match = CAT_ID_RE.search(href)
    if not match:
        return  # Not a category link (could be brand, page, etc.)

    supplier_id = match.group(1)

    # Skip duplicates (sub-category menus repeat parent)
    if supplier_id in seen_ids:
        # But still process nested <ul> for children
        nested_ul = li.find("ul")
        if nested_ul:
            for child_li in nested_ul.find_all("li", recursive=False):
                _parse_category_li(
                    child_li, supplier_id, categories, seen_ids, base_url
                )
        return

    seen_ids.add(supplier_id)

    # Extract name from .text-box span
    text_box = link.select_one(".text-box")
    name = text_box.get_text(strip=True) if text_box else link.get_text(strip=True)

    # Extract category image
    img = link.find("img")
    image_url = None
    if img and img.get("src"):
        src = img["src"]
        if not src.startswith("http"):
            src = f"{base_url}/{src.lstrip('/')}"
        image_url = src

    categories.append({
        "supplier_id": supplier_id,
        "name": name,
        "image_url": image_url,
        "parent_supplier_id": parent_supplier_id,
    })

    # Process nested sub-categories
    nested_ul = li.find("ul")
    if nested_ul:
        for child_li in nested_ul.find_all("li", recursive=False):
            _parse_category_li(
                child_li, supplier_id, categories, seen_ids, base_url
            )


# ---------------------------------------------------------------------------
# Brand Extraction
# ---------------------------------------------------------------------------

def extract_brands(session, config):
    """
    Discover all brands from the sidebar navigation.

    Args:
        session: Authenticated requests.Session.
        config: Dict with SUPPLIER_BASE_URL.

    Returns:
        List of dicts: [{supplier_id, name, image_url}, ...]
    """
    base_url = config["SUPPLIER_BASE_URL"]
    logger.info("Discovering brands from %s", base_url)

    response = session.get(f"{base_url}/", timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    brands = []
    seen_ids = set()

    # Parse sidebar navigation menu — brands may be in the same menu or a separate section
    menu = soup.select_one("#site-menu-area")
    if not menu:
        logger.warning("Could not find sidebar menu for brand discovery")
        return brands

    # Look for brand links matching ?app=product.brand.{id}
    for li in menu.find_all("li"):
        link = li.find("a", href=True)
        if not link:
            continue

        href = link.get("href", "")
        match = BRAND_ID_RE.search(href)
        if not match:
            continue

        supplier_id = match.group(1)
        if supplier_id in seen_ids:
            continue
        seen_ids.add(supplier_id)

        # Extract brand name
        text_box = link.select_one(".text-box")
        name = text_box.get_text(strip=True) if text_box else link.get_text(strip=True)

        # Extract brand image
        img = link.find("img")
        image_url = None
        if img and img.get("src"):
            src = img["src"]
            if not src.startswith("http"):
                src = f"{base_url}/{src.lstrip('/')}"
            image_url = src

        brands.append({
            "supplier_id": supplier_id,
            "name": name,
            "image_url": image_url,
        })

    logger.info("Discovered %d unique brands", len(brands))
    supplier_code = config.get("SUPPLIER_CODE", "gbstore")
    for brand in brands:
        brand["supplier_code"] = supplier_code
    return brands


# ---------------------------------------------------------------------------
# Product Extraction
# ---------------------------------------------------------------------------

def extract_products_for_category(session, config, category):
    """
    Extract all products from a category page, handling pagination.

    Args:
        session: Authenticated requests.Session.
        config: Dict with SUPPLIER_BASE_URL, REQUEST_DELAY_MIN, REQUEST_DELAY_MAX.
        category: Dict with supplier_id, name.

    Returns:
        List of product dicts from the category listing pages.
    """
    base_url = config["SUPPLIER_BASE_URL"]
    cat_id = category["supplier_id"]
    cat_name = category["name"]
    delay_min = config["REQUEST_DELAY_MIN"]
    delay_max = config["REQUEST_DELAY_MAX"]

    products = []
    page = 1
    seen_product_ids = set()

    while True:
        # Build URL (page 1 has no page param, page 2+ appends &page=N or ..N)
        if cat_id == "all":
            url = f"{base_url}/?app=product.all" if page == 1 else f"{base_url}/?app=product.all..{page}"
        else:
            url = f"{base_url}/?app=product.cat.{cat_id}"
            if page > 1:
                url += f"&page={page}"

        logger.info(
            "Fetching category '%s' (id=%s), page %d", cat_name, cat_id, page
        )

        # Respectful pacing
        time.sleep(random.uniform(delay_min, delay_max))

        try:
            response = retry_request(
                session, "get", url,
                description=f"category '{cat_name}' page {page}",
                timeout=30,
            )
        except RuntimeError as e:
            logger.error(
                "Failed to fetch category %s page %d after retries: %s",
                cat_id, page, e,
            )
            break

        soup = BeautifulSoup(response.text, "html.parser")

        # Parse product cards on this page
        cards = soup.select(".product-brief-content")
        if not cards:
            logger.info(
                "No product cards found on page %d of category %s",
                page, cat_id,
            )
            break

        new_products_on_page = 0
        for card in cards:
            product = _parse_product_card(card, base_url)
            if product and product["supplier_id"] not in seen_product_ids:
                product["category_supplier_id"] = cat_id
                products.append(product)
                seen_product_ids.add(product["supplier_id"])
                new_products_on_page += 1

        logger.info(
            "Extracted %d new products from page %d", new_products_on_page, page
        )

        # Check for next page
        if not _has_next_page(soup, page):
            break

        page += 1

    supplier_code = config.get("SUPPLIER_CODE", "gbstore")
    for prod in products:
        prod["supplier_code"] = supplier_code
    return products


def _parse_product_card(card, base_url):
    """
    Parse a single .product-brief-content element into a product dict.

    Returns:
        Dict with supplier_id, name, wholesale_price, image_url,
        additional_images, supplier_image_url, tags.
        None if parsing fails.
    """
    try:
        # --- Extract supplier_id ---
        # Try data-wishlist attribute first
        wishlist_el = card.select_one("[data-wishlist]")
        if wishlist_el:
            supplier_id = wishlist_el.get("data-wishlist")
        else:
            # Fallback: extract from product link href
            link = card.select_one("a[href*='product.show']")
            if not link:
                return None
            match = PRODUCT_ID_RE.search(link.get("href", ""))
            if not match:
                return None
            supplier_id = match.group(1)

        # --- Extract product name ---
        title_el = card.select_one(".title h2")
        if not title_el:
            title_el = card.select_one(".title")
        name = title_el.get_text(strip=True) if title_el else f"Product {supplier_id}"

        # --- Extract price ---
        price_el = card.select_one(".price")
        wholesale_price = _extract_price(price_el)

        # --- Extract main image ---
        img_el = card.select_one(".image-wrapper img")
        supplier_image_url = None
        if img_el and img_el.get("src"):
            src = img_el["src"]
            if not src.startswith("http"):
                src = f"{base_url}/{src.lstrip('/')}"
            supplier_image_url = src

        # --- Extract color variant images (additional_images) ---
        additional_images = []
        color_imgs = card.select(".color-image img")
        for ci in color_imgs:
            ci_src = ci.get("src", "")
            if ci_src:
                if not ci_src.startswith("http"):
                    ci_src = f"{base_url}/{ci_src.lstrip('/')}"
                additional_images.append(ci_src)

        # --- Extract tags/badges ---
        tags = []
        promo_mark = card.select_one(".promotional-mark")
        if promo_mark:
            promo_text = promo_mark.get_text(strip=True)
            if promo_text:
                tags.append(promo_text)

        # Check for category badge
        cat_title = card.select_one(".cat-title")
        if cat_title:
            cat_text = cat_title.get_text(strip=True)
            if cat_text:
                tags.append(cat_text)

        # --- Extract brand name from card (if present) ---
        brand_name = None
        brand_el = card.select_one(".brand-name, .brand-title, [class*='brand']")
        if brand_el:
            brand_name = brand_el.get_text(strip=True)

        return {
            "supplier_id": supplier_id,
            "name": name,
            "wholesale_price": wholesale_price,
            "supplier_image_url": supplier_image_url,
            "additional_images": additional_images,
            "tags": tags,
            "brand_name": brand_name,
            "description": None,  # Filled later from detail page if needed
            "quantity": None,     # Filled later from detail page if needed
            "color_variants": [],  # Filled later from detail page
        }

    except Exception as e:
        logger.warning("Failed to parse product card: %s", e)
        return None


def _extract_price(price_el):
    """
    Extract the wholesale price from a .price element.
    When logged in:
      - The visible text (not inside <del>) is the wholesale price
      - <del> contains the original/retail price
    When logged out:
      - Only retail price is visible

    Returns:
        float price value, or 0.0 if not found.
    """
    if not price_el:
        return 0.0

    # When logged in, the wholesale price is the direct text (not in <del>)
    # Remove <del> and <sup> elements to isolate the wholesale price
    price_clone = BeautifulSoup(str(price_el), "html.parser").select_one(".price")
    if not price_clone:
        return 0.0

    # Remove <del> (retail/original price) and <sup> (currency symbol)
    for tag in price_clone.find_all(["del", "sup"]):
        tag.decompose()

    price_text = price_clone.get_text(strip=True)

    # Extract numeric value
    match = PRICE_RE.search(price_text)
    if match:
        price_str = match.group(1).replace(",", "")
        try:
            return float(price_str)
        except ValueError:
            pass

    return 0.0


def _has_next_page(soup, current_page):
    """
    Check if there's a next page in the pagination.
    """
    pages_container = soup.select_one(".pages")
    if not pages_container:
        return False

    # Look for a link with the next page number
    next_page = current_page + 1
    page_links = pages_container.select("a")
    for link in page_links:
        href = link.get("href", "")
        if f"page={next_page}" in href:
            return True
        # Also check if the link text is the next page number
        link_text = link.get_text(strip=True)
        if link_text == str(next_page):
            return True

    return False


def extract_product_details(session, config, supplier_id, product=None):
    """
    Fetch the individual product detail page for richer data
    (description, quantity, color variants, brand).

    Uses retry_request for automatic 3-try retry with backoff.

    Args:
        session: Authenticated requests.Session.
        config: Dict with SUPPLIER_BASE_URL.
        supplier_id: The product's supplier ID.

    Returns:
        Dict with description, quantity, color_variants, brand_supplier_id.

    Raises:
        RuntimeError: If the detail page cannot be fetched after 3 retries.
    """
    base_url = config["SUPPLIER_BASE_URL"]
    url = f"{base_url}/?app=product.show.{supplier_id}"

    time.sleep(random.uniform(0.5, 1.5))  # Brief pacing delay
    response = retry_request(
        session, "get", url,
        description=f"product detail page {supplier_id}",
        timeout=30,
    )

    soup = BeautifulSoup(response.text, "html.parser")

    # Extract description from .product-body
    description = None
    body_el = soup.select_one(".product-body")
    if body_el:
        description = body_el.get_text(separator="\n", strip=True)
        # Limit description length
        if description and len(description) > 2000:
            description = description[:2000] + "..."

    # Extract quantity — look for quantity selector or stock info
    quantity = _extract_quantity(soup)

    # Extract color variants from swatches on the detail page
    color_variants = _extract_color_variants(soup, base_url)

    # Extract brand link from the detail page breadcrumb or product info
    brand_supplier_id = _extract_brand_from_detail(soup)

    return {
        "description": description,
        "quantity": quantity,
        "color_variants": color_variants,
        "brand_supplier_id": brand_supplier_id,
        "supplier_code": config.get("SUPPLIER_CODE", "gbstore"),
    }


def _extract_quantity(soup):
    """
    Try to extract product quantity from the detail page.
    The CMS may show quantity in various ways.
    """
    # Check for quantity input field
    qty_input = soup.select_one(".quantity-selector")
    if qty_input:
        max_val = qty_input.get("max")
        if max_val:
            try:
                return int(max_val)
            except ValueError:
                pass

    # Check for out-of-stock indicator
    out_of_stock = soup.select_one(".image-caption-out-of-stock")
    if out_of_stock and out_of_stock.get_text(strip=True):
        return 0

    # Check for limited quantity alert
    limited = soup.select_one(".limited-quantity-alert")
    if limited:
        text = limited.get_text(strip=True)
        match = re.search(r"(\d+)", text)
        if match:
            return int(match.group(1))

    # Default: assume in stock if no out-of-stock indicator
    return 1


def _extract_color_variants(soup, base_url):
    """
    Extract color variant swatches from the product detail page.
    Each variant has: color_name, supplier_image_url, is_available.

    The supplier site may show color swatches as clickable thumbnails,
    radio buttons, or image options. We try multiple selectors.
    """
    variants = []
    seen_urls = set()

    # Strategy 1: Look for color swatch containers
    swatch_containers = soup.select(
        ".color-options .color-item, "
        ".product-colors .color-option, "
        ".color-swatches .swatch, "
        ".variant-selector .variant-item, "
        ".product-option-item"
    )

    for swatch in swatch_containers:
        variant = _parse_swatch_element(swatch, base_url)
        if variant and variant["supplier_image_url"] not in seen_urls:
            seen_urls.add(variant["supplier_image_url"])
            variants.append(variant)

    # Strategy 2: If no dedicated swatch container, look for color images
    # (the existing .color-image elements from listing pages may also appear)
    if not variants:
        color_imgs = soup.select(".color-image img, .gallery-thumb img, .product-thumb img")
        for idx, img in enumerate(color_imgs):
            src = img.get("src", "")
            if not src:
                continue
            if not src.startswith("http"):
                src = f"{base_url}/{src.lstrip('/')}"
            if src in seen_urls:
                continue
            seen_urls.add(src)

            # Try to get color name from alt text or parent title
            color_name = img.get("alt", "").strip() or img.get("title", "").strip()
            if not color_name:
                parent = img.find_parent()
                if parent:
                    color_name = parent.get("title", "").strip() or parent.get("data-color", "").strip()
            if not color_name:
                color_name = f"لون {idx + 1}"  # Fallback: "Color 1", "Color 2", etc.

            # Check if this color is marked as unavailable
            is_available = True
            parent_el = img.find_parent(class_=True)
            if parent_el:
                parent_classes = " ".join(parent_el.get("class", []))
                if any(kw in parent_classes for kw in ["disabled", "out-of-stock", "sold-out", "unavailable"]):
                    is_available = False

            variants.append({
                "color_name": color_name,
                "supplier_image_url": src,
                "is_available": is_available,
            })

    if variants:
        logger.debug("Found %d color variants", len(variants))

    return variants


def _parse_swatch_element(swatch, base_url):
    """
    Parse a single color swatch element into a variant dict.
    """
    try:
        # Extract image
        img = swatch.find("img")
        src = None
        if img and img.get("src"):
            src = img["src"]
        elif swatch.get("data-image"):
            src = swatch["data-image"]
        elif swatch.get("style") and "background-image" in swatch.get("style", ""):
            bg_match = re.search(r"url\(['\"]?([^'\"\)]+)", swatch["style"])
            if bg_match:
                src = bg_match.group(1)

        if not src:
            return None

        if not src.startswith("http"):
            src = f"{base_url}/{src.lstrip('/')}"

        # Extract color name
        color_name = (
            swatch.get("title", "").strip()
            or swatch.get("data-color", "").strip()
            or swatch.get("data-name", "").strip()
        )
        if not color_name and img:
            color_name = img.get("alt", "").strip() or img.get("title", "").strip()
        if not color_name:
            label = swatch.select_one(".color-name, .swatch-label, span")
            if label:
                color_name = label.get_text(strip=True)
        if not color_name:
            color_name = "لون"  # Fallback

        # Check availability
        is_available = True
        swatch_classes = " ".join(swatch.get("class", []))
        if any(kw in swatch_classes for kw in ["disabled", "out-of-stock", "sold-out", "unavailable"]):
            is_available = False
        if swatch.get("data-available") == "false":
            is_available = False

        return {
            "color_name": color_name,
            "supplier_image_url": src,
            "is_available": is_available,
        }

    except Exception as e:
        logger.debug("Failed to parse swatch element: %s", e)
        return None


def _extract_brand_from_detail(soup):
    """
    Try to extract the brand supplier_id from the product detail page.
    Looks for brand links in breadcrumbs or product info sections.
    """
    # Look for links matching ?app=product.brand.{id}
    brand_links = soup.find_all("a", href=True)
    for link in brand_links:
        href = link.get("href", "")
        match = BRAND_ID_RE.search(href)
        if match:
            return match.group(1)

    return None
