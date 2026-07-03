"""
GB Store Scraper — Data Extraction Module
Parses HTML from gbstore.ps to extract categories and products.
"""

import logging
import re
import time
import random

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Regex to extract IDs from URL patterns
CAT_ID_RE = re.compile(r"\?app=product\.cat\.(\d+)")
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
        # Build URL (page 1 has no page param, page 2+ appends &page=N)
        url = f"{base_url}/?app=product.cat.{cat_id}"
        if page > 1:
            url += f"&page={page}"

        logger.info(
            "Fetching category '%s' (id=%s), page %d", cat_name, cat_id, page
        )

        # Respectful pacing
        time.sleep(random.uniform(delay_min, delay_max))

        try:
            response = session.get(url, timeout=30)
            response.raise_for_status()
        except Exception as e:
            logger.error(
                "Failed to fetch category %s page %d: %s", cat_id, page, e
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

        return {
            "supplier_id": supplier_id,
            "name": name,
            "wholesale_price": wholesale_price,
            "supplier_image_url": supplier_image_url,
            "additional_images": additional_images,
            "tags": tags,
            "description": None,  # Filled later from detail page if needed
            "quantity": None,     # Filled later from detail page if needed
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


def extract_product_details(session, config, supplier_id):
    """
    Fetch the individual product detail page for richer data
    (description, quantity).

    Args:
        session: Authenticated requests.Session.
        config: Dict with SUPPLIER_BASE_URL.
        supplier_id: The product's supplier ID.

    Returns:
        Dict with description, quantity (or None values if not found).
    """
    base_url = config["SUPPLIER_BASE_URL"]
    url = f"{base_url}/?app=product.show.{supplier_id}"

    try:
        time.sleep(random.uniform(1, 2))  # Brief delay
        response = session.get(url, timeout=30)
        response.raise_for_status()
    except Exception as e:
        logger.warning(
            "Failed to fetch product detail for %s: %s", supplier_id, e
        )
        return {"description": None, "quantity": None}

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

    return {"description": description, "quantity": quantity}


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
