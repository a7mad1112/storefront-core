'use client';

import React from 'react';
import { useDictionary } from '../../context/DictionaryContext';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
const STORE_LOGO = process.env.NEXT_PUBLIC_STORE_LOGO || '/logo.png';
const STORE_DESC_DEFAULT = 'متجر الموضة والأناقة الفاخرة. شنط ماستر كوالتي، عطور وساعات وماركات عالمية بأسعار مميزة مع خدمة التوصيل السريع لجميع مناطق فلسطين.';
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '972595809023';
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || '';
const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL || '';

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

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || tCommon.storeName || STORE_NAME;
  const storeDesc = process.env.NEXT_PUBLIC_STORE_DESC || tFooter.storeDesc || STORE_DESC_DEFAULT;
  const contactWhatsApp = tCommon.contactWhatsApp || 'تواصل عبر واتساب';
  const allRightsReserved = tCommon.allRightsReserved || 'جميع الحقوق محفوظة';

  const developedBy = tFooter.developedBy || 'تمت البرمجة والتطوير بواسطة';
  const developerName = tFooter.developerName || 'أحمد العلاونة';
  const developerUrl = tFooter.developerUrl || 'https://ahmedalawneh.me/';

  return (
    <footer style={{ backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)', marginTop: 'auto', padding: '3.5rem 0 2.5rem 0' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <img src={STORE_LOGO} alt={storeName} style={{ maxHeight: '42px', width: 'auto', objectFit: 'contain' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.5px' }}>
            {storeName}
          </h3>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '520px', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {storeDesc}
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem', fontSize: '0.9rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>💬</span> <span>{contactWhatsApp}</span>
          </a>
          {INSTAGRAM_URL && (
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#E1306C', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>📸</span> <span>{tCommon.instagram || 'انستجرام'}</span>
            </a>
          )}
          {FACEBOOK_URL && (
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>📘</span> <span>{tCommon.facebook || 'فيسبوك'}</span>
            </a>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: '400px', height: '1px', backgroundColor: 'var(--color-border)', margin: '1rem 0 0.5rem 0', opacity: 0.7 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
            © {new Date().getFullYear()} {storeName}. {allRightsReserved}.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.825rem',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-bg-card)',
            padding: '0.45rem 1.15rem',
            borderRadius: '999px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <span>💻</span>
            <span>{developedBy}</span>
            <a
              href={developerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontWeight: 800,
                color: 'var(--color-primary)',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              {developerName}
            </a>
            <span>🚀</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
