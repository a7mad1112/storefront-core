"""
GB Store Scraper — Configuration
Loads and validates all environment variables needed by the scraper.
"""

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


def load_config():
    """
    Load and validate all required environment variables.
    Returns a dict with all config values.
    Exits with error if any required variable is missing.
    """
    if load_dotenv:
        # Try loading from project root .env.local or scraper/.env
        root_dir = Path(__file__).resolve().parent.parent
        load_dotenv(root_dir / ".env.local")
        load_dotenv(root_dir / ".env")
        load_dotenv(Path(__file__).resolve().parent / ".env")
    phone = os.environ.get("GBSTORE_PHONE") or os.environ.get("SUPPLIER_PHONE")
    password = os.environ.get("GBSTORE_PASSWORD") or os.environ.get("SUPPLIER_PASSWORD")

    required_vars = {
        # Supabase
        "SUPABASE_URL": "Supabase project URL (e.g., https://xxx.supabase.co)",
        "SUPABASE_SERVICE_KEY": "Supabase service_role key (bypasses RLS)",

        # Cloudflare R2
        "R2_ENDPOINT": "R2 S3-compatible endpoint URL",
        "R2_ACCESS_KEY": "R2 API access key ID",
        "R2_SECRET_KEY": "R2 API secret access key",
        "R2_BUCKET": "R2 bucket name for product images",
        "R2_PUBLIC_URL": "R2 public read URL (e.g., https://pub-xxx.r2.dev)",
    }

    config = {}
    missing = []

    if not phone:
        missing.append("  - GBSTORE_PHONE or SUPPLIER_PHONE: Phone number for gbstore.ps login")
    else:
        config["SUPPLIER_PHONE"] = phone

    if not password:
        missing.append("  - GBSTORE_PASSWORD or SUPPLIER_PASSWORD: Password for gbstore.ps login")
    else:
        config["SUPPLIER_PASSWORD"] = password

    for var, description in required_vars.items():
        value = os.environ.get(var)
        # Fallback to Next.js public variables if available
        if not value and var == "SUPABASE_URL":
            value = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        if not value and var == "R2_PUBLIC_URL":
            value = os.environ.get("NEXT_PUBLIC_R2_PUBLIC_URL")

        if not value:
            missing.append(f"  - {var}: {description}")
        else:
            config[var] = value

    if missing:
        print("[ERROR] Missing required environment variables:", file=sys.stderr)
        print("\n".join(missing), file=sys.stderr)
        print(
            "\nSet these in your .env file or as GitHub Actions secrets.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Optional config with defaults
    config["ZERO_QTY_DELETE_THRESHOLD"] = int(
        os.environ.get("ZERO_QTY_DELETE_THRESHOLD", "3")
    )

    # Supplier base URL
    config["SUPPLIER_BASE_URL"] = os.environ.get(
        "SUPPLIER_BASE_URL", "https://gbstore.ps"
    )

    # Supplier identifier (for multi-supplier catalog switching)
    config["SUPPLIER_CODE"] = os.environ.get("SUPPLIER_CODE", "gbstore")

    # Request pacing (seconds)
    config["REQUEST_DELAY_MIN"] = float(
        os.environ.get("REQUEST_DELAY_MIN", "2.0")
    )
    config["REQUEST_DELAY_MAX"] = float(
        os.environ.get("REQUEST_DELAY_MAX", "4.0")
    )

    # Whether to visit individual product detail pages for color variants,
    # descriptions, and brand extraction. Set to "false" to skip detail pages.
    config["SCRAPE_PRODUCT_DETAILS"] = os.environ.get(
        "SCRAPE_PRODUCT_DETAILS", "true"
    ).lower() in ("true", "1", "yes")

    return config


# Module-level singleton for convenience
if __name__ != "__main__":
    # Only auto-load when imported, not when run directly
    pass
