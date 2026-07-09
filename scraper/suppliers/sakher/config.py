"""
Sakher Scraper — Configuration
Loads and validates environment variables for sakherbrands.com.
"""

import os
import sys
from pathlib import Path

scraper_root = Path(__file__).resolve().parent.parent.parent
if str(scraper_root) not in sys.path:
    sys.path.insert(0, str(scraper_root))

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


def load_config():
    """
    Load and validate all required environment variables for Sakher Brands.
    """
    if load_dotenv:
        root_dir = scraper_root.parent
        load_dotenv(root_dir / ".env.local")
        load_dotenv(root_dir / ".env")
        load_dotenv(scraper_root / ".env")

    phone = os.environ.get("SAKHER_PHONE") or os.environ.get("SUPPLIER_PHONE")
    password = os.environ.get("SAKHER_PASSWORD") or os.environ.get("SUPPLIER_PASSWORD")

    required_vars = {
        "SUPABASE_URL": "Supabase project URL",
        "SUPABASE_SERVICE_KEY": "Supabase service_role key",
        "R2_ENDPOINT": "R2 endpoint URL",
        "R2_ACCESS_KEY": "R2 API access key ID",
        "R2_SECRET_KEY": "R2 API secret access key",
        "R2_BUCKET": "R2 bucket name for product images",
        "R2_PUBLIC_URL": "R2 public read URL",
    }

    config = {}
    missing = []

    if not phone:
        missing.append("  - SAKHER_PHONE or SUPPLIER_PHONE: Phone number for sakherbrands.com login")
    else:
        config["SUPPLIER_PHONE"] = phone

    if not password:
        missing.append("  - SAKHER_PASSWORD or SUPPLIER_PASSWORD: Password for sakherbrands.com login")
    else:
        config["SUPPLIER_PASSWORD"] = password

    for var, description in required_vars.items():
        value = os.environ.get(var)
        if not value and var == "SUPABASE_URL":
            value = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        if not value and var == "R2_PUBLIC_URL":
            value = os.environ.get("NEXT_PUBLIC_R2_PUBLIC_URL")

        if not value:
            missing.append(f"  - {var}: {description}")
        else:
            config[var] = value

    if missing:
        print("[ERROR] Missing required environment variables for Sakher scraper:", file=sys.stderr)
        print("\n".join(missing), file=sys.stderr)
        sys.exit(1)

    config["ZERO_QTY_DELETE_THRESHOLD"] = int(os.environ.get("ZERO_QTY_DELETE_THRESHOLD", "3"))
    config["SUPPLIER_BASE_URL"] = os.environ.get("SAKHER_BASE_URL", "https://sakherbrands.com")
    config["SUPPLIER_CODE"] = "sakher"
    config["REQUEST_DELAY_MIN"] = float(os.environ.get("REQUEST_DELAY_MIN", "2.0"))
    config["REQUEST_DELAY_MAX"] = float(os.environ.get("REQUEST_DELAY_MAX", "4.0"))
    config["SCRAPE_PRODUCT_DETAILS"] = os.environ.get("SCRAPE_PRODUCT_DETAILS", "true").lower() in ("true", "1", "yes")

    return config
