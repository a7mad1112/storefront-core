'use client';

import React, { useState } from 'react';
import { formatOptionLabel as formatOpt } from '../../lib/utils';

/**
 * Interactive color swatch selector for the product detail page.
 * - Each color is a card: thumbnail image + color name label below
 * - Unavailable colors shown with diagonal slash + tooltip
 * - If a color has a `sizes` array, a size selector appears after picking a color
 * - Emits selected color AND selected size via onColorSelect(variant, size) callback
 */
export default function ColorSwatchSelector({ colorVariants = [], selectedColor = null, mainImage, onColorSelect, onImageChange, lang = 'ar' }) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(-1);
  const [selectedSize, setSelectedSize] = useState(null);

  if (!colorVariants || colorVariants.length === 0) return null;

  const formatOptionLabel = (label) => formatOpt(label, lang);

  const propIndex = selectedColor ? colorVariants.findIndex(v => v.image_url === selectedColor.image_url || v.color_name === selectedColor.color_name) : -1;
  const activeColorIndex = propIndex >= 0 ? propIndex : (selectedColorIndex >= 0 ? selectedColorIndex : -1);
  const selectedVariant = activeColorIndex >= 0 ? colorVariants[activeColorIndex] : null;
  const hasSizes = selectedVariant?.sizes && selectedVariant.sizes.length > 0;

  const handleColorSelect = (variant, index) => {
    const sizeReset = null;
    setSelectedColorIndex(index);
    setSelectedSize(sizeReset);

    if (onColorSelect) onColorSelect(variant, sizeReset);
    if (onImageChange && variant.image_url) onImageChange(variant.image_url);
  };

  const handleSizeSelect = (sizeObj) => {
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
          {lang === 'en' ? 'Choose Option:' : lang === 'he' ? 'בחר אפשרות:' : 'اختر اللون:'}
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
            ✓ {formatOptionLabel(colorVariants[activeColorIndex]?.color_name)}
          </span>
        )}
      </div>

      {/* Color cards grid */}
      <div className="color-swatch-row">
        {colorVariants.map((variant, idx) => {
          const isSelected = idx === activeColorIndex;
          const isUnavailable = !variant.is_available;
          const displayLabel = formatOptionLabel(variant.color_name);

          return (
            <button
              key={`${variant.color_name}-${idx}`}
              onClick={() => handleColorSelect(variant, idx)}
              title={isUnavailable ? `${displayLabel} — ${lang === 'en' ? 'Unavailable' : lang === 'he' ? 'לא זמין' : 'غير متوفر'}` : displayLabel}
              className={`color-swatch-card ${isSelected ? 'selected' : ''} ${isUnavailable ? 'unavailable' : ''}`}
            >
              {/* Thumbnail */}
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
                {displayLabel || '—'}
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
              {lang === 'en' ? 'Choose Size:' : lang === 'he' ? 'בחר מידה:' : 'اختر القياس:'}
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
                  title={isUnavailable ? `${sizeObj.size} — ${lang === 'en' ? 'Unavailable' : lang === 'he' ? 'לא זמין' : 'غير متوفر'}` : sizeObj.size}
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
          {lang === 'en' ? 'Deselect Option' : lang === 'he' ? 'ביטול בחירת אפשרות' : 'إلغاء اختيار اللون'}
        </button>
      )}
    </div>
  );
}
