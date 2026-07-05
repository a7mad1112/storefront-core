-- ============================================================
-- Phase 6b Migration: Internationalization + Analytics
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- 1. Multilingual columns on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_he TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_he TEXT;

-- 2. Multilingual columns on categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_he TEXT;

-- 3. Multilingual columns on brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS name_he TEXT;

-- 4. Analytics visits table (client DB — per-instance)
CREATE TABLE IF NOT EXISTS analytics_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    visited_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient date-range queries in the admin dashboard
CREATE INDEX IF NOT EXISTS idx_analytics_visits_visited_at
    ON analytics_visits (visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_visits_session_page
    ON analytics_visits (session_id, page_path);

-- 5. RLS: anonymous users can INSERT visits, only admin can SELECT
ALTER TABLE analytics_visits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (the beacon fires from the client)
CREATE POLICY "anon_insert_visits" ON analytics_visits
    FOR INSERT TO anon
    WITH CHECK (true);

-- Only authenticated (admin) can read analytics data
CREATE POLICY "admin_read_visits" ON analytics_visits
    FOR SELECT TO authenticated
    USING (true);

-- Allow service_role full access (for cleanup/maintenance)
CREATE POLICY "service_role_full_visits" ON analytics_visits
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
