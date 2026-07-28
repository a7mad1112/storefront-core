'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDictionary } from '../../context/DictionaryContext';

export default function PredictiveSearch({ lang = 'ar' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  let dict = {};
  try {
    const res = useDictionary();
    dict = res.dict || {};
  } catch (e) {
    // Fallback
  }

  const tSearch = dict?.search || {};

  // Debounced fetch
  const fetchResults = useCallback(
    (q) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!q.trim() || q.trim().length < 2) {
        setResults([]);
        setIsLoading(false);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=5`);
          const data = await res.json();
          setResults(data.results || []);
        } catch (err) {
          console.error('[PredictiveSearch]', err);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    []
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    fetchResults(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const getDisplayName = (item) => {
    if (lang === 'en' && item.name_en) return item.name_en;
    if (lang === 'he' && item.name_he) return item.name_he;
    return item.name;
  };

  const formatPrice = (price) => {
    const rounded = Math.round(price);
    return `${rounded} ₪`;
  };

  const placeholderText = tSearch.searchPlaceholder || (
    lang === 'en' ? 'Search for bags, perfumes, watches...' :
    lang === 'he' ? 'חפש תיקים, בשמים, שעונים...' :
    'ابحث عن الشنط، العطور، الساعات...'
  );

  const seeAllText = tSearch.seeAllResults || (
    lang === 'en' ? 'See all results for' :
    lang === 'he' ? 'הצג את כל התוצאות עבור' :
    'عرض جميع النتائج لـ'
  );

  return (
    <div ref={wrapperRef} className="predictive-search-wrapper">
      <form onSubmit={handleSubmit} className="header-search-form">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholderText}
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0 || isLoading) setIsOpen(true); }}
          className="header-search-input"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
      </form>

      {isOpen && (
        <div className="predictive-search-dropdown" role="listbox">
          {isLoading ? (
            /* Skeleton loaders */
            <div className="predictive-search-skeletons">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="predictive-search-item predictive-search-skeleton-item">
                  <div className="skeleton predictive-search-skeleton-img" />
                  <div className="predictive-search-skeleton-text">
                    <div className="skeleton" style={{ height: '14px', width: '75%', marginBottom: '6px' }} />
                    <div className="skeleton" style={{ height: '12px', width: '35%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <ul className="predictive-search-results">
                {results.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/${lang}/product/${item.id}`}
                      className="predictive-search-item"
                      onClick={handleResultClick}
                    >
                      <div className="predictive-search-thumb">
                        <img
                          src={item.image_url || '/placeholder.webp'}
                          alt={getDisplayName(item)}
                          loading="lazy"
                        />
                      </div>
                      <div className="predictive-search-info">
                        <span className="predictive-search-name">{getDisplayName(item)}</span>
                        <span className="predictive-search-price">{formatPrice(item.retail_price)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/${lang}/search?q=${encodeURIComponent(query.trim())}`}
                className="predictive-search-footer"
                onClick={handleResultClick}
              >
                🔍 {seeAllText} &ldquo;{query.trim()}&rdquo;
              </Link>
            </>
          ) : query.trim().length >= 2 ? (
            <div className="predictive-search-empty">
              <span>🔍</span>
              <span>
                {tSearch.noResults || (
                  lang === 'en' ? 'No products found' :
                  lang === 'he' ? 'לא נמצאו מוצרים' :
                  'لم يتم العثور على منتجات'
                )}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
