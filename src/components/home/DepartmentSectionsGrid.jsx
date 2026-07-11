'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import ProductGrid from '../product/ProductGrid';
import { getCategoryDisplayName } from '../../lib/utils';

function DepartmentCategoriesStrip({ dept, lang, isRtl }) {
  const scrollRef = useRef(null);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    if (scrollWidth <= clientWidth + 5) {
      setShowPrev(false);
      setShowNext(false);
      return;
    }
    const absLeft = Math.abs(scrollLeft);
    setShowPrev(absLeft > 10);
    setShowNext(absLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 150);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [dept.categories]);

  const scrollByAmount = (dir) => {
    if (!scrollRef.current) return;
    const amount = 300;
    if (isRtl) {
      scrollRef.current.scrollBy({ left: dir === 'next' ? -amount : amount, behavior: 'smooth' });
    } else {
      scrollRef.current.scrollBy({ left: dir === 'next' ? amount : -amount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
      {/* Scroll Prev Button */}
      <button
        type="button"
        onClick={() => scrollByAmount('prev')}
        aria-label="Previous categories"
        style={{
          position: 'absolute',
          [isRtl ? 'right' : 'left']: '-10px',
          zIndex: 10,
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-bg-primary, #fff)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: showPrev ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-text-primary)',
          fontSize: '1.1rem',
          transition: 'all 0.2s ease',
        }}
      >
        {isRtl ? '❯' : '❮'}
      </button>

      {/* Categories Strip */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        style={{
          display: 'flex',
          gap: '0.6rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
          width: '100%',
          scrollBehavior: 'smooth',
        }}
      >
        <Link
          href={dept.viewAllHref}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: dept.accentColor || 'var(--color-accent)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            textDecoration: 'none',
            boxShadow: `0 4px 10px ${dept.accentColor}30`,
            flexShrink: 0,
          }}
        >
          ✨ {lang === 'en' ? 'All Department' : lang === 'he' ? 'הכל במחלקה' : 'الكل في القسم'}
        </Link>
        {dept.categories.map((cat) => (
          <Link
            key={cat.id || cat.slug}
            href={`/${lang}/category/${cat.slug || cat.id}`}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            className="dept-section-pill"
          >
            {getCategoryDisplayName(cat, lang)}
          </Link>
        ))}
      </div>

      {/* Scroll Next Button */}
      <button
        type="button"
        onClick={() => scrollByAmount('next')}
        aria-label="Next categories"
        style={{
          position: 'absolute',
          [isRtl ? 'left' : 'right']: '-10px',
          zIndex: 10,
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-bg-primary, #fff)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: showNext ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-text-primary)',
          fontSize: '1.1rem',
          transition: 'all 0.2s ease',
        }}
      >
        {isRtl ? '❮' : '❯'}
      </button>
    </div>
  );
}

/**
 * Department Sections Grid — Curated Mall Showcases
 *
 * Renders the dedicated showcase sections for each of the 4 major departments,
 * guaranteeing comprehensive representation of all store suppliers & categories.
 */
export default function DepartmentSectionsGrid({ departments = [], lang = 'ar', dict }) {
  if (!departments || departments.length === 0) return null;

  const t = dict?.departments || {};
  const isRtl = lang === 'ar' || lang === 'he';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {departments.map((dept) => {
        if (!dept.products || dept.products.length === 0) return null;

        return (
          <section
            key={dept.id}
            id={dept.anchorId}
            className="container"
            style={{
              padding: '3.5rem var(--space-4)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.75rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ maxWidth: '680px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>{dept.icon}</span>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
                    {dept.title}
                  </h2>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {dept.subtitle}
                </p>
              </div>

              <Link
                href={dept.viewAllHref}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  padding: '0.65rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderColor: dept.accentColor || 'var(--color-border)',
                  color: dept.accentColor || 'var(--color-text-primary)',
                }}
              >
                <span>{t.viewAllProductsBtn || (lang === 'en' ? 'View All Department Products' : lang === 'he' ? 'הצג את כל מוצרי המחלקה' : 'عرض جميع منتجات القسم')}</span>
                <span>{isRtl ? '←' : '→'}</span>
              </Link>
            </div>

            {/* Department Subcategories Quick Filter Pills with Navigation Arrows */}
            {dept.categories && dept.categories.length > 0 && (
              <DepartmentCategoriesStrip dept={dept} lang={lang} isRtl={isRtl} />
            )}

            {/* Product Grid (8 products per department) */}
            <ProductGrid products={dept.products} />

            {/* Bottom CTA for mobile/desktop to jump into more department products */}
            {dept.products.length >= 4 && (
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <Link
                  href={dept.viewAllHref}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    backgroundColor: dept.accentColor || 'var(--color-accent)',
                    borderColor: dept.accentColor || 'var(--color-accent)',
                    color: '#ffffff',
                    boxShadow: `0 6px 20px ${dept.accentColor}35`,
                  }}
                >
                  <span>{t.viewAllProductsBtn || (lang === 'en' ? 'View All Department Products' : lang === 'he' ? 'הצג את כל מוצרי המחלקה' : 'عرض جميع منتجات القسم')}</span>
                  <span style={{ marginInlineStart: '0.5rem' }}>{isRtl ? '←' : '→'}</span>
                </Link>
              </div>
            )}
          </section>
        );
      })}

      <style jsx global>{`
        .dept-section-pill:hover {
          background-color: var(--color-bg-tertiary) !important;
          border-color: var(--color-text-primary) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
