/**
 * GB Store — Supabase Query Helpers (Server-Side Only)
 *
 * All functions here query Supabase from the server.
 * Public product queries use the public anon client → no wholesale_price exposed.
 * Admin queries use supabaseAdmin (service role) → full access.
 */

import { supabase } from './supabase.js';
import { supabaseAdmin } from './supabase-server.js';
import { getSupportedSuppliers, isSupplierSupported } from './supplierConfig.js';

export const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || 'eloria';
export const SUPPORTED_SUPPLIERS = (process.env.NEXT_PUBLIC_SUPPORTED_SUPPLIERS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const PUBLIC_PRODUCT_FIELDS =
  'id, name, slug, description, image_url, additional_images, quantity, is_available, tags, category_id, category_name, category_slug, brand_id, brand_name, brand_slug, color_variants, retail_price, updated_at, name_en, name_he, description_en, description_he, supplier_code';

export function normalizeSupplierCode(code) {
  if (!code) return code;
  if (code === 'bags-gifts' || code === 'perfumes-watches') return 'gbstore';
  if (code === 'shoes') return 'balagan';
  if (code === 'apparel-sports') return 'sakher';
  return code;
}

export function getActiveSupportedSuppliers() {
  const list = getSupportedSuppliers();
  return list.length > 0 ? list : SUPPORTED_SUPPLIERS;
}

function applySupplierFilter(query, supplierCode = null) {
  const activeList = getActiveSupportedSuppliers();
  const norm = normalizeSupplierCode(supplierCode);
  if (norm && norm !== 'all') {
    if (activeList.length > 0 && !activeList.includes(norm)) {
      return query.eq('supplier_code', '__unsupported__');
    }
    return query.eq('supplier_code', norm);
  }
  if (activeList.length === 1) {
    return query.eq('supplier_code', activeList[0]);
  }
  if (activeList.length > 1) {
    return query.in('supplier_code', activeList);
  }
  return query;
}

/**
 * Helper to query catalog: uses public_products view for default store ('eloria'),
 * or dynamically calls get_store_products RPC for multi-tenant client isolation.
 */
function getCatalogTable(supplierCode = null, selectFields = PUBLIC_PRODUCT_FIELDS) {
  const norm = normalizeSupplierCode(supplierCode);
  if (STORE_ID === 'eloria') {
    let query = supabase.from('public_products').select(selectFields);
    return applySupplierFilter(query, norm);
  }
  const effectiveSupplier =
    norm && norm !== 'all'
      ? norm
      : SUPPORTED_SUPPLIERS.length === 1
        ? SUPPORTED_SUPPLIERS[0]
        : null;
  let query = supabase
    .rpc('get_store_products', {
      p_store_id: STORE_ID,
      p_supplier_code: effectiveSupplier,
    })
    .select(selectFields);
  return applySupplierFilter(query, norm);
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

/**
 * Fetch all active categories ordered by name.
 * Returns flat list; caller groups by parent_id if needed.
 */
function filterCategoriesByDepartment(categories, supplierCode) {
  if (!categories || !Array.isArray(categories) || !supplierCode) return categories;
  if (supplierCode === 'bags-gifts') {
    return categories.filter((c) => {
      const n = c.name || '';
      if (/عطر|ساع|نظار|طاقية|حلق|سنسال|خاتم|سبلاش|مريم|بخور|perfume|watch|sunglasses|glasses|hat|cap|necklace|earring|ring|splash/i.test(n)) {
        return false;
      }
      return true;
    });
  }
  if (supplierCode === 'perfumes-watches') {
    return categories.filter((c) => {
      const n = c.name || '';
      if (/شنط|جزدان|محافظ|كلاتش|باوتش|سفر|bag|wallet|backpack|clutch|luggage/i.test(n)) {
        return false;
      }
      return true;
    });
  }
  return categories;
}

function filterProductsByDepartment(products, supplierCode) {
  if (!products || !Array.isArray(products) || !supplierCode) return products;
  if (supplierCode === 'bags-gifts') {
    return products.filter((p) => {
      const n = (p.name || '') + ' ' + (p.category_name || '');
      return !/عطر|ساع|نظار|طاقية|حلق|سنسال|خاتم|سبلاش|بخور|perfume|watch|sunglasses|glasses|hat|cap|necklace|earring|ring|splash/i.test(n);
    });
  }
  if (supplierCode === 'perfumes-watches') {
    return products.filter((p) => {
      const n = (p.name || '') + ' ' + (p.category_name || '');
      return !/شنط|جزدان|محافظ|كلاتش|باوتش|سفرية|bag|wallet|backpack|clutch|luggage/i.test(n);
    });
  }
  return products;
}

export async function getCategories({ supplierCode = null } = {}) {
  let query = supabase
    .from('categories')
    .select('id, name, slug, parent_id, image_url, is_active, name_en, name_he')
    .eq('is_active', true)
    .order('name');

  query = applySupplierFilter(query, supplierCode);

  const { data, error } = await query;

  if (error) {
    console.error('[getCategories]', error.message);
    return [];
  }
  let cats = data ?? [];

  if (cats.length > 0) {
    const prodTableQuery = getCatalogTable(supplierCode, 'category_id, category_slug, category_name');
    const { data: prodCats } = await prodTableQuery.limit(2000);
    if (prodCats && prodCats.length > 0) {
      const activeCatIds = new Set(prodCats.map(p => p.category_id).filter(Boolean));
      const activeCatSlugs = new Set(prodCats.map(p => p.category_slug).filter(Boolean));
      const activeCatNames = new Set(prodCats.map(p => p.category_name).filter(Boolean));

      cats = cats.filter(c =>
        activeCatIds.has(c.id) || activeCatSlugs.has(c.slug) || activeCatNames.has(c.name) ||
        cats.some(child => child.parent_id === c.id && (activeCatIds.has(child.id) || activeCatSlugs.has(child.slug) || activeCatNames.has(child.name)))
      );
    }
  }

  cats = filterCategoriesByDepartment(cats, supplierCode);

  return cats;
}

/**
 * Build a nested tree from flat categories array.
 * Top-level categories have parent_id = null.
 */
export function buildCategoryTree(categories) {
  const map = {};
  const roots = [];

  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });

  categories.forEach((cat) => {
    if (cat.parent_id && map[cat.parent_id]) {
      map[cat.parent_id].children.push(map[cat.id]);
    } else {
      roots.push(map[cat.id]);
    }
  });

  return roots;
}

/**
 * Fetch a single category by slug.
 */
export async function getCategoryBySlug(slugOrId, { supplierCode = null } = {}) {
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId);
  const norm = normalizeSupplierCode(supplierCode);

  const applyCatSupplier = (q) => {
    if (norm && norm !== 'all') {
      return q.eq('supplier_code', norm);
    }
    return q;
  };

  // 1. Try match by slug
  let query1 = supabase
    .from('categories')
    .select('id, name, slug, parent_id, image_url, supplier_code, name_en, name_he')
    .eq('slug', decoded)
    .eq('is_active', true);
  query1 = applyCatSupplier(query1);
  let { data: matches } = await query1;

  let data = null;
  if (matches && matches.length > 0) {
    if (matches.length === 1) {
      data = matches[0];
    } else {
      // If multiple categories share the same slug (e.g. across suppliers), pick the one that actually has products
      const prodQuery = getCatalogTable(norm, 'category_id');
      const { data: prods } = await prodQuery.in('category_id', matches.map(m => m.id)).limit(500);
      const activeIds = new Set((prods || []).map(p => p.category_id));
      data = matches.find(m => activeIds.has(m.id)) || matches[0];
    }
  }

  // 2. Try match by supplier_id / custom code
  if (!data) {
    let query2 = supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url, supplier_code, name_en, name_he')
      .eq('supplier_id', decoded)
      .eq('is_active', true);
    query2 = applyCatSupplier(query2);
    const res = await query2.maybeSingle();
    data = res.data;
  }

  // 3. Try match by UUID (id)
  if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)) {
    let query3 = supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url, supplier_code, name_en, name_he')
      .eq('id', decoded)
      .eq('is_active', true);
    query3 = applyCatSupplier(query3);
    const res = await query3.maybeSingle();
    data = res.data;
  }

  // 4. Try match by exact name
  if (!data) {
    let query4 = supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url, supplier_code, name_en, name_he')
      .eq('name', decoded)
      .eq('is_active', true);
    query4 = applyCatSupplier(query4);
    const res = await query4.maybeSingle();
    data = res.data;
  }

  // 5. Try match by partial slug or name
  if (!data) {
    let query5 = supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url, supplier_code, name_en, name_he')
      .or(`slug.ilike.%${decoded}%,name.ilike.%${decoded}%`)
      .eq('is_active', true);
    query5 = applyCatSupplier(query5);
    const res = await query5.limit(1).maybeSingle();
    data = res.data;
  }

  // 6. Fallback: find dynamically from active products if category row is missing
  if (!data) {
    const tableQuery = getCatalogTable(norm, 'category_id, category_name, category_slug');
    const { data: prodData } = await tableQuery
      .or(`category_slug.eq.${decoded},category_name.ilike.%${decoded}%,category_id.eq.${decoded}`)
      .limit(1)
      .maybeSingle();
    if (prodData) {
      data = {
        id: prodData.category_id || decoded,
        name: prodData.category_name || decoded,
        slug: prodData.category_slug || decoded,
        parent_id: null,
        image_url: null,
      };
    }
  }

  return data || null;
}

/**
 * Fetch subcategories for a given parent category ID.
 */
export async function getSubcategories(parentId, { supplierCode = null } = {}) {
  let query = supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .eq('parent_id', parentId)
    .eq('is_active', true)
    .order('name');

  query = applySupplierFilter(query, supplierCode);

  const { data, error } = await query;

  if (error) {
    console.error('[getSubcategories]', error.message);
    return [];
  }
  let cats = data ?? [];

  if (cats.length > 0) {
    const prodTableQuery = getCatalogTable(supplierCode, 'category_id, category_slug, category_name');
    const { data: prodCats } = await prodTableQuery.limit(2000);
    if (prodCats && prodCats.length > 0) {
      const activeCatIds = new Set(prodCats.map(p => p.category_id).filter(Boolean));
      const activeCatSlugs = new Set(prodCats.map(p => p.category_slug).filter(Boolean));
      const activeCatNames = new Set(prodCats.map(p => p.category_name).filter(Boolean));

      cats = cats.filter(c =>
        activeCatIds.has(c.id) || activeCatSlugs.has(c.slug) || activeCatNames.has(c.name)
      );
    }
  }

  return cats;
}

// ─────────────────────────────────────────────
// BRANDS (Brand Normalizer Engine)
// ─────────────────────────────────────────────

const KNOWN_BRANDS = [
  { id: 'nike', slug: 'nike', name: 'Nike / نايك', name_en: 'Nike', name_he: 'נייק', syns: ['nike', 'نايك', 'نيكي'], regex: /\bnike\b|نايك|نيكي/i },
  { id: 'adidas', slug: 'adidas', name: 'Adidas / أديداس', name_en: 'Adidas', name_he: 'אדידס', syns: ['adidas', 'اديداس', 'أديداس'], regex: /\badidas\b|اديداس|أديداس/i },
  { id: 'gucci', slug: 'gucci', name: 'Gucci / جوتشي', name_en: 'Gucci', name_he: 'גוצ׳י', syns: ['gucci', 'جوتشي', 'غوتشي', 'قوتشي'], regex: /\bgucci\b|جوتشي|غوتشي|قوتشي/i },
  { id: 'chanel', slug: 'chanel', name: 'Chanel / شانيل', name_en: 'Chanel', name_he: 'שאנל', syns: ['chanel', 'شانيل'], regex: /\bchanel\b|شانيل/i },
  { id: 'dior', slug: 'dior', name: 'Dior / ديور', name_en: 'Dior', name_he: 'דיור', syns: ['dior', 'ديور'], regex: /\bdior\b|ديور/i },
  { id: 'hermes', slug: 'hermes', name: 'Hermes / ايرمس', name_en: 'Hermes', name_he: 'הרמס', syns: ['hermes', 'ايرمس', 'هيرمس', 'أيرمس'], regex: /\bhermes\b|ايرمس|هيرمس|أيرمس/i },
  { id: 'prada', slug: 'prada', name: 'Prada / برادا', name_en: 'Prada', name_he: 'פראדה', syns: ['prada', 'برادا'], regex: /\bprada\b|برادا/i },
  { id: 'cartier', slug: 'cartier', name: 'Cartier / كارتييه', name_en: 'Cartier', name_he: 'קרטייה', syns: ['cartier', 'كارتييه', 'كارتيه'], regex: /\bcartier\b|كارتييه|كارتيه/i },
  { id: 'rolex', slug: 'rolex', name: 'Rolex / رولكس', name_en: 'Rolex', name_he: 'רולקס', syns: ['rolex', 'رولكس'], regex: /\brolex\b|رولكس/i },
  { id: 'louis-vuitton', slug: 'louis-vuitton', name: 'Louis Vuitton / لويس فيتون', name_en: 'Louis Vuitton', name_he: 'לואי ויטון', syns: ['louis vuitton', 'لويس فيتون', 'فيتون'], regex: /\blouis vuitton\b|لويس فيتون|فيتون/i },
  { id: 'versace', slug: 'versace', name: 'Versace / فرساتشي', name_en: 'Versace', name_he: 'ורסאצ׳י', syns: ['versace', 'فرساتشي', 'فيرساتشي'], regex: /\bversace\b|فرساتشي|فيرساتشي/i },
  { id: 'new-balance', slug: 'new-balance', name: 'New Balance / نيو بالانس', name_en: 'New Balance', name_he: 'ניו באלנס', syns: ['new balance', 'نيو بالانس'], regex: /\bnew balance\b|نيو بالانس/i },
  { id: 'jordan', slug: 'jordan', name: 'Jordan / جوردن', name_en: 'Jordan', name_he: 'ג׳ורדן', syns: ['jordan', 'جوردن', 'جوردان'], regex: /\bjordan\b|جوردن|جوردان/i },
  { id: 'puma', slug: 'puma', name: 'Puma / بوما', name_en: 'Puma', name_he: 'פומה', syns: ['puma', 'بوما'], regex: /\bpuma\b|بوما/i },
  { id: 'diesel', slug: 'diesel', name: 'Diesel / ديزل', name_en: 'Diesel', name_he: 'דיזל', syns: ['diesel', 'ديزل'], regex: /\bdiesel\b|ديزل/i },
  { id: 'zara', slug: 'zara', name: 'Zara / زارا', name_en: 'Zara', name_he: 'זארה', syns: ['zara', 'زارا'], regex: /\bzara\b|زارا/i },
  { id: 'lacoste', slug: 'lacoste', name: 'Lacoste / لاكوست', name_en: 'Lacoste', name_he: 'לקוסט', syns: ['lacoste', 'لاكوست', 'لاكاوست'], regex: /\blacoste\b|لاكوست|لاكاوست/i },
  { id: 'calvin-klein', slug: 'calvin-klein', name: 'Calvin Klein / كالفن كلاين', name_en: 'Calvin Klein', name_he: 'קלבין קליין', syns: ['calvin klein', 'كالفن كلاين'], regex: /\bcalvin klein\b|كالفن كلاين/i },
  { id: 'michael-kors', slug: 'michael-kors', name: 'Michael Kors / مايكل كورس', name_en: 'Michael Kors', name_he: 'מייקל קורס', syns: ['michael kors', 'مايكل كورس'], regex: /\bmichael kors\b|مايكل كورس/i },
  { id: 'lattafa', slug: 'lattafa', name: 'Lattafa / لطافة', name_en: 'Lattafa', name_he: 'לטאפה', syns: ['lattafa', 'لطافة'], regex: /\blattafa\b|لطافة/i },
  { id: 'fragrance-deluxe', slug: 'fragrance-deluxe', name: 'Fragrance Deluxe / فرغرانس ديلوكس', name_en: 'Fragrance Deluxe', name_he: 'פרגרנס דה לוקס', syns: ['fragrance deluxe', 'فرغرانس ديلوكس', 'كوبي ماستر'], regex: /fragrance deluxe|فرغرانس ديلوكس|كوبي ماستر/i },
  { id: 'fendi', slug: 'fendi', name: 'Fendi / فيندي', name_en: 'Fendi', name_he: 'פנדי', syns: ['fendi', 'فيندي'], regex: /\bfendi\b|فيندي/i },
  { id: 'burberry', slug: 'burberry', name: 'Burberry / بربري', name_en: 'Burberry', name_he: 'ברברי', syns: ['burberry', 'بربري'], regex: /\bburberry\b|بربري/i },
  { id: 'yves-saint-laurent', slug: 'yves-saint-laurent', name: 'YSL / سان لوران', name_en: 'YSL', name_he: 'איב סאן לורן', syns: ['ysl', 'yves saint laurent', 'سان لوران', 'واي اس ال'], regex: /\bysl\b|yves saint laurent|سان لوران/i },
  { id: 'balenciaga', slug: 'balenciaga', name: 'Balenciaga / بلنسياغا', name_en: 'Balenciaga', name_he: 'בלנסיאגה', syns: ['balenciaga', 'بلنسياغا'], regex: /\bbalenciaga\b|بلنسياغا/i },
  { id: 'vans', slug: 'vans', name: 'Vans / فانز', name_en: 'Vans', name_he: 'וואנס', syns: ['vans', 'فانز'], regex: /\bvans\b|فانز/i },
  { id: 'skechers', slug: 'skechers', name: 'Skechers / سكيتشرز', name_en: 'Skechers', name_he: 'סקיצ׳רס', syns: ['skechers', 'سكيتشرز'], regex: /\bskechers\b|سكيتشرز/i }
];

/**
 * Fetch all active brands ordered by name.
 */
export async function getBrands({ supplierCode = null } = {}) {
  let query = supabase
    .from('brands')
    .select('id, name, slug, image_url, is_active')
    .eq('is_active', true)
    .order('name');

  query = applySupplierFilter(query, supplierCode);

  const { data, error } = await query;
  if (error) {
    console.error('[getBrands]', error.message);
  }
  let brandsMap = new Map();
  if (data && data.length > 0) {
    data.forEach(b => brandsMap.set(b.slug || b.id, b));
  }

  const prodTableQuery = getCatalogTable(supplierCode, 'id, name, brand_id, brand_slug, brand_name');
  const { data: prodBrands } = await prodTableQuery.limit(2000);
  if (prodBrands && prodBrands.length > 0) {
    prodBrands.forEach(p => {
      if (p.brand_name) {
        const bSlug = p.brand_slug || p.brand_name.toLowerCase().trim().replace(/\s+/g, '-');
        if (!brandsMap.has(bSlug)) {
          brandsMap.set(bSlug, {
            id: p.brand_id || bSlug,
            name: p.brand_name,
            slug: bSlug,
            image_url: null,
            is_active: true
          });
        }
      }
      for (const kb of KNOWN_BRANDS) {
        if (kb.regex.test(p.name || '') || kb.regex.test(p.brand_name || '')) {
          if (!brandsMap.has(kb.slug)) {
            brandsMap.set(kb.slug, {
              id: kb.slug,
              name: kb.name,
              name_en: kb.name_en,
              name_he: kb.name_he,
              slug: kb.slug,
              image_url: null,
              is_active: true
            });
          }
        }
      }
    });

    const activeBrands = [];
    for (const b of brandsMap.values()) {
      const kb = KNOWN_BRANDS.find(k => k.slug === b.slug || k.id === b.id);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(b.id));
      const syns = kb ? kb.syns : [b.name, b.slug].filter(Boolean);

      const hasProd = prodBrands.some(p => {
        if (isUUID && p.brand_id === b.id) return true;
        if (p.brand_slug && p.brand_slug === b.slug) return true;
        const pName = p.name || '';
        const pBrand = p.brand_name || '';
        return syns.some(s => {
          const regex = new RegExp(`(^|[^a-zA-Z0-9\u0600-\u06FF])${s}($|[^a-zA-Z0-9\u0600-\u06FF])`, 'i');
          return regex.test(pName) || regex.test(pBrand) || pName.toLowerCase().includes(String(s).toLowerCase()) || pBrand.toLowerCase().includes(String(s).toLowerCase());
        });
      });

      if (hasProd) {
        activeBrands.push(b);
      }
    }
    return activeBrands.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  return Array.from(brandsMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Fetch a single brand by slug, supplier_id, or UUID.
 */
export async function getBrandBySlug(slugOrId, { supplierCode = null } = {}) {
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId);
  const norm = normalizeSupplierCode(supplierCode);

  const applyBrandSupplier = (q) => {
    if (norm && norm !== 'all') {
      return q.eq('supplier_code', norm);
    }
    return q;
  };

  let query1 = supabase
    .from('brands')
    .select('id, name, slug, image_url, supplier_code')
    .eq('slug', decoded)
    .eq('is_active', true);
  query1 = applyBrandSupplier(query1);
  let { data: matches } = await query1;

  let data = null;
  if (matches && matches.length > 0) {
    if (matches.length === 1) {
      data = matches[0];
    } else {
      const prodQuery = getCatalogTable(norm, 'brand_id');
      const { data: prods } = await prodQuery.in('brand_id', matches.map(m => m.id)).limit(500);
      const activeIds = new Set((prods || []).map(p => p.brand_id));
      data = matches.find(m => activeIds.has(m.id)) || matches[0];
    }
  }

  if (!data) {
    let query2 = supabase
      .from('brands')
      .select('id, name, slug, image_url, supplier_code')
      .eq('supplier_id', decoded)
      .eq('is_active', true);
    query2 = applyBrandSupplier(query2);
    const res = await query2.maybeSingle();
    data = res.data;
  }

  if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)) {
    let query3 = supabase
      .from('brands')
      .select('id, name, slug, image_url, supplier_code')
      .eq('id', decoded)
      .eq('is_active', true);
    query3 = applyBrandSupplier(query3);
    const res = await query3.maybeSingle();
    data = res.data;
  }

  if (!data) {
    const kb = KNOWN_BRANDS.find(b => b.slug === decoded.toLowerCase() || b.id === decoded.toLowerCase() || b.name.toLowerCase() === decoded.toLowerCase() || b.syns.some(s => s.toLowerCase() === decoded.toLowerCase()));
    if (kb) {
      data = {
        id: kb.slug,
        name: kb.name,
        name_en: kb.name_en,
        name_he: kb.name_he,
        slug: kb.slug,
        image_url: null
      };
    }
  }

  if (!data) {
    const tableQuery = getCatalogTable(norm, 'brand_id, brand_name, brand_slug');
    const { data: prodData } = await tableQuery
      .or(`brand_slug.eq.${decoded},brand_name.ilike.%${decoded}%`)
      .limit(1)
      .maybeSingle();
    if (prodData) {
      data = {
        id: prodData.brand_id || decoded,
        name: prodData.brand_name || decoded,
        slug: prodData.brand_slug || decoded,
        image_url: null
      };
    }
  }

  return data || null;
}

/**
 * Fetch products belonging to a brand (from public_products view).
 */
export async function getProductsForBrand(brandId, { limit = 48, offset = 0, sort = 'default', supplierCode = null } = {}) {
  const decoded = decodeURIComponent(brandId);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);

  const kb = KNOWN_BRANDS.find(b => b.slug === decoded.toLowerCase() || b.id === decoded.toLowerCase() || b.name.toLowerCase() === decoded.toLowerCase());

  let orClauses = [];
  if (isUUID) {
    orClauses.push(`brand_id.eq.${decoded}`);
  }
  orClauses.push(`brand_slug.eq.${decoded}`);
  orClauses.push(`brand_name.ilike.%${decoded}%`);

  if (kb) {
    kb.syns.forEach(syn => {
      orClauses.push(`name.ilike.%${syn}%`);
      orClauses.push(`brand_name.ilike.%${syn}%`);
    });
  } else if (!isUUID) {
    orClauses.push(`name.ilike.%${decoded}%`);
  }

  let query = getCatalogTable(supplierCode)
    .or(orClauses.join(','))
    .range(offset, offset + limit - 1);

  query = applySortOrder(query, sort);

  const { data, error } = await query;
  if (error) {
    console.error('[getProductsForBrand]', error.message);
    return [];
  }
  return filterProductsByDepartment(data ?? [], supplierCode);
}

// ─────────────────────────────────────────────
// PRODUCTS (public — no wholesale_price)
// ─────────────────────────────────────────────

/**
 * Apply sort order to a Supabase query.
 */
function applySortOrder(query, sort) {
  switch (sort) {
    case 'price_asc':
      return query.order('retail_price', { ascending: true });
    case 'price_desc':
      return query.order('retail_price', { ascending: false });
    default:
      return query.order('updated_at', { ascending: false });
  }
}

/**
 * Fetch products from the public_products view.
 * Supports pagination, category filtering, and sorting.
 */
export async function getProducts({ categoryId, limit = 24, offset = 0, sort = 'default', supplierCode = null } = {}) {
  let query = getCatalogTable(supplierCode)
    .range(offset, offset + limit - 1);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  query = applySortOrder(query, sort);

  const { data, error } = await query;

  if (error) {
    console.error('[getProducts]', error.message);
    return [];
  }
  return filterProductsByDepartment(data ?? [], supplierCode);
}

/**
 * Fetch all products in a category subtree (category + all its subcategories).
 */
export async function getProductsForCategory(categoryId, { limit = 24, offset = 0, sort = 'default', supplierCode = null } = {}) {
  // First get subcategory IDs
  const { data: subs } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', categoryId)
    .eq('is_active', true);

  const ids = [categoryId, ...(subs ?? []).map((s) => s.id)];

  let query = getCatalogTable(supplierCode)
    .in('category_id', ids)
    .range(offset, offset + limit - 1);

  query = applySortOrder(query, sort);

  const { data, error } = await query;

  if (error) {
    console.error('[getProductsForCategory]', error.message);
    return [];
  }
  return filterProductsByDepartment(data ?? [], supplierCode);
}

/**
 * Fetch a single product by ID from the public_products view.
 */
export async function getProductById(idOrSlug) {
  if (!idOrSlug) return null;
  const decoded = decodeURIComponent(idOrSlug);

  // 1. Try match by UUID id
  let { data } = await getCatalogTable()
    .eq('id', decoded)
    .maybeSingle();

  // 2. Try match by slug
  if (!data) {
    const res = await getCatalogTable()
      .eq('slug', decoded)
      .maybeSingle();
    data = res.data;
  }

  return data || null;
}

/**
 * Full-text search across product names and tags.
 */
export async function searchProducts(query, { limit = 30, supplierCode = null } = {}) {
  if (!query || query.trim().length < 1) return [];

  const { data, error } = await getCatalogTable(supplierCode)
    .ilike('name', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[searchProducts]', error.message);
    return [];
  }
  return data ?? [];
}

// ─────────────────────────────────────────────
// ADMIN — Products with wholesale prices
// ─────────────────────────────────────────────

export async function getAdminProducts({ limit = 50, offset = 0, supplierCode = null, search = null } = {}) {
  const norm = normalizeSupplierCode(supplierCode);
  let query = supabaseAdmin
    .from('products')
    .select('id, supplier_id, supplier_code, name, wholesale_price, quantity, is_active, is_available, image_url, category_id, brand_id, updated_at', { count: 'exact' });

  query = applySupplierFilter(query, supplierCode);

  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,supplier_id.ilike.%${search.trim()}%`);
  }

  const [productsRes, marginsRes] = await Promise.all([
    query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1),
    supabaseAdmin.from('margins').select('category_id, margin_type, margin_value').eq('store_id', STORE_ID),
  ]);

  if (productsRes.error) {
    console.error('[getAdminProducts]', productsRes.error.message);
    return { products: [], totalCount: 0 };
  }

  const marginsMap = {};
  for (const m of (marginsRes.data || [])) {
    marginsMap[m.category_id] = m;
  }

  const products = (productsRes.data || []).map((p) => {
    const m = marginsMap[p.category_id];
    const wholesale = Number(p.wholesale_price) || 0;
    let retail = wholesale * 1.2; // default 20%
    if (m) {
      if (m.margin_type === 'percentage') {
        retail = wholesale * (1 + Number(m.margin_value) / 100);
      } else if (m.margin_type === 'fixed') {
        retail = wholesale + Number(m.margin_value);
      }
    }
    return {
      ...p,
      retail_price: Math.round(retail * 10) / 10,
    };
  });

  return {
    products,
    totalCount: productsRes.count ?? products.length,
  };
}

// ─────────────────────────────────────────────
// ADMIN — Availability Overrides
// ─────────────────────────────────────────────

/**
 * Fetch all availability overrides.
 * Returns a map of product_supplier_id → override record.
 */
export async function getAvailabilityOverrides() {
  const { data, error } = await supabaseAdmin
    .from('product_availability_overrides')
    .select('id, product_supplier_id, is_available, override_reason, overridden_by, updated_at')
    .eq('store_id', STORE_ID);

  if (error) {
    console.error('[getAvailabilityOverrides]', error.message);
    return {};
  }

  // Convert to a map keyed by product_supplier_id for easy lookup
  const map = {};
  for (const row of (data ?? [])) {
    map[row.product_supplier_id] = row;
  }
  return map;
}

/**
 * Upsert an availability override for a product.
 */
export async function upsertAvailabilityOverride(productSupplierId, isAvailable, reason = null, overriddenBy = null) {
  const { error } = await supabaseAdmin
    .from('product_availability_overrides')
    .upsert(
      {
        store_id: STORE_ID,
        product_supplier_id: productSupplierId,
        is_available: isAvailable,
        override_reason: reason,
        overridden_by: overriddenBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'store_id,product_supplier_id' }
    );

  if (error) {
    console.error('[upsertAvailabilityOverride]', error.message);
    throw error;
  }
}

/**
 * Delete an availability override (revert to supplier-driven).
 */
export async function deleteAvailabilityOverride(productSupplierId) {
  const { error } = await supabaseAdmin
    .from('product_availability_overrides')
    .delete()
    .eq('store_id', STORE_ID)
    .eq('product_supplier_id', productSupplierId);

  if (error) {
    console.error('[deleteAvailabilityOverride]', error.message);
    throw error;
  }
}

// ─────────────────────────────────────────────
// ADMIN — Sync Logs
// ─────────────────────────────────────────────

export async function getSyncLogs({ limit = 10 } = {}) {
  const { data, error } = await supabaseAdmin
    .from('sync_logs')
    .select('id, started_at, completed_at, status, products_added, products_updated, products_deleted, categories_found, error_message')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getSyncLogs]', error.message);
    return [];
  }
  return data ?? [];
}

// ─────────────────────────────────────────────
// ADMIN — Margins
// ─────────────────────────────────────────────

export async function getMarginsWithCategories(supplierCode = null) {
  // Include supplier_code so the UI can group/filter categories by supplier.
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, parent_id, supplier_code, margins(id, margin_type, margin_value, store_id)')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[getMarginsWithCategories]', error.message);
    return [];
  }
  let cats = (data ?? []).map((cat) => ({
    ...cat,
    margins: (cat.margins || []).filter((m) => !m.store_id || m.store_id === STORE_ID),
  }));

  if (cats.length > 0) {
    let prodQuery = supabaseAdmin.from('products').select('category_id, supplier_code');
    // When filtering by specific supplier, restrict to that supplier's products.
    const norm = normalizeSupplierCode(supplierCode);
    if (norm && norm !== 'all') {
      prodQuery = prodQuery.eq('supplier_code', norm);
    } else {
      prodQuery = applySupplierFilter(prodQuery, null);
    }
    const { data: prodCats } = await prodQuery;
    if (prodCats && prodCats.length > 0) {
      const activeCatIds = new Set(prodCats.map((p) => p.category_id).filter(Boolean));
      cats = cats.filter((c) => activeCatIds.has(c.id) || cats.some((child) => child.parent_id === c.id && activeCatIds.has(child.id)));
    } else {
      cats = [];
    }
  }

  // If a specific supplier is requested, filter categories to that supplier only.
  const norm = normalizeSupplierCode(supplierCode);
  if (norm && norm !== 'all') {
    cats = cats.filter((c) => c.supplier_code === norm);
  }

  return cats;
}

export async function upsertMargin(categoryId, marginType, marginValue) {
  const { error } = await supabaseAdmin
    .from('margins')
    .upsert(
      { store_id: STORE_ID, category_id: categoryId, margin_type: marginType, margin_value: marginValue, updated_at: new Date().toISOString() },
      { onConflict: 'store_id,category_id' }
    );

  if (error) {
    console.error('[upsertMargin]', error.message);
    throw error;
  }
}

// ─────────────────────────────────────────────
// COUNTS
// ─────────────────────────────────────────────

export async function getDashboardCounts() {
  const activeList = getActiveSupportedSuppliers();
  const isAllOrMulti = activeList.length === 0;

  let productsQuery = supabaseAdmin.from('products').select('id', { count: 'exact', head: true });
  let prodSelectQuery = supabaseAdmin.from('products').select('category_id, brand_id');
  if (activeList.length === 1) {
    productsQuery = productsQuery.eq('supplier_code', activeList[0]);
    prodSelectQuery = prodSelectQuery.eq('supplier_code', activeList[0]);
  } else if (activeList.length > 1) {
    productsQuery = productsQuery.in('supplier_code', activeList);
    prodSelectQuery = prodSelectQuery.in('supplier_code', activeList);
  }

  const [products, prodDataRes, gbstore, balagan, sakher] = await Promise.all([
    productsQuery,
    prodSelectQuery,
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('supplier_code', 'gbstore'),
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('supplier_code', 'balagan'),
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('supplier_code', 'sakher'),
  ]);

  const activeCategoryIds = new Set((prodDataRes.data || []).map((p) => p.category_id).filter(Boolean));
  const activeBrandIds = new Set((prodDataRes.data || []).map((p) => p.brand_id).filter(Boolean));

  const supplierCounts = {};
  if (isAllOrMulti || activeList.includes('gbstore')) supplierCounts.gbstore = gbstore.count ?? 0;
  if (isAllOrMulti || activeList.includes('balagan')) supplierCounts.balagan = balagan.count ?? 0;
  if (isAllOrMulti || activeList.includes('sakher')) supplierCounts.sakher = sakher.count ?? 0;

  const totalProducts = products.count ?? 0;

  return {
    products: totalProducts,
    categories: activeCategoryIds.size,
    brands: activeBrandIds.size,
    supplierCounts,
  };
}
