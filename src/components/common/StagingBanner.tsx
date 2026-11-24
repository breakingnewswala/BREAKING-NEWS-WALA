import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, X, GitBranch } from 'lucide-react';

interface StagingBannerProps {
  appEnv?: string;
  onDismiss?: () => void;
}

export const StagingBanner: React.FC<StagingBannerProps> = ({
  appEnv = (import.meta as any).env?.VITE_APP_ENV || 'production',
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // Only display if explicitly in staging environment or on staging/preview hostname
    if (typeof window === 'undefined') return false;
    const isStagingEnv = appEnv === 'staging';
    const isStagingPath = window.location.pathname.startsWith('/testing');
    const isStagingHost = window.location.hostname.includes('staging') ||
                          window.location.hostname.includes('preview');
    return isStagingEnv || isStagingHost || isStagingPath;
  });

  if (!isVisible) return null;

  return (
    <aside
      aria-label="स्टेजिंग वातावरण सूचना"
      className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-3 py-1.5 text-xs font-semibold shadow-md flex items-center justify-between z-50 sticky top-0 border-b border-amber-700/30"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 text-amber-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-slate-950 text-amber-300 shrink-0 flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            STAGING QA
          </span>
          <span className="truncate text-[11px] sm:text-xs text-slate-950 font-medium">
            <strong>स्टेजिंग मोड:</strong> यह प्री-प्रोडक्शन टेस्टिंग पोर्टल (breakingnewswala.com/testing) है। यहाँ सभी नए बदलावों का परीक्षण किया जा रहा है।
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://breakingnewswala.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-950 hover:text-white bg-amber-400 hover:bg-slate-950 px-2.5 py-1 rounded transition-colors"
          >
            लाइव मुख्य साइट
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              if (onDismiss) onDismiss();
            }}
            className="p-1 text-slate-900 hover:text-slate-950 hover:bg-amber-400/80 rounded"
            aria-label="सूचना बंद करें"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
