import React, { useState, useEffect } from 'react';
import { NewsCardData, AIAnalysisResult } from './types';
import { INITIAL_PRESETS } from './data/presets';
import { CardPreview } from './components/CardPreview';
import { CardEditor } from './components/CardEditor';
import { AIGenerateImageModal } from './components/AIGenerateImageModal';
import { NewsCommandModal } from './components/NewsCommandModal';
import { CaptionModal } from './components/CaptionModal';
import { renderCardToCanvas } from './lib/CanvasExporter';
import {
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Share2,
  FileImage,
  Layers,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';

const STORAGE_KEY = 'breaking_news_card_state_v2';

export default function App() {
  // Initialize with persisted state or default preset with fixed 33px font & locked theme
  const [card, setCard] = useState<NewsCardData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PRESETS[0],
          ...parsed,
          headlineFontSize: parsed.headlineFontSize || 33,
        };
      }
    } catch (e) {
      console.warn('Could not read saved state from localStorage', e);
    }
    return { ...INITIAL_PRESETS[0], headlineFontSize: 33 };
  });

  // Save to localStorage whenever card changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(card));
    } catch (e) {
      // localStorage may fail if large data-urls exceed quota
    }
  }, [card]);

  const [isAIAnalyzeOpen, setIsAIAnalyzeOpen] = useState(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobilePreviewSize, setMobilePreviewSize] = useState<'compact' | 'expanded'>('compact');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateCard = (updates: Partial<NewsCardData>) => {
    setCard((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Apply AI result from link or command
  const handleApplyAIResult = (result: AIAnalysisResult, photoData?: string) => {
    setCard((prev) => {
      const pickedMain = photoData || result.pickedImages?.main;
      const pickedSecond = result.pickedImages?.second;
      return {
        ...prev,
        headline: result.headline,
        formattedHeadline: result.formattedHeadline || result.headline,
        highlightWords: result.highlightWords || [],
        location: result.location || prev.location,
        summary: result.summary || prev.summary,
        category: result.category || prev.category,
        images: pickedMain
          ? {
              ...prev.images,
              main: pickedMain,
              second: pickedSecond || prev.images.second,
            }
          : prev.images,
        layout: (pickedSecond && prev.layout === 'single')
          ? 'split-v'
          : (result.hasPerson ? 'inset-circle' : prev.layout),
        showAiGenerated:
          result.isAiGeneratedPhoto !== undefined
            ? result.isAiGeneratedPhoto
            : prev.showAiGenerated,
      };
    });
    showToast('✨ Gemini AI द्वारा न्यूज़ हेडलाइन व विवरण लागू किए गए!');
  };

  // Apply AI Generated Image from Headline
  const handleApplyAiGeneratedImage = (imageUrl: string) => {
    setCard((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        main: imageUrl,
      },
      showAiGenerated: true,
    }));
    showToast('✨ AI जनरेटेड फोटो कार्ड के बैकग्राउंड में सेट हो गई!');
  };

  // Export card to High-Res PNG
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const canvas = await renderCardToCanvas(card);
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanName = (card.headline || 'news-card')
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
      a.download = `BreakingNewsWala_${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('✅ 1080x1350 हाई-क्वालिटी न्यूज़ कार्ड डाउनलोड हो गया!');
    } catch (err: any) {
      console.error(err);
      showToast('❌ इमेज डाउनलोड करने में त्रुटि हुई');
    } finally {
      setDownloading(false);
    }
  };

  // Copy card image to clipboard
  const handleCopyToClipboard = async () => {
    try {
      setDownloading(true);
      const canvas = await renderCardToCanvas(card);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          showToast('📋 इमेज क्लिपबोर्ड में कॉपी हो गई! कहीं भी पेस्ट (Ctrl+V) करें');
          setTimeout(() => setCopied(false), 2500);
        } catch (clipErr) {
          console.warn('Clipboard write failed:', clipErr);
          // Fallback download if clipboard is restricted
          handleDownload();
        } finally {
          setDownloading(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-neutral-950 px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 border border-yellow-300 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-neutral-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo and Channel Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-red-900/30">
              <FileImage className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  न्यूज़ ग्राफिक स्टूडियो
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                  जैकेट टेम्पलेट
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                ब्रेकिंग न्यूज़वाला (भारत के जिलों से आपके दिलों तक)
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAIAnalyzeOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold border border-red-500/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Gemini 3.1 Pro फोटो AI</span>
            </button>

            <button
              onClick={() => setIsCommandModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
              <span>लिंक/कमांड</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'बन रहा है...' : 'डाउनलोड (PNG)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Card Preview (Sticky on Mobile & Desktop per user command) */}
        <section className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md pt-2 pb-3 px-2 -mx-3 sm:mx-0 sm:px-0 border-b border-neutral-800/80 shadow-2xl lg:shadow-none lg:border-none lg:bg-transparent lg:top-20 lg:z-10 lg:col-span-5 flex flex-col items-center space-y-2.5 sm:space-y-4 w-full">
          <div className="w-full max-w-[500px] flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-yellow-400" />
              <span>लाइव कार्ड प्रीव्यू (1080x1350)</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Mobile Size Toggle Button (Sticky Bar) */}
              <button
                type="button"
                onClick={() =>
                  setMobilePreviewSize((prev) => (prev === 'compact' ? 'expanded' : 'compact'))
                }
                className="lg:hidden flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-yellow-400 border border-neutral-700 transition-colors cursor-pointer"
                title={mobilePreviewSize === 'compact' ? 'प्रीव्यू बड़ा करें' : 'प्रीव्यू कॉम्पैक्ट करें'}
              >
                {mobilePreviewSize === 'compact' ? (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    <span>बड़ा करें</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3 h-3" />
                    <span>छोटा करें</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-neutral-400">4:5 Portrait</span>
            </div>
          </div>

          {/* The Actual News Jacket Card - Always fully visible, crisp and centered */}
          <div className="w-full flex justify-center">
            <CardPreview
              card={card}
              className={`w-full transition-all duration-200 ${
                mobilePreviewSize === 'compact'
                  ? 'max-w-[240px] xs:max-w-[270px] sm:max-w-[340px] lg:max-w-[500px]'
                  : 'max-w-[340px] sm:max-w-[420px] lg:max-w-[500px]'
              }`}
            />
          </div>

          {/* Quick Action Buttons Directly Under the Card */}
          <div className="w-full max-w-[500px] grid grid-cols-3 gap-2 pt-0.5">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>डाउनलोड</span>
            </button>

            <button
              onClick={handleCopyToClipboard}
              disabled={downloading}
              className="py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs border border-neutral-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span>कॉपी हुआ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>कॉपी इमेज</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsCaptionModalOpen(true)}
              className="py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs border border-neutral-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-green-400" />
              <span>कैप्शन व शेयर</span>
            </button>
          </div>

          {/* User info note - hidden on small mobile to save vertical space, visible on sm and desktop */}
          <div className="hidden sm:flex w-full max-w-[500px] bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 text-[11px] text-neutral-400 items-start gap-2">
            <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p>
              यह कार्ड बिल्कुल आपके <strong>"ब्रेकिंग न्यूज़वाला"</strong> सैंपल्स के अनुसार
              डिज़ाइन किया गया है। बैकग्राउंड फोटो, जैकेट ओवरले, हेडलाइन का स्थायी फिक्स स्पेस, और फुटर बार पूरी तरह कस्टमाइज़ेबल हैं।
            </p>
          </div>
        </section>

        {/* Right Column: Controls & Editing Dashboard (7 cols on lg) */}
        <section className="lg:col-span-7 space-y-6">
          <CardEditor
            card={card}
            onChange={handleUpdateCard}
            onOpenAIAnalyze={() => setIsAIAnalyzeOpen(true)}
            onOpenCommandModal={() => setIsCommandModalOpen(true)}
            onOpenCaptionModal={() => setIsCaptionModalOpen(true)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 bg-neutral-900/50 py-4 px-6 text-center text-xs text-neutral-500">
        ब्रेकिंग न्यूज़वाला ग्राफिक मेकर • Powered by Google Gemini 3.1 Pro • उच्च गुणवत्ता 1080x1350 सोशल मीडिया इमेज
      </footer>

      {/* AI Generate Image from Headline Modal */}
      <AIGenerateImageModal
        isOpen={isAIAnalyzeOpen}
        onClose={() => setIsAIAnalyzeOpen(false)}
        currentHeadline={card.headline}
        aspectRatio={card.aspectRatio}
        onApplyImage={handleApplyAiGeneratedImage}
      />

      {/* News Command & Link Modal */}
      <NewsCommandModal
        isOpen={isCommandModalOpen}
        onClose={() => setIsCommandModalOpen(false)}
        onApplyResult={handleApplyAIResult}
      />

      {/* Caption Copy Modal */}
      <CaptionModal
        isOpen={isCaptionModalOpen}
        onClose={() => setIsCaptionModalOpen(false)}
        card={card}
      />
    </div>
  );
}
