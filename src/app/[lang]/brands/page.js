import React from 'react';
import Link from 'next/link';
import { getBrands } from '../../../lib/queries';
import { getCategoryDisplayName } from '../../../lib/utils';
import { getDictionary } from '../dictionaries';
import { getSupplierConfig } from '../../../lib/supplierConfig';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: `${dict.brands?.title || 'جميع الماركات'} — Eloria FASHION`,
    description: dict.brands?.subtitle || 'تصفح جميع الماركات والعلامات التجارية المتوفرة في متجر Eloria FASHION.',
  };
}

export default async function BrandsPage({ params, searchParams }) {
  const { lang } = await params;
  const { supplier } = (await searchParams) || {};
  const dict = await getDictionary(lang);
  const tBrands = dict.brands || {};
  const tCommon = dict.common || {};
  const brands = await getBrands({ supplierCode: supplier || null });
  const meta = supplier ? getSupplierConfig(supplier, lang) : null;

  const getBrandHref = (slugOrId) => supplier ? `/${lang}/supplier/${supplier}/brand/${slugOrId}` : `/${lang}/brand/${slugOrId}`;

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '6rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link href={`/${lang}`} style={{ color: 'var(--color-text-secondary)' }}>{tCommon.home || 'الرئيسية'}</Link>
        {supplier && meta && (
          <>
            <span>/</span>
            <Link href={`/${lang}/supplier/${supplier}`} style={{ color: 'var(--color-text-secondary)' }}>{meta.badge || meta.name}</Link>
          </>
        )}
        <span>/</span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{tBrands.title || 'جميع الماركات'}</span>
      </nav>

      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {supplier && meta ? `🏷️ ${dict.brands?.title || 'ماركات'} (${meta.name})` : `🏷️ ${tBrands.title || 'تصفح جميع الماركات'}`}
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {supplier && meta ? `تصفح جميع الماركات المتوفرة في ${meta.name}` : (tBrands.subtitle || 'اختر الماركة لتصفح أحدث تشكيلة من الشنط، العطور، والاكسسوارات الفاخرة')}
        </p>
      </div>

      {brands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</p>
          <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{tBrands.noProducts || 'لا توجد ماركات مضافة حالياً'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={getBrandHref(brand.slug || brand.id)}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '1rem',
                transition: 'all var(--transition-base)',
              }}
              className="brand-card-item"
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                }}
              >
                {brand.image_url ? (
                  <img
                    src={brand.image_url}
                    alt={getCategoryDisplayName(brand, lang)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }}
                  />
                ) : (
                  '🏷️'
                )}
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{getCategoryDisplayName(brand, lang)}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  {dict.sections?.viewAllBrands || 'تصفح منتجات الماركة ←'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
