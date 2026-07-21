import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBrandBySlug, getProductsForBrand } from '../../../../../../lib/queries';
import { getSupplierConfig } from '../../../../../../lib/supplierConfig';
import ProductGrid from '../../../../../../components/product/ProductGrid';
import SortSelector from '../../../../../../components/product/SortSelector';
import Pagination from '../../../../../../components/product/Pagination';
import { getDictionary } from '../../../../dictionaries';
import { getCategoryDisplayName } from '../../../../../../lib/utils';

export const revalidate = 60;

const PAGE_SIZE = 48;

export async function generateMetadata({ params }) {
  const { lang, supplier_code, slug } = await params;
  const brand = await getBrandBySlug(slug, { supplierCode: supplier_code });
  const meta = getSupplierConfig(supplier_code, lang);

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
  if (!brand) {
    return { title: `الماركة غير موجودة — ${storeName}` };
  }

  const displayName = getCategoryDisplayName(brand, lang);

  return {
    title: `${displayName} (${meta.name}) — ${storeName}`,
    description: `تسوقي أحدث وأفضل المنتجات من ماركة ${displayName} لدى ${meta.name} بأسعار مميزة وجودة عالية.`,
  };
}

export default async function SupplierBrandPage({ params, searchParams }) {
  const { lang, supplier_code, slug } = await params;
  const { sort = 'default', page = '1' } = await searchParams;
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const dict = await getDictionary(lang);
  const tCommon = dict.common || {};
  const meta = getSupplierConfig(supplier_code, lang);

  const brand = await getBrandBySlug(slug, { supplierCode: supplier_code });
  if (!brand) {
    notFound();
  }

  const displayName = getCategoryDisplayName(brand, lang);

  const { products, totalCount } = await getProductsForBrand(brand.id, { limit: PAGE_SIZE, offset, sort, supplierCode: supplier_code });
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const basePath = `/${lang}/supplier/${supplier_code}/brand/${slug}`;
  const resolvedSearchParams = { sort, page };

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href={`/${lang}`} style={{ color: 'var(--color-text-secondary)' }}>{tCommon.home || 'الرئيسية'}</Link>
        <span>/</span>
        <Link href={`/${lang}/supplier/${supplier_code}`} style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>
          {meta.badge || meta.name}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{displayName}</span>
      </nav>

      {/* Header & Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            {meta.icon} {meta.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            {brand.image_url && (
              <img
                src={brand.image_url}
                alt={displayName}
                style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              />
            )}
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{displayName}</h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {dict.sections?.latestFrom || (lang === 'en' ? 'Latest curated selection from brand ' : lang === 'he' ? 'מבחר חדש מהמותג ' : 'عرض جميع المنتجات المتوفرة من ماركة ')}
            {displayName} ({meta.name})
            {totalCount > 0 && (
              <span style={{ marginInlineStart: '0.5rem', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                · {totalCount} {lang === 'en' ? 'products' : lang === 'he' ? 'מוצרים' : 'منتج'}
              </span>
            )}
          </p>
        </div>

        <SortSelector />
      </div>

      {/* Products Grid */}
      <ProductGrid
        products={products}
        emptyMessage={dict.brands?.noProducts || (lang === 'en' ? 'No products available for this brand right now' : lang === 'he' ? 'אין מוצרים זמינים למותג זה כרגע' : "لا توجد منتجات متوفرة من هذه الماركة في هذا القسم حالياً")}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={basePath}
        searchParams={resolvedSearchParams}
        lang={lang}
      />
    </div>
  );
}
