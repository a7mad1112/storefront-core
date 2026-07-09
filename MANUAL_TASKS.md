# Manual Tasks Checklist

This document tracks all manual steps, database migrations, and configurations that require human intervention or verification in Supabase / Production environments.

---

## 📌 Phase 6b: Internationalization, Homepage Polish & Visitor Analytics

### 1. Database Migration (Supabase SQL Editor)
- [x] **Run Migration SQL**: Open your Supabase Dashboard → **SQL Editor** → create a new query and paste/run the contents of `supabase/migrations/002_phase6b_i18n_analytics.sql` (if not already applied to your production database).
  - This adds multilingual columns (`name_en`, `name_he`, `description_en`, `description_he`) to `products`, `categories`, and `brands`.
  - It also creates the `analytics_visits` table with appropriate Row Level Security (RLS) policies.

### 2. Translations Data Population
- [x] **Populate Product/Category Translations**: The system currently falls back to Arabic if English or Hebrew names are empty. When available, manually populate `name_en` and `name_he` in your database (or update the scraper pipeline to auto-translate) so English and Hebrew visitors see translated product and brand names.

### 3. Verification & Testing
- [ ] **Test Language Switcher**: Go to the website header and click between **AR**, **EN**, and **HE**. Verify that:
  - The URL switches between `/ar/...`, `/en/...`, and `/he/...`.
  - The layout direction switches between RTL (Right-to-Left for Arabic/Hebrew) and LTR (Left-to-Right for English).
- [ ] **Verify Visitor Analytics**: Browse a few pages on the site, then log into the Admin Dashboard (`/ar/admin`). Scroll down to **إحصائيات الزوار والتصفح (Visitor Analytics)** and verify that your visits appear under the Day/Week/Month tabs and Top Visited Pages.

---

## 📌 Phase 6c: Shared Database Multi-Tenancy (`store_id` Client Isolation)

### 1. Database Migration (Supabase SQL Editor)
- [x] **Run Phase 6c Migration SQL**: Open your Supabase Dashboard → **SQL Editor** → create a new query and paste/run the contents of `supabase/migrations/003_phase6c_client_isolation.sql`.
  - This adds the `store_id` column to `margins` and `product_availability_overrides` (defaulting to `'eloria'`).
  - It creates composite unique constraints `UNIQUE(store_id, category_id)` and `UNIQUE(store_id, product_supplier_id)`.
  - It creates the Postgres RPC `get_store_products(p_store_id)` for dynamic catalog querying per store instance.

### 2. Multi-Instance Client Configuration
- [ ] **Cloning for a New Store Client**: When deploying a second store instance (e.g., Client B) against the same Supabase backend:
  - When Client B's admin logs into their admin panel, any custom price margins or availability overrides they save will be tagged with `store_id = 'client_b'` and will not affect Eloria's storefront!

---

## 📌 Phase 6d: Multi-Supplier Architecture

### 1. Database Migration (Supabase SQL Editor)
- [x] **Run Phase 6d Migration SQL**: Open your Supabase Dashboard → **SQL Editor** → create a new query and paste/run the contents of `supabase/migrations/004_phase6d_multi_supplier.sql`.
  - This adds the `supplier_code` column (defaulting to `'gbstore'`) to `products`, `categories`, and `brands`, and creates indexes on them.
  - It drops and recreates `public_products` view to include `supplier_code`.
  - It drops and recreates the Postgres RPC `get_store_products(p_store_id, p_supplier_code)` to support optional filtering by supplier.

### 2. Scraper Configuration (for Additional Suppliers)
- [x] **Configuring a Second Supplier**: When adding a new supplier scraper:
  - In your scraper environment variables (or GitHub Actions secrets), set `SUPPLIER_CODE="supplier_b"`, along with the new supplier's base URL and credentials.
  - When the scraper runs, all categories, brands, and products it extracts will be upserted with `supplier_code = 'supplier_b'`.

### 3. Storefront Multi-Supplier Switcher
- [x] **Enable Storefront Switcher**: In `.env.local` (or Vercel / hosting environment variables), configure:
  - `NEXT_PUBLIC_SUPPORTED_SUPPLIERS="gbstore,supplier_b"`
  - `NEXT_PUBLIC_SUPPLIER_NAMES='{"gbstore": "جي بي ستور (GB Store)", "supplier_b": "مورد آخر (Supplier B)"}'`
  - Once multiple suppliers are listed, a supplier switcher bar will automatically appear below the site header, allowing visitors to view all products or filter by specific supplier.

---

## 📌 Phase 8d: Balagan Scraper (Shoes — Colors + Sizes)

### 1. Database Migrations
- **None required!** The database schema (`supplier_code` and `color_variants` JSONB) was already set up in previous migrations (`004_phase6d_multi_supplier.sql`). No SQL queries need to be run in Supabase.

### 2. Scraper Execution & Credentials
- When executing the Balagan scraper (`py -m scraper.suppliers.balagan.sync` or via automated cron jobs), ensure the following environment variables are configured in `.env` or GitHub Actions secrets:
  - `BALAGAN_PHONE` (or `SUPPLIER_PHONE`): Phone number for logging into `balagan.ps`
  - `BALAGAN_PASSWORD` (or `SUPPLIER_PASSWORD`): Password for logging into `balagan.ps`
  - All existing Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) and Cloudflare R2 credentials.
