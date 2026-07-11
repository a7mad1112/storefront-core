'use client';

import React, { useState, useEffect } from 'react';

export default function VisitorAnalyticsDashboard() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => { if (active) setLoading(true); }, 0);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((res) => res.json())
      .then((res) => {
        if (active) {
          clearTimeout(timer);
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          clearTimeout(timer);
          console.error('Failed to load analytics', err);
          setLoading(false);
        }
      });
    return () => { active = false; clearTimeout(timer); };
  }, [period]);

  const maxCount = data?.chartData?.reduce((max, d) => Math.max(max, d.count), 0) || 1;

  return (
    <div style={{ marginTop: '3rem', backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📊 إحصائيات الزوار والتصفح</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>تحليل حركات الزوار والصفحات الأكثر مشاهدة في المتجر</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--color-bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          {[
            { id: 'day', label: 'آخر 24 ساعة' },
            { id: 'week', label: 'آخر 7 أيام' },
            { id: 'month', label: 'آخر 30 يوم' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: period === tab.id ? 'var(--color-accent)' : 'transparent',
                color: period === tab.id ? '#fff' : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>جاري تحميل الإحصائيات...</div>
      ) : !data || (data.totalVisits === 0 && data.chartData?.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>لا توجد بيانات زيارات مسجلة لهذه الفترة</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>إجمالي الزيارات (Page Views)</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '0.25rem' }}>{data.totalVisits || 0}</p>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>الزوار الفريدون (Unique Sessions)</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>{data.uniqueSessions || 0}</p>
            </div>
          </div>

          {/* Simple CSS Bar Chart */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>النشاط البياني</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '160px', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
            {data.chartData.map((d, idx) => {
              const heightPct = Math.max(8, Math.round((d.count / maxCount) * 100));
              return (
                <div key={idx} style={{ flexGrow: 1, minWidth: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{d.count}</span>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      backgroundColor: 'var(--color-accent)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      minHeight: '4px',
                    }}
                    title={`${d.label}: ${d.count} زيارة`}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{d.label}</span>
                </div>
              );
            })}
          </div>

          {/* Top Pages */}
          {data.topPages?.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>الصفحات الأكثر زيارة</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.topPages.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, direction: 'ltr', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{p.path}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-accent)' }}>{p.count} زيارة</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
