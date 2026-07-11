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
 * Format option labels (e.g., خيار 1 -> Option 1 / אפשרות 1) based on locale
 */
export function formatOptionLabel(label, lang = 'ar') {
  if (!label) return '';
  if (lang === 'ar') return label;
  if (typeof label !== 'string') return String(label);

  let res = label;
  if (lang === 'en') {
    if (res === 'اللون') return 'Color';
    if (res === 'القياس' || res === 'المقاس') return 'Size';
    res = res.replace(/اللون|لون/g, 'Color');
    res = res.replace(/خيار/g, 'Option');
    res = res.replace(/صورة/g, 'Image');
    res = res.replace(/القياس|المقاس|قياس|مقاس/g, 'Size');
    res = res.replace(/نموذج/g, 'Model');
    res = res.replace(/شكل/g, 'Style');

    const colorsEn = {
      'أسود': 'Black', 'اسود': 'Black',
      'أبيض': 'White', 'ابيض': 'White',
      'أحمر': 'Red', 'احمر': 'Red',
      'أزرق': 'Blue', 'ازرق': 'Blue',
      'أخضر': 'Green', 'اخضر': 'Green',
      'أصفر': 'Yellow', 'اصفر': 'Yellow',
      'رمادي': 'Gray', 'رصاصي': 'Gray',
      'بني': 'Brown',
      'زهري': 'Pink', 'وردي': 'Pink',
      'بنفسجي': 'Purple',
      'برتقالي': 'Orange',
      'ذهبي': 'Gold',
      'فضي': 'Silver',
      'بيج': 'Beige',
      'كحلي': 'Navy',
      'عنابي': 'Burgundy',
      'شفاف': 'Clear',
    };
    for (const [arColor, enColor] of Object.entries(colorsEn)) {
      if (res === arColor) return enColor;
      res = res.replace(new RegExp(arColor, 'g'), enColor);
    }
    return res;
  } else if (lang === 'he') {
    if (res === 'اللون') return 'צבע';
    if (res === 'القياس' || res === 'المقاس') return 'מידה';
    res = res.replace(/اللون|لون/g, 'צבע');
    res = res.replace(/خيار/g, 'אפשרות');
    res = res.replace(/صورة/g, 'תמונה');
    res = res.replace(/القياس|المقاس|قياس|مقاس/g, 'מידה');
    res = res.replace(/نموذج/g, 'דגם');
    res = res.replace(/شكل/g, 'סגנון');

    const colorsHe = {
      'أسود': 'שחור', 'اسود': 'שחור',
      'أبيض': 'לבן', 'ابيض': 'לבן',
      'أحمر': 'אדום', 'احمر': 'אדום',
      'أزرق': 'כחול', 'ازرق': 'כחול',
      'أخضر': 'ירוק', 'اخضر': 'ירוק',
      'أصفر': 'צהוב', 'اصفر': 'צהוב',
      'رمادي': 'אפור', 'رصاصي': 'אפור',
      'بني': 'חום',
      'زهري': 'ורוד', 'وردي': 'ורוד',
      'بنفسجي': 'סגול',
      'برتقالي': 'כתום',
      'ذهبي': 'זהב',
      'فضي': 'כסף',
      'بيج': 'בז\'',
      'كحلي': 'כחול כהה',
      'عنابي': 'בורדו',
      'شفاف': 'שקוף',
    };
    for (const [arColor, heColor] of Object.entries(colorsHe)) {
      if (res === arColor) return heColor;
      res = res.replace(new RegExp(arColor, 'g'), heColor);
    }
    return res;
  }
  return label;
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
  if (dbName && dbName !== name && dbName.trim().length > 0 && !/[\u0600-\u06FF]/.test(dbName)) {
    return dbName;
  }

  const rawText = (typeof name === 'string' && name.trim()) ? name.trim() : (typeof dbName === 'string' && dbName.trim()) ? dbName.trim() : '';
  if (!rawText) return name || '';

  const mapEn = {
    'NEW COLLECTION': 'New Collection',
    'آضيف حديثا': 'New Arrivals',
    'آضيف حديثاً': 'New Arrivals',
    'أضف حديثاً': 'New Arrivals',
    'أضيف حديثاً': 'New Arrivals',
    'أضيف حديثا': 'New Arrivals',
    'اضيف حديثا': 'New Arrivals',
    'عرض 20-100 شيكل': '20-100 Shekels Offer',
    'سبورت': 'Sport',
    'نص السعر': 'Half Price',
    'اطقم elegant': 'Elegant Sets',
    'أطقم elegant': 'Elegant Sets',
    'elegant أطقم': 'Elegant Sets',
    'جزمات': 'Boots',
    'منتجات - Victoria Secret': "Victoria's Secret Products",
    'كلسات': 'Tights / Socks',
    'رسمي': 'Formal',
    'فساتين': 'Dresses',
    'Heels/ كعب': 'Heels',
    'Heels / كعب': 'Heels',
    'كعب / Heels': 'Heels',
    'كعب': 'Heels',
    'بدلات كم خفيف': 'Light Sleeve Suits',
    'شنط اطفال': 'Kids Bags',
    'شنط أطفال': 'Kids Bags',
    'شنط قش ماركة': 'Branded Straw Bags',
    'جاكيت': 'Jacket',
    'شنط سفري': 'Travel Bags',
    'شنط سفرية': 'Travel Bags',
    'مقاس صغير': 'Small Size',
    'مقاس كبير': 'Large Size',
    'عطور ( كوبي ماستر )': 'Perfumes (Master Copy)',
    'شيال': 'Suspenders / Straps',
    'جزدان ستاتي': "Women's Wallet",
    'عطور': 'Perfumes',
    'عطر': 'Perfumes',
    'شنط ستاتي وسط': "Medium Women's Bags",
    'كلاتش شبابي /  ستاتي ( شنطة صغيرة )': "Youth/Women's Clutch (Small Bag)",
    'كلاتش شبابي / ستاتي ( شنطة صغيرة )': "Youth/Women's Clutch (Small Bag)",
    'شنط لابتوب - حاسوب': 'Laptop & Computer Bags',
    'شنط عرض %': 'Bags Sale %',
    'بدلات 3 قطع': '3-Piece Suits',
    'طقم جاكيت و شرط و بلوزه': 'Jacket, Shorts & Blouse Set',
    'طقم جاكيت وشورت وبلوزة': 'Jacket, Shorts & Blouse Set',
    'قشاط ستاتي ماركة': "Branded Women's Belt",
    'ساعة ستاتي - PANDORA': "Women's Watch - PANDORA",
    'ساعة ستاتي - Cartier': "Women's Watch - Cartier",
    'ساعة ستاتي - Ck': "Women's Watch - CK",
    'بدلات بلوزه و شرط': 'Blouse & Shorts Sets',
    'بدلات بلوزة وشورت': 'Blouse & Shorts Sets',
    'كولكشن النظارات': 'Eyewear Collection',
    'معطر فرش': 'Bedding Perfume / Freshener',
    'ساعة ستاتي - Micheal Kors': "Women's Watch - Michael Kors",
    'ساعة ستاتي - Rolex': "Women's Watch - Rolex",
    'ساعة ستاتي - Dior': "Women's Watch - Dior",
    'أحذية - SHOES': 'Shoes',
    'أحذية': 'Shoes',
    'احذية': 'Shoes',
    'وكالة عطور - بديلة FRAGRANCE DELUXE': 'Fragrance Deluxe Alternative Perfumes',
    'ساعة ستاتي - Guess': "Women's Watch - Guess",
    'ساعة ستاتي - Chanel': "Women's Watch - Chanel",
    'ساعة ستاتي - Armani': "Women's Watch - Armani",
    'ساعة ستاتي - Rado': "Women's Watch - Rado",
    'ساعة ستاتي - Coach': "Women's Watch - Coach",
    'ساعة ستاتي - Boss': "Women's Watch - Boss",
    'ساعة ستاتي - DW': "Women's Watch - DW",
    'ساعة ستاتي - Fendi': "Women's Watch - Fendi",
    'ساعة ستاتي - Gucci': "Women's Watch - Gucci",
    'ساعة ستاتي - Swarovski': "Women's Watch - Swarovski",
    'ساعة ستاتي - Van Cleef': "Women's Watch - Van Cleef",
    'ساعة ستاتي - AP': "Women's Watch - AP",
    'ساعات كوبلز': 'Couples Watches',
    'آطقم ساعات - Urban Luxury': 'Watch Sets - Urban Luxury',
    'أطقم ساعات - Urban Luxury': 'Watch Sets - Urban Luxury',
    'Urban - أطقم ساعات Luxury': 'Watch Sets - Urban Luxury',
    'Urban Luxury - أطقم ساعات': 'Watch Sets - Urban Luxury',
    'أطقم ساعات': 'Watch Sets',
    'اطقم ساعات': 'Watch Sets',
    'طقم ساعة مع قداحة وسوارة': 'Watch, Lighter & Bracelet Set',
    'ساعة رجالي - Hublot': "Men's Watch - Hublot",
    'ساعة رجالي - G-Shock': "Men's Watch - G-Shock",
    'ساعة رجالي - Armani': "Men's Watch - Armani",
    'ساعة رجالي - Patek Philip': "Men's Watch - Patek Philippe",
    'ساعة رجالي - HUGO BOSS': "Men's Watch - HUGO BOSS",
    'ساعة رجالي - Daniel wellington': "Men's Watch - Daniel Wellington",
    'ساعة رجالي - ROLEX': "Men's Watch - ROLEX",
    'ساعة رجالي - RADO': "Men's Watch - RADO",
    'ساعة رجالي - Calvin Klein': "Men's Watch - Calvin Klein",
    'ساعة رجالي - Audemars Piguet': "Men's Watch - Audemars Piguet",
    'ساعة رجالي - Cartier': "Men's Watch - Cartier",
    'سبلاش - معطر جسم': 'Body Splash / Mist',
    'علبة كرتون + اكياس': 'Gift Box + Bags',
    'علبة كرتون + أكياس': 'Gift Box + Bags',
    'طواقي ماركة': 'Branded Hats / Caps',
    'اكسسوار شنطة - ملحقات -': 'Bag Accessories & Addons',
    'اكسسوار شنطة - ملحقات': 'Bag Accessories & Addons',
    'Smoking Area - منطقة التدخين': 'Smoking Area',
    'منطقة التدخين - Smoking Area': 'Smoking Area',
    'منطقة التدخين': 'Smoking Area',
    'ثيرموسات حرارية': 'Thermal Flasks / Thermoses',
    'وكالة - Miskana': 'Miskana Agency',
    'اكسسوار ستاتي': "Women's Accessories",
    'سنسال مفرد': 'Single Necklace',
    'سوارة بنجل': 'Bangle Bracelet',
    'طقم ( سنسال + حلق )': 'Set (Necklace + Earrings)',
    'خلخال': 'Anklet',
    'عطر مريم': 'Mary Perfume',
    'وكالة  مريم للإكسسوارات': 'Mary Accessories Agency',
    'وكالة مريم للإكسسوارات': 'Mary Accessories Agency',
    'اكسسوار موبايل': 'Mobile Accessories',
    'شنط ظهر ماركة': 'Branded Backpacks',
    'شنطة ظهر ماركة': 'Branded Backpacks',
    'باكيج هدية': 'Gift Package',
    'Hair Care - عناية بالشعر': 'Hair Care',
    'عناية بالشعر - Care': 'Hair Care',
    'عناية بالشعر': 'Hair Care',
    'قداحات شبابية': 'Youth Lighters',
    'اكسسوار شبابي': 'Youth Accessories',
    'بروش ماركة': 'Branded Brooch',
    'حلق سرة': 'Belly Button Ring',
    'اسوارة + خاتم ( طقم )': 'Bracelet & Ring Set',
    'سوارة + خاتم ( طقم )': 'Bracelet & Ring Set',
    'لفحات رجالية ماركة': "Branded Men's Scarves",
    'سليبر': 'Slippers',
    'بدلات سبورت صيفي': 'Summer Sport Suits',
    'شنط و جزادين ستاتي': "Women's Bags & Wallets",
    'بلايز ماركات': 'Branded Tops / T-Shirts',
    'بلايز ماركة': 'Branded Tops / T-Shirts',
    'طقم عطر': 'Perfume Set',
    'صندل': 'Sandals',
    'بدلات كم مبطن شتوي (فوتر )': 'Winter Padded Sleeve Suits',
    'طقم تنوره و بلوزه': 'Skirt & Blouse Set',
    'طقم تنورة وبلوزة': 'Skirt & Blouse Set',
    'بلاطين ماركة': 'Branded Pants',
    'محافظ شبابية ( جزدان )': 'Youth Wallets',
    'محافظ شبابية': 'Youth Wallets',
    'قمصان': 'Shirts',
    'افرهول': 'Jumpsuits / Overalls',
    'أفرهول': 'Jumpsuits / Overalls',
    'ساعات ستاتية': "Women's Watches",
    'ساعات رجالية': "Men's Watches",
    'خاتم مفرد': 'Single Ring',
    'اكسسوار': 'Accessories',
    'إكسسوار': 'Accessories',
    'اكسسوارات': 'Accessories',
    'إكسسوارات': 'Accessories',
    'سوارة رفيع': 'Thin Bracelet',
    'طقم ( سنسال + حلق + سوارة )': 'Set (Necklace + Earrings + Bracelet)',
    'حلق': 'Earrings',
    'اكسسوار ماركة': 'Branded Accessories',
    'شنط شبابية ( باوتش )': 'Youth Bags (Pouch)',
    'شنط شبابية': 'Youth Bags',
    'القسم الشبابي': 'Youth Section',
    'شماسي ماركة': 'Branded Umbrellas / Sunshades',
    'كولكشن الشتاء': 'Winter Collection',
    'طواقي شتوي ماركة': 'Branded Winter Hats',
    'شال كتف ماركة شتوي ستاتي': "Branded Women's Winter Shoulder Scarf",
    'شال كتف خريفي / ماركة': 'Autumn Shoulder Scarf / Branded',
    'شال كتف خريفي': 'Autumn Shoulder Scarf',
    'شال كتف': 'Shoulder Scarf',
    'تلبيقات شتوية ( شنطة + شال كتف )': 'Winter Sets (Bag + Shoulder Scarf)',
    'تلبيسات شتوية ( شنطة + شال كتف )': 'Winter Sets (Bag + Shoulder Scarf)',
    'تلبيقات شتوية ( Bags + Shoulder Scarf )': 'Winter Sets (Bag + Shoulder Scarf)',
    'تلبيسات شتوية ( Bags + Shoulder Scarf )': 'Winter Sets (Bag + Shoulder Scarf)',
    'تلبيقات شتوية': 'Winter Sets',
    'تلبيسات شتوية': 'Winter Sets',
    'شنط ستاتي كبير': "Large Women's Bags",
    'شنط وهدايا': 'Bags & Gifts',
    'ملابس رياضية': 'Sportswear',
    'ساعات': 'Watches',
    'نظارات': 'Sunglasses',
    'شنط نسائية': "Women's Bags",
    'شنط رجالية': "Men's Bags",
    'شنط ומحافظ': 'Bags & Wallets',
    'شنط': 'Bags',
    'بلايز': 'Tops / Blouses',
    'بناطيل': 'Pants',
    'بنطلون': 'Pants',
    'جاكيتات': 'Jackets',
    'أطقم': 'Sets',
    'اطقم': 'Sets',
    'طقم': 'Set',
    'ملحقات': 'Accessories / Addons',
    'ماركة': 'Brand',
  };

  const mapHe = {
    'NEW COLLECTION': 'קולקציה חדשה',
    'آضيف حديثا': 'הגיעו לאחרונה',
    'آضيف حديثاً': 'הגיעו לאחרונה',
    'أضف حديثاً': 'הגיעו לאחרונה',
    'أضيف حديثاً': 'הגיעו לאחרונה',
    'أضيف حديثا': 'הגיעו לאחרונה',
    'اضيف حديثا': 'הגיעו לאחרונה',
    'عرض 20-100 شيكل': 'מבצע 20-100 ש"ח',
    'سبورت': 'ספורט',
    'نص السعر': 'חצי מחיר',
    'اطقم elegant': 'סטים אלגנטיים',
    'أطقم elegant': 'סטים אלגנטיים',
    'elegant أطقم': 'סטים אלגנטיים',
    'جزمات': 'מגפיים',
    'منتجات - Victoria Secret': 'מוצרי ויקטוריה סיקרט',
    'كلسات': 'גרביונים / גרביים',
    'رسمي': 'רשמי',
    'فساتين': 'שמלות',
    'Heels/ كعب': 'עקבים',
    'Heels / كعب': 'עקבים',
    'كعب / Heels': 'עקבים',
    'كعب': 'עקבים',
    'بدلات كم خفيف': 'חליפות שרוול קל',
    'شنط اطفال': 'תיקי ילדים',
    'شنط أطفال': 'תיקי ילדים',
    'شنط قش ماركة': 'תיקי קש ממותגים',
    'جاكيت': "ז'קט",
    'شنط سفري': 'תיקי נסיעות',
    'شنط سفرية': 'תיקי נסיעות',
    'مقاس صغير': 'מידה קטנה',
    'مقاس كبير': 'מידה גדולה',
    'عطور ( كوبي ماستر )': 'בשמים (העתק מאסטר)',
    'شيال': 'כתפיות',
    'جزدان ستاتي': 'ארנק נשים',
    'عطور': 'בשמים',
    'عطر': 'בשמים',
    'شنط ستاتي وسط': 'תיקי נשים בינוניים',
    'كلاتش شبابي /  ستاتي ( شنطة صغيرة )': "תיק קלאץ' צעירים/נשים (תיק קטן)",
    'كلاتش شبابي / ستاتي ( شنطة صغيرة )': "תיק קלאץ' צעירים/נשים (תיק קטן)",
    'شنط لابتوب - حاسوب': 'תיקי מחשב ונייד',
    'شنط عرض %': 'מבצעי תיקים %',
    'بدلات 3 قطع': 'חליפות 3 חלקים',
    'طقم جاكيت و شرط و بلوزه': 'סט ז\'קט, מכנסיים קצרים וחולצה',
    'طقم جاكيت وشورت وبلوزة': 'סט ז\'קט, מכנסיים קצרים וחולצה',
    'قشاط ستاتي ماركة': 'חגורת נשים ממותגת',
    'ساعة ستاتي - PANDORA': 'שעון נשים - PANDORA',
    'ساعة ستاتي - Cartier': 'שעון נשים - Cartier',
    'ساعة ستاتي - Ck': 'שעון נשים - CK',
    'بدلات بلوزه و شرط': 'סטים חולצה ומכנסיים',
    'بدلات بلوزة وشورت': 'סטים חולצה ומכנסיים',
    'كولكشن النظارات': 'קולקציית משקפיים',
    'معطر فرش': 'מבסם בדים ומצעים',
    'ساعة ستاتي - Micheal Kors': 'שעון נשים - Michael Kors',
    'ساعة ستاتي - Rolex': 'שעון נשים - Rolex',
    'ساعة ستاتي - Dior': 'שעון נשים - Dior',
    'أحذية - SHOES': 'נעליים',
    'أحذية': 'נעליים',
    'احذية': 'נעליים',
    'وكالة عطور - بديلة FRAGRANCE DELUXE': 'בשמים חלופיים Fragrance Deluxe',
    'ساعة ستاتي - Guess': 'שעון נשים - Guess',
    'ساعة ستاتي - Chanel': 'שעון נשים - Chanel',
    'ساعة ستاتي - Armani': 'שעון נשים - Armani',
    'ساعة ستاتي - Rado': 'שעון נשים - Rado',
    'ساعة ستاتي - Coach': 'שעון נשים - Coach',
    'ساعة ستاتي - Boss': 'שעון נשים - Boss',
    'ساعة ستاتي - DW': 'שעון נשים - DW',
    'ساعة ستاتي - Fendi': 'שעון נשים - Fendi',
    'ساعة ستاتي - Gucci': 'שעון נשים - Gucci',
    'ساعة ستاتي - Swarovski': 'שעון נשים - Swarovski',
    'ساعة ستاتي - Van Cleef': 'שעון נשים - Van Cleef',
    'ساعة ستاتي - AP': 'שעון נשים - AP',
    'ساعات كوبلز': 'שעוני זוגות',
    'آطقم ساعات - Urban Luxury': 'סטים של שעונים - Urban Luxury',
    'أطقم ساعات - Urban Luxury': 'סטים של שעונים - Urban Luxury',
    'Urban - أطقم ساعات Luxury': 'סטים של שעונים - Urban Luxury',
    'Urban Luxury - أطقم ساعات': 'סטים של שעונים - Urban Luxury',
    'أطقم ساعات': 'סטים של שעונים',
    'اطقم ساعات': 'סטים של שעונים',
    'طقم ساعة مع قداحة وسوارة': 'סט שעון, מצית וצמיד',
    'ساعة رجالي - Hublot': 'שעון גברים - Hublot',
    'ساعة رجالي - G-Shock': 'שעון גברים - G-Shock',
    'ساعة رجالي - Armani': 'שעון גברים - Armani',
    'ساعة رجالي - Patek Philip': 'שעון גברים - Patek Philippe',
    'ساعة رجالي - HUGO BOSS': 'שעון גברים - HUGO BOSS',
    'ساعة رجالي - Daniel wellington': 'שעון גברים - Daniel Wellington',
    'ساعة رجالي - ROLEX': 'שעון גברים - ROLEX',
    'ساعة رجالي - RADO': 'שעון גברים - RADO',
    'ساعة رجالي - Calvin Klein': 'שעון גברים - Calvin Klein',
    'ساعة رجالي - Audemars Piguet': 'שעון גברים - Audemars Piguet',
    'ساعة رجالي - Cartier': 'שעון גברים - Cartier',
    'سبلاش - معطر جسم': 'תרסיס גוף (ספלאש)',
    'علبة كرتون + اكياس': 'קופסת מתנה + שקיות',
    'علبة كرتون + أكياس': 'קופסת מתנה + שקיות',
    'طواقي ماركة': 'כובעים ממותגים',
    'اكسسوار شنطة - ملحقات -': 'אביזרי תיקים ותוספות',
    'اكسسوار شنطة - ملحقات': 'אביזרי תיקים ותוספות',
    'Smoking Area - منطقة التدخين': 'אזור עישון',
    'منطقة التدخين - Smoking Area': 'אזור עישון',
    'منطقة التدخين': 'אזור עישון',
    'ثيرموسات حرارية': 'תרמוסים חמים',
    'وكالة - Miskana': 'סוכנות Miskana',
    'اكسسوار ستاتي': 'אביזרי נשים',
    'سنسال مفرد': 'שרשרת בודדת',
    'سوارة بنجل': 'צמיד בנגל',
    'طقم ( سنسال + حلق )': 'סט (שרשרת + עגילים)',
    'خلخال': 'צמידי קרסול',
    'عطر مريم': 'בושם מרים',
    'وكالة  مريم للإكسسوارات': 'סוכנות מרים לאביזרים',
    'وكالة مريم للإكسسوارات': 'סוכנות מרים לאביזרים',
    'اكسسوار موبايل': 'אביזרים לטלפון נייד',
    'شنط ظهر ماركة': 'תיקי גב ממותגים',
    'شنطة ظهر ماركة': 'תיקי גב ממותגים',
    'باكيج هدية': 'חבילת מתנה',
    'Hair Care - عناية بالشعر': 'טיפוח שיער',
    'عناية بالشعر - Care': 'טיפוח שיער',
    'عناية بالشعر': 'טיפוח שיער',
    'قداحات شبابية': 'מציתים לצעירים',
    'اكسسوار شبابي': 'אביזרי צעירים',
    'بروش ماركة': 'סיכה ממותגת (ברוש)',
    'حلق سرة': 'עגיל לטבור',
    'اسوارة + خاتم ( طقم )': 'סט צמיד וטבעת',
    'سوارة + خاتم ( طقم )': 'סט צמיד וטבעת',
    'لفحات رجالية ماركة': 'צעיפי גברים ממותגים',
    'سليبر': 'נעלי בית (סליפרס)',
    'بدلات سبورت صيفي': 'חליפות ספורט לקיץ',
    'شنط و جزادين ستاتي': 'תיקי נשים וארנקים',
    'بلايز ماركات': 'חולצות ממותגות',
    'بلايز ماركة': 'חולצות ממותגות',
    'طقم عطر': 'סט בשמים',
    'صندل': 'סנדלים',
    'بدلات كم مبطن شتوي (فوتر )': 'חליפות חורף מרופדות',
    'طقم تنوره ו بلوزه': 'סט חצאית וחולצה',
    'طقم تنورة ובלوزة': 'סט חצאית וחולצה',
    'بلاطين ماركة': 'מכנסיים ממותגים',
    'محافظ شبابية ( جزدان )': 'ארנקי צעירים',
    'محافظ شبابية': 'ארנקי צעירים',
    'قمصان': 'חולצות מכופתרות',
    'افرهول': 'אוברולים',
    'أفرهول': 'אוברולים',
    'ساعات ستاتية': 'שעוני נשים',
    'ساعات رجالية': 'שעוני גברים',
    'خاتم مفرد': 'טבעת בודדת',
    'اكسسوار': 'אביזרים',
    'إكسسوار': 'אביזרים',
    'اكسسوارات': 'אביזרים',
    'إكسسوارات': 'אביזרים',
    'سوارة رفيع': 'צמיד דק',
    'طقم ( سنسال + حلق + سوارة )': 'סט (שרשרת + עגילים + צמיד)',
    'حلق': 'עגילים',
    'اكسسوار ماركة': 'אביזרים ממותגים',
    'شنط شبابية ( باوتش )': "תיקי צעירים (פאוץ')",
    'شنط شبابية': 'תיקי צעירים',
    'القسم الشبابي': 'מחלקת צעירים',
    'شماسي ماركة': 'שמשיות/מטריות ממותגות',
    'كولكشن الشتاء': 'קולקציית חורף',
    'طواقي شتوي ماركة': 'כובעי חורף ממותגים',
    'شال كتف ماركة شتوي ستاتي': 'צעיף כתף חורפי ממותג לנשים',
    'شال كتف خريفي / ماركة': 'צעיף כתף לסתיו / ממותג',
    'شال كتف خريفي': 'צעיף כתף לסתיו',
    'شال كتف': 'צעיף כתף',
    'تلبيقات شتوية ( شنطة + شال كتف )': 'סטים לחורף (תיק + צעיף כתף)',
    'تلبيسات شتوية ( شنطة + شال كتف )': 'סטים לחורף (תיק + צעיף כתף)',
    'تلبيقات شتوية ( Bags + Shoulder Scarf )': 'סטים לחורף (תיק + צעיף כתף)',
    'تلبيسات شتوية ( Bags + Shoulder Scarf )': 'סטים לחורף (תיק + צעיף כתף)',
    'تلبيقات شتوية': 'סטים לחורף',
    'تلبيسات شتوية': 'סטים לחורף',
    'شنط ستاتي كبير': 'תיקי נשים גדולים',
    'شنط وهدايا': 'תיקים ומתנות',
    'ملابس رياضية': 'בגדי ספורט',
    'ساعات': 'שעונים',
    'نظارات': 'משקפי שמש',
    'شنط نسائية': 'תיקי נשים',
    'شنط رجالية': 'תיקי גברים',
    'شنط ומحافظ': 'תיקים וארנקים',
    'شنط': 'תיקים',
    'بلايز': 'חולצות',
    'بناطيل': 'מכנסיים',
    'بنطلون': 'מכנסיים',
    'جاكيتات': "ז'קטים",
    'أطقم': 'סטים',
    'اطقم': 'סטים',
    'طقم': 'סט',
    'ملحقات': 'תוספות',
    'ماركة': 'מותג',
  };

  const targetMap = lang === 'en' ? mapEn : mapHe;
  if (targetMap[rawText]) return targetMap[rawText];

  let result = rawText;
  const sortedEntries = Object.entries(targetMap).sort((a, b) => b[0].length - a[0].length);
  for (const [ar, trans] of sortedEntries) {
    if (result === ar) return trans;
    if (result.includes(ar)) {
      result = result.replace(new RegExp(ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), trans);
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
