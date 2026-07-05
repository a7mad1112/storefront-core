-- ============================================================
-- Phase 6a — Brands, Color Variants & Availability Overrides
-- Migration: 002_phase6a_brands_colors_overrides.sql
-- Date: 2026-07-04
-- ============================================================

-- ============================================================
-- 1. BRANDS TABLE
-- ============================================================

CREATE TABLE brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id TEXT UNIQUE NOT NULL,        -- Original brand ID from supplier
    name TEXT NOT NULL,                       -- Arabic brand name
    slug TEXT UNIQUE NOT NULL,               -- URL-friendly slug
    image_url TEXT,                           -- R2 CDN URL (brand logo/image)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for brands
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_active ON brands(is_active) WHERE is_active = true;
CREATE INDEX idx_brands_supplier_id ON brands(supplier_id);


-- ============================================================
-- 2. ADD brand_id & color_variants TO PRODUCTS
-- ============================================================

ALTER TABLE products
    ADD COLUMN brand_id UUID REFERENCES brands(id);

ALTER TABLE products
    ADD COLUMN color_variants JSONB DEFAULT '[]';

-- Index for brand lookups on products
CREATE INDEX idx_products_brand ON products(brand_id);


-- ============================================================
-- 3. PRODUCT AVAILABILITY OVERRIDES (Client-Isolated)
-- ============================================================

CREATE TABLE product_availability_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_supplier_id TEXT NOT NULL,       -- References supplier_id from products
    is_available BOOLEAN NOT NULL,           -- Admin's explicit override value
    override_reason TEXT,                    -- Optional: reason for the override
    overridden_by TEXT,                      -- Admin user email/id
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_supplier_id)
);

CREATE INDEX idx_overrides_supplier_id ON product_availability_overrides(product_supplier_id);


-- ============================================================
-- 4. DROP & RECREATE public_products VIEW
--    Now includes: brand info, color_variants, override logic
-- ============================================================

DROP VIEW IF EXISTS public_products;

CREATE VIEW public_products AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.image_url,
    p.additional_images,
    p.quantity,
    -- Availability: admin override wins if it exists, otherwise use product's value
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
        ELSE p.wholesale_price  -- fallback if no margin set
    END AS retail_price,
    p.updated_at
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN margins m ON c.id = m.category_id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_availability_overrides ov ON p.supplier_id = ov.product_supplier_id
WHERE p.is_active = true AND c.is_active = true;


-- ============================================================
-- 5. ROW LEVEL SECURITY — New Tables
-- ============================================================

-- Brands: public can read, admin full access
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read brands" ON brands
    FOR SELECT TO anon
    USING (is_active = true);

CREATE POLICY "Admin manage brands" ON brands
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Product Availability Overrides: admin only
ALTER TABLE product_availability_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage overrides" ON product_availability_overrides
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================
-- 6. COLUMN GRANTS — Extend anon access on products
-- ============================================================

-- Add new columns to the anon-readable set on products
-- (The original migration granted specific columns; we add the new ones)
GRANT SELECT (brand_id, color_variants) ON products TO anon;


-- ============================================================
-- 7. GRANT VIEW ACCESS
-- ============================================================

-- Re-grant since view was dropped and recreated
GRANT SELECT ON public_products TO anon;
GRANT SELECT ON public_products TO authenticated;

-- Grant read access on brands table to anon
GRANT SELECT ON brands TO anon;
GRANT SELECT ON brands TO authenticated;


-- ============================================================
-- 8. UPDATED_AT TRIGGERS — New Tables
-- ============================================================

-- Apply auto-update trigger to brands
CREATE TRIGGER set_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply auto-update trigger to overrides
CREATE TRIGGER set_overrides_updated_at
    BEFORE UPDATE ON product_availability_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
