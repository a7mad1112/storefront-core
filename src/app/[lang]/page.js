import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, hasLocale } from './dictionaries';
import { getCategories, getProductsForCategory, getBrands } from '../../lib/queries';
import RandomCategorySections from '../../components/home/RandomCategorySections';
import BrandsSlider from '../../components/home/BrandsSlider';
import CategoriesSlider from '../../components/home/CategoriesSlider';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';

export const revalidate = 300;

export default async function HomePage({ params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  const [categories, brands] = await Promise.all([
    getCategories(),
    getBrands(),
  ]);

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
            {dict.hero.badge}
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.25rem', color: 'var(--color-text-primary)' }}>
            {dict.hero.title} <span style={{ color: 'var(--color-accent)' }}>{STORE_NAME}</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
            {dict.hero.subtitle}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#latest-products" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
              {dict.hero.browseProducts}
            </a>
            <a href="https://wa.me/972595809023" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '1rem', borderColor: '#25D366', color: '#25D366' }}>
              {dict.hero.askWhatsApp}
            </a>
          </div>
        </div>
      </section>

      {/* Categories Slider Section */}
      <CategoriesSlider categories={topCategories} lang={lang} dict={dict} />

      {/* Brands Carousel Section */}
      <BrandsSlider brands={brands} lang={lang} dict={dict} />

      {/* Dynamic Random Category Sections */}
      <div id="latest-products" style={{ paddingBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <RandomCategorySections candidateSections={candidateSections} lang={lang} dict={dict} />
      </div>
    </div>
  );
}
