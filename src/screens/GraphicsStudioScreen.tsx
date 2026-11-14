/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Graphics & Design Studio Screen
 * 
 * Provides an integrated, newsroom-grade graphic authoring dashboard:
 * 1. Studio Dashboard (Stats, Quick actions, Recent graphics)
 * 2. News to Graphic Engine (Factual extraction & auto-assembly)
 * 3. Manual Graphic Designer (WYSIWYG Live Canvas, Typography, Layers, Colors)
 * 4. Master Template Manager (11 categories, 5 aspect ratios)
 * 5. Graphics Lifecycle & Archive (Drafts, In-Review, Approved, Published)
 * 6. High-Resolution Multi-Format Exporter (PNG / WebP)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Palette,
  Download,
  Share2,
  Copy,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Sparkles,
  FileText,
  Filter,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layout,
  Type,
  Image as ImageIcon,
  Layers,
  Undo2,
  Redo2,
  RefreshCw,
  Search,
  Flame,
  Check,
  AlertTriangle,
  FolderOpen,
  Send,
  ExternalLink,
} from 'lucide-react';
import {
  ArticleItem,
  GraphicAspectRatio,
  GraphicItem,
  GraphicStatus,
  GraphicTemplate,
  GraphicTemplateCategory,
  NewsToGraphicRequest,
} from '../types';
import { DEFAULT_GRAPHIC_TEMPLATES } from '../data/defaultTemplates';
import { GraphicRenderer, ASPECT_RATIO_DIMENSIONS } from '../services/graphicRenderer';
import { NewsToGraphicEngine } from '../services/newsToGraphicEngine';
import { apiClient } from '../services/apiClient';

export interface GraphicsStudioScreenProps {
  currentUser?: { id: string; name: string; role?: string; roles?: string[] };
  articles?: ArticleItem[];
  districts?: Array<string | { nameHi?: string; nameEn?: string; slug?: string }>;
  categories?: Array<string | { nameHi?: string; nameEn?: string; slug?: string }>;
  initialArticle?: ArticleItem | null;
  onNavigateHome?: () => void;
  onNavigateDesk?: () => void;
}

type StudioTab = 'dashboard' | 'editor' | 'news-to-graphic' | 'templates' | 'library';

const ASPECT_RATIO_OPTIONS: Array<{ ratio: GraphicAspectRatio; label: string; icon: string }> = [
  { ratio: '4:5', label: '4:5 फ़ीड (मानक)', icon: '📱' },
  { ratio: '1:1', label: '1:1 स्क्वायर (व्हाट्सएप/इंस्टा)', icon: '⏹️' },
  { ratio: '9:16', label: '9:16 स्टोरी / रील', icon: '📲' },
  { ratio: '16:9', label: '16:9 थंबनेल / लैंडस्केप', icon: '🖥️' },
  { ratio: '3:4', label: '3:4 पोर्ट्रेट', icon: '📄' },
];

const TEMPLATE_CATEGORIES: Array<{ key: GraphicTemplateCategory; labelHi: string }> = [
  { key: 'BREAKING', labelHi: 'ब्रेकिंग न्यूज़' },
  { key: 'POLITICS', labelHi: 'राजनीति' },
  { key: 'CRIME', labelHi: 'अपराध व कानून' },
  { key: 'GOVERNMENT', labelHi: 'सरकारी योजनाएं' },
  { key: 'EDUCATION', labelHi: 'शिक्षा व रोज़गार' },
  { key: 'SPORTS', labelHi: 'खेल जगत' },
  { key: 'BUSINESS', labelHi: 'व्यापार व मंडी' },
  { key: 'DISTRICT', labelHi: 'जिला हलचल' },
  { key: 'WEATHER', labelHi: 'मौसम समाचार' },
  { key: 'FESTIVAL', labelHi: 'त्यौहार व बधाई' },
  { key: 'SPECIAL', labelHi: 'विशेष रिपोर्ट' },
];

const THEME_COLORS = [
  { hex: '#ED1727', name: 'क्रिमसन रेड (ब्रेकिंग)' },
  { hex: '#EA580C', name: 'भगवा संतरी (सफरन)' },
  { hex: '#0F172A', name: 'रॉयल नेवी ब्लू' },
  { hex: '#FDE900', name: 'गोल्डन येलो' },
  { hex: '#1E293B', name: 'चारकोल डार्क' },
  { hex: '#166534', name: 'फॉरेस्ट ग्रीन' },
];

export const GraphicsStudioScreen: React.FC<GraphicsStudioScreenProps> = ({
  currentUser,
  articles = [],
  districts = [],
  categories = [],
  initialArticle = null,
  onNavigateHome,
  onNavigateDesk,
}) => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<StudioTab>(initialArticle ? 'news-to-graphic' : 'dashboard');
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('ALL');
  const [selectedAspectRatioFilter, setSelectedAspectRatioFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Template State
  const [templates, setTemplates] = useState<GraphicTemplate[]>(DEFAULT_GRAPHIC_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<GraphicTemplate>(DEFAULT_GRAPHIC_TEMPLATES[0]);

  // Graphics Library State
  const [graphicsList, setGraphicsList] = useState<GraphicItem[]>([]);
  const [isLoadingGraphics, setIsLoadingGraphics] = useState<boolean>(false);

  // News to Graphic State
  const [selectedArticleForGraphic, setSelectedArticleForGraphic] = useState<ArticleItem | null>(initialArticle || null);

  // Active Editor Graphic State
  const [currentGraphic, setCurrentGraphic] = useState<GraphicItem>(() => {
    return {
      id: `gfx-${Date.now()}`,
      title: 'नई ब्रेकिंग ग्राफ़िक',
      headline: 'मध्य प्रदेश: कैबिनेट की आपात बैठक में बड़ा निर्णय',
      subtext: 'मुख्यमंत्री ने उच्चस्तरीय समीक्षा बैठक में अधिकारियों को दिए निर्देश।',
      templateId: DEFAULT_GRAPHIC_TEMPLATES[0].id,
      templateTitle: DEFAULT_GRAPHIC_TEMPLATES[0].title,
      aspectRatio: '4:5',
      districtName: 'भोपाल',
      categoryName: 'ब्रेकिंग न्यूज़',
      authorName: currentUser?.name || 'विशेष संवाददाता',
      isBreaking: true,
      imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
      themeColor: '#ED1727',
      status: 'DRAFT',
      version: 1,
      createdBy: currentUser?.id || 'usr-desk',
      createdByName: currentUser?.name || 'संपादकीय डेस्क',
      createdByRole: currentUser?.role || 'EDITOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // History Stack for Undo / Redo
  const [historyStack, setHistoryStack] = useState<GraphicItem[]>([currentGraphic]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasRenderSuccess, setCanvasRenderSuccess] = useState<boolean>(false);

  // Helper for message toast
  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 1. Fetch Templates and Graphics on Mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const fetchedTemplates = await apiClient.graphics.fetchTemplates();
        if (isMounted && fetchedTemplates.length > 0) {
          setTemplates(fetchedTemplates);
        }
      } catch {
        // Fallback to default templates
      }

      try {
        setIsLoadingGraphics(true);
        const { items } = await apiClient.graphics.fetchGraphics({ limit: 50 });
        if (isMounted) {
          setGraphicsList(items);
        }
      } catch {
        // Ignore fallback
      } finally {
        if (isMounted) setIsLoadingGraphics(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Render Canvas whenever currentGraphic changes
  const renderCurrentGraphic = useCallback(async () => {
    if (!canvasRef.current || !currentGraphic) return;
    try {
      await GraphicRenderer.renderToCanvas(canvasRef.current, currentGraphic);
      setCanvasRenderSuccess(true);
    } catch (err: any) {
      console.error('[GraphicsStudio] Canvas render error:', err);
      setCanvasRenderSuccess(false);
    }
  }, [currentGraphic]);

  useEffect(() => {
    renderCurrentGraphic();
  }, [renderCurrentGraphic]);

  // Update current graphic with history tracking
  const updateGraphicField = (fields: Partial<GraphicItem>, recordHistory = true) => {
    setCurrentGraphic((prev) => {
      const updated = {
        ...prev,
        ...fields,
        updatedAt: new Date().toISOString(),
      };
      if (recordHistory) {
        const newHistory = historyStack.slice(0, historyIndex + 1);
        newHistory.push(updated);
        setHistoryStack(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      return updated;
    });
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentGraphic(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentGraphic(next);
    }
  };

  // Apply Template to Current Graphic
  const applyTemplate = (template: GraphicTemplate) => {
    setSelectedTemplate(template);
    updateGraphicField({
      templateId: template.id,
      templateTitle: template.title,
      aspectRatio: template.aspectRatio,
      themeColor: template.themeColor || '#ED1727',
      backgroundStyle: template.backgroundStyle || 'gradient-red',
    });
    showFeedback(`टेम्पलेट "${template.title}" लागू किया गया।`, 'info');
  };

  // Convert Article to Graphic
  const handleConvertArticleToGraphic = async (article: ArticleItem) => {
    try {
      const matchedTemplate = NewsToGraphicEngine.selectBestTemplate(article, templates);
      const extracted = NewsToGraphicEngine.extractGraphicContent(article);

      const newGraphic: GraphicItem = {
        id: `gfx-${Date.now()}`,
        title: extracted.headline.slice(0, 40),
        headline: extracted.headline,
        subtext: extracted.subtext,
        templateId: matchedTemplate.id,
        templateTitle: matchedTemplate.title,
        aspectRatio: matchedTemplate.aspectRatio || '4:5',
        articleId: article.id,
        articleTitle: article.title,
        districtName: extracted.district,
        categoryName: extracted.category,
        authorName: article.authorName || currentUser?.name || 'विशेष संवाददाता',
        isBreaking: Boolean(article.isBreaking),
        imageUrl: article.imageUrl || article.featuredImage || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
        themeColor: matchedTemplate.themeColor || '#ED1727',
        status: 'DRAFT',
        version: 1,
        createdBy: currentUser?.id || 'usr-desk',
        createdByName: currentUser?.name || 'संपादकीय डेस्क',
        createdByRole: currentUser?.role || 'EDITOR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentGraphic(newGraphic);
      setHistoryStack([newGraphic]);
      setHistoryIndex(0);
      setSelectedTemplate(matchedTemplate);
      setActiveTab('editor');
      showFeedback('समाचार से तथ्य-आधारित ग्राफ़िक सफलतापूर्वक निर्मित!', 'success');
    } catch (err: any) {
      showFeedback(err.message || 'समाचार से ग्राफ़िक निर्माण में त्रुटि हुई।', 'error');
    }
  };

  // Save Graphic to Backend
  const handleSaveGraphic = async (targetStatus?: GraphicStatus) => {
    try {
      setIsSaving(true);
      const payload: Partial<GraphicItem> = {
        ...currentGraphic,
        status: targetStatus || currentGraphic.status,
      };

      let saved: GraphicItem;
      if (currentGraphic.id && graphicsList.some((g) => g.id === currentGraphic.id)) {
        saved = await apiClient.graphics.updateGraphic(currentGraphic.id, payload);
      } else {
        saved = await apiClient.graphics.createGraphic(payload);
      }

      setCurrentGraphic(saved);
      // Refresh list
      setGraphicsList((prev) => {
        const idx = prev.findIndex((g) => g.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });

      showFeedback(
        targetStatus === 'APPROVED'
          ? 'ग्राफ़िक अनुमोदित व प्रकाशित करने हेतु तैयार!'
          : targetStatus === 'PUBLISHED'
          ? 'ग्राफ़िक सफलतापूर्वक प्रकाशित किया गया!'
          : 'ग्राफ़िक ड्राफ्ट सुरक्षित कर लिया गया है।',
        'success'
      );
    } catch (err: any) {
      showFeedback(err.message || 'ग्राफ़िक सुरक्षित करने में त्रुटि।', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // High-Resolution Export
  const handleExport = async (format: 'png' | 'webp' = 'png') => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      const blob = await GraphicRenderer.exportAsBlob(canvasRef.current, format, 0.95);
      const filename = `bnw-${currentGraphic.headline.slice(0, 20).replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_')}-${currentGraphic.aspectRatio}.${format}`;
      GraphicRenderer.downloadImage(blob, filename);
      showFeedback(`उच्च-गुणवत्ता ${format.toUpperCase()} ग्राफ़िक डाउनलोड प्रारंभ!`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'डाउनलोड में त्रुटि हुई।', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Native Web Share or Copy Image
  const handleShare = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await GraphicRenderer.exportAsBlob(canvasRef.current, 'png');
      const file = new File([blob], 'breakingnewswala-graphic.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: currentGraphic.headline,
          text: `${currentGraphic.headline} — ब्रेकिंग न्यूज़ वाला`,
          files: [file],
        });
        showFeedback('सफलतापूर्वक साझा किया गया!', 'success');
      } else {
        // Fallback: Copy data URL to clipboard
        const dataUrl = GraphicRenderer.exportAsDataUrl(canvasRef.current, 'png');
        await navigator.clipboard.writeText(dataUrl);
        showFeedback('ग्राफ़िक डेटा क्लिपबोर्ड में कॉपी कर दिया गया!', 'info');
      }
    } catch (err: any) {
      showFeedback('साझा करने में असमर्थ अथवा उपयोगकर्ता द्वारा रद्द।', 'info');
    }
  };

  // Handle local image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateGraphicField({ imageUrl: result });
        showFeedback('छवि सफलतापूर्वक अपलोड व सेट की गई!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Statistics calculation for Dashboard
  const stats = useMemo(() => {
    const total = graphicsList.length;
    const published = graphicsList.filter((g) => g.status === 'PUBLISHED').length;
    const approved = graphicsList.filter((g) => g.status === 'APPROVED').length;
    const drafts = graphicsList.filter((g) => g.status === 'DRAFT').length;
    return { total, published, approved, drafts };
  }, [graphicsList]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (selectedTemplateCategory !== 'ALL' && t.category !== selectedTemplateCategory) {
        return false;
      }
      if (selectedAspectRatioFilter !== 'ALL' && t.aspectRatio !== selectedAspectRatioFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, selectedTemplateCategory, selectedAspectRatioFilter, searchQuery]);

  // Filtered Graphics
  const filteredGraphics = useMemo(() => {
    return graphicsList.filter((g) => {
      if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          g.headline.toLowerCase().includes(q) ||
          (g.districtName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [graphicsList, statusFilter, searchQuery]);

  // Canonical dimensions for preview viewport
  const dims = GraphicRenderer.getDimensions(currentGraphic.aspectRatio);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Studio Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-red-900/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">ग्राफ़िक्स स्टूडियो</span>
                <span className="text-xs bg-red-600/30 text-red-400 font-semibold px-2 py-0.5 rounded-full border border-red-500/40">
                  NEWSROOM PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">सोशल मीडिया व ब्रेकिंग न्यूज़ विजुअल डिज़ाइनर</p>
            </div>
          </div>

          {/* Tab Navigation Navigation */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>डैशबोर्ड</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'editor'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>डिज़ाइनर</span>
            </button>
            <button
              onClick={() => setActiveTab('news-to-graphic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'news-to-graphic'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>न्यूज़ टू ग्राफ़िक</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'templates'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>टेम्पलेट्स</span>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'library'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>मेरी लाइब्रेरी ({graphicsList.length})</span>
            </button>
          </div>

          {/* Quick Exit / Back Button */}
          <div className="flex items-center space-x-2">
            {onNavigateDesk && (
              <button
                onClick={onNavigateDesk}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                संपादकीय डेस्क &rarr;
              </button>
            )}
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                होम पेज
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`max-w-7xl mx-auto mt-3 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-lg transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-800'
              : feedbackMsg.type === 'error'
              ? 'bg-red-950/90 text-red-200 border border-red-800'
              : 'bg-blue-950/90 text-blue-200 border border-blue-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
            {feedbackMsg.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
            {feedbackMsg.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        {/* ======================================================== */}
        {/* TAB 1: STUDIO DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">कुल निर्मित ग्राफ़िक्स</p>
                <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">सभी सोशल पोस्ट्स</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">प्रकाशित (Live)</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{stats.published}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">सोशल मीडिया पर प्रसारित</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">अनुमोदित (Approved)</p>
                <p className="text-2xl font-black text-blue-400 mt-1">{stats.approved}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">संपादकीय स्वीकृति प्राप्त</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">ड्राफ्ट (Drafts)</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{stats.drafts}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">कार्य प्रगति पर</p>
              </div>
            </div>

            {/* Quick Launch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div
                onClick={() => setActiveTab('news-to-graphic')}
                className="bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900 border border-red-900/40 hover:border-red-500/60 p-6 rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:shadow-red-950/30 group"
              >
                <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                  न्यूज़ टू ग्राफ़िक (ऑटो)
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  किसी भी समाचार लेख से तथ्य, हेडलाइन, उपशीर्षक व ज़िला ऑटो-एक्सट्रैक्ट कर 1 क्लिक में सोशल कार्ड बनाएं।
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-red-400">
                  <span>शुरू करें</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setCurrentGraphic((prev) => ({
                    ...prev,
                    id: `gfx-${Date.now()}`,
                    title: 'नया खाली ग्राफ़िक',
                    headline: 'शीर्षक यहाँ टाइप करें...',
                    subtext: 'संक्षिप्त विवरण यहाँ लिखें...',
                    status: 'DRAFT',
                  }));
                  setActiveTab('editor');
                }}
                className="bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-900 border border-blue-900/40 hover:border-blue-500/60 p-6 rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-950/30 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Palette className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  मैनुअल ग्राफ़िक डिज़ाइनर
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  कैनवास पर लाइव टाइपोग्राफी, लेयर कंपोज़िशन, त्रि-रंगी ब्रांडिंग और बैकग्राउंड कलर्स से कस्टम कार्ड तैयार करें।
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-blue-400">
                  <span>डिज़ाइनर खोलें</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('templates')}
                className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-900/40 hover:border-amber-500/60 p-6 rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:shadow-amber-950/30 group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sliders className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  मास्टर टेम्पलेट लाइब्रेरी
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  11 कैटेगरीज (ब्रेकिंग, राजनीति, अपराध, खेल, मौसम, जिला हलचल आदि) और 5 आस्पेक्ट रेश्यो में तैयार टेम्पलेट्स।
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-amber-400">
                  <span>लाइब्रेरी देखें</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </div>

            {/* Recent Graphics Section */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4 text-red-500" />
                  <h4 className="font-bold text-sm text-white">हाल ही में निर्मित ग्राफ़िक्स</h4>
                </div>
                <button
                  onClick={() => setActiveTab('library')}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  सभी देखें ({graphicsList.length}) &rarr;
                </button>
              </div>

              {graphicsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Palette className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                  <p className="text-sm font-medium">अभी तक कोई ग्राफ़िक निर्मित नहीं हुआ है।</p>
                  <p className="text-xs text-slate-600 mt-1">ऊपर दिए गए 'न्यूज़ टू ग्राफ़िक' या 'डिज़ाइनर' से नया कार्ड बनाएं।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {graphicsList.slice(0, 4).map((gfx) => (
                    <div
                      key={gfx.id}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 hover:border-slate-500 transition group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded font-bold">
                            {gfx.aspectRatio}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              gfx.status === 'PUBLISHED'
                                ? 'bg-emerald-600/20 text-emerald-400'
                                : gfx.status === 'APPROVED'
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'bg-amber-600/20 text-amber-400'
                            }`}
                          >
                            {gfx.status}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-200 line-clamp-2 leading-snug">
                          {gfx.headline}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{gfx.districtName} • {gfx.createdByName}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => {
                            setCurrentGraphic(gfx);
                            setActiveTab('editor');
                          }}
                          className="text-red-400 hover:text-red-300 font-semibold"
                        >
                          संपादित करें
                        </button>
                        <span className="text-[10px] text-slate-500">v{gfx.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MANUAL GRAPHIC DESIGNER (WYSIWYG CANVAS + CONTROLS) */}
        {/* ======================================================== */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Design Controls (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Aspect Ratio & Undo Bar */}
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 overflow-x-auto">
                  {ASPECT_RATIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.ratio}
                      onClick={() => updateGraphicField({ aspectRatio: opt.ratio })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        currentGraphic.aspectRatio === opt.ratio
                          ? 'bg-red-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>{opt.ratio}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                    title="पूर्ववत करें (Undo)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= historyStack.length - 1}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                    title="पुनः करें (Redo)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text & Editorial Details */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Type className="w-4 h-4 text-red-500" />
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                      समाचार पाठ व विवरण
                    </h4>
                  </div>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(currentGraphic.isBreaking)}
                      onChange={(e) => updateGraphicField({ isBreaking: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-red-500"
                    />
                    <span className="font-bold text-red-400 flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>ब्रेकिंग न्यूज़</span>
                    </span>
                  </label>
                </div>

                {/* Headline input */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>मुख्य शीर्षक (Headline)</span>
                    <span>{currentGraphic.headline.length} / 120 वर्ण</span>
                  </div>
                  <textarea
                    rows={2}
                    value={currentGraphic.headline}
                    onChange={(e) => updateGraphicField({ headline: e.target.value })}
                    placeholder="मुख्य समाचार शीर्षक देवनागरी में लिखें..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl p-2.5 text-sm text-white focus:outline-none resize-none font-semibold leading-snug"
                  />
                </div>

                {/* Subtext input */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>उपशीर्षक / स्टैंडफर्स्ट (Subtext)</span>
                    <span>{(currentGraphic.subtext || '').length} / 140 वर्ण</span>
                  </div>
                  <textarea
                    rows={2}
                    value={currentGraphic.subtext || ''}
                    onChange={(e) => updateGraphicField({ subtext: e.target.value })}
                    placeholder="संक्षिप्त विवरण या 1-2 मुख्य बिंदु..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl p-2 text-xs text-slate-300 focus:outline-none resize-none"
                  />
                </div>

                {/* District & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ज़िला (District)</label>
                    <input
                      type="text"
                      value={currentGraphic.districtName || 'भोपाल'}
                      onChange={(e) => updateGraphicField({ districtName: e.target.value })}
                      placeholder="उदा. भोपाल, इंदौर, जबलपुर"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">श्रेणी (Category)</label>
                    <input
                      type="text"
                      value={currentGraphic.categoryName || 'मध्य प्रदेश'}
                      onChange={(e) => updateGraphicField({ categoryName: e.target.value })}
                      placeholder="उदा. राजनीति, अपराध, खेल"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Reporter Byline Attribution */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">संवाददाता / ब्यूरो नाम</label>
                  <input
                    type="text"
                    value={currentGraphic.authorName || ''}
                    onChange={(e) => updateGraphicField({ authorName: e.target.value })}
                    placeholder="संवाददाता का नाम"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Visuals & Colors */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3.5">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    छवि व रंग संयोजन
                  </h4>
                </div>

                {/* Image URL & File Upload */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">समाचार छवि (Image URL / Upload)</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={currentGraphic.imageUrl || ''}
                      onChange={(e) => updateGraphicField({ imageUrl: e.target.value })}
                      placeholder="https://... छवि लिंक"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition flex items-center">
                      <span>फ़ाइल चुनें</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Theme Color Palette */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">थीम / ब्रांड रंग</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {THEME_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => updateGraphicField({ themeColor: c.hex })}
                        title={c.name}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          currentGraphic.themeColor === c.hex
                            ? 'scale-125 ring-2 ring-white shadow-lg'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                    <input
                      type="color"
                      value={currentGraphic.themeColor || '#ED1727'}
                      onChange={(e) => updateGraphicField({ themeColor: e.target.value })}
                      className="w-7 h-7 rounded-full bg-transparent border-0 cursor-pointer"
                      title="कस्टम रंग चुनें"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live WYSIWYG Canvas & Action Toolbar (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Action Toolbar */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentGraphic.status === 'PUBLISHED'
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : currentGraphic.status === 'APPROVED'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    स्थिति: {currentGraphic.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    आकार: {dims.width} &times; {dims.height}px
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSaveGraphic('DRAFT')}
                    disabled={isSaving}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center space-x-1"
                  >
                    <span>ड्राफ्ट सहेजें</span>
                  </button>

                  <button
                    onClick={() => handleSaveGraphic('APPROVED')}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-900/30 transition flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>अनुमोदित करें</span>
                  </button>

                  <button
                    onClick={() => handleExport('png')}
                    disabled={isExporting}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-red-900/30 transition flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PNG डाउनलोड</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-xl border border-slate-700 transition"
                    title="शेयर करें"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Canvas Preview Container */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[480px]">
                <div
                  className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center"
                  style={{
                    width: '100%',
                    maxWidth: currentGraphic.aspectRatio === '16:9' ? '560px' : '360px',
                    aspectRatio:
                      currentGraphic.aspectRatio === '4:5'
                        ? '4/5'
                        : currentGraphic.aspectRatio === '1:1'
                        ? '1/1'
                        : currentGraphic.aspectRatio === '9:16'
                        ? '9/16'
                        : currentGraphic.aspectRatio === '16:9'
                        ? '16/9'
                        : '3/4',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain block"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between w-full max-w-sm text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>लाइव पूर्वावलोकन (WYSWIG)</span>
                  </span>
                  <button
                    onClick={renderCurrentGraphic}
                    className="text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>पुनः रेंडर</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: NEWS TO GRAPHIC ENGINE */}
        {/* ======================================================== */}
        {activeTab === 'news-to-graphic' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">न्यूज़ टू ग्राफ़िक रूपांतरण इंजन</h3>
                  <p className="text-xs text-slate-400">
                    समाचार से तथ्य निष्कर्षित कर स्वचालित रूप से पेशेवर सोशल कार्ड बनाएं।
                  </p>
                </div>
              </div>

              {/* Search filter for articles */}
              <div className="mt-4 flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 max-w-md">
                <Search className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="प्रकाशित या ड्राफ्ट समाचार खोजें..."
                  className="bg-transparent text-xs text-white focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Articles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles
                .filter((a) => !searchQuery.trim() || a.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 12)
                .map((art) => (
                  <div
                    key={art.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-red-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-lg group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                          {art.districtName || 'मध्य प्रदेश'}
                        </span>
                        {art.isBreaking && (
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                            <Flame className="w-3 h-3" />
                            <span>ब्रेकिंग</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-100 group-hover:text-red-400 transition-colors line-clamp-2">
                        {art.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {art.summary || art.content || 'समाचार का विवरण...'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{art.authorName || 'संवाददाता'}</span>
                      <button
                        onClick={() => handleConvertArticleToGraphic(art)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ग्राफ़िक बनाएं &rarr;</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: MASTER TEMPLATE LIBRARY */}
        {/* ======================================================== */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedTemplateCategory('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedTemplateCategory === 'ALL'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  सभी श्रेणियां ({templates.length})
                </button>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedTemplateCategory(cat.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedTemplateCategory === cat.key
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {cat.labelHi}
                  </button>
                ))}
              </div>

              {/* Aspect Ratio Filter */}
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-400 mr-1">आस्पेक्ट:</span>
                {['ALL', '4:5', '1:1', '9:16', '16:9', '3:4'].map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setSelectedAspectRatioFilter(ar)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      selectedAspectRatioFilter === ar
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition flex flex-col justify-between group shadow-lg"
                >
                  {/* Template Visual Banner */}
                  <div
                    className="h-36 p-3 flex flex-col justify-between relative"
                    style={{
                      background:
                        tpl.backgroundStyle === 'gradient-red'
                          ? 'linear-gradient(135deg, #7F1D1D, #000000)'
                          : tpl.backgroundStyle === 'navy-blue'
                          ? 'linear-gradient(135deg, #0F172A, #020617)'
                          : tpl.backgroundStyle === 'breaking-yellow'
                          ? 'linear-gradient(135deg, #713F12, #000000)'
                          : 'linear-gradient(135deg, #1E293B, #0F172A)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur">
                        {tpl.aspectRatio}
                      </span>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tpl.themeColor }}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        {tpl.category}
                      </span>
                      <h4 className="font-bold text-sm text-white line-clamp-1">{tpl.title}</h4>
                    </div>
                  </div>

                  {/* Template Footer Actions */}
                  <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{tpl.width} &times; {tpl.height}px</span>
                    <button
                      onClick={() => {
                        applyTemplate(tpl);
                        setActiveTab('editor');
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-xl text-xs font-semibold shadow transition"
                    >
                      उपयोग करें &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: MY GRAPHICS ARCHIVE / LIBRARY */}
        {/* ======================================================== */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            {/* Status Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {['ALL', 'DRAFT', 'APPROVED', 'PUBLISHED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      statusFilter === st
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'सभी'
                      : st === 'DRAFT'
                      ? 'ड्राफ्ट'
                      : st === 'APPROVED'
                      ? 'अनुमोदित'
                      : 'प्रकाशित'}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-400">
                कुल परिणाम: {filteredGraphics.length}
              </div>
            </div>

            {/* Graphics Table / Cards */}
            {filteredGraphics.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="text-sm font-semibold text-slate-400">कोई ग्राफ़िक नहीं मिला</p>
                <p className="text-xs text-slate-600 mt-1">फ़िल्टर बदलें या नया ग्राफ़िक डिज़ाइन करें।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGraphics.map((gfx) => (
                  <div
                    key={gfx.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                          {gfx.aspectRatio}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            gfx.status === 'PUBLISHED'
                              ? 'bg-emerald-600/20 text-emerald-400'
                              : gfx.status === 'APPROVED'
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'bg-amber-600/20 text-amber-400'
                          }`}
                        >
                          {gfx.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-100 line-clamp-2">
                        {gfx.headline}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {gfx.districtName} • {gfx.createdByName}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setCurrentGraphic(gfx);
                          setActiveTab('editor');
                        }}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        एडिटर में खोलें &rarr;
                      </button>
                      <span className="text-[10px] text-slate-500">
                        {new Date(gfx.updatedAt || gfx.createdAt).toLocaleDateString('hi-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default GraphicsStudioScreen;
