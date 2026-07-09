"""
Balagan Scraper — Data Extraction Module
Parses HTML from balagan.ps, specializing in color variants and sizes for shoes.
"""

import logging
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup

scraper_root = Path(__file__).resolve().parent.parent.parent
if str(scraper_root) not in sys.path:
    sys.path.insert(0, str(scraper_root))

from scraper.extractor import (
    retry_request,
    extract_categories,
    extract_brands,
    extract_products_for_category,
    _extract_brand_from_detail,
    _extract_quantity,
)

logger = logging.getLogger("balagan.extractor")


def extract_product_details(session, config, supplier_id, product=None):
    """
    Fetch and parse a product detail page on balagan.ps.
    Specializes in extracting shoe colors and sizes per color.
    """
    if not product:
        product = {"supplier_id": supplier_id}
    base_url = config["SUPPLIER_BASE_URL"]
    detail_url = f"{base_url}/?app=product.show.{supplier_id}"

    logger.debug("Fetching Balagan details for product %s: %s", supplier_id, detail_url)
    try:
        response = retry_request(
            session, "get", detail_url,
            description=f"product detail {supplier_id}",
            timeout=25,
        )
    except Exception as e:
        logger.error("Failed to fetch detail page for %s: %s", supplier_id, e)
        return {
            "description": None,
            "quantity": 1,
            "color_variants": [],
            "brand_supplier_id": None,
            "supplier_code": "balagan",
        }

    soup = BeautifulSoup(response.text, "html.parser")

    # Description
    description = None
    body_el = soup.select_one(".product-body")
    if body_el:
        description = body_el.get_text(separator="\n", strip=True)
        if description and len(description) > 2000:
            description = description[:2000] + "..."

    # Quantity
    quantity = _extract_quantity(soup)

    # Brand
    brand_supplier_id = _extract_brand_from_detail(soup)

    # Colors and Sizes
    color_variants = _extract_balagan_colors_and_sizes(soup, base_url, product)

    return {
        "description": description,
        "quantity": quantity,
        "color_variants": color_variants,
        "brand_supplier_id": brand_supplier_id,
        "supplier_code": "balagan",
    }


def _extract_balagan_colors_and_sizes(soup, base_url, product):
    """
    Extract color variants and color-specific shoe sizes from balagan.ps.
    """
    variants = []
    seen_urls = set()

    # Step 1: Find color swatches / selectors
    color_elements = []
    
    # Check labels or elements with showSize call
    for el in soup.find_all(lambda tag: tag.get("onclick") and "showSize" in str(tag.get("onclick"))):
        color_elements.append(el)

    # If none found by showSize, check standard swatch classes
    if not color_elements:
        color_elements = soup.select(
            ".color-options .color-item, "
            ".product-colors .color-option, "
            ".color-swatches .swatch, "
            ".variant-selector .variant-item, "
            ".product-option-item, "
            "label.color-selector"
        )

    # Process each color element
    for idx, el in enumerate(color_elements):
        # Determine color index
        color_idx = idx
        onclick_str = str(el.get("onclick", ""))
        match = re.search(r"showSize\((\d+)\)", onclick_str)
        if match:
            color_idx = int(match.group(1))

        # Determine color name
        color_name = ""
        text = el.get_text(strip=True)
        if text:
            color_name = text
        img = el.find("img")
        if not color_name and img:
            color_name = img.get("alt", "").strip() or img.get("title", "").strip()
        if not color_name:
            color_name = el.get("title", "").strip() or el.get("data-color", "").strip()
        if not color_name:
            color_name = f"لون {color_idx + 1}"

        # Determine image URL
        src = ""
        if img and img.get("src"):
            src = img["src"]
        elif el.get("data-image"):
            src = el["data-image"]
        
        if src and not src.startswith("http"):
            src = f"{base_url}/{src.lstrip('/')}"
        
        if not src:
            src = product.get("supplier_image_url", "")

        # Extract sizes for this color index
        sizes = _extract_sizes_for_color(soup, color_idx)

        variants.append({
            "color_name": color_name,
            "supplier_image_url": src,
            "is_available": True,  # Unavailable colors absent from DOM in Balagan
            "sizes": sizes,
        })
        if src:
            seen_urls.add(src)

    # Step 2: If no color elements found, check if there are color images without showSize
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

            color_name = img.get("alt", "").strip() or img.get("title", "").strip() or f"لون {idx + 1}"
            sizes = _extract_sizes_for_color(soup, idx)

            variants.append({
                "color_name": color_name,
                "supplier_image_url": src,
                "is_available": True,
                "sizes": sizes,
            })

    # Step 3: If still no variants, create a single default variant with whatever sizes are on the page
    if not variants:
        sizes = _extract_sizes_for_color(soup, 0)
        if sizes or product.get("supplier_image_url"):
            variants.append({
                "color_name": "افتراضي",
                "supplier_image_url": product.get("supplier_image_url", ""),
                "is_available": True,
                "sizes": sizes,
            })

    return variants


def _extract_sizes_for_color(soup, color_idx):
    """
    Extract shoe sizes for a specific color index.
    Looks inside #cs{color_idx} container, or falls back to all size radios.
    """
    sizes = []
    
    container = soup.select_one(f"#cs{color_idx}")
    if not container:
        container = soup.select_one(f"[data-color-index='{color_idx}'], .color-sizes-{color_idx}")
    
    search_root = container if container else (soup if color_idx == 0 else None)
    if not search_root:
        return sizes

    radio_inputs = search_root.find_all("input", {"type": "radio"})
    if not radio_inputs:
        radio_inputs = search_root.select("input[name*='size'], .size-selector input, input.size-radio")

    if radio_inputs:
        for radio in radio_inputs:
            size_val = radio.get("value", "").strip()
            radio_id = radio.get("id")
            if radio_id:
                label_el = soup.find("label", {"for": radio_id})
                if label_el and label_el.get_text(strip=True):
                    size_val = label_el.get_text(strip=True)
            if not size_val:
                parent_label = radio.find_parent("label")
                if parent_label:
                    size_val = parent_label.get_text(strip=True)

            if not size_val:
                continue

            size_val = re.sub(r"^[^\dA-Za-z]+", "", size_val).strip()

            is_avail = not radio.has_attr("disabled")
            
            onclick_str = str(radio.get("onclick", ""))
            qty = 1 if is_avail else 0
            qty_match = re.search(r"setMaxMinQuantity\((\d+)\)", onclick_str)
            if qty_match:
                qty = int(qty_match.group(1))
                if qty == 0:
                    is_avail = False

            price_info = {}
            price_match = re.search(r"changePrice\(([\d.]+),\s*([\d.]+)\)", onclick_str)
            if price_match:
                price_info["sale_price"] = float(price_match.group(1))
                price_info["original_price"] = float(price_match.group(2))

            size_data = {
                "size": size_val,
                "is_available": is_avail,
                "quantity": qty,
            }
            size_data.update(price_info)
            sizes.append(size_data)
    else:
        size_els = search_root.select(".size-option, .size-item, label.size-selector, .size-list span, .size-list label")
        for el in size_els:
            size_val = el.get_text(strip=True)
            if not size_val:
                continue
            is_avail = True
            classes = " ".join(el.get("class", []))
            if any(kw in classes for kw in ["disabled", "out-of-stock", "sold-out", "crossed", "unavailable"]):
                is_avail = False
            if el.has_attr("disabled"):
                is_avail = False

            sizes.append({
                "size": size_val,
                "is_available": is_avail,
                "quantity": 1 if is_avail else 0,
            })

    return sizes
