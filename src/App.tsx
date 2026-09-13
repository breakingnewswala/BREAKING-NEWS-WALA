import React, { useState, useEffect } from 'react';
import { NewsCardData, AIAnalysisResult } from './types';
import { INITIAL_PRESETS, PLACEHOLDER_NEWS_IMG } from './data/presets';
import { CardPreview } from './components/CardPreview';
import { CardEditor } from './components/CardEditor';
import { AIGenerateImageModal } from './components/AIGenerateImageModal';
import { NewsCommandModal } from './components/NewsCommandModal';
import { CaptionModal } from './components/CaptionModal';
import { LoginModal, ReporterUser } from './components/LoginModal';
import { AppGuideModal } from './components/AppGuideModal';
import { AppUpdateModal, AppVersionInfo, APP_CURRENT_VERSION } from './components/AppUpdateModal';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { StepNavigator } from './components/StepNavigator';
import { renderCardToCanvas } from './lib/CanvasExporter';
import { extractLeaderFromHeadline } from './lib/speakerUtils';
import { generateGraphicDownloadFileName, getFormattedHindiDate } from './lib/dateUtils';
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
  ChevronDown,
  ChevronUp,
  UserCheck,
  LogOut,
  Sliders,
  Smartphone,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

const STORAGE_KEY = 'breaking_news_card_state_v2';

export default function App() {
  // Initialize user authentication session
  const [currentUser, setCurrentUser] = useState<ReporterUser | null>(() => {
    try {
      const saved = localStorage.getItem('reporter_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login modal opens automatically if not authenticated
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('reporter_auth_session');
    } catch {
      return true;
    }
  });

  // Mobile editor active step state
  const [activeStep, setActiveStep] = useState<number>(1);
  const [mobileViewMode, setMobileViewMode] = useState<'steps' | 'all'>('steps');

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
          showDate: parsed.showDate !== undefined ? parsed.showDate : true,
          dateStr: parsed.dateStr || getFormattedHindiDate(),
        };
      }
    } catch (e) {
      console.warn('Could not read saved state from localStorage', e);
    }
    return {
      ...INITIAL_PRESETS[0],
      headlineFontSize: 33,
      showDate: true,
      dateStr: getFormattedHindiDate(),
    };
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
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobilePreviewCollapsed, setIsMobilePreviewCollapsed] = useState(false);

  // App Version & Update Notification states
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Screen size detection: strictly distinguish Mobile (<1024px) vs Desktop (>=1024px)
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [aiResetKey, setAiResetKey] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchVersionInfo = async () => {
    try {
      const res = await fetch('/api/app-version');
      if (res.ok) {
        const data = await res.json();
        if (data.versionInfo) {
          setVersionInfo(data.versionInfo);
          return;
        }
      }
      const staticRes = await fetch('/version.json');
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        setVersionInfo(staticData);
      }
    } catch (e) {
      console.warn('Could not fetch version info', e);
    }
  };

  useEffect(() => {
    fetchVersionInfo();
    const interval = setInterval(fetchVersionInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Full reset / clean card with dummy placeholder image and helpful instructions (not completely blank)
  const handleResetCard = () => {
    const freshDate = getFormattedHindiDate();
    setCard((prev) => ({
      ...prev,
      headline: 'कृपया स्टेप 5 (हेडलाइन) में जाकर अपनी मुख्य खबर का शीर्षक दर्ज करें...',
      formattedHeadline: 'कृपया स्टेप 5 (हेडलाइन) में जाकर अपनी मुख्य खबर का शीर्षक दर्ज करें...',
      highlightWords: [],
      location: 'भोपाल / मध्य प्रदेश',
      summary: 'खबर का संक्षिप्त विवरण और मुख्य बिंदु यहां दर्ज करें...',
      images: {
        main: PLACEHOLDER_NEWS_IMG,
        second: '',
      },
      imagePositions: undefined,
      customFrameOverlayPng: undefined,
      speakerName: '',
      speakerTitle: '',
      dateStr: freshDate,
      showDate: true,
      showLocation: true,
      showCallout: true,
      calloutTag: '🔴 पूरी खबर डिस्क्रिप्शन में',
      layout: 'single',
    }));

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }

    // Fully reset AI Prompt & Link inputs
    setAiResetKey((prev) => prev + 1);

    showToast('✨ नया कार्ड तैयार! एआई टूल व कार्ड डेटा पूरी तरह रिफ्रेश हो गया।');
  };

  const handleLoginSuccess = (user: ReporterUser) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    showToast(`👋 स्वागत है, ${user.name}!`);

    // Auto-open guide modal on login if not opted out
    try {
      const dontShow = localStorage.getItem('dont_show_app_guide_v1');
      if (!dontShow) {
        setTimeout(() => {
          setIsGuideModalOpen(true);
        }, 500);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('reporter_auth_session');
    setCurrentUser(null);
    setIsLoginModalOpen(true);
    showToast('🔒 आप लॉगआउट हो गए हैं');
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
        // Always default to single full image for news as explicitly requested by editor
        layout: 'single',
        showAiGenerated:
          result.isAiGeneratedPhoto !== undefined
            ? result.isAiGeneratedPhoto
            : prev.showAiGenerated,
        speakerName:
          result.speakerName ||
          (prev.frameDesign === 'jacket-quote'
            ? extractLeaderFromHeadline(result.headline).name || prev.speakerName
            : prev.speakerName),
        speakerTitle:
          result.speakerTitle ||
          (prev.frameDesign === 'jacket-quote'
            ? extractLeaderFromHeadline(result.headline).title || prev.speakerTitle
            : prev.speakerTitle),
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

  // Export card to High-Res JPG (As requested by user: all graphic downloads must be JPG)
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const canvas = await renderCardToCanvas(card);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      const a = document.createElement('a');
      a.href = dataUrl;
      // Use clean alphanumeric / digits filename per user instruction (.jpg)
      a.download = generateGraphicDownloadFileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('✅ 1080x1350 हाई-क्वालिटी JPG न्यूज़ कार्ड डाउनलोड हो गया!');
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

      {/* Dynamic App Update Notification Banner */}
      <UpdateNotificationBanner
        versionInfo={versionInfo}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        onDismiss={() => setIsBannerDismissed(true)}
        isDismissed={isBannerDismissed}
      />

      {/* Top Navbar - Clean, Compact & Fixed Width: strictly App Icon + Brand Name on left, and Refresh + Login/Logout on right */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-3 sm:px-6 py-2.5 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Icon + Red 'न्यूज़ स्टूडियो' Tag */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <img
              src="/assets/bnw_tv_logo.png"
              alt="BNW TV Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 drop-shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 sm:py-1 rounded-md bg-red-600/25 text-red-400 border border-red-500/40 shadow-sm shrink-0 whitespace-nowrap">
              न्यूज़ स्टूडियो
            </span>
          </div>

          {/* Top Quick Actions: Guide Button, Refresh, and Login / Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Step-by-Step Guide Popup Button (ग्राफिक कैसे बनाएं?) */}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              title="ग्राफिक कैसे बनाएं? (स्टेप-बाय-स्टेप गाइड)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 text-xs font-bold border border-yellow-400/30 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden xxs:inline">गाइड</span>
            </button>

            {/* Reset / Clean All button (रिफ्रेश) - Hidden on mobile as user requested */}
            <button
              type="button"
              onClick={handleResetCard}
              title="कार्ड रिफ्रेश करें - नया कार्ड बनाएं"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold border border-neutral-700 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
              <span>रिफ्रेश</span>
            </button>

            {/* Reporter Profile & Login / Logout */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/90 border border-neutral-700 text-xs shadow-sm">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                )}
                <span className="font-bold text-white max-w-[85px] sm:max-w-[120px] truncate hidden xxs:inline">
                  {currentUser.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="लॉगआउट करें"
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-[11px] font-bold transition-colors cursor-pointer border border-red-500/30 ml-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>लॉगआउट</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-neutral-950 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
              >
                लॉगिन
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
        {/* Left Column: Card Preview */}
        {/* DESKTOP (lg:): Sticky at top-18, FULL 500px width */}
        {/* MOBILE (<lg:): LOCKED / STILL at top under header so reporter can see live preview while scrolling steps below */}
        <section
          className={`w-full ${
            isMobile
              ? 'sticky top-[53px] z-30 bg-neutral-950/98 backdrop-blur-md px-2 py-2 -mx-2.5 border-b border-neutral-800 shadow-xl flex flex-col items-center'
              : 'lg:sticky lg:top-18 lg:z-10 lg:col-span-5 lg:bg-transparent lg:shadow-none lg:border-none lg:p-0 flex flex-col items-center space-y-3'
          }`}
        >
          {!isMobile ? (
            /* =================== DESKTOP VIEW (PERMANENT FULL SIZE, NEVER SHRINKS) =================== */
            <div className="w-full max-w-[500px] flex flex-col items-center space-y-3">
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-yellow-400" />
                  <span>लाइव कार्ड प्रीव्यू (1080x1350)</span>
                </span>
                <span className="text-[11px] text-neutral-400 font-semibold">4:5 Portrait HD</span>
              </div>

              {/* The Actual News Jacket Card - Always 100% full-sized on PC */}
              <div className="w-full flex justify-center">
                <CardPreview
                  card={card}
                  className="w-full max-w-[500px]"
                  onChange={handleUpdateCard}
                />
              </div>

              {/* Desktop Quick Action Buttons: 1. डाउनलोड, 2. रिफ्रेश, 3. कैप्शन एंड शेयर */}
              <div className="w-full grid grid-cols-3 gap-2 pt-1">
                {/* 1. डाउनलोड */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="py-2.5 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
                  title="कार्ड डाउनलोड करें (JPG)"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'बन रहा है...' : 'डाउनलोड (JPG)'}</span>
                </button>

                {/* 2. रिफ्रेश */}
                <button
                  type="button"
                  onClick={handleResetCard}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-xs border border-neutral-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="कार्ड व एआई टूल पूरा रिफ्रेश करें"
                >
                  <RefreshCw className="w-4 h-4 text-yellow-400" />
                  <span>रिफ्रेश</span>
                </button>

                {/* 3. कैप्शन एंड शेयर */}
                <button
                  onClick={() => setIsCaptionModalOpen(true)}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-xs border border-neutral-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="कैप्शन कॉपी व सोशल मीडिया शेयर"
                >
                  <Share2 className="w-4 h-4 text-green-400" />
                  <span>कैप्शन एंड शेयर</span>
                </button>
              </div>

              {/* User info note */}
              <div className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 text-[11px] text-neutral-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p>
                  यह कार्ड बिल्कुल आपके <strong>"ब्रेकिंग न्यूज़ वाला"</strong> सैंपल्स के अनुसार
                  डिज़ाइन किया गया है। बैकग्राउंड फोटो, जैकेट ओवरले, हेडलाइन का स्थायी फिक्स स्पेस, और फुटर बार पूरी तरह कस्टमाइज़ेबल हैं।
                </p>
              </div>
            </div>
          ) : (
            /* =================== MOBILE VIEW (LOCKED & STILL AT TOP, ORIGINAL PROPORTIONS) =================== */
            <div className="w-full max-w-[420px] flex flex-col items-center">
              {/* Compact Header Strip on Mobile Locked Preview */}
              <div className="w-full flex items-center justify-between px-1 mb-1.5">
                <span className="text-[11px] font-black text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span>लाइव प्रीव्यू</span>
                  <span className="text-[10px] text-neutral-400 font-medium">(लॉक)</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {/* 1. डाउनलोड */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-2.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-black text-xs flex items-center gap-1 cursor-pointer shadow active:scale-95"
                    title="कार्ड डाउनलोड करें"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloading ? '...' : 'डाउनलोड'}</span>
                  </button>

                  {/* 2. रिफ्रेश (Easy to touch, slightly larger padding) */}
                  <button
                    type="button"
                    onClick={handleResetCard}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    title="कार्ड व एआई टूल पूरा रिफ्रेश करें"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
                    <span>रिफ्रेश</span>
                  </button>

                  {/* 3. कैप्शन एंड शेयर */}
                  <button
                    type="button"
                    onClick={() => setIsCaptionModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                    title="कैप्शन व शेयर"
                  >
                    <Share2 className="w-3.5 h-3.5 text-green-400" />
                    <span>कैप्शन</span>
                  </button>

                  {/* Collapse / Expand toggle so reporter can hide preview when needed */}
                  <button
                    type="button"
                    onClick={() => setIsMobilePreviewCollapsed((prev) => !prev)}
                    className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs font-bold flex items-center cursor-pointer shadow-sm ml-0.5"
                    title={isMobilePreviewCollapsed ? 'प्रीव्यू खोलें' : 'प्रीव्यू सिकोड़ें'}
                  >
                    {isMobilePreviewCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5 text-yellow-400" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Card: Original aspect ratio & styling, still and locked */}
              {!isMobilePreviewCollapsed && (
                <div className="w-full flex justify-center items-center py-0.5">
                  <div className="w-[235px] xs:w-[260px] sm:w-[285px] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10">
                    <CardPreview
                      card={card}
                      className="w-full shadow-2xl"
                      onChange={handleUpdateCard}
                    />
                  </div>
                </div>
              )}

              {/* Editor Steps Bar - Strictly LOCKED below the Live Preview photo on mobile */}
              <div className="w-full mt-2 pt-1 border-t border-neutral-800/80">
                <StepNavigator
                  activeStep={activeStep}
                  onStepChange={setActiveStep}
                  mobileViewMode={mobileViewMode}
                  onToggleMobileViewMode={setMobileViewMode}
                  compact={true}
                />
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Controls & Editing Dashboard (7 cols on lg) */}
        <section className="lg:col-span-7 space-y-6">
          <CardEditor
            card={card}
            onChange={handleUpdateCard}
            onOpenAIAnalyze={() => setIsAIAnalyzeOpen(true)}
            onOpenCommandModal={() => setIsCommandModalOpen(true)}
            onOpenCaptionModal={() => setIsCaptionModalOpen(true)}
            onResetAI={handleResetCard}
            activeStep={activeStep}
            onStepChange={setActiveStep}
            currentUser={currentUser}
            mobileViewMode={mobileViewMode}
            onToggleMobileViewMode={setMobileViewMode}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 bg-neutral-900/50 py-4 px-4 sm:px-6 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>ब्रेकिंग न्यूज़ वाला ग्राफिक मेकर • उच्च गुणवत्ता 1080x1350 सोशल मीडिया इमेज</span>
        <span className="hidden sm:inline">•</span>
        <button
          type="button"
          onClick={() => setIsUpdateModalOpen(true)}
          className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5 underline underline-offset-2"
        >
          <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
          <span>ऐप अपडेट (App Update)</span>
        </button>
      </footer>

      {/* Manual Reporter Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* App Update & APK Manager Modal */}
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        currentUser={currentUser}
        versionInfo={versionInfo}
        onRefreshVersion={fetchVersionInfo}
      />

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
        key={aiResetKey}
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

      {/* Step-by-Step Reporter Guide Modal */}
      <AppGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onSelectStep={(step) => setActiveStep(step)}
      />
    </div>
  );
}
