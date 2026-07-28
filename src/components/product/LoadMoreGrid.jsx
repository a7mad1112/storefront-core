'use client';

import React, { useState, useCallback } from 'react';
import ProductCard from './ProductCard';
import { useDictionary } from '../../context/DictionaryContext';

export default function LoadMoreGrid({
  initialProducts,
  totalCount,
  fetchUrl,
  fetchParams = {},
  pageSize = 48,
}) {
  const [products, setProducts] = useState(initialProducts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(initialProducts?.length || 0);

  let dict = {};
  let lang = 'ar';
  try {
    const res = useDictionary();
    dict = res.dict || {};
    lang = res.lang || 'ar';
  } catch (e) {
    // Fallback
  }

  const hasMore = loadedCount < totalCount;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        ...fetchParams,
        offset: String(loadedCount),
        limit: String(pageSize),
      });

      const res = await fetch(`${fetchUrl}?${params.toString()}`);
      const data = await res.json();
      const newProducts = data.products || [];

      if (newProducts.length > 0) {
        setProducts((prev) => [...prev, ...newProducts]);
        setLoadedCount((prev) => prev + newProducts.length);
      }
    } catch (err) {
      console.error('[LoadMoreGrid]', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, loadedCount, pageSize, fetchUrl, fetchParams]);

  const tProduct = dict?.product || {};
  const defaultEmpty = tProduct?.noProducts || 'لا توجد منتجات مطابقة حالياً';

  if (!products || products.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem 1rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}>
        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
          {defaultEmpty}
        </p>
      </div>
    );
  }

  const loadMoreText = lang === 'en' ? 'Load More Products' :
                       lang === 'he' ? 'טען עוד מוצרים' :
                       'تحميل المزيد من المنتجات';

  const showingText = lang === 'en'
    ? `Showing ${products.length} of ${totalCount} products`
    : lang === 'he'
      ? `מציג ${products.length} מתוך ${totalCount} מוצרים`
      : `عرض ${products.length} من ${totalCount} منتج`;

  return (
    <div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {/* Skeleton cards while loading */}
        {isLoading && Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`skel-${idx}`}
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

      {/* Load More Section */}
      {hasMore && (
        <div className="load-more-section">
          <p className="load-more-count">{showingText}</p>
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="btn btn-secondary load-more-btn"
          >
            {isLoading ? (
              <span className="load-more-spinner" />
            ) : (
              <>
                <span>↓</span>
                <span>{loadMoreText}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* All loaded indicator */}
      {!hasMore && products.length > 0 && totalCount > pageSize && (
        <p className="load-more-done">
          {lang === 'en' ? '✓ All products loaded' :
           lang === 'he' ? '✓ כל המוצרים נטענו' :
           '✓ تم تحميل جميع المنتجات'}
        </p>
      )}
    </div>
  );
}
