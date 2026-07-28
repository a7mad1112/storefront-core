import React from 'react';

export default function CategoryLoading() {
  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '5rem' }}>
      {/* Breadcrumb skeleton */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="skeleton" style={{ height: '14px', width: '60px' }} />
        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
        <div className="skeleton" style={{ height: '14px', width: '90px' }} />
      </div>

      {/* Title & Sort row skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          {/* Category title */}
          <div className="skeleton" style={{ height: '36px', width: '220px', marginBottom: '0.75rem' }} />
          {/* Subtitle */}
          <div className="skeleton" style={{ height: '16px', width: '280px' }} />
        </div>
        {/* Sort selector */}
        <div className="skeleton" style={{ height: '38px', width: '160px', borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* Subcategory pills skeleton */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="skeleton"
            style={{
              height: '36px',
              width: `${80 + Math.random() * 60}px`,
              borderRadius: 'var(--radius-full)',
            }}
          />
        ))}
      </div>

      {/* Product grid skeleton */}
      <div className="product-grid">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="product-card"
            style={{ pointerEvents: 'none' }}
          >
            <div className="product-card-img-wrapper">
              <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
            </div>
            <div className="product-card-body">
              <div>
                <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ height: '16px', width: '85%', marginBottom: '0.35rem' }} />
                <div className="skeleton" style={{ height: '16px', width: '60%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem' }}>
                <div className="skeleton" style={{ height: '20px', width: '60px' }} />
                <div className="skeleton" style={{ height: '32px', width: '90px', borderRadius: 'var(--radius-md)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
