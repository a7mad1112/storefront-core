import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, emptyMessage = 'لا توجد منتجات مطابقة حالياً' }) {
  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
