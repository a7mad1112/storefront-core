import React from 'react';
import { getDashboardCounts, getSyncLogs } from '../../../lib/queries';
import VisitorAnalyticsDashboard from '../../../components/admin/VisitorAnalyticsDashboard';

export const revalidate = 0; // Always fresh in admin panel

export default async function AdminDashboardPage() {
  let counts = { products: 0, categories: 0, brands: 0, supplierCounts: {} };
  let logs = [];

  try {
    const [countsRes, logsRes] = await Promise.all([
      getDashboardCounts(),
      getSyncLogs({ limit: 5 }),
    ]);
    if (countsRes) counts = countsRes;
    if (logsRes && Array.isArray(logsRes)) logs = logsRes;
  } catch (err) {
    console.error('[AdminDashboardPage] error loading dashboard data:', err);
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>نظرة عامة على النظام</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>إحصائيات قاعدة البيانات وحالة المزامنة التلقائية مع المورد</p>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>إجمالي المنتجات الفعالة</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '0.5rem' }}>{counts.products}</p>
        </div>

        <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>إجمالي الفئات والأقسام</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.5rem' }}>{counts.categories}</p>
        </div>
      </div>

      {/* Supplier Products Breakdown */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        🏬 إحصائيات المنتجات حسب المورد (Suppliers Breakdown)
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {Object.entries(counts.supplierCounts || {}).map(([code, count]) => {
          const meta = {
            gbstore: { label: 'GBSTORE (الشنط، الهدايا والعطور)', icon: '🎁', color: '#c59850' },
            balagan: { label: 'BALAGAN (الأحذية والسليبر)', icon: '👟', color: '#2563eb' },
            sakher: { label: 'SAKHER (الملابس الرياضية)', icon: '🏃', color: '#059669' },
            other: { label: 'مورد آخر / متنوع', icon: '📦', color: '#64748b' },
          }[code] || { label: `المورد: ${code.toUpperCase()}`, icon: '🏬', color: 'var(--color-accent)' };

          const percentage = counts.products > 0 ? Math.round((count / counts.products) * 100) : 0;

          return (
            <div
              key={code}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.5rem' }}>{meta.label}</h3>
                </div>
                <span style={{ backgroundColor: `${meta.color}20`, color: meta.color, padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, border: `1px solid ${meta.color}50` }}>
                  {percentage}% من المتجر
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: meta.color }}>{count}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>منتج فعال</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visitor Analytics Dashboard */}
      <VisitorAnalyticsDashboard />

      {/* Sync History Table */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', marginTop: '3rem' }}>سجل عمليات الجلب (Scraper Runs)</h2>
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
