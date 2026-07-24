'use client';

import React from 'react';
import Link from 'next/link';
import { getCategoryDisplayName } from '../../lib/utils';

/**
 * Departments Gateway Grid — Luxury Mall Showcase Portal
 *
 * Displays the 4 major departments of Eloria FASHION in an ultra-premium,
 * responsive bento/grid layout right on the homepage.
 */
export default function DepartmentsGatewayGrid({ departments = [], lang = 'ar', dict }) {
  if (!departments || departments.length === 0) return null;

  const t = dict?.departments || {};
  const isRtl = lang === 'ar' || lang === 'he';

  const handleSmoothScroll = (e, anchorId) => {
    if (!anchorId) return;
    const target = document.getElementById(anchorId);
    if (target) {
      e.preventDefault();
      const headerOffset = 90;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="departments-gateway" className="container" style={{ padding: '4rem var(--space-4) 2rem' }}>
      {/* Gateway Section Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3rem' }}>
        <span
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-accent)',
            padding: '0.35rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 800,
            marginBottom: '0.875rem',
            border: '1px solid var(--color-border)',
          }}
        >
          {t.portalTitle || (lang === 'en' ? 'Departments & Luxury Mall Showcase' : lang === 'he' ? 'שער הקטגוריות והקניון היוקרתי' : 'بوابة الأقسام والمول التجاري الفاخر')}
        </span>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1.25, marginBottom: '0.75rem' }}>
          {lang === 'en' ? 'Explore Our Major Departments' : lang === 'he' ? 'גלה את המחלקות המובילות שלנו' : 'استكشف أقسامنا الفاخرة الكبرى'}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          {t.portalSubtitle || (lang === 'en' ? 'Explore our major departments and find what suits your refined taste with a single click' : lang === 'he' ? 'חקור את המחלקות הגדולות שלנו ומצא את מה שמתאים לטעם המשובח שלך בקליק אחד' : 'تصفحي أقسامنا الكبرى واختاري ما يناسب ذوقك الرفيع بضغطة زر واحدة')}
        </p>
      </div>

      {/* Four Departments Bento Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
        }}
      >
        {departments.map((dept) => (
          <div
            key={dept.id}
            style={{
              position: 'relative',
              borderRadius: '20px',
              padding: '2.25rem',
              background: dept.bgGradient || 'var(--color-bg-secondary)',
              border: `1px solid ${dept.cardBorder || 'var(--color-border)'}`,
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              overflow: 'hidden',
            }}
            className="department-gateway-card"
          >
            {/* Top Row: Icon and Badge */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--color-bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.25rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {dept.icon}
                </div>
                {dept.badge && (
                  <span
                    style={{
                      backgroundColor: dept.accentColor || 'var(--color-accent)',
                      color: '#ffffff',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      boxShadow: `0 4px 12px ${dept.accentColor}40`,
                    }}
                  >
                    {dept.badge}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                {dept.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.5rem', minHeight: '3em' }}>
                {dept.subtitle}
              </p>

              {/* Subcategories Pills inside the card */}
              {dept.categories && dept.categories.length > 0 && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.subcategoriesTitle || (lang === 'en' ? 'Featured Categories:' : lang === 'he' ? 'קטגוריות נבחרות:' : 'أبرز التصنيفات بالقسم:')}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {dept.categories.slice(0, 5).map((cat) => (
                      <Link
                        key={cat.id || cat.slug}
                        href={`/${lang}/supplier/${dept.id}/category/${cat.slug || cat.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '10px',
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: '1px solid var(--color-border)',
                          transition: 'all 0.2s ease',
                          textDecoration: 'none',
                        }}
                        className="dept-subcategory-pill"
                      >
                        {getCategoryDisplayName(cat, lang)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <a
                href={`#${dept.anchorId}`}
                onClick={(e) => handleSmoothScroll(e, dept.anchorId)}
                className="btn btn-primary"
                style={{
                  flex: '1 1 auto',
                  textAlign: 'center',
                  padding: '0.7rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  backgroundColor: dept.accentColor || 'var(--color-accent)',
                  borderColor: dept.accentColor || 'var(--color-accent)',
                  color: '#ffffff',
                }}
              >
                {t.exploreBtn || (lang === 'en' ? 'Explore Department ↓' : lang === 'he' ? 'חקור את המחלקה ↓' : 'استكشف منتجات القسم ↓')}
              </a>
              <Link
                href={dept.viewAllHref}
                className="btn btn-secondary"
                style={{
                  padding: '0.7rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {isRtl ? '←' : '→'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .department-gateway-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.15) !important;
        }
        .dept-subcategory-pill:hover {
          background-color: var(--color-accent) !important;
          color: #ffffff !important;
          border-color: var(--color-accent) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </section>
  );
}
