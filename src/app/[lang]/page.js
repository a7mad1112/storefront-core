import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, hasLocale } from './dictionaries';
import { getCategories, getProductsForCategory, getBrands } from '../../lib/queries';
import { getDepartmentsShowcaseData } from '../../lib/departments-config';
import DepartmentsGatewayGrid from '../../components/home/DepartmentsGatewayGrid';
import DepartmentSectionsGrid from '../../components/home/DepartmentSectionsGrid';
import RandomCategorySections from '../../components/home/RandomCategorySections';
import BrandsSlider from '../../components/home/BrandsSlider';
import CategoriesSlider from '../../components/home/CategoriesSlider';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';

export const revalidate = 300;

export default async function HomePage({ params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  const [categories, brands, departments] = await Promise.all([
    getCategories(),
    getBrands(),
    getDepartmentsShowcaseData({ lang, dict }),
  ]);

  const topCategories = categories.filter((c) => !c.parent_id);

  const candidates = [...categories].slice(0, 6);

  const productBatches = await Promise.all(
    candidates.map((cat) => getProductsForCategory(cat.id, { limit: 4 }))
  );

  const candidateSections = [];
  for (let i = 0; i < candidates.length; i++) {
    const batch = productBatches[i];
    // getProductsForCategory now returns { products, totalCount }
    const prods = batch?.products ?? batch ?? [];
    if (prods.length > 0) {
      candidateSections.push({
        category: candidates[i],
        products: prods,
      });
    }
  }

  return (
    <div>
      {/* Hero Banner Section */}
      <section
        style={{
          position: 'relative',
          padding: '4.5rem 0',
          background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F2EC 50%, #EFECE5 100%)',
          borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem',
              fontWeight: 800,
              marginBottom: '1.25rem',
              border: '1px solid rgba(197, 152, 80, 0.4)',
            }}
          >
            {dict.hero.badge}
          </span>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)', fontWeight: 900, lineHeight: 1.2, marginBottom: '1.25rem', color: 'var(--color-text-primary)' }}>
            {dict.hero.title} <span style={{ color: 'var(--color-accent)' }}>{STORE_NAME}</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)', marginBottom: '2.25rem', lineHeight: 1.7 }}>
            {dict.hero.subtitle}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#departments-gateway" className="btn btn-primary" style={{ padding: '0.8rem 2.25rem', fontSize: '1.05rem', fontWeight: 800 }}>
              {dict.hero.browseProducts}
            </a>
            <a href="https://wa.me/972595809023" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.8rem 2.25rem', fontSize: '1.05rem', fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>
              {dict.hero.askWhatsApp}
            </a>
          </div>
        </div>
      </section>

      {/* Departments Gateway Portal Grid (#9 Resolution) */}
      <DepartmentsGatewayGrid departments={departments} lang={lang} dict={dict} />

      {/* Categories Slider Section */}
      <CategoriesSlider categories={topCategories} lang={lang} dict={dict} />

      {/* Brands Carousel Section */}
      <BrandsSlider brands={brands} lang={lang} dict={dict} />

      {/* Curated Major Departments Showcases */}
      <div id="departments-showcase" style={{ paddingBottom: '3rem' }}>
        <DepartmentSectionsGrid departments={departments} lang={lang} dict={dict} />
      </div>

      {/* Extra Random Discovery Sections at the very bottom */}
      {candidateSections && candidateSections.length > 0 && (
        <div id="more-explore" style={{ paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="container" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-secondary)' }}>
              {lang === 'en' ? '✨ More Featured Categories to Explore' : lang === 'he' ? '✨ קטגוריות נוספות ששווה לגלות' : '✨ المزيد من الأقسام المميزة للاستكشاف'}
            </h3>
          </div>
          <RandomCategorySections candidateSections={candidateSections} lang={lang} dict={dict} />
        </div>
      )}
    </div>
  );
}

