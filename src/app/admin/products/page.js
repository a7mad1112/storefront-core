import React from 'react';
import { getAdminProducts } from '../../../lib/queries';
import { formatPrice } from '../../../lib/utils';

export const revalidate = 0;

export default async function AdminProductsPage({ searchParams }) {
  const { page = '1' } = await searchParams;
  const pageNum = parseInt(page, 10) || 1;
  const limit = 50;
  const offset = (pageNum - 1) * limit;

  const products = await getAdminProducts({ limit, offset });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>إدارة المنتجات والأسعار</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>جدول المنتجات شامل سعر الجملة (سري) وسعر البيع للجمهور</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>صورة</th>
              <th style={{ padding: '1rem' }}>اسم المنتج</th>
              <th style={{ padding: '1rem' }}>سعر الجملة (المورد)</th>
              <th style={{ padding: '1rem' }}>الكمية</th>
              <th style={{ padding: '1rem' }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem' }}>
                  <img src={p.image_url || '/placeholder.webp'} alt={p.name} style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'var(--color-bg-secondary)' }} />
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 700, maxWidth: '300px' }}>{p.name}</td>
                <td style={{ padding: '0.75rem', color: 'var(--color-warning)', fontWeight: 800 }}>{formatPrice(p.wholesale_price)}</td>
                <td style={{ padding: '0.75rem' }}>{p.quantity ?? 'غير محدد'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ color: p.is_available ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>
                    {p.is_available ? 'متوفر' : 'نفد'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
