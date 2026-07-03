/**
 * GB Store — Utility Helpers
 *
 * Shared utilities for slug generation, price formatting,
 * and other common operations used across the storefront.
 */

/**
 * Generate a URL-friendly slug from an Arabic (or any) string.
 * Falls back to a transliteration-safe approach using encodeURIComponent
 * for non-Latin characters, plus a unique suffix to avoid collisions.
 *
 * @param {string} text - The input text (e.g., Arabic product name)
 * @param {string} [id] - Optional unique ID suffix to prevent slug collisions
 * @returns {string} URL-friendly slug
 *
 * @example
 * generateSlug("شنطة FENDI كبيرة", "3894")
 * // => "شنطة-fendi-كبيرة-3894"
 */
export function generateSlug(text, id) {
  let slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\u0600-\u06FF\w-]/g, '') // Keep Arabic chars, word chars, hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');       // Trim leading/trailing hyphens

  if (id) {
    slug = `${slug}-${id}`;
  }

  return slug || id || 'product';
}

/**
 * Format a price in Israeli Shekel (₪) with proper locale formatting.
 *
 * @param {number} price - The price value
 * @param {object} [options] - Formatting options
 * @param {boolean} [options.showCurrency=true] - Whether to show ₪ symbol
 * @param {number} [options.decimals=0] - Number of decimal places
 * @returns {string} Formatted price string
 *
 * @example
 * formatPrice(125.50)    // => "126 ₪"
 * formatPrice(125.50, { decimals: 2 }) // => "125.50 ₪"
 */
export function formatPrice(price, options = {}) {
  const { showCurrency = true, decimals = 0 } = options;

  if (price == null || isNaN(price)) return '';

  const formatted = Number(price).toFixed(decimals);

  // Use Arabic locale number formatting
  const localeFormatted = Number(formatted).toLocaleString('ar-PS', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showCurrency ? `${localeFormatted} ₪` : localeFormatted;
}

/**
 * Truncate text to a maximum length, adding "..." if truncated.
 *
 * @param {string} text - The text to truncate
 * @param {number} [maxLength=100] - Maximum character length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Build a WhatsApp deeplink URL with a pre-filled message.
 *
 * @param {string} phoneNumber - The WhatsApp number (with country code, no +)
 * @param {string} message - The pre-filled message text
 * @returns {string} WhatsApp deeplink URL
 */
export function buildWhatsAppLink(phoneNumber, message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encoded}`;
}

/**
 * Get the public R2 image URL.
 * If the URL is already absolute, return it as-is.
 * Otherwise, prepend the R2 public URL base.
 *
 * @param {string} imagePath - Image path or full URL
 * @returns {string} Full public URL to the image
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return '/placeholder.webp';
  if (imagePath.startsWith('http')) return imagePath;

  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  return `${r2Base}/${imagePath}`;
}
