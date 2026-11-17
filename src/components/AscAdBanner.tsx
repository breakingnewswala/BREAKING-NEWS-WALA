import React, { useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';

interface AscAdBannerProps {
  adId?: string;
  creativeUrl?: string;
  isSponsored?: boolean;
  advertiserName?: string;
  headline?: string;
  targetUrl?: string;
  onClick?: () => void;
}

export const AscAdBanner: React.FC<AscAdBannerProps> = ({
  adId,
  creativeUrl = 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
  isSponsored = false,
  advertiserName = 'मप्र हस्तशिल्प एवं हथकरघा विकास निगम (मृगनयनी)',
  headline = 'मध्य प्रदेश का गौरव: चंदेरी व महेश्वरी साड़ियां अब ऑनलाइन विशेष छूट पर',
  targetUrl,
  onClick,
}) => {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!adId || trackedRef.current === adId) return;
    trackedRef.current = adId;
    apiClient.monetization.recordImpression(adId, 100, 1200).catch(() => {});
  }, [adId]);

  const handleClick = () => {
    if (adId) {
      apiClient.monetization.recordClick(adId).catch(() => {});
    }
    if (onClick) onClick();
  };

  const content = (
    <div
      onClick={handleClick}
      className="my-1.5 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-slate-300 transition-colors shadow-2xs"
    >
      {/* ASCI Mandatory Disclosure Header */}
      <div className="bg-slate-200/90 px-3 py-0.5 flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase tracking-wider">
        <span>{isSponsored ? 'प्रायोजित (SPONSORED)' : 'विज्ञापन (ADVERTISEMENT)'}</span>
        {advertiserName && <span className="font-medium text-slate-500 truncate max-w-[200px]">{advertiserName}</span>}
      </div>

      {/* Ad Content */}
      <div className="p-2.5 flex items-center gap-3">
        <img
          src={creativeUrl}
          alt={headline || 'विज्ञापन'}
          className="w-16 h-12 rounded object-cover shrink-0 border border-slate-200"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
            {headline}
          </p>
          <span className="inline-block mt-0.5 text-[11px] font-semibold text-blue-700 hover:underline">
            अभी जानें →
          </span>
        </div>
      </div>
    </div>
  );

  if (targetUrl) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {content}
      </a>
    );
  }

  return content;
};

