import React from 'react';
import Link from 'next/link';

/**
 * Server-side Pagination component.
 *
 * Renders numbered page buttons with Previous/Next arrows.
 * Uses ?page=N search params for SEO-friendly navigation.
 * Preserves all existing search params (e.g. ?sort=price_asc&page=2).
 *
 * @param {number}  currentPage  - 1-based current page number
 * @param {number}  totalPages   - total number of pages
 * @param {string}  basePath     - the current pathname (without query string)
 * @param {object}  searchParams - current search params object (to preserve sort etc.)
 * @param {'ar'|'en'|'he'} lang  - language for RTL/LTR direction
 */
export default function Pagination({ currentPage, totalPages, basePath, searchParams = {}, lang = 'ar' }) {
  if (totalPages <= 1) return null;

  const isRTL = lang !== 'en';

  // Build a URL for a given page number, preserving existing search params
  function pageUrl(page) {
    const params = new URLSearchParams();
    // Preserve all existing params except 'page'
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k !== 'page' && v != null) params.set(k, v);
    });
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  // Smart page range: always show first, last, current ±2, with ellipsis gaps
  function getPageRange() {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }

  const pages = getPageRange();
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const labels = {
    ar: { prev: '→', next: '←', page: 'صفحة' },
    en: { prev: '←', next: '→', page: 'Page' },
    he: { prev: '→', next: '←', page: 'עמוד' },
  };
  const t = labels[lang] || labels.ar;

  return (
    <nav
      aria-label="Pagination"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '3rem 0 1rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Prev */}
      {prevPage ? (
        <Link
          href={pageUrl(prevPage)}
          aria-label="Previous page"
          style={btnStyle(false)}
        >
          {t.prev}
        </Link>
      ) : (
        <span style={btnStyle(false, true)}>{t.prev}</span>
      )}

      {/* Page numbers */}
      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`dots-${idx}`} style={dotsStyle}>…</span>
        ) : (
          <Link
            key={page}
            href={pageUrl(page)}
            aria-label={`${t.page} ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            style={page === currentPage ? activePageStyle : pageStyle}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {nextPage ? (
        <Link
          href={pageUrl(nextPage)}
          aria-label="Next page"
          style={btnStyle(false)}
        >
          {t.next}
        </Link>
      ) : (
        <span style={btnStyle(false, true)}>{t.next}</span>
      )}
    </nav>
  );
}

// ── Styles ────────────────────────────────────────────────

const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '2.25rem',
  height: '2.25rem',
  padding: '0 0.625rem',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: '0.9rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  transition: 'all 0.15s ease',
  textDecoration: 'none',
  userSelect: 'none',
  lineHeight: 1,
};

const pageStyle = {
  ...base,
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-card)',
};

const activePageStyle = {
  ...base,
  color: '#fff',
  border: '1px solid var(--color-accent)',
  backgroundColor: 'var(--color-accent)',
  cursor: 'default',
  boxShadow: '0 2px 8px rgba(var(--color-accent-rgb, 99,102,241), 0.4)',
};

const dotsStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '2.25rem',
  height: '2.25rem',
  color: 'var(--color-text-muted)',
  fontSize: '0.9rem',
};

function btnStyle(isActive, isDisabled) {
  return {
    ...base,
    color: isDisabled ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
    backgroundColor: isDisabled ? 'transparent' : 'var(--color-bg-card)',
    opacity: isDisabled ? 0.4 : 1,
    cursor: isDisabled ? 'default' : 'pointer',
    pointerEvents: isDisabled ? 'none' : 'auto',
    fontSize: '1rem',
  };
}
