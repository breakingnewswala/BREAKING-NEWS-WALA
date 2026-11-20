/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Digital Newspaper Reader (Step 11 — F19 & F20)
 * 
 * Implements:
 * 1. Broadsheet Canvas Rendering (32.9 cm x 52.0 cm, 932.6 pt x 1474.0 pt, ~1:1.58 aspect ratio)
 * 2. Immutable Snapshot-backed Page Loading (Zero Draft Leakage)
 * 3. Page Navigation (Side buttons, Bottom bar, Keyboard Left/Right, Mobile Touch Swipe)
 * 4. Zoom & Pan (10% to 200%, Fit-to-screen, Reset, Mouse dragging)
 * 5. Fullscreen Toggle Mode
 * 6. 12-Page Thumbnail Strip & Quick Selector
 * 7. Clickable Story Overlays triggering Devanagari Reading Mode Modal
 * 8. 4:5 Social Clipping Generator with BNW Masthead
 * 9. Reader Actions: PDF Download (300 DPI), Page PNG Download, Web Share, Print
 * 10. Daily Edition (exactly 12 pages) & Special Edition (published page count)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  Printer,
  RotateCcw,
  Scissors,
  Share2,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
  Sparkles,
  History,
} from 'lucide-react';
import { EpaperEditionDoc, EpaperPageDoc, EpaperPageElement } from '../../../types';
import { GraphicRenderer, DevanagariTypographyEngine, BROADSHEET_CONSTANTS } from '../../../services/graphicRenderer';
import { PublicReaderEngine } from '../../../server/epaper/publicReader.js';
import { apiClient } from '../../../services/apiClient';

interface EpaperPublicReaderProps {
  editionId: string;
  initialPageNumber?: number;
  initialVersion?: number;
  onBackClick: () => void;
}

export const EpaperPublicReader: React.FC<EpaperPublicReaderProps> = ({
  editionId,
  initialPageNumber = 1,
  initialVersion,
  onBackClick,
}) => {
  // Edition and pages state
  const [edition, setEdition] = useState<EpaperEditionDoc | null>(null);
  const [pages, setPages] = useState<EpaperPageDoc[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(Math.max(0, initialPageNumber - 1));
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(initialVersion);
  const [availableVersions, setAvailableVersions] = useState<any[]>([]);

  // Loading & error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Zoom & Pan state (10% to 200%)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Reading Mode modal state
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [readingFontSize, setReadingFontSize] = useState<number>(18);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Social Clipping modal state (Dual Formats: 4:5 Portrait & 1:1 Square)
  const [socialClippingArticle, setSocialClippingArticle] = useState<any | null>(null);
  const [clippingFormat, setClippingFormat] = useState<'4:5' | '1:1'>('4:5');
  const clippingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Export & Action states
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingPage, setIsExportingPage] = useState<boolean>(false);

  // Canvas and container refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch Edition and Snapshot Pages
  useEffect(() => {
    let isMounted = true;

    async function loadPublishedEditionData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch edition
        const ed = await apiClient.epaper.getEditionById(editionId, selectedVersion);
        if (!ed) {
          throw new Error('ई-पेपर संस्करण नहीं मिला अथवा अभी प्रकाशित नहीं हुआ है।');
        }

        // Fetch pages from immutable snapshot
        const pList = await apiClient.epaper.getEditionPages(editionId, selectedVersion);

        // Fetch versions history if available
        let versionsList: any[] = [];
        try {
          versionsList = await apiClient.epaper.getEditionVersions(editionId);
        } catch {}

        if (isMounted) {
          setEdition(ed);
          setPages(pList);
          setAvailableVersions(versionsList);
          if (initialPageNumber && initialPageNumber <= pList.length) {
            setCurrentPageIndex(initialPageNumber - 1);
          } else {
            setCurrentPageIndex(0);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load published reader edition:', err);
          setError(err.message || 'संस्करण लोड करने में त्रुटि।');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPublishedEditionData();
    return () => {
      isMounted = false;
    };
  }, [editionId, selectedVersion, initialPageNumber]);

  // Current page
  const currentPage = pages[currentPageIndex] || pages[0];
  const totalPagesCount = edition?.editionType === 'SPECIAL'
    ? (edition.totalPages || pages.length || 4)
    : 12; // Mandatory: Daily edition always displays exactly 12 pages

  // 2. Render Broadsheet Canvas with Asset Preload
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentPage) return;

    let isSubscribed = true;
    const render = () => {
      if (!isSubscribed) return;
      GraphicRenderer.renderBroadsheetPage(canvas, currentPage, {
        scale: 1.0,
        renderTarget: 'screen',
        showGrid: false,
        showMargins: false,
        onImageLoaded: () => {
          if (isSubscribed) render();
        },
      });
    };

    render();

    // Preload current page image assets
    GraphicRenderer.preloadPageImages(currentPage)
      .then(() => {
        if (isSubscribed) render();
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [currentPage]);

  // 3. Render Social Clipping Modal Canvas (Supports 4:5 Portrait & 1:1 Square)
  useEffect(() => {
    if (socialClippingArticle && clippingCanvasRef.current) {
      GraphicRenderer.renderArticleClipping(clippingCanvasRef.current, {
        headline: socialClippingArticle.headline || socialClippingArticle.title || 'प्रमुख समाचार',
        body: socialClippingArticle.body || socialClippingArticle.customBodyText || socialClippingArticle.content || '',
        reporterName: socialClippingArticle.byline || 'अधिकृत संवाददाता',
        reporterBadge: socialClippingArticle.reporterBadge || 'BNW-REP-0101',
        date: edition?.publicationDate || new Date().toISOString().split('T')[0],
        district: edition?.districtName || 'भोपाल',
        editionTitle: edition?.title || 'दैनिक ई-पेपर',
        photoUrl: socialClippingArticle.imageUrl,
        format: clippingFormat,
      });
    }
  }, [socialClippingArticle, edition, clippingFormat]);

  // 4. TTS Audio cleanup
  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // 5. Desktop Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or modal is open
      if (readingArticle || socialClippingArticle) {
        if (e.key === 'Escape') {
          setReadingArticle(null);
          setSocialClippingArticle(null);
          stopAudio();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          handlePrevPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          handleNextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoom(15);
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoom(-15);
          break;
        case '0':
          e.preventDefault();
          handleFitToScreen();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPageIndex, pages.length, isFullscreen, readingArticle, socialClippingArticle, stopAudio]);

  // 6. Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      // Horizontal swipe threshold: 50px, ensuring it was mostly horizontal
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          handleNextPage(); // Swiped left -> next page
        } else {
          handlePrevPage(); // Swiped right -> prev page
        }
      }
    }
  };

  // Page navigation
  const handlePrevPage = () => {
    setCurrentPageIndex((prev) => {
      if (prev > 0) {
        setPanOffset({ x: 0, y: 0 });
        return prev - 1;
      }
      return prev;
    });
  };

  const handleNextPage = () => {
    setCurrentPageIndex((prev) => {
      if (prev < pages.length - 1) {
        setPanOffset({ x: 0, y: 0 });
        return prev + 1;
      }
      return prev;
    });
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(10, Math.min(200, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 24;
    const scale = Math.round((containerW / BROADSHEET_CONSTANTS.PAGE_WIDTH_PT) * 100);
    setZoomLevel(Math.max(10, Math.min(200, scale)));
    setPanOffset({ x: 0, y: 0 });
  };

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Mouse pan drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Web Speech API Hindi TTS Narration
  const handleToggleAudio = (textToRead: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('आपके ब्राउज़र में ऑडियो वाचन समर्थित नहीं है।');
      return;
    }
    if (isPlayingAudio) {
      stopAudio();
    } else {
      stopAudio();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      const voices = window.speechSynthesis.getVoices?.() || [];
      const hindiVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!edition) return;
    setIsExportingPdf(true);
    showToast(`'${edition.title}' (प्रिंट-रेडी PDF) डाउनलोड हो रहा है...`);
    try {
      const blob = await apiClient.epaper.exportPdf(edition.id);
      GraphicRenderer.downloadImage(blob, `${edition.editionCode || edition.id}.pdf`);
      showToast('PDF सफलतापूर्वक डाउनलोड हो गया!');
    } catch (err) {
      console.warn('PDF export error:', err);
      showToast('PDF डाउनलोड विफल रहा।');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Download Page PNG
  const handleDownloadPagePng = async () => {
    if (!edition || !currentPage) return;
    setIsExportingPage(true);
    showToast(`पृष्ठ ${currentPage.pageNumber} उच्च-रिजॉल्यूशन PNG डाउनलोड हो रहा है...`);
    try {
      const blob = await apiClient.epaper.exportPageImage(edition.id, currentPage.pageNumber);
      GraphicRenderer.downloadImage(blob, `${edition.editionCode || edition.id}_p${currentPage.pageNumber}.png`);
      showToast(`पृष्ठ ${currentPage.pageNumber} PNG डाउनलोड हो गया!`);
    } catch (err) {
      console.warn('Page PNG export failed, falling back to canvas:', err);
      if (canvasRef.current) {
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            GraphicRenderer.downloadImage(blob, `${edition.editionCode || edition.id}_p${currentPage.pageNumber}.png`);
            showToast(`पृष्ठ ${currentPage.pageNumber} डाउनलोड हो गया!`);
          }
        });
      }
    } finally {
      setIsExportingPage(false);
    }
  };

  // Share Edition Link
  const handleShare = () => {
    const url = `${window.location.origin}/epaper?editionId=${encodeURIComponent(editionId)}&page=${currentPageIndex + 1}`;
    if (navigator.share) {
      navigator.share({
        title: edition?.title || 'ब्रेकिंग न्यूज़ वाला ई-पेपर',
        text: `ब्रेकिंग न्यूज़ वाला डिजिटल ई-पेपर (पृष्ठ ${currentPageIndex + 1}):`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      showToast('ई-पेपर लिंक क्लिपबोर्ड पर कॉपी हो गया!');
    }
  };

  // Print Page
  const handlePrint = () => {
    window.print();
  };

  // Click on a broadsheet story element
  const handleElementClick = (el: EpaperPageElement) => {
    if (el.elementType === 'AD') return;
    const formatted = PublicReaderEngine.formatReadingModeArticle(el, { fontSize: readingFontSize });
    setReadingArticle(formatted);
  };

  // Trigger social clipping for a story
  const handleTriggerSocialClipping = (el: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSocialClippingArticle(el);
  };

  const formatHindiDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const monthsHi = [
        'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
      ];
      return `${date.getDate()} ${monthsHi[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 min-h-screen text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#ED1727] animate-spin mb-4" />
        <h2 className="text-base font-bold">डिजिटल अखबार लोड हो रहा है...</h2>
        <p className="text-xs text-slate-400 mt-1">प्रकाशित ब्रॉडशीट प्रति तैयार की जा रही है</p>
      </div>
    );
  }

  if (error || !edition) {
    return (
      <div className="bg-slate-900 min-h-screen text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md w-full space-y-4">
          <div className="w-12 h-12 bg-red-900/60 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">ई-पेपर अनुपलब्ध</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {error || 'यह संस्करण अभी प्रकाशित नहीं हुआ है अथवा उपलब्ध नहीं है। केवल प्रकाशित ई-पेपर ही सार्वजनिक पठन हेतु सुलभ हैं।'}
          </p>
          <button
            onClick={onBackClick}
            className="px-4 py-2 bg-[#ED1727] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
          >
            मुख्य पृष्ठ पर वापस जाएं
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xl animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER TOOLBAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 py-2 z-30 shrink-0 flex items-center justify-between gap-2 shadow-md">
        {/* Left: Back + Title & Metadata */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBackClick}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
            title="वापस जाएं"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#ED1727] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0">
                {edition.editionType === 'SPECIAL' ? 'विशेष परिशिष्ट' : 'दैनिक'}
              </span>
              <h1 className="text-xs sm:text-sm font-black text-white truncate">
                {edition.title}
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
              <span>{formatHindiDate(edition.publicationDate)}</span>
              <span>•</span>
              <span>{edition.districtName || 'मध्य प्रदेश'}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">
                पृष्ठ {currentPageIndex + 1} / {totalPagesCount}
              </span>
            </p>
          </div>
        </div>

        {/* Center: Zoom Controls (Hidden on very small screens) */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 border border-slate-700">
          <button
            onClick={() => handleZoom(-15)}
            disabled={zoomLevel <= 10}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="ज़ूम घटाएं (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-bold text-amber-300 min-w-[40px] text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => handleZoom(15)}
            disabled={zoomLevel >= 200}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="ज़ूम बढ़ाएं (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitToScreen}
            className="p-1 text-slate-300 hover:text-white border-l border-slate-700 pl-1.5 ml-0.5 cursor-pointer"
            title="स्क्रीन पर फिट करें (0)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 text-slate-300 hover:text-white cursor-pointer"
            title="रीसेट (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Version Selector (if multiple versions exist) */}
          {availableVersions.length > 1 && (
            <div className="relative">
              <select
                value={selectedVersion || availableVersions[0]?.versionNumber || 1}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-amber-300 text-[10px] font-bold rounded px-1.5 py-1 outline-none cursor-pointer"
                title="प्रकाशित संस्करण इतिहास"
              >
                {availableVersions.map((v) => (
                  <option key={v.id || v.versionNumber} value={v.versionNumber}>
                    v{v.versionNumber} ({v.versionTag || `v${v.versionNumber}.0`})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Page Image Download */}
          <button
            onClick={handleDownloadPagePng}
            disabled={isExportingPage}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer hidden md:flex"
            title="वर्तमान पृष्ठ PNG डाउनलोड करें"
          >
            {isExportingPage ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Download className="w-4 h-4" />}
          </button>

          {/* Full PDF Download */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#ED1727] hover:bg-red-700 disabled:bg-red-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="300 DPI संपूर्ण ई-पेपर PDF डाउनलोड करें"
          >
            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="शेयर करें"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer hidden sm:flex"
            title={isFullscreen ? 'फ़ुलस्क्रीन से बाहर आएं (F)' : 'फ़ुलस्क्रीन मोड (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN READING CANVAS AREA */}
      <main
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 relative overflow-hidden bg-slate-900/90 flex items-center justify-center p-2 sm:p-4"
      >
        {/* Floating Side Previous Page Button */}
        <button
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0}
          className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 bg-slate-900/80 hover:bg-[#ED1727] text-white rounded-full border border-slate-700 hover:border-red-600 disabled:opacity-20 disabled:hover:bg-slate-900/80 cursor-pointer disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-110"
          title="पिछला पृष्ठ (बायां तीर)"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Floating Side Next Page Button */}
        <button
          onClick={handleNextPage}
          disabled={currentPageIndex >= pages.length - 1}
          className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 bg-slate-900/80 hover:bg-[#ED1727] text-white rounded-full border border-slate-700 hover:border-red-600 disabled:opacity-20 disabled:hover:bg-slate-900/80 cursor-pointer disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-110"
          title="अगला पृष्ठ (दायां तीर)"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Broadsheet Page Canvas Container */}
        <div
          className={`relative max-h-full max-w-full overflow-hidden flex items-center justify-center ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              width: `${BROADSHEET_CONSTANTS.PAGE_WIDTH_PT}px`,
              height: `${BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT}px`,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
            className="relative bg-white shadow-2xl transition-transform duration-75 shrink-0"
          >
            {/* HTML5 Broadsheet Canvas */}
            <canvas
              ref={canvasRef}
              width={BROADSHEET_CONSTANTS.PAGE_WIDTH_PT}
              height={BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT}
              className="w-full h-full block"
            />

            {/* Clickable Story Bounding Overlays */}
            {currentPage && currentPage.elements && currentPage.elements.map((el) => {
              if (!el.bounds) return null;
              const isStory = ['STORY', 'HEADLINE', 'COLUMN'].includes(el.elementType);
              if (!isStory) return null;

              const left = el.bounds.x >= BROADSHEET_CONSTANTS.MARGIN_LEFT_PT
                ? el.bounds.x
                : BROADSHEET_CONSTANTS.MARGIN_LEFT_PT + (el.bounds.x || 0);
              const top = el.bounds.y >= BROADSHEET_CONSTANTS.MARGIN_TOP_PT
                ? el.bounds.y
                : BROADSHEET_CONSTANTS.MARGIN_TOP_PT + (el.bounds.y || 0);

              return (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${el.bounds.width}px`,
                    height: `${el.bounds.height}px`,
                  }}
                  onClick={() => handleElementClick(el)}
                  className="group cursor-pointer hover:bg-blue-600/10 hover:ring-2 hover:ring-blue-600/50 hover:shadow-md transition-all"
                  title="क्लिक करके समाचार विस्तार से पढ़ें"
                >
                  <div className="hidden group-hover:flex absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow items-center gap-1 z-10 pointer-events-none">
                    <BookOpen className="w-3 h-3" />
                    <span>पठन मोड</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 3. BOTTOM THUMBNAIL DRAWER & PAGE SELECTOR STRIP */}
      {pages.length > 0 && (
        <footer className="bg-slate-900 border-t border-slate-800 p-2 sm:p-2.5 z-20 shrink-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden md:flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#344FD6]" />
              पृष्ठ झलक:
            </span>

            {/* Horizontal Scrollable Thumbnails Strip */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {pages.map((p, idx) => {
                const isCurrent = currentPageIndex === idx;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentPageIndex(idx);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className={`shrink-0 text-center rounded border transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-red-500 ring-2 ring-red-500/50 scale-105'
                        : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-12 h-16 sm:w-14 sm:h-20 bg-white flex flex-col justify-between p-1 text-[8px] text-slate-800 rounded-t overflow-hidden">
                      <span className="font-bold text-[#ED1727] text-left">P{p.pageNumber}</span>
                      <span className="line-clamp-2 text-[7px] text-slate-700 leading-tight">
                        {p.pageTitle?.replace(/^(पृष्ठ\s*\d+\s*:\s*)/, '') || 'समाचार'}
                      </span>
                      <span className="text-[6px] text-slate-400 text-right">{p.sectionType || 'NEWS'}</span>
                    </div>
                    <span
                      className={`block text-[9px] py-0.5 font-bold ${
                        isCurrent ? 'bg-[#ED1727] text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      पेज {p.pageNumber}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Current Page Status */}
            <div className="shrink-0 text-right">
              <span className="text-xs font-black text-white block">
                पेज {currentPageIndex + 1} / {totalPagesCount}
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                {currentPage?.pageTitle?.slice(0, 25) || 'ब्रॉडशीट'}
              </span>
            </div>
          </div>
        </footer>
      )}

      {/* 4. READING MODE MODAL (पठन मोड) */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="bg-[#ED1727] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  पठन मोड
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {readingArticle.readingTimeMinutes} मिनट पठन • {readingArticle.wordCount} शब्द
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Font Scaling A- / A+ */}
                <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-0.5 border border-slate-700">
                  <button
                    onClick={() => setReadingFontSize((s) => Math.max(14, s - 2))}
                    className="text-xs font-bold text-slate-300 hover:text-white px-1 cursor-pointer"
                    title="फॉन्ट छोटा करें"
                  >
                    A-
                  </button>
                  <span className="text-[10px] font-mono text-amber-300">{readingFontSize}px</span>
                  <button
                    onClick={() => setReadingFontSize((s) => Math.min(28, s + 2))}
                    className="text-xs font-bold text-slate-300 hover:text-white px-1 cursor-pointer"
                    title="फॉन्ट बड़ा करें"
                  >
                    A+
                  </button>
                </div>

                {/* Audio TTS Button */}
                <button
                  onClick={() => handleToggleAudio(readingArticle.headline + '। ' + readingArticle.body)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title={isPlayingAudio ? 'वाचन रोकें' : 'खबर सुनें (ऑडियो)'}
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isPlayingAudio ? 'रोकें' : 'खबर सुनें'}</span>
                </button>

                {/* 4:5 Clipping Modal Trigger */}
                <button
                  onClick={(e) => handleTriggerSocialClipping(readingArticle, e)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                  title="सोशल मीडिया क्लिपिंग बनाएं"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">क्लिपिंग</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setReadingArticle(null);
                    stopAudio();
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="बंद करें (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {readingArticle.headline}
              </h2>

              {/* Attribution */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-y border-slate-100 py-2">
                <span>साभार: <strong className="text-slate-800">{readingArticle.byline}</strong></span>
                <span>•</span>
                <span>छायाचित्र: <strong className="text-slate-800">{readingArticle.photographer}</strong></span>
                <span>•</span>
                <span>{edition.districtName || 'भोपाल'}</span>
              </div>

              {/* Optional Photo */}
              {readingArticle.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 my-3">
                  <img
                    src={readingArticle.imageUrl}
                    alt={readingArticle.headline}
                    className="w-full max-h-72 object-cover"
                  />
                </div>
              )}

              {/* Body Text with Dynamic Font Size */}
              <div
                style={{ fontSize: `${readingFontSize}px`, lineHeight: 1.7 }}
                className="text-slate-800 font-normal whitespace-pre-line text-justify"
              >
                {readingArticle.body}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>ब्रेकिंग न्यूज़ वाला • दैनिक डिजिटल ई-पेपर</span>
              <button
                onClick={() => {
                  setReadingArticle(null);
                  stopAudio();
                }}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SOCIAL CLIPPING MODAL (Dual Ratios: 4:5 & 1:1) */}
      {socialClippingArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase">
                <Scissors className="w-4 h-4 text-[#ED1727]" />
                सोशल मीडिया क्लिपिंग कार्ड
              </h3>
              <button
                onClick={() => setSocialClippingArticle(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format Selector Pills (4:5 Portrait vs 1:1 Square) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setClippingFormat('4:5')}
                className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  clippingFormat === '4:5'
                    ? 'bg-white text-red-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4:5 पोर्ट्रेट (1080×1350)
              </button>
              <button
                type="button"
                onClick={() => setClippingFormat('1:1')}
                className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  clippingFormat === '1:1'
                    ? 'bg-white text-red-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1:1 स्क्वायर (1080×1080)
              </button>
            </div>

            {/* Dynamic Canvas Display */}
            <div className="flex justify-center bg-slate-100 p-2 rounded-xl border border-slate-200">
              <canvas
                ref={clippingCanvasRef}
                width={400}
                height={clippingFormat === '1:1' ? 400 : 500}
                className={`w-full max-w-[280px] ${clippingFormat === '1:1' ? 'aspect-square' : 'aspect-[4/5]'} rounded shadow-md block bg-white`}
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              {clippingFormat === '1:1'
                ? 'व्हाट्सएप एवं इंस्टाग्राम पोस्ट हेतु अनुकूलित 1:1 वर्गाकार न्यूज़ कार्ड'
                : 'व्हाट्सएप, फेसबुक एवं इंस्टाग्राम स्टोरी हेतु अनुकूलित 4:5 पोर्ट्रेट न्यूज़ कार्ड'}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (clippingCanvasRef.current) {
                    clippingCanvasRef.current.toBlob((blob) => {
                      if (blob) {
                        GraphicRenderer.downloadImage(blob, `BNW_Clipping_${clippingFormat === '1:1' ? '1x1' : '4x5'}_${Date.now()}.png`);
                        showToast('न्यूज़ कार्ड डाउनलोड हो गया!');
                      }
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#ED1727] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>PNG डाउनलोड</span>
              </button>

              <button
                onClick={() => {
                  const url = `${window.location.origin}/epaper?editionId=${encodeURIComponent(editionId)}`;
                  const headline = socialClippingArticle.headline || 'प्रमुख समाचार';
                  window.open(
                    `https://api.whatsapp.com/send?text=${encodeURIComponent(`*${headline}*\n\nपूरा ई-पेपर पढ़ें: ${url}`)}`,
                    '_blank'
                  );
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>व्हाट्सएप शेयर</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
