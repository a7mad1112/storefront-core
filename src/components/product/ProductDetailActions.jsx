'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../lib/utils';
import ColorSwatchSelector from './ColorSwatchSelector';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '972595809023';

export default function ProductDetailActions({ product, category, parentCategory, lang = 'ar', dict = {} }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentImage, setCurrentImage] = useState(product.image_url || '/placeholder.webp');
  const { addItem } = useCart();

  const tProduct = dict.product || {};
  const tCart = dict.cart || {};

  const displayName = (lang === 'en' && product.name_en) ? product.name_en :
                      (lang === 'he' && product.name_he) ? product.name_he :
                      product.name;

  const catName = category ? (
    (lang === 'en' && category.name_en) ? category.name_en :
    (lang === 'he' && category.name_he) ? category.name_he :
    category.name
  ) : (product.category_name || '');

  // If product has explicit color_variants, use them. Otherwise, if it has multiple additional_images, turn them into color variants!
  const effectiveColorVariants = (product.color_variants && product.color_variants.length > 0)
    ? product.color_variants
    : (product.additional_images && product.additional_images.length > 0)
      ? product.additional_images.map((url, idx) => ({
          color_name: `خيار ${idx + 1}`,
          image_url: url,
          is_available: true,
        }))
      : [];

  // Collect all gallery thumbnails cleanly without duplicates between main photo and options
  const thumbnails = [];
  if (effectiveColorVariants.length > 0) {
    effectiveColorVariants.forEach((v, idx) => {
      if (v.image_url && !thumbnails.some((t) => t.url === v.image_url)) {
        thumbnails.push({ url: v.image_url, label: v.color_name || `خيار ${idx + 1}`, variant: v });
      }
    });
  } else {
    if (product.image_url) {
      thumbnails.push({ url: product.image_url, label: dict.common?.home || 'الرئيسية' });
    }
    if (product.additional_images && product.additional_images.length > 0) {
      product.additional_images.forEach((url, idx) => {
        if (url && !thumbnails.some((t) => t.url === url)) {
          thumbnails.push({ url, label: `صورة ${idx + 1}` });
        }
      });
    }
  }

  const handleDirectWhatsAppBuy = () => {
    const colorText = selectedColor ? `🎨 ${tCart.colorLabel || 'اللون'}: ${selectedColor.color_name}\n` : '';
    const sizeText = selectedSize ? `📐 ${tCart.sizeLabel || 'القياس'}: ${selectedSize}\n` : '';
    const imgUrl = selectedColor?.image_url || product.image_url || '';

    const text = `${tCart.orderIntro || 'مرحباً، أريد طلب هذا المنتج من متجر Eloria FASHION:'}\n\n` +
      `📦 الاسم: ${displayName}\n` +
      colorText +
      sizeText +
      `🔢 العدد: ${quantity}\n` +
      `💰 السعر الإجمالي: ${formatPrice((product.retail_price || 0) * quantity)}\n\n` +
      `رابط الصورة: ${imgUrl}\n\n${tCart.thanks || 'شكراً!'}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddToCart = () => {
    let colorToPass = selectedColor;
    if (!colorToPass && effectiveColorVariants.length > 0) {
      const activeThumb = effectiveColorVariants.find((v) => v.image_url === currentImage);
      colorToPass = activeThumb || effectiveColorVariants[0];
    } else if (!colorToPass && thumbnails.length > 1) {
      const activeThumb = thumbnails.find((t) => t.url === currentImage);
      if (activeThumb && activeThumb.url !== product.image_url) {
        colorToPass = {
          color_name: activeThumb.label || 'خيار محدد',
          image_url: activeThumb.url,
        };
      }
    }
    addItem(product, quantity, colorToPass, selectedSize);
  };

  return (
    <div className="product-detail-grid">
      {/* Left / Top Image Showcase & Gallery */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '380px',
            border: '1px solid var(--color-border)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img
            src={currentImage}
            alt={displayName}
            style={{ maxHeight: '450px', width: 'auto', objectFit: 'contain', transition: 'all var(--transition-base)' }}
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {/* Thumbnail Gallery */}
        {thumbnails.length > 1 && (
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {thumbnails.map((thumb, idx) => {
              const isActive = currentImage === thumb.url;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentImage(thumb.url);
                    const matchedVar = effectiveColorVariants.find((v) => v.image_url === thumb.url);
                    if (matchedVar) {
                      setSelectedColor(matchedVar);
                    } else if (thumb.url !== product.image_url) {
                      setSelectedColor({ color_name: thumb.label || `خيار ${idx + 1}`, image_url: thumb.url });
                    } else {
                      setSelectedColor(effectiveColorVariants.length > 0 ? effectiveColorVariants[0] : null);
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '68px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    backgroundColor: 'var(--color-bg-secondary)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    padding: '3px',
                    transition: 'all var(--transition-fast)',
                    opacity: isActive ? 1 : 0.75,
                    cursor: 'pointer',
                  }}
                  title={thumb.label}
                >
                  <div style={{ width: '60px', height: '60px', overflow: 'hidden', borderRadius: '4px' }}>
                    <img
                      src={thumb.url}
                      alt={thumb.label}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '62px',
                  }}>
                    {thumb.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right / Bottom Details */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Badges: Category & Brand */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {catName && (
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-accent)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {catName}
            </span>
          )}
          {product.brand_name && (
            <Link
              href={`/${lang}/brand/${product.brand_slug || product.brand_id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: 'rgba(197, 152, 80, 0.15)',
                color: 'var(--color-accent)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid rgba(197, 152, 80, 0.3)',
              }}
            >
              🏷️ {product.brand_name}
            </Link>
          )}
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '1rem' }}>
          {displayName}
        </h1>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
            {formatPrice(product.retail_price || 0)}
          </span>
          <span style={{ color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 700, backgroundColor: 'rgba(56, 161, 105, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
            ✔ متوفر في المخزون
          </span>
        </div>

        {/* Description */}
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '0.5rem' }}>
          <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>وصف المنتج والمواصفات:</h3>
          <p>
            {product.description || 'منتج عالي الجودة ومميز من متجرنا، تم اختياره بعناية ليلبي تطلعاتك ويضمن لك أفضل أداء وتجربة استخدام رائعة، أو ليكون خياراً مميزاً للإهداء لمن تحب.'}
          </p>
        </div>

        {/* Color Swatch Selector */}
        <ColorSwatchSelector
          colorVariants={effectiveColorVariants}
          selectedColor={selectedColor || (effectiveColorVariants.length > 0 ? effectiveColorVariants[0] : null)}
          mainImage={product.image_url || '/placeholder.webp'}
          onColorSelect={(color, size) => {
            setSelectedColor(color);
            setSelectedSize(size ?? null);
          }}
          onImageChange={setCurrentImage}
        />

        {/* Actions Section */}
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
              onClick={handleAddToCart}
              className="btn btn-primary"
              style={{ padding: '1rem', fontSize: '1rem' }}
            >
              🛒 {tProduct.addToCart || 'أضف إلى السلة'}
            </button>

            <button
              onClick={handleDirectWhatsAppBuy}
              className="btn btn-whatsapp"
              style={{ padding: '1rem', fontSize: '1rem' }}
            >
              {tCart.orderWhatsApp || '💬 اطلب الآن عبر واتساب'}
            </button>
          </div>
        </div>

        {/* Perks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <div>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🚚</p>
            <p>توصيل سريع لباب بيتك</p>
          </div>
          <div>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🎁</p>
            <p>شامل علبة وكيس الشركة</p>
          </div>
          <div>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>⭐</p>
            <p>جودة ماستر كوالتي مضمونة</p>
          </div>
        </div>
      </div>
    </div>
  );
}
