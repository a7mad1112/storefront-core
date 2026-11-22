import React from 'react';
import { getAdminProducts, getAvailabilityOverrides } from '../../../../lib/queries';
import AdminProductsClient from './AdminProductsClient';

export const revalidate = 0;

export default async function AdminProductsPage({ searchParams }) {
  const params = await searchParams;
  const page = params.page || '1';
  const supplier = params.supplier || 'all';
  const search = params.search || '';

  const pageNum = parseInt(page, 10) || 1;
  const limit = 50;
  const offset = (pageNum - 1) * limit;

  let products = [];
  let totalCount = 0;
  let overrides = {};

  try {
    const [{ products: p, totalCount: t }, o] = await Promise.all([
      getAdminProducts({ limit, offset, supplierCode: supplier, search }),
      getAvailabilityOverrides(),
    ]);
    products = p || [];
    totalCount = t || 0;
    overrides = o || {};
  } catch (err) {
    console.error('[AdminProductsPage] error:', err);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>إدارة المنتجات والأسعار</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>جدول المنتجات شامل سعر الجملة (سري) وسعر البيع للجمهور ومقدار الربح</p>
        </div>
      </div>

      <AdminProductsClient
        products={products}
        totalCount={totalCount}
        pageNum={pageNum}
        limit={limit}
        initialSupplier={supplier}
        initialSearch={search}
        overrides={overrides}
      />
    </div>
  );
}
