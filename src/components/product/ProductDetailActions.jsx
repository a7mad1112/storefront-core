'use client';

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../lib/utils';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '972595809023';

export default function ProductDetailActions({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleDirectWhatsAppBuy = () => {
    const text = `مرحباً، أريد طلب هذا المنتج من متجر Eloria FASHION:\n\n` +
      `📦 الاسم: ${product.name}\n` +
      `🔢 العدد: ${quantity}\n` +
      `💰 السعر الإجمالي: ${formatPrice((product.retail_price || 0) * quantity)}\n\n` +
      `رابط الصورة: ${product.image_url || ''}\n\nشكراً!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
      {/* Quantity Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: 700 }}>الكمية المطلوبة:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--color-bg-elevated)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{ fontSize: '1.25rem', fontWeight: 800, padding: '0 0.5rem' }}
          >
            -
          </button>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            style={{ fontSize: '1.25rem', fontWeight: 800, padding: '0 0.5rem' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button
          onClick={() => addItem(product, quantity)}
          className="btn btn-primary"
          style={{ padding: '1rem', fontSize: '1rem' }}
        >
          🛒 أضف إلى السلة
        </button>

        <button
          onClick={handleDirectWhatsAppBuy}
          className="btn btn-whatsapp"
          style={{ padding: '1rem', fontSize: '1rem' }}
        >
          💬 اطلب الآن عبر واتساب
        </button>
      </div>
    </div>
  );
}
