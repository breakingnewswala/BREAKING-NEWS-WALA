import React from 'react';
import { Volume2, ChevronRight } from 'lucide-react';

interface BreakingNewsTickerProps {
  headline: string;
  districtName?: string;
  onClick?: () => void;
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
  headline,
  districtName,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-red-50 border-y border-red-200 px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-red-100/70 transition-colors"
      role="alert"
    >
      {/* Pulsing Badge */}
      <span className="shrink-0 bg-[#ED1727] text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
        <Volume2 className="w-3 h-3 animate-pulse" />
        ब्रेकिंग
      </span>

      {/* District Name if present */}
      {districtName && (
        <span className="shrink-0 font-bold text-xs text-[#ED1727] bg-white border border-red-200 px-1.5 py-0.5 rounded">
          {districtName}
        </span>
      )}

      {/* Headline Marquee/Overflow */}
      <p className="text-xs md:text-sm font-semibold text-slate-800 truncate flex-1 leading-normal">
        {headline}
      </p>

      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
    </div>
  );
};
