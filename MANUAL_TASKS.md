# Manual Tasks Checklist

This document tracks all manual steps, database migrations, and configurations that require human intervention or verification in Supabase / Production environments.

---

## 📌 Phase 6b: Internationalization, Homepage Polish & Visitor Analytics

### 1. Database Migration (Supabase SQL Editor)
- [ ] **Run Migration SQL**: Open your Supabase Dashboard → **SQL Editor** → create a new query and paste/run the contents of `supabase/migrations/002_phase6b_i18n_analytics.sql` (if not already applied to your production database).
  - This adds multilingual columns (`name_en`, `name_he`, `description_en`, `description_he`) to `products`, `categories`, and `brands`.
  - It also creates the `analytics_visits` table with appropriate Row Level Security (RLS) policies.

### 2. Translations Data Population
- [ ] **Populate Product/Category Translations**: The system currently falls back to Arabic if English or Hebrew names are empty. When available, manually populate `name_en` and `name_he` in your database (or update the scraper pipeline to auto-translate) so English and Hebrew visitors see translated product and brand names.

### 3. Verification & Testing
- [ ] **Test Language Switcher**: Go to the website header and click between **AR**, **EN**, and **HE**. Verify that:
  - The URL switches between `/ar/...`, `/en/...`, and `/he/...`.
  - The layout direction switches between RTL (Right-to-Left for Arabic/Hebrew) and LTR (Left-to-Right for English).
- [ ] **Verify Visitor Analytics**: Browse a few pages on the site, then log into the Admin Dashboard (`/ar/admin`). Scroll down to **إحصائيات الزوار والتصفح (Visitor Analytics)** and verify that your visits appear under the Day/Week/Month tabs and Top Visited Pages.

---

## 📌 Phase 6c: Shared Database Multi-Tenancy (`store_id` Client Isolation)

### 1. Database Migration (Supabase SQL Editor)
- [ ] **Run Phase 6c Migration SQL**: Open your Supabase Dashboard → **SQL Editor** → create a new query and paste/run the contents of `supabase/migrations/003_phase6c_client_isolation.sql`.
  - This adds the `store_id` column to `margins` and `product_availability_overrides` (defaulting to `'eloria'`).
  - It creates composite unique constraints `UNIQUE(store_id, category_id)` and `UNIQUE(store_id, product_supplier_id)`.
  - It creates the Postgres RPC `get_store_products(p_store_id)` for dynamic catalog querying per store instance.

### 2. Multi-Instance Client Configuration
- [ ] **Cloning for a New Store Client**: When deploying a second store instance (e.g., Client B) against the same Supabase backend:
  - Copy `.env.local.example` to `.env.local`.
  - Change `NEXT_PUBLIC_STORE_ID="client_b"` (or whatever unique ID assigned to the new client).
  - Change `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_STORE_DESC`, and `NEXT_PUBLIC_WHATSAPP_NUMBER` to match the new client's branding.
  - When Client B's admin logs into their admin panel, any custom price margins or availability overrides they save will be tagged with `store_id = 'client_b'` and will not affect Eloria's storefront!
