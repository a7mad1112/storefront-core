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
- [ ] **Test WhatsApp Order Link**: Add a item to the cart in English or Hebrew, open the cart drawer, and click **"Order via WhatsApp"**. Verify that the generated WhatsApp message reflects the localized labels and product names.
- [ ] **Verify Visitor Analytics**: Browse a few pages on the site, then log into the Admin Dashboard (`/ar/admin`). Scroll down to **إحصائيات الزوار والتصفح (Visitor Analytics)** and verify that your visits appear under the Day/Week/Month tabs and Top Visited Pages.
