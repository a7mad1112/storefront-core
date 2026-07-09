"""
Automated Scraper Translation Module (Phase 8)

Provides zero-runtime-overhead automated translation of scraped product, category,
and brand names/descriptions into English (`name_en`, `description_en`) and Hebrew
(`name_he`, `description_he`) during data synchronization (`db.py`).

Uses `deep-translator` (GoogleTranslator) with in-memory LRU caching and a fallback
direct HTTP translation request to ensure zero dependency breakage and maximum SEO.
"""

import logging
import urllib.parse
from functools import lru_cache

try:
    from deep_translator import GoogleTranslator
except ImportError:
    GoogleTranslator = None

try:
    import requests
except ImportError:
    requests = None

logger = logging.getLogger("scraper.translator")


@lru_cache(maxsize=4096)
def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> str:
    """
    Translate text into target_lang ('en' or 'he' or 'ar').
    Returns translated string, or None if translation fails or text is empty.
    """
    if not text or not isinstance(text, str):
        return None

    clean_text = text.strip()
    if not clean_text:
        return None

    # Limit to 4500 characters to prevent API limits
    if len(clean_text) > 4500:
        clean_text = clean_text[:4500]

    # Attempt 1: deep-translator
    if GoogleTranslator is not None:
        try:
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            res = translator.translate(clean_text)
            if res and isinstance(res, str):
                return res.strip()
        except Exception as e:
            logger.debug("deep-translator failed for target '%s': %s — trying fallback", target_lang, e)

    # Attempt 2: Direct requests fallback to public translate_a endpoint
    if requests is not None:
        try:
            url = "https://translate.googleapis.com/translate_a/single"
            params = {
                "client": "gtx",
                "sl": source_lang if source_lang != "auto" else "ar",
                "tl": target_lang,
                "dt": "t",
                "q": clean_text,
            }
            resp = requests.get(url, params=params, timeout=6.0)
            if resp.status_code == 200:
                data = resp.json()
                # data[0] contains list of translation segments
                if data and isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                    translated_segments = [seg[0] for seg in data[0] if isinstance(seg, list) and len(seg) > 0 and seg[0]]
                    if translated_segments:
                        return "".join(translated_segments).strip()
        except Exception as e:
            logger.debug("Requests fallback translation failed for target '%s': %s", target_lang, e)

    logger.warning("All translation attempts failed for text (len=%d) to '%s'", len(clean_text), target_lang)
    return None


def translate_entity(data: dict, name_key: str = "name", desc_key: str = "description") -> dict:
    """
    In-place translation helper for dictionaries (categories, brands, products).
    Populates `name_en`, `name_he`, `description_en`, `description_he` if not present.
    """
    name_val = data.get(name_key)
    if name_val:
        if not data.get("name_en"):
            trans_en = translate_text(name_val, target_lang="en", source_lang="ar")
            if trans_en:
                data["name_en"] = trans_en
        if not data.get("name_he"):
            trans_he = translate_text(name_val, target_lang="iw", source_lang="ar")  # Google uses 'iw' for Hebrew
            if trans_he:
                data["name_he"] = trans_he

    if desc_key:
        desc_val = data.get(desc_key)
        if desc_val:
            if not data.get("description_en"):
                trans_desc_en = translate_text(desc_val, target_lang="en", source_lang="ar")
                if trans_desc_en:
                    data["description_en"] = trans_desc_en
            if not data.get("description_he"):
                trans_desc_he = translate_text(desc_val, target_lang="iw", source_lang="ar")
                if trans_desc_he:
                    data["description_he"] = trans_desc_he

    return data
