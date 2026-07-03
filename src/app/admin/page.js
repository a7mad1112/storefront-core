import React from 'react';
import { getDashboardCounts, getSyncLogs } from '../../lib/queries';

export const revalidate = 0; // Always fresh in admin panel

export default async function AdminDashboardPage() {
  const [counts, logs] = await Promise.all([
    getDashboardCounts(),
    getSyncLogs({ limit: 5 }),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>نظرة عامة على النظام</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>إحصائيات قاعدة البيانات وحالة المزامنة التلقائية مع المورد</p>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>إجمالي المنتجات الفعالة</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '0.5rem' }}>{counts.products}</p>
        </div>

        <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>إجمالي الفئات والأقسام</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.5rem' }}>{counts.categories}</p>
        </div>
      </div>

      {/* Sync History Table */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>سجل عمليات الجلب (Scraper Runs)</h2>
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>وقت البدء</th>
              <th style={{ padding: '1rem' }}>الحالة</th>
              <th style={{ padding: '1rem' }}>مُضاف</th>
              <th style={{ padding: '1rem' }}>مُحدث</th>
              <th style={{ padding: '1rem' }}>محذوف</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>لا توجد سجلات مزامنة حتى الآن</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem' }}>{new Date(log.started_at).toLocaleString('ar-PS')}</td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: log.status === 'success' ? 'rgba(56, 161, 105, 0.2)' : 'rgba(229, 62, 62, 0.2)',
                        color: log.status === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                    >
                      {log.status === 'success' ? 'ناجح' : log.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-success)' }}>+{log.products_added}</td>
                  <td style={{ padding: '1rem' }}>~{log.products_updated}</td>
                  <td style={{ padding: '1rem', color: 'var(--color-error)' }}>-{log.products_deleted}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
