'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { useDictionary } from '../../context/DictionaryContext';

export default function ProductGrid({ products, emptyMessage }) {
  let dict = {};
  try {
    const res = useDictionary();
    dict = res.dict || {};
  } catch (e) {
    // Fallback if rendered outside DictionaryProvider
  }

  const defaultEmpty = dict?.product?.noProducts || 'لا توجد منتجات مطابقة حالياً';
  const displayEmpty = emptyMessage || defaultEmpty;

  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{displayEmpty}</p>
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
