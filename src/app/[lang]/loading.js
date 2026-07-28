import React from 'react';

export default function Loading() {
  return (
    <div className="container" style={{ padding: '4rem var(--space-4)' }}>
      {/* Title skeleton */}
      <div className="skeleton" style={{ height: '40px', width: '250px', marginBottom: '0.75rem' }} />
      {/* Subtitle skeleton */}
      <div className="skeleton" style={{ height: '16px', width: '180px', marginBottom: '2.5rem' }} />

      {/* Product grid skeleton */}
      <div className="product-grid">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="product-card"
            style={{ pointerEvents: 'none' }}
          >
            {/* Image skeleton — 1:1 aspect ratio */}
            <div className="product-card-img-wrapper">
              <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
            </div>
            {/* Body skeleton */}
            <div className="product-card-body">
              <div>
                {/* Category label */}
                <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '0.5rem' }} />
                {/* Title line 1 */}
                <div className="skeleton" style={{ height: '16px', width: '85%', marginBottom: '0.35rem' }} />
                {/* Title line 2 */}
                <div className="skeleton" style={{ height: '16px', width: '60%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem' }}>
                {/* Price */}
                <div className="skeleton" style={{ height: '20px', width: '60px' }} />
                {/* Add to cart button */}
                <div className="skeleton" style={{ height: '32px', width: '90px', borderRadius: 'var(--radius-md)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
