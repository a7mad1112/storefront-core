"""
GB Store Scraper — Image Processing Pipeline
Download images, convert to WebP, upload to Cloudflare R2, and cleanup.
"""

import hashlib
import io
import logging
from urllib.parse import urlparse

import boto3
from botocore.config import Config as BotoConfig
from PIL import Image

logger = logging.getLogger(__name__)


def create_r2_client(config):
    """
    Create a boto3 S3 client configured for Cloudflare R2.

    Args:
        config: Dict with R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY.

    Returns:
        boto3 S3 client.
    """
    return boto3.client(
        "s3",
        endpoint_url=config["R2_ENDPOINT"],
        aws_access_key_id=config["R2_ACCESS_KEY"],
        aws_secret_access_key=config["R2_SECRET_KEY"],
        config=BotoConfig(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
        ),
        region_name="auto",
    )


MAX_IMAGE_RETRIES = 3
IMAGE_BACKOFF = 2  # seconds


def download_image(session, url):
    """
    Download an image from the given URL with retry logic.
    Retries up to MAX_IMAGE_RETRIES times with exponential backoff.

    Args:
        session: requests.Session (authenticated).
        url: Full URL to the image.

    Returns:
        Bytes of the downloaded image.

    Raises:
        RuntimeError: If download fails after all retries.
    """
    import random

    last_error = None
    for attempt in range(1, MAX_IMAGE_RETRIES + 1):
        try:
            response = session.get(url, timeout=30, stream=True)
            response.raise_for_status()
            return response.content
        except Exception as e:
            last_error = e
            if attempt < MAX_IMAGE_RETRIES:
                wait = IMAGE_BACKOFF ** attempt + random.uniform(0, 1)
                logger.warning(
                    "[Retry %d/%d] Image download %s failed: %s — retrying in %.1fs",
                    attempt, MAX_IMAGE_RETRIES, url, e, wait,
                )
                import time
                time.sleep(wait)
            else:
                logger.error(
                    "[FAILED] Image download %s failed after %d attempts: %s",
                    url, MAX_IMAGE_RETRIES, e,
                )
    raise RuntimeError(
        f"Image download failed after {MAX_IMAGE_RETRIES} attempts: {url} — {last_error}"
    )


def convert_to_webp(image_bytes, quality=80):
    """
    Convert image bytes to WebP format.

    Args:
        image_bytes: Raw image bytes (JPEG, PNG, etc.).
        quality: WebP quality (1-100).

    Returns:
        WebP bytes, or None on failure.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))

        # Convert RGBA to RGB (WebP supports RGBA but for photos RGB is fine)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        output = io.BytesIO()
        img.save(output, format="WEBP", quality=quality, optimize=True)
        return output.getvalue()
    except Exception as e:
        logger.warning("Failed to convert image to WebP: %s", e)
        return None


def generate_r2_key(supplier_id, image_url, suffix="main"):
    """
    Generate a deterministic R2 object key for a product image.

    Format: products/{supplier_id}/{hash}.webp

    Args:
        supplier_id: Product supplier ID.
        image_url: Original image URL (used for hashing).
        suffix: Image type suffix (main, color-0, color-1, etc.).

    Returns:
        String R2 key.
    """
    # Create a short hash from the URL for uniqueness
    url_hash = hashlib.md5(image_url.encode()).hexdigest()[:10]
    return f"products/{supplier_id}/{suffix}-{url_hash}.webp"


def upload_to_r2(r2_client, bucket, key, webp_bytes):
    """
    Upload WebP bytes to Cloudflare R2.

    Args:
        r2_client: boto3 S3 client.
        bucket: R2 bucket name.
        key: Object key (path in bucket).
        webp_bytes: WebP image bytes.

    Returns:
        The key if successful, None on failure.
    """
    try:
        r2_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=webp_bytes,
            ContentType="image/webp",
        )
        logger.debug("Uploaded image to R2: %s", key)
        return key
    except Exception as e:
        logger.warning("Failed to upload %s to R2: %s", key, e)
        return None


def delete_from_r2(r2_client, bucket, keys):
    """
    Batch delete objects from R2.

    Args:
        r2_client: boto3 S3 client.
        bucket: R2 bucket name.
        keys: List of object keys to delete.

    Returns:
        Number of successfully deleted objects.
    """
    if not keys:
        return 0

    deleted_count = 0
    # R2 supports batch delete up to 1000 objects at a time
    batch_size = 1000
    for i in range(0, len(keys), batch_size):
        batch = keys[i : i + batch_size]
        try:
            response = r2_client.delete_objects(
                Bucket=bucket,
                Delete={
                    "Objects": [{"Key": k} for k in batch],
                    "Quiet": True,
                },
            )
            errors = response.get("Errors", [])
            deleted_count += len(batch) - len(errors)
            if errors:
                for err in errors:
                    logger.warning(
                        "Failed to delete R2 object %s: %s",
                        err.get("Key"), err.get("Message"),
                    )
        except Exception as e:
            logger.warning("R2 batch delete failed: %s", e)

    logger.info("Deleted %d images from R2", deleted_count)
    return deleted_count


def get_public_url(config, key):
    """
    Construct the public URL for an R2 object.

    Args:
        config: Dict with R2_PUBLIC_URL.
        key: R2 object key.

    Returns:
        Full public URL string.
    """
    public_base = config.get("R2_PUBLIC_URL", "").rstrip("/")
    return f"{public_base}/{key}"


def process_product_images(session, r2_client, config, product, existing_image_url=None):
    """
    Full image pipeline for a single product:
    1. Download main image
    2. Convert to WebP
    3. Upload to R2
    4. Process additional images (legacy color images from listing)
    5. Process color variant images (from detail page)

    All image downloads use retry logic internally (3 retries with backoff).
    If an image still fails after retries, RuntimeError propagates to the caller
    so the product can be retried at a higher level.

    Args:
        session: Authenticated requests.Session.
        r2_client: boto3 S3 client.
        config: Dict with R2_BUCKET, R2_PUBLIC_URL.
        product: Product dict with supplier_id, supplier_image_url, additional_images, color_variants.
        existing_image_url: Current image_url in DB (skip if unchanged).

    Returns:
        Tuple of (main_image_url, additional_r2_urls, r2_color_variants)
        r2_color_variants is a list of dicts: [{color_name, image_url (R2), supplier_image_url, is_available}, ...]

    Raises:
        RuntimeError: If any critical image download fails after 3 retries.
    """
    bucket = config["R2_BUCKET"]
    supplier_id = product["supplier_id"]
    supplier_image_url = product.get("supplier_image_url")

    main_image_url = None
    additional_r2_urls = []
    r2_color_variants = []

    # --- Process main image ---
    if supplier_image_url:
        key = generate_r2_key(supplier_id, supplier_image_url, "main")
        public_url = get_public_url(config, key)

        # Skip if the supplier image URL hasn't changed and we already have it
        if existing_image_url and existing_image_url == public_url:
            main_image_url = existing_image_url
            logger.debug(
                "Skipping main image upload for product %s (unchanged)",
                supplier_id,
            )
        else:
            image_bytes = download_image(session, supplier_image_url)
            webp_bytes = convert_to_webp(image_bytes)
            if webp_bytes:
                result = upload_to_r2(r2_client, bucket, key, webp_bytes)
                if result:
                    main_image_url = public_url

    # --- Process additional images (legacy) ---
    for idx, color_url in enumerate(product.get("additional_images", [])):
        if not color_url:
            continue

        key = generate_r2_key(supplier_id, color_url, f"color-{idx}")
        public_url = get_public_url(config, key)

        image_bytes = download_image(session, color_url)
        webp_bytes = convert_to_webp(image_bytes)
        if webp_bytes:
            result = upload_to_r2(r2_client, bucket, key, webp_bytes)
            if result:
                additional_r2_urls.append(public_url)

    # --- Process color variant images (from detail page extraction) ---
    for idx, variant in enumerate(product.get("color_variants", [])):
        variant_url = variant.get("supplier_image_url")
        if not variant_url:
            continue

        key = generate_r2_key(supplier_id, variant_url, f"variant-{idx}")
        public_url = get_public_url(config, key)

        image_bytes = download_image(session, variant_url)
        webp_bytes = convert_to_webp(image_bytes)
        if webp_bytes:
            result = upload_to_r2(r2_client, bucket, key, webp_bytes)
            if result:
                variant_data = dict(variant)
                variant_data["color_name"] = variant.get("color_name", f"لون {idx + 1}")
                variant_data["image_url"] = public_url
                variant_data["supplier_image_url"] = variant_url
                variant_data["is_available"] = variant.get("is_available", True)
                r2_color_variants.append(variant_data)

    return main_image_url, additional_r2_urls, r2_color_variants


def collect_image_keys_for_product(product_row):
    """
    Given a product DB row, collect all R2 keys that would need to be
    deleted when the product is purged.

    Args:
        product_row: Dict with image_url, additional_images.

    Returns:
        List of R2 keys to delete.
    """
    keys = []
    image_url = product_row.get("image_url") or ""
    additional = product_row.get("additional_images") or []

    # Extract R2 key from public URL (everything after the domain)
    for url in [image_url] + list(additional):
        if url and "r2.dev/" in url:
            key = url.split("r2.dev/", 1)[-1]
            if key:
                keys.append(key)

    return keys
