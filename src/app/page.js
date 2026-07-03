import React from 'react';
import Link from 'next/link';
import { getCategories, getProducts } from '../lib/queries';
import ProductGrid from '../components/product/ProductGrid';

export const revalidate = 60; // Revalidate home page every 60 seconds

export default async function HomePage() {
  const [categories, latestProducts] = await Promise.all([
    getCategories(),
    getProducts({ limit: 16 }),
  ]);

  // Top-level categories (parent_id is null or empty)
  const topCategories = categories.filter((c) => !c.parent_id).slice(0, 12);

  return (
    <div>
      {/* Hero Banner Section */}
      <section
        style={{
          position: 'relative',
          padding: '4rem 0',
          background: 'linear-gradient(135deg, #12121a 0%, #1a1a2e 50%, #2a0a14 100%)',
          borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
              padding: '0.25rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem',
              fontWeight: 800,
              marginBottom: '1rem',
              border: '1px solid rgba(196, 22, 58, 0.3)',
            }}
          >
            ✨ أحدث تشكيلة من الشنط والهدايا الفاخرة
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.25rem' }}>
            أناقة وفخامة تليق بكِ في <span style={{ color: 'var(--color-accent)' }}>GB Store</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
            تسوقي أجمل الشنط، العطور، الساعات، والنظارات بجودة ماستر كوالتي ممتازة وشاملة علبة الشركة والكيس. توصيل لباب المنزل في جميع المدن.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#latest-products" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
              🛍️ تصفح أحدث المنتجات
            </a>
            <a href="https://wa.me/972595809023" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '1rem', borderColor: '#25D366', color: '#25D366' }}>
              💬 استفسر عبر واتساب
            </a>
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="container" style={{ padding: '4rem var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>تسوق حسب القسم</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>اختر من بين تشكيلتنا الواسعة من الفئات المميزة</p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '1rem',
          }}
        >
          {topCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug || cat.id}`}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 0.75rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all var(--transition-fast)',
              }}
              className="cat-card"
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  border: '1px solid var(--color-border)',
                }}
              >
                {cat.name.includes('شنط') ? '👜' : cat.name.includes('عطر') || cat.name.includes('عطور') ? '🌸' : cat.name.includes('ساع') ? '⌚' : cat.name.includes('نظار') ? '🕶️' : '🎁'}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Products Section */}
      <section id="latest-products" className="container" style={{ paddingBottom: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>وصل حديثاً</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>أحدث المنتجات التي تمت إضافتها للمتجر اليوم</p>
          </div>
        </div>

        <ProductGrid products={latestProducts} />
      </section>
    </div>
  );
}
