import React from 'react';

interface AscAdBannerProps {
  creativeUrl?: string;
  isSponsored?: boolean;
  advertiserName?: string;
  headline?: string;
  onClick?: () => void;
}

export const AscAdBanner: React.FC<AscAdBannerProps> = ({
  creativeUrl = 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
  isSponsored = false,
  advertiserName = 'मप्र हस्तशिल्प एवं हथकरघा विकास निगम (मृगनयनी)',
  headline = 'मध्य प्रदेश का गौरव: चंदेरी व महेश्वरी साड़ियां अब ऑनलाइन विशेष छूट पर',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="my-3 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-slate-300 transition-colors shadow-2xs"
    >
      {/* ASCI Mandatory Disclosure Header */}
      <div className="bg-slate-200/90 px-3 py-1 flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase tracking-wider">
        <span>{isSponsored ? 'प्रायोजित (SPONSORED)' : 'विज्ञापन (ADVERTISEMENT)'}</span>
        {advertiserName && <span className="font-medium text-slate-500 truncate max-w-[200px]">{advertiserName}</span>}
      </div>

      {/* Ad Content */}
      <div className="p-3 flex items-center gap-3">
        <img
          src={creativeUrl}
          alt="विज्ञापन"
          className="w-20 h-16 rounded object-cover shrink-0 border border-slate-200"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
            {headline}
          </p>
          <span className="inline-block mt-1 text-[11px] font-semibold text-blue-700 hover:underline">
            अभी जानें →
          </span>
        </div>
      </div>
    </div>
  );
};
