/**
 * GB Store — Supabase Query Helpers (Server-Side Only)
 *
 * All functions here query Supabase from the server.
 * Public product queries use the public anon client → no wholesale_price exposed.
 * Admin queries use supabaseAdmin (service role) → full access.
 */

import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-server';

export const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || 'eloria';
export const SUPPORTED_SUPPLIERS = (process.env.NEXT_PUBLIC_SUPPORTED_SUPPLIERS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const PUBLIC_PRODUCT_FIELDS =
  'id, name, slug, description, image_url, additional_images, quantity, is_available, tags, category_id, category_name, category_slug, brand_id, brand_name, brand_slug, color_variants, retail_price, updated_at, name_en, name_he, description_en, description_he, supplier_code';

function applySupplierFilter(query, supplierCode = null) {
  if (supplierCode && supplierCode !== 'all') {
    return query.eq('supplier_code', supplierCode);
  }
  if (SUPPORTED_SUPPLIERS.length === 1) {
    return query.eq('supplier_code', SUPPORTED_SUPPLIERS[0]);
  }
  if (SUPPORTED_SUPPLIERS.length > 1) {
    return query.in('supplier_code', SUPPORTED_SUPPLIERS);
  }
  return query;
}

/**
 * Helper to query catalog: uses public_products view for default store ('eloria'),
 * or dynamically calls get_store_products RPC for multi-tenant client isolation.
 */
function getCatalogTable(supplierCode = null, selectFields = PUBLIC_PRODUCT_FIELDS) {
  if (STORE_ID === 'eloria') {
    let query = supabase.from('public_products').select(selectFields);
    return applySupplierFilter(query, supplierCode);
  }
  const effectiveSupplier =
    supplierCode && supplierCode !== 'all'
      ? supplierCode
      : SUPPORTED_SUPPLIERS.length === 1
      ? SUPPORTED_SUPPLIERS[0]
      : null;
  let query = supabase
    .rpc('get_store_products', {
      p_store_id: STORE_ID,
      p_supplier_code: effectiveSupplier,
    })
    .select(selectFields);
  return applySupplierFilter(query, supplierCode);
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

/**
 * Fetch all active categories ordered by name.
 * Returns flat list; caller groups by parent_id if needed.
 */
export async function getCategories({ supplierCode = null } = {}) {
  let query = supabase
    .from('categories')
    .select('id, name, slug, parent_id, image_url, is_active')
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
export async function getCategoryBySlug(slugOrId) {
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId);

  // 1. Try match by slug
  let { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, image_url')
    .eq('slug', decoded)
    .eq('is_active', true)
    .maybeSingle();

  // 2. Try match by supplier_id
  if (!data) {
    const res = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url')
      .eq('supplier_id', decoded)
      .eq('is_active', true)
      .maybeSingle();
    data = res.data;
  }

  // 3. Try match by UUID (id)
  if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)) {
    const res = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url')
      .eq('id', decoded)
      .eq('is_active', true)
      .maybeSingle();
    data = res.data;
  }

  // 4. Try match by exact name
  if (!data) {
    const res = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url')
      .eq('name', decoded)
      .eq('is_active', true)
      .maybeSingle();
    data = res.data;
  }

  // 5. Try match by partial slug or name
  if (!data) {
    const res = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url')
      .or(`slug.ilike.%${decoded}%,name.ilike.%${decoded}%`)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    data = res.data;
  }

  // 6. Fallback: find dynamically from active products if category row is missing
  if (!data) {
    const tableQuery = getCatalogTable(null, 'category_id, category_name, category_slug');
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
// BRANDS
// ─────────────────────────────────────────────

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
    return [];
  }
  let brands = data ?? [];

  if (brands.length > 0) {
    const prodTableQuery = getCatalogTable(supplierCode, 'brand_id, brand_slug, brand_name');
    const { data: prodBrands } = await prodTableQuery.limit(2000);
    if (prodBrands && prodBrands.length > 0) {
      const activeBrandIds = new Set(prodBrands.map(p => p.brand_id).filter(Boolean));
      const activeBrandSlugs = new Set(prodBrands.map(p => p.brand_slug).filter(Boolean));
      const activeBrandNames = new Set(prodBrands.map(p => p.brand_name).filter(Boolean));

      brands = brands.filter(b =>
        activeBrandIds.has(b.id) || activeBrandSlugs.has(b.slug) || activeBrandNames.has(b.name)
      );
    }
  }

  return brands;
}

/**
 * Fetch a single brand by slug, supplier_id, or UUID.
 */
export async function getBrandBySlug(slugOrId) {
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId);

  // 1. Try match by slug
  let { data } = await supabase
    .from('brands')
    .select('id, name, slug, image_url')
    .eq('slug', decoded)
    .eq('is_active', true)
    .maybeSingle();

  // 2. Try match by supplier_id
  if (!data) {
    const res = await supabase
      .from('brands')
      .select('id, name, slug, image_url')
      .eq('supplier_id', decoded)
      .eq('is_active', true)
      .maybeSingle();
    data = res.data;
  }

  // 3. Try match by UUID
  if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)) {
    const res = await supabase
      .from('brands')
      .select('id, name, slug, image_url')
      .eq('id', decoded)
      .eq('is_active', true)
      .maybeSingle();
    data = res.data;
  }

  return data || null;
}

/**
 * Fetch products belonging to a brand (from public_products view).
 */
export async function getProductsForBrand(brandId, { limit = 48, offset = 0, sort = 'default', supplierCode = null } = {}) {
  let query = getCatalogTable(supplierCode)
    .eq('brand_id', brandId)
    .range(offset, offset + limit - 1);

  query = applySortOrder(query, sort);

  const { data, error } = await query;

  if (error) {
    console.error('[getProductsForBrand]', error.message);
    return [];
  }
  return data ?? [];
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
  return data ?? [];
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
  return data ?? [];
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

export async function getAdminProducts({ limit = 50, offset = 0 } = {}) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, supplier_id, name, wholesale_price, quantity, is_active, is_available, image_url, category_id, brand_id, updated_at')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[getAdminProducts]', error.message);
    return [];
  }
  return data ?? [];
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

export async function getMarginsWithCategories() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, margins(id, margin_type, margin_value, store_id)')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[getMarginsWithCategories]', error.message);
    return [];
  }
  return (data ?? []).map((cat) => ({
    ...cat,
    margins: (cat.margins || []).filter((m) => !m.store_id || m.store_id === STORE_ID),
  }));
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
  const [products, categories, brands] = await Promise.all([
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('brands').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  return {
    products: products.count ?? 0,
    categories: categories.count ?? 0,
    brands: brands.count ?? 0,
  };
}
