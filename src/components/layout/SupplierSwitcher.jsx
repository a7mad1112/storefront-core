'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupplier } from '../../context/SupplierContext';
import { isDepartmentSupported } from '../../lib/supplierConfig';

export default function SupplierSwitcher({ lang = 'ar' }) {
  const { supportedSuppliers, getSupplierName, changeSupplier, hasMultipleSuppliers } = useSupplier();
  const pathname = usePathname();

  if (!hasMultipleSuppliers) {
    return null;
  }

  const isAllActive = !pathname.includes('/supplier/');

  const handleDeptClick = (supplierCode, anchorId) => {
    changeSupplier(supplierCode);
    if (typeof window !== 'undefined' && (pathname === `/${lang}` || pathname === '/')) {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const baseItems = [
    {
      key: 'all',
      href: `/${lang}`,
      onClick: () => changeSupplier('all'),
      isActive: isAllActive,
      icon: '🏠',
      name: lang === 'en' ? 'All Sections' : lang === 'he' ? 'כל המדורים' : 'كل الأقسام',
    },
    {
      key: 'bags-gifts',
      href: pathname === `/${lang}` || pathname === '/' ? `#dept-bags-gifts` : `/${lang}/supplier/bags-gifts`,
      onClick: () => handleDeptClick('bags-gifts', 'dept-bags-gifts'),
      isActive: pathname.includes('/supplier/bags-gifts') || pathname.includes('/supplier/gbstore'),
      icon: '👜',
      name: lang === 'en' ? 'Luxury Bags, Wallets & Gifts' : lang === 'he' ? 'תיקי יוקרה, ארנקים ומתנות' : 'قسم الشنط الفاخرة، الهدايا والمحافظ',
    },
    {
      key: 'perfumes-watches',
      href: pathname === `/${lang}` || pathname === '/' ? `#dept-perfumes-watches` : `/${lang}/supplier/perfumes-watches`,
      onClick: () => handleDeptClick('perfumes-watches', 'dept-perfumes-watches'),
      isActive: pathname.includes('/supplier/perfumes-watches'),
      icon: '🌸',
      name: lang === 'en' ? 'Luxury Perfumes, Watches & Jewelry' : lang === 'he' ? 'בשמי יוקרה, שעונים ותכשיטים' : 'قسم العطور الفاخرة، الساعات والاكسسوارات',
    },
    {
      key: 'shoes',
      href: pathname === `/${lang}` || pathname === '/' ? `#dept-shoes` : `/${lang}/supplier/shoes`,
      onClick: () => handleDeptClick('shoes', 'dept-shoes'),
      isActive: pathname.includes('/supplier/shoes') || pathname.includes('/supplier/balagan'),
      icon: '👟',
      name: lang === 'en' ? 'Footwear, Heels & Sandals' : lang === 'he' ? 'נעליים, עקבים וסנדלים' : 'قسم الأحذية، الكعب، الصنادل والسليبر',
    },
    {
      key: 'apparel-sports',
      href: pathname === `/${lang}` || pathname === '/' ? `#dept-apparel-sports` : `/${lang}/supplier/apparel-sports`,
      onClick: () => handleDeptClick('apparel-sports', 'dept-apparel-sports'),
      isActive: pathname.includes('/supplier/apparel-sports') || pathname.includes('/supplier/sakher'),
      icon: '🏃',
      name: lang === 'en' ? 'Apparel, Suits & Sportswear' : lang === 'he' ? 'אופנה, חליפות ובגדי ספורט' : 'قسم الأزياء، الأطقم والملابس الرياضية',
    },
  ].filter((item) => isDepartmentSupported(item.key));

  // Repeat 4 times to ensure seamless 50% translation loop across all screen widths
  const repeatedItems = [...baseItems, ...baseItems, ...baseItems, ...baseItems];

  return (
    <div className="supplier-marquee-wrapper">
      <div className={`supplier-marquee-track ${lang === 'en' ? 'ltr' : 'rtl'}`}>
        {repeatedItems.map((item, idx) => (
          <Link
            key={`${item.key}-${idx}`}
            href={item.href}
            onClick={item.onClick}
            className={`supplier-pill ${item.isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
