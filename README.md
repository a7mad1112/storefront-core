# GB Store — E-Commerce Storefront & Automated Wholesale Scraper

A modern, high-performance e-commerce platform built with **Next.js 16 (App Router)**, **Supabase PostgreSQL**, **Cloudflare R2 Image CDN**, and an automated Python scraper that synchronizes product data nightly from the wholesale supplier website (`gbstore.ps`).

---

## 🏗️ Architecture Overview

The system is structured into 3 distinct layers to guarantee **speed, low storage costs, and complete wholesale price secrecy**:

```
+-----------------------------------------------------------------------+
|                    1. AUTOMATED SCRAPER LAYER                         |
|  Python (httpx / BeautifulSoup / Pillow) -> GitHub Actions Nightly    |
|  - Logins into wholesale supplier site                                |
|  - Scrapes products, categories, and inventory                        |
|  - Converts images to lightweight WebP & uploads to Cloudflare R2     |
|  - Upserts data into Supabase (table: products, categories)           |
+-----------------------------------.-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    2. DATABASE & STORAGE LAYER                        |
|  Supabase PostgreSQL & Cloudflare R2 Object Storage                   |
|  - Table `products`: contains secret `wholesale_price`                |
|  - View `public_products`: calculates retail price based on margins   |
|    and completely excludes `wholesale_price` (secure boundary)        |
+-----------------------------------.-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    3. FRONTEND & ADMIN LAYER                          |
|  Next.js 16 (App Router) — RTL Arabic First                           |
|  - Storefront (/): Queries only `public_products` view                |
|  - Admin Panel (/admin): Protected by Supabase Auth, allows margin    |
|    management (+% or +₪) and inventory overview                       |
|  - Instant WhatsApp Checkout flow                                     |
+-----------------------------------------------------------------------+
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Supabase Project & Cloudflare R2 Bucket

### 1. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"
NEXT_PUBLIC_WHATSAPP_NUMBER="972595809023"
```

### 2. Run the Next.js Storefront
```powershell
# On Windows PowerShell, use npm.cmd:
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:3000` to view the store.
Open `http://localhost:3000/admin/login` to access the admin dashboard.

---

## 🤖 Running the Scraper Locally

If you need to trigger a manual data sync locally:
```powershell
# Set UTF-8 encoding for PowerShell log output
$env:PYTHONIOENCODING="utf-8"
python scraper/sync.py
```
This will log into the supplier site, check for new or modified products, optimize images to WebP, upload them to R2, and update Supabase.

---

## ☁️ Deployment Guide

### 1. Deploy Frontend to Cloudflare Workers (via OpenNext)
The storefront is configured with `@opennextjs/cloudflare` to run full-stack Next.js on Cloudflare's global edge network (unlimited bandwidth, 100k requests/day free tier).

1. **Push Changes to GitHub**:
   Ensure all changes including `wrangler.jsonc`, `open-next.config.ts`, and `package.json` are committed and pushed to `main`.
2. **Connect to Cloudflare**:
   - Log into the [Cloudflare Dashboard](https://dash.cloudflare.com).
   - Go to **Compute (Workers & Pages)** > **Create** > **Workers**.
   - Click **Connect to Git** and choose your repository (`a7mad1112/storefront-core`).
3. **Configure Build Settings**:
   - **Framework Preset**: None (or Next.js)
   - **Build command**: `npm run build:cf` (or `npx @opennextjs/cloudflare build`)
   - **Deploy command**: (leave default or `wrangler deploy`)
4. **Configure Environment Variables**:
   Under **Variables and Secrets**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `NEXT_PUBLIC_R2_PUBLIC_URL`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
   - `NEXT_PUBLIC_STORE_NAME`
   - `NEXT_PUBLIC_STORE_LOGO`
   - `NEXT_PUBLIC_STORE_ID`
   - `NEXT_PUBLIC_SUPPORTED_SUPPLIERS`
   - `NEXT_PUBLIC_SUPPLIER_NAMES`
   - `NEXT_PUBLIC_SITE_URL`
5. **Click Save and Deploy**!

#### Multi-Site Deployment (Site 1 & Site 2 from same repo)
To deploy multiple branded storefronts from the same repository:
- Repeat the above steps: create another Worker project connected to the same repository.
- Provide the distinct environment variables (e.g. different `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_STORE_ID`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SUPPORTED_SUPPLIERS`, etc.).
- Cloudflare will build and deploy each storefront independently with its own custom domain.

### 2. Automated Nightly Scraping on GitHub Actions
The project includes an automated workflow (`.github/workflows/scrape.yml`) configured to run every night at midnight UTC (00:00 UTC / 03:00 Jerusalem Time).

To activate it, go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** and add these repository secrets:
- `SUPPLIER_PHONE`
- `SUPPLIER_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_DOMAIN`

You can also trigger a sync anytime manually by clicking **Actions** → **GB Store Automated Scraper** → **Run workflow**.

---

## 🛡️ Security Guarantees
- **Wholesale Secrecy**: The public storefront never queries the `products` table directly. It reads exclusively from the `public_products` SQL view using the anonymous key. The `wholesale_price` column does not exist in this view.
- **Admin Isolation**: All admin margin adjustments (`/api/admin/margins`) and dashboard queries execute on the server side using `SUPABASE_SERVICE_KEY`, protected by Supabase Auth sessions.


py -m scraper.run_all --supplier all --parallel --no-details

py -m scraper.run_all --supplier all --parallel --details

py -m scraper.run_all --supplier all --parallel --details --limit 10
py scraper/reset_all_data.py
