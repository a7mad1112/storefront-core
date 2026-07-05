export const SUPPLIERS_CONFIG = {
  gbstore: {
    code: 'gbstore',
    name_ar: 'جي بي ستور - الأزياء',
    name_en: 'GB Store - Fashion',
    name_he: 'ג׳י בי סטור - אופנה',
    icon: '👗',
    badge_ar: 'أزياء وموضة',
    badge_en: 'Fashion & Apparel',
    badge_he: 'אופנה וביגוד',
    description_ar: 'تشكيلة واسعة من أحدث الأزياء والملابس النسائية والرجالية والشنط والعطور بأفضل الأسعار.',
    description_en: 'A wide collection of the latest fashion, apparel, bags, and perfumes for men and women at the best prices.',
    description_he: 'מגוון רחב של אופנה וביגוד, תיקים ובשמים לגברים ולנשים במחירים הטובים ביותר.',
    themeColor: '#c59850', // Gold/Accent
    bgGradient: 'linear-gradient(135deg, #1f1d1a 0%, #2d2820 100%)',
    logo: '/logo.png',
  },
  balagan: {
    code: 'balagan',
    name_ar: 'بلاجان - الأحذية',
    name_en: 'Balagan - Shoes',
    name_he: 'בלאגן - נעליים',
    icon: '👟',
    badge_ar: 'أحذية وحقائب',
    badge_en: 'Shoes & Bags',
    badge_he: 'נעליים ותיקים',
    description_ar: 'أحدث صيحات الأحذية الرياضية والكلاسيكية والحقائب من ماركة بلاجان بجودة عالية وراحة فائقة.',
    description_en: 'The latest trends in sports and classic shoes and bags from Balagan with high quality and ultimate comfort.',
    description_he: 'הטרנדים החמים ביותר בנעלי ספורט ונעליים קלאסיות ותיקים מבלאגן באיכות גבוהה.',
    themeColor: '#2563eb', // Blue
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #1e3a8a 100%)',
    logo: null,
  },
  sakher: {
    code: 'sakher',
    name_ar: 'ساخر - الأزياء الرياضية',
    name_en: 'Sakher - Sportswear',
    name_he: 'סאחר - בגדי ספורט',
    icon: '🏃',
    badge_ar: 'ملابس رياضية',
    badge_en: 'Sportswear',
    badge_he: 'בגדי ספורט',
    description_ar: 'أطقم وملابس رياضية أصلية وعصرية من ساخر تناسب جميع الأنشطة الرياضية واليومية.',
    description_en: 'Authentic and modern sportswear and outfits from Sakher suitable for all athletic and daily activities.',
    description_he: 'בגדי ספורט וסטים מודרניים ואותנטיים מסאחר לכל הפעילויות.',
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
    name_ar: code ? `مورد (${code})` : 'كل الموردين',
    name_en: code ? `Supplier (${code})` : 'All Suppliers',
    name_he: code ? `ספק (${code})` : 'כל הספקים',
    icon: '🏪',
    badge_ar: 'مورد',
    badge_en: 'Supplier',
    badge_he: 'ספק',
    description_ar: 'تصفح جميع المنتجات المتوفرة من هذا المورد.',
    description_en: 'Browse all products available from this supplier.',
    description_he: 'עיין בכל המוצרים הזמינים מספק זה.',
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
