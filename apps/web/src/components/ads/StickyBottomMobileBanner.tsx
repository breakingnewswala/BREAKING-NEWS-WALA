'use client';

/**
 * BREAKING NEWS WALA — Mobile Sticky Bottom Ad Banner
 * Grounded in docs/Monetization.md, docs/10-Responsive-Design.md
 * Features permanent ASCI label and a user-friendly dismissal button.
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchPublicAd, recordPublicAdClick, PublicAdResult } from '../../lib/api';

export const StickyBottomMobileBanner: React.FC = () => {
  const [adData, setAdData] = useState<PublicAdResult | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isAdFree, setIsAdFree] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bnw_ad_free_pass');
      if (stored) {
        const pass = JSON.parse(stored);
        if (pass.expiresAt && new Date(pass.expiresAt) > new Date()) {
          setIsAdFree(true);
          return;
        }
      }
    } catch {
      // Ignore
    }

    fetchPublicAd('sticky_bottom_banner').then((res) => {
      setAdData(res);
    });
  }, []);

  if (isDismissed || isAdFree || !adData?.served || !adData.creative) {
    return null;
  }

  const creative = adData.creative;

  return (
    <aside
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-900/95 backdrop-blur border-t border-slate-800 shadow-2xl p-2 animate-in slide-in-from-bottom duration-300"
      aria-label="मोबाइल विज्ञापन बैनर"
    >
      <div className="flex items-center justify-between max-w-sm mx-auto">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-bold uppercase text-rose-400 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800/60">
              {creative.asciLabel || 'विज्ञापन'}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {creative.advertiserName}
            </span>
          </div>
          <a
            href={creative.destinationUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() =>
              recordPublicAdClick({
                creativeId: creative.id,
                adSlotCode: 'sticky_bottom_banner',
              })
            }
            className="block text-xs font-semibold text-white truncate hover:underline"
          >
            {creative.headlineHi || creative.bodyTextHi || 'अधिक जानकारी के लिए यहां क्लिक करें'}
          </a>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="विज्ञापन बंद करें"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
};

