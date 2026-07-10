-- ============================================================
-- Phase 6e: Multi-Supplier Composite Unique Constraints
-- Migration: 005_phase6e_multi_supplier_constraints.sql
-- ============================================================

-- 1. Drop old single-column unique constraints on supplier_id and slug if they exist
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_supplier_id_key;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_supplier_id_key;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_supplier_id_key;

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_key;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_slug_key;

-- 2. Add composite unique constraints on (supplier_code, supplier_id) for multi-supplier upsert support
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_supplier_code_id_key'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT categories_supplier_code_id_key UNIQUE (supplier_code, supplier_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_supplier_code_id_key'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_supplier_code_id_key UNIQUE (supplier_code, supplier_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'brands_supplier_code_id_key'
    ) THEN
        ALTER TABLE brands ADD CONSTRAINT brands_supplier_code_id_key UNIQUE (supplier_code, supplier_id);
    END IF;
END $$;

-- 3. Add composite unique constraints on (supplier_code, slug) so different suppliers can use the same slugs without collision
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_supplier_code_slug_key'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT categories_supplier_code_slug_key UNIQUE (supplier_code, slug);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_supplier_code_slug_key'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_supplier_code_slug_key UNIQUE (supplier_code, slug);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'brands_supplier_code_slug_key'
    ) THEN
        ALTER TABLE brands ADD CONSTRAINT brands_supplier_code_slug_key UNIQUE (supplier_code, slug);
    END IF;
END $$;
