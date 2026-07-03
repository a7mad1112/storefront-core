-- ============================================================
-- GB Store — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Date: 2026-06-30
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- -----------------------------------------------------------
-- 1a. Categories
-- -----------------------------------------------------------
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id TEXT UNIQUE NOT NULL,       -- Original ID from gbstore.ps (e.g., "39")
    name TEXT NOT NULL,                      -- Arabic category name
    slug TEXT UNIQUE NOT NULL,               -- URL-friendly slug
    image_url TEXT,                           -- R2 image URL
    parent_id UUID REFERENCES categories(id),-- For sub-categories
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------
-- 1b. Products
-- -----------------------------------------------------------
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id TEXT UNIQUE NOT NULL,        -- Original product ID from supplier
    category_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    wholesale_price DECIMAL(10,2) NOT NULL,  -- 🔒 HIDDEN from public via RLS
    image_url TEXT,                           -- R2 CDN URL (WebP)
    additional_images TEXT[],                 -- Array of R2 URLs
    supplier_image_url TEXT,                  -- Original URL for change-detection
    quantity INT DEFAULT 0,
    consecutive_zero_qty INT DEFAULT 0,      -- 🗑️ Incremented each sync with qty=0; hard-deleted at threshold
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,          -- Admin can deactivate manually
    tags TEXT[],                              -- "جملة", "حصرياً", etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------
-- 1c. Margins (category-level markup rules)
-- -----------------------------------------------------------
CREATE TABLE margins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) UNIQUE NOT NULL,
    margin_type TEXT NOT NULL CHECK (margin_type IN ('percentage', 'fixed')),
    margin_value DECIMAL(10,2) NOT NULL,     -- e.g., 15.00 for 15% or 20.00 for ₪20
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------
-- 1d. Sync Logs (scraper run history)
-- -----------------------------------------------------------
CREATE TABLE sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    products_added INT DEFAULT 0,
    products_updated INT DEFAULT 0,
    products_deactivated INT DEFAULT 0,
    products_deleted INT DEFAULT 0,          -- Hard-deleted rows (removed from supplier or zero-qty threshold)
    images_deleted INT DEFAULT 0,            -- R2 images purged alongside deleted products
    categories_found INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 2. INDEXES (performance)
-- ============================================================

-- Products: fast lookup by category, availability, slug
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_available ON products(is_available) WHERE is_available = true;
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);

-- Categories: fast lookup by slug, parent
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;

-- Margins: fast lookup by category
CREATE INDEX idx_margins_category ON margins(category_id);

-- Sync logs: recent-first queries
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at DESC);


-- ============================================================
-- 3. VIEW — public_products (computes retail price, hides wholesale)
-- ============================================================
CREATE VIEW public_products AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.image_url,
    p.additional_images,
    p.quantity,
    p.is_available,
    p.tags,
    c.name AS category_name,
    c.slug AS category_slug,
    c.id AS category_id,
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
WHERE p.is_active = true AND c.is_active = true;


-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- -----------------------------------------------------------
-- 4a. Products — public can read (minus wholesale_price), admin full access
-- -----------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public users can read active products only
CREATE POLICY "Public read products" ON products
    FOR SELECT TO anon
    USING (is_active = true);

-- Restrict anon to specific columns — wholesale_price is EXCLUDED
REVOKE ALL ON products FROM anon;
GRANT SELECT (id, name, slug, description, image_url, additional_images,
              quantity, is_available, is_active, tags, category_id,
              created_at, updated_at) ON products TO anon;

-- Admin (authenticated) can see everything including wholesale_price
CREATE POLICY "Admin full access" ON products
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- -----------------------------------------------------------
-- 4b. Categories — public can read, admin full access
-- -----------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories
    FOR SELECT TO anon
    USING (is_active = true);

CREATE POLICY "Admin manage categories" ON categories
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- -----------------------------------------------------------
-- 4c. Margins — admin only
-- -----------------------------------------------------------
ALTER TABLE margins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage margins" ON margins
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- -----------------------------------------------------------
-- 4d. Sync Logs — admin can read, scraper writes via service_role
-- -----------------------------------------------------------
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read sync logs" ON sync_logs
    FOR SELECT TO authenticated
    USING (true);

-- -----------------------------------------------------------
-- 4e. Grant public read on public_products view
-- -----------------------------------------------------------
GRANT SELECT ON public_products TO anon;
GRANT SELECT ON public_products TO authenticated;


-- ============================================================
-- 5. UPDATED_AT TRIGGER (auto-update timestamps)
-- ============================================================

-- Generic trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to products
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to categories
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to margins
CREATE TRIGGER set_margins_updated_at
    BEFORE UPDATE ON margins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
