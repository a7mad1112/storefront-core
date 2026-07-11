'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupplierConfig, getSupportedSuppliers } from '../lib/supplierConfig';

const SupplierContext = createContext(null);

export function SupplierProvider({ children }) {
  const [supportedSuppliers, setSupportedSuppliers] = useState(() => {
    const list = getSupportedSuppliers();
    return list.length > 0 ? list : ['gbstore', 'balagan', 'sakher'];
  });
  const [supplierNames] = useState(() => {
    const namesEnv = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPPLIER_NAMES : '';
    if (namesEnv) {
      try {
        return JSON.parse(namesEnv);
      } catch (e) {
        console.error('[SupplierContext] Failed to parse NEXT_PUBLIC_SUPPLIER_NAMES:', e);
      }
    }
    return {};
  });
  const [activeSupplier, setActiveSupplier] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('gb_active_supplier');
        const list = getSupportedSuppliers();
        if (saved && (saved === 'all' || list.includes(saved))) {
          return saved;
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }
    return 'all';
  });

  const changeSupplier = (code) => {
    setActiveSupplier(code);
    try {
      localStorage.setItem('gb_active_supplier', code);
    } catch (e) {
      // ignore
    }
  };

  const getSupplierName = (code, lang = 'ar') => {
    if (lang && lang !== 'ar') {
      const configName = getSupplierConfig(code, lang).name;
      if (configName) return configName;
    }
    if (supplierNames[code]) {
      if (typeof supplierNames[code] === 'object') {
        return supplierNames[code][lang] || supplierNames[code].ar || supplierNames[code].name;
      }
      if (lang === 'ar') return supplierNames[code];
    }
    return getSupplierConfig(code, lang).name;
  };

  return (
    <SupplierContext.Provider
      value={{
        supportedSuppliers,
        supplierNames,
        activeSupplier,
        changeSupplier,
        getSupplierName,
        getSupplierMeta: (code, lang = 'ar') => getSupplierConfig(code, lang),
        hasMultipleSuppliers: supportedSuppliers.length > 1,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
}

export function useSupplier() {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
}
