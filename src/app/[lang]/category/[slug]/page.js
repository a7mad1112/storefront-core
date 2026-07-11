import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getSubcategories, getProductsForCategory } from '../../../../lib/queries';
import ProductGrid from '../../../../components/product/ProductGrid';
import SortSelector from '../../../../components/product/SortSelector';
import { getDictionary } from '../../dictionaries';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: 'القسم غير موجود — Eloria FASHION' };
  }

  const displayName = (lang === 'en' && category.name_en) ? category.name_en :
                      (lang === 'he' && category.name_he) ? category.name_he :
                      category.name;

  return {
    title: `${displayName} — Eloria FASHION`,
    description: `تسوقي أفضل المنتجات في قسم ${displayName} بأسعار مميزة وجودة عالية من متجر Eloria FASHION.`,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { lang, slug } = await params;
  const { sort = 'default' } = await searchParams;
  const dict = await getDictionary(lang);
  const tCommon = dict.common || {};

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const displayName = (lang === 'en' && category.name_en) ? category.name_en :
                      (lang === 'he' && category.name_he) ? category.name_he :
                      category.name;

  const [subcategories, products, parentCategory] = await Promise.all([
    getSubcategories(category.id),
    getProductsForCategory(category.id, { limit: 48, sort }),
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
        {parentCategory && (
          <>
            <Link href={`/${lang}/category/${parentCategory.slug || parentCategory.id}`} style={{ color: 'var(--color-text-secondary)' }}>
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
          <p style={{ color: 'var(--color-text-muted)' }}>{dict.product?.showingAllIn || (lang === 'en' ? 'Showing all available products in ' : lang === 'he' ? 'מציג את כל המוצרים הזמינים בקטגוריית ' : 'عرض جميع المنتجات المتوفرة في قسم ')} {displayName}</p>
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
                href={`/${lang}/category/${sub.slug || sub.id}`}
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
      <ProductGrid products={products} emptyMessage={dict.product?.noProducts || (lang === 'en' ? 'No products available right now' : lang === 'he' ? 'אין מוצרים זמינים כעת' : "لا توجد منتجات متوفرة في هذا القسم حالياً")} />
    </div>
  );
}
