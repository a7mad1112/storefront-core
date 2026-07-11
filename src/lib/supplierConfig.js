export const SUPPLIERS_CONFIG = {
  gbstore: {
    code: 'gbstore',
    name_ar: 'قسم الشنط والهدايا',
    name_en: 'Bags & Gifts Section',
    name_he: 'מדור תיקים ומתנות',
    icon: '🎁',
    badge_ar: 'شنط وهدايا',
    badge_en: 'Bags & Gifts',
    badge_he: 'תיקים ומתנות',
    description_ar: 'تشكيلة واسعة من أحدث الأزياء والملابس النسائية والرجالية والشنط والعطور بأفضل الأسعار.',
    description_en: 'A wide collection of the latest fashion, apparel, bags, and perfumes for men and women at the best prices.',
    description_he: 'מגוון רחב של אופנה וביגוד, תיקים ובשמים לגברים ולנשים במחירים הטובים ביותר.',
    themeColor: '#c59850', // Gold/Accent
    bgGradient: 'linear-gradient(135deg, #1f1d1a 0%, #2d2820 100%)',
    logo: '/logo.png',
  },
  balagan: {
    code: 'balagan',
    name_ar: 'قسم الأحذية',
    name_en: 'Shoes Section',
    name_he: 'מדור נעליים',
    icon: '👟',
    badge_ar: 'أحذية',
    badge_en: 'Shoes',
    badge_he: 'נעליים',
    description_ar: 'أحدث صيحات الأحذية الرياضية والكلاسيكية والحقائب بجودة عالية وراحة فائقة.',
    description_en: 'The latest trends in sports and classic shoes, heels and comfortable sandals with high quality and ultimate comfort.',
    description_he: 'הטרנדים החמים ביותר בנעלי ספורט ונעליים קלאסיות, עקבים וסנדלים נוחים באיכות גבוהה.',
    themeColor: '#2563eb', // Blue
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #1e3a8a 100%)',
    logo: null,
  },
  sakher: {
    code: 'sakher',
    name_ar: 'قسم الملابس الرياضية',
    name_en: 'Sportswear Section',
    name_he: 'מדור ביגוד ספורט',
    icon: '🏃',
    badge_ar: 'ملابس رياضية',
    badge_en: 'Sportswear',
    badge_he: 'בגדי ספורט',
    description_ar: 'أطقم وملابس رياضية أصلية وعصرية تناسب جميع الأنشطة الرياضية واليومية.',
    description_en: 'Authentic and modern sportswear and outfits suitable for all athletic and daily activities.',
    description_he: 'בגדי ספורט וסטים מודרניים ואותנטיים לכל הפעילויות ויום יום.',
    themeColor: '#059669', // Green
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    logo: null,
  }
};

/**
 * Returns localized supplier metadata with fallbacks
 */
export function getSupplierConfig(code, lang = 'ar') {
  const config = SUPPLIERS_CONFIG[code] || {
    code: code || 'all',
    name_ar: 'قسم مميز',
    name_en: 'Featured Section',
    name_he: 'מדור מיוחד',
    icon: '🏬',
    badge_ar: 'قسم',
    badge_en: 'Section',
    badge_he: 'מדור',
    description_ar: 'تصفح جميع المنتجات المتوفرة في هذا القسم.',
    description_en: 'Browse all products available in this section.',
    description_he: 'עיין בכל המוצרים הזמינים במדור זה.',
    themeColor: '#c59850',
    bgGradient: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    logo: null,
  };

  return {
    ...config,
    name: lang === 'en' ? config.name_en : lang === 'he' ? config.name_he : config.name_ar,
    badge: lang === 'en' ? config.badge_en : lang === 'he' ? config.badge_he : config.badge_ar,
    description: lang === 'en' ? config.description_en : lang === 'he' ? config.description_he : config.description_ar,
  };
}
