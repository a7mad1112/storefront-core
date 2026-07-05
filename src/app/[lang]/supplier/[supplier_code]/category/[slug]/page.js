import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getSubcategories, getProductsForCategory } from '../../../../../../lib/queries';
import { getSupplierConfig } from '../../../../../../lib/supplierConfig';
import ProductGrid from '../../../../../../components/product/ProductGrid';
import SortSelector from '../../../../../../components/product/SortSelector';
import { getDictionary } from '../../../../dictionaries';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { lang, supplier_code, slug } = await params;
  const category = await getCategoryBySlug(slug);
  const meta = getSupplierConfig(supplier_code, lang);

  if (!category) {
    return { title: 'القسم غير موجود — Eloria FASHION' };
  }

  const displayName = (lang === 'en' && category.name_en) ? category.name_en :
                      (lang === 'he' && category.name_he) ? category.name_he :
                      category.name;

  return {
    title: `${displayName} (${meta.name}) — Eloria FASHION`,
    description: `تسوقي أفضل المنتجات في قسم ${displayName} من مورد ${meta.name} بأسعار مميزة وجودة عالية.`,
  };
}

export default async function SupplierCategoryPage({ params, searchParams }) {
  const { lang, supplier_code, slug } = await params;
  const { sort = 'default' } = await searchParams;
  const dict = await getDictionary(lang);
  const tCommon = dict.common || {};
  const meta = getSupplierConfig(supplier_code, lang);

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const displayName = (lang === 'en' && category.name_en) ? category.name_en :
                      (lang === 'he' && category.name_he) ? category.name_he :
                      category.name;

  const [subcategories, products, parentCategory] = await Promise.all([
    getSubcategories(category.id, { supplierCode: supplier_code }),
    getProductsForCategory(category.id, { limit: 48, sort, supplierCode: supplier_code }),
    category.parent_id ? getCategoryBySlug(category.parent_id) : Promise.resolve(null),
  ]);

  const parentDisplayName = parentCategory ? (
    (lang === 'en' && parentCategory.name_en) ? parentCategory.name_en :
    (lang === 'he' && parentCategory.name_he) ? parentCategory.name_he :
    parentCategory.name
  ) : '';

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
          <p style={{ color: 'var(--color-text-muted)' }}>{dict.product?.showingAllIn || 'عرض جميع المنتجات المتوفرة في قسم'} {displayName} ({meta.name})</p>
        </div>
        <SortSelector />
      </div>

      {/* Subcategories Pills */}
      {subcategories.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {subcategories.map((sub) => {
            const subName = (lang === 'en' && sub.name_en) ? sub.name_en :
                            (lang === 'he' && sub.name_he) ? sub.name_he :
                            sub.name;
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
      <ProductGrid products={products} emptyMessage={dict.product?.noProducts || "لا توجد منتجات متوفرة في هذا القسم حالياً"} />
    </div>
  );
}
