import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronRight, Zap } from 'lucide-react';
import { BreakingTicker } from '../../types/index.ts';

interface BreakingTickerProps {
  tickers: BreakingTicker[];
  onSelectTickerArticle: (articleId: string) => void;
}

export const BreakingTickerBar: React.FC<BreakingTickerProps> = ({ tickers, onSelectTickerArticle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (tickers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % tickers.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [tickers.length]);

  if (!tickers || tickers.length === 0) return null;

  const currentTicker = tickers[currentIndex];

  return (
    <div className="w-full bg-red-600 text-white shadow-xs overflow-hidden border-b border-red-700">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        {/* Pulsing Badge */}
        <div className="flex items-center gap-1.5 bg-yellow-400 text-red-950 px-2.5 py-0.5 rounded font-black text-xs uppercase tracking-wider shrink-0 shadow-xs">
          <Zap className="w-3.5 h-3.5 fill-red-900 text-red-900 animate-bounce" />
          <span>ब्रेकिंग न्यूज़</span>
        </div>

        {/* Ticker Text Content */}
        <div 
          onClick={() => currentTicker.articleId && onSelectTickerArticle(currentTicker.articleId)}
          className={`flex-1 flex items-center justify-between text-xs sm:text-sm font-semibold truncate transition-opacity duration-300 ${
            currentTicker.articleId ? 'cursor-pointer hover:underline' : ''
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {currentTicker.priority === 'critical' && (
              <span className="bg-white text-red-700 text-[10px] px-1.5 py-0.2 rounded font-black">
                अति महत्वपूर्ण
              </span>
            )}
            <span className="truncate">{currentTicker.textHindi}</span>
          </div>

          {currentTicker.articleId && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-yellow-200 shrink-0 ml-3">
              पढ़ें <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Pagination Dots */}
        {tickers.length > 1 && (
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {tickers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-yellow-300 w-3' : 'bg-red-400 opacity-60'
                }`}
                title={`खबर ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
