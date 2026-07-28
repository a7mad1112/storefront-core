'use client';

import React, { useState } from 'react';
import PredictiveSearch from './PredictiveSearch';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useDictionary } from '../../context/DictionaryContext';
import { useSupplier } from '../../context/SupplierContext';
import { isDepartmentSupported } from '../../lib/supplierConfig';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
const STORE_LOGO = process.env.NEXT_PUBLIC_STORE_LOGO || '/logo.png';
const LOCALES = [
  { code: 'ar', label: 'AR' },
  { code: 'en', label: 'EN' },
  { code: 'he', label: 'HE' },
];

function saveLocaleCookie(locale) {
  if (typeof document !== 'undefined') {
    document.cookie = `preferred_locale=${locale};path=/;max-age=${365 * 24 * 60 * 60}`;
  }
}

export default function Header({ lang = 'ar' }) {

  const [isSuppliersOpen, setIsSuppliersOpen] = useState(false);
  const { totalCount, setIsDrawerOpen } = useCart();
  const { dict } = useDictionary();
  const { supportedSuppliers, getSupplierMeta, changeSupplier } = useSupplier();
  const router = useRouter();
  const pathname = usePathname();

  const t = dict?.common || {};
  const tSearch = dict?.search || {};

  const handleDropdownClick = (supplierCode, anchorId) => {
    setIsSuppliersOpen(false);
    if (changeSupplier) changeSupplier(supplierCode);
    if (typeof window !== 'undefined' && (pathname === `/${lang}` || pathname === '/')) {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const departmentsList = [
    {
      key: 'all',
      href: `/${lang}`,
      onClick: () => { setIsSuppliersOpen(false); if (changeSupplier) changeSupplier('all'); },
      icon: '🏠',
      name: lang === 'en' ? 'All Sections' : lang === 'he' ? 'כל המדורים' : 'كل الأقسام',
    },
    {
      key: 'bags-gifts',
      href: pathname === `/${lang}` || pathname === '/' ? `#dept-bags-gifts` : `/${lang}/supplier/bags-gifts`,
      onClick: () => handleDropdownClick('bags-gifts', 'dept-bags-gifts'),
      icon: '👜',
      name: lang === 'en' ? 'Luxury Bags, Wallets & Gifts' : lang === 'he' ? 'תיקי יוקרה, ארנקים ומתנות' : 'قسم الشنط الفاخرة، الهدايا والمحافظ',
    },
    {
      key: 'perfumes-watches',
      href: pathname === `/${lang}` || pathname === '/' ? `#dept-perfumes-watches` : `/${lang}/supplier/perfumes-watches`,
      onClick: () => handleDropdownClick('perfumes-watches', 'dept-perfumes-watches'),
      icon: '🌸',
      name: lang === 'en' ? 'Luxury Perfumes, Watches & Jewelry' : lang === 'he' ? 'בשמי יוקרה, שעונים ותכשיטים' : 'قسم العطور الفاخرة، الساعات والاكسسوارات',
    },
    {
      key: 'shoes',
      href: pathname === `/${lang}` || pathname === '/' ? `#dept-shoes` : `/${lang}/supplier/shoes`,
      onClick: () => handleDropdownClick('shoes', 'dept-shoes'),
      icon: '👟',
      name: lang === 'en' ? 'Footwear, Heels & Sandals' : lang === 'he' ? 'נעליים, עקבים וסנדלים' : 'قسم الأحذية، الكعب، الصنادل والسليبر',
    },
    {
      key: 'apparel-sports',
      href: pathname === `/${lang}` || pathname === '/' ? `#dept-apparel-sports` : `/${lang}/supplier/apparel-sports`,
      onClick: () => handleDropdownClick('apparel-sports', 'dept-apparel-sports'),
      icon: '🏃',
      name: lang === 'en' ? 'Apparel, Suits & Sportswear' : lang === 'he' ? 'אופנה, חליפות ובגדי ספורט' : 'قسم الأزياء، الأطقم والملابس الرياضية',
    },
  ].filter((item) => isDepartmentSupported(item.key));



  const switchLocale = (newLang) => {
    // Replace current locale prefix with new one
    const segments = pathname.split('/');
    if (segments[1] && ['ar', 'en', 'he'].includes(segments[1])) {
      segments[1] = newLang;
    }
    const newPath = segments.join('/') || `/${newLang}`;

    // Set cookie to remember preference
    saveLocaleCookie(newLang);

    router.push(newPath);
  };

  return (
    <header className="site-header">
      <div className="container header-content">
        {/* Brand Logo */}
        <Link href={`/${lang}`} className="logo header-logo">
          <img
            src={STORE_LOGO}
            alt={STORE_NAME}
            className="header-logo-img"
          />
        </Link>

        {/* Search Bar with Live Predictive Search */}
        <PredictiveSearch lang={lang} />

        {/* Actions Row */}
        <div className="header-actions">
          {/* Language Switcher */}
          <div className="lang-switcher">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => switchLocale(loc.code)}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  backgroundColor: lang === loc.code ? 'var(--color-accent)' : 'transparent',
                  color: lang === loc.code ? '#fff' : 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  letterSpacing: '0.5px',
                }}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* Suppliers Dropdown (Hidden on mobile since SupplierSwitcher bar is below) */}
          {supportedSuppliers && supportedSuppliers.length > 1 && (
            <div className="desktop-only-supplier-dropdown">
              <button
                type="button"
                onClick={() => setIsSuppliersOpen(!isSuppliersOpen)}
                className="header-action-btn"
              >
                <span>🏬</span>
                <span className="btn-label">{lang === 'en' ? 'Departments' : lang === 'he' ? 'קטגוריות' : 'الأقسام'} ▾</span>
              </button>
              {isSuppliersOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: lang === 'en' ? 'auto' : 0,
                    left: lang === 'en' ? 0 : 'auto',
                    marginTop: '0.5rem',
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '0.5rem',
                    minWidth: '220px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {departmentsList.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={item.onClick}
                      style={{
                        padding: '0.55rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                      className="dropdown-dept-item"
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Brands Link */}
          <Link href={`/${lang}/brands`} className="header-action-btn header-brand-btn">
            <span>🏷️</span>
            <span className="btn-label">{t.brands || 'الماركات'}</span>
          </Link>

          {/* Cart Button */}
          <button onClick={() => setIsDrawerOpen(true)} className="header-cart-btn">
            <span>🛒</span>
            <span className="btn-label">{t.cart || 'السلة'}</span>
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
