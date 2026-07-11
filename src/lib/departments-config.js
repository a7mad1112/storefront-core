/**
 * GB Store — Departments Gateway Configuration & Showcase Loader
 *
 * This module organizes the store catalog into 4 major luxury departments
 * (Bags & Gifts, Shoes, Apparel & Sportswear, Perfumes/Watches/Accessories),
 * classifying categories and querying top products for each department.
 */

import { supabase } from './supabase.js';
import { getCategories, PUBLIC_PRODUCT_FIELDS } from './queries.js';

export async function getDepartmentsShowcaseData({ lang = 'ar', dict } = {}) {
  const t = dict?.departments || {};

  // 1. Fetch active categories and 4 department product batches in parallel
  const [categories, bagsProducts, shoesProducts, apparelProducts, perfumesProducts] = await Promise.all([
    getCategories(),
    supabase
      .from('public_products')
      .select(PUBLIC_PRODUCT_FIELDS)
      .or('category_name.ilike.%شنط%,category_name.ilike.%جزدان%,category_name.ilike.%محافظ%,category_name.ilike.%كلاتش%,category_name.ilike.%سفر%')
      .eq('is_available', true)
      .order('updated_at', { ascending: false })
      .limit(8)
      .then((res) => res.data || []),
    supabase
      .from('public_products')
      .select(PUBLIC_PRODUCT_FIELDS)
      .eq('supplier_code', 'balagan')
      .eq('is_available', true)
      .order('updated_at', { ascending: false })
      .limit(8)
      .then((res) => res.data || []),
    supabase
      .from('public_products')
      .select(PUBLIC_PRODUCT_FIELDS)
      .eq('supplier_code', 'sakher')
      .eq('is_available', true)
      .order('updated_at', { ascending: false })
      .limit(8)
      .then((res) => res.data || []),
    supabase
      .from('public_products')
      .select(PUBLIC_PRODUCT_FIELDS)
      .or('category_name.ilike.%عطر%,category_name.ilike.%ساع%,category_name.ilike.%اكسسوار%,category_name.ilike.%نظار%,category_name.ilike.%حلق%,category_name.ilike.%سنسال%,category_name.ilike.%خاتم%')
      .eq('is_available', true)
      .order('updated_at', { ascending: false })
      .limit(8)
      .then((res) => res.data || []),
  ]);

  // 2. Classify categories cleanly into each department
  const bagsCategories = categories.filter((c) => {
    const n = c.name || '';
    return (
      [
        'القسم الشبابي',
        'جزدان ستاتي',
        'شنط اطفال',
        'شنط ستاتي كبير',
        'شنط ستاتي وسط',
        'شنط سفرية',
        'شنط شبابية ( باوتش )',
        'شنط ظهر ماركة',
        'شنط قش ماركة',
        'شنط لابتوب - حاسوب',
        'شنط و جزادين ستاتي',
        'كلاتش شبابي /  ستاتي ( شنطة صغيرة )',
        'محافظ شبابية ( جزدان )',
        'باكيج هدية',
        'علبة كرتون + اكياس',
        'آضيف حديثا',
      ].includes(n) ||
      n.includes('شنط') ||
      n.includes('جزدان') ||
      n.includes('محافظ') ||
      n.includes('كلاتش') ||
      n.includes('هدية')
    );
  });

  const shoesCategories = categories.filter((c) => {
    const n = c.name || '';
    return (
      ['Heels/ كعب', 'صندل', 'سبورت', 'جزمات', 'سليبر', 'رسمي', 'كلسات'].includes(n) ||
      (c.slug && c.slug.includes('heels'))
    );
  });

  const apparelCategories = categories.filter((c) => {
    const n = c.name || '';
    return (
      [
        'NEW COLLECTION',
        'بدلات سبورت صيفي',
        'بدلات كم خفيف',
        'بدلات بلوزه و شرط',
        'بلايز ماركات',
        'بلاطين ماركة',
        'اطقم elegant',
        'طقم تنوره و بلوزه',
        'شيال',
        'جاكيت',
        'افرهول',
        'فساتين',
        'قمصان',
        'عرض 20-100 شيكل',
      ].includes(n) ||
      n.includes('بدلات') ||
      n.includes('بلايز') ||
      n.includes('طقم تنوره') ||
      n.includes('فساتين')
    );
  });

  const perfumesCategories = categories.filter((c) => {
    const n = c.name || '';
    return (
      [
        'آطقم ساعات - Urban Luxury',
        'اطقم ساعات',
        'اكسسوار',
        'اكسسوار شنطة - ملحقات -',
        'حلق',
        'حلق سرة',
        'خاتم مفرد',
        'خلخال',
        'ساعات رجالية',
        'ساعات ستاتية',
        'سنسال مفرد',
        'سوارة بنجل',
        'سوارة رفيع',
        'عطور',
        'عطور ( كوبي ماستر )',
        'قشاط ستاتي ماركة',
        'كولكشن النظارات',
        'وكالة  مريم للإكسسوارات',
        'وكالة عطور - بديلة FRAGRANCE DELUXE',
        'سبلاش - معطر جسم',
        'طقم عطر',
        'منتجات - Victoria Secret',
      ].includes(n) ||
      n.includes('عطر') ||
      n.includes('ساع') ||
      n.includes('اكسسوار') ||
      n.includes('نظار') ||
      n.includes('حلق') ||
      n.includes('سنسال') ||
      n.includes('خاتم')
    );
  });

  // 3. Build structured departments array
  const departments = [
    {
      id: 'bags-gifts',
      anchorId: 'dept-bags-gifts',
      icon: '👜',
      badge: t.bagsGiftsBadge || (lang === 'en' ? 'Most Popular 🎁' : lang === 'he' ? 'הכי מבוקש 🎁' : 'الأكثر طلباً 🎁'),
      title: t.bagsGiftsTitle || (lang === 'en' ? 'Luxury Bags, Wallets & Gifts' : lang === 'he' ? 'תיקי יוקרה, ארנקים ומתנות' : 'قسم الشنط الفاخرة، الهدايا والمحافظ'),
      subtitle: t.bagsGiftsDesc || (lang === 'en' ? 'Premium collection of handbags, backpacks, clutch bags, wallets and gift packages' : lang === 'he' ? 'קולקציית יוקרה של תיקי נשים, תיקי גב, ארנקים ומארזי מתנה מיוחדים' : 'تشكيلة فاخرة من الشنط الستاتية والشبابية، باوتش، أطقم الهدايا والمحافظ المميزة'),
      accentColor: '#C59850',
      bgGradient: 'linear-gradient(135deg, rgba(197, 152, 80, 0.16) 0%, rgba(30, 25, 18, 0.6) 100%)',
      cardBorder: 'rgba(197, 152, 80, 0.4)',
      viewAllHref: `/${lang}/categories?supplier=gbstore`,
      categories: bagsCategories.slice(0, 8),
      products: bagsProducts,
    },
    {
      id: 'shoes',
      anchorId: 'dept-shoes',
      icon: '👟',
      badge: t.shoesBadge || (lang === 'en' ? 'Season Hit 🔥' : lang === 'he' ? 'להיט העונה 🔥' : 'تشكيلة الموسم 🔥'),
      title: t.shoesTitle || (lang === 'en' ? 'Footwear, Heels, Sandals & Sneakers' : lang === 'he' ? 'נעליים, עקבים, סנדלים וסניקרס' : 'قسم الأحذية، الكعب، الصنادل والسليبر'),
      subtitle: t.shoesDesc || (lang === 'en' ? 'Latest sport sneakers, elegant high heels, comfort slippers and seasonal boots' : lang === 'he' ? 'סניקרס ספורט, עקבים אלגנטיים, כפכפים נוחים ומגפיים עונתיים' : 'أحدث موديلات الأحذية الرياضية، الصنادل الأنيقة، الكعب العالي والسليبر المريح'),
      accentColor: '#6366F1',
      bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(20, 20, 45, 0.6) 100%)',
      cardBorder: 'rgba(99, 102, 241, 0.4)',
      viewAllHref: `/${lang}/categories?supplier=balagan`,
      categories: shoesCategories.slice(0, 8),
      products: shoesProducts,
    },
    {
      id: 'apparel-sports',
      anchorId: 'dept-apparel-sports',
      icon: '🏃',
      badge: t.apparelBadge || (lang === 'en' ? 'New Arrival ✨' : lang === 'he' ? 'הגיע עכשיו ✨' : 'وصل حديثاً ✨'),
      title: t.apparelTitle || (lang === 'en' ? 'Apparel, Suits & Sportswear' : lang === 'he' ? 'אופנה, חליפות ובגדי ספורט' : 'قسم الأزياء، الأطقم والملابس الرياضية'),
      subtitle: t.apparelDesc || (lang === 'en' ? 'Summer and winter sportswear, branded shirts, trousers, jackets and elegant suits' : lang === 'he' ? 'בגדי ספורט לקיץ ולחורף, חולצות ממותגות, מכנסיים, ז\'קטים וחליפות' : 'بدلات رياضية صيفية وشتوية، بلايز وبلاطين ماركات وأطقم أزياء وفساتين راقية'),
      accentColor: '#10B981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(15, 35, 28, 0.6) 100%)',
      cardBorder: 'rgba(16, 185, 129, 0.4)',
      viewAllHref: `/${lang}/categories?supplier=sakher`,
      categories: apparelCategories.slice(0, 8),
      products: apparelProducts,
    },
    {
      id: 'perfumes-watches',
      anchorId: 'dept-perfumes-watches',
      icon: '🌸',
      badge: t.perfumesBadge || (lang === 'en' ? 'Luxury & Elegance 💎' : lang === 'he' ? 'יוקרה ואלגנטיות 💎' : 'فخامة وتميز 💎'),
      title: t.perfumesTitle || (lang === 'en' ? 'Luxury Perfumes, Watches & Jewelry' : lang === 'he' ? 'בשמי יוקרה, שעונים ותכשיטים' : 'قسم العطور الفاخرة، الساعات والاكسسوارات'),
      subtitle: t.perfumesDesc || (lang === 'en' ? 'Master quality perfumes, couples & luxury watch sets, fine jewelry and sunglasses' : lang === 'he' ? 'בשמי מאסטר קואליטי, שעוני זוגות ויוקרה, תכשיטים ומשקפי שמש' : 'عطور ماستر كوالتي فاخرة، أطقم ساعات ستاتية ورجالية، مجوهرات ونظارات شمسية'),
      accentColor: '#D946EF',
      bgGradient: 'linear-gradient(135deg, rgba(217, 70, 239, 0.16) 0%, rgba(38, 18, 40, 0.6) 100%)',
      cardBorder: 'rgba(217, 70, 239, 0.4)',
      viewAllHref: `/${lang}/categories?supplier=gbstore`,
      categories: perfumesCategories.slice(0, 8),
      products: perfumesProducts,
    },
  ];

  return departments;
}
