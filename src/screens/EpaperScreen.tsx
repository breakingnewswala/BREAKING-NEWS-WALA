/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Public E-Paper Screen (Step 11 — F19 & F20)
 * 
 * Orchestrates the public-facing E-Paper surface:
 * 1. Public E-Paper Homepage (`EpaperPublicHomepage`):
 *    - Latest published Daily Edition hero with cover preview and "अख़बार पढ़ें" primary CTA.
 *    - Recently published daily editions across Madhya Pradesh districts.
 *    - Dedicated Special Editions (विशेषांक) section with custom page counts.
 *    - District/division filter.
 * 2. Digital Newspaper Reader (`EpaperPublicReader`):
 *    - Broadsheet aspect ratio (32.9 cm x 52.0 cm) HTML5 canvas rendering via GraphicRenderer.
 *    - Snapshot-backed immutable page loading (zero draft / unpublished leakage).
 *    - Desktop keyboard shortcuts (ArrowLeft/Right, +, -, 0, f/Esc), mobile touch-swipe gestures.
 *    - 12-page thumbnail strip, zoom & pan (10% to 200%), fit-to-screen.
 *    - Reading Mode modal with Devanagari typography, font scaling, Hindi TTS narration.
 *    - 4:5 social clipping generator with BNW masthead, download PDF (300 DPI), PNG, web share.
 * 3. Digital Archive (`EpaperDigitalArchive`):
 *    - Historical edition browsing: Year-wise, Month-wise, Date-wise.
 *    - Filter by Daily vs Special edition, district, and search query.
 *    - Paginated grid with cover previews and quick reader actions.
 * 
 * Strictly maintains read-only access for readers and preserves published snapshot immutability.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Archive,
  Home,
  ChevronLeft,
  FileText,
  Sparkles,
  Layers,
} from 'lucide-react';
import { EpaperEdition } from '../types';
import { EpaperPublicHomepage } from '../components/epaper/public/EpaperPublicHomepage';
import { EpaperPublicReader } from '../components/epaper/public/EpaperPublicReader';
import { EpaperDigitalArchive } from '../components/epaper/public/EpaperDigitalArchive';
import { PublicReaderEngine } from '../server/epaper/publicReader.js';

export { PublicReaderEngine };

export type EpaperViewMode = 'homepage' | 'reader' | 'archive';

export interface EpaperScreenProps {
  editions?: EpaperEdition[];
  initialEditionId?: string;
  initialPageNumber?: number;
  initialView?: EpaperViewMode;
  onBackClick?: () => void;
}

export const EpaperScreen: React.FC<EpaperScreenProps> = ({
  editions,
  initialEditionId,
  initialPageNumber = 1,
  initialView,
  onBackClick,
}) => {
  // Determine initial view from props or URL query parameters
  const [currentView, setCurrentView] = useState<EpaperViewMode>(() => {
    if (initialView) return initialView;
    if (initialEditionId) return 'reader';
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'reader' || viewParam === 'archive' || viewParam === 'homepage') {
        return viewParam as EpaperViewMode;
      }
      if (params.get('editionId')) {
        return 'reader';
      }
    }
    return 'homepage';
  });

  const [selectedEditionId, setSelectedEditionId] = useState<string>(() => {
    if (initialEditionId) return initialEditionId;
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const qId = params.get('editionId');
      if (qId) return qId;
    }
    return editions && editions.length > 0 ? editions[0].id : '';
  });

  const [selectedPageNumber, setSelectedPageNumber] = useState<number>(() => {
    if (initialPageNumber) return initialPageNumber;
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const qPage = params.get('page');
      if (qPage) {
        const parsed = parseInt(qPage, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return 1;
  });

  // Keep URL search query in sync if supported (non-disruptive)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history && window.location) {
      try {
        const url = new URL(window.location.href);
        if (currentView === 'homepage') {
          url.searchParams.delete('editionId');
          url.searchParams.delete('page');
          url.searchParams.delete('view');
        } else if (currentView === 'reader') {
          if (selectedEditionId) url.searchParams.set('editionId', selectedEditionId);
          if (selectedPageNumber > 1) url.searchParams.set('page', String(selectedPageNumber));
          url.searchParams.set('view', 'reader');
        } else if (currentView === 'archive') {
          url.searchParams.set('view', 'archive');
          url.searchParams.delete('editionId');
          url.searchParams.delete('page');
        }
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Ignored in non-browser or sandboxed environments
      }
    }
  }, [currentView, selectedEditionId, selectedPageNumber]);

  // Handler to open reader for a specific edition
  const handleOpenReader = (editionId: string, pageNumber: number = 1) => {
    setSelectedEditionId(editionId);
    setSelectedPageNumber(pageNumber);
    setCurrentView('reader');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handler to open archive view
  const handleOpenArchive = () => {
    setCurrentView('archive');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handler for back button from reader or archive
  const handleBackToHomepage = () => {
    setCurrentView('homepage');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Brand & Title */}
          <div className="flex items-center gap-3">
            {onBackClick && (
              <button
                onClick={onBackClick}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="मुख्य पोर्टल पर वापस जाएं"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#ED1727] flex items-center justify-center text-white font-black text-sm shadow-xs">
                BNW
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  ब्रेकिंग न्यूज़ वाला
                  <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                    ई-पेपर
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  मध्य प्रदेश का सर्वाधिक विश्वसनीय दैनिक डिजिटल अख़बार
                </p>
              </div>
            </div>
          </div>

          {/* Right: View Switcher Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleBackToHomepage}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'homepage'
                  ? 'bg-red-50 text-[#ED1727] border border-red-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>मुख्य पृष्ठ</span>
            </button>

            {selectedEditionId && (
              <button
                onClick={() => setCurrentView('reader')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentView === 'reader'
                    ? 'bg-blue-50 text-[#344FD6] border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>अख़बार वाचक</span>
              </button>
            )}

            <button
              onClick={handleOpenArchive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'archive'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>डिजिटल आर्काइव</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1">
        {currentView === 'homepage' && (
          <EpaperPublicHomepage
            onOpenReader={handleOpenReader}
            onOpenArchive={handleOpenArchive}
          />
        )}

        {currentView === 'reader' && (
          <div className="relative">
            {selectedEditionId ? (
              <EpaperPublicReader
                editionId={selectedEditionId}
                initialPageNumber={selectedPageNumber}
                onBackClick={handleBackToHomepage}
              />
            ) : (
              <div className="py-20 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">कोई ई-पेपर संस्करण चयनित नहीं है</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  कृपया मुख्य पृष्ठ अथवा आर्काइव से पढ़ने हेतु संस्करण का चयन करें।
                </p>
                <button
                  onClick={handleBackToHomepage}
                  className="px-4 py-2 bg-[#ED1727] text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-xs"
                >
                  मुख्य पृष्ठ पर जाएं
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'archive' && (
          <EpaperDigitalArchive
            onOpenReader={handleOpenReader}
            onBackClick={handleBackToHomepage}
          />
        )}
      </main>
    </div>
  );
};

export default EpaperScreen;
