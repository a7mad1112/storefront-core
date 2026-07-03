'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../lib/utils';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <div className="product-card">
      <Link href={`/product/${product.id}`} className="product-card-img-wrapper">
        <img
          src={product.image_url || '/placeholder.webp'}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
        />
      </Link>

      <div className="product-card-body">
        <div>
          {product.category_name && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              {product.category_name}
            </span>
          )}
          <Link href={`/product/${product.id}`}>
            <h3 className="product-card-title">{product.name}</h3>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.75rem' }}>
          <div className="product-card-price">
            {formatPrice(product.retail_price || 0)}
          </div>

          <button
            onClick={() => addItem(product, 1)}
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            + أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
