'use client';

import React from 'react';
import { useDictionary } from '../../context/DictionaryContext';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
const STORE_DESC_DEFAULT = 'متجر الموضة والأناقة الفاخرة. شنط ماستر كوالتي، عطور وساعات وماركات عالمية بأسعار مميزة مع خدمة التوصيل السريع لجميع مناطق فلسطين.';
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '972595809023';

export default function Footer({ lang, dict: propDict }) {
  let contextDict = null;
  try {
    const res = useDictionary();
    contextDict = res.dict;
  } catch (e) {
    // In case Footer is rendered outside provider
  }

  const dict = propDict || contextDict || {};
  const tCommon = dict.common || {};
  const tFooter = dict.footer || {};

  const storeName = tCommon.storeName || STORE_NAME;
  const storeDesc = tFooter.storeDesc || process.env.NEXT_PUBLIC_STORE_DESC || STORE_DESC_DEFAULT;
  const contactWhatsApp = tCommon.contactWhatsApp || 'تواصل عبر واتساب';
  const allRightsReserved = tCommon.allRightsReserved || 'جميع الحقوق محفوظة';

  return (
    <footer style={{ backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)', marginTop: 'auto', padding: '3rem 0' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <img src="/logo.png" alt={storeName} style={{ maxHeight: '42px', width: 'auto', objectFit: 'contain' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px' }}>
            {storeName}
          </h3>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', fontSize: '0.875rem' }}>
          {storeDesc}
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700 }}>
            💬 {contactWhatsApp}
          </a>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          © {new Date().getFullYear()} {storeName}. {allRightsReserved}.
        </p>
      </div>
    </footer>
  );
}
