import React from 'react';
import Link from 'next/link';
import { searchProducts } from '../../lib/queries';
import ProductGrid from '../../components/product/ProductGrid';

export const revalidate = 0; // Dynamic search results

export default async function SearchPage({ searchParams }) {
  const { q } = await searchParams;
  const query = q || '';

  const results = await searchProducts(query);

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '6rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--color-text-secondary)' }}>الرئيسية</Link>
        <span> / </span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>نتائج البحث</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          {query ? `نتائج البحث عن: "${query}"` : 'البحث في المنتجات'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          {query ? `تم العثور على (${results.length}) منتج مطابق` : 'اكتب اسم المنتج أو الماركة في شريط البحث بالأعلى'}
        </p>
      </div>

      {/* Grid */}
      <ProductGrid products={results} emptyMessage={`لم يتم العثور على منتجات تطابق "${query}". جرب كلمات بحث أخرى مثل: شنطة، عطر، نظارة.`} />
    </div>
  );
}
