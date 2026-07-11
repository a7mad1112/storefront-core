'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'خطأ في تسجيل الدخول: تأكد من البريد الإلكتروني وكلمة المرور');
        setLoading(false);
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('gb_admin_session', JSON.stringify(data.user));
        }
        router.push('/ar/admin');
      }
    } catch (err) {
      setErrorMsg('حدث خطأ بالاتصال، يرجى المحاولة مرة أخرى');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '4rem auto', backgroundColor: 'var(--color-bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>تسجيل دخول الإدارة</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>أدخل بيانات حساب مسؤول المتجر للمتابعة</p>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(229, 62, 62, 0.15)', color: 'var(--color-error)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>البريد الإلكتروني:</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            placeholder="admin@gbstore.ps"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>كلمة المرور:</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '0.875rem', fontSize: '1rem', marginTop: '0.5rem' }}
        >
          {loading ? '⏳ جاري الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>
    </div>
  );
}
