/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Live Breaking News Ticker Component (COMP-GLO-003)
 * Grounded in docs/07-Design.md Section 9.1 and docs/09-Components.md Section 4.3
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { BreakingBulletin } from '../lib/types';

interface BreakingNewsTickerProps {
  bulletins?: BreakingBulletin[];
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({ bulletins = [] }) => {
  // Fallback bulletins for continuous ticker marquee
  const displayBulletins: BreakingBulletin[] =
    bulletins.length > 0
      ? bulletins
      : [
          {
            id: 'b1',
            headline: 'मध्य प्रदेश: 55 जिलों में हाइपरलोकल डिजिटल नेटवर्क का विस्तार, त्वरित समाचार सेवा शुरू',
            slug: 'madhya-pradesh-hyperlocal-network-expansion',
            districtName: 'भोपाल',
            publishedAt: new Date().toISOString(),
          },
          {
            id: 'b2',
            headline: 'निवाड़ी: ओरछा रामराजा सरकार मंदिर में श्रद्धालुओं की भारी भीड़, विशेष सुरक्षा प्रबंध लागू',
            slug: 'niwari-orchha-ramraja-temple-crowd',
            districtName: 'निवाड़ी',
            publishedAt: new Date().toISOString(),
          },
          {
            id: 'b3',
            headline: 'इंदौर: स्वच्छता सर्वेक्षण में शहर ने फिर बनाई बढ़त, नवाचार मॉडल की देशभर में सराहना',
            slug: 'indore-swachhata-survey-lead',
            districtName: 'इंदौर',
            publishedAt: new Date().toISOString(),
          },
        ];

  return (
    <aside
      className="breaking-ticker-ribbon"
      aria-label="लाइव ब्रेकिंग न्यूज़ बुलेटिन"
      role="region"
    >
      <div className="site-container flex items-center w-full px-0">
        {/* Pulsing Yellow Breaking Badge */}
        <div className="breaking-badge">
          <span className="live-pulse-dot" aria-hidden="true" />
          <span>ब्रेकिंग न्यूज़</span>
        </div>

        {/* Smooth Scrolling Headline Stream */}
        <div className="ticker-marquee-wrapper" tabIndex={0} aria-live="polite">
          <div className="ticker-marquee-content">
            {displayBulletins.map((item, idx) => (
              <span key={`${item.id}-${idx}`} className="inline-flex items-center mx-4 text-sm font-semibold">
                {item.districtName && (
                  <span className="text-[#FDE900] mr-2">[{item.districtName}]</span>
                )}
                <Link
                  href={`/news/${item.slug}`}
                  className="hover:underline text-white transition-colors"
                >
                  {item.headline}
                </Link>
                <span className="text-red-300 ml-4 font-normal" aria-hidden="true">
                  ★
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

