'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MarginManagerClient({ categories }) {
  const [margins, setMargins] = useState(() => {
    const initial = {};
    categories.forEach((c) => {
      const existing = Array.isArray(c.margins) ? c.margins[0] : c.margins;
      initial[c.id] = {
        marginType: existing?.margin_type || 'percentage',
        marginValue: existing?.margin_value ?? 20, // Default 20%
      };
    });
    return initial;
  });

  const [savingId, setSavingId] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [globalType, setGlobalType] = useState('percentage');
  const [globalValue, setGlobalValue] = useState(25);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const router = useRouter();

  const handleSave = async (categoryId) => {
    setSavingId(categoryId);
    setSuccessId(null);
    try {
      const item = margins[categoryId];
      const res = await fetch('/api/admin/margins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          marginType: item.marginType,
          marginValue: item.marginValue,
        }),
      });
      if (res.ok) {
        setSuccessId(categoryId);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const handleApplyAll = async () => {
    if (!confirm(`هل أنت متأكد من تطبيق زيادة (${globalValue}${globalType === 'percentage' ? '%' : ' ₪'}) على جميع الأقسام (${categories.length})؟`)) {
      return;
    }
    setSavingGlobal(true);
    try {
      for (const cat of categories) {
        await fetch('/api/admin/margins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: cat.id,
            marginType: globalType,
            marginValue: globalValue,
          }),
        });
      }
      // Update local state
      const updated = {};
      categories.forEach((c) => {
        updated[c.id] = { marginType: globalType, marginValue: globalValue };
      });
      setMargins(updated);
      router.refresh();
      alert('✅ تم تطبيق هامش الأرباح على جميع الأقسام بنجاح!');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تطبيق الهامش الشامل');
    } finally {
      setSavingGlobal(false);
    }
  };

  return (
    <div>
      {/* Global Apply Box */}
      <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>⚡ تطبيق سريع على جميع الأقسام</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>حدد نسبة زيادة موحدة وتطبيقها بضغطة زر واحدة</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={globalType}
            onChange={(e) => setGlobalType(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-card)', color: '#fff', border: '1px solid var(--color-border)' }}
          >
            <option value="percentage">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (₪)</option>
          </select>
          <input
            type="number"
            value={globalValue}
            onChange={(e) => setGlobalValue(e.target.value)}
            style={{ width: '80px', padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-card)', color: '#fff', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 800 }}
          />
          <button
            onClick={handleApplyAll}
            disabled={savingGlobal}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem' }}
          >
            {savingGlobal ? '⏳ جاري التطبيق...' : 'تطبيق على الجميع'}
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>القسم / الفئة</th>
              <th style={{ padding: '1rem' }}>نوع الهامش</th>
              <th style={{ padding: '1rem' }}>مقدار الزيادة</th>
              <th style={{ padding: '1rem' }}>مثال (سعر جملة 100 ₪)</th>
              <th style={{ padding: '1rem' }}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const item = margins[cat.id] || { marginType: 'percentage', marginValue: 20 };
              const exampleRetail = item.marginType === 'percentage'
                ? Math.round(100 * (1 + item.marginValue / 100))
                : 100 + Number(item.marginValue);

              return (
                <tr key={cat.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{cat.name}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <select
                      value={item.marginType}
                      onChange={(e) => setMargins({ ...margins, [cat.id]: { ...item, marginType: e.target.value } })}
                      style={{ padding: '0.4rem', borderRadius: '4px', backgroundColor: 'var(--color-bg-secondary)', color: '#fff', border: '1px solid var(--color-border)' }}
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (₪)</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <input
                      type="number"
                      value={item.marginValue}
                      onChange={(e) => setMargins({ ...margins, [cat.id]: { ...item, marginValue: Number(e.target.value) } })}
                      style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', backgroundColor: 'var(--color-bg-secondary)', color: '#fff', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 800 }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--color-accent)', fontWeight: 800 }}>
                    {exampleRetail} ₪
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => handleSave(cat.id)}
                      disabled={savingId === cat.id}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 1rem' }}
                    >
                      {savingId === cat.id ? '⏳' : successId === cat.id ? '✔ تم الحفظ' : '💾 حفظ'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
