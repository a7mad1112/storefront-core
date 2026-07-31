'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatPrice, formatOptionLabel } from '../lib/utils';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'gb_store_cart';
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '972595809023';

export function CartProvider({ children, lang = 'ar', dict }) {
  const [items, setItems] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTimeout(() => setItems(parsed), 0);
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [items, isLoaded]);

  const addItem = (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    // Abort immediately if product or selected variant/color is out of stock / unavailable
    if (product?.in_stock === false || product?.is_available === false) return;
    if (selectedColor && selectedColor.is_available === false) return;
    // If no explicit color chosen but product has color variants or additional images, default to the first variant
    const fallbackColor = (product?.color_variants && product.color_variants.length > 0)
      ? product.color_variants[0]
      : (product?.additional_images && product.additional_images.length > 0)
        ? { color_name: 'خيار 1', image_url: product.additional_images[0] }
        : null;
    const colorToUse = selectedColor || fallbackColor;
    // Unique cart key: product + color + size (any combination is a distinct line item)
    const colorKey = colorToUse?.color_name || colorToUse?.image_url || '';
    const sizeKey = selectedSize || '';
    const cartItemId = [
      product.id,
      colorKey,
      sizeKey,
    ].filter(Boolean).join(':::') || product.id;
    const itemImage = colorToUse?.image_url || product.image_url;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.cartItemId === cartItemId || (!item.cartItemId && item.id === cartItemId && !colorKey && !sizeKey)
      );
      if (existingIndex > -1) {
        // ✅ Immutable update — React Strict Mode safe
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { ...product, cartItemId, selectedColor: colorToUse, selectedSize, image_url: itemImage, quantity }];
      }
    });
    setIsDrawerOpen(true);
  };

  const removeItem = (cartItemIdOrId) => {
    setItems((prev) =>
      prev.filter((item) => (item.cartItemId || item.id) !== cartItemIdOrId)
    );
  };

  const updateQuantity = (cartItemIdOrId, delta) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if ((item.cartItemId || item.id) === cartItemIdOrId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.retail_price || 0) * item.quantity, 0);

  const getWhatsAppOrderUrl = () => {
    if (items.length === 0) return '';

    const tCart = dict?.cart || {};
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
    const orderIntro = tCart.orderIntro ? tCart.orderIntro.replace('Eloria FASHION', storeName) : `مرحباً، أريد طلب المنتجات التالية من متجر ${storeName}:`;
    const colorLabel = tCart.colorLabel || 'اللون';
    const totalLabel = tCart.totalLabel || 'المجموع الكلي';
    const thanks = tCart.thanks || 'شكراً لكم!';

    let text = `${orderIntro}\n\n`;
    items.forEach((item, index) => {
      const displayName = (lang === 'en' && item.name_en) ? item.name_en :
        (lang === 'he' && item.name_he) ? item.name_he :
          item.name;
      const colorText = item.selectedColor ? ` (${colorLabel}: ${formatOptionLabel(item.selectedColor.color_name, lang)})` : '';
      const sizeText = item.selectedSize ? ` (${lang === 'en' ? 'Size' : lang === 'he' ? 'מידה' : 'القياس'}: ${formatOptionLabel(item.selectedSize, lang)})` : '';
      const imageUrlText = item.image_url ? `\n   🔗 ${lang === 'en' ? 'Image' : lang === 'he' ? 'תמונה' : 'الصورة'}: ${item.image_url}` : '';
      text += `${index + 1}. ${displayName}${colorText}${sizeText} × ${item.quantity} — ${formatPrice((item.retail_price || 0) * item.quantity, lang)}${imageUrlText}\n\n`;
    });

    const deliveryNote = lang === 'en' ? '*(Price does not include delivery)*' : 
                         lang === 'he' ? '*(המחיר אינו כולל משלוח)*' : 
                         '*(السعر غير شامل التوصيل)*';

    text += `${totalLabel}: ${formatPrice(totalPrice, lang)}\n${deliveryNote}\n\n${thanks}`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalPrice,
        isDrawerOpen,
        setIsDrawerOpen,
        getWhatsAppOrderUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
