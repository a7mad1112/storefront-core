import React from 'react';
import { getMarginsWithCategories } from '../../../lib/queries';
import MarginManagerClient from './MarginManagerClient';

export const revalidate = 0;

export default async function AdminMarginsPage() {
  const categories = await getMarginsWithCategories();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>إدارة هوامش الأرباح والأسعار</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          تحكم في نسبة أو مبلغ الربح المضاف على سعر المورد لكل قسم. سيتم تحديث سعر البيع للجمهور فوراً في المتجر.
        </p>
      </div>

      <MarginManagerClient categories={categories} />
    </div>
  );
}
