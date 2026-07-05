'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatPrice } from '../lib/utils';

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
        setItems(JSON.parse(stored));
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

  const addItem = (product, quantity = 1, selectedColor = null) => {
    const cartItemId = selectedColor ? `${product.id}:::${selectedColor.color_name}` : product.id;
    const itemImage = selectedColor?.image_url || product.image_url;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.cartItemId === cartItemId || (!item.cartItemId && item.id === cartItemId)
      );
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        return copy;
      } else {
        return [...prev, { ...product, cartItemId, selectedColor, image_url: itemImage, quantity }];
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
    const orderIntro = tCart.orderIntro || 'مرحباً، أريد طلب المنتجات التالية من متجر Eloria FASHION:';
    const colorLabel = tCart.colorLabel || 'اللون';
    const totalLabel = tCart.totalLabel || 'المجموع الكلي';
    const thanks = tCart.thanks || 'شكراً لكم!';

    let text = `${orderIntro}\n\n`;
    items.forEach((item, index) => {
      const displayName = (lang === 'en' && item.name_en) ? item.name_en :
                          (lang === 'he' && item.name_he) ? item.name_he :
                          item.name;
      const colorText = item.selectedColor ? ` (${colorLabel}: ${item.selectedColor.color_name})` : '';
      text += `${index + 1}. ${displayName}${colorText} × ${item.quantity} — ${formatPrice((item.retail_price || 0) * item.quantity)}\n`;
    });
    text += `\n${totalLabel}: ${formatPrice(totalPrice)}\n\n${thanks}`;

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
