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
  let lang = 'ar';
  let showCurrency = true;
  let decimals = 0;

  if (typeof options === 'string') {
    lang = options;
  } else if (options && typeof options === 'object') {
    if (options.lang) lang = options.lang;
    if (options.showCurrency !== undefined) showCurrency = options.showCurrency;
    if (options.decimals !== undefined) decimals = options.decimals;
  }

  if (typeof window !== 'undefined' && (!options || (typeof options === 'object' && !options.lang))) {
    const path = window.location.pathname || '';
    if (path.startsWith('/en')) lang = 'en';
    else if (path.startsWith('/he')) lang = 'he';
  }

  if (price == null || isNaN(price)) return '';

  const formatted = Number(price).toFixed(decimals);
  const locale = lang === 'en' ? 'en-US' : lang === 'he' ? 'he-IL' : 'ar-PS';
  const localeFormatted = Number(formatted).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showCurrency ? (lang === 'en' ? `₪${localeFormatted}` : `${localeFormatted} ₪`) : localeFormatted;
}

/**
 * Get localized display name for any category or brand (handles exact & partial matches)
 */
export function getCategoryDisplayName(catOrName, lang = 'ar') {
  if (!catOrName) return '';
  if (typeof window !== 'undefined' && (!lang || lang === 'ar')) {
    const path = window.location.pathname || '';
    if (path.startsWith('/en')) lang = 'en';
    else if (path.startsWith('/he')) lang = 'he';
  }
  if (lang === 'ar') {
    return typeof catOrName === 'object' ? (catOrName.name || '') : catOrName;
  }

  const name = typeof catOrName === 'object' ? (catOrName.name || '') : catOrName;
  const dbName = typeof catOrName === 'object' ? (lang === 'en' ? catOrName.name_en : lang === 'he' ? catOrName.name_he : null) : null;
  if (dbName && dbName !== name && dbName.trim().length > 0) {
    return dbName;
  }

  if (typeof name !== 'string' || !name.trim()) return name || '';

  const mapEn = {
    'شنط ظهر ماركة': 'Branded Backpacks',
    'شنطة ظهر ماركة': 'Branded Backpacks',
    'أضف حديثاً': 'New Arrivals',
    'أضيف حديثاً': 'New Arrivals',
    'كعب / Heels': 'Heels',
    'كعب': 'Heels',
    'Urban Luxury - أطقم ساعات': 'Watch Sets - Urban Luxury',
    'أطقم ساعات': 'Watch Sets',
    'elegant أطقم': 'Elegant Sets',
    'أطقم elegant': 'Elegant Sets',
    'افرهول': 'Jumpsuits / Overalls',
    'أفرهول': 'Jumpsuits / Overalls',
    'بدلات بلوزه و شرط': 'Blouse & Shorts Sets',
    'بدلات بلوزة وشورت': 'Blouse & Shorts Sets',
    'سوارة + خاتم ( طقم )': 'Bracelet & Ring Set',
    'شنط وهدايا': 'Bags & Gifts',
    'أحذية': 'Shoes',
    'ملابس رياضية': 'Sportswear',
    'ساعات': 'Watches',
    'عطور': 'Perfumes',
    'عطر': 'Perfumes',
    'نظارات': 'Sunglasses',
    'شنط نسائية': "Women's Bags",
    'شنط رجالية': "Men's Bags",
    'شنط': 'Bags',
    'محافظ': 'Wallets',
    'اكسسوارات': 'Accessories',
    'إكسسوارات': 'Accessories',
    'بلايز': 'Tops / Blouses',
    'بناطيل': 'Pants',
    'بنطلون': 'Pants',
    'جاكيتات': 'Jackets',
    'فساتين': 'Dresses',
    'أطقم': 'Sets',
    'طقم': 'Set',
    'شنط ومحافظ': 'Bags & Wallets',
  };

  const mapHe = {
    'شنط ظهر ماركة': 'תיקי גב ממותגים',
    'شنطة ظهر ماركة': 'תיקי גב ממותגים',
    'أضف حديثاً': 'הגיעו לאחרונה',
    'أضيف حديثاً': 'הגיעו לאחרונה',
    'كعب / Heels': 'עקבים',
    'كعب': 'עקבים',
    'Urban Luxury - أطقم ساعات': 'סטים של שעונים - Urban Luxury',
    'أطقم ساعات': 'סטים של שעונים',
    'elegant أطقم': 'סטים אלגנטיים',
    'أطقم elegant': 'סטים אלגנטיים',
    'افرهول': 'אוברולים',
    'أفرهول': 'אוברולים',
    'بدلات بلوزه و شرط': 'סטים חולצה ומכנסיים',
    'بدلات بلوزة وشورت': 'סטים חולצה ומכנסיים',
    'سوارة + خاتم ( طقم )': 'סט צמיד וטבעת',
    'شنط وهدايا': 'תיקים ומתנות',
    'أحذية': 'נעליים',
    'ملابس رياضية': 'בגדי ספורט',
    'ساعات': 'שעונים',
    'عطور': 'בשמים',
    'عطر': 'בשמים',
    'نظارات': 'משקפי שמש',
    'شنط نسائية': 'תיקי נשים',
    'شنط رجالية': 'תיקי גברים',
    'شنط': 'תיקים',
    'محافظ': 'ארנקים',
    'اكسسوارات': 'אביזרים',
    'إكسسوارات': 'אביזרים',
    'بلايز': 'חולצות',
    'بناطيل': 'מכנסיים',
    'بنطلون': 'מכנסיים',
    'جاكيتات': "ז'קטים",
    'فساتين': 'שמלות',
    'أطقم': 'סטים',
    'طقم': 'סט',
    'شنط ومحافظ': 'תיקים וארנקים',
  };

  const targetMap = lang === 'en' ? mapEn : mapHe;
  const trimmed = name.trim();
  if (targetMap[trimmed]) return targetMap[trimmed];

  let result = trimmed;
  for (const [ar, trans] of Object.entries(targetMap)) {
    if (result === ar) return trans;
    if (result.includes(ar)) {
      result = result.replace(new RegExp(ar, 'g'), trans);
    }
  }
  return result;
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
