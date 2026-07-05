-- ============================================================
-- Phase 6d: Multi-Supplier Architecture & Catalog Switching
-- ============================================================

-- 1. Add supplier_code to products, categories, and brands
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_code TEXT NOT NULL DEFAULT 'gbstore';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS supplier_code TEXT NOT NULL DEFAULT 'gbstore';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS supplier_code TEXT NOT NULL DEFAULT 'gbstore';

-- 2. Create indexes for fast filtering by supplier_code
CREATE INDEX IF NOT EXISTS idx_products_supplier_code ON products(supplier_code);
CREATE INDEX IF NOT EXISTS idx_categories_supplier_code ON categories(supplier_code);
CREATE INDEX IF NOT EXISTS idx_brands_supplier_code ON brands(supplier_code);

-- 3. Update get_store_products RPC to support optional p_supplier_code filtering
DROP VIEW IF EXISTS public_products;
DROP FUNCTION IF EXISTS get_store_products(text);
DROP FUNCTION IF EXISTS get_store_products(text, text);

CREATE OR REPLACE FUNCTION get_store_products(
    p_store_id text DEFAULT 'eloria',
    p_supplier_code text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    additional_images TEXT[],
    quantity INTEGER,
    is_available BOOLEAN,
    tags TEXT[],
    color_variants JSONB,
    category_name TEXT,
    category_slug TEXT,
    category_id UUID,
    brand_name TEXT,
    brand_slug TEXT,
    brand_id UUID,
    retail_price NUMERIC,
    updated_at TIMESTAMPTZ,
    name_en TEXT,
    name_he TEXT,
    description_en TEXT,
    description_he TEXT,
    supplier_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.image_url,
        p.additional_images,
        p.quantity,
        COALESCE(ov.is_available, p.is_available) AS is_available,
        p.tags,
        p.color_variants,
        c.name AS category_name,
        c.slug AS category_slug,
        c.id AS category_id,
        b.name AS brand_name,
        b.slug AS brand_slug,
        b.id AS brand_id,
        CASE
            WHEN m.margin_type = 'percentage'
                THEN ROUND(p.wholesale_price * (1 + m.margin_value / 100), 2)
            WHEN m.margin_type = 'fixed'
                THEN p.wholesale_price + m.margin_value
            ELSE p.wholesale_price
        END AS retail_price,
        p.updated_at,
        p.name_en,
        p.name_he,
        p.description_en,
        p.description_he,
        p.supplier_code
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN margins m ON c.id = m.category_id AND m.store_id = p_store_id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN product_availability_overrides ov ON p.supplier_id = ov.product_supplier_id AND ov.store_id = p_store_id
    WHERE p.is_active = true 
      AND c.is_active = true
      AND (p_supplier_code IS NULL OR p_supplier_code = 'all' OR p.supplier_code = p_supplier_code);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Recreate public_products view using default 'eloria' store and all suppliers
DROP VIEW IF EXISTS public_products;

CREATE VIEW public_products AS
SELECT * FROM get_store_products('eloria', NULL);

-- 5. Grant permissions
GRANT SELECT ON public_products TO anon;
GRANT SELECT ON public_products TO authenticated;
GRANT EXECUTE ON FUNCTION get_store_products(text, text) TO anon;
GRANT EXECUTE ON FUNCTION get_store_products(text, text) TO authenticated;

-- 6. Grant SELECT on all non-sensitive columns in products to anon (excluding wholesale_price)
GRANT SELECT (id, supplier_id, name, slug, description, image_url, additional_images, quantity, is_available, is_active, tags, category_id, brand_id, color_variants, name_en, name_he, description_en, description_he, supplier_code, created_at, updated_at) ON products TO anon;
