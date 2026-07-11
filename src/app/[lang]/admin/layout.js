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
    let isMounted = true;

    const checkAuth = async () => {
      const isLoginRoute = pathname === '/ar/admin/login' || pathname.includes('/login');

      // 1. Check local session storage first
      const localSessionStr = typeof window !== 'undefined' ? localStorage.getItem('gb_admin_session') : null;
      if (localSessionStr) {
        try {
          const localSession = JSON.parse(localSessionStr);
          const currentStoreId = process.env.NEXT_PUBLIC_STORE_ID || 'eloria';
          if (localSession && localSession.storeId === currentStoreId) {
            if (isMounted) {
              setSession(localSession);
              setLoading(false);
            }
            return;
          } else {
            // Store ID mismatch! Remove local session
            if (typeof window !== 'undefined') localStorage.removeItem('gb_admin_session');
          }
        } catch (e) {
          if (typeof window !== 'undefined') localStorage.removeItem('gb_admin_session');
        }
      }

      // 2. Check server-side verification / cookie
      try {
        const res = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          if (typeof window !== 'undefined') localStorage.setItem('gb_admin_session', JSON.stringify(data.user));
          if (isMounted) {
            setSession(data.user);
            setLoading(false);
          }
          return;
        }
      } catch (err) {}

      // 3. Check Supabase Auth session
      const { data: authData } = await supabase.auth.getSession();
      const supaSession = authData?.session;
      if (supaSession?.user) {
        try {
          const verifyRes = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: supaSession.user.email }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            if (typeof window !== 'undefined') localStorage.setItem('gb_admin_session', JSON.stringify(verifyData.user));
            if (isMounted) {
              setSession(verifyData.user);
              setLoading(false);
            }
            return;
          } else {
            await supabase.auth.signOut();
          }
        } catch (e) {}
      }

      // If no valid session for this store
      if (isMounted) {
        setSession(null);
        setLoading(false);
        if (!isLoginRoute) {
          router.push('/ar/admin/login');
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
    if (typeof window !== 'undefined') localStorage.removeItem('gb_admin_session');
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    await supabase.auth.signOut().catch(() => {});
    setSession(null);
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
