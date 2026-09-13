import React from 'react';
import { NewsCardData, CardLayout, AspectRatio, FrameDesign, TextBreakingBadgeStyle } from '../types';
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
import { FRAME_OPTIONS, REPORTER_ALLOWED_FRAMES } from '../lib/HeaderDesigns';
import {
  BUILTIN_RIBBONS,
  loadSavedCustomRibbons,
  saveCustomRibbon,
  deleteCustomRibbon,
  RibbonPreset,
} from '../lib/ribbonPresets';
import {
  getActiveFooterPng,
  setActiveFooterPng,
  getFrameDesignLabel,
} from '../lib/footerUtils';
import { PhotoPositionControl } from './PhotoPositionControl';
import {
  getActiveHeaderPng,
  setActiveHeaderPng,
} from '../lib/headerUtils';
import { extractLeaderFromHeadline, getEffectiveSpeaker } from '../lib/speakerUtils';
import { VoiceInputButton } from './VoiceInputButton';
import { getFormattedHindiDate } from '../lib/dateUtils';
import { MorningJacketEditor } from './MorningJacketEditor';
import { EPaperJacketEditor } from './EPaperJacketEditor';
import { ReporterUser } from './LoginModal';

interface CardEditorProps {
  card: NewsCardData;
  onChange: (updated: Partial<NewsCardData>) => void;
  onOpenAIAnalyze: () => void;
  onOpenCommandModal: () => void;
  onOpenCaptionModal: () => void;
  onResetAI?: () => void;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  currentUser?: ReporterUser | null;
  mobileViewMode?: 'steps' | 'all';
  onToggleMobileViewMode?: (mode: 'steps' | 'all') => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({
  card,
  onChange,
  onOpenAIAnalyze,
  onOpenCommandModal,
  onOpenCaptionModal,
  onResetAI,
  activeStep: propActiveStep,
  onStepChange,
  currentUser,
  mobileViewMode: propMobileViewMode,
  onToggleMobileViewMode,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const allowedFrameOptions = React.useMemo(() => {
    if (isAdmin) {
      return FRAME_OPTIONS;
    }
    return FRAME_OPTIONS.filter((f) => REPORTER_ALLOWED_FRAMES.includes(f.id));
  }, [isAdmin]);

  // If a reporter is on an admin-only frame, automatically revert to jacket-original
  React.useEffect(() => {
    if (!isAdmin && card.frameDesign && !REPORTER_ALLOWED_FRAMES.includes(card.frameDesign)) {
      onChange({ frameDesign: 'jacket-original' });
    }
  }, [isAdmin, card.frameDesign, onChange]);

  // Saved custom ribbons for Super Breaking layout
  const [savedRibbons, setSavedRibbons] = React.useState<RibbonPreset[]>(() => loadSavedCustomRibbons());
  const [newRibbonName, setNewRibbonName] = React.useState<string>('');

  // Per-template footer selection state
  const [selectedFooterDesignTab, setSelectedFooterDesignTab] = React.useState<FrameDesign>(
    card.frameDesign || 'jacket-original'
  );

  React.useEffect(() => {
    if (card.frameDesign) {
      setSelectedFooterDesignTab(card.frameDesign);
    }
  }, [card.frameDesign]);

  // Mobile active step navigation (1 to 6)
  const [internalActiveStep, setInternalActiveStep] = React.useState<number>(1);
  const activeStep = propActiveStep !== undefined ? propActiveStep : internalActiveStep;
  const setActiveStep = onStepChange || setInternalActiveStep;
  const [internalMobileViewMode, setInternalMobileViewMode] = React.useState<'steps' | 'all'>('steps');
  const mobileViewMode = propMobileViewMode !== undefined ? propMobileViewMode : internalMobileViewMode;
  const setMobileViewMode = onToggleMobileViewMode || setInternalMobileViewMode;

  // Strictly enforce single photo layout for jacket-quote template
  React.useEffect(() => {
    if (card.frameDesign === 'jacket-quote' && card.layout !== 'single') {
      onChange({ layout: 'single' });
    }
  }, [card.frameDesign, card.layout, onChange]);

  const STEPS = card.frameDesign === 'jacket-morning'
    ? [
        { step: 1, id: 'step-frame', label: '1. टेम्पलेट', icon: '🖼️' },
        { step: 2, id: 'step-ai', label: '2. विचार व बैकग्राउंड', icon: '🌅' },
        { step: 3, id: 'step-header-footer', label: '3. हेडर/फुटर', icon: '🎨' },
      ]
    : card.frameDesign === 'jacket-epaper'
    ? [
        { step: 1, id: 'step-frame', label: '1. टेम्पलेट', icon: '🖼️' },
        { step: 2, id: 'step-ai', label: '2. ई-पेपर व AI', icon: '📰' },
        { step: 3, id: 'step-header-footer', label: '3. हेडर/फुटर', icon: '🎨' },
      ]
    : [
        { step: 1, id: 'step-frame', label: '1. टेम्पलेट', icon: '🖼️' },
        { step: 2, id: 'step-ai', label: '2. AI टूल्स', icon: '✨' },
        { step: 3, id: 'step-header-footer', label: '3. हेडर/फुटर', icon: '🎨' },
        { step: 4, id: 'step-layout', label: '4. फोटो लेआउट', icon: '📷' },
        { step: 5, id: 'step-headline', label: '5. हेडलाइन', icon: '✍️' },
        { step: 6, id: 'step-location-date', label: '6. जिला व डेट', icon: '📍' },
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

  // Handle Header PNG upload for a specific design
  const handleHeaderUploadForDesign = (file: File, targetDesign: FrameDesign) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const url = e.target.result as string;
        const updatedHeaders = { ...(card.headersByDesign || {}) };
        updatedHeaders[targetDesign] = url;
        onChange({
          customHeaderPng: url,
          headersByDesign: updatedHeaders,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset header for a specific design
  const handleResetHeaderForDesign = (targetDesign: FrameDesign) => {
    const updatedHeaders = { ...(card.headersByDesign || {}) };
    delete updatedHeaders[targetDesign];
    const currentActiveDesign = card.frameDesign || 'jacket-original';
    onChange({
      customHeaderPng: updatedHeaders[currentActiveDesign] || undefined,
      headersByDesign: updatedHeaders,
    });
  };

  // Apply a header to all templates
  const handleApplyHeaderToAll = (url: string) => {
    const allDesigns: FrameDesign[] = [
      'jacket-original',
      'jacket-breaking-red',
      'jacket-text-breaking',
      'jacket-investigation',
      'jacket-quote',
      'jacket-morning',
      'custom-png',
    ];
    const updatedHeaders: Record<string, string> = {};
    for (const d of allDesigns) {
      updatedHeaders[d] = url;
    }
    onChange({
      customHeaderPng: url,
      headersByDesign: updatedHeaders,
    });
  };

  // Legacy/Default Header PNG upload
  const handleHeaderUpload = (file: File) => {
    const currentDesign = card.frameDesign || 'jacket-original';
    handleHeaderUploadForDesign(file, currentDesign);
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

  // Handle Footer PNG upload for a specific design or selected design
  const handleFooterUpload = (file: File, targetDesign?: FrameDesign) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const url = e.target.result as string;
        const designToUpdate = targetDesign || selectedFooterDesignTab || card.frameDesign || 'jacket-original';
        const updatedFooters = { ...(card.footersByDesign || {}) };
        updatedFooters[designToUpdate] = url;
        onChange({
          customFooterPng: url,
          footersByDesign: updatedFooters,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFooterUploadForDesign = handleFooterUpload;

  // Reset footer for a specific design
  const handleFooterReset = (targetDesign?: FrameDesign) => {
    const designToReset = targetDesign || selectedFooterDesignTab || card.frameDesign || 'jacket-original';
    const updatedFooters = { ...(card.footersByDesign || {}) };
    delete updatedFooters[designToReset];
    const currentActiveDesign = card.frameDesign || 'jacket-original';
    onChange({
      customFooterPng: updatedFooters[currentActiveDesign] || undefined,
      footersByDesign: updatedFooters,
    });
  };

  const handleResetFooterForDesign = handleFooterReset;

  // Apply a footer to all templates
  const handleApplyFooterToAll = (url: string) => {
    const allDesigns: FrameDesign[] = [
      'jacket-original',
      'jacket-breaking-red',
      'jacket-text-breaking',
      'jacket-investigation',
      'jacket-quote',
      'jacket-morning',
      'custom-png',
    ];
    const updatedFooters: Record<string, string> = {};
    for (const d of allDesigns) {
      updatedFooters[d] = url;
    }
    onChange({
      customFooterPng: url,
      footersByDesign: updatedFooters,
    });
  };

  // Handle Custom Background Upload for Text Breaking Jacket
  const handleTextBreakingBgUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange({
          textBreakingCustomBgUrl: e.target.result as string,
          textBreakingBgStyle: 'custom-image',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Dedicated Render function for Text Breaking Settings (Used in Step 1 and Step 3)
  const renderTextBreakingSettings = () => (
    <div className="space-y-4">
      {/* Informational banner */}
      <div className="p-3 bg-red-950/40 rounded-xl border border-red-800/60 text-xs text-neutral-200 flex items-start gap-2.5">
        <span className="text-base text-red-400">⚡</span>
        <div>
          <strong className="block text-red-300 font-bold mb-0.5">
            टेक्स्ट ब्रेकिंग जैकेट (Text Breaking Jacket)
          </strong>
          <p className="text-neutral-300 text-[11px] leading-relaxed">
            यह टेम्पलेट विशेष रूप से बिना फोटो वाली बड़ी और त्वरित ब्रेकिंग खबरों के लिए है। फोटो लेआउट और क्रॉपिंग की आवश्यकता नहीं है।
          </p>
        </div>
      </div>

      {/* 1. 3D & Simple Breaking Badge Styles Selector (9 styles) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-200 block">
            ब्रेकिंग न्यूज़ बैज स्टाइल (9 विकल्प):
          </span>
          <span className="text-[10px] text-yellow-400 font-semibold">
            {card.textBreakingStyle === 'breaking-flat-red'
              ? 'फ्लैट रेड (कम 3D)'
              : card.textBreakingStyle === 'breaking-solid-bar'
              ? 'सॉलिड टीवी बार'
              : card.textBreakingStyle === 'breaking-simple-hi'
              ? 'सादा हिंदी बोल्ड'
              : card.textBreakingStyle === 'breaking-3d-en'
              ? '3D बोल्ड (English)'
              : card.textBreakingStyle === 'breaking-3d-hi'
              ? '3D बोल्ड (Hindi)'
              : card.textBreakingStyle === 'breaking-ribbon'
              ? 'ग्लॉसी रिबन'
              : card.textBreakingStyle === 'breaking-gold'
              ? 'गोल्डन & रेड'
              : card.textBreakingStyle === 'breaking-duotone'
              ? 'डुओटोन'
              : 'एक्सक्लूसिव'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            {
              id: 'breaking-3d-en',
              title: '3D BOLD RED (English)',
              subtitle: 'BREAKING NEWS (सैंपल 3D)',
            },
            {
              id: 'breaking-3d-hi',
              title: '3D BOLD RED (Hindi)',
              subtitle: 'ब्रेकिंग न्यूज़ (हिंदी 3D)',
            },
            {
              id: 'breaking-flat-red',
              title: 'Flat Bold Red (कम 3D)',
              subtitle: 'BREAKING NEWS (Clean)',
            },
            {
              id: 'breaking-solid-bar',
              title: 'Solid TV Red Bar',
              subtitle: 'लाल टीवी प्लेट बार',
            },
            {
              id: 'breaking-simple-hi',
              title: 'Simple Hindi Bold',
              subtitle: 'ब्रेकिंग न्यूज़ (साफ़ हिंदी)',
            },
            {
              id: 'breaking-ribbon',
              title: 'Glossy 3D Ribbon',
              subtitle: '★ BREAKING NEWS ★',
            },
            {
              id: 'breaking-gold',
              title: '⚡ Gold & Red',
              subtitle: 'BIG BREAKING / बड़ी ख़बर',
            },
            {
              id: 'breaking-duotone',
              title: 'Duotone Red/Black',
              subtitle: 'BREAKING / NEWS',
            },
            {
              id: 'breaking-exclusive',
              title: 'Exclusive Gold Pill',
              subtitle: 'EXCLUSIVE + BOLD RED',
            },
          ].map((st) => {
            const isSelected = (card.textBreakingStyle || 'breaking-3d-en') === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() =>
                  onChange({
                    textBreakingStyle: st.id as TextBreakingBadgeStyle,
                  })
                }
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-red-500 bg-red-500/20 text-white shadow-sm ring-1 ring-red-500/60'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-black text-white">{st.title}</span>
                <span className="text-[10px] text-neutral-400 mt-0.5">{st.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Badge Text & Size Controls */}
      <div className="space-y-2 pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-200">
            कस्टम हेडर शब्द एवं साइज़:
          </span>
          <span className="text-[10px] text-neutral-500">खाली रखने पर डिफ़ॉल्ट दिखेगा</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={card.textBreakingCustomTitle || ''}
            onChange={(e) => onChange({ textBreakingCustomTitle: e.target.value })}
            placeholder="उदा. BREAKING NEWS या बड़ी ख़बर या महा ब्रेकिंग"
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
          {/* Size Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1 self-start sm:self-auto shrink-0">
            <span className="text-[10px] text-neutral-400 px-1 font-semibold">साइज़:</span>
            {[
              { id: 'sm', label: 'छोटा (SM)' },
              { id: 'md', label: 'सामान्य (MD)' },
              { id: 'lg', label: 'बड़ा (LG)' },
            ].map((sz) => {
              const isSelected = (card.textBreakingTitleSize || 'md') === sz.id;
              return (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => onChange({ textBreakingTitleSize: sz.id as 'sm' | 'md' | 'lg' })}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {sz.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Background Texture / Tone & Custom Background Upload */}
      <div className="space-y-2 pt-2 border-t border-neutral-800">
        <span className="text-xs font-bold text-neutral-200 block">
          बैकग्राउंड टेक्सचर एवं कस्टम इमेज:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'light-geo', label: '3D ज्यामितीय मेश', sub: 'ABP Live जैसा' },
            { id: 'pure-white', label: 'शुद्ध सफेद', sub: 'साफ़ सुथरा' },
            { id: 'dark-news', label: 'डार्क स्लेट', sub: 'गहरा रंग' },
            { id: 'custom-image', label: '📷 कस्टम फोटो', sub: 'अपनी इमेज अपलोड करें' },
          ].map((bg) => {
            const isSelected = (card.textBreakingBgStyle || 'light-geo') === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() =>
                  onChange({
                    textBreakingBgStyle: bg.id as 'light-geo' | 'pure-white' | 'dark-news' | 'custom-image',
                  })
                }
                className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-500/15 text-white ring-1 ring-yellow-400/40'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-bold">{bg.label}</span>
                <span className="text-[10px] text-neutral-400">{bg.sub}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Background Image Upload Box */}
        {card.textBreakingBgStyle === 'custom-image' && (
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-yellow-400" />
                <span>बैकग्राउंड इमेज अपलोड करें:</span>
              </span>
              {card.textBreakingCustomBgUrl && (
                <button
                  type="button"
                  onClick={() => onChange({ textBreakingCustomBgUrl: undefined, textBreakingBgStyle: 'light-geo' })}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium cursor-pointer"
                >
                  हटाएं (Remove)
                </button>
              )}
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-700 hover:border-yellow-400/70 rounded-lg p-3 cursor-pointer transition-all bg-neutral-900/50 group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleTextBreakingBgUpload(file);
                }}
              />
              {card.textBreakingCustomBgUrl ? (
                <div className="flex items-center gap-3 w-full">
                  <img
                    src={card.textBreakingCustomBgUrl}
                    alt="Custom Bg"
                    className="w-16 h-16 rounded object-cover border border-neutral-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-yellow-400 font-bold">कस्टम इमेज सक्रिय है</p>
                    <p className="text-[10px] text-neutral-400">दूसरी फोटो बदलने के लिए यहाँ क्लिक करें</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <Upload className="w-6 h-6 text-neutral-400 group-hover:text-yellow-400 mx-auto mb-1 transition-colors" />
                  <span className="text-xs text-neutral-300 font-bold block">
                    बैकग्राउंड इमेज चुनें या यहाँ ड्रैग करें
                  </span>
                  <span className="text-[10px] text-neutral-500">JPG, PNG, WebP समर्थित</span>
                </div>
              )}
            </label>
          </div>
        )}
      </div>
    </div>
  );

  // Build formatted headline with [yellow]...[/yellow] tags while strictly preserving line breaks (\n)
  const buildFormattedHeadline = (rawHeadline: string, highlights: string[]) => {
    if (!rawHeadline) return '';
    const cleanHighlights = highlights
      .map((h) => h.trim().replace(/[.,:;!?।\-"'“”‘’()]/g, '').toLowerCase())
      .filter(Boolean);

    if (cleanHighlights.length === 0) {
      return rawHeadline.replace(/\[yellow\]/g, '').replace(/\[\/yellow\]/g, '');
    }

    // Split strictly by lines so line breaks \n are never collapsed or destroyed!
    const lines = rawHeadline.split(/\r?\n/);
    return lines
      .map((line) => {
        // Tokenize line by whitespace
        const tokens = line.split(/\s+/).filter(Boolean);
        return tokens
          .map((tok) => {
            const clean = tok.replace(/[.,:;!?।\-"'“”‘’()]/g, '').trim().toLowerCase();
            const isMatch = cleanHighlights.some(
              (h) => h === clean || h.split(/\s+/).some((part) => part === clean)
            );
            if (isMatch) {
              return `[yellow]${tok}[/yellow]`;
            }
            return tok;
          })
          .join(' ');
      })
      .join('\n');
  };

  // Split current headline into individual words for quick chip toggling
  const getHeadlineWords = () => {
    return card.headline.split(/\s+/).filter(Boolean);
  };

  const toggleWordHighlight = (word: string) => {
    const cleanWord = word.replace(/[.,:;!?।\-"'“”‘’()]/g, '').trim();
    if (!cleanWord) return;

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

    const formatted = buildFormattedHeadline(card.headline, newHighlights);

    onChange({
      highlightWords: newHighlights,
      formattedHeadline: formatted,
    });
  };

  return (
    <div className="space-y-6">
      {/* Desktop Locked / Sticky Step Navigator Bar (On mobile, this is locked directly below the Live Preview photo) */}
      <div className="hidden lg:block lg:sticky lg:top-18 z-30 bg-neutral-900/98 backdrop-blur-md border border-neutral-800 rounded-xl p-2.5 sm:p-3 shadow-xl">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-yellow-400" />
            <span>एडिटर स्टेप्स (स्टेप {activeStep} / {STEPS.length})</span>
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
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            {allowedFrameOptions.find((f) => (card.frameDesign || 'jacket-original') === f.id)?.name || 'फ्रेम स्टाइल'}
          </span>
        </div>

        {/* Role Indicator Banner */}
        <div className={`flex items-center justify-between text-[11px] px-3 py-2 rounded-xl border transition-all ${
          isAdmin
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
        }`}>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="font-bold">
              {isAdmin ? '👑 मुख्य संपादक (Admin): सभी 7 जैकेट्स व एडवांस्ड फीचर्स' : '👤 रिपोर्टर मोड: 4 मुख्य जैकेट्स सक्रिय'}
            </span>
          </span>
          <span className="text-[10px] text-neutral-400 font-medium">
            {isAdmin ? 'सभी विकल्प अनलॉक' : 'ओरिजिनल • सुपर ब्रेकिंग • मॉर्निंग • टेक्स्ट ब्रेकिंग'}
          </span>
        </div>

        {/* Frame Designs Grid (Filtered by Role) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {allowedFrameOptions.map((f) => {
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

        {/* Step 1 Mobile Next Button */}
        {mobileViewMode === 'steps' && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 1 / {STEPS.length}</span>
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <span>अगला: {card.frameDesign === 'jacket-morning' ? 'विचार व बैकग्राउंड' : card.frameDesign === 'jacket-epaper' ? 'ई-पेपर व AI' : 'AI टूल्स'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. AI टूल्स - STEP 2 */}
      {card.frameDesign === 'jacket-morning' ? (
        /* Morning Jacket Step 2: AI विचार व बैकग्राउंड */
        <div
          id="step-ai"
          className={`bg-gradient-to-r from-neutral-900 to-neutral-950 border border-yellow-500/20 rounded-xl p-3.5 space-y-3 scroll-mt-24 lg:scroll-mt-32 ${
            mobileViewMode === 'steps' && activeStep !== 2 ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              स्टेप 2: AI विचार व बैकग्राउंड कमांड सेंटर
            </span>
            <span className="text-[10px] font-bold bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full">
              Gemini AI
            </span>
          </div>
          <MorningJacketEditor card={card} onChange={onChange} />
          {mobileViewMode === 'steps' && (
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>पिछला: टेम्पलेट</span>
              </button>
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
      ) : card.frameDesign === 'jacket-epaper' ? (
        /* E-Paper Jacket Step 2: ई-पेपर प्रेस नोट व AI */
        <div
          id="step-ai"
          className={`bg-gradient-to-r from-neutral-900 to-neutral-950 border border-red-500/30 rounded-xl p-3.5 space-y-3 scroll-mt-24 lg:scroll-mt-32 ${
            mobileViewMode === 'steps' && activeStep !== 2 ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              स्टेप 2: ई-पेपर अखबार प्रेस नोट व AI कनवर्टर
            </span>
            <span className="text-[10px] font-bold bg-red-500/10 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
              अखबार 2-कॉलम
            </span>
          </div>
          <EPaperJacketEditor card={card} onChange={onChange} />
          {mobileViewMode === 'steps' && (
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>पिछला: टेम्पलेट</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white font-black flex items-center gap-1 shadow cursor-pointer"
              >
                <span>अगला: हेडर-फुटर</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Standard Templates Step 2: AI ऑटोमेशन टूल्स */
        <div
          id="step-ai"
          className={`bg-gradient-to-r from-neutral-900 to-neutral-950 border border-yellow-500/20 rounded-xl p-4 space-y-3.5 scroll-mt-24 lg:scroll-mt-32 ${
            mobileViewMode === 'steps' && activeStep !== 2 ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              स्टेप 2: AI ऑटोमेशन टूल्स (Automated News & Photo)
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
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-yellow-300 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span>AI न्यूज़ (लिंक व प्रॉम्प्ट से बनाएं)</span>
                    <span className="bg-yellow-400 text-neutral-950 text-[9px] font-extrabold px-1 rounded">Create News</span>
                  </div>
                  {onResetAI && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onResetAI();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          onResetAI();
                        }
                      }}
                      title="AI इनपुट बॉक्स रिफ्रेश करें"
                      className="px-1.5 py-0.5 rounded bg-neutral-700 hover:bg-neutral-600 text-yellow-400 hover:text-yellow-300 text-[9px] font-black border border-yellow-400/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>रिफ्रेश</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
                  न्यूज़ लिंक या प्रॉम्प्ट डालें — AI स्वतः हेडलाइन, हाइलाइट्स व फ़ोटो सेट करके कार्ड तैयार कर देगा
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
                <span>पिछला: टेम्पलेट</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
              >
                <span>अगला: हेडर व फुटर PNG</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. हेडर व फुटर PNG - STEP 3 */}
      <div
        id="step-header-footer"
        className={`bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4 scroll-mt-28 lg:scroll-mt-36 ${
          mobileViewMode === 'steps' && activeStep !== 3 ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            स्टेप 3: हेडर व फुटर PNG कस्टमाइज़ेशन
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            टॉप हेडर व बॉटम फुटर स्ट्रिप्स
          </span>
        </div>

        {/* Integrated Header & Footer Box for Selected Template */}
        {(() => {
          const currentDesign = card.frameDesign || 'jacket-original';
          const activeHeaderUrl = getActiveHeaderPng(card);
          const hasCustomHeader = Boolean(
            card.headersByDesign && card.headersByDesign[currentDesign]
          );
          const activeFooterUrl = getActiveFooterPng(card);
          const hasCustomFooter = Boolean(
            card.footersByDesign && card.footersByDesign[currentDesign]
          );
          const templateName = getFrameDesignLabel(currentDesign);

          return (
            <div className="p-3.5 bg-neutral-950 border border-neutral-700/80 rounded-xl space-y-3.5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏷️</span>
                  <div>
                    <span className="text-xs font-black text-white">
                      {templateName} : हेडर व फुटर पीएनजी
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      इस टेम्पलेट के लिए कस्टम हेडर/फुटर अपलोड करें (बदलने पर सुरक्षित रहेगा)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  {hasCustomHeader || hasCustomFooter ? (
                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> कस्टम सक्रिय
                    </span>
                  ) : (
                    <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md font-medium">
                      डिफ़ॉल्ट पीएनजी
                    </span>
                  )}
                </div>
              </div>

              {/* 2-Column Responsive Grid for Header & Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. HEADER BOX */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <span>🔝</span> हेडर पीएनजी (Top Header)
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange({ lockHeader: !card.lockHeader })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        card.lockHeader
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 font-bold'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      }`}
                      title={card.lockHeader ? 'हेडर लॉक है (टेम्पलेट बदलने पर वही रहेगा)' : 'हेडर अनलॉक है'}
                    >
                      {card.lockHeader ? '🔒 लॉक्ड' : '🔓 अनलॉक'}
                    </button>
                  </div>

                  {/* Header thumbnail & actions */}
                  {hasCustomHeader && activeHeaderUrl ? (
                    <div className="p-2 bg-neutral-950 rounded-md border border-neutral-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img
                          src={activeHeaderUrl}
                          alt="Custom Header"
                          className="h-7 w-auto max-w-[120px] object-contain bg-white/10 rounded px-1 border border-neutral-700"
                        />
                        <div className="truncate">
                          <p className="text-[10px] font-bold text-green-400 truncate">कस्टम हेडर लोड है</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResetHeaderForDesign(currentDesign)}
                          className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-bold rounded border border-red-500/30 transition-all cursor-pointer"
                          title="कस्टम हेडर हटाएं"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyHeaderToAll(activeHeaderUrl)}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold rounded border border-neutral-700 transition-all cursor-pointer"
                          title="यह हेडर सभी टेम्पलेट्स पर लगाएं"
                        >
                          सभी पर
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Upload button */}
                  <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-neutral-700 hover:border-yellow-400 rounded-lg cursor-pointer text-xs text-neutral-300 bg-neutral-950 hover:bg-neutral-900 transition-all">
                    <Upload className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span className="truncate">
                      {hasCustomHeader ? 'नया हेडर PNG बदलें' : 'हेडर PNG अपलोड करें'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleHeaderUploadForDesign(file, currentDesign);
                      }}
                    />
                  </label>
                </div>

                {/* 2. FOOTER BOX */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <span>🔻</span> फुटर पीएनजी (Bottom Footer)
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange({ lockFooter: !card.lockFooter })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        card.lockFooter
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 font-bold'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      }`}
                      title={card.lockFooter ? 'फुटर लॉक है (टेम्पलेट बदलने पर वही रहेगा)' : 'फुटर अनलॉक है'}
                    >
                      {card.lockFooter ? '🔒 लॉक्ड' : '🔓 अनलॉक'}
                    </button>
                  </div>

                  {/* Footer thumbnail & actions */}
                  {hasCustomFooter && activeFooterUrl ? (
                    <div className="p-2 bg-neutral-950 rounded-md border border-neutral-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img
                          src={activeFooterUrl}
                          alt="Custom Footer"
                          className="h-7 w-auto max-w-[120px] object-contain bg-white/10 rounded px-1 border border-neutral-700"
                        />
                        <div className="truncate">
                          <p className="text-[10px] font-bold text-green-400 truncate">कस्टम फुटर लोड है</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResetFooterForDesign(currentDesign)}
                          className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-bold rounded border border-red-500/30 transition-all cursor-pointer"
                          title="कस्टम फुटर हटाएं"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyFooterToAll(activeFooterUrl)}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold rounded border border-neutral-700 transition-all cursor-pointer"
                          title="यह फुटर सभी टेम्पलेट्स पर लगाएं"
                        >
                          सभी पर
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Upload button */}
                  <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-neutral-700 hover:border-yellow-400 rounded-lg cursor-pointer text-xs text-neutral-300 bg-neutral-950 hover:bg-neutral-900 transition-all">
                    <Upload className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span className="truncate">
                      {hasCustomFooter ? 'नया फुटर PNG बदलें' : 'फुटर PNG अपलोड करें'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFooterUploadForDesign(file, currentDesign);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })()}

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

            {/* 0. BREAKING NEWS Ribbon Toggle (Show / Hide) */}
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🎗️</span>
                  <span className="text-xs font-bold text-white">
                    BREAKING NEWS रिबन (Ribbon)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      showBreakingRibbon: card.showBreakingRibbon === false ? true : false,
                    })
                  }
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                    card.showBreakingRibbon !== false
                      ? 'bg-red-600 text-white border-red-500 shadow'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {card.showBreakingRibbon !== false ? 'रिबन सक्रिय (ON)' : 'बिना रिबन (OFF)'}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                {card.showBreakingRibbon !== false
                  ? '⚡ रिबन सक्रिय है। अगर आप बिना रिबन के पब्लिश करना चाहते हैं तो ऊपर से OFF कर सकते हैं।'
                  : '💡 रिबन छिपा दिया गया है। लोकेशन और टैग नीचे आ गए हैं और फोटो ज्यादा दिखाई दे रही है।'}
              </p>
            </div>

            {/* 1. BREAKING NEWS Ribbon Style Gallery (5+ Built-in + Saved Custom) */}
            {card.showBreakingRibbon !== false && (
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
            )}
          </div>
        )}

        {/* Template specific fields for Text Breaking Jacket (टेक्स्ट ब्रेकिंग जैकेट) */}
        {card.frameDesign === 'jacket-text-breaking' && (
          <div className="p-3.5 bg-neutral-950 border border-red-500/40 rounded-xl space-y-3.5">
            {renderTextBreakingSettings()}
          </div>
        )}

        {/* Template specific fields for Morning Jacket (मॉर्निंग जैकेट) */}
        {card.frameDesign === 'jacket-morning' && (
          <div className="p-3.5 bg-gradient-to-r from-amber-950/50 via-neutral-900 to-amber-950/30 border border-amber-500/40 rounded-xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                  🌅
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-300">मॉर्निंग जैकेट विशेष मोड</h4>
                  <p className="text-[11px] text-neutral-300 leading-tight mt-0.5">
                    हेल्थ टिप्स, सुविचार या पॉजिटिव विचार — AI से 1-क्लिक में पूरा कार्ड जनरेट करें
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveStep(2);
                  const el = document.getElementById('step-ai');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI जनरेटर खोलें</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Exclusive News Watermark Feature (Custom Opacity & Color: White/Black) - AVAILABLE FOR ALL TEMPLATES */}
        <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2.5">
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
                  breakingWatermarkText: 'BREAKING NEWS WALA',
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
            <div className="pt-2 border-t border-neutral-800 space-y-3">
              {/* Fixed Text Indicator in Arial */}
              <div className="flex items-center justify-between bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-xs">
                <span className="text-neutral-400 text-[11px]">वॉटरमार्क टेक्स्ट (Arial Font):</span>
                <span className="text-white font-black font-sans tracking-wider text-xs">
                  BREAKING NEWS WALA
                </span>
              </div>

              {/* Watermark Color Toggle: White or Black */}
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 font-medium">
                  वॉटरमार्क का रंग (वाइट या ब्लैक):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ breakingWatermarkColor: 'white' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      (card.breakingWatermarkColor || 'white') === 'white'
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-white border border-neutral-300 inline-block" />
                    <span>वाइट (White)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ breakingWatermarkColor: 'black' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      card.breakingWatermarkColor === 'black'
                        ? 'bg-neutral-900 text-white border-yellow-400 ring-1 ring-yellow-400 shadow-md'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-black border border-neutral-600 inline-block" />
                    <span>ब्लैक (Black)</span>
                  </button>
                </div>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <span>ओपेसिटी (कम / ज्यादा):</span>
                  <span className="text-white font-bold font-mono">
                    {Math.round((card.breakingWatermarkOpacity ?? 0.15) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.01"
                  value={card.breakingWatermarkOpacity ?? 0.15}
                  onChange={(e) =>
                    onChange({ breakingWatermarkOpacity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-neutral-800 rounded"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 mt-0.5">
                  <span>5% (हल्का)</span>
                  <span>15% (स्टैंडर्ड)</span>
                  <span>50% (गाढ़ा)</span>
                </div>
              </div>
            </div>
          )}
        </div>

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

        {/* Step 3 Mobile Nav Buttons */}
        {mobileViewMode === 'steps' && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>पिछला: {card.frameDesign === 'jacket-morning' ? 'विचार व बैकग्राउंड' : card.frameDesign === 'jacket-epaper' ? 'ई-पेपर व AI' : 'AI टूल्स'}</span>
            </button>
            <span className="text-neutral-500 font-semibold text-[11px]">
              स्टेप 3 / {STEPS.length}
            </span>
            {card.frameDesign === 'jacket-morning' || card.frameDesign === 'jacket-epaper' ? (
              <button
                type="button"
                onClick={onOpenCaptionModal}
                className="px-3.5 py-1.5 rounded-lg bg-green-500 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>कैप्शन व शेयर</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
              >
                <span>अगला: फोटो लेआउट</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {card.frameDesign !== 'jacket-morning' && card.frameDesign !== 'jacket-epaper' && (
        <>
          {/* 4. Photo Upload & Layout Configuration - STEP 4 */}
          <div
            id="step-layout"
            className={`bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4 scroll-mt-24 lg:scroll-mt-32 ${
              mobileViewMode === 'steps' && activeStep !== 4 ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-yellow-400" />
                स्टेप 4: न्यूज़ फोटो लेआउट व अपलोड
              </span>
          <span className="text-xs text-yellow-400 font-medium">
            {card.frameDesign === 'jacket-morning'
              ? '🌅 मॉर्निंग जैकेट (नो फोटो लेआउट)'
              : card.frameDesign === 'jacket-text-breaking'
              ? '⚡ 100% टेक्स्ट-ड्रिवन (नो फोटो)'
              : card.layout === 'single'
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

        {card.frameDesign === 'jacket-text-breaking' ? (
          <div className="p-4 bg-neutral-950/60 rounded-xl border border-dashed border-neutral-800 text-center py-6 space-y-1.5">
            <span className="text-2xl block">⚡</span>
            <h4 className="text-xs font-bold text-neutral-200">
              टेक्स्ट ब्रेकिंग जैकेट (100% टेक्स्ट आधारित लेआउट)
            </h4>
            <p className="text-[11px] text-neutral-400 max-w-md mx-auto">
              इस टेम्पलेट में फोटो लेआउट की आवश्यकता नहीं है। 9 बैज स्टाइल्स, कस्टम हेडर शब्द एवं बैकग्राउंड टेक्सचर आप ऊपर <b>स्टेप 1</b> में सेट कर सकते हैं।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
        {/* Layout Selector Buttons */}
        {card.frameDesign === 'jacket-quote' ? (
          <div className="space-y-3">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-300 flex items-start gap-2.5">
              <span className="text-base">📌</span>
              <div>
                <strong className="block text-yellow-300 font-bold mb-0.5">
                  बयान एवं कोटेशन टेम्पलेट: केवल सिंगल फोटो अनुमत
                </strong>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  इस टेम्पलेट में केवल 1 मुख्य फोटो (सिंगल इमेज) ही कार्य करेगी। नीचे का 50% भाग बयान और वक्ता की जानकारी के लिए आरक्षित है।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-4 py-2.5 rounded-lg text-xs font-bold border border-yellow-400 bg-yellow-500/20 text-yellow-300 shadow-sm flex items-center gap-2">
                <span>📷 1 इमेज (सिंगल फोटो मोड)</span>
                <span className="text-[10px] bg-yellow-400 text-neutral-950 font-black px-1.5 py-0.5 rounded">
                  सक्रिय (Active)
                </span>
              </div>
            </div>
          </div>
        ) : (
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
        )}

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
        </div>

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

            {/* 4-Way Directional Cursor Pad & Photo Position Control */}
            <PhotoPositionControl
              label={`${availableCropPhotos.find((p) => p.key === activeCropPhotoKey)?.label || 'फोटो'} स्थिति व कर्सर कंट्रोल`}
              crop={currentCrop}
              onChange={(updates) => updateCrop(activeCropPhotoKey, updates)}
            />
          </div>
        </div>
        )}

        {/* Photo Disclaimer Selector in Step 3 (AI GENERATED / प्रतीकात्मक फोटो / None) */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
              <span>फोटो डिस्क्लेमर वाटरमार्क (Photo Disclaimer):</span>
            </label>
            <span className="text-[10px] text-yellow-400 font-semibold">
              {card.photoDisclaimerType === 'representative'
                ? '📷 प्रतीकात्मक फोटो'
                : card.photoDisclaimerType === 'ai' || (card.showAiGenerated && card.photoDisclaimerType !== 'none')
                ? '🤖 AI जनरेटेड'
                : 'हटाया हुआ (None)'}
            </span>
          </div>

          {/* 3-way toggle buttons */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => onChange({ photoDisclaimerType: 'none', showAiGenerated: false })}
              className={`py-1.5 px-2 rounded-md font-bold text-center transition-all cursor-pointer ${
                (!card.photoDisclaimerType || card.photoDisclaimerType === 'none') && !card.showAiGenerated
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              बंद (None)
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  photoDisclaimerType: 'representative',
                  showAiGenerated: false,
                  representativePhotoText: card.representativePhotoText || 'प्रतीकात्मक फोटो',
                })
              }
              className={`py-1.5 px-2 rounded-md font-bold text-center transition-all cursor-pointer ${
                card.photoDisclaimerType === 'representative'
                  ? 'bg-amber-500/25 text-amber-300 shadow-sm border border-amber-500/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              प्रतीकात्मक फोटो
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  photoDisclaimerType: 'ai',
                  showAiGenerated: true,
                  aiGeneratedText: card.aiGeneratedText || 'AI GENERATED',
                })
              }
              className={`py-1.5 px-2 rounded-md font-bold text-center transition-all cursor-pointer ${
                card.photoDisclaimerType === 'ai' || (card.showAiGenerated && card.photoDisclaimerType !== 'none' && card.photoDisclaimerType !== 'representative')
                  ? 'bg-purple-500/25 text-purple-300 shadow-sm border border-purple-500/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              AI जनरेटेड
            </button>
          </div>

          {/* Disclaimer Text Input if active */}
          {card.photoDisclaimerType === 'representative' && (
            <div className="pt-1 flex items-center gap-2">
              <input
                type="text"
                value={card.representativePhotoText ?? 'प्रतीकात्मक फोटो'}
                onChange={(e) => onChange({ representativePhotoText: e.target.value })}
                placeholder="प्रतीकात्मक फोटो"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none font-['Baloo_2']"
              />
              <span className="text-[10px] text-neutral-400 shrink-0">90° बाईं दीवार</span>
            </div>
          )}

          {(card.photoDisclaimerType === 'ai' || (card.showAiGenerated && card.photoDisclaimerType !== 'none' && card.photoDisclaimerType !== 'representative')) && (
            <div className="pt-1 flex items-center gap-2">
              <input
                type="text"
                value={card.aiGeneratedText || 'AI GENERATED'}
                onChange={(e) => onChange({ aiGeneratedText: e.target.value.toUpperCase() })}
                placeholder="AI GENERATED"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none uppercase font-mono tracking-wider"
              />
              <span className="text-[10px] text-neutral-400 shrink-0">90° बाईं दीवार</span>
            </div>
          )}
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
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 4 / {STEPS.length}</span>
            <button
              type="button"
              onClick={() => setActiveStep(5)}
              className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <span>अगला: हेडलाइन व टेक्स्ट</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Headline & Keyword Highlights (Permanent Fixed Space at Lower Section) */}
      <div
        id="step-headline"
        className={`bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4 scroll-mt-24 lg:scroll-mt-32 ${
          mobileViewMode === 'steps' && activeStep !== 5 ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-yellow-400" />
            स्टेप 5: 3-लाइन कैप्शन हेडलाइन व टेक्स्ट
          </span>
          <div className="flex items-center gap-2">
            {card.frameDesign !== 'jacket-morning' && (
              <span className="text-[11px] text-neutral-400 font-medium">
                अधिकतम 3 लाइनें
              </span>
            )}
          </div>
        </div>

        {/* Headline Line Formatting Helpers & Counter */}
        {card.frameDesign === 'jacket-morning' ? (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ morningShowQuotes: !card.morningShowQuotes })}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  card.morningShowQuotes
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <span>“ ”</span>
                <span>{card.morningShowQuotes ? 'उद्धरण चिह्न (Quotes): चालू' : 'उद्धरण चिह्न: बंद'}</span>
              </button>
            </div>
            <span className="text-[11px] text-amber-300 font-semibold">
              * यह शीर्षक सीधे मॉर्निंग कार्ड के सबसे ऊपर दिखेगा
            </span>
          </div>
        ) : (
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
        )}

        {/* Textarea for headline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-neutral-400 font-medium">
              हिंदी समाचार हेडलाइन (आप जहां चाहें वहां <b>Enter</b> दबाकर 3 लाइनें बना सकते हैं):
            </label>
            <VoiceInputButton
              onTranscript={(transcript) => {
                const current = card.headline ? `${card.headline} ${transcript}` : transcript;
                onChange({
                  headline: current,
                  formattedHeadline: current,
                });
              }}
              title="बोलकर हेडलाइन लिखें (Voice Typing)"
            />
          </div>
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
            💡 <b>सुझाव:</b> हेडलाइन को 3 लाइनों में करने के लिए कीबोर्ड पर <b>Enter</b> दबाकर लाइन तोड़ सकते हैं, या ऊपर <b>'3 लाइनों में बांटें'</b> बटन पर क्लिक करें। माइक बटन से बोलकर भी टाइप कर सकते हैं।
          </p>
        </div>

        {/* Quote Speaker Attribution Input (for Quote Jacket) */}
        {card.frameDesign === 'jacket-quote' && (() => {
          const detected = extractLeaderFromHeadline(card.headline || '');
          const effective = getEffectiveSpeaker(card.speakerName, card.speakerTitle, card.headline);

          return (
            <div className="p-3 bg-neutral-950 border border-yellow-500/40 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>वक्ता / नेता का नाम व पद (बयान कोटेशन):</span>
                </span>
                {detected.name && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        speakerName: detected.name,
                        speakerTitle: detected.title,
                      })
                    }
                    className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/30 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>ऑटो-डिटेक्ट: {detected.name}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-400">वक्ता का नाम:</label>
                    <VoiceInputButton
                      onTranscript={(transcript) => onChange({ speakerName: transcript })}
                      title="बोलकर नाम लिखें"
                    />
                  </div>
                  <input
                    type="text"
                    value={card.speakerName || ''}
                    onChange={(e) => onChange({ speakerName: e.target.value })}
                    placeholder={detected.name ? `उदा. ${detected.name}` : 'उदा. दिग्विजय सिंह'}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-400">पद / पदवी / परिचय:</label>
                    <VoiceInputButton
                      onTranscript={(transcript) => onChange({ speakerTitle: transcript })}
                      title="बोलकर पद लिखें"
                    />
                  </div>
                  <input
                    type="text"
                    value={card.speakerTitle || ''}
                    onChange={(e) => onChange({ speakerTitle: e.target.value })}
                    placeholder={detected.title ? `उदा. ${detected.title}` : 'उदा. पूर्व मुख्यमंत्री'}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick leader preset chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 block font-medium">त्वरित चयन (Quick Pick):</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { name: 'दिग्विजय सिंह', title: 'पूर्व मुख्यमंत्री' },
                    { name: 'डॉ. मोहन यादव', title: 'मुख्यमंत्री, मप्र' },
                    { name: 'शिवराज सिंह चौहान', title: 'केंद्रीय मंत्री' },
                    { name: 'कमलनाथ', title: 'पूर्व मुख्यमंत्री' },
                    { name: 'अनिरुद्धाचार्य महाराज', title: 'कथावाचक' },
                    { name: 'पंडित धीरेंद्र शास्त्री', title: 'पीठाधीश्वर' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        onChange({
                          speakerName: preset.name,
                          speakerTitle: preset.title,
                        })
                      }
                      className="text-[10px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-yellow-400/50 text-neutral-300 hover:text-white px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] bg-neutral-900/90 border border-neutral-800 rounded p-1.5 text-neutral-300 flex items-center justify-between">
                <span>कार्ड पर दिखेगा:</span>
                <span className="font-bold text-white">
                  {effective.name ? `— ${effective.name}${effective.title ? ` | ${effective.title}` : ''}` : 'खाली (प्रदर्शित नहीं होगा)'}
                </span>
              </div>
            </div>
          );
        })()}

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

        {/* Interactive Manual Word Highlighting System */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-2.5">
          <div className="text-[11px] font-semibold text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-yellow-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              हाइलाइट करने के लिए शब्द (पीले रंग में दिखेंगे):
            </span>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-[10px] font-bold">
                {card.highlightWords?.length || 0} शब्द हाइलाइटेड
              </span>
              {(card.highlightWords?.length || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      highlightWords: [],
                      formattedHeadline: card.headline.replace(/\[yellow\]/g, '').replace(/\[\/yellow\]/g, ''),
                    });
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                >
                  सब हटाएं (Clear)
                </button>
              )}
            </div>
          </div>

          {/* Direct Manual Input to customize or type words */}
          <div>
            <input
              type="text"
              value={(card.highlightWords || []).join(', ')}
              onChange={(e) => {
                const raw = e.target.value;
                const newWords = raw
                  .split(/[,،]+/)
                  .map((w) => w.trim())
                  .filter(Boolean);
                const formatted = buildFormattedHeadline(card.headline, newWords);
                onChange({
                  highlightWords: newWords,
                  formattedHeadline: formatted,
                });
              }}
              placeholder="उदा. सड़क हादसा, 15 की मौत (कॉमा लगाकर शब्द लिखें)"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-yellow-300 focus:border-yellow-400 focus:outline-none font-bold"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              * अपनी पसंद का कोई भी शब्द यहां कॉमा (,) लगाकर टाइप करें, या नीचे हेडलाइन के शब्दों पर क्लिक करें:
            </p>
          </div>

          {/* Clickable Word Chips from Headline */}
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-neutral-900 rounded-lg border border-neutral-800">
            {getHeadlineWords().map((word, wIdx) => {
              const clean = word.replace(/[.,:;!?।\-"'“”‘’()]/g, '').trim();
              const isSelected = (card.highlightWords || []).some(
                (hw) => hw.toLowerCase() === clean.toLowerCase()
              );
              return (
                <button
                  key={`${word}-${wIdx}`}
                  type="button"
                  onClick={() => toggleWordHighlight(word)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-yellow-400 text-neutral-950 shadow-sm font-extrabold ring-1 ring-yellow-400'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                  title={isSelected ? 'क्लिक करके हाइलाइट हटाएं' : 'क्लिक करके पीला रंग दें'}
                >
                  {word} {isSelected && '✓'}
                </button>
              );
            })}
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
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 5 / {STEPS.length}</span>
            <button
              type="button"
              onClick={() => setActiveStep(6)}
              className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-neutral-950 font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <span>अगला: जिला व दिनांक</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 6. स्थान, जिला, कॉलआउट व दिनांक - STEP 6 */}
      <div
        id="step-location-date"
        className={`bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4 scroll-mt-24 lg:scroll-mt-32 ${
          mobileViewMode === 'steps' && activeStep !== 6 ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-500" />
            स्टेप 6: स्थान, जिला, कॉलआउट टैग व दिनांक
          </span>
          <span className="text-[11px] text-neutral-400">
            लोकेशन ऑन/ऑफ • कॉलआउट • 90° डेटलाइन
          </span>
        </div>

        {/* Location, Callout Tag, AI Generated Tag & Date Stamp (Positioned above headline) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* 1. Location with On/Off Toggle (Not shown for Morning Jacket) */}
          {card.frameDesign !== 'jacket-morning' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-neutral-400 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-red-500" />
                स्थान / जिला:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange({ showLocation: card.showLocation === false ? true : false })}
                  className={`text-[10px] font-black px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    card.showLocation !== false
                      ? 'bg-green-500/20 border-green-500/60 text-green-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  {card.showLocation !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={card.location || ''}
                onChange={(e) => onChange({ location: e.target.value })}
                placeholder="मध्य प्रदेश / सीधी / रीवा"
                disabled={card.showLocation === false}
                className={`w-full bg-neutral-950 border rounded-lg px-3 py-2 text-xs focus:outline-none font-['Noto_Sans_Devanagari'] ${
                  card.showLocation === false
                    ? 'opacity-40 border-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'border-neutral-700 text-white focus:border-yellow-400'
                }`}
              />
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              {card.showLocation !== false ? '* कार्ड पर लोकेशन दिखेगी' : '* लोकेशन छिपी हुई है'}
            </p>
          </div>
          )}

          {/* 2. Callout Tag */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-neutral-400 font-medium">
                कॉलआउट टैग:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange({ showCallout: !card.showCallout })}
                  className={`text-[10px] font-black px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    card.showCallout
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  {card.showCallout ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={card.calloutTag}
                onChange={(e) => onChange({ calloutTag: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              * कैप्शन के ऊपर दाईं ओर दिखेगा
            </p>
          </div>

          {/* 3. Date Stamp (Right edge, 90° rotated per user request) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                📅 दिनांक (Date):
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange({ showDate: card.showDate === false ? true : false })}
                  className={`text-[10px] font-black px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    card.showDate !== false
                      ? 'bg-green-500/20 border-green-500/60 text-green-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                  title="कार्ड पर डेट ऑन/ऑफ करें"
                >
                  {card.showDate !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={card.dateStr || getFormattedHindiDate()}
                onChange={(e) => onChange({ dateStr: e.target.value })}
                disabled={card.showDate === false}
                placeholder="उदा. 5 सितम्बर 2026, शनिवार"
                className={`w-full bg-neutral-950 border rounded-lg px-2.5 py-2 text-xs focus:outline-none font-['Baloo_2'] ${
                  card.showDate === false
                    ? 'opacity-40 border-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'border-neutral-700 text-white focus:border-yellow-400'
                }`}
              />
              <button
                type="button"
                onClick={() => onChange({ dateStr: getFormattedHindiDate() })}
                title="आज की तारीख सेट करें"
                className="px-2 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-[10px] font-bold shrink-0 cursor-pointer"
              >
                आज
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              * दाईं दीवार पर 270° रोटेटेड डेटलाइन
            </p>
          </div>
        </div>

        {/* Step 6 Mobile Nav Buttons */}
        {mobileViewMode === 'steps' && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs lg:hidden">
            <button
              type="button"
              onClick={() => setActiveStep(5)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>पिछला: हेडलाइन</span>
            </button>
            <span className="text-neutral-500 font-semibold text-[11px]">स्टेप 6 / {STEPS.length}</span>
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

      {/* Social Media Caption Generator Button */}
      <button
        onClick={onOpenCaptionModal}
        className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
      >
        <Share2 className="w-4 h-4 text-green-400" />
        <span>इंस्टाग्राम / फेसबुक पोस्ट कैप्शन कॉपी करें</span>
      </button>
        </>
      )}
    </div>
  );
};
