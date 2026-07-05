'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDictionary } from '../../context/DictionaryContext';

export default function SortSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'default';

  let dict = {};
  try {
    const res = useDictionary();
    dict = res.dict || {};
  } catch (e) {
    // Fallback if rendered outside DictionaryProvider
  }

  const tSort = dict.sort || {};

  const SORT_OPTIONS = [
    { value: 'default', label: tSort.default || 'الافتراضي' },
    { value: 'price_asc', label: tSort.priceAsc || 'السعر: من الأقل للأعلى' },
    { value: 'price_desc', label: tSort.priceDesc || 'السعر: من الأعلى للأقل' },
  ];

  const handleChange = (e) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="sort-selector">
      <label htmlFor="sort-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
        {tSort.sortBy || 'ترتيب حسب:'}
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleChange}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          fontSize: '0.875rem',
          fontWeight: 700,
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
