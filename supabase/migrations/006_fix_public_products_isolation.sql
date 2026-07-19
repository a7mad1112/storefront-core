-- ============================================================
-- Migration 006: Guarantee store-isolated public_products view
-- ============================================================
-- Issue 7 Fix: The public_products view in migration 002b used a pre-isolation
-- join that applied ALL availability overrides regardless of store_id:
--
--   LEFT JOIN product_availability_overrides ov ON p.supplier_id = ov.product_supplier_id
--
-- Migration 004 recreated the view correctly via get_store_products('eloria', NULL),
-- but ONLY if all 5 migrations were applied in order. If the production DB missed
-- or re-ran 002b after 004, the un-isolated view could still be in place.
--
-- This migration unconditionally drops and recreates public_products using the
-- correct get_store_products RPC (which carries the store_id filter), guaranteeing
-- the right view is always in place regardless of prior migration order.
-- ============================================================

-- Verify get_store_products function exists before proceeding.
-- (It must have been created by migration 004.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'get_store_products'
    ) THEN
        RAISE EXCEPTION
            'get_store_products function not found. '
            'Ensure migration 004_phase6d_multi_supplier.sql was applied first.';
    END IF;
END $$;

-- Drop and recreate the view using the store-isolated RPC.
-- This replaces any stale version from 002b or any other partial migration.
DROP VIEW IF EXISTS public_products;

CREATE VIEW public_products AS
SELECT * FROM get_store_products('eloria', NULL);

-- Restore permissions (these are idempotent)
GRANT SELECT ON public_products TO anon;
GRANT SELECT ON public_products TO authenticated;

-- ============================================================
-- Verification query (run manually after applying):
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'public_products'
--   ORDER BY ordinal_position;
--
-- Expected columns include: id, name, ..., supplier_code, retail_price
-- The presence of "supplier_code" confirms migration 004 is in effect.
-- The is_available column will correctly reflect per-store overrides only.
-- ============================================================
