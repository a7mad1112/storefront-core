import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, hasLocale } from '../../dictionaries';
import { getCategories, getBrands, getProducts } from '../../../../lib/queries';
import { getSupplierConfig } from '../../../../lib/supplierConfig';
import CategoriesSlider from '../../../../components/home/CategoriesSlider';
import BrandsSlider from '../../../../components/home/BrandsSlider';
import ProductGrid from '../../../../components/product/ProductGrid';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { lang, supplier_code } = await params;
  if (!hasLocale(lang)) notFound();

  const meta = getSupplierConfig(supplier_code, lang);

  return {
    title: `${meta.name} — Eloria FASHION`,
    description: meta.description,
  };
}

export default async function SupplierPortalPage({ params }) {
  const { lang, supplier_code } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const tCommon = dict.common || {};
  const meta = getSupplierConfig(supplier_code, lang);

  const [categories, brands, products] = await Promise.all([
    getCategories({ supplierCode: supplier_code }),
    getBrands({ supplierCode: supplier_code }),
    getProducts({ supplierCode: supplier_code, limit: 48 }),
  ]);

  const topCategories = categories.filter((c) => !c.parent_id);

  return (
    <div>
      {/* Supplier Hero Banner */}
      <section
        style={{
          position: 'relative',
          padding: '3.5rem 0',
          background: meta.bgGradient || 'var(--color-bg-elevated)',
          color: '#fff',
          borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
            <Link href={`/${lang}`} style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'underline' }}>
              {tCommon.home || 'الرئيسية'}
            </Link>
            <span>/</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>{meta.badge || meta.name}</span>
          </nav>

          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {meta.icon || '🏪'}
          </div>

          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              padding: '0.25rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem',
              fontWeight: 800,
              marginBottom: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {meta.badge || 'مورد حصري'}
          </span>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
            {meta.name}
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '2rem', lineHeight: 1.7, maxWidth: '650px', margin: '0 auto 2rem' }}>
            {meta.description}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#supplier-products" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem', backgroundColor: meta.themeColor || 'var(--color-accent)', borderColor: meta.themeColor || 'var(--color-accent)', color: '#fff' }}>
              🛍️ {dict.hero?.browseProducts || 'تصفح المنتجات'}
            </a>
          </div>
        </div>
      </section>

      {/* Categories Slider */}
      <CategoriesSlider categories={topCategories} lang={lang} dict={dict} supplierCode={supplier_code} />

      {/* Brands Slider */}
      <BrandsSlider brands={brands} lang={lang} dict={dict} supplierCode={supplier_code} />

      {/* Products Grid Section */}
      <section id="supplier-products" className="container" style={{ padding: '2rem var(--space-4)', paddingBottom: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              ✨ {dict.product?.showingAllIn || 'جميع منتجات'} {meta.name}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {products.length} {dict.product?.productsCount || (lang === 'en' ? 'products available right now' : lang === 'he' ? 'מוצרים זמינים כעת' : 'منتج متوفر حالياً')}
            </p>
          </div>
        </div>

        <ProductGrid products={products} emptyMessage={dict.product?.noProducts || (lang === 'en' ? 'No products available right now' : lang === 'he' ? 'אין מוצרים זמינים כעת' : 'لا توجد منتجات متوفرة في هذا القسم حالياً')} />
      </section>
    </div>
  );
}
