import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  labelHindi: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  // Construct schema.org BreadcrumbList JSON-LD
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://breakingnewswala.in';
  const breadcrumbListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'होम',
        item: siteUrl,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.labelHindi,
        ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd) }}
      />

      <nav aria-label="ब्रेडक्रम्ब्स" className={`text-xs text-gray-500 py-2 ${className}`}>
        <ol className="flex items-center flex-wrap gap-1.5 list-none p-0 m-0">
          <li className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-1 text-gray-600 hover:text-[#ED1727] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="sr-only">होम</span>
            </Link>
          </li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" aria-hidden="true" />
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-[#ED1727] transition-colors max-w-[150px] sm:max-w-xs truncate"
                  >
                    {item.labelHindi}
                  </Link>
                ) : (
                  <span
                    className="text-gray-900 font-semibold max-w-[180px] sm:max-w-md truncate"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.labelHindi}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;

