import React from 'react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)', marginTop: 'auto', padding: '3rem 0' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
          <span style={{ color: 'var(--color-accent)' }}>GB</span> Store
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', fontSize: '0.875rem' }}>
          متجر الهدايا والاكسسوارات الفاخرة بأسعار مميزة. شنط ماستر كوالتي، عطور أصلية وماركات عالمية مع خدمة التوصيل السريع لجميع مناطق الضفة والقدس والداخل.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          <a href="https://wa.me/972595809023" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700 }}>
            💬 تواصل عبر واتساب
          </a>
          <a href="/admin/login" style={{ color: 'var(--color-text-muted)' }}>
            ⚙️ لوحة الإدارة
          </a>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          © {new Date().getFullYear()} GB Store. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
