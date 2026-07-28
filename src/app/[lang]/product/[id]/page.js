import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, getCategoryBySlug } from '../../../../lib/queries';
import ProductDetailActions from '../../../../components/product/ProductDetailActions';
import { getDictionary } from '../../dictionaries';
import { getCategoryDisplayName } from '../../../../lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { lang, id } = await params;
  const product = await getProductById(id);

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
  if (!product) {
    return { title: `المنتج غير موجود — ${storeName}` };
  }

  const displayName = (lang === 'en' && product.name_en) ? product.name_en :
                      (lang === 'he' && product.name_he) ? product.name_he :
                      product.name;

  return {
    title: `${displayName} — ${storeName}`,
    description: product.description ? product.description.slice(0, 160) : `تسوقي ${displayName} بأفضل سعر وجودة في متجر ${storeName}.`,
    openGraph: {
      images: product.image_url ? [product.image_url] : [],
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

  const [category, parentCategory] = await Promise.all([
    product.category_slug ? getCategoryBySlug(product.category_slug, { supplierCode: product.supplier_code }) : Promise.resolve(null),
    product.category_slug ? getCategoryBySlug(product.category_slug, { supplierCode: product.supplier_code }).then(c => c && c.parent_id ? getCategoryBySlug(c.parent_id, { supplierCode: product.supplier_code }) : null) : Promise.resolve(null)
  ]);

  const displayName = (lang === 'en' && product.name_en) ? product.name_en :
                      (lang === 'he' && product.name_he) ? product.name_he :
                      product.name;

  const catName = getCategoryDisplayName(category || product.category_name, lang);
  const parentCatName = parentCategory ? getCategoryDisplayName(parentCategory, lang) : '';

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '6rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href={`/${lang}`} style={{ color: 'var(--color-text-secondary)' }}>{tCommon.home || 'الرئيسية'}</Link>
        <span>/</span>
        {parentCategory && (
          <>
            <Link href={`/${lang}/category/${parentCategory.slug || parentCategory.id}?supplier=${product.supplier_code || ''}`} style={{ color: 'var(--color-text-secondary)' }}>
              {parentCatName}
            </Link>
            <span>/</span>
          </>
        )}
        {(category || product.category_slug) && (
          <>
            <Link href={`/${lang}/category/${category?.slug || product.category_slug}?supplier=${product.supplier_code || ''}`} style={{ color: 'var(--color-text-secondary)' }}>
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
