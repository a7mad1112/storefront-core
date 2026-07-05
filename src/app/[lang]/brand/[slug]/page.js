import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBrandBySlug, getProductsForBrand } from '../../../../lib/queries';
import ProductGrid from '../../../../components/product/ProductGrid';
import SortSelector from '../../../../components/product/SortSelector';
import { getDictionary } from '../../dictionaries';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) {
    return { title: 'الماركة غير موجودة — Eloria FASHION' };
  }

  const displayName = (lang === 'en' && brand.name_en) ? brand.name_en :
                      (lang === 'he' && brand.name_he) ? brand.name_he :
                      brand.name;

  return {
    title: `${displayName} — Eloria FASHION`,
    description: `تسوقي أحدث وأفضل المنتجات من ماركة ${displayName} بأسعار مميزة وجودة عالية من متجر Eloria FASHION.`,
  };
}

export default async function BrandPage({ params, searchParams }) {
  const { lang, slug } = await params;
  const { sort = 'default' } = await searchParams;
  const dict = await getDictionary(lang);
  const tCommon = dict.common || {};

  const brand = await getBrandBySlug(slug);
  if (!brand) {
    notFound();
  }

  const displayName = (lang === 'en' && brand.name_en) ? brand.name_en :
                      (lang === 'he' && brand.name_he) ? brand.name_he :
                      brand.name;

  const products = await getProductsForBrand(brand.id, { limit: 48, sort });

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href={`/${lang}`} style={{ color: 'var(--color-text-secondary)' }}>{tCommon.home || 'الرئيسية'}</Link>
        <span>/</span>
        <Link href={`/${lang}/brands`} style={{ color: 'var(--color-text-secondary)' }}>{tCommon.brands || 'الماركات'}</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{displayName}</span>
      </nav>

      {/* Header & Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
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
          <p style={{ color: 'var(--color-text-muted)' }}>{dict.sections?.latestFrom || 'عرض جميع المنتجات المتوفرة من ماركة'} {displayName}</p>
        </div>

        <SortSelector />
      </div>

      {/* Products Grid */}
      <ProductGrid products={products} emptyMessage={dict.brands?.noProducts || "لا توجد منتجات متوفرة من هذه الماركة حالياً"} />
    </div>
  );
}
