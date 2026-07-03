'use client';

import React from 'react';
import { useCart } from '../../context/CartContext';
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>سلة التسوق ({items.length})</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            style={{ fontSize: '1.5rem', padding: '0.25rem' }}
            aria-label="إغلاق السلة"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body (Items) */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '3rem' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</p>
              <p>سلة التسوق فارغة حالياً</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
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
                  alt={item.name}
                  style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'var(--color-bg-secondary)' }}
                />
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.3 }}>{item.name}</p>
                    <button
                      onClick={() => removeItem(item.id)}
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
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ fontWeight: 800 }}>-</button>
                      <span style={{ fontSize: '0.875rem' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ fontWeight: 800 }}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 800 }}>
              <span>المجموع الكلي:</span>
              <span style={{ color: 'var(--color-accent)' }}>{formatPrice(totalPrice)}</span>
            </div>
            <a
              href={getWhatsAppOrderUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
              style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', textAlign: 'center', display: 'block' }}
            >
              💬 اطلب عبر واتساب الآن
            </a>
            <button
              onClick={clearCart}
              style={{ width: '100%', textAlign: 'center', marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}
            >
              تفريغ السلة
            </button>
          </div>
        )}
      </div>
    </>
  );
}
