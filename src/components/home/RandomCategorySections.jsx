'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProductGrid from '../product/ProductGrid';
import { getCategoryDisplayName } from '../../lib/utils';

export default function RandomCategorySections({ candidateSections = [], lang = 'ar', dict }) {
  const [selectedSections] = useState(() => {
    if (!candidateSections || candidateSections.length === 0) return [];
    return [...candidateSections].sort(() => Math.random() - 0.5).slice(0, 3);
  });

  if (selectedSections.length === 0) return null;

  const tSections = dict?.sections || {};

  return (
    <>
      {selectedSections.map(({ category, products }) => {
        const hasMoreThanFour = products && products.length > 4;
        const displayProducts = products ? products.slice(0, 4) : [];
        const catName = getCategoryDisplayName(category, lang);

        return (
          <section key={category.id} className="container" style={{ padding: '3rem var(--space-4)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  ✨ {catName}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {tSections.latestFrom || (lang === 'en' ? 'Latest curated selection from ' : lang === 'he' ? 'מבחר עדכני מתוך ' : 'أحدث تشكيلة مختارة من قسم ')} {catName}
                </p>
              </div>
              {hasMoreThanFour && (
                <Link
                  href={`/${lang}/category/${category.slug || category.id}`}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem' }}
                >
                  {tSections.viewCategoryProducts || (lang === 'en' ? 'View All Category Products →' : lang === 'he' ? 'הצג את כל מוצרי הקטגוריה ←' : 'عرض كل منتجات القسم ←')}
                </Link>
              )}
            </div>

            <ProductGrid products={displayProducts} />
          </section>
        );
      })}
    </>
  );
}
