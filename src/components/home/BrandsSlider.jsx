'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { getCategoryDisplayName } from '../../lib/utils';

export default function BrandsSlider({ brands = [], lang = 'ar', dict, supplierCode = null }) {
  const scrollRef = useRef(null);

  if (!brands || brands.length === 0) return null;

  const tSections = dict?.sections || {};

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const getBrandHref = (brandSlug) => {
    return supplierCode ? `/${lang}/supplier/${supplierCode}/brand/${brandSlug}` : `/${lang}/brand/${brandSlug}`;
  };

  const getAllBrandsHref = () => {
    return supplierCode ? `/${lang}/supplier/${supplierCode}` : `/${lang}/brands`;
  };

  return (
    <section className="container" style={{ padding: '2rem var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{tSections.shopByBrand || (lang === 'en' ? '🏷️ Shop by Brand' : lang === 'he' ? '🏷️ קנו לפי מותג' : '🏷️ تسوق حسب الماركة')}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {tSections.shopByBrandDesc || (lang === 'en' ? 'Top international brands in our store' : lang === 'he' ? 'המותגים המובילים בחנות שלנו' : 'أشهر الماركات العالمية في متجرنا')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => scroll('left')}
            className="btn btn-secondary"
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Previous brands"
          >
            ←
          </button>
          <button
            onClick={() => scroll('right')}
            className="btn btn-secondary"
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Next brands"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="brands-scroll-container"
      >
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={getBrandHref(brand.slug || brand.id)}
            className="brand-pill"
          >
            {brand.image_url ? (
              <img
                src={brand.image_url}
                alt={getCategoryDisplayName(brand, lang)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--color-border)',
                }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  border: '1px solid var(--color-border)',
                }}
              >
                🏷️
              </div>
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {getCategoryDisplayName(brand, lang)}
            </span>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link
          href={getAllBrandsHref()}
          className="btn btn-secondary"
          style={{ fontSize: '0.875rem' }}
        >
          {tSections.viewAllBrands || (lang === 'en' ? 'View All Brands →' : lang === 'he' ? 'הצג את כל המותגים ←' : 'عرض جميع الماركات ←')}
        </Link>
      </div>
    </section>
  );
}
