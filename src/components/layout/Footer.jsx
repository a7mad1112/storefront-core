import React from 'react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)', marginTop: 'auto', padding: '3rem 0' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <img src="/logo.png" alt="Eloria FASHION" style={{ maxHeight: '42px', width: 'auto', objectFit: 'contain' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px' }}>
            Eloria <span style={{ color: 'var(--color-accent)' }}>FASHION</span>
          </h3>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', fontSize: '0.875rem' }}>
          متجر الموضة والأناقة الفاخرة. شنط ماستر كوالتي، عطور وساعات وماركات عالمية بأسعار مميزة مع خدمة التوصيل السريع لجميع مناطق فلسطين.
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
          © {new Date().getFullYear()} Eloria FASHION. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
