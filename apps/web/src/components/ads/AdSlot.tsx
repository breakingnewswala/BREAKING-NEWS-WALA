'use client';

/**
 * BREAKING NEWS WALA — Responsive Ad Slot Component
 * Grounded in docs/Monetization.md, docs/06-Business-Rules.md (RULE-AD-001 to RULE-AD-005)
 * Complies with ASCI guidelines, MRC viewability standards, and CLS stability.
 */

import React, { useState, useEffect, useRef } from 'react';
import { fetchPublicAd, recordPublicAdImpression, recordPublicAdClick, PublicAdResult } from '../../lib/api';

interface AdSlotProps {
  slotCode: string;
  districtId?: string;
  className?: string;
  reserveHeight?: number;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slotCode,
  districtId,
  className = '',
  reserveHeight,
}) => {
  const [adData, setAdData] = useState<PublicAdResult | null>(null);
  const [isAdFree, setIsAdFree] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const slotRef = useRef<HTMLDivElement>(null);
  const impressionRecordedRef = useRef<boolean>(false);
  const viewStartTimeRef = useRef<number | null>(null);

  // Check reader entitlement for ad-free experience (DEC-070 / Coin Perks)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bnw_ad_free_pass');
      if (stored) {
        const pass = JSON.parse(stored);
        if (pass.expiresAt && new Date(pass.expiresAt) > new Date()) {
          setIsAdFree(true);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Load candidate ad from server
    let mounted = true;
    fetchPublicAd(slotCode, districtId)
      .then((res) => {
        if (mounted) {
          setAdData(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slotCode, districtId]);

  // Viewable Impression Tracking (MRC Standard: >= 50% in viewport for >= 1000ms)
  useEffect(() => {
    if (!adData?.served || !adData.creative || impressionRecordedRef.current) return;

    const el = slotRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Viewport >= 50% visible, start timer for 1000ms
            if (!viewStartTimeRef.current) {
              viewStartTimeRef.current = Date.now();
            }
            if (!timer && !impressionRecordedRef.current) {
              timer = setTimeout(() => {
                if (adData.creative && !impressionRecordedRef.current) {
                  impressionRecordedRef.current = true;
                  recordPublicAdImpression({
                    creativeId: adData.creative.id,
                    adSlotCode: slotCode,
                    viewDurationMs: Date.now() - (viewStartTimeRef.current || Date.now()),
                    viewPercentage: Math.round(entry.intersectionRatio * 100),
                  });
                }
              }, 1000);
            }
          } else {
            // Fell below 50% visibility, reset timer
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            viewStartTimeRef.current = null;
          }
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(el);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [adData, slotCode]);

  const handleAdClick = () => {
    if (!adData?.creative) return;
    recordPublicAdClick({
      creativeId: adData.creative.id,
      adSlotCode: slotCode,
    });
  };

  // If user has active ad-free reading pass, cleanly suppress the slot
  if (isAdFree) {
    return null;
  }

  // If ad fetch returned nothing or served: false, collapse without CLS impact
  if (!isLoading && (!adData || !adData.served || !adData.creative)) {
    return null;
  }

  const creative = adData?.creative;

  return (
    <aside
      ref={slotRef}
      className={`relative mx-auto my-4 transition-all duration-300 rounded-lg overflow-hidden ${className}`}
      style={{
        minHeight: reserveHeight ? `${reserveHeight}px` : undefined,
      }}
      aria-label="प्रायोजित विज्ञापन"
    >
      {/* Permanent ASCI Disclosure Badge */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900/90 text-[10px] text-slate-400 border-b border-slate-800">
        <span className="font-bold tracking-wider uppercase text-rose-400">
          {creative?.asciLabel || 'विज्ञापन'}
        </span>
        <span className="text-[9px] text-slate-500 font-sans">
          {creative?.advertiserName || 'पार्टनर संदेश'}
        </span>
      </div>

      {creative ? (
        <a
          href={creative.destinationUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleAdClick}
          className="block bg-slate-950 hover:opacity-95 transition p-3.5 border border-slate-800 rounded-b-lg group"
        >
          {creative.headlineHi && (
            <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition leading-snug">
              {creative.headlineHi}
            </h4>
          )}
          {creative.bodyTextHi && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed font-sans">
              {creative.bodyTextHi}
            </p>
          )}
          {creative.mediaUrl && (
            <div className="mt-2.5 overflow-hidden rounded">
              <img
                src={creative.mediaUrl}
                alt={creative.headlineHi || 'विज्ञापन'}
                className="w-full h-auto object-cover max-h-48 group-hover:scale-[1.01] transition duration-300"
                loading="lazy"
              />
            </div>
          )}
        </a>
      ) : (
        <div className="h-20 bg-slate-900/30 animate-pulse rounded-b-lg" />
      )}
    </aside>
  );
};

