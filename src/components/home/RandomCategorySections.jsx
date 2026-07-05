'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProductGrid from '../product/ProductGrid';

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
        // Smart CTA logic: only show "view all" button if category has > 4 products
        const hasMoreThanFour = products && products.length > 4;
        const displayProducts = products ? products.slice(0, 4) : [];

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
                  ✨ {category.name}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {tSections.latestFrom || 'أحدث تشكيلة مختارة من قسم'} {category.name}
                </p>
              </div>
              {hasMoreThanFour && (
                <Link
                  href={`/${lang}/category/${category.slug || category.id}`}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem' }}
                >
                  {tSections.viewCategoryProducts || 'عرض كل منتجات القسم ←'}
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
