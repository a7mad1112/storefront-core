import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getSubcategories, getProductsForCategory } from '../../../../../../lib/queries';
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
  const category = await getCategoryBySlug(slug, { supplierCode: supplier_code });
  const meta = getSupplierConfig(supplier_code, lang);

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
  if (!category) {
    return { title: `القسم غير موجود — ${storeName}` };
  }

  const displayName = getCategoryDisplayName(category, lang);

  return {
    title: `${displayName} (${meta.name}) — ${storeName}`,
    description: `تسوقي أفضل المنتجات في قسم ${displayName} ضمن ${meta.name} بأسعار مميزة وجودة عالية.`,
  };
}

export default async function SupplierCategoryPage({ params, searchParams }) {
  const { lang, supplier_code, slug } = await params;
  const { sort = 'default', page = '1' } = await searchParams;
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const dict = await getDictionary(lang);
  const tCommon = dict.common || {};
  const meta = getSupplierConfig(supplier_code, lang);

  const category = await getCategoryBySlug(slug, { supplierCode: supplier_code });
  if (!category) {
    notFound();
  }

  const displayName = getCategoryDisplayName(category, lang);

  const [subcategories, { products, totalCount }, parentCategory] = await Promise.all([
    getSubcategories(category.id, { supplierCode: supplier_code }),
    getProductsForCategory(category.id, { limit: PAGE_SIZE, offset, sort, supplierCode: supplier_code }),
    category.parent_id ? getCategoryBySlug(category.parent_id, { supplierCode: supplier_code }) : Promise.resolve(null),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const parentDisplayName = parentCategory ? getCategoryDisplayName(parentCategory, lang) : '';

  const basePath = `/${lang}/supplier/${supplier_code}/category/${slug}`;
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
        {parentCategory && (
          <>
            <Link href={`/${lang}/supplier/${supplier_code}/category/${parentCategory.slug || parentCategory.id}`} style={{ color: 'var(--color-text-secondary)' }}>
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
          <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            {meta.icon} {meta.name}
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{displayName}</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {dict.product?.showingAllIn || (lang === 'en' ? 'Showing all available products in ' : lang === 'he' ? 'מציג את כל המוצרים הזמינים בקטגוריית ' : 'عرض جميع المنتجات المتوفرة في قسم ')}
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

      {/* Subcategories Pills */}
      {subcategories.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {subcategories.map((sub) => {
            const subName = getCategoryDisplayName(sub, lang);
            return (
              <Link
                key={sub.id}
                href={`/${lang}/supplier/${supplier_code}/category/${sub.slug || sub.id}`}
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

      {/* Products Grid */}
      <ProductGrid
        products={products}
        emptyMessage={dict.product?.noProducts || (lang === 'en' ? 'No products available right now' : lang === 'he' ? 'אין מוצרים זמינים כעת' : "لا توجد منتجات متوفرة في هذا القسم حالياً")}
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
