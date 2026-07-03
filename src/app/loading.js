import React from 'react';

export default function Loading() {
  return (
    <div className="container" style={{ padding: '4rem var(--space-4)' }}>
      <div className="skeleton" style={{ height: '40px', width: '250px', marginBottom: '2rem' }} />
      <div className="product-grid">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', padding: '1rem', border: '1px solid var(--color-border)' }}>
            <div className="skeleton" style={{ width: '100%', paddingTop: '100%', marginBottom: '1rem', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '20px', width: '80%', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ height: '24px', width: '40%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
