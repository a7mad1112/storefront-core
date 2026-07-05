-- ============================================================
-- Phase 6c: Shared Database Multi-Tenancy (store_id Client Isolation)
-- ============================================================

-- 1. Add store_id to margins
ALTER TABLE margins ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'eloria';

-- Drop old unique constraint on category_id if it exists
DO $$
BEGIN
    ALTER TABLE margins DROP CONSTRAINT IF EXISTS margins_category_id_key;
    ALTER TABLE margins DROP CONSTRAINT IF EXISTS margins_store_category_key;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Add composite unique constraint for multi-tenancy
ALTER TABLE margins ADD CONSTRAINT margins_store_category_key UNIQUE (store_id, category_id);
CREATE INDEX IF NOT EXISTS idx_margins_store_id ON margins(store_id);

-- 2. Add store_id to product_availability_overrides
ALTER TABLE product_availability_overrides ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'eloria';

-- Drop old unique constraint on product_supplier_id if it exists
DO $$
BEGIN
    ALTER TABLE product_availability_overrides DROP CONSTRAINT IF EXISTS product_availability_overrides_product_supplier_id_key;
    ALTER TABLE product_availability_overrides DROP CONSTRAINT IF EXISTS overrides_store_product_key;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Add composite unique constraint for multi-tenancy
ALTER TABLE product_availability_overrides ADD CONSTRAINT overrides_store_product_key UNIQUE (store_id, product_supplier_id);
CREATE INDEX IF NOT EXISTS idx_overrides_store_id ON product_availability_overrides(store_id);

-- 3. Create get_store_products RPC for dynamic catalog querying per store_id
CREATE OR REPLACE FUNCTION get_store_products(p_store_id text DEFAULT 'eloria')
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    additional_images JSONB,
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
    description_he TEXT
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
        p.description_he
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN margins m ON c.id = m.category_id AND m.store_id = p_store_id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN product_availability_overrides ov ON p.supplier_id = ov.product_supplier_id AND ov.store_id = p_store_id
    WHERE p.is_active = true AND c.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Recreate public_products view using default 'eloria' store
DROP VIEW IF EXISTS public_products;

CREATE VIEW public_products AS
SELECT * FROM get_store_products('eloria');

-- 5. Grant permissions
GRANT SELECT ON public_products TO anon;
GRANT SELECT ON public_products TO authenticated;
GRANT EXECUTE ON FUNCTION get_store_products(text) TO anon;
GRANT EXECUTE ON FUNCTION get_store_products(text) TO authenticated;
