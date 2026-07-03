"""
GB Store Scraper — Configuration
Loads and validates all environment variables needed by the scraper.
"""

import os
import sys


def load_config():
    """
    Load and validate all required environment variables.
    Returns a dict with all config values.
    Exits with error if any required variable is missing.
    """
    required_vars = {
        # Supplier credentials
        "SUPPLIER_PHONE": "Phone number for gbstore.ps login",
        "SUPPLIER_PASSWORD": "Password for gbstore.ps login",

        # Supabase
        "SUPABASE_URL": "Supabase project URL (e.g., https://xxx.supabase.co)",
        "SUPABASE_SERVICE_KEY": "Supabase service_role key (bypasses RLS)",

        # Cloudflare R2
        "R2_ENDPOINT": "R2 S3-compatible endpoint URL",
        "R2_ACCESS_KEY": "R2 API access key ID",
        "R2_SECRET_KEY": "R2 API secret access key",
        "R2_BUCKET": "R2 bucket name for product images",
    }

    config = {}
    missing = []

    for var, description in required_vars.items():
        value = os.environ.get(var)
        if not value:
            missing.append(f"  - {var}: {description}")
        else:
            config[var] = value

    if missing:
        print("❌ Missing required environment variables:", file=sys.stderr)
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

    # Request pacing (seconds)
    config["REQUEST_DELAY_MIN"] = float(
        os.environ.get("REQUEST_DELAY_MIN", "2.0")
    )
    config["REQUEST_DELAY_MAX"] = float(
        os.environ.get("REQUEST_DELAY_MAX", "4.0")
    )

    return config


# Module-level singleton for convenience
if __name__ != "__main__":
    # Only auto-load when imported, not when run directly
    pass
