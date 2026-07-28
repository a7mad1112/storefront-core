'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatPrice } from '../../lib/utils';
import { useCart } from '../../context/CartContext';

export default function StickyAddToCart({
  product,
  lang = 'ar',
  dict = {},
  canAddToCart,
  isCurrentlyUnavailable,
  selectedColor,
  selectedSize,
  quantity,
  addToCartButtonRef,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const { addItem } = useCart();

  const tProduct = dict?.product || {};

  useEffect(() => {
    const target = addToCartButtonRef?.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the main button is NOT visible
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [addToCartButtonRef]);

  const handleStickyAddToCart = () => {
    if (!canAddToCart) {
      // Options (like color/size) might be missing, so scroll up to the main add to cart button!
      if (addToCartButtonRef?.current) {
        addToCartButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    let colorToPass = selectedColor;
    if (!colorToPass && product.color_variants?.length > 0) {
      colorToPass = product.color_variants[0];
    }

    addItem(product, quantity, colorToPass, selectedSize);
  };

  const displayName = (lang === 'en' && product.name_en) ? product.name_en :
                      (lang === 'he' && product.name_he) ? product.name_he :
                      product.name;

  const addToCartLabel = isCurrentlyUnavailable
    ? (lang === 'en' ? '❌ Out of Stock' : lang === 'he' ? '❌ אזל מהמלאי' : '❌ غير متوفر')
    : `🛒 ${tProduct.addToCart || (lang === 'en' ? 'Add to Cart' : lang === 'he' ? 'הוסף לסל' : 'أضف للسلة')}`;

  return (
    <div className={`sticky-cart-bar ${isVisible ? 'visible' : ''}`}>
      <div className="sticky-cart-bar-inner">
        <div className="sticky-cart-bar-info">
          <span className="sticky-cart-bar-name">{displayName}</span>
          <span className="sticky-cart-bar-price">
            {formatPrice(product.retail_price || 0, lang)}
          </span>
        </div>
        <button
          onClick={handleStickyAddToCart}
          disabled={isCurrentlyUnavailable}
          className="btn btn-primary sticky-cart-bar-btn"
        >
          {addToCartLabel}
        </button>
      </div>
    </div>
  );
}
