'use client';

import React from 'react';
import { useSupplier } from '../../context/SupplierContext';

export default function SupplierSwitcher({ lang = 'ar' }) {
  const { supportedSuppliers, supplierNames, activeSupplier, changeSupplier, hasMultipleSuppliers } = useSupplier();

  if (!hasMultipleSuppliers) {
    return null;
  }

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
        {lang === 'en' ? 'Supplier:' : lang === 'he' ? 'ספק:' : 'المورد:'}
      </span>
      
      <button
        type="button"
        onClick={() => changeSupplier('all')}
        style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          border: 'none',
          cursor: 'pointer',
          background: activeSupplier === 'all' ? 'var(--color-primary, #000)' : 'transparent',
          color: activeSupplier === 'all' ? '#fff' : 'var(--color-text, #333)',
          fontWeight: activeSupplier === 'all' ? 'bold' : 'normal',
          transition: 'all 0.2s ease',
        }}
      >
        {lang === 'en' ? 'All Suppliers' : lang === 'he' ? 'כל הספקים' : 'كل الموردين'}
      </button>

      {supportedSuppliers.map((code) => {
        const name = supplierNames[code] || code;
        const isActive = activeSupplier === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => changeSupplier(code)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              background: isActive ? 'var(--color-primary, #000)' : 'transparent',
              color: isActive ? '#fff' : 'var(--color-text, #333)',
              fontWeight: isActive ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
            }}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
