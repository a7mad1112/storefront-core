import React from 'react';
import { getMarginsWithCategories } from '../../../../lib/queries';
import { getSupportedSuppliers } from '../../../../lib/supplierConfig';
import MarginManagerClient from './MarginManagerClient';

export const revalidate = 0;

export default async function AdminMarginsPage() {
  // Fetch all categories once (unfiltered) — the client will handle per-supplier tab filtering.
  const allCategories = await getMarginsWithCategories();

  // Derive the unique supplier codes actually present in the returned categories,
  // intersected with the configured active suppliers list.
  const activeSuppliersFromEnv = getSupportedSuppliers();
  const suppliersInDB = [...new Set(allCategories.map((c) => c.supplier_code).filter(Boolean))];
  const suppliers = activeSuppliersFromEnv.length > 0
    ? suppliersInDB.filter((s) => activeSuppliersFromEnv.includes(s))
    : suppliersInDB;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>إدارة هوامش الأرباح والأسعار</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          تحكم في نسبة أو مبلغ الربح المضاف على سعر المورد لكل قسم. سيتم تحديث سعر البيع للجمهور فوراً في المتجر.
        </p>
      </div>

      <MarginManagerClient categories={allCategories} suppliers={suppliers} />
    </div>
  );
}
