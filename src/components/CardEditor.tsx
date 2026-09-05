import React from 'react';
import { NewsCardData, CardLayout, AspectRatio, FrameDesign } from '../types';
import {
  Sparkles,
  LayoutGrid,
  Image as ImageIcon,
  Type,
  MapPin,
  Share2,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Layers,
  CircleDot,
  Upload,
  RotateCcw,
  Check,
  ShieldAlert,
  Move,
  ZoomIn,
  ZoomOut,
  AlignJustify,
  AlignCenter,
  AlignLeft,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { FRAME_OPTIONS } from '../lib/HeaderDesigns';
import {
  BUILTIN_RIBBONS,
  loadSavedCustomRibbons,
  saveCustomRibbon,
  deleteCustomRibbon,
  RibbonPreset,
} from '../lib/ribbonPresets';

interface CardEditorProps {
  card: NewsCardData;
  onChange: (updated: Partial<NewsCardData>) => void;
  onOpenAIAnalyze: () => void;
  onOpenCommandModal: () => void;
  onOpenCaptionModal: () => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({
  card,
  onChange,
  onOpenAIAnalyze,
  onOpenCommandModal,
  onOpenCaptionModal,
}) => {
  // Saved custom ribbons for Super Breaking layout
  const [savedRibbons, setSavedRibbons] = React.useState<RibbonPreset[]>(() => loadSavedCustomRibbons());
  const [newRibbonName, setNewRibbonName] = React.useState<string>('');

  // Mobile active step navigation (1 to 5)
  const [activeStep, setActiveStep] = React.useState<number>(1);
  const [mobileViewMode, setMobileViewMode] = React.useState<'steps' | 'all'>('steps');

  const STEPS = [
    { step: 1, id: 'step-frame', label: '1. फ्रेम टेम्पलेट', icon: '🖼️' },
    { step: 2, id: 'step-ai', label: '2. AI टूल्स', icon: '✨' },
    { step: 3, id: 'step-jacket', label: '3. हेडर-फुटर', icon: '🏷️' },
    { step: 4, id: 'step-layout', label: '4. फोटो लेआउट', icon: '📷' },
    { step: 5, id: 'step-headline', label: '5. 3-लाइन हेडलाइन', icon: '✍️' },
  ];

  // Photo crop/position active tab
  const [activeCropPhotoKey, setActiveCropPhotoKey] = React.useState<'main' | 'second' | 'third' | 'fourth' | 'insetCircle'>('main');

  // Available photos for cropping based on layout
  const availableCropPhotos: { key: 'main' | 'second' | 'third' | 'fourth' | 'insetCircle'; label: string }[] = [
    {
      key: 'main',
      label:
        card.layout === 'split-v'
          ? 'फोटो 1 (ऊपर 35%)'
          : card.layout === 'double'
          ? 'फोटो 1 (ऊपर 50%)'
          : card.layout === 'double-h' || card.layout === 'split-h'
          ? 'फोटो 1 (बाईं 50%)'
          : card.layout === 'grid-3' || card.layout === 'grid-4'
          ? 'फोटो 1 (ऊपर बाईं)'
          : card.layout === 'grid-3-bottom'
          ? 'फोटो 1 (ऊपर चौड़ी)'
          : card.layout === 'inset-circle'
          ? 'मुख्य बैकग्राउंड फोटो'
          : 'मुख्य फोटो (Photo 1)',
    },
  ];

  if (
    card.layout === 'double' ||
    card.layout === 'split-v' ||
    card.layout === 'double-h' ||
    card.layout === 'split-h' ||
    card.layout === 'grid-3' ||
    card.layout === 'grid-3-bottom' ||
    card.layout === 'grid-4'
  ) {
    availableCropPhotos.push({
      key: 'second',
      label:
        card.layout === 'split-v'
          ? 'फोटो 2 (नीचे 65%)'
          : card.layout === 'double'
          ? 'फोटो 2 (नीचे 50%)'
          : card.layout === 'double-h' || card.layout === 'split-h'
          ? 'फोटो 2 (दाईं 50%)'
          : card.layout === 'grid-3' || card.layout === 'grid-4'
          ? 'फोटो 2 (ऊपर दाईं)'
          : 'फोटो 2 (नीचे बाईं)',
    });
  }

  if (card.layout === 'grid-3' || card.layout === 'grid-3-bottom' || card.layout === 'grid-4') {
    availableCropPhotos.push({
      key: 'third',
      label:
        card.layout === 'grid-3'
          ? 'फोटो 3 (नीचे चौड़ी)'
          : card.layout === 'grid-4'
          ? 'फोटो 3 (नीचे बाईं)'
          : 'फोटो 3 (नीचे दाईं)',
    });
  }

  if (card.layout === 'grid-4') {
    availableCropPhotos.push({
      key: 'fourth',
      label: 'फोटो 4 (नीचे दाईं)',
    });
  }

  if (card.layout === 'inset-circle' || card.images.insetCircle) {
    availableCropPhotos.push({
      key: 'insetCircle',
      label: '⭕ गोल सर्कल फोटो (Arrow Connected)',
    });
  }

  // Ensure activeCropPhotoKey is always a valid key for the current layout
  React.useEffect(() => {
    if (!availableCropPhotos.some((p) => p.key === activeCropPhotoKey)) {
      setActiveCropPhotoKey('main');
    }
  }, [card.layout, activeCropPhotoKey]);

  const currentCrop = card.imagePositions?.[activeCropPhotoKey] || { x: 50, y: 50, zoom: 1 };

  const updateCrop = (
    key: 'main' | 'second' | 'third' | 'fourth' | 'insetCircle',
    updates: Partial<{ x: number; y: number; zoom: number }>
  ) => {
    const existing = card.imagePositions?.[key] || { x: 50, y: 50, zoom: 1 };
    onChange({
      imagePositions: {
        ...card.imagePositions,
        [key]: {
          ...existing,
          ...updates,
        },
      },
    });
  };

  // Handle image file upload helper
  const handleFileUpload = (
    key: 'main' | 'second' | 'third' | 'fourth' | 'insetCircle',
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange({
          images: {
            ...card.images,
            [key]: e.target.result as string,
          },
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Header PNG upload (e.g. IMAGE NEWS.png)
  const handleHeaderUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange({
          customHeaderPng: e.target.result as string,
          frameDesign: 'jacket-original',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Full Frame Overlay PNG upload
  const handleFrameOverlayUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange({
          customFrameOverlayPng: e.target.result as string,
          frameDesign: 'custom-png',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom Brand/Channel Logo upload
  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange({
          customLogoUrl: e.target.result as string,
          brandLogoType: 'custom',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Footer PNG upload (e.g. Footer.png)
  const handleFooterUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange({
          customFooterPng: e.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Split current headline into individual words to allow one-click yellow highlight toggling
  const getHeadlineWords = () => {
    return card.headline.split(/\s+/).filter(Boolean);
  };

  const toggleWordHighlight = (word: string) => {
    const cleanWord = word.replace(/[.,:;!?]/g, '');
    const exists = card.highlightWords?.some(
      (hw) => hw.toLowerCase() === cleanWord.toLowerCase()
    );

    let newHighlights: string[];
    if (exists) {
      newHighlights = (card.highlightWords || []).filter(
        (hw) => hw.toLowerCase() !== cleanWord.toLowerCase()
      );
    } else {
      newHighlights = [...(card.highlightWords || []), cleanWord];
    }

    // Reconstruct formattedHeadline with [yellow] tags
    const words = card.headline.split(/\s+/).filter(Boolean);
    const formatted = words
      .map((w) => {
        const wClean = w.replace(/[.,:;!?]/g, '');
        if (newHighlights.some((nh) => nh.toLowerCase() === wClean.toLowerCase())) {
          return `[yellow]${w}[/yellow]`;
        }
        return w;
      })
      .join(' ');

    onChange({
      highlightWords: newHighlights,
      formattedHeadline: formatted,
    });
  };

  return (
    <div className="space-y-6">
      {/* Mobile Step Navigator Bar (Scrolls left-to-right) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-yellow-400" />
            <span>एडिटर स्टेप्स (स्टेप {activeStep} / 5)</span>
          </span>
          {/* Mobile view mode toggle */}
          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
            <button
              type="button"
              onClick={() => setMobileViewMode('steps')}
              className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                mobileViewMode === 'steps'
                  ? 'bg-yellow-400 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ↔️ स्लाइड मोड
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('all')}
              className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                mobileViewMode === 'all'
                  ? 'bg-yellow-400 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ↕️ सभी बॉक्सेस
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Step Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {STEPS.map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                setActiveStep(s.step);
                const el = document.getElementById(s.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                activeStep === s.step
                  ? 'bg-yellow-400 text-neutral-950 shadow-md ring-1 ring-yellow-300'
                  : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. फ्रेम टेम्पलेट्स (हेडर स्टाइल चुनें) - STEP 1 */}
      <div
        id="step-frame"
        className={`bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4 ${
          mobileViewMode === 'steps' && activeStep !== 1 ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-yellow-400" />
            स्टेप 1: फ्रेम टेम्पलेट्स (हेडर स्टाइल चुनें)
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            {FRAME_OPTIONS.find((f) => (card.frameDesign || 'jacket-original') === f.id)?.name || 'फ्रेम स्टाइल'}
          </span>
        </div>

        {/* 5 Frame Designs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {FRAME_OPTIONS.map((f) => {
            const isSelected = (card.frameDesign || 'jacket-original') === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ frameDesign: f.id })}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-500/15 text-white shadow-md ring-1 ring-yellow-400/40'
                    : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wide">{f.name}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-yellow-400 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {f.badge}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 line-clamp-2">
                  {f.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom PNG Frame dedicated panel - ONLY active when custom-png is selected */}
        {card.frameDesign === 'custom-png' && (
          <div className="p-3.5 bg-neutral-950 border border-yellow-500/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                कस्टम ट्रांसपेरेंट PNG फ्रेम (Full Overlay):
              </span>
              {card.customFrameOverlayPng ? (
                <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  ✅ सक्रिय है
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400">
                  कोई फ्रेम नहीं
                </span>
              )}
            </div>

            {card.customFrameOverlayPng && (
              <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={card.customFrameOverlayPng}
                    alt="Custom Frame Preview"
                    className="w-12 h-14 object-contain bg-black/50 rounded border border-neutral-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">आपकी कस्टम फ्रेम लोड है</p>
                    <p className="text-[10px] text-neutral-400">यह केवल इसी टेम्पलेट में दिखेगी</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ customFrameOverlayPng: undefined })}
                  className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold border border-red-500/30 transition-all flex items-center gap-1 cursor-pointer"
                  title="कस्टम फ्रेम हटाएं"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>हटाएं / ऑफ करें</span>
                </button>
              </div>
            )}

            <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-neutral-700 hover:border-yellow-500 rounded-lg cursor-pointer text-xs text-neutral-300 bg-neutral-900/80 hover:bg-neutral-900 transition-all">
              <Upload className="w-3.5 h-3.5 text-yellow-400" />
              <span>
                {card.customFrameOverlayPng
                  ? 'नई फ्रेम PNG अपलोड करके बदलें'
                  : 'अपनी बनाई ट्रांसपेरेंट PNG फ्रेम अपलोड करें'}
              </span>
              <input
                type="file"
                accept="image/png,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFrameOverlayUpload(f);
                }}
              />
            </label>

            {/* Toggles for custom-png mode */}
            <div className="pt-2 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    hideDefaultHeaderInCustomFrame: !card.hideDefaultHeaderInCustomFrame,
                  })
                }
                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  card.hideDefaultHeaderInCustomFrame
                    ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                }`}
              >
                <span>डिफ़ॉल्ट हेडर बंद रखें</span>
                <span className="text-[10px] font-bold">
                  {card.hideDefaultHeaderInCustomFrame ? 'हां (छिपा है)' : 'नहीं'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    hideDefaultFooterInCustomFrame: !card.hideDefaultFooterInCustomFrame,
                  })
                }
                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  card.hideDefaultFooterInCustomFrame
                    ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                }`}
              >
                <span>डिफ़ॉल्ट फुटर बंद रखें</span>
                <span className="text-[10px] font-bold">
                  {card.hideDefaultFooterInCustomFrame ? 'हां (छिपा है)' : 'नहीं'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Template specific fields for Quote */}
        {card.frameDesign === 'jacket-quote' && (
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2.5">
            <span className="text-xs font-bold text-yellow-400">
              ❝ बयान / कोटेशन विशेष सेटिंग्स:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  वक्ता / नेता का नाम:
                </label>
                <input
                  type="text"
                  value={card.speakerName || ''}
                  onChange={(e) => onChange({ speakerName: e.target.value })}
                  placeholder="उदा. राहुल गांधी / नरेंद्र मोदी"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  पद / पदवी / स्थान:
                </label>
                <input
                  type="text"
                  value={card.speakerTitle || ''}
                  onChange={(e) => onChange({ speakerTitle: e.target.value })}
                  placeholder="उदा. कांग्रेस नेता / मुख्यमंत्री"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Template specific fields for Super Breaking */}
        {card.frameDesign === 'jacket-breaking-red' && (
          <div className="p-3.5 bg-neutral-950 border border-red-500/40 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-400 flex items-center gap-1.5">
                ⚡ सुपर ब्रेकिंग विशेष सेटिंग्स
              </span>
              <span className="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                एक्सक्लूसिव लेआउट
              </span>
            </div>

            {/* 1. BREAKING NEWS Ribbon Style Gallery (5+ Built-in + Saved Custom) */}
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">⚡</span>
                  <span className="text-xs font-bold text-white">
                    BREAKING NEWS रिबन स्टाइल (5+ ऑप्शन्स)
                  </span>
                </div>
                {card.customBreakingRibbonPng && card.customBreakingRibbonPng !== '/assets/breaking_news_ribbon.svg' && (
                  <button
                    type="button"
                    onClick={() => onChange({ customBreakingRibbonPng: undefined })}
                    className="text-[10px] text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    डिफ़ॉल्ट रिबन
                  </button>
                )}
              </div>

              {/* Grid of All Ribbons (Built-in + User Saved) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[...BUILTIN_RIBBONS, ...savedRibbons].map((ribbon) => {
                  const isSelected =
                    (!card.customBreakingRibbonPng && ribbon.id === 'speed-blue-red') ||
                    card.customBreakingRibbonPng === ribbon.url;

                  return (
                    <div
                      key={ribbon.id}
                      onClick={() => onChange({ customBreakingRibbonPng: ribbon.url })}
                      className={`relative p-2 rounded-lg border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-red-500 bg-red-950/30 shadow-md ring-1 ring-red-500/50'
                          : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-neutral-200 truncate">
                          {ribbon.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {ribbon.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = deleteCustomRibbon(ribbon.id);
                                setSavedRibbons(updated);
                                if (card.customBreakingRibbonPng === ribbon.url) {
                                  onChange({ customBreakingRibbonPng: undefined });
                                }
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                              title="यह सेव किया रिबन हटाएं"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          )}
                        </div>
                      </div>
                      <div className="w-full h-8 bg-neutral-950 rounded flex items-center justify-center p-1 border border-neutral-800/80 overflow-hidden">
                        <img
                          src={ribbon.url}
                          alt={ribbon.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upload & Save Custom Ribbon Option */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 block">
                  + नया रिबन अपलोड करके सेव करें (Saved Ribbons):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRibbonName}
                    onChange={(e) => setNewRibbonName(e.target.value)}
                    placeholder="रिबन का नाम (उदा. स्पेशल प्राइम)"
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                  />
                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-lg cursor-pointer text-xs font-bold transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>अपलोड व सेव</span>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          if (dataUrl) {
                            const updated = saveCustomRibbon(
                              newRibbonName.trim() || file.name.replace(/\.[^/.]+$/, ''),
                              dataUrl
                            );
                            setSavedRibbons(updated);
                            setNewRibbonName('');
                            onChange({ customBreakingRibbonPng: dataUrl });
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Ribbon Position & Scale is now locked in fixed space per user command */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  रिबन स्पेसिंग:
                </span>
                <span className="text-emerald-400 font-bold">
                  फिक्स स्पेस में लॉक (संतुलित)
                </span>
              </div>
            </div>

            {/* 2. Exclusive News Watermark Feature (Custom Opacity) */}
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🔒</span>
                  <span className="text-xs font-bold text-white">
                    एक्सक्लूसिव न्यूज़ वॉटरमार्क (फोटो सुरक्षा)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      showSuperBreakingWatermark: !card.showSuperBreakingWatermark,
                    })
                  }
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    card.showSuperBreakingWatermark
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {card.showSuperBreakingWatermark
                    ? `✅ सक्रिय (${Math.round((card.breakingWatermarkOpacity ?? 0.15) * 100)}% ओपेसिटी)`
                    : 'बंद है (ऑफ)'}
                </button>
              </div>

              {card.showSuperBreakingWatermark && (
                <div className="pt-2 border-t border-neutral-800 space-y-2.5">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">
                      वॉटरमार्क टेक्स्ट:
                    </label>
                    <input
                      type="text"
                      value={card.breakingWatermarkText || '⚡ सुपर ब्रेकिंग'}
                      onChange={(e) => onChange({ breakingWatermarkText: e.target.value })}
                      placeholder="⚡ सुपर ब्रेकिंग"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                      <span>कस्टम ओपेसिटी (हल्कापन / गाढ़ापन):</span>
                      <span className="text-white font-bold font-mono">
                        {Math.round((card.breakingWatermarkOpacity ?? 0.15) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.45"
                      step="0.01"
                      value={card.breakingWatermarkOpacity ?? 0.15}
                      onChange={(e) =>
                        onChange({ breakingWatermarkOpacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-red-500 cursor-pointer h-1.5 bg-neutral-800 rounded"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-500 mt-0.5">
                      <span>5% (बेहद हल्का)</span>
                      <span>15% (स्टैंडर्ड)</span>
                      <span>45% (गाढ़ा)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-relaxed">
                    यह वॉटरमार्क आपकी चुनी हुई ओपेसिटी में तिरछी (डायगोनल) पंक्तियों में पूरी फोटो पर दिखेगा ताकि कोई अन्य मीडिया आपकी एक्सक्लूसिव खबर या फोटो को चुरा न सके।
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template specific fields for Investigation */}
        {card.frameDesign === 'jacket-investigation' && (
          <div className="p-3 bg-neutral-950 border border-amber-500/30 rounded-lg space-y-2">
            <span className="text-xs font-bold text-amber-400">
              🔍 विशेष पड़ताल सेटिंग्स:
            </span>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                पड़ताल शीर्षक / केस नंबर:
              </label>
              <input
                type="text"
                value={card.investigationCaseNumber || 'INVESTIGATION REPORT'}
                onChange={(e) => onChange({ investigationCaseNumber: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 1 Mobile Next Button */}
        {mobileViewMode === 'steps' && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 1 / 5</span>
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <span>अगला: AI टूल्स</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. AI Actions Row (URL to News & Gemini Pro Photo Analysis) */}
      <div
        id="step-ai"
        className={`bg-gradient-to-r from-neutral-900 to-neutral-950 border border-yellow-500/20 rounded-xl p-3.5 space-y-3 ${
          mobileViewMode === 'steps' && activeStep !== 2 ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            स्टेप 2: AI ऑटोमेशन टूल्स (Automated News Generation)
          </span>
          <span className="text-[10px] font-bold bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full">
            Gemini AI Integrated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 1. Link or Command URL */}
          <button
            type="button"
            onClick={onOpenCommandModal}
            className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-850 hover:from-neutral-750 hover:to-neutral-800 text-left border border-yellow-500/30 hover:border-yellow-400 text-white transition-all cursor-pointer shadow-md group"
          >
            <div className="w-8 h-8 rounded-lg bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                <span>न्यूज़ लिंक से ऑटोमैटिक बनाएं</span>
                <span className="bg-yellow-400 text-neutral-950 text-[9px] font-extrabold px-1 rounded">URL</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
                न्यूज़ लिंक डालें — AI स्वतः हेडलाइन, हाइलाइट्स व वेबसाइट से फोटो पिक करके कार्ड में लगा देगा
              </p>
            </div>
          </button>

          {/* 2. Headline to AI Photo */}
          <button
            type="button"
            onClick={onOpenAIAnalyze}
            className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-950/40 to-neutral-900 hover:from-amber-900/50 hover:to-neutral-850 text-left border border-amber-500/30 hover:border-amber-400 text-white transition-all cursor-pointer shadow-md group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-yellow-300 border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                <span>हेडलाइन देखकर AI फोटो बनाएं</span>
                <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 text-[9px] font-black px-1 rounded">AI Photo</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
                हेडलाइन को पढ़कर AI तुरंत उसके अनुसार उच्च-गुणवत्ता वाली बैकग्राउंड फोटो तैयार कर देगा
              </p>
            </div>
          </button>
        </div>

        {/* Step 2 Mobile Nav Buttons */}
        {mobileViewMode === 'steps' && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>पिछला: फ्रेम</span>
            </button>
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 2 / 5</span>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <span>अगला: हेडर-फुटर</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Header PNG & Footer PNG Controls ("जैकेट हेडर व फुटर") */}
      <div
        id="step-jacket"
        className={`bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4 ${
          mobileViewMode === 'steps' && activeStep !== 3 ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-yellow-400" />
            स्टेप 3: जैकेट हेडर एवं फुटर पीएनजी (Header & Footer PNG)
          </span>
          <span className="text-xs text-yellow-400 font-medium">
            {card.customHeaderPng ? '✅ कस्टम हेडर एक्टिव' : 'डिफ़ॉल्ट हेडर'}
          </span>
        </div>

        {/* Upload Custom Header PNG (e.g. IMAGE NEWS.png) */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>हेडर पीएनजी (Head Space PNG):</span>
                {card.customHeaderPng ? (
                  <span className="bg-green-950 text-green-400 border border-green-700/50 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    कस्टम PNG एक्टिव
                  </span>
                ) : (
                  <span className="bg-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 rounded-full">
                    डिफ़ॉल्ट हेडर
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                लोगो और जैकेट कर्व्स वाला अपना PNG हेडर यहां अपलोड करें
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Header Lock Toggle */}
              <button
                type="button"
                onClick={() => onChange({ lockHeader: !card.lockHeader })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  card.lockHeader
                    ? 'bg-amber-500/20 text-yellow-300 border-amber-500/60 shadow-sm'
                    : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
                title={card.lockHeader ? 'हेडर लॉक खोलें (Unlock)' : 'हेडर डिज़ाइन लॉक करें (Lock)'}
              >
                {card.lockHeader ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-yellow-400" />
                    <span>हेडर लॉक है</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>हेडर लॉक करें</span>
                  </>
                )}
              </button>

              {!card.lockHeader ? (
                <>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold rounded-lg text-xs cursor-pointer shadow transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{card.customHeaderPng ? 'हेडर PNG बदलें' : 'हेडर PNG अपलोड करें'}</span>
                    <input
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleHeaderUpload(f);
                      }}
                    />
                  </label>

                  {card.customHeaderPng && (
                    <button
                      type="button"
                      onClick={() => onChange({ customHeaderPng: undefined })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-all cursor-pointer"
                      title="डिफ़ॉल्ट हेडर पर रीसेट करें"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>रीसेट</span>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  🔒 सुरक्षित है
                </span>
              )}
            </div>
          </div>

          {/* Header Preview Thumbnail if custom uploaded */}
          {card.customHeaderPng && (
            <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={card.customHeaderPng}
                  alt="Custom Header Preview"
                  className="h-9 w-auto max-w-[140px] object-contain bg-black/40 rounded border border-neutral-700"
                />
                <span className="text-xs text-neutral-300 font-medium">
                  आपकी हेडर PNG सफलता से जोड़ी गई है {card.lockHeader && '(लॉक स्थिति में)'}
                </span>
              </div>
              <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> लागू है
              </span>
            </div>
          )}
        </div>

        {/* Upload Custom Footer PNG (e.g. Footer.png) */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>फुटर पीएनजी (Footer PNG):</span>
                {card.customFooterPng ? (
                  <span className="bg-green-950 text-green-400 border border-green-700/50 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    कस्टम PNG एक्टिव
                  </span>
                ) : (
                  <span className="bg-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 rounded-full">
                    डिफ़ॉल्ट फुटर
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                सोशल हैंडल्स और ब्रांडिंग वाला अपना फुटर PNG यहां अपलोड करें
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Footer Lock Toggle */}
              <button
                type="button"
                onClick={() => onChange({ lockFooter: !card.lockFooter })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  card.lockFooter
                    ? 'bg-amber-500/20 text-yellow-300 border-amber-500/60 shadow-sm'
                    : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
                title={card.lockFooter ? 'फुटर लॉक खोलें (Unlock)' : 'फुटर डिज़ाइन लॉक करें (Lock)'}
              >
                {card.lockFooter ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-yellow-400" />
                    <span>फुटर लॉक है</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>फुटर लॉक करें</span>
                  </>
                )}
              </button>

              {!card.lockFooter ? (
                <>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold rounded-lg text-xs cursor-pointer shadow transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{card.customFooterPng ? 'फुटर PNG बदलें' : 'फुटर PNG अपलोड करें'}</span>
                    <input
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFooterUpload(f);
                      }}
                    />
                  </label>

                  {card.customFooterPng && (
                    <button
                      type="button"
                      onClick={() => onChange({ customFooterPng: undefined })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-all cursor-pointer"
                      title="डिफ़ॉल्ट फुटर पर रीसेट करें"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>रीसेट</span>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  🔒 सुरक्षित है
                </span>
              )}
            </div>
          </div>

          {/* Footer Preview Thumbnail if custom uploaded */}
          {card.customFooterPng && (
            <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={card.customFooterPng}
                  alt="Custom Footer Preview"
                  className="h-8 w-auto max-w-[140px] object-contain bg-white rounded border border-neutral-700"
                />
                <span className="text-xs text-neutral-300 font-medium">
                  आपकी फुटर PNG सफलता से जोड़ी गई है {card.lockFooter && '(लॉक स्थिति में)'}
                </span>
              </div>
              <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> लागू है
              </span>
            </div>
          )}
        </div>

        {/* Step 3 Mobile Nav Buttons */}
        {mobileViewMode === 'steps' && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>पिछला: AI टूल्स</span>
            </button>
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 3 / 5</span>
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <span>अगला: फोटो लेआउट</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. Photo Upload & Layout Configuration */}
      <div
        id="step-layout"
        className={`bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4 ${
          mobileViewMode === 'steps' && activeStep !== 4 ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-yellow-400" />
            स्टेप 4: फोटो लेआउट चुनें ("जैकेट" फ्रेम)
          </span>
          <span className="text-xs text-yellow-400 font-medium">
            {card.layout === 'single'
              ? '1 फोटो (सिंगल)'
              : card.layout === 'split-v'
              ? '2 फोटो (35-65 अप & डाउन)'
              : card.layout === 'double'
              ? '2 फोटो (50-50 अप & डाउन)'
              : card.layout === 'double-h' || card.layout === 'split-h'
              ? '2 फोटो (लेफ्ट-राइट)'
              : card.layout === 'grid-3'
              ? '3 फोटो (2 ऊपर, 1 नीचे)'
              : card.layout === 'grid-3-bottom'
              ? '3 फोटो (1 ऊपर, 2 नीचे)'
              : card.layout === 'grid-4'
              ? '4 फोटो (2 ऊपर, 2 नीचे ग्रिड)'
              : card.layout === 'full'
              ? 'फुल स्क्रीन इमेज'
              : 'गोल सर्कल (सर्कल पोर्ट्रेट)'}
          </span>
        </div>

        {/* Layout Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            { id: 'single' as CardLayout, label: '1 इमेज', sub: 'सिंगल फुल' },
            { id: 'split-v' as CardLayout, label: '2 इमेज (35-65)', sub: '35% ऊपर, 65% नीचे' },
            { id: 'double' as CardLayout, label: '2 इमेज (50-50)', sub: '50% ऊपर, 50% नीचे' },
            { id: 'double-h' as CardLayout, label: '2 इमेज (L-R)', sub: 'लेफ्ट-राइट 50-50' },
            { id: 'grid-3' as CardLayout, label: '3 इमेज (2-1)', sub: '2 ऊपर, 1 नीचे' },
            { id: 'grid-3-bottom' as CardLayout, label: '3 इमेज (1-2)', sub: '1 ऊपर, 2 नीचे' },
            { id: 'grid-4' as CardLayout, label: '4 इमेज (2x2)', sub: '2 ऊपर, 2 नीचे ग्रिड' },
            { id: 'inset-circle' as CardLayout, label: 'गोल सर्कल', sub: 'सर्कल पोर्ट्रेट' },
          ].map((l) => {
            const isSelected =
              card.layout === l.id ||
              (l.id === 'double-h' && card.layout === 'split-h');
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onChange({ layout: l.id })}
                className={`py-2 px-2 rounded-lg text-xs font-bold border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300 shadow-sm'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span>{l.label}</span>
                <span className="text-[10px] font-normal opacity-80">{l.sub}</span>
              </button>
            );
          })}
        </div>

        {/* Layout specific tips */}
        {card.layout === 'split-v' && (
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200 flex items-center justify-between">
            <span>✨ 35-65 अप-डाउन मोड: 35% ऊपर इमेज (Top), 65% नीचे इमेज (Bottom) - नीचे की फोटो पूरी तरह साफ़ दिखेगी!</span>
            <span className="text-[11px] font-bold bg-yellow-500 text-neutral-950 px-2 py-0.5 rounded">
              35-65 Ratio
            </span>
          </div>
        )}

        {card.layout === 'double' && (
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200 flex items-center justify-between">
            <span>✨ 50-50 अप-डाउन मोड: 50% आधी फोटो ऊपर, 50% आधी फोटो नीचे।</span>
            <span className="text-[11px] font-bold bg-yellow-500 text-neutral-950 px-2 py-0.5 rounded">
              50-50 Ratio
            </span>
          </div>
        )}

        {(card.layout === 'double-h' || card.layout === 'split-h') && (
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200 flex items-center justify-between">
            <span>✨ 50-50 लेफ्ट-राइट मोड: आधी फोटो बाईं तरफ, आधी फोटो दाईं तरफ।</span>
            <span className="text-[11px] font-bold bg-yellow-500 text-neutral-950 px-2 py-0.5 rounded">
              Side-by-Side
            </span>
          </div>
        )}

        {card.layout === 'grid-3' && (
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200 flex items-center justify-between">
            <span>✨ 3 फोटो मोड (2 ऊपर, 1 नीचे): 2 फोटो ऊपर (लेफ्ट-राइट), 1 चौड़ी फोटो नीचे।</span>
          </div>
        )}

        {card.layout === 'grid-3-bottom' && (
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200 flex items-center justify-between">
            <span>✨ 3 फोटो मोड (1 ऊपर, 2 नीचे): 1 चौड़ी फोटो ऊपर, 2 फोटो नीचे (लेफ्ट-राइट)।</span>
          </div>
        )}

        {card.layout === 'grid-4' && (
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200 flex items-center justify-between">
            <span>✨ 4 फोटो मोड (2x2 ग्रिड): 2 फोटो ऊपर (लेफ्ट-राइट), 2 फोटो नीचे (लेफ्ट-राइट)।</span>
            <span className="text-[11px] font-bold bg-yellow-500 text-neutral-950 px-2 py-0.5 rounded">
              4 Photos 2x2
            </span>
          </div>
        )}

        {card.layout === 'inset-circle' && (
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200 flex items-center justify-between">
            <span>✨ राउंड सर्कल मोड: मुख्य बैकग्राउंड फोटो + गोल कटआउट (सर्कल पोर्ट्रेट फोटो)।</span>
            <span className="text-[11px] font-bold bg-yellow-500 text-neutral-950 px-2 py-0.5 rounded">
              Round Circle
            </span>
          </div>
        )}

        {/* Upload Buttons according to selected layout */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-3">
          <div className="text-xs font-semibold text-neutral-300">
            तस्वीरें अपलोड करें:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Photo 1 */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
              <div className="text-[11px] font-bold text-neutral-300 flex items-center justify-between">
                <span>
                  {card.layout === 'single' || card.layout === 'full'
                    ? 'मुख्य फोटो (Single Photo)'
                    : card.layout === 'split-v'
                    ? 'पहली फोटो (35% ऊपर - Top)'
                    : card.layout === 'double'
                    ? 'पहली फोटो (50% ऊपर - Top)'
                    : card.layout === 'double-h' || card.layout === 'split-h'
                    ? 'पहली फोटो (50% बाईं - Left Half)'
                    : card.layout === 'grid-3' || card.layout === 'grid-4'
                    ? 'पहली फोटो (ऊपर बाईं - Top Left)'
                    : card.layout === 'grid-3-bottom'
                    ? 'पहली फोटो (ऊपर चौड़ी - Top Wide)'
                    : 'मुख्य बैकग्राउंड फोटो (Background)'}
                </span>
                <span className="text-yellow-400 text-[10px] font-bold">अनिवार्य</span>
              </div>

              {/* Current photo preview thumbnail */}
              {card.images.main && (
                <div className="flex items-center gap-2.5 bg-neutral-900/80 p-2 rounded border border-neutral-800">
                  <img
                    src={card.images.main}
                    alt="Photo 1 preview"
                    className="w-12 h-12 object-cover rounded border border-neutral-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-green-400 font-semibold truncate flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-400" /> फोटो एक्टिव है
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">लाइव कार्ड पर दिख रही है</p>
                  </div>
                </div>
              )}

              <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-yellow-500/50 hover:border-yellow-400 rounded-md cursor-pointer text-xs text-yellow-300 font-bold hover:text-white bg-yellow-500/10 hover:bg-yellow-500/20 transition-all">
                <Upload className="w-3.5 h-3.5 text-yellow-400" />
                <span>{card.images.main ? 'नई फोटो अपलोड / बदलें' : 'फोटो अपलोड करें'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload('main', f);
                  }}
                />
              </label>
            </div>

            {/* Photo 2 (for double, split-v, double-h, grid-3, grid-3-bottom, grid-4) */}
            {(card.layout === 'double' ||
              card.layout === 'split-v' ||
              card.layout === 'double-h' ||
              card.layout === 'split-h' ||
              card.layout === 'grid-3' ||
              card.layout === 'grid-3-bottom' ||
              card.layout === 'grid-4') && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
                <div className="text-[11px] font-bold text-neutral-300 flex items-center justify-between">
                  <span>
                    {card.layout === 'split-v'
                      ? 'दूसरी फोटो (65% नीचे - Bottom)'
                      : card.layout === 'double'
                      ? 'दूसरी फोटो (50% नीचे - Bottom)'
                      : card.layout === 'double-h' || card.layout === 'split-h'
                      ? 'दूसरी फोटो (50% दाईं - Right Half)'
                      : card.layout === 'grid-3' || card.layout === 'grid-4'
                      ? 'दूसरी फोटो (ऊपर दाईं - Top Right)'
                      : 'दूसरी फोटो (नीचे बाईं - Bottom Left)'}
                  </span>
                </div>

                {card.images.second && (
                  <div className="flex items-center gap-2.5 bg-neutral-900/80 p-2 rounded border border-neutral-800">
                    <img
                      src={card.images.second}
                      alt="Photo 2 preview"
                      className="w-12 h-12 object-cover rounded border border-neutral-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-green-400 font-semibold truncate flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-400" /> फोटो 2 एक्टिव है
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">लाइव कार्ड पर दिख रही है</p>
                    </div>
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-neutral-700 hover:border-yellow-500 rounded-md cursor-pointer text-xs text-neutral-400 hover:text-white bg-neutral-900/50 transition-all">
                  <Upload className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{card.images.second ? 'फोटो 2 बदलें' : 'फोटो 2 अपलोड करें'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload('second', f);
                    }}
                  />
                </label>
              </div>
            )}

            {/* Photo 3 (for grid-3, grid-3-bottom, grid-4) */}
            {(card.layout === 'grid-3' || card.layout === 'grid-3-bottom' || card.layout === 'grid-4') && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
                <div className="text-[11px] font-bold text-neutral-300 flex items-center justify-between">
                  <span>
                    {card.layout === 'grid-3'
                      ? 'तीसरी फोटो (नीचे चौड़ी - Bottom Wide)'
                      : card.layout === 'grid-4'
                      ? 'तीसरी फोटो (नीचे बाईं - Bottom Left)'
                      : 'तीसरी फोटो (नीचे दाईं - Bottom Right)'}
                  </span>
                </div>

                {card.images.third && (
                  <div className="flex items-center gap-2.5 bg-neutral-900/80 p-2 rounded border border-neutral-800">
                    <img
                      src={card.images.third}
                      alt="Photo 3 preview"
                      className="w-12 h-12 object-cover rounded border border-neutral-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-green-400 font-semibold truncate flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-400" /> फोटो 3 एक्टिव है
                      </p>
                    </div>
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-neutral-700 hover:border-neutral-500 rounded-md cursor-pointer text-xs text-neutral-400 hover:text-white bg-neutral-900/50 transition-all">
                  <Upload className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{card.images.third ? 'फोटो 3 बदलें' : 'फोटो 3 अपलोड करें'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload('third', f);
                    }}
                  />
                </label>
              </div>
            )}

            {/* Photo 4 (for grid-4) */}
            {card.layout === 'grid-4' && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <div className="text-[11px] font-bold text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>चौथी फोटो (नीचे दाईं - Bottom Right)</span>
                </div>
                <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-neutral-700 hover:border-neutral-500 rounded-md cursor-pointer text-xs text-neutral-400 hover:text-white bg-neutral-900/50 transition-all">
                  <Upload className="w-3.5 h-3.5 text-yellow-400" />
                  <span>फोटो 4 अपलोड करें</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload('fourth', f);
                    }}
                  />
                </label>
              </div>
            )}

            {/* Inset Circle Photo (for inset-circle) */}
            {card.layout === 'inset-circle' && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <div className="text-[11px] font-bold text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>सर्कल इनसेट फोटो (नेता/अधिकारी/छात्र)</span>
                </div>
                <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-neutral-700 hover:border-neutral-500 rounded-md cursor-pointer text-xs text-neutral-400 hover:text-white bg-neutral-900/50 transition-all">
                  <CircleDot className="w-3.5 h-3.5 text-yellow-400" />
                  <span>सर्कल फोटो अपलोड करें</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload('insetCircle', f);
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* If Inset Circle: Position Controls */}
          {card.layout === 'inset-circle' && (
            <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80 space-y-3 text-xs">
              <div className="font-semibold text-neutral-300 flex items-center justify-between">
                <span>सर्कल फोटो की पोजीशन (X & Y Slider):</span>
                <span className="text-neutral-500">
                  X: {card.insetPosition.x}% | Y: {card.insetPosition.y}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400">दाएं - बाएं (X):</label>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={card.insetPosition.x}
                    onChange={(e) =>
                      onChange({
                        insetPosition: {
                          ...card.insetPosition,
                          x: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400">ऊपर - नीचे (Y):</label>
                  <input
                    type="range"
                    min="15"
                    max="80"
                    value={card.insetPosition.y}
                    onChange={(e) =>
                      onChange({
                        insetPosition: {
                          ...card.insetPosition,
                          y: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-yellow-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3.1 Photo Crop & Move Controls (Left, Right, Center, Up, Down, Zoom) */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-3.5 space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-yellow-400" />
                फोटो क्रॉप व स्थिति (Photo Crop & Move / Position)
              </span>
              <button
                type="button"
                onClick={() =>
                  updateCrop(activeCropPhotoKey, { x: 50, y: 50, zoom: 1 })
                }
                className="text-[11px] text-neutral-400 hover:text-yellow-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="डिफ़ॉल्ट सेंटर पर रीसेट करें"
              >
                <RotateCcw className="w-3 h-3" />
                <span>रीसेट (Center)</span>
              </button>
            </div>

            {/* Tabs if layout has multiple photos */}
            {availableCropPhotos.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
                {availableCropPhotos.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActiveCropPhotoKey(p.key)}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      activeCropPhotoKey === p.key
                        ? 'bg-yellow-400 text-neutral-950 shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Alignment Presets */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-neutral-400 flex items-center justify-between">
                <span>त्वरित अलाइनमेंट (Quick Presets):</span>
                <span className="text-[10px] text-yellow-400 font-mono">
                  X: {currentCrop.x}% | Y: {currentCrop.y}% | ज़ूम: {Math.round((currentCrop.zoom || 1) * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateCrop(activeCropPhotoKey, { x: 0 })}
                  className={`px-1.5 py-1.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                    currentCrop.x === 0
                      ? 'bg-yellow-400 text-neutral-950 border-yellow-400 font-extrabold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="बायां भाग दिखाएं"
                >
                  ⬅️ बायां (Left)
                </button>
                <button
                  type="button"
                  onClick={() => updateCrop(activeCropPhotoKey, { x: 50, y: 50 })}
                  className={`px-1.5 py-1.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                    currentCrop.x === 50 && currentCrop.y === 50
                      ? 'bg-yellow-400 text-neutral-950 border-yellow-400 font-extrabold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="सेंटर में रखें"
                >
                  ⏺️ सेंटर (Center)
                </button>
                <button
                  type="button"
                  onClick={() => updateCrop(activeCropPhotoKey, { x: 100 })}
                  className={`px-1.5 py-1.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                    currentCrop.x === 100
                      ? 'bg-yellow-400 text-neutral-950 border-yellow-400 font-extrabold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="दायां भाग दिखाएं"
                >
                  ➡️ दायां (Right)
                </button>
                <button
                  type="button"
                  onClick={() => updateCrop(activeCropPhotoKey, { y: 0 })}
                  className={`px-1.5 py-1.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                    currentCrop.y === 0
                      ? 'bg-yellow-400 text-neutral-950 border-yellow-400 font-extrabold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="ऊपरी भाग दिखाएं"
                >
                  ⬆️ ऊपर (Top)
                </button>
                <button
                  type="button"
                  onClick={() => updateCrop(activeCropPhotoKey, { y: 100 })}
                  className={`px-1.5 py-1.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                    currentCrop.y === 100
                      ? 'bg-yellow-400 text-neutral-950 border-yellow-400 font-extrabold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="निचला भाग दिखाएं"
                >
                  ⬇️ नीचे (Bottom)
                </button>
              </div>
            </div>

            {/* Horizontal Position Slider (Left - Right) */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span className="font-medium">
                  दाएं ⟷ बाएं मूव करें (Horizontal Move):
                </span>
                <span className="font-bold text-yellow-400 text-[10px]">
                  {currentCrop.x}%{' '}
                  {currentCrop.x <= 30
                    ? '(बाईं ओर)'
                    : currentCrop.x >= 70
                    ? '(दाईं ओर)'
                    : '(सेंटर)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateCrop(activeCropPhotoKey, {
                      x: Math.max(0, currentCrop.x - 5),
                    })
                  }
                  className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 font-bold"
                  title="5% बाईं ओर"
                >
                  ◀
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentCrop.x}
                  onChange={(e) =>
                    updateCrop(activeCropPhotoKey, { x: Number(e.target.value) })
                  }
                  className="flex-1 accent-yellow-400 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateCrop(activeCropPhotoKey, {
                      x: Math.min(100, currentCrop.x + 5),
                    })
                  }
                  className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 font-bold"
                  title="5% दाईं ओर"
                >
                  ▶
                </button>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                <span>0% (पूरा बायां)</span>
                <span>50% (सेंटर)</span>
                <span>100% (पूरा दायां)</span>
              </div>
            </div>

            {/* Vertical Position Slider (Up - Down) */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span className="font-medium">
                  ऊपर ⟷ नीचे मूव करें (Vertical Move):
                </span>
                <span className="font-bold text-yellow-400 text-[10px]">
                  {currentCrop.y}%{' '}
                  {currentCrop.y <= 30
                    ? '(ऊपर)'
                    : currentCrop.y >= 70
                    ? '(नीचे)'
                    : '(सेंटर)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateCrop(activeCropPhotoKey, {
                      y: Math.max(0, currentCrop.y - 5),
                    })
                  }
                  className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 font-bold"
                  title="5% ऊपर"
                >
                  ▲
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentCrop.y}
                  onChange={(e) =>
                    updateCrop(activeCropPhotoKey, { y: Number(e.target.value) })
                  }
                  className="flex-1 accent-yellow-400 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateCrop(activeCropPhotoKey, {
                      y: Math.min(100, currentCrop.y + 5),
                    })
                  }
                  className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 font-bold"
                  title="5% नीचे"
                >
                  ▼
                </button>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                <span>0% (पूरा ऊपर)</span>
                <span>50% (सेंटर)</span>
                <span>100% (पूरा नीचे)</span>
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span className="font-medium flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-yellow-400" />
                  फोटो ज़ूम / साइज (Zoom In):
                </span>
                <span className="font-bold text-yellow-400 text-[10px]">
                  {Math.round((currentCrop.zoom || 1) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateCrop(activeCropPhotoKey, {
                      zoom: Math.max(1, Number(((currentCrop.zoom || 1) - 0.1).toFixed(2))),
                    })
                  }
                  className="px-2.5 py-0.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 font-bold"
                  title="ज़ूम कम करें"
                >
                  -
                </button>
                <input
                  type="range"
                  min="100"
                  max="250"
                  step="5"
                  value={Math.round((currentCrop.zoom || 1) * 100)}
                  onChange={(e) =>
                    updateCrop(activeCropPhotoKey, {
                      zoom: Number(e.target.value) / 100,
                    })
                  }
                  className="flex-1 accent-yellow-400 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateCrop(activeCropPhotoKey, {
                      zoom: Math.min(2.5, Number(((currentCrop.zoom || 1) + 0.1).toFixed(2))),
                    })
                  }
                  className="px-2.5 py-0.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 font-bold"
                  title="ज़ूम बढ़ाएं"
                >
                  +
                </button>
              </div>
            </div>

            <p className="text-[10px] text-neutral-500 leading-normal pt-1 border-t border-neutral-900">
              💡 <b>सुझाव:</b> अगर फोटो का कोई महत्वपूर्ण व्यक्ति या वस्तु किनारे पर कट रही है, तो बाएं/दाएं स्लाइडर से फोटो को मूव करें।
            </p>
          </div>
        </div>

        {/* Step 4 Mobile Nav Buttons */}
        {mobileViewMode === 'steps' && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>पिछला: हेडर-फुटर</span>
            </button>
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 4 / 5</span>
            <button
              type="button"
              onClick={() => setActiveStep(5)}
              className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <span>अगला: हेडलाइन</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Headline & Keyword Highlights (Permanent Fixed Space at Lower Section) */}
      <div
        id="step-headline"
        className={`bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4 ${
          mobileViewMode === 'steps' && activeStep !== 5 ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-yellow-400" />
            स्टेप 5: 3-लाइन कैप्शन हेडलाइन (Permanent News Caption)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
              फ़ॉन्ट: Baloo 2 (बालू)
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">
              अधिकतम 3 लाइनें
            </span>
          </div>
        </div>

        {/* Headline Line Formatting Helpers & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const raw = (card.headline || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
                if (!raw) return;
                const words = raw.split(' ').filter(Boolean);
                if (words.length < 3) return;

                let break1 = -1;
                for (let i = 0; i < words.length - 2; i++) {
                  if (words[i].endsWith(':') || words[i].endsWith(';') || words[i] === ':' || words[i] === '-') {
                    break1 = i + 1;
                    break;
                  }
                }
                if (break1 === -1 || break1 > Math.ceil(words.length * 0.55)) {
                  const target1 = Math.round(words.length / 3);
                  break1 = target1;
                  for (let i = Math.max(1, target1 - 2); i <= Math.min(words.length - 2, target1 + 2); i++) {
                    if (words[i].endsWith(',') || words[i].endsWith(';')) {
                      break1 = i + 1;
                      break;
                    }
                  }
                }

                const remainingWords = words.length - break1;
                let break2 = break1 + Math.round(remainingWords / 2);
                for (let i = break1 + 1; i < words.length - 1; i++) {
                  if (words[i].endsWith(',') || words[i].endsWith(';') || words[i].endsWith(':')) {
                    break2 = i + 1;
                    break;
                  }
                }

                const line1 = words.slice(0, break1).join(' ');
                const line2 = words.slice(break1, break2).join(' ');
                const line3 = words.slice(break2).join(' ');
                const formatted = `${line1}\n${line2}\n${line3}`;

                onChange({
                  headline: formatted,
                  formattedHeadline: formatted,
                });
              }}
              className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-black rounded-lg text-xs flex items-center gap-1 shadow transition-all cursor-pointer"
              title="हेडलाइन को संतुलित 3 लाइनों में विभाजित करें"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
              <span>✨ 3 लाइनों में बांटें</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const single = (card.headline || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
                onChange({
                  headline: single,
                  formattedHeadline: single,
                });
              }}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg text-xs transition-all cursor-pointer"
              title="लाइन ब्रेक हटाकर 1 लाइन करें"
            >
              1 लाइन (ऑटो)
            </button>
          </div>

          {/* Line Count Indicator */}
          {(() => {
            const count = (card.headline || '').split(/\r?\n/).filter((l) => l.trim().length > 0).length;
            return (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  count === 3
                    ? 'bg-green-950 text-green-400 border-green-700/60'
                    : count === 2
                    ? 'bg-blue-950 text-blue-400 border-blue-700/60'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {count === 3 ? '✅ 3 लाइनें सेट हैं' : count === 2 ? '⚡ 2 लाइनें सेट हैं (3rd के लिए Enter दबाएं)' : '1 लाइन (ऑटो रैप)'}
              </span>
            );
          })()}
        </div>

        {/* Textarea for headline */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1 font-medium">
            हिंदी समाचार हेडलाइन (आप जहां चाहें वहां <b>Enter</b> दबाकर 3 लाइनें बना सकते हैं):
          </label>
          <textarea
            rows={3}
            value={card.headline}
            onChange={(e) => {
              const newHeadline = e.target.value;
              onChange({
                headline: newHeadline,
                formattedHeadline: newHeadline, // reset formatted
              });
            }}
            placeholder="रीवा-सीधी हाईवे पर दर्दनाक सड़क हादसा: बस और बल्कर भिड़े; CM मोहन यादव ने जताया दुख"
            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-base text-white font-['Baloo_2'] focus:border-yellow-400 focus:outline-none leading-relaxed"
          />
          <p className="text-[10px] text-neutral-400 mt-1">
            💡 <b>सुझाव:</b> हेडलाइन को 3 लाइनों में करने के लिए कीबोर्ड पर <b>Enter</b> दबाकर लाइन तोड़ सकते हैं, या ऊपर <b>'3 लाइनों में बांटें'</b> बटन पर क्लिक करें। डाउनलोड इमेज भी बिल्कुल उसी 3 लाइनों में सेव होगी।
          </p>
        </div>

        {/* Quote Speaker Attribution Input (for Quote Jacket) */}
        {card.frameDesign === 'jacket-quote' && (
          <div className="p-3 bg-neutral-950 border border-yellow-500/40 rounded-lg space-y-2">
            <span className="text-xs font-bold text-yellow-400 block">
              ❝ बयान देने वाले नेता / वक्ता का नाम व पद (सिंगल लाइन):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">वक्ता का नाम:</label>
                <input
                  type="text"
                  value={card.speakerName || ''}
                  onChange={(e) => onChange({ speakerName: e.target.value })}
                  placeholder="उदा. अनिरुद्धाचार्य महाराज"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">पद / पदवी:</label>
                <input
                  type="text"
                  value={card.speakerTitle || ''}
                  onChange={(e) => onChange({ speakerTitle: e.target.value })}
                  placeholder="उदा. कथावाचक"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-neutral-400">
              💡 यह टेक्स्ट कार्ड के नीचे कोट्स (कोटेशन) के ठीक नीचे सिंगल लाइन में प्रदर्शित होगा: <b>{card.speakerName || 'अनिरुद्धाचार्य महाराज'}{card.speakerTitle ? ` (${card.speakerTitle})` : ', कथावाचक'}</b>
            </p>
          </div>
        )}

        {/* Headline Font Size Slider & Alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
          {/* Font Size Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-yellow-400" />
                <span>फ़ॉन्ट साइज (Size):</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      headlineFontSize: Math.max(20, (card.headlineFontSize || 30) - 1),
                    })
                  }
                  className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                  title="1px छोटा करें"
                >
                  -
                </button>
                <span className="text-yellow-400 font-mono text-[11px] font-bold px-1.5 py-0.5 bg-neutral-900 rounded border border-neutral-800">
                  {card.headlineFontSize || 30}px
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      headlineFontSize: Math.min(48, (card.headlineFontSize || 30) + 1),
                    })
                  }
                  className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                  title="1px बड़ा करें"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="48"
                step="1"
                value={card.headlineFontSize || 30}
                onChange={(e) => onChange({ headlineFontSize: Number(e.target.value) })}
                className="flex-1 accent-yellow-400 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
              <span>छोटा (20px)</span>
              <span>मानक (30px)</span>
              <span>बड़ा (48px)</span>
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold">
              <AlignJustify className="w-3.5 h-3.5 text-yellow-400" />
              <span>अलाइनमेंट (Alignment):</span>
            </div>
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-md border border-neutral-800">
              <button
                type="button"
                onClick={() => onChange({ headlineAlign: 'justify' })}
                className={`flex-1 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  (!card.headlineAlign || card.headlineAlign === 'justify')
                    ? 'bg-yellow-400 text-neutral-950 shadow-sm font-extrabold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="दोनों तरफ से बराबर (Justify - समाचार पत्र प्रारूप)"
              >
                <AlignJustify className="w-3 h-3" />
                <span>Justify</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ headlineAlign: 'center' })}
                className={`flex-1 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  card.headlineAlign === 'center'
                    ? 'bg-yellow-400 text-neutral-950 shadow-sm font-extrabold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="बीच में (Center)"
              >
                <AlignCenter className="w-3 h-3" />
                <span>Center</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ headlineAlign: 'left' })}
                className={`flex-1 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  card.headlineAlign === 'left'
                    ? 'bg-yellow-400 text-neutral-950 shadow-sm font-extrabold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="बाईं ओर (Left)"
              >
                <AlignLeft className="w-3 h-3" />
                <span>Left</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Clickable Word Chips for Yellow Highlights */}
        <div>
          <div className="text-[11px] font-semibold text-neutral-400 mb-2 flex items-center justify-between">
            <span>हाइलाइट करने के लिए शब्द चुनें (पीले रंग में दिखेंगे):</span>
            <span className="text-yellow-400 text-[10px]">
              {card.highlightWords?.length || 0} शब्द हाइलाइटेड
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-neutral-950 rounded-lg border border-neutral-800">
            {getHeadlineWords().map((word, wIdx) => {
              const clean = word.replace(/[.,:;!?]/g, '');
              const isSelected = card.highlightWords?.some(
                (hw) => hw.toLowerCase() === clean.toLowerCase()
              );
              return (
                <button
                  key={`${word}-${wIdx}`}
                  type="button"
                  onClick={() => toggleWordHighlight(word)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-yellow-400 text-neutral-950 shadow-sm font-extrabold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location, Callout Tag & AI Generated Tag (Positioned above headline) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* 1. Location */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-red-500" />
              स्थान / जिला / राज्य (कैप्शन के ऊपर बाईं ओर):
            </label>
            <input
              type="text"
              value={card.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="मध्य प्रदेश / सीधी / रीवा"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none font-['Noto_Sans_Devanagari']"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              * लोकेशन अब कैप्शन के ऊपर बाईं ओर सेट है
            </p>
          </div>

          {/* 2. Callout Tag */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1 font-medium flex items-center justify-between">
              <span>पूरी खबर डिस्क्रिप्शन में (कैप्शन के ऊपर दाईं ओर):</span>
              <span className={`text-[10px] font-bold ${card.showCallout ? 'text-yellow-400' : 'text-neutral-500'}`}>
                {card.showCallout ? 'ऑन' : 'ऑफ'}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={card.calloutTag}
                onChange={(e) => onChange({ calloutTag: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onChange({ showCallout: !card.showCallout })}
                className={`px-2.5 py-2 rounded-lg text-xs font-bold shrink-0 border cursor-pointer transition-all ${
                  card.showCallout
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 font-extrabold'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {card.showCallout ? 'ऑन' : 'ऑफ'}
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              * कॉलआउट टैग कैप्शन के ऊपर दाईं ओर दिखेगा
            </p>
          </div>

          {/* 3. AI Generated Tag (Left edge, vertically centered, rotated 90° in low opacity) */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-300">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                एआई जेनरेटेड (AI GENERATED):
              </span>
              <span className={`text-[10px] font-bold ${card.showAiGenerated ? 'text-yellow-400' : 'text-neutral-500'}`}>
                {card.showAiGenerated ? 'ऑन' : 'ऑफ'}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={card.aiGeneratedText || 'AI GENERATED'}
                onChange={(e) => onChange({ aiGeneratedText: e.target.value.toUpperCase() })}
                placeholder="AI GENERATED"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none uppercase font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => onChange({ showAiGenerated: !card.showAiGenerated })}
                className={`px-2.5 py-2 rounded-lg text-xs font-bold shrink-0 border cursor-pointer transition-all ${
                  card.showAiGenerated
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 font-extrabold'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                }`}
                title="एआई जेनरेटेड वॉटरमार्क ऑन / ऑफ करें"
              >
                {card.showAiGenerated ? 'ऑन' : 'ऑफ'}
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              * इमेज के लेफ्ट सेंटर में 90° रोटेटेड लो ओपेसिटी में दिखेगा
            </p>
          </div>
        </div>

        {/* Step 5 Mobile Nav Buttons */}
        {mobileViewMode === 'steps' && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>पिछला: फोटो लेआउट</span>
            </button>
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 5 / 5 (अंतिम)</span>
            <button
              type="button"
              onClick={onOpenCaptionModal}
              className="px-3.5 py-1.5 rounded-lg bg-green-500 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>कैप्शन व शेयर</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Social Media Caption Generator Button */}
      <button
        onClick={onOpenCaptionModal}
        className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Share2 className="w-4 h-4 text-green-400" />
        <span>इंस्टाग्राम / फेसबुक पोस्ट कैप्शन कॉपी करें</span>
      </button>
    </div>
  );
};
