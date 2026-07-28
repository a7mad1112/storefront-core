'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useDictionary } from '../../context/DictionaryContext';
import { formatPrice, formatOptionLabel as formatOpt } from '../../lib/utils';

const COLOR_WORDS = ['اسود', 'أسود', 'ابيض', 'أبيض', 'احمر', 'أحمر', 'ازرق', 'أزرق', 'اخضر', 'أخضر', 'وردي', 'بيج', 'بني', 'رمادي', 'زهري', 'اصفر', 'أصفر', 'بنفسجي', 'ذهبي', 'فضي', 'برتقالي', 'كحلي', 'black', 'white', 'red', 'blue', 'green', 'pink', 'beige', 'brown', 'grey', 'gray', 'yellow', 'purple', 'gold', 'silver', 'navy', 'orange'];

/**
 * QuickAddDrawer — Mobile-friendly bottom sheet for selecting color/size before adding to cart.
 * - Slides up from bottom on mobile, centered modal on desktop
 * - Forces color selection (and size if applicable) before enabling "Add to Cart"
 * - Shows product image, name, price, color swatches, size buttons, quantity control
 */
export default function QuickAddDrawer({ product, isOpen, onClose }) {
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

  const formatOptionLabel = (label) => formatOpt(label, lang);
  const tProduct = dict.product || {};

  // Build effective color variants (same logic as ProductDetailActions)
  const rawColorVariants = (product?.color_variants && product.color_variants.length > 0)
    ? product.color_variants
    : (product?.additional_images && product.additional_images.length > 0)
      ? product.additional_images.map((url, idx) => ({
          color_name: `خيار ${idx + 1}`,
          image_url: url,
          is_available: true,
        }))
      : [];

  const effectiveColorVariants = rawColorVariants.map((v, idx, arr) => {
    let sizesArr = v.sizes || [];
    if (sizesArr.length === 0 && arr[0]?.sizes?.length > 0) {
      sizesArr = arr[0].sizes;
    }
    const colorItems = sizesArr.filter(s => s?.size && COLOR_WORDS.some(cw => s.size.toLowerCase().includes(cw.toLowerCase())));
    const realSizes = sizesArr.filter(s => s?.size && !COLOR_WORDS.some(cw => s.size.toLowerCase().includes(cw.toLowerCase())));

    let updatedName = v.color_name;
    let updatedAvail = v.is_available;
    if (colorItems.length > 0) {
      const matchedColorItem = colorItems[idx] || colorItems.find(ci => ci.size === v.color_name);
      if (matchedColorItem) {
        updatedName = matchedColorItem.size;
        updatedAvail = matchedColorItem.is_available !== false && matchedColorItem.quantity !== 0;
      }
    }

    const updatedSizes = realSizes.map(s => ({
      ...s,
      is_available: updatedAvail === false ? false : (s.is_available !== false && s.quantity !== 0),
    }));

    return {
      ...v,
      color_name: updatedName || `خيار ${idx + 1}`,
      is_available: updatedAvail !== false,
      sizes: updatedSizes,
    };
  });

  const hasColors = effectiveColorVariants.length > 0;

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Reset state when product changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      setSelectedColor(null);
      setSelectedSize(null);
      setQuantity(1);
      setAddedSuccess(false);
    }
  }, [isOpen, product?.id]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!product || !isOpen) return null;

  const displayName = (lang === 'en' && product.name_en) ? product.name_en :
                      (lang === 'he' && product.name_he) ? product.name_he :
                      product.name;

  const hasSizes = selectedColor?.sizes && selectedColor.sizes.length > 0;
  const needsColorSelection = hasColors && !selectedColor;
  const needsSizeSelection = hasSizes && !selectedSize;
  const isUnavailable = product?.in_stock === false || product?.is_available === false ||
    (selectedColor && selectedColor.is_available === false) ||
    (selectedSize && selectedColor?.sizes?.find(s => s.size === selectedSize)?.is_available === false);

  const canAddToCart = !needsColorSelection && !needsSizeSelection && !isUnavailable;

  // Determine current image
  const currentImage = selectedColor?.image_url || product.image_url || '/placeholder.webp';

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addItem(product, quantity, selectedColor, selectedSize);
    setAddedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  // Button label logic
  let buttonLabel = `🛒 ${tProduct.addToCart || 'أضف إلى السلة'}`;
  let buttonHint = '';
  if (isUnavailable) {
    buttonLabel = lang === 'en' ? '❌ Out of Stock' : lang === 'he' ? '❌ אזל מהמלאי' : '❌ غير متوفر';
  } else if (addedSuccess) {
    buttonLabel = lang === 'en' ? '✓ Added!' : lang === 'he' ? '✓ נוסף!' : '✓ تمت الإضافة!';
  } else if (needsColorSelection) {
    buttonHint = lang === 'en' ? 'Choose a color first' : lang === 'he' ? 'בחר צבע קודם' : 'اختر اللون أولاً';
  } else if (needsSizeSelection) {
    buttonHint = lang === 'en' ? 'Choose a size first' : lang === 'he' ? 'בחר מידה קודם' : 'اختر المقاس أولاً';
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="quick-add-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer / Sheet */}
      <div
        className="quick-add-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'en' ? 'Quick Add to Cart' : lang === 'he' ? 'הוספה מהירה לסל' : 'إضافة سريعة للسلة'}
      >
        {/* Handle bar (mobile indicator) */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0 0.25rem' }}>
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--color-border)',
          }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: lang === 'ar' || lang === 'he' ? 'auto' : '0.75rem',
            right: lang === 'ar' || lang === 'he' ? '0.75rem' : 'auto',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            zIndex: 5,
          }}
          aria-label={lang === 'en' ? 'Close' : 'إغلاق'}
        >
          ✕
        </button>

        {/* Content */}
        <div style={{ padding: '0.75rem 1.25rem 1.25rem', overflowY: 'auto', maxHeight: 'calc(85vh - 80px)' }}>
          {/* Product Info Row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
            <Link href={`/${lang}/product/${product.id}`} onClick={onClose}>
              <img
                src={currentImage}
                alt={displayName}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  flexShrink: 0,
                }}
              />
            </Link>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Link
                href={`/${lang}/product/${product.id}`}
                onClick={onClose}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3 style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  lineHeight: 1.3,
                  marginBottom: '0.35rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {displayName}
                </h3>
              </Link>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--color-accent)',
              }}>
                {formatPrice(product.retail_price || 0, lang)}
              </span>
            </div>
          </div>

          {/* Color Selection */}
          {hasColors && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  {lang === 'en' ? 'Choose Option:' : lang === 'he' ? 'בחר אפשרות:' : 'اختر اللون:'}
                  {!selectedColor && (
                    <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginInlineStart: '0.35rem' }}>
                      *
                    </span>
                  )}
                </span>
                {selectedColor && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-accent)',
                    fontWeight: 800,
                    backgroundColor: 'var(--color-accent-soft)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    ✓ {formatOptionLabel(selectedColor.color_name)}
                  </span>
                )}
              </div>

              <div className="color-swatch-row" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {effectiveColorVariants.map((variant, idx) => {
                  const isSelected = selectedColor?.color_name === variant.color_name && selectedColor?.image_url === variant.image_url;
                  const isVariantUnavailable = !variant.is_available;
                  const displayLabel = formatOptionLabel(variant.color_name);

                  return (
                    <button
                      key={`${variant.color_name}-${idx}`}
                      onClick={() => {
                        setSelectedColor(variant);
                        setSelectedSize(null); // Reset size when color changes
                      }}
                      title={isVariantUnavailable ? `${displayLabel} — ${lang === 'en' ? 'Unavailable' : lang === 'he' ? 'לא זמין' : 'غير متوفر'}` : displayLabel}
                      className={`color-swatch-card ${isSelected ? 'selected' : ''} ${isVariantUnavailable ? 'unavailable' : ''}`}
                    >
                      <div className="color-swatch-thumb">
                        {variant.image_url ? (
                          <img
                            src={variant.image_url}
                            alt={displayLabel}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            loading="lazy"
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                          }}>
                            🎨
                          </div>
                        )}
                        {isVariantUnavailable && (
                          <div className="swatch-unavailable-overlay">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="4" y1="4" x2="20" y2="20" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="color-swatch-label">
                        {displayLabel || '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {hasSizes && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  {lang === 'en' ? 'Choose Size:' : lang === 'he' ? 'בחר מידה:' : 'اختر المقاس:'}
                  {!selectedSize && (
                    <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginInlineStart: '0.35rem' }}>
                      *
                    </span>
                  )}
                </span>
                {selectedSize && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-accent)',
                    fontWeight: 800,
                    backgroundColor: 'var(--color-accent-soft)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    ✓ {selectedSize}
                  </span>
                )}
              </div>

              <div className="size-selector-row">
                {selectedColor.sizes.map((sizeObj, sIdx) => {
                  const isSelected = selectedSize === sizeObj.size;
                  const isSizeUnavailable = !sizeObj.is_available;

                  return (
                    <button
                      key={`${sizeObj.size}-${sIdx}`}
                      onClick={() => setSelectedSize(sizeObj.size)}
                      title={isSizeUnavailable ? `${sizeObj.size} — ${lang === 'en' ? 'Unavailable' : lang === 'he' ? 'לא זמין' : 'غير متوفر'}` : sizeObj.size}
                      className={`size-btn ${isSelected ? 'selected' : ''} ${isSizeUnavailable ? 'unavailable' : ''}`}
                      disabled={isSizeUnavailable}
                    >
                      {sizeObj.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {lang === 'en' ? 'Quantity:' : lang === 'he' ? 'כמות:' : 'الكمية:'}
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ padding: '0.4rem 0.8rem', fontSize: '1.1rem' }}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span style={{ padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.9rem' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '1.1rem' }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Footer — Add to Cart Button */}
        <div style={{
          padding: '0.75rem 1.25rem',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
        }}>
          {buttonHint && !addedSuccess && (
            <p style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--color-error)',
              marginBottom: '0.5rem',
              fontWeight: 700,
            }}>
              ⚠️ {buttonHint}
            </p>
          )}
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart || addedSuccess}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: 800,
              opacity: canAddToCart && !addedSuccess ? 1 : 0.5,
              cursor: canAddToCart && !addedSuccess ? 'pointer' : 'not-allowed',
              backgroundColor: addedSuccess ? 'var(--color-success)' : (canAddToCart ? '' : 'var(--color-bg-elevated)'),
              color: addedSuccess ? '#fff' : (canAddToCart ? '' : 'var(--color-text-muted)'),
              border: canAddToCart || addedSuccess ? '' : '1px solid var(--color-border)',
              transition: 'all 0.3s ease',
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </>
  );
}
