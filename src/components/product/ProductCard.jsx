'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useDictionary } from '../../context/DictionaryContext';
import { formatPrice } from '../../lib/utils';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  let dict = {};
  let lang = 'ar';
  try {
    const res = useDictionary();
    dict = res.dict || {};
    lang = res.lang || 'ar';
  } catch (e) {
    // Fallback if rendered outside DictionaryProvider
  }

  const tProduct = dict.product || {};
  const colorsText = tProduct.colors || 'الألوان';
  const addToCartText = tProduct.addToCart || '+ أضف للسلة';

  // Choose display name based on locale
  const displayName = (lang === 'en' && product.name_en) ? product.name_en :
                      (lang === 'he' && product.name_he) ? product.name_he :
                      product.name;

  return (
    <div className="product-card">
      <Link href={`/${lang}/product/${product.id}`} className="product-card-img-wrapper">
        <img
          src={product.image_url || '/placeholder.webp'}
          alt={displayName}
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
          <Link href={`/${lang}/product/${product.id}`}>
            <h3 className="product-card-title">{displayName}</h3>
          </Link>
          {(() => {
            const effectiveColors = (product.color_variants && product.color_variants.length > 0)
              ? product.color_variants
              : (product.additional_images && product.additional_images.length > 0)
                ? product.additional_images.map((url, idx) => ({ color_name: `خيار ${idx + 1}`, image_url: url }))
                : [];
            return effectiveColors.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{colorsText} ({effectiveColors.length}):</span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  {effectiveColors.slice(0, 4).map((v, i) => (
                    <span
                      key={i}
                      title={v.color_name}
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        display: 'inline-block',
                        overflow: 'hidden',
                      }}
                    >
                      {v.image_url && (
                        <img src={v.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </span>
                  ))}
                  {effectiveColors.length > 4 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>+{effectiveColors.length - 4}</span>
                  )}
                </div>
              </div>
            ) : null;
          })()}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.75rem' }}>
          <div className="product-card-price">
            {formatPrice(product.retail_price || 0)}
          </div>

          <button
            onClick={() => {
              const effectiveColors = (product.color_variants && product.color_variants.length > 0)
                ? product.color_variants
                : (product.additional_images && product.additional_images.length > 0)
                  ? product.additional_images.map((url, idx) => ({ color_name: `خيار ${idx + 1}`, image_url: url }))
                  : [];
              addItem(product, 1, effectiveColors.length > 0 ? effectiveColors[0] : null);
            }}
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            {addToCartText}
          </button>
        </div>
      </div>
    </div>
  );
}
