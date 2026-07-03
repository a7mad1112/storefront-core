import React from 'react';
import Link from 'next/link';
import { getCategories } from '../../lib/queries';

export const revalidate = 3600; // Revalidate every hour

export const metadata = {
  title: 'جميع الأقسام والفئات — Eloria FASHION',
  description: 'تصفح جميع أقسام وفئات متجر Eloria FASHION للموضة والأناقة والشنط الفاخرة.',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  // Separate parent and sub categories
  const parentCategories = categories.filter((c) => !c.parent_id);
  const getSubs = (parentId) => categories.filter((c) => c.parent_id === parentId);

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '6rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link href="/" style={{ color: 'var(--color-text-secondary)' }}>الرئيسية</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>جميع الأقسام</span>
      </nav>

      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>🛍️ تصفح جميع الأقسام</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>اختر القسم لتصفح أحدث تشكيلة من الشنط، الهدايا، والاكسسوارات الفاخرة</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {parentCategories.map((parent) => {
          const subs = getSubs(parent.id);
          return (
            <div
              key={parent.id}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <Link href={`/category/${parent.slug || parent.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {parent.name.includes('شنط') ? '👜' : parent.name.includes('عطر') || parent.name.includes('عطور') ? '🌸' : parent.name.includes('ساع') ? '⌚' : parent.name.includes('نظار') ? '🕶️' : '🎁'}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{parent.name}</h2>
              </Link>

              {subs.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {subs.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/category/${sub.slug || sub.id}`}
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary)',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      • {sub.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>تصفح منتجات هذا القسم ←</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
