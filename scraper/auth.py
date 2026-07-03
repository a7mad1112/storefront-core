"""
GB Store Scraper — Authentication Module
Handles login to gbstore.ps and session management.
"""

import logging
import time

import requests

logger = logging.getLogger(__name__)

# Default headers to mimic a real browser
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ar,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}


from bs4 import BeautifulSoup


def create_authenticated_session(config, max_retries=2, retry_delay=5):
    """
    Authenticate with gbstore.ps and return an active requests.Session.

    Args:
        config: Dict with SUPPLIER_BASE_URL, SUPPLIER_PHONE, SUPPLIER_PASSWORD.
        max_retries: Number of retry attempts on failure.
        retry_delay: Seconds to wait between retries.

    Returns:
        requests.Session with active authentication cookies.

    Raises:
        RuntimeError: If login fails after all retries.
    """
    base_url = config["SUPPLIER_BASE_URL"].rstrip("/")
    login_url = f"{base_url}/?account=login"

    for attempt in range(1, max_retries + 2):
        try:
            session = requests.Session()
            session.headers.update(DEFAULT_HEADERS)

            logger.info(
                "Login attempt %d/%d to %s",
                attempt, max_retries + 1, base_url,
            )

            # 1. GET login page first to establish PHPSESSID & get security token
            # Note: gbstore.ps returns HTTP 401 Unauthorized for the unauthenticated login form page
            get_resp = session.get(login_url, timeout=30)

            soup = BeautifulSoup(get_resp.text, "html.parser")
            token_input = soup.find("input", {"name": "token"})
            token = token_input.get("value") if token_input else ""

            # 2. POST login form with Origin/Referer headers and CSRF token
            post_headers = {
                "Origin": base_url,
                "Referer": login_url,
            }
            response = session.post(
                login_url,
                data={
                    "phone": config["SUPPLIER_PHONE"],
                    "password": config["SUPPLIER_PASSWORD"],
                    "remember": "1",
                    "token": token,
                },
                headers=post_headers,
                timeout=30,
                allow_redirects=True,
            )
            response.raise_for_status()

            # Verify login succeeded
            if _verify_login(session, base_url):
                logger.info("[OK] Login successful")
                return session
            else:
                logger.warning("Login POST succeeded but session verification failed")
                raise RuntimeError("Login verification failed")

        except (requests.RequestException, RuntimeError) as e:
            logger.warning("Login attempt %d failed: %s", attempt, e)
            if attempt <= max_retries:
                logger.info("Retrying in %ds...", retry_delay)
                time.sleep(retry_delay)
            else:
                raise RuntimeError(
                    f"Failed to authenticate after {max_retries + 1} attempts: {e}"
                ) from e


def _verify_login(session, base_url):
    """
    Verify that the session is actually authenticated.
    When logged in, the homepage no longer displays the wholesale login link ('account=login').
    """
    try:
        response = session.get(f"{base_url}/", timeout=20)
        response.raise_for_status()
        html = response.text

        # If 'account=login' is NOT in the HTML, we successfully logged in
        if "account=login" not in html:
            return True

        return False

    except requests.RequestException as e:
        logger.warning("Could not verify login: %s", e)
        return False
