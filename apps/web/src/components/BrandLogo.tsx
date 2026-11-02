/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Brand Logo Component (COMP-GLO-001)
 * Grounded in docs/07-Design.md Section 3.3 and docs/09-Components.md Section 4.1
 */

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'desktop-masthead' | 'mobile-header' | 'footer-emblem';
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'desktop-masthead',
  showTagline = true,
  className = '',
}) => {
  const isMobile = variant === 'mobile-header';
  const isFooter = variant === 'footer-emblem';

  const logoHeight = isMobile ? 38 : isFooter ? 44 : 52;

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#344FD6] rounded p-1 ${className}`}
      aria-label="ब्रेकिंग न्यूज़ वाला - मुख्य पृष्ठ"
    >
      {/* Official Registered Logo Graphic */}
      <img
        src="/brand/logo.png"
        alt="ब्रेकिंग न्यूज़ वाला - आधिकारिक लोगो"
        width={isMobile ? 120 : 160}
        height={logoHeight}
        className="object-contain"
        style={{ height: `${logoHeight}px`, width: 'auto' }}
        fetchPriority="high"
      />

      {showTagline && !isMobile && (
        <div className="hidden md:flex flex-col border-l border-gray-300 pl-3">
          <span className="text-xs font-bold text-[#ED1727] tracking-wide">
            मध्य प्रदेश का नंबर-1 न्यूज़ नेटवर्क
          </span>
          <span className="text-[11px] text-gray-600 font-medium">
            भारत के जिलों से, आपके दिलों तक
          </span>
        </div>
      )}
    </Link>
  );
};

