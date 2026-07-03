'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const { totalCount, setIsDrawerOpen } = useCart();
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="site-header">
      <div className="container header-content">
        {/* Brand Logo */}
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src="/logo.png"
            alt="Eloria FASHION"
            style={{ maxHeight: '48px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ flexGrow: 1, maxWidth: '450px', display: 'flex' }}>
          <input
            type="text"
            placeholder="ابحث عن الشنط، العطور، الساعات..."
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

        {/* Actions (Cart & Categories Link) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/categories"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            🛍️ الأقسام
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
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>السلة</span>
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
