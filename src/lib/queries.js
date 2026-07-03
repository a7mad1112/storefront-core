/**
 * GB Store — Supabase Query Helpers (Server-Side Only)
 *
 * All functions here query Supabase from the server.
 * Public product queries use the public anon client → no wholesale_price exposed.
 * Admin queries use supabaseAdmin (service role) → full access.
 */

import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-server';

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

/**
 * Fetch all active categories ordered by name.
 * Returns flat list; caller groups by parent_id if needed.
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, image_url, is_active')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[getCategories]', error.message);
    return [];
  }
  return data ?? [];
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

  return data || null;
}

/**
 * Fetch subcategories for a given parent category ID.
 */
export async function getSubcategories(parentId) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .eq('parent_id', parentId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[getSubcategories]', error.message);
    return [];
  }
  return data ?? [];
}

// ─────────────────────────────────────────────
// PRODUCTS (public — no wholesale_price)
// ─────────────────────────────────────────────

const PUBLIC_PRODUCT_FIELDS =
  'id, name, slug, description, image_url, additional_images, quantity, is_available, tags, category_id, category_name, category_slug, retail_price, updated_at';

/**
 * Fetch products from the public_products view.
 * Supports pagination and category filtering.
 */
export async function getProducts({ categoryId, limit = 24, offset = 0 } = {}) {
  let query = supabase
    .from('public_products')
    .select(PUBLIC_PRODUCT_FIELDS)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

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
export async function getProductsForCategory(categoryId, { limit = 24, offset = 0 } = {}) {
  // First get subcategory IDs
  const { data: subs } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', categoryId)
    .eq('is_active', true);

  const ids = [categoryId, ...(subs ?? []).map((s) => s.id)];

  const { data, error } = await supabase
    .from('public_products')
    .select(PUBLIC_PRODUCT_FIELDS)
    .in('category_id', ids)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

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
  let { data } = await supabase
    .from('public_products')
    .select(PUBLIC_PRODUCT_FIELDS)
    .eq('id', decoded)
    .maybeSingle();

  // 2. Try match by slug
  if (!data) {
    const res = await supabase
      .from('public_products')
      .select(PUBLIC_PRODUCT_FIELDS)
      .eq('slug', decoded)
      .maybeSingle();
    data = res.data;
  }

  return data || null;
}

/**
 * Full-text search across product names and tags.
 */
export async function searchProducts(query, { limit = 30 } = {}) {
  if (!query || query.trim().length < 1) return [];

  const { data, error } = await supabase
    .from('public_products')
    .select(PUBLIC_PRODUCT_FIELDS)
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
    .select('id, name, wholesale_price, quantity, is_active, is_available, image_url, category_id, updated_at')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[getAdminProducts]', error.message);
    return [];
  }
  return data ?? [];
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
    .select('id, name, slug, margins(id, margin_type, margin_value)')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[getMarginsWithCategories]', error.message);
    return [];
  }
  return data ?? [];
}

export async function upsertMargin(categoryId, marginType, marginValue) {
  const { error } = await supabaseAdmin
    .from('margins')
    .upsert(
      { category_id: categoryId, margin_type: marginType, margin_value: marginValue, updated_at: new Date().toISOString() },
      { onConflict: 'category_id' }
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
  const [products, categories] = await Promise.all([
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  return {
    products: products.count ?? 0,
    categories: categories.count ?? 0,
  };
}
