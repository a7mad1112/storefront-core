'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin availability override toggle component.
 * Allows switching between:
 * 1. Supplier Auto (revert override)
 * 2. Force Available (override = true)
 * 3. Force Unavailable (override = false)
 */
export default function AvailabilityToggle({ productSupplierId, supplierAvailable, initialOverride }) {
  const [override, setOverride] = useState(initialOverride); // null | { is_available: boolean }
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const currentStatus = override != null ? override.is_available : supplierAvailable;

  const handleUpdate = async (mode) => {
    setLoading(true);
    try {
      const payload = { productSupplierId };
      if (mode === 'auto') {
        payload.action = 'revert';
      } else {
        payload.isAvailable = mode === 'available';
      }

      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('فشل التحديث');
      }

      if (mode === 'auto') {
        setOverride(null);
      } else {
        setOverride({ is_available: mode === 'available' });
      }
      router.refresh();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء تحديث حالة التوفر');
    } finally {
      setLoading(false);
    }
  };

  const isAuto = override == null;
  const isForceAvailable = override != null && override.is_available === true;
  const isForceUnavailable = override != null && override.is_available === false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
      {/* Current Status Badge */}
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: currentStatus ? 'rgba(56, 161, 105, 0.15)' : 'rgba(229, 62, 62, 0.15)',
          color: currentStatus ? 'var(--color-success)' : 'var(--color-error)',
        }}
      >
        {currentStatus ? '✔ متوفر' : '✖ غير متوفر'}
        {override != null && ' (تعديل يدوي)'}
      </span>

      {/* Override Control Buttons */}
      <div style={{ display: 'flex', gap: '4px', opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        <button
          onClick={() => handleUpdate('auto')}
          title="اعتماد حالة المورد التلقائية"
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--color-border)',
            backgroundColor: isAuto ? 'var(--color-bg-elevated)' : 'var(--color-bg-secondary)',
            color: isAuto ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          تلقائي ({supplierAvailable ? 'متوفر' : 'نفد'})
        </button>

        <button
          onClick={() => handleUpdate('available')}
          title="فرض التوفر دائماً"
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--color-border)',
            backgroundColor: isForceAvailable ? 'rgba(56, 161, 105, 0.2)' : 'var(--color-bg-secondary)',
            color: isForceAvailable ? 'var(--color-success)' : 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          ✔ فرض توفر
        </button>

        <button
          onClick={() => handleUpdate('unavailable')}
          title="فرض عدم التوفر دائماً"
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--color-border)',
            backgroundColor: isForceUnavailable ? 'rgba(229, 62, 62, 0.2)' : 'var(--color-bg-secondary)',
            color: isForceUnavailable ? 'var(--color-error)' : 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          ✖ فرض إخفاء
        </button>
      </div>
    </div>
  );
}
