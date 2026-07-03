'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function AdminLayout({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>⏳ جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  // If on login page or no session, render children directly without sidebar
  if (pathname === '/admin/login' || !session) {
    return <div style={{ minHeight: '80vh' }}>{children}</div>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div className="container" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', padding: '3rem var(--space-4)', minHeight: '85vh' }}>
      {/* Admin Sidebar */}
      <aside style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content' }}>
        <div style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>⚙️ لوحة التحكم</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>إدارة المتجر والأسعار</p>
        </div>

        <Link
          href="/admin"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            backgroundColor: pathname === '/admin' ? 'var(--color-accent)' : 'transparent',
          }}
        >
          📊 الرئيسة والإحصائيات
        </Link>

        <Link
          href="/admin/margins"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            backgroundColor: pathname === '/admin/margins' ? 'var(--color-accent)' : 'transparent',
          }}
        >
          🏷️ هامش الأرباح والأسعار
        </Link>

        <Link
          href="/admin/products"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            backgroundColor: pathname === '/admin/products' ? 'var(--color-accent)' : 'transparent',
          }}
        >
          📦 المنتجات (سعر الجملة)
        </Link>

        <button
          onClick={handleLogout}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            textAlign: 'right',
            fontWeight: 700,
            border: '1px solid rgba(229, 62, 62, 0.2)',
          }}
        >
          🚪 تسجيل الخروج
        </button>
      </aside>

      {/* Main Admin Content */}
      <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', padding: '2rem', border: '1px solid var(--color-border)' }}>
        {children}
      </div>
    </div>
  );
}
