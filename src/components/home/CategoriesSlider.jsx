'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { getCategoryDisplayName } from '../../lib/utils';

/**
 * Horizontal scrolling categories carousel for the homepage.
 * Mobile: swipe to scroll. Desktop: arrow navigation.
 */
export default function CategoriesSlider({ categories = [], lang = 'ar', dict, supplierCode = null }) {
  const scrollRef = useRef(null);

  if (!categories || categories.length === 0) return null;

  const t = dict?.sections || {};

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const getEmoji = (name) => {
    if (name.includes('شنط')) return '👜';
    if (name.includes('عطر') || name.includes('عطور')) return '🌸';
    if (name.includes('ساع')) return '⌚';
    if (name.includes('نظار')) return '🕶️';
    return '🎁';
  };

  const getCategoryHref = (catSlug) => {
    return supplierCode ? `/${lang}/supplier/${supplierCode}/category/${catSlug}` : `/${lang}/category/${catSlug}`;
  };

  const getAllCategoriesHref = () => {
    return supplierCode ? `/${lang}/supplier/${supplierCode}` : `/${lang}/categories`;
  };

  return (
    <section className="container" style={{ padding: '2rem var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {t.shopByCategory || 'تسوق حسب القسم'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {t.shopByCategoryDesc || 'اختر من بين تشكيلتنا الواسعة من الفئات المميزة'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => scroll('right')}
            className="slider-arrow"
            aria-label="Next"
            title="تمرير لليمين"
          >
            →
          </button>
          <button
            onClick={() => scroll('left')}
            className="slider-arrow"
            aria-label="Previous"
            title="تمرير لليسار"
          >
            ←
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="brands-scroll-container"
      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={getCategoryHref(cat.slug || cat.id)}
            className="brand-pill"
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                border: '1px solid var(--color-border)',
                flexShrink: 0,
              }}
            >
              {getEmoji(cat.name)}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {getCategoryDisplayName(cat, lang)}
            </span>
          </Link>
        ))}
      </div>

      {/* View All link */}
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link
          href={getAllCategoriesHref()}
          className="btn btn-secondary"
          style={{ fontSize: '0.875rem' }}
        >
          {t.viewAllCategories || (lang === 'en' ? 'View All Categories →' : lang === 'he' ? 'הצג את כל הקטגוריות ←' : 'عرض جميع الأقسام ←')}
        </Link>
      </div>
    </section>
  );
}
