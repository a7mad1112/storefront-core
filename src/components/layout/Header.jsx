'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useDictionary } from '../../context/DictionaryContext';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';
const LOCALES = [
  { code: 'ar', label: 'AR' },
  { code: 'en', label: 'EN' },
  { code: 'he', label: 'HE' },
];

export default function Header({ lang = 'ar' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { totalCount, setIsDrawerOpen } = useCart();
  const { dict } = useDictionary();
  const router = useRouter();
  const pathname = usePathname();

  const t = dict?.common || {};
  const tSearch = dict?.search || {};

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const switchLocale = (newLang) => {
    // Replace current locale prefix with new one
    const segments = pathname.split('/');
    if (segments[1] && ['ar', 'en', 'he'].includes(segments[1])) {
      segments[1] = newLang;
    }
    const newPath = segments.join('/') || `/${newLang}`;

    // Set cookie to remember preference
    document.cookie = `preferred_locale=${newLang};path=/;max-age=${365 * 24 * 60 * 60}`;

    router.push(newPath);
  };

  return (
    <header className="site-header">
      <div className="container header-content">
        {/* Brand Logo */}
        <Link href={`/${lang}`} className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src="/logo.png"
            alt={STORE_NAME}
            style={{ maxHeight: '48px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ flexGrow: 1, maxWidth: '450px', display: 'flex' }}>
          <input
            type="text"
            placeholder={tSearch.searchPlaceholder || 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              fontSize: '0.875rem',
            }}
          />
        </form>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Language Switcher */}
          <div className="lang-switcher" style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-full)', padding: '2px', border: '1px solid var(--color-border)' }}>
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

          <Link
            href={`/${lang}/categories`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            🛍️ {t.categories || 'الأقسام'}
          </Link>

          <Link
            href={`/${lang}/brands`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            🏷️ {t.brands || 'الماركات'}
          </Link>

          <button
            onClick={() => setIsDrawerOpen(true)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-bg-elevated)',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <span>🛒</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{t.cart || 'السلة'}</span>
            {totalCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#fff',
                  borderRadius: '999px',
                  padding: '1px 6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
