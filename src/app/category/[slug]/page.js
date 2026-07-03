import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getSubcategories, getProductsForCategory } from '../../../lib/queries';
import ProductGrid from '../../../components/product/ProductGrid';

export const revalidate = 60;

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const [subcategories, products, parentCategory] = await Promise.all([
    getSubcategories(category.id),
    getProductsForCategory(category.id, { limit: 48 }),
    category.parent_id ? getCategoryBySlug(category.parent_id) : Promise.resolve(null),
  ]);

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'var(--color-text-secondary)' }}>الرئيسية</Link>
        <span>/</span>
        {parentCategory && (
          <>
            <Link href={`/category/${parentCategory.slug || parentCategory.id}`} style={{ color: 'var(--color-text-secondary)' }}>
              {parentCategory.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{category.name}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{category.name}</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>عرض جميع المنتجات المتوفرة في قسم {category.name}</p>
      </div>

      {/* Subcategories Pills */}
      {subcategories.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${sub.slug || sub.id}`}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 700,
                transition: 'all var(--transition-fast)',
              }}
            >
              🔹 {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <ProductGrid products={products} emptyMessage="لا توجد منتجات متوفرة في هذا القسم حالياً" />
    </div>
  );
}
