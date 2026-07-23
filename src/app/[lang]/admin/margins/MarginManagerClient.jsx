'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Friendly Arabic labels for each internal supplier code
const SUPPLIER_LABELS = {
  gbstore: 'شنط وهدايا',
  balagan: 'أحذية',
  sakher: 'ملابس رياضية',
};

const SUPPLIER_ICONS = {
  gbstore: '🎁',
  balagan: '👟',
  sakher: '🏃',
};

export default function MarginManagerClient({ categories, suppliers = [] }) {
  // Active supplier tab — defaults to first supplier, or null if only one supplier
  const showTabs = suppliers.length > 1;
  const [activeSupplier, setActiveSupplier] = useState(showTabs ? (suppliers[0] ?? null) : null);

  // Filter the displayed categories to the active tab's supplier
  const visibleCategories = showTabs && activeSupplier
    ? categories.filter((c) => c.supplier_code === activeSupplier)
    : categories;

  const [margins, setMargins] = useState(() => {
    const initial = {};
    categories.forEach((c) => {
      const existing = Array.isArray(c.margins) ? c.margins[0] : c.margins;
      initial[c.id] = {
        marginType: existing?.margin_type || 'percentage',
        marginValue: existing?.margin_value ?? 20,
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

  // Apply global margin to currently visible categories only
  const handleApplyAll = async () => {
    const targetCats = visibleCategories;
    if (!confirm(`هل أنت متأكد من تطبيق زيادة (${globalValue}${globalType === 'percentage' ? '%' : ' ₪'}) على ${targetCats.length} قسم؟`)) {
      return;
    }
    setSavingGlobal(true);
    try {
      for (const cat of targetCats) {
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
      // Update local state for visible categories
      const updated = { ...margins };
      targetCats.forEach((c) => {
        updated[c.id] = { marginType: globalType, marginValue: globalValue };
      });
      setMargins(updated);
      router.refresh();
      alert('✅ تم تطبيق هامش الأرباح على الأقسام المحددة بنجاح!');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تطبيق الهامش الشامل');
    } finally {
      setSavingGlobal(false);
    }
  };

  return (
    <div>
      {/* ── Supplier Tab Bar (Issue 6 fix) ─────────────────────────────── */}
      {showTabs && (
        <div
          role="tablist"
          aria-label="تصفية حسب المورد"
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '2px solid var(--color-border)',
            paddingBottom: '0',
            overflowX: 'auto',
            flexWrap: 'nowrap',
            scrollbarWidth: 'none',
          }}
        >
          {suppliers.map((code) => {
            const isActive = activeSupplier === code;
            const label = SUPPLIER_LABELS[code] || code;
            const icon = SUPPLIER_ICONS[code] || '🏬';
            const count = categories.filter((c) => c.supplier_code === code).length;
            return (
              <button
                key={code}
                role="tab"
                id={`supplier-tab-${code}`}
                aria-selected={isActive}
                aria-controls={`supplier-panel-${code}`}
                onClick={() => setActiveSupplier(code)}
                style={{
                  padding: '0.6rem 1.25rem',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                  backgroundColor: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
                <span
                  style={{
                    background: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.5rem',
                    minWidth: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Global Apply Box ────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>⚡ تطبيق سريع على الأقسام الظاهرة</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {showTabs
              ? `سيُطبَّق على أقسام "${SUPPLIER_LABELS[activeSupplier] || activeSupplier}" (${visibleCategories.length} قسم)`
              : `حدد نسبة زيادة موحدة وتطبيقها بضغطة زر واحدة (${visibleCategories.length} قسم)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={globalType}
            onChange={(e) => setGlobalType(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '2px solid var(--color-accent)', fontWeight: 700 }}
          >
            <option value="percentage">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (₪)</option>
          </select>
          <input
            type="number"
            value={globalValue}
            onChange={(e) => setGlobalValue(e.target.value)}
            style={{ width: '90px', padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '2px solid var(--color-accent)', textAlign: 'center', fontWeight: 800 }}
          />
          <button
            onClick={handleApplyAll}
            disabled={savingGlobal || visibleCategories.length === 0}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem' }}
          >
            {savingGlobal ? '⏳ جاري التطبيق...' : 'تطبيق على الجميع'}
          </button>
        </div>
      </div>

      {/* ── Categories Table ─────────────────────────────────────────────── */}
      <div
        id={activeSupplier ? `supplier-panel-${activeSupplier}` : undefined}
        role={showTabs ? 'tabpanel' : undefined}
        aria-labelledby={activeSupplier ? `supplier-tab-${activeSupplier}` : undefined}
        style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}
      >
        {visibleCategories.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            لا توجد أقسام لهذا المورد.
          </p>
        ) : (
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
              {visibleCategories.map((cat) => {
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
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-accent)', fontWeight: 700 }}
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
                        style={{ width: '85px', padding: '0.4rem', borderRadius: '6px', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-accent)', textAlign: 'center', fontWeight: 800 }}
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
        )}
      </div>
    </div>
  );
}
