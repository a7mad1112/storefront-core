import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, getCategoryBySlug } from '../../../../lib/queries';
import ProductDetailActions from '../../../../components/product/ProductDetailActions';
import { getDictionary } from '../../dictionaries';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { lang, id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return { title: 'المنتج غير موجود — Eloria FASHION' };
  }

  const displayName = (lang === 'en' && product.name_en) ? product.name_en :
                      (lang === 'he' && product.name_he) ? product.name_he :
                      product.name;

  const desc = product.description || `تسوقي ${displayName} بأفضل الأسعار وأعلى معايير الجودة من متجر Eloria FASHION.`;

  return {
    title: `${displayName} — Eloria FASHION`,
    description: desc,
    openGraph: {
      title: `${displayName} — Eloria FASHION`,
      description: desc,
      images: [product.image_url || '/placeholder.webp'],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang);
  const tCommon = dict.common || {};

  const product = await getProductById(id);
  if (!product) {
    notFound();
  }

  const category = product.category_id ? await getCategoryBySlug(product.category_id) : null;
  const parentCategory = category?.parent_id ? await getCategoryBySlug(category.parent_id) : null;

  const displayName = (lang === 'en' && product.name_en) ? product.name_en :
                      (lang === 'he' && product.name_he) ? product.name_he :
                      product.name;

  const catName = category ? (
    (lang === 'en' && category.name_en) ? category.name_en :
    (lang === 'he' && category.name_he) ? category.name_he :
    category.name
  ) : (product.category_name || '');

  const parentCatName = parentCategory ? (
    (lang === 'en' && parentCategory.name_en) ? parentCategory.name_en :
    (lang === 'he' && parentCategory.name_he) ? parentCategory.name_he :
    parentCategory.name
  ) : '';

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '6rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href={`/${lang}`} style={{ color: 'var(--color-text-secondary)' }}>{tCommon.home || 'الرئيسية'}</Link>
        <span>/</span>
        {parentCategory && (
          <>
            <Link href={`/${lang}/category/${parentCategory.slug || parentCategory.id}`} style={{ color: 'var(--color-text-secondary)' }}>
              {parentCatName}
            </Link>
            <span>/</span>
          </>
        )}
        {(category || product.category_slug) && (
          <>
            <Link href={`/${lang}/category/${category?.slug || product.category_slug}`} style={{ color: 'var(--color-text-secondary)' }}>
              {catName}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{displayName}</span>
      </nav>

      {/* Main Grid */}
      <ProductDetailActions product={product} category={category} parentCategory={parentCategory} lang={lang} dict={dict} />
    </div>
  );
}
