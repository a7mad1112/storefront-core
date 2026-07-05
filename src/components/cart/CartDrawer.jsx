'use client';

import React from 'react';
import { useCart } from '../../context/CartContext';
import { useDictionary } from '../../context/DictionaryContext';
import { formatPrice } from '../../lib/utils';

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice,
    isDrawerOpen,
    setIsDrawerOpen,
    getWhatsAppOrderUrl,
  } = useCart();

  let dict = {};
  let lang = 'ar';
  try {
    const res = useDictionary();
    dict = res.dict || {};
    lang = res.lang || 'ar';
  } catch (e) {
    // Fallback if rendered outside DictionaryProvider
  }

  const tCart = dict.cart || {};

  if (!isDrawerOpen) return null;

  return (
    <>
      <div
        className={`drawer-backdrop ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      />
      <div className={`cart-drawer ${isDrawerOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{tCart.shoppingCart || 'سلة التسوق'} ({items.length})</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            style={{ fontSize: '1.5rem', padding: '0.25rem' }}
            aria-label={tCart.closeCart || 'إغلاق السلة'}
          >
            ✕
          </button>
        </div>

        {/* Drawer Body (Items) */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '3rem' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</p>
              <p>{tCart.emptyCart || 'سلة التسوق فارغة حالياً'}</p>
            </div>
          ) : (
            items.map((item) => {
              const idKey = item.cartItemId || item.id;
              const displayName = (lang === 'en' && item.name_en) ? item.name_en :
                                  (lang === 'he' && item.name_he) ? item.name_he :
                                  item.name;
              return (
                <div
                  key={idKey}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    backgroundColor: 'var(--color-bg-card)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <img
                    src={item.image_url || '/placeholder.webp'}
                    alt={displayName}
                    style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'var(--color-bg-secondary)' }}
                  />
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.3 }}>{displayName}</p>
                        {item.selectedColor && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 700, display: 'inline-block', marginTop: '4px', backgroundColor: 'rgba(197, 152, 80, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                            🎨 {item.selectedColor.color_name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(idKey)}
                        style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 800 }}>
                        {formatPrice((item.retail_price || 0) * item.quantity)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-bg-elevated)', padding: '2px 8px', borderRadius: '4px' }}>
                        <button onClick={() => updateQuantity(idKey, -1)} style={{ fontWeight: 800 }}>-</button>
                        <span style={{ fontSize: '0.875rem' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(idKey, 1)} style={{ fontWeight: 800 }}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 800 }}>
              <span>{tCart.total || 'المجموع الكلي:'}</span>
              <span style={{ color: 'var(--color-accent)' }}>{formatPrice(totalPrice)}</span>
            </div>
            <a
              href={getWhatsAppOrderUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
              style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', textAlign: 'center', display: 'block' }}
            >
              {tCart.orderWhatsApp || '💬 اطلب عبر واتساب الآن'}
            </a>
            <button
              onClick={clearCart}
              style={{ width: '100%', textAlign: 'center', marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}
            >
              {tCart.clearCart || 'تفريغ السلة'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
