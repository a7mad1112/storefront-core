'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const SupplierContext = createContext(null);

export function SupplierProvider({ children }) {
  const [supportedSuppliers, setSupportedSuppliers] = useState(['gbstore']);
  const [supplierNames, setSupplierNames] = useState({ gbstore: 'جي بي ستور (GB Store)' });
  const [activeSupplier, setActiveSupplier] = useState('all'); // 'all' or specific supplier code

  useEffect(() => {
    // Parse supported suppliers from environment
    const suppliersEnv = process.env.NEXT_PUBLIC_SUPPORTED_SUPPLIERS || 'gbstore';
    const list = suppliersEnv.split(',').map((s) => s.trim()).filter(Boolean);
    setSupportedSuppliers(list.length > 0 ? list : ['gbstore']);

    // Parse supplier display names
    const namesEnv = process.env.NEXT_PUBLIC_SUPPLIER_NAMES;
    if (namesEnv) {
      try {
        const parsed = JSON.parse(namesEnv);
        setSupplierNames(parsed);
      } catch (e) {
        console.error('[SupplierContext] Failed to parse NEXT_PUBLIC_SUPPLIER_NAMES:', e);
      }
    }

    // Try reading saved preference from localStorage
    try {
      const saved = localStorage.getItem('gb_active_supplier');
      if (saved && (saved === 'all' || list.includes(saved))) {
        setActiveSupplier(saved);
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  const changeSupplier = (code) => {
    setActiveSupplier(code);
    try {
      localStorage.setItem('gb_active_supplier', code);
    } catch (e) {
      // ignore
    }
  };

  return (
    <SupplierContext.Provider
      value={{
        supportedSuppliers,
        supplierNames,
        activeSupplier,
        changeSupplier,
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
