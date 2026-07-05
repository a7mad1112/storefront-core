import React from 'react';
import Link from 'next/link';
import { searchProducts } from '../../../lib/queries';
import ProductGrid from '../../../components/product/ProductGrid';
import { getDictionary, hasLocale } from '../dictionaries';

export const revalidate = 0; // Dynamic search results

export default async function SearchPage({ params, searchParams }) {
  const { lang } = await params;
  const { q } = await searchParams;
  const query = q || '';

  const dict = await getDictionary(lang);
  const tSearch = dict.search || {};
  const tCommon = dict.common || {};

  const results = await searchProducts(query);

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '6rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        <Link href={`/${lang}`} style={{ color: 'var(--color-text-secondary)' }}>{tCommon.home || 'الرئيسية'}</Link>
        <span> / </span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{dict.breadcrumb?.searchResults || 'نتائج البحث'}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          {query ? `${tSearch.resultsFor || 'نتائج البحث عن:'} "${query}"` : (tSearch.searchProducts || 'البحث في المنتجات')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          {query ? `${tSearch.foundProducts || 'تم العثور على'} (${results.length}) ${tSearch.matchingProduct || 'منتج مطابق'}` : (tSearch.searchHint || 'اكتب اسم المنتج أو الماركة في شريط البحث بالأعلى')}
        </p>
      </div>

      {/* Grid */}
      <ProductGrid products={results} emptyMessage={query ? `${tSearch.noResults || 'لم يتم العثور على منتجات تطابق'} "${query}". ${tSearch.tryOther || 'جرب كلمات بحث أخرى.'}` : (tSearch.searchHint || 'اكتب اسم المنتج أو الماركة')} />
    </div>
  );
}
