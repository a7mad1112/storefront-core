'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '../../../../lib/utils';
import AvailabilityToggle from '../../../../components/admin/AvailabilityToggle';

const SUPPLIER_OPTIONS = [
  { code: 'all', label: '🏬 جميع الموردين والأقسام' },
  { code: 'gbstore', label: '🎁 الشنط، الهدايا والعطور (GBSTORE)' },
  { code: 'balagan', label: '👟 الأحذية والسليبر (BALAGAN)' },
  { code: 'sakher', label: '🏃 الملابس والأحذية الرياضية (SAKHER)' },
];

export default function AdminProductsClient({ products, totalCount, pageNum, limit, initialSupplier, initialSearch, overrides }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [supplierFilter, setSupplierFilter] = useState(initialSupplier || 'all');

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const applyFilters = (newSupplier, newSearch, newPage = 1) => {
    const params = new URLSearchParams(searchParams);
    if (newSupplier && newSupplier !== 'all') {
      params.set('supplier', newSupplier);
    } else {
      params.delete('supplier');
    }

    if (newSearch && newSearch.trim()) {
      params.set('search', newSearch.trim());
    } else {
      params.delete('search');
    }

    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }

    router.push(`?${params.toString()}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters(supplierFilter, searchQuery, 1);
  };

  const handleSupplierChange = (e) => {
    const code = e.target.value;
    setSupplierFilter(code);
    applyFilters(code, searchQuery, 1);
  };

  const getSupplierBadge = (code) => {
    switch (code) {
      case 'gbstore':
        return <span style={{ backgroundColor: 'rgba(197, 152, 80, 0.15)', color: '#c59850', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>🎁 شنط وعطور</span>;
      case 'balagan':
        return <span style={{ backgroundColor: 'rgba(46, 125, 50, 0.15)', color: '#2e7d32', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>👟 أحذية وسليبر</span>;
      case 'sakher':
        return <span style={{ backgroundColor: 'rgba(30, 136, 229, 0.15)', color: '#1e88e5', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>🏃 ملابس رياضية</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Top Filter and Search Bar */}
      <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="🔍 بحث باسم المنتج أو رمز المورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-accent)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.875rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontWeight: 700 }}>
            بحث
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>تصفية حسب المورد:</span>
          <select
            value={supplierFilter}
            onChange={handleSupplierChange}
            style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-accent)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            {SUPPLIER_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Summary & Pagination Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem', padding: '0 0.25rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
          📦 إجمالي المنتجات المعروضة: <span style={{ color: 'var(--color-accent)' }}>{totalCount}</span> منتج (صفحة {pageNum} من {totalPages})
        </div>

        {/* Pagination Buttons Top */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => applyFilters(supplierFilter, searchQuery, pageNum - 1)}
            disabled={pageNum <= 1}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 1rem', opacity: pageNum <= 1 ? 0.5 : 1, cursor: pageNum <= 1 ? 'not-allowed' : 'pointer' }}
          >
            ◀ الصفحة السابقة
          </button>
          <button
            onClick={() => applyFilters(supplierFilter, searchQuery, pageNum + 1)}
            disabled={pageNum >= totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 1rem', opacity: pageNum >= totalPages ? 0.5 : 1, cursor: pageNum >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            الصفحة التالية ▶
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '1rem', width: '70px' }}>صورة</th>
              <th style={{ padding: '1rem' }}>اسم المنتج والمورد</th>
              <th style={{ padding: '1rem' }}>سعر الجملة (المورد)</th>
              <th style={{ padding: '1rem' }}>سعر البيع للجمهور</th>
              <th style={{ padding: '1rem' }}>مقدار الربح</th>
              <th style={{ padding: '1rem' }}>الكمية</th>
              <th style={{ padding: '1rem' }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>
                  لا توجد منتجات مطابقة للبحث أو التصفية الحالية.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const wholesale = Number(p.wholesale_price) || 0;
                const retail = Number(p.retail_price) || 0;
                const profit = retail - wholesale;
                const profitPercentage = wholesale > 0 ? Math.round((profit / wholesale) * 100) : 0;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <img src={p.image_url || '/placeholder.webp'} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '6px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }} />
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, maxWidth: '280px' }}>
                      <div style={{ marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {getSupplierBadge(p.supplier_code)}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-warning)', fontWeight: 800, fontSize: '0.95rem' }}>
                      {formatPrice(wholesale)}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-success)', fontWeight: 800, fontSize: '1rem' }}>
                      {formatPrice(retail)}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 800 }}>
                      <span style={{ color: profit >= 0 ? 'var(--color-accent)' : '#c62828', backgroundColor: 'rgba(197, 152, 80, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {profit >= 0 ? `+${formatPrice(profit)}` : formatPrice(profit)} ({profitPercentage}%)
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                      {p.quantity ?? 'غير محدد'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <AvailabilityToggle
                        productSupplierId={p.supplier_id}
                        supplierAvailable={p.is_available}
                        initialOverride={overrides[p.supplier_id] || null}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            صفحة {pageNum} من {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => applyFilters(supplierFilter, searchQuery, pageNum - 1)}
              disabled={pageNum <= 1}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1.25rem', opacity: pageNum <= 1 ? 0.5 : 1, cursor: pageNum <= 1 ? 'not-allowed' : 'pointer', fontWeight: 700 }}
            >
              ◀ الصفحة السابقة
            </button>
            <button
              onClick={() => applyFilters(supplierFilter, searchQuery, pageNum + 1)}
              disabled={pageNum >= totalPages}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1.25rem', opacity: pageNum >= totalPages ? 0.5 : 1, cursor: pageNum >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 700 }}
            >
              الصفحة التالية ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
