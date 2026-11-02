/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Primary Category Navigation Bar (COMP-GLO-004)
 * Grounded in docs/01-PRD.md Section 12.1 and docs/08-Sitemap.md Section 5.1
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CANONICAL_CATEGORIES } from '../lib/constants';

interface PrimaryCategoryNavbarProps {
  categories?: Array<{ id: string; nameHi: string; slug: string }>;
}

export const PrimaryCategoryNavbar: React.FC<PrimaryCategoryNavbarProps> = ({
  categories = CANONICAL_CATEGORIES,
}) => {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <nav
      className="category-navbar-sticky"
      role="navigation"
      aria-label="मुख्य श्रेणियां"
    >
      <div className="site-container flex items-center justify-between">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="lg:hidden p-2 text-gray-700 hover:text-[#ED1727] flex items-center gap-1 font-semibold text-sm"
          aria-expanded={mobileDrawerOpen}
          aria-label="सभी श्रेणियां खोलें"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>मेन्यू</span>
        </button>

        {/* Horizontal Scrollable Categories List */}
        <div className="category-nav-scroll flex-1">
          {/* Home Link */}
          <Link
            href="/"
            className={`category-nav-pill ${pathname === '/' ? 'active' : ''}`}
          >
            होम
          </Link>

          {categories.map((cat) => {
            const href = `/category/${cat.slug}`;
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={cat.id}
                href={href}
                className={`category-nav-pill ${isActive ? 'active' : ''}`}
              >
                {cat.nameHi}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Off-Canvas Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white py-4 px-4 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b mb-3">
            <span className="font-bold text-gray-900 text-sm">सभी 21 श्रेणियां</span>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="text-gray-500 hover:text-black p-1 text-sm font-semibold"
            >
              ✕ बंद करें
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={() => setMobileDrawerOpen(false)}
                className="py-2 px-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-[#ED1727] rounded transition-colors"
              >
                {cat.nameHi}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

