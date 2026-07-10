'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupplier } from '../../context/SupplierContext';

export default function SupplierSwitcher({ lang = 'ar' }) {
  const { supportedSuppliers, getSupplierName, changeSupplier, hasMultipleSuppliers } = useSupplier();
  const pathname = usePathname();

  if (!hasMultipleSuppliers) {
    return null;
  }

  const isAllActive = !pathname.includes('/supplier/');

  return (
    <div
      style={{
        background: 'var(--color-bg-secondary, #f8f9fa)',
        borderBottom: '1px solid var(--color-border, #e9ecef)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
        {lang === 'en' ? 'Department / Section:' : lang === 'he' ? 'מדור / קטגוריה:' : 'القسم / الصنف:'}
      </span>

      <Link
        href={`/${lang}`}
        onClick={() => changeSupplier('all')}
        style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          textDecoration: 'none',
          cursor: 'pointer',
          background: isAllActive ? 'var(--color-primary, #000)' : 'transparent',
          color: isAllActive ? '#fff' : 'var(--color-text, #333)',
          fontWeight: isAllActive ? 'bold' : 'normal',
          transition: 'all 0.2s ease',
        }}
      >
        🏠 {lang === 'en' ? 'All Sections' : lang === 'he' ? 'כל המדורים' : 'كل الأقسام'}
      </Link>

      {supportedSuppliers.map((code) => {
        const name = getSupplierName ? getSupplierName(code, lang) : code;
        const isActive = pathname.startsWith(`/${lang}/supplier/${code}`);
        return (
          <Link
            key={code}
            href={`/${lang}/supplier/${code}`}
            onClick={() => changeSupplier(code)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              textDecoration: 'none',
              cursor: 'pointer',
              background: isActive ? 'var(--color-primary, #000)' : 'transparent',
              color: isActive ? '#fff' : 'var(--color-text, #333)',
              fontWeight: isActive ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
            }}
          >
            {name}
          </Link>
        );
      })}
    </div>
  );
}
