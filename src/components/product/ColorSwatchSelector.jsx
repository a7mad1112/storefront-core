'use client';

import React, { useState } from 'react';

/**
 * Interactive color swatch selector for the product detail page.
 * - Each color is a card: thumbnail image + color name label below
 * - Unavailable colors shown with diagonal slash + tooltip
 * - Emits selected color via onColorSelect callback
 */
export default function ColorSwatchSelector({ colorVariants = [], mainImage, onColorSelect, onImageChange }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  if (!colorVariants || colorVariants.length === 0) return null;

  const handleSelect = (variant, index) => {
    if (!variant.is_available) return;

    setSelectedIndex(index);
    if (onColorSelect) onColorSelect(variant);
    if (onImageChange && variant.image_url) onImageChange(variant.image_url);
  };

  const handleReset = () => {
    setSelectedIndex(-1);
    if (onColorSelect) onColorSelect(null);
    if (onImageChange) onImageChange(mainImage);
  };

  return (
    <div style={{ marginTop: '1rem' }}>

      {/* Header row: label + selected color name badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
          اختر اللون:
        </span>
        {selectedIndex >= 0 && (
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--color-accent)',
            fontWeight: 800,
            backgroundColor: 'var(--color-accent-soft)',
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
          }}>
            ✓ {colorVariants[selectedIndex]?.color_name}
          </span>
        )}
      </div>

      {/* Color cards grid */}
      <div className="color-swatch-row">
        {colorVariants.map((variant, idx) => {
          const isSelected = idx === selectedIndex;
          const isUnavailable = !variant.is_available;

          return (
            <button
              key={`${variant.color_name}-${idx}`}
              onClick={() => handleSelect(variant, idx)}
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
                    fontSize: '0.6rem', color: 'var(--color-text-muted)',
                    backgroundColor: 'var(--color-bg-secondary)',
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

      {selectedIndex >= 0 && (
        <button
          onClick={handleReset}
          style={{
            marginTop: '0.5rem',
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
