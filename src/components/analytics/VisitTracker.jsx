'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('gb_anon_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('gb_anon_session_id', sid);
  }
  return sid;
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.includes('/admin') || pathname.startsWith('/api')) return;

    const sid = getSessionId();
    if (!sid) return;

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        page_path: pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      }),
    }).catch((e) => {
      // Silently ignore reporting errors
      console.debug('Analytics beacon error', e);
    });
  }, [pathname]);

  return null;
}
