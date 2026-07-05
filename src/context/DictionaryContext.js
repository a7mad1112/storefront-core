'use client';

import React, { createContext, useContext } from 'react';

const DictionaryContext = createContext(null);

/**
 * DictionaryProvider — wraps client components to provide
 * the translation dictionary and current locale.
 */
export function DictionaryProvider({ children, dictionary, lang }) {
  return (
    <DictionaryContext.Provider value={{ dict: dictionary, lang }}>
      {children}
    </DictionaryContext.Provider>
  );
}

/**
 * useDictionary — hook to access translations in client components.
 * Returns { dict, lang }.
 */
export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return context;
}
