import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, getCategoryBySlug } from '../../../lib/queries';
import { formatPrice } from '../../../lib/utils';
import ProductDetailActions from '../../../components/product/ProductDetailActions';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return { title: 'المنتج غير موجود — Eloria FASHION' };
  }

  const desc = product.description || `تسوقي ${product.name} بأفضل الأسعار وأعلى معايير الجودة من متجر Eloria FASHION مع خدمة توصيل سريعة وموثوقة.`;

  return {
    title: `${product.name} — Eloria FASHION`,
    description: desc,
    openGraph: {
      title: `${product.name} — Eloria FASHION`,
      description: desc,
      images: [product.image_url || '/placeholder.webp'],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const category = product.category_id ? await getCategoryBySlug(product.category_id) : null;
  const parentCategory = category?.parent_id ? await getCategoryBySlug(category.parent_id) : null;

  return (
    <div className="container" style={{ padding: '3rem var(--space-4)', paddingBottom: '6rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
        {(category || product.category_slug) && (
          <>
            <Link href={`/category/${category?.slug || product.category_slug}`} style={{ color: 'var(--color-text-secondary)' }}>
              {category?.name || product.category_name}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="product-detail-grid">
        {/* Left / Top Image Showcase */}
        <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
          <img
            src={product.image_url || '/placeholder.webp'}
            alt={product.name}
            style={{ maxHeight: '450px', width: 'auto', objectFit: 'contain' }}
            fetchPriority="high"
            decoding="async"
            loading="eager"
          />
        </div>

        {/* Right / Bottom Details */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {product.category_name && (
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-accent)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
                width: 'fit-content',
                marginBottom: '1rem',
              }}
            >
              {product.category_name}
            </span>
          )}

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '1rem' }}>
            {product.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
              {formatPrice(product.retail_price || 0)}
            </span>
            <span style={{ color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 700, backgroundColor: 'rgba(56, 161, 105, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              ✔ متوفر في المخزون
            </span>
          </div>

          {/* Description */}
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '0.5rem' }}>
            <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>وصف المنتج والمواصفات:</h3>
            <p>
              {product.description || 'منتج عالي الجودة ومميز من متجرنا، تم اختياره بعناية ليلبي تطلعاتك ويضمن لك أفضل أداء وتجربة استخدام رائعة، أو ليكون خياراً مميزاً للإهداء لمن تحب.'}
            </p>
          </div>

          {/* Actions Component */}
          <ProductDetailActions product={product} />

          {/* Perks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <div>
              <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🚚</p>
              <p>توصيل سريع لباب بيتك</p>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🎁</p>
              <p>شامل علبة وكيس الشركة</p>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>⭐</p>
              <p>جودة ماستر كوالتي مضمونة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
