/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Central Newsroom — Graphics & Design Studio
 * Grounded in docs/07-Design.md, docs/11-Architecture.md, docs/12-Database.md (DOM-H),
 * docs/13-API.md, and docs/DECISIONS.md (DEC-048, DEC-060, DEC-069)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Layers,
  Download,
  RotateCcw,
  RotateCw,
  Plus,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Shield,
  Check,
  ZoomIn,
  ZoomOut,
  Type,
  Square,
  Image as ImageIcon,
  AlertTriangle,
  FolderOpen,
  Save,
} from 'lucide-react';
import {
  DesignDocument,
  DesignTemplate,
  DesignElement,
  CanvasBackground,
  StudioMode,
  StudioPresetConfig,
  ExportDesignPayload,
} from '../types';
import {
  fetchNewsroomTemplates,
  fetchNewsroomDesigns,
  createDesign,
  updateDesign,
  prefillDesignFromArticle,
  exportDesign,
  requestAiDesignConcept,
} from '../lib/api';

// Canonical Studio Presets
const STUDIO_PRESETS: StudioPresetConfig[] = [
  {
    id: 'yt-thumb',
    nameHi: 'यूट्यूब थंबनेल',
    nameEn: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    studioType: 'thumbnail',
    descriptionHi: '16:9 लैंडस्केप वीडियो कवर (1280x720)',
  },
  {
    id: 'yt-shorts',
    nameHi: 'शॉर्ट्स / रील्स',
    nameEn: 'YouTube Shorts / Reels',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    studioType: 'thumbnail',
    descriptionHi: '9:16 वर्टिकल फुल-स्क्रीन वीडियो (1080x1920)',
  },
  {
    id: 'insta-portrait',
    nameHi: 'इंस्टाग्राम पोर्ट्रेट',
    nameEn: 'Instagram Portrait',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    studioType: 'social',
    descriptionHi: '4:5 उच्च-एंगैजमेंट सोशल पोस्ट (1080x1350)',
  },
  {
    id: 'insta-square',
    nameHi: 'इंस्टाग्राम स्क्वायर',
    nameEn: 'Instagram Square',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    studioType: 'social',
    descriptionHi: '1:1 वर्गाकार न्यूज़ कार्ड (1080x1080)',
  },
  {
    id: 'fb-post',
    nameHi: 'फेसबुक पोस्ट',
    nameEn: 'Facebook Post',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    studioType: 'social',
    descriptionHi: '1.91:1 फेसबुक न्यूज़ लिंक व पोस्ट (1200x630)',
  },
  {
    id: 'x-post',
    nameHi: 'X (ट्विटर) पोस्ट',
    nameEn: 'X Post',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    studioType: 'social',
    descriptionHi: '16:9 माइक्रो-ब्लॉगिंग इमेज (1200x675)',
  },
  {
    id: 'x-banner',
    nameHi: 'X हेडर बैनर',
    nameEn: 'X Banner',
    width: 1500,
    height: 500,
    aspectRatio: '3:1',
    studioType: 'graphic',
    descriptionHi: '3:1 प्रोफ़ाइल हेडर बैनर (1500x500)',
  },
];

const CANONICAL_BRAND_LOGO = {
  url: '/brand/logo.png',
  hash: '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F',
};

export const DesignStudioView: React.FC = () => {
  // Navigation & Mode
  const [studioMode, setStudioMode] = useState<StudioMode>('thumbnail');
  const [activeLeftTab, setActiveLeftTab] = useState<'templates' | 'text' | 'shapes' | 'brand' | 'media' | 'my-designs'>('templates');

  // Document State
  const [docId, setDocId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('नया थंबनेल डिज़ाइन');
  const [currentPreset, setCurrentPreset] = useState<StudioPresetConfig>(STUDIO_PRESETS[0]!);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [background, setBackground] = useState<CanvasBackground>({ type: 'color', value: '#0F172A' });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<DesignElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Viewport & Guides
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);
  const [showSafeAreas, setShowSafeAreas] = useState<boolean>(true);

  // Template & Catalog State
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [myDesigns, setMyDesigns] = useState<DesignDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);

  // Modals
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp' | 'svg'>('png');
  const [exportScale, setExportScale] = useState<1 | 2 | 3>(2);
  const [exportQuality, setExportQuality] = useState<number>(92);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiConceptResult, setAiConceptResult] = useState<{
    suggestedElements: any[];
    suggestedColors: string[];
    layoutConcept: string;
  } | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Push to history stack for Undo/Redo
  const pushHistory = (newElements: DesignElement[]) => {
    const sliced = history.slice(0, historyIndex + 1);
    setHistory([...sliced, newElements]);
    setHistoryIndex(sliced.length);
    setSaveStatus('unsaved');
  };

  // 1. Initial Load & Route Prefill Check
  useEffect(() => {
    loadTemplates();
    loadUserDesigns();

    // Check if URL has ?prefillNewsId=...
    const hash = window.location.hash;
    const match = hash.match(/prefillNewsId=([^&]+)/);
    if (match && match[1]) {
      const newsId = decodeURIComponent(match[1]);
      handlePrefillFromNews(newsId);
    } else {
      initBlankCanvas(STUDIO_PRESETS[0]!);
    }
  }, []);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await fetchNewsroomTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.warn('Failed to load templates:', err.message);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadUserDesigns = async () => {
    try {
      const data = await fetchNewsroomDesigns();
      setMyDesigns(data);
    } catch (err: any) {
      console.warn('Failed to load designs:', err.message);
    }
  };

  const handlePrefillFromNews = async (newsId: string) => {
    try {
      setSaveStatus('saving');
      const doc = await prefillDesignFromArticle(newsId, 'thumbnail', '16:9');
      setTitle(doc.title);
      setElements(doc.elements);
      if (doc.background) setBackground(doc.background);
      setDocId(doc.id);
      setHistory([doc.elements]);
      setHistoryIndex(0);
      setSaveStatus('saved');
      showToast('समाचार से थंबनेल टेम्पलेट सफलतापूर्वक प्रीफ़िल किया गया!');
    } catch (err: any) {
      setErrorMessage(err.message || 'समाचार से प्रीफ़िल करने में विफल।');
    }
  };

  const initBlankCanvas = (preset: StudioPresetConfig) => {
    setCurrentPreset(preset);
    const initialElements: DesignElement[] = [
      {
        id: `brand-logo-${Date.now()}`,
        type: 'logo',
        variant: 'official_primary',
        name: 'Official Logo',
        x: 40,
        y: 40,
        width: 140,
        height: 50,
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        isLocked: false,
        isVisible: true,
        imageUrl: CANONICAL_BRAND_LOGO.url,
        keepAspectRatio: true,
      },
      {
        id: `headline-${Date.now()}`,
        type: 'text',
        name: 'Main Headline',
        x: 50,
        y: preset.height - 240,
        width: preset.width - 100,
        height: 120,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        isLocked: false,
        isVisible: true,
        text: 'मध्यप्रदेश ब्रेकिंग न्यूज़: यहां मुख्य शीर्षक दर्ज करें',
        fontFamily: 'Rozha One',
        fontSize: preset.height > 1000 ? 56 : 46,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'left',
        lineHeight: 1.25,
        letterSpacing: 0,
        isDevanagari: true,
      },
      {
        id: `ribbon-${Date.now()}`,
        type: 'badge',
        badgeKind: 'breaking_ribbon',
        name: 'Breaking Badge',
        x: 50,
        y: preset.height - 300,
        width: 220,
        height: 44,
        rotation: 0,
        opacity: 1,
        zIndex: 6,
        isLocked: false,
        isVisible: true,
        text: '🔴 ब्रेकिंग न्यूज़',
        primaryColor: '#DC2626',
        textColor: '#FFFFFF',
      },
    ];
    setElements(initialElements);
    setHistory([initialElements]);
    setHistoryIndex(0);
    setSelectedElementId(initialElements[1]!.id);
    setSaveStatus('unsaved');
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setElements(history[newIndex]!);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setElements(history[newIndex]!);
      setHistoryIndex(newIndex);
    }
  };

  // Selected Element
  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  // Add Elements
  const handleAddText = (type: 'title' | 'subtitle' | 'ribbon' | 'tag') => {
    const id = `text-${Date.now()}`;
    let newEl: DesignElement;
    const maxZ = elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);

    if (type === 'title') {
      newEl = {
        id,
        type: 'text',
        name: 'Headline Text',
        x: 60,
        y: 120,
        width: currentPreset.width - 120,
        height: 100,
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        isLocked: false,
        isVisible: true,
        text: 'नया समाचार शीर्षक यहां लिखें',
        fontFamily: 'Rozha One',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        isDevanagari: true,
      };
    } else if (type === 'subtitle') {
      newEl = {
        id,
        type: 'text',
        name: 'Subtitle',
        x: 60,
        y: 240,
        width: currentPreset.width - 120,
        height: 60,
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        isLocked: false,
        isVisible: true,
        text: 'विस्तृत विवरण एवं ग्राउंड रिपोर्ट',
        fontFamily: 'Noto Sans Devanagari',
        fontSize: 24,
        fontWeight: '500',
        color: '#E2E8F0',
        textAlign: 'left',
        lineHeight: 1.3,
        letterSpacing: 0,
        isDevanagari: true,
      };
    } else if (type === 'ribbon') {
      newEl = {
        id,
        type: 'badge',
        badgeKind: 'breaking_ribbon',
        name: 'Breaking Ribbon',
        x: 60,
        y: 60,
        width: 240,
        height: 44,
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        isLocked: false,
        isVisible: true,
        text: '🔴 ब्रेकिंग न्यूज़ | भोपाल',
        primaryColor: '#E11D48',
        textColor: '#FFFFFF',
      };
    } else {
      newEl = {
        id,
        type: 'badge',
        badgeKind: 'location',
        name: 'Bureau Tag',
        x: 60,
        y: 60,
        width: 180,
        height: 38,
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        isLocked: false,
        isVisible: true,
        text: '📍 भोपाल ब्यूरो विशेष',
        primaryColor: '#020617',
        textColor: '#38BDF8',
      };
    }

    const updated = [...elements, newEl];
    setElements(updated);
    pushHistory(updated);
    setSelectedElementId(id);
    showToast('टेक्स्ट जोड़ा गया');
  };

  const handleAddShape = (shapeType: 'rect' | 'shade' | 'box') => {
    const id = `shape-${Date.now()}`;
    const maxZ = elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
    let newEl: DesignElement;

    if (shapeType === 'shade') {
      newEl = {
        id,
        type: 'shape',
        shapeKind: 'rectangle',
        name: 'Bottom Vignette Shade',
        x: 0,
        y: currentPreset.height - 350,
        width: currentPreset.width,
        height: 350,
        rotation: 0,
        opacity: 0.9,
        zIndex: Math.max(1, maxZ - 1),
        isLocked: false,
        isVisible: true,
        fillColor: '#020617',
        borderRadius: 0,
      };
    } else {
      newEl = {
        id,
        type: 'shape',
        shapeKind: 'rounded_rectangle',
        name: 'Accent Box',
        x: 60,
        y: 60,
        width: 280,
        height: 160,
        rotation: 0,
        opacity: 0.95,
        zIndex: maxZ + 1,
        isLocked: false,
        isVisible: true,
        fillColor: '#1E293B',
        strokeColor: '#334155',
        strokeWidth: 2,
        borderRadius: 12,
      };
    }

    const updated = [...elements, newEl];
    setElements(updated);
    pushHistory(updated);
    setSelectedElementId(id);
    showToast('आकृति जोड़ी गई');
  };

  const handleAddBrandLogo = () => {
    const id = `logo-${Date.now()}`;
    const maxZ = elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
    const newEl: DesignElement = {
      id,
      type: 'logo',
      variant: 'official_primary',
      name: 'Official Logo',
      x: 40,
      y: 40,
      width: 150,
      height: 55,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      isLocked: false,
      isVisible: true,
      imageUrl: CANONICAL_BRAND_LOGO.url,
      keepAspectRatio: true,
    };
    const updated = [...elements, newEl];
    setElements(updated);
    pushHistory(updated);
    setSelectedElementId(id);
    showToast('प्रमाणित ब्रांड लोगो जोड़ा गया');
  };

  const handleAddImage = (imageUrl: string = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1280&q=80') => {
    const id = `image-${Date.now()}`;
    const newEl: DesignElement = {
      id,
      type: 'image',
      name: 'Subject Image',
      x: 0,
      y: 0,
      width: currentPreset.width,
      height: currentPreset.height,
      rotation: 0,
      opacity: 0.85,
      zIndex: 1,
      isLocked: false,
      isVisible: true,
      imageUrl,
      objectFit: 'cover',
    };
    const updated = [newEl, ...elements];
    setElements(updated);
    pushHistory(updated);
    setSelectedElementId(id);
    showToast('बैकग्राउंड चित्र जोड़ा गया');
  };

  // Update selected element property
  const updateSelectedElement = (props: Partial<DesignElement> | Record<string, any>) => {
    if (!selectedElementId) return;
    const updated = elements.map((el) => {
      if (el.id === selectedElementId) {
        return { ...el, ...props } as DesignElement;
      }
      return el;
    });
    setElements(updated);
    pushHistory(updated);
  };

  // Delete element
  const handleDeleteElement = (id: string = selectedElementId || '') => {
    if (!id) return;
    const updated = elements.filter((el) => el.id !== id);
    setElements(updated);
    pushHistory(updated);
    setSelectedElementId(null);
    showToast('तत्व हटाया गया');
  };

  // Duplicate element
  const handleDuplicateElement = () => {
    if (!selectedElement) return;
    const id = `${selectedElement.type}-${Date.now()}`;
    const maxZ = elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
    const dup: DesignElement = {
      ...selectedElement,
      id,
      name: `${selectedElement.name} (Copy)`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      zIndex: maxZ + 1,
    } as DesignElement;
    const updated = [...elements, dup];
    setElements(updated);
    pushHistory(updated);
    setSelectedElementId(id);
    showToast('तत्व की प्रतिलिपि बनाई गई');
  };

  // Layer Reordering
  const handleBringToFront = () => {
    if (!selectedElement) return;
    const maxZ = elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
    updateSelectedElement({ zIndex: maxZ + 1 });
  };

  const handleSendToBack = () => {
    if (!selectedElement) return;
    const minZ = elements.reduce((acc, el) => Math.min(acc, el.zIndex), 1);
    updateSelectedElement({ zIndex: Math.max(0, minZ - 1) });
  };

  // Alignments
  const handleAlign = (alignType: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElement) return;
    let newX = selectedElement.x;
    let newY = selectedElement.y;

    if (alignType === 'left') newX = 40;
    if (alignType === 'center') newX = Math.round((currentPreset.width - selectedElement.width) / 2);
    if (alignType === 'right') newX = currentPreset.width - selectedElement.width - 40;
    if (alignType === 'top') newY = 40;
    if (alignType === 'middle') newY = Math.round((currentPreset.height - selectedElement.height) / 2);
    if (alignType === 'bottom') newY = currentPreset.height - selectedElement.height - 40;

    updateSelectedElement({ x: newX, y: newY });
  };

  // Load Template
  const handleLoadTemplate = (template: DesignTemplate) => {
    const preset =
      STUDIO_PRESETS.find((p) => p.aspectRatio === template.dimensions.aspectRatio) ||
      STUDIO_PRESETS[0]!;

    setCurrentPreset(preset);
    setTitle(template.name);
    setElements(template.schema.elements);
    if (template.schema.background) setBackground(template.schema.background);
    setHistory([template.schema.elements]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setSaveStatus('unsaved');
    showToast(`टेम्पलेट "${template.name}" लोड किया गया!`);
  };

  // Save Document
  const handleSaveDesign = async () => {
    setSaveStatus('saving');
    try {
      if (docId) {
        await updateDesign(docId, {
          title,
          elements,
          canvas: {
            width: currentPreset.width,
            height: currentPreset.height,
            aspectRatio: currentPreset.aspectRatio,
            background,
          },
        });
      } else {
        const saved = await createDesign({
          title,
          studioType: currentPreset.studioType,
          canvas: {
            width: currentPreset.width,
            height: currentPreset.height,
            aspectRatio: currentPreset.aspectRatio,
            background,
          },
          elements,
        });
        setDocId(saved.id);
      }
      setSaveStatus('saved');
      showToast('डिजाइन सफलतापूर्वक सहेजा गया!');
      loadUserDesigns();
    } catch (err: any) {
      setSaveStatus('unsaved');
      setErrorMessage(err.message || 'डिजाइन सहेजने में विफल।');
    }
  };

  // Export Design Trigger
  const handleTriggerExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const payload: ExportDesignPayload = {
        format: exportFormat,
        scaleFactor: exportScale,
        quality: exportQuality / 100,
        document: {
          id: docId || `local-${Date.now()}`,
          title,
          studioType: currentPreset.studioType,
          dimensions: {
            width: currentPreset.width,
            height: currentPreset.height,
            aspectRatio: currentPreset.aspectRatio,
            label: currentPreset.nameHi,
          },
          background,
          elements,
          version: 1,
          status: 'draft',
          ownerId: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const result = await exportDesign(payload);
      showToast('डिजाइन निर्यात तैयार है!');

      if (result.downloadUrl) {
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'निर्यात प्रसंस्करण विफल रहा।');
    } finally {
      setIsExporting(false);
    }
  };

  // AI Concept Generation
  const handleRequestAiConcept = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await requestAiDesignConcept({
        prompt: aiPrompt,
        studioType: currentPreset.studioType,
        aspectRatio: currentPreset.aspectRatio,
      });
      setAiConceptResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'AI सुझाव प्राप्त करने में विफल।');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiConcept = () => {
    if (!aiConceptResult) return;
    const maxZ = elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
    const converted = aiConceptResult.suggestedElements.map((el, i) => ({
      ...el,
      id: `ai-${Date.now()}-${i}`,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + i + 1,
      isLocked: false,
      isVisible: true,
    }));
    const updated = [...elements, ...converted];
    setElements(updated);
    pushHistory(updated);
    setShowAiModal(false);
    showToast('AI डिज़ाइन सुझाव कैनवास पर लागू किए गए!');
  };

  // Preset Switcher
  const handleSelectPreset = (preset: StudioPresetConfig) => {
    setCurrentPreset(preset);
    setStudioMode(preset.studioType as StudioMode);
    showToast(`कैनवास आकार ${preset.nameHi} (${preset.width}x${preset.height}) सेट किया गया`);
  };

  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="design-studio-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', overflow: 'hidden' }}>
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header style={{ height: '56px', backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 40, flexShrink: 0 }}>
        {/* Left: Branding & Studio Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={20} style={{ color: '#E11D48' }} />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              डिज़ाइन स्टूडियो
            </span>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#1E293B', borderRadius: '6px', padding: '2px', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => { setStudioMode('thumbnail'); setCurrentPreset(STUDIO_PRESETS[0]!); }}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: studioMode === 'thumbnail' ? '#E11D48' : 'transparent',
                color: studioMode === 'thumbnail' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              थंबनेल स्टूडियो (16:9 / 9:16)
            </button>
            <button
              type="button"
              onClick={() => { setStudioMode('social'); setCurrentPreset(STUDIO_PRESETS[2]!); }}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: studioMode === 'social' ? '#E11D48' : 'transparent',
                color: studioMode === 'social' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              सोशल मीडिया (4:5 / 1:1)
            </button>
            <button
              type="button"
              onClick={() => { setStudioMode('graphic'); setCurrentPreset(STUDIO_PRESETS[6]!); }}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: studioMode === 'graphic' ? '#E11D48' : 'transparent',
                color: studioMode === 'graphic' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              ग्राफ़िक कैनवास
            </button>
          </div>
        </div>

        {/* Center: Title & Preset Dimensions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center', maxWidth: '480px' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setSaveStatus('unsaved'); }}
            placeholder="डिज़ाइन का शीर्षक दर्ज करें..."
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#F8FAFC',
              width: '100%',
              maxWidth: '260px',
            }}
          />

          <select
            value={currentPreset.id}
            onChange={(e) => {
              const p = STUDIO_PRESETS.find((x) => x.id === e.target.value);
              if (p) handleSelectPreset(p);
            }}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              color: '#F8FAFC',
              fontWeight: 500,
            }}
          >
            {STUDIO_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameHi} ({p.width}x{p.height})
              </option>
            ))}
          </select>

          <span style={{ fontSize: '11px', color: saveStatus === 'saved' ? '#10B981' : saveStatus === 'saving' ? '#F59E0B' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ height: '7px', width: '7px', borderRadius: '50%', backgroundColor: saveStatus === 'saved' ? '#10B981' : saveStatus === 'saving' ? '#F59E0B' : '#64748B' }} />
            {saveStatus === 'saved' ? 'सहेजा गया' : saveStatus === 'saving' ? 'सहेजा जा रहा...' : 'असुरक्षित'}
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="पूर्ववत करें (Undo)"
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: historyIndex <= 0 ? '#475569' : '#CBD5E1',
              cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="पुनः करें (Redo)"
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: historyIndex >= history.length - 1 ? '#475569' : '#CBD5E1',
              cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <RotateCw size={15} />
          </button>

          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#312E81',
              border: '1px solid #4F46E5',
              color: '#C7D2FE',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} style={{ color: '#818CF8' }} />
            <span>AI कॉन्सेप्ट</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDesign}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={14} />
            <span>सहेजें</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: '#E11D48',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={15} />
            <span>निर्यात (Export)</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* A. LEFT TOOLBAR & ASSET DRAWER */}
        <aside style={{ width: '320px', backgroundColor: '#0F172A', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Subtabs Bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1E293B', backgroundColor: '#090D16' }}>
            {[
              { id: 'templates', label: 'टेम्पलेट्स', icon: FolderOpen },
              { id: 'text', label: 'टेक्स्ट', icon: Type },
              { id: 'shapes', label: 'आकृतियां', icon: Square },
              { id: 'brand', label: 'लोगो/ब्रांड', icon: Shield },
              { id: 'media', label: 'मीडिया', icon: ImageIcon },
              { id: 'my-designs', label: 'मेरी फाइलें', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeLeftTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveLeftTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    backgroundColor: isActive ? '#0F172A' : 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #E11D48' : '2px solid transparent',
                    color: isActive ? '#FFFFFF' : '#64748B',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Drawer Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
            {/* TAB: TEMPLATES */}
            {activeLeftTab === 'templates' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
                    न्यूज़रूम टेम्पलेट्स
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    {templates.length} उपलब्ध
                  </span>
                </div>

                {/* Category Filter */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
                  {['all', 'breaking', 'election', 'viral', 'quote', 'development'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        backgroundColor: selectedCategory === cat ? '#E11D48' : '#1E293B',
                        color: selectedCategory === cat ? '#FFFFFF' : '#94A3B8',
                      }}
                    >
                      {cat === 'all' ? 'सभी' : cat === 'breaking' ? 'ब्रेकिंग' : cat === 'election' ? 'चुनाव' : cat === 'viral' ? 'वायरल' : cat === 'quote' ? 'बयान' : 'विकास'}
                    </button>
                  ))}
                </div>

                {isLoadingTemplates ? (
                  <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '20px 0' }}>
                    टेम्पलेट्स लोड हो रहे हैं...
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {templates
                      .filter((t) => selectedCategory === 'all' || t.category === selectedCategory)
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleLoadTemplate(t)}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: '#1E293B',
                            border: '1px solid #334155',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E11D48')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#F1F5F9' }}>
                              {t.name}
                            </span>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#020617', color: '#38BDF8', fontWeight: 600 }}>
                              {t.dimensions?.aspectRatio || '16:9'}
                            </span>
                          </div>
                          <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                            {t.description || `${t.category} श्रेणी के लिए डिज़ाइन`}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: TEXT */}
            {activeLeftTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px 0', color: '#F8FAFC' }}>
                  शीर्षक व टेक्स्ट घटक
                </h4>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 10px 0' }}>
                  देवनागरी फॉन्ट्स (Rozha One, Noto Sans) समर्थित।
                </p>

                <button
                  type="button"
                  onClick={() => handleAddText('title')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontFamily: 'Rozha One', fontSize: '20px', fontWeight: 'bold' }}>
                    मुख्य ब्रेकिंग शीर्षक
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    Rozha One • 48px • बोल्ड
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddText('subtitle')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#E2E8F0',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '15px', fontWeight: 600 }}>
                    उप-शीर्षक / विवरण लाइन
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    Noto Sans Devanagari • 24px • मीडियम
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddText('ribbon')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'inline-block', backgroundColor: '#E11D48', color: '#FFF', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                    🔴 ब्रेकिंग न्यूज़ | भोपाल
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                    फ्लैश अलर्ट रिबन बार
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddText('tag')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'inline-block', backgroundColor: '#020617', color: '#38BDF8', padding: '3px 8px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600, border: '1px solid #1E293B' }}>
                    📍 भोपाल ब्यूरो विशेष
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                    जिला व संवाददाता पिल बैज
                  </div>
                </button>
              </div>
            )}

            {/* TAB: SHAPES & BADGES */}
            {activeLeftTab === 'shapes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px 0', color: '#F8FAFC' }}>
                  आकृतियां व डार्क विगनेट शेड
                </h4>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 10px 0' }}>
                  थंबनेल में टेक्स्ट पठनीयता के लिए डार्क शेड ओवरले का उपयोग करें।
                </p>

                <button
                  type="button"
                  onClick={() => handleAddShape('shade')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#F8FAFC',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{ height: '36px', width: '48px', borderRadius: '4px', background: 'linear-gradient(to top, #020617, transparent)', border: '1px solid #475569' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>बॉटम विगनेट शेड (Vignette)</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>थंबनेल टेक्स्ट के पीछे ग्रेडिएंट</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddShape('box')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#F8FAFC',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Square size={24} style={{ color: '#38BDF8' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>कंटेनर कार्ड बॉक्स</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>राउंडेड रेक्टेंगल बॉक्स</div>
                  </div>
                </button>
              </div>
            )}

            {/* TAB: BRAND LOGO */}
            {activeLeftTab === 'brand' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 4px 0', color: '#F8FAFC' }}>
                  प्रमाणित ब्रांड लोगो व वाटरमार्क
                </h4>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                  DEC-060: आधिकारिक लोगो और 1:1 पहलू अनुपात का सख्त पालन।
                </p>

                <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', textAlign: 'center' }}>
                  <img
                    src={CANONICAL_BRAND_LOGO.url}
                    alt="BREAKING NEWS WALA"
                    style={{ height: '40px', width: 'auto', margin: '0 auto 10px auto', display: 'block' }}
                  />
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#10B981', marginBottom: '10px' }}>
                    SHA-256: 88407B32...35209F (सत्यापित)
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBrandLogo}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: '#E11D48',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    कैनवास पर लोगो जोड़ें
                  </button>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', fontSize: '11px', lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} />
                    <span>वैधानिक चेतावनी (State Emblem Act 2005)</span>
                  </div>
                  मध्यप्रदेश शासकीय मुहर व अशोक स्तंभ का थंबनेल या न्यूज़ कार्ड में प्रयोग पूर्णतः प्रतिबंधित है।
                </div>
              </div>
            )}

            {/* TAB: MEDIA */}
            {activeLeftTab === 'media' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px 0', color: '#F8FAFC' }}>
                  तस्वीरें व बैकग्राउंड मीडिया
                </h4>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 10px 0' }}>
                  उच्च-गुणवत्ता न्यूज़ बैकग्राउंड चित्र जोड़ें।
                </p>

                <button
                  type="button"
                  onClick={() => handleAddImage()}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Plus size={16} />
                  <span>स्टॉक न्यूज़ बैकग्राउंड लगाएं</span>
                </button>
              </div>
            )}

            {/* TAB: MY DESIGNS */}
            {activeLeftTab === 'my-designs' && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: '#F8FAFC' }}>
                  हाल ही में बनाए गए डिज़ाइन
                </h4>
                {myDesigns.length === 0 ? (
                  <p style={{ fontSize: '11.5px', color: '#64748B', textAlign: 'center', padding: '20px 0' }}>
                    कोई सुरक्षित डिज़ाइन उपलब्ध नहीं है।
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {myDesigns.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setTitle(d.title);
                          setElements(d.elements);
                          if (d.background) setBackground(d.background);
                          setDocId(d.id);
                          setHistory([d.elements]);
                          setHistoryIndex(0);
                          showToast(`"${d.title}" लोड किया गया`);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>{d.title}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                          {d.studioType} • {new Date(d.updatedAt).toLocaleDateString('hi-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* B. CENTER CANVAS WORKSPACE */}
        <main
          style={{
            flex: 1,
            backgroundColor: '#020617',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            padding: '24px',
            position: 'relative',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-container-outer')) {
              setSelectedElementId(null);
            }
          }}
        >
          {/* Canvas Floating Viewport Controls */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 30,
            }}
          >
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.1))}
              title="ज़ूम आउट"
              style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '11px', color: '#CBD5E1', minWidth: '36px', textAlign: 'center', fontWeight: 600 }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))}
              title="ज़ूम इन"
              style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <ZoomIn size={14} />
            </button>
            <div style={{ width: '1px', height: '14px', backgroundColor: '#334155' }} />
            <button
              type="button"
              onClick={() => setShowSafeAreas(!showSafeAreas)}
              title="सेफ-एरिया गाइड टॉगल करें"
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: showSafeAreas ? '#1E293B' : 'transparent',
                color: showSafeAreas ? '#38BDF8' : '#64748B',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              गाइडलाइन
            </button>
          </div>

          {/* Canvas Frame / Stage */}
          <div
            className="canvas-container-outer"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              ref={canvasRef}
              style={{
                width: `${currentPreset.width}px`,
                height: `${currentPreset.height}px`,
                backgroundColor: background.value,
                position: 'relative',
                overflow: 'hidden',
                userSelect: 'none',
              }}
            >
              {/* Safe-Area Margins (10% border inset) */}
              {showSafeAreas && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '40px',
                    border: '1px dashed rgba(56, 189, 248, 0.25)',
                    pointerEvents: 'none',
                    zIndex: 99,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '8px',
                      fontSize: '10px',
                      color: 'rgba(56, 189, 248, 0.6)',
                      fontFamily: 'monospace',
                    }}
                  >
                    SAFE AREA (टाइटल सुरक्षित क्षेत्र)
                  </span>
                </div>
              )}

              {/* Render Elements Ordered by zIndex */}
              {[...elements]
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((el) => {
                  const isSelected = el.id === selectedElementId;

                  return (
                    <div
                      key={el.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(el.id);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        zIndex: el.zIndex,
                        opacity: el.opacity,
                        cursor: 'move',
                        outline: isSelected ? '2px solid #E11D48' : 'none',
                        outlineOffset: '2px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* Text Element */}
                      {el.type === 'text' && (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            fontFamily: el.fontFamily || 'Noto Sans Devanagari',
                            fontSize: `${el.fontSize || 32}px`,
                            fontWeight: el.fontWeight || 'normal',
                            color: el.color || '#FFFFFF',
                            textAlign: el.textAlign || 'left',
                            lineHeight: el.lineHeight || 1.25,
                            wordBreak: 'break-word',
                            overflow: 'hidden',
                            backgroundColor: el.backgroundColor || 'transparent',
                            textShadow: '0 2px 8px rgba(0,0,0,0.85)',
                          }}
                        >
                          {el.text}
                        </div>
                      )}

                      {/* Shape Element */}
                      {el.type === 'shape' && (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: el.fillColor || '#1E293B',
                            borderRadius: `${el.borderRadius || 0}px`,
                            border: el.strokeColor ? `${el.strokeWidth || 1}px solid ${el.strokeColor}` : 'none',
                          }}
                        />
                      )}

                      {/* Badge Element */}
                      {el.type === 'badge' && (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: el.primaryColor || '#DC2626',
                            color: el.textColor || '#FFFFFF',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 700,
                            padding: '0 12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          }}
                        >
                          {el.text}
                        </div>
                      )}

                      {/* Brand Logo Element */}
                      {el.type === 'logo' && (
                        <img
                          src={el.imageUrl || CANONICAL_BRAND_LOGO.url}
                          alt="BREAKING NEWS WALA"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      )}

                      {/* Image Element */}
                      {el.type === 'image' && (
                        <img
                          src={el.imageUrl}
                          alt={el.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: el.objectFit || 'cover',
                            display: 'block',
                          }}
                        />
                      )}

                      {/* Corner Resize Handles for Selected Element */}
                      {isSelected && (
                        <>
                          <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '8px', height: '8px', backgroundColor: '#E11D48', borderRadius: '50%' }} />
                          <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', backgroundColor: '#E11D48', borderRadius: '50%' }} />
                          <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '8px', height: '8px', backgroundColor: '#E11D48', borderRadius: '50%' }} />
                          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '8px', height: '8px', backgroundColor: '#E11D48', borderRadius: '50%' }} />
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </main>

        {/* C. RIGHT PROPERTIES INSPECTOR PANEL */}
        <aside style={{ width: '300px', backgroundColor: '#0F172A', borderLeft: '1px solid #1E293B', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', padding: '16px' }}>
          <div style={{ borderBottom: '1px solid #1E293B', paddingBottom: '12px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 4px 0', color: '#F8FAFC' }}>
              गुणधर्म निरीक्षक (Properties)
            </h4>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              {selectedElement ? `${selectedElement.name} (${selectedElement.type})` : 'कैनवास बैकग्राउंड'}
            </span>
          </div>

          {selectedElement ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Position & Dimensions */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', display: 'block' }}>
                  स्थिति व आकार (X, Y, W, H)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>X:</span>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', fontSize: '11.5px', color: '#FFF' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>Y:</span>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', fontSize: '11.5px', color: '#FFF' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>चौड़ाई:</span>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', fontSize: '11.5px', color: '#FFF' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>ऊंचाई:</span>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', fontSize: '11.5px', color: '#FFF' }}
                    />
                  </div>
                </div>
              </div>

              {/* Text-Specific Properties */}
              {(selectedElement.type === 'text' || selectedElement.type === 'badge') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
                        टेक्स्ट सामग्री
                      </label>
                      <span
                        style={{
                          fontSize: '10px',
                          color: getWordCount(selectedElement.text || '') > 45 ? '#EF4444' : '#64748B',
                          fontWeight: getWordCount(selectedElement.text || '') > 45 ? 700 : 500,
                        }}
                      >
                        {getWordCount(selectedElement.text || '')} शब्द {getWordCount(selectedElement.text || '') > 45 ? '(चेतावनी: 45 से अधिक)' : ''}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={selectedElement.text || ''}
                      onChange={(e) => updateSelectedElement({ text: e.target.value })}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '4px', padding: '6px', fontSize: '12px', color: '#FFF' }}
                    />
                  </div>

                  {selectedElement.type === 'text' && (
                    <>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>
                          फॉन्ट फ़ैमिली (Typography)
                        </label>
                        <select
                          value={selectedElement.fontFamily || 'Rozha One'}
                          onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                          style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '4px', padding: '6px', fontSize: '12px', color: '#FFF' }}
                        >
                          <option value="Rozha One">Rozha One (हेडलाइन देवनागरी)</option>
                          <option value="Noto Sans Devanagari">Noto Sans Devanagari (बॉडी/सबहेड)</option>
                          <option value="Inter">Inter (English Standard)</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>
                            साइज़ ({selectedElement.fontSize || 32}px)
                          </label>
                          <input
                            type="range"
                            min="14"
                            max="80"
                            value={selectedElement.fontSize || 32}
                            onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>
                            टेक्स्ट रंग
                          </label>
                          <input
                            type="color"
                            value={selectedElement.color || '#FFFFFF'}
                            onChange={(e) => updateSelectedElement({ color: e.target.value })}
                            style={{ width: '100%', height: '30px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>
                          संरेखण (Alignment)
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => updateSelectedElement({ textAlign: 'left' })}
                            style={{ flex: 1, padding: '6px', backgroundColor: selectedElement.textAlign === 'left' ? '#E11D48' : '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', cursor: 'pointer' }}
                          >
                            <AlignLeft size={14} style={{ margin: '0 auto' }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSelectedElement({ textAlign: 'center' })}
                            style={{ flex: 1, padding: '6px', backgroundColor: selectedElement.textAlign === 'center' ? '#E11D48' : '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', cursor: 'pointer' }}
                          >
                            <AlignCenter size={14} style={{ margin: '0 auto' }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSelectedElement({ textAlign: 'right' })}
                            style={{ flex: 1, padding: '6px', backgroundColor: selectedElement.textAlign === 'right' ? '#E11D48' : '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', cursor: 'pointer' }}
                          >
                            <AlignRight size={14} style={{ margin: '0 auto' }} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Opacity Slider */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>
                  अपारदर्शिता / Opacity ({Math.round((selectedElement.opacity || 1) * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={selectedElement.opacity || 1}
                  onChange={(e) => updateSelectedElement({ opacity: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Layer Ordering Buttons */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', display: 'block' }}>
                  लेयर क्रम (Z-Index: {selectedElement.zIndex})
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleBringToFront}
                    style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer' }}
                  >
                    सबसे आगे लाएं
                  </button>
                  <button
                    type="button"
                    onClick={handleSendToBack}
                    style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer' }}
                  >
                    सबसे पीछे भेजें
                  </button>
                </div>
              </div>

              {/* Alignment Snapping */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', display: 'block' }}>
                  कैनवास पर संरेखित करें (Snap)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                  <button type="button" onClick={() => handleAlign('left')} style={{ padding: '4px', fontSize: '10.5px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', cursor: 'pointer' }}>बाएं</button>
                  <button type="button" onClick={() => handleAlign('center')} style={{ padding: '4px', fontSize: '10.5px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', cursor: 'pointer' }}>मध्य</button>
                  <button type="button" onClick={() => handleAlign('right')} style={{ padding: '4px', fontSize: '10.5px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', cursor: 'pointer' }}>दाएं</button>
                  <button type="button" onClick={() => handleAlign('top')} style={{ padding: '4px', fontSize: '10.5px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', cursor: 'pointer' }}>ऊपर</button>
                  <button type="button" onClick={() => handleAlign('middle')} style={{ padding: '4px', fontSize: '10.5px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', cursor: 'pointer' }}>बीच में</button>
                  <button type="button" onClick={() => handleAlign('bottom')} style={{ padding: '4px', fontSize: '10.5px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', cursor: 'pointer' }}>नीचे</button>
                </div>
              </div>

              {/* Action Buttons: Duplicate & Delete */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #1E293B' }}>
                <button
                  type="button"
                  onClick={handleDuplicateElement}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#CBD5E1',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Copy size={13} />
                  <span>कॉपी</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteElement()}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#F87171',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Trash2 size={13} />
                  <span>हटाएं</span>
                </button>
              </div>
            </div>
          ) : (
            /* Canvas Background Settings */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', display: 'block' }}>
                  कैनवास बैकग्राउंड रंग
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={background.value}
                    onChange={(e) => setBackground({ type: 'color', value: e.target.value })}
                    style={{ width: '40px', height: '36px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={background.value}
                    onChange={(e) => setBackground({ type: 'color', value: e.target.value })}
                    style={{ flex: 1, backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', display: 'block' }}>
                  क्विक पैलेट चयन
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['#0F172A', '#020617', '#1E1B4B', '#1E293B', '#881337', '#14532D'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setBackground({ type: 'color', value: hex })}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        backgroundColor: hex,
                        border: background.value === hex ? '2px solid #E11D48' : '1px solid #334155',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9', marginBottom: '4px' }}>
                  {currentPreset.nameHi}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>
                  {currentPreset.descriptionHi}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* 3. EXPORT MODAL */}
      {showExportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
        >
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px 0', color: '#FFFFFF' }}>
              डिज़ाइन निर्यात करें (Export Graphic)
            </h3>

            {/* Format Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', display: 'block' }}>
                फ़ाइल फ़ॉर्मेट चुनें
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {(['png', 'jpeg', 'webp', 'svg'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setExportFormat(fmt)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: exportFormat === fmt ? '2px solid #E11D48' : '1px solid #334155',
                      backgroundColor: exportFormat === fmt ? '#1E293B' : 'transparent',
                      color: exportFormat === fmt ? '#FFFFFF' : '#94A3B8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Multiplier */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', display: 'block' }}>
                रिज़ॉल्यूशन स्केल (DPI Scaling)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { scale: 1, label: '1x (मानक)' },
                  { scale: 2, label: '2x (रेटिना HD)' },
                  { scale: 3, label: '3x (अल्ट्रा HD)' },
                ].map((s) => (
                  <button
                    key={s.scale}
                    type="button"
                    onClick={() => setExportScale(s.scale as 1 | 2 | 3)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: exportScale === s.scale ? '2px solid #E11D48' : '1px solid #334155',
                      backgroundColor: exportScale === s.scale ? '#1E293B' : 'transparent',
                      color: exportScale === s.scale ? '#FFFFFF' : '#94A3B8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
                अंतिम आकार: {currentPreset.width * exportScale} x {currentPreset.height * exportScale} पिक्सल
              </p>
            </div>

            {/* Quality Slider (for JPEG / WebP) */}
            {(exportFormat === 'jpeg' || exportFormat === 'webp') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>
                  गुणवत्ता ({exportQuality}%)
                </label>
                <input
                  type="range"
                  min="60"
                  max="100"
                  value={exportQuality}
                  onChange={(e) => setExportQuality(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#94A3B8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleTriggerExport}
                disabled={isExporting}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#E11D48',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isExporting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {isExporting ? 'प्रसंस्करण...' : 'डाउनलोड करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI DESIGN CONCEPT MODAL (AGT-GRP-008) */}
      {showAiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
        >
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={20} style={{ color: '#818CF8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                AI ग्राफ़िक डिज़ाइन असिस्टेंट (AGT-GRP-008)
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px', lineHeight: 1.4 }}>
              समाचार का विषय या शीर्षक दर्ज करें। AI डिज़ाइन इंजन लेआउट, फॉन्ट और कलर पैलेट का सुझाव देगा। (नोट: कोई नकली घटना चित्र नहीं बनाया जाएगा)
            </p>

            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="उदा. भोपाल मेट्रो कमर्शियल रन शुभारंभ, मुख्यमंत्री ने दिखाई हरी झंडी..."
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '13px',
                color: '#FFF',
                marginBottom: '12px',
              }}
            />

            <button
              type="button"
              onClick={handleRequestAiConcept}
              disabled={aiLoading || !aiPrompt.trim()}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: '#4338CA',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: aiLoading ? 'wait' : 'pointer',
                marginBottom: '14px',
              }}
            >
              {aiLoading ? 'AI विश्लेषण जारी है...' : 'लेआउट सुझाव प्राप्त करें'}
            </button>

            {/* AI Concept Result */}
            {aiConceptResult && (
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#818CF8', marginBottom: '4px' }}>
                  सुझावित लेआउट रणनीति:
                </div>
                <p style={{ fontSize: '11.5px', color: '#E2E8F0', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  {aiConceptResult.layoutConcept}
                </p>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>कलर पैलेट:</span>
                  {aiConceptResult.suggestedColors.map((c) => (
                    <span key={c} style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c, border: '1px solid #475569' }} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setShowAiModal(false); setAiConceptResult(null); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#94A3B8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                बंद करें
              </button>
              {aiConceptResult && (
                <button
                  type="button"
                  onClick={handleApplyAiConcept}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  कैनवास पर लागू करें
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#F8FAFC',
            fontSize: '12.5px',
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            backgroundColor: 'rgba(239, 68, 68, 0.95)',
            color: '#FFFFFF',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '12.5px',
            fontWeight: 600,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', marginLeft: '12px' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
