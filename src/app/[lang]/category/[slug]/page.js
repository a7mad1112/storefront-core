import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getSubcategories, getProductsForCategory } from '../../../../lib/queries';
import LoadMoreGrid from '../../../../components/product/LoadMoreGrid';
import SortSelector from '../../../../components/product/SortSelector';
import { getDictionary } from '../../dictionaries';
import { getCategoryDisplayName } from '../../../../lib/utils';

export const revalidate = 60;

const PAGE_SIZE = 48;

export async function generateMetadata({ params, searchParams }) {
  const { lang, slug } = await params;
  const { supplier } = await searchParams;
  const category = await getCategoryBySlug(slug, { supplierCode: supplier || null });

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
  if (!category) {
    return { title: `القسم غير موجود — ${storeName}` };
  }

  const displayName = getCategoryDisplayName(category, lang);

  return {
    title: `${displayName} — ${storeName}`,
    description: `تسوقي أفضل المنتجات في قسم ${displayName} بأسعار مميزة وجودة عالية من متجر ${storeName}.`,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { lang, slug } = await params;
  const { sort = 'default', supplier = '' } = await searchParams;
  const supplierCode = supplier || null;

  const dict = await getDictionary(lang);
  const tCommon = dict.common || {};

  const category = await getCategoryBySlug(slug, { supplierCode });
  if (!category) {
    notFound();
  }

  // Use the category's own supplier_code if available, falling back to query param
  const effectiveSupplier = category.supplier_code || supplierCode;

  const displayName = getCategoryDisplayName(category, lang);

  const [subcategories, { products, totalCount }, parentCategory] = await Promise.all([
    getSubcategories(category.id, { supplierCode: effectiveSupplier }),
    getProductsForCategory(category.id, { limit: PAGE_SIZE, offset: 0, sort, supplierCode: effectiveSupplier }),
    category.parent_id ? getCategoryBySlug(category.parent_id, { supplierCode: effectiveSupplier }) : Promise.resolve(null),
  ]);

  const parentDisplayName = parentCategory ? getCategoryDisplayName(parentCategory, lang) : '';

  // Build fetch params for LoadMoreGrid client-side fetching
  const fetchParams = {
    categoryId: category.id,
    sort,
    ...(effectiveSupplier ? { supplierCode: effectiveSupplier } : {}),
  };

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href={`/${lang}`} style={{ color: 'var(--color-text-secondary)' }}>{tCommon.home || 'الرئيسية'}</Link>
        <span>/</span>
        {parentCategory && (
          <>
            <Link href={`/${lang}/category/${parentCategory.slug || parentCategory.id}${effectiveSupplier ? `?supplier=${effectiveSupplier}` : ''}`} style={{ color: 'var(--color-text-secondary)' }}>
              {parentDisplayName}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{displayName}</span>
      </nav>

      {/* Header & Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{displayName}</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {dict.product?.showingAllIn || (lang === 'en' ? 'Showing all available products in ' : lang === 'he' ? 'מציג את כל המוצרים הזמינים בקטגוריית ' : 'عرض جميع المنتجات المتوفرة في قسم ')}
            {displayName}
            {totalCount > 0 && (
              <span style={{ marginInlineStart: '0.5rem', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                ({totalCount})
              </span>
            )}
          </p>
        </div>
        <SortSelector />
      </div>

      {/* Subcategories Pills */}
      {subcategories.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {subcategories.map((sub) => {
            const subName = getCategoryDisplayName(sub, lang);
            return (
              <Link
                key={sub.id}
                href={`/${lang}/category/${sub.slug || sub.id}${effectiveSupplier ? `?supplier=${effectiveSupplier}` : ''}`}
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  transition: 'all var(--transition-fast)',
                }}
              >
                🔹 {subName}
              </Link>
            );
          })}
        </div>
      )}

      {/* Products Grid with Load More */}
      <LoadMoreGrid
        initialProducts={products}
        totalCount={totalCount}
        fetchUrl="/api/products"
        fetchParams={fetchParams}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
