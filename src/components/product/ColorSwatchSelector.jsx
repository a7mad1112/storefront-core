'use client';

import React, { useState } from 'react';

/**
 * Interactive color swatch selector for the product detail page.
 * - Each color is a card: thumbnail image + color name label below
 * - Unavailable colors shown with diagonal slash + tooltip
 * - If a color has a `sizes` array, a size selector appears after picking a color
 * - Emits selected color AND selected size via onColorSelect(variant, size) callback
 */
export default function ColorSwatchSelector({ colorVariants = [], selectedColor = null, mainImage, onColorSelect, onImageChange }) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(-1);
  const [selectedSize, setSelectedSize] = useState(null);

  if (!colorVariants || colorVariants.length === 0) return null;

  // Sync with controlled selectedColor prop if provided
  const propIndex = selectedColor ? colorVariants.findIndex(v => v.image_url === selectedColor.image_url || v.color_name === selectedColor.color_name) : -1;
  const activeColorIndex = propIndex >= 0 ? propIndex : (selectedColorIndex >= 0 ? selectedColorIndex : -1);
  const selectedVariant = activeColorIndex >= 0 ? colorVariants[activeColorIndex] : null;
  const hasSizes = selectedVariant?.sizes && selectedVariant.sizes.length > 0;

  const handleColorSelect = (variant, index) => {
    if (!variant.is_available) return;

    // Reset size when switching colors
    const sizeReset = null;
    setSelectedColorIndex(index);
    setSelectedSize(sizeReset);

    if (onColorSelect) onColorSelect(variant, sizeReset);
    if (onImageChange && variant.image_url) onImageChange(variant.image_url);
  };

  const handleSizeSelect = (sizeObj) => {
    if (!sizeObj.is_available) return;
    setSelectedSize(sizeObj.size);
    if (onColorSelect) onColorSelect(selectedVariant, sizeObj.size);
  };

  const handleReset = () => {
    setSelectedColorIndex(-1);
    setSelectedSize(null);
    if (onColorSelect) onColorSelect(null, null);
    if (onImageChange) onImageChange(mainImage);
  };

  return (
    <div style={{ marginTop: '1rem' }}>

      {/* ── COLOR ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
          اختر اللون:
        </span>
        {activeColorIndex >= 0 && (
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--color-accent)',
            fontWeight: 800,
            backgroundColor: 'var(--color-accent-soft)',
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
          }}>
            ✓ {colorVariants[activeColorIndex]?.color_name}
          </span>
        )}
      </div>

      {/* Color cards grid */}
      <div className="color-swatch-row">
        {colorVariants.map((variant, idx) => {
          const isSelected = idx === activeColorIndex;
          const isUnavailable = !variant.is_available;

          return (
            <button
              key={`${variant.color_name}-${idx}`}
              onClick={() => handleColorSelect(variant, idx)}
              disabled={isUnavailable}
              title={isUnavailable ? `${variant.color_name} — غير متوفر` : variant.color_name}
              className={`color-swatch-card ${isSelected ? 'selected' : ''} ${isUnavailable ? 'unavailable' : ''}`}
            >
              {/* Thumbnail */}
              <div className="color-swatch-thumb">
                {variant.image_url ? (
                  <img
                    src={variant.image_url}
                    alt={variant.color_name}
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

                {/* Diagonal slash overlay for unavailable */}
                {isUnavailable && (
                  <div className="swatch-unavailable-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="4" y1="4" x2="20" y2="20" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Color name label */}
              <span className="color-swatch-label">
                {variant.color_name || '—'}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SIZE ROW (only shown after a color is picked and that color has sizes) ── */}
      {hasSizes && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              اختر القياس:
            </span>
            {selectedSize && (
              <span style={{
                fontSize: '0.8rem',
                color: 'var(--color-accent)',
                fontWeight: 800,
                backgroundColor: 'var(--color-accent-soft)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-full)',
              }}>
                ✓ {selectedSize}
              </span>
            )}
          </div>

          <div className="size-selector-row">
            {selectedVariant.sizes.map((sizeObj, sIdx) => {
              const isSelected = selectedSize === sizeObj.size;
              const isUnavailable = !sizeObj.is_available;

              return (
                <button
                  key={`${sizeObj.size}-${sIdx}`}
                  onClick={() => handleSizeSelect(sizeObj)}
                  disabled={isUnavailable}
                  title={isUnavailable ? `${sizeObj.size} — غير متوفر` : sizeObj.size}
                  className={`size-btn ${isSelected ? 'selected' : ''} ${isUnavailable ? 'unavailable' : ''}`}
                >
                  {sizeObj.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset button */}
      {selectedColorIndex >= 0 && (
        <button
          onClick={handleReset}
          style={{
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            textDecoration: 'underline',
          }}
        >
          إلغاء اختيار اللون
        </button>
      )}
    </div>
  );
}
