import React from 'react';
import Link from 'next/link';
import { getCategories, getProductsForCategory } from '../lib/queries';
import RandomCategorySections from '../components/home/RandomCategorySections';

export const revalidate = 300; // Cache candidate batches for 5 mins

export default async function HomePage() {
  const categories = await getCategories();

  // Top-level categories for department selector
  const topCategories = categories.filter((c) => !c.parent_id);

  // Shuffle categories to pick random sections
  const shuffled = [...categories].sort(() => Math.random() - 0.5);
  const candidates = shuffled.slice(0, 8);

  const productBatches = await Promise.all(
    candidates.map((cat) => getProductsForCategory(cat.id, { limit: 4 }))
  );

  const candidateSections = [];
  for (let i = 0; i < candidates.length; i++) {
    if (productBatches[i] && productBatches[i].length > 0) {
      candidateSections.push({
        category: candidates[i],
        products: productBatches[i],
      });
    }
  }

  return (
    <div>
      {/* Hero Banner Section */}
      <section
        style={{
          position: 'relative',
          padding: '4rem 0',
          background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F2EC 50%, #EFECE5 100%)',
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
              border: '1px solid rgba(197, 152, 80, 0.4)',
            }}
          >
            ✨ أحدث تشكيلة للموضة والأناقة والشنط الفاخرة
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.25rem', color: 'var(--color-text-primary)' }}>
            أناقة وفخامة تليق بكِ في <span style={{ color: 'var(--color-accent)' }}>Eloria FASHION</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
            تسوقي أجمل الشنط، العطور، الساعات، والاكسسوارات بأعلى معايير الجودة والتميز. توصيل سريع ومضمون لباب المنزل في جميع المدن.
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

      {/* Dynamic Random Category Sections (Stable during viewing) */}
      <div id="latest-products" style={{ paddingBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <RandomCategorySections candidateSections={candidateSections} />
      </div>
    </div>
  );
}
