'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

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
      if (!session && pathname !== '/ar/admin/login' && !pathname.includes('/login')) {
        router.push('/ar/admin/login');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (!session && pathname !== '/ar/admin/login' && !pathname.includes('/login')) {
        router.push('/ar/admin/login');
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
  if (pathname.includes('/login') || !session) {
    return <div style={{ minHeight: '80vh' }}>{children}</div>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/ar/admin/login');
  };

  return (
    <div className="container admin-layout-grid">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>⚙️ لوحة التحكم</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>إدارة المتجر والأسعار</p>
        </div>

        <Link
          href="/ar/admin"
          className="admin-nav-link"
          style={{
            backgroundColor: pathname === '/ar/admin' ? 'var(--color-accent)' : 'transparent',
          }}
        >
          📊 الرئيسة والإحصائيات
        </Link>

        <Link
          href="/ar/admin/margins"
          className="admin-nav-link"
          style={{
            backgroundColor: pathname === '/ar/admin/margins' ? 'var(--color-accent)' : 'transparent',
          }}
        >
          🏷️ هامش الأرباح والأسعار
        </Link>

        <Link
          href="/ar/admin/products"
          className="admin-nav-link"
          style={{
            backgroundColor: pathname === '/ar/admin/products' ? 'var(--color-accent)' : 'transparent',
          }}
        >
          📦 المنتجات (سعر الجملة)
        </Link>

        <button
          onClick={handleLogout}
          className="admin-nav-link"
          style={{
            color: 'var(--color-error)',
            border: '1px solid rgba(229, 62, 62, 0.2)',
          }}
        >
          🚪 تسجيل الخروج
        </button>
      </aside>

      {/* Main Admin Content */}
      <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', border: '1px solid var(--color-border)', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
