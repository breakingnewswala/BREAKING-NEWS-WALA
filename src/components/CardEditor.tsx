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
} from 'lucide-react';
import { FRAME_OPTIONS } from '../lib/HeaderDesigns';

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

      {/* 1. फ्रेम टेम्पलेट्स (हेडर स्टाइल चुनें) - STEP 1 */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4">
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

        {card.frameDesign === 'custom-png' && (
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200">
                पूरी ट्रांसपेरेंट PNG फ्रेम अपलोड करें:
              </span>
              {card.customFrameOverlayPng && (
                <span className="text-[10px] text-green-400 font-bold">
                  ✅ फ्रेम एक्टिव
                </span>
              )}
            </div>
            <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-neutral-700 hover:border-yellow-500 rounded-md cursor-pointer text-xs text-neutral-300 bg-neutral-900 transition-all">
              <Upload className="w-3.5 h-3.5 text-yellow-400" />
              <span>
                {card.customFrameOverlayPng
                  ? 'फ्रेम PNG बदलें'
                  : 'अपनी बनाई फ्रेम PNG अपलोड करें'}
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
          </div>
        )}
      </div>

      {/* 2. AI Actions Row (URL to News & Gemini Pro Photo Analysis) */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-yellow-500/20 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            AI ऑटोमेशन टूल्स (Automated News Generation)
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
                किसी भी वेबसाइट का लिंक या 1 लाइन खबर डालें, AI तुरंत उसी जैकेट में 3-लाइन हेडलाइन बनाएगा
              </p>
            </div>
          </button>

          {/* 2. Photo Analysis */}
          <button
            type="button"
            onClick={onOpenAIAnalyze}
            className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-red-950/40 to-neutral-900 hover:from-red-900/50 hover:to-neutral-850 text-left border border-red-500/30 hover:border-red-400 text-white transition-all cursor-pointer shadow-md group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600/30 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                <span>AI से फोटो समझें व हेडलाइन बनाएं</span>
                <span className="bg-red-600 text-white text-[9px] font-extrabold px-1 rounded">Photo</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
                घटना या नेता की फोटो अपलोड करें, AI समझकर वायरल हिंदी हेडलाइन तैयार करेगा
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Header PNG & Footer PNG Controls ("जैकेट हेडर व फुटर") */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-yellow-400" />
            जैकेट हेडर एवं फुटर पीएनजी (Header & Footer PNG)
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
                  आपकी हेडर PNG सफलता से जोड़ी गई है
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
                  आपकी फुटर PNG सफलता से जोड़ी गई है
                </span>
              </div>
              <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> लागू है
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Photo Upload & Layout Configuration */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-yellow-400" />
            फोटो लेआउट चुनें ("जैकेट" फ्रेम)
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
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
              <div className="text-[11px] font-bold text-neutral-300 mb-1.5 flex items-center justify-between">
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
                <span className="text-yellow-400 text-[10px]">अनिवार्य</span>
              </div>
              <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-neutral-700 hover:border-yellow-500 rounded-md cursor-pointer text-xs text-neutral-400 hover:text-white bg-neutral-900/50 transition-all">
                <Upload className="w-3.5 h-3.5 text-yellow-400" />
                <span>फोटो अपलोड / बदलें</span>
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
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <div className="text-[11px] font-bold text-neutral-300 mb-1.5 flex items-center justify-between">
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
                <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-neutral-700 hover:border-yellow-500 rounded-md cursor-pointer text-xs text-neutral-400 hover:text-white bg-neutral-900/50 transition-all">
                  <Upload className="w-3.5 h-3.5 text-yellow-400" />
                  <span>फोटो 2 अपलोड करें</span>
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
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <div className="text-[11px] font-bold text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>
                    {card.layout === 'grid-3'
                      ? 'तीसरी फोटो (नीचे चौड़ी - Bottom Wide)'
                      : card.layout === 'grid-4'
                      ? 'तीसरी फोटो (नीचे बाईं - Bottom Left)'
                      : 'तीसरी फोटो (नीचे दाईं - Bottom Right)'}
                  </span>
                </div>
                <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-neutral-700 hover:border-neutral-500 rounded-md cursor-pointer text-xs text-neutral-400 hover:text-white bg-neutral-900/50 transition-all">
                  <Upload className="w-3.5 h-3.5 text-yellow-400" />
                  <span>फोटो 3 अपलोड करें</span>
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
      </div>

      {/* 4. Headline & Keyword Highlights (Permanent Fixed Space at Lower Section) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-yellow-400" />
            3-लाइन कैप्शन हेडलाइन (Permanent News Caption)
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

        {/* Headline Font Size Slider & Alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
          {/* Font Size Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-yellow-400" />
                <span>फ़ॉन्ट साइज (Size):</span>
              </span>
              <span className="text-yellow-400 font-mono text-[11px] font-bold">
                {card.headlineFontSize || 30}px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="24"
                max="40"
                step="1"
                value={card.headlineFontSize || 30}
                onChange={(e) => onChange({ headlineFontSize: Number(e.target.value) })}
                className="flex-1 accent-yellow-400 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
              <span>छोटा (24px)</span>
              <span>मीडियम (30px)</span>
              <span>बड़ा (40px)</span>
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

        {/* Manual Headline Font Size Control */}
        <div className="pt-3 border-t border-neutral-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-300">
                हेडलाइन फ़ॉन्ट साइज़ (मैन्युअल छोटा/बड़ा करें):
              </span>
              <span className="text-xs font-bold text-yellow-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                {card.headlineFontSize || 33}px
              </span>
            </div>

            {/* Quick +/- step buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    headlineFontSize: Math.max(20, (card.headlineFontSize || 33) - 1),
                  })
                }
                className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-sm flex items-center justify-center border border-neutral-700 cursor-pointer"
                title="1px छोटा करें"
              >
                -
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    headlineFontSize: Math.min(48, (card.headlineFontSize || 33) + 1),
                  })
                }
                className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-sm flex items-center justify-center border border-neutral-700 cursor-pointer"
                title="1px बड़ा करें"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => onChange({ headlineFontSize: 33 })}
                className="px-2 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-[11px] text-neutral-400 hover:text-neutral-200 border border-neutral-750 cursor-pointer ml-1"
                title="33px डिफ़ॉल्ट पर सेट करें"
              >
                33px रीसेट
              </button>
            </div>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-neutral-500 shrink-0">20px</span>
            <input
              type="range"
              min="20"
              max="48"
              value={card.headlineFontSize || 33}
              onChange={(e) =>
                onChange({ headlineFontSize: Number(e.target.value) })
              }
              className="w-full accent-yellow-400 cursor-pointer"
            />
            <span className="text-[10px] text-neutral-500 shrink-0">48px</span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-neutral-500 shrink-0">तुरंत चुनें:</span>
            {[
              { size: 26, label: '26px (लंबी खबर)' },
              { size: 30, label: '30px' },
              { size: 33, label: '33px (मानक)' },
              { size: 36, label: '36px' },
              { size: 40, label: '40px (छोटी खबर)' },
            ].map((p) => (
              <button
                key={p.size}
                type="button"
                onClick={() => onChange({ headlineFontSize: p.size })}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                  (card.headlineFontSize || 33) === p.size
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 font-bold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-neutral-500">
            * 3-लाइन हेडलाइन में शब्दों की संख्या के अनुसार आप कभी भी आसानी से साइज़ बदल सकते हैं।
          </p>
        </div>
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
