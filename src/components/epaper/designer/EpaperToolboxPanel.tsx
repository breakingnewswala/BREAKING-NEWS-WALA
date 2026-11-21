import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Search,
  Plus,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  Type,
  Newspaper,
  BookOpen,
  Filter,
  Upload,
  Camera,
  RefreshCw,
  Paintbrush,
  Columns as ColumnsIcon,
  Square,
  SlidersHorizontal,
  ChevronRight,
  Palette,
} from 'lucide-react';
import {
  ArticleDetail,
  EpaperPageDoc,
  EpaperElementType,
  EpaperTemplateDoc,
} from '../../../types';
import { DEFAULT_EPAPER_TEMPLATES } from '../../../data/defaultEpaperTemplates';
import { apiClient } from '../../../services/apiClient';
import { CanvasViewportState, GridColumnCount } from './types';
import { calculateColumnGrid, BROADSHEET_CONSTANTS } from '../../../utils/epaperLayout';

export interface EpaperToolboxPanelProps {
  articles: ArticleDetail[];
  editionPages: EpaperPageDoc[];
  activePageNumber: number;
  activeGridColumns?: GridColumnCount;
  viewportState?: CanvasViewportState;
  onAddStory: (article: ArticleDetail) => void;
  onAddPrimitive: (elementType: EpaperElementType) => void;
  onApplyTemplate: (template: EpaperTemplateDoc) => void;
  onGridColumnsChange?: (cols: GridColumnCount) => void;
  onViewportChange?: (updater: (prev: CanvasViewportState) => CanvasViewportState) => void;
  onUploadMedia?: (file: File, category: 'newspaper' | 'article' | 'photo', caption?: string) => Promise<void> | void;
}

export const EpaperToolboxPanel: React.FC<EpaperToolboxPanelProps> = ({
  articles,
  editionPages,
  activePageNumber,
  activeGridColumns = 8,
  viewportState,
  onAddStory,
  onAddPrimitive,
  onApplyTemplate,
  onGridColumnsChange,
  onViewportChange,
  onUploadMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'stories' | 'uploads' | 'templates'>('layout');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTplCat, setSelectedTplCat] = useState<string>('all');

  // Media upload state
  const [uploadCategory, setUploadCategory] = useState<'newspaper' | 'article' | 'photo'>('newspaper');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerUpload = (category: 'newspaper' | 'article' | 'photo') => {
    setUploadCategory(category);
    setUploadFeedback(null);
    mediaFileInputRef.current?.click();
  };

  const handleMediaFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadFeedback({ type: 'error', message: 'अमान्य प्रारूप! केवल JPG, PNG अथवा WebP अनुमत हैं।' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadFeedback({ type: 'error', message: 'फ़ाइल का आकार 10 MB से अधिक नहीं हो सकता।' });
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);
    try {
      if (onUploadMedia) {
        await onUploadMedia(file, uploadCategory, uploadCaption.trim() || file.name);
      } else {
        await apiClient.articles.uploadMedia(file, uploadCaption.trim() || file.name);
      }
      setUploadFeedback({ type: 'success', message: 'फ़ाइल सफलतापूर्वक अपलोड हुई और पृष्ठ पर संलग्न की गई!' });
      setUploadCaption('');
    } catch (err: any) {
      setUploadFeedback({ type: 'error', message: err.message || 'मीडिया अपलोड विफल रहा।' });
    } finally {
      setIsUploading(false);
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
    }
  };

  // Map articleId -> pageNumber across all edition pages to detect duplicates
  const placedArticleMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const page of editionPages) {
      for (const el of page.elements || []) {
        if (el.articleId) {
          map.set(el.articleId, page.pageNumber);
        }
      }
    }
    return map;
  }, [editionPages]);

  // Approved articles filter
  const approvedArticles = useMemo(() => {
    return (articles || []).filter((a) => a.status === 'APPROVED' || a.status === 'PUBLISHED');
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return approvedArticles.filter((art) => {
      const matchCat =
        selectedCategory === 'all' ||
        art.category === selectedCategory ||
        art.categoryName === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        art.title?.toLowerCase().includes(q) ||
        art.summary?.toLowerCase().includes(q) ||
        art.authorName?.toLowerCase().includes(q) ||
        art.districtName?.toLowerCase().includes(q);

      return matchCat && matchQuery;
    });
  }, [approvedArticles, selectedCategory, searchQuery]);

  const categories = [
    { key: 'all', label: 'सभी' },
    { key: 'POLITY', label: 'राजनीति' },
    { key: 'DEVELOPMENT', label: 'विकास' },
    { key: 'CRIME', label: 'अपराध' },
    { key: 'CULTURE', label: 'संस्कृति' },
    { key: 'BUSINESS', label: 'व्यापार' },
  ];

  const gridCalculations = useMemo(() => {
    return calculateColumnGrid(activeGridColumns);
  }, [activeGridColumns]);

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-hidden select-none shadow-xs">
      {/* Hidden File Input for Media Upload */}
      <input
        ref={mediaFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleMediaFileSelected}
        className="hidden"
      />

      {/* Main Tab Switcher */}
      <div className="p-2 border-b border-slate-200 bg-slate-50 grid grid-cols-4 gap-1">
        <button
          onClick={() => setActiveTab('layout')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'layout'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="लेआउट व डिज़ाइन तत्व (ब्रश, कॉलम, फोटो, टेक्स्ट)"
        >
          <Layers className="w-3.5 h-3.5 shrink-0 text-blue-600" />
          <span className="truncate">लेआउट</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'stories'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="स्वीकृत समाचार सूची"
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">समाचार</span>
        </button>

        <button
          onClick={() => setActiveTab('uploads')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'uploads'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="अखबार चित्र व फोटोग्राफ अपलोड"
        >
          <Upload className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span className="truncate">अपलोड</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="ब्रॉडशीट पेज टेम्पलेट्स"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-600" />
          <span className="truncate">टेम्पलेट</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: LAYOUT & ELEMENT PRIMITIVES (PART 2 REORDERING MANDATE)      */}
      {/* Priority Order: 1. Brush, 2. Columns (ABOVE Photo), 3. Photo,      */}
      {/* 4. Text Elements, 5. Other Elements                                 */}
      {/* =================================================================== */}
      {activeTab === 'layout' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* 1. BRUSH / DRAWING TOOLS */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5 text-amber-600" />
                <span>1. ब्रश व रेखांकन (Brush / Drawing)</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onViewportChange?.((prev) => ({
                    ...prev,
                    activeTool: prev.activeTool === 'brush' ? 'select' : 'brush',
                  }))
                }
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  viewportState?.activeTool === 'brush'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                {viewportState?.activeTool === 'brush' ? 'सक्रिय' : 'चालू करें'}
              </button>
            </div>

            <p className="text-[10px] text-amber-800 leading-tight">
              कैनवास पर हाथ से स्केच, संपादकीय मार्किंग या हाइलाइटर रेखांकन करें।
            </p>

            {/* Brush Controls when active */}
            <div className="space-y-2 pt-1 border-t border-amber-200/80">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onViewportChange?.((prev) => ({
                      ...prev,
                      activeTool: 'brush',
                      brushType: 'pen',
                      brushOpacity: 1.0,
                    }))
                  }
                  className={`py-1 px-2 rounded-lg text-[10px] font-bold text-center border cursor-pointer ${
                    (viewportState?.brushType || 'pen') === 'pen'
                      ? 'bg-white text-amber-900 border-amber-400 shadow-2xs'
                      : 'bg-amber-100/60 text-amber-700 border-transparent'
                  }`}
                >
                  संपादकीय पेन
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onViewportChange?.((prev) => ({
                      ...prev,
                      activeTool: 'brush',
                      brushType: 'highlighter',
                      brushOpacity: 0.35,
                    }))
                  }
                  className={`py-1 px-2 rounded-lg text-[10px] font-bold text-center border cursor-pointer ${
                    viewportState?.brushType === 'highlighter'
                      ? 'bg-white text-amber-900 border-amber-400 shadow-2xs'
                      : 'bg-amber-100/60 text-amber-700 border-transparent'
                  }`}
                >
                  हाइलाइटर
                </button>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-amber-900">रंग:</span>
                <div className="flex items-center gap-1.5">
                  {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#000000'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() =>
                        onViewportChange?.((prev) => ({
                          ...prev,
                          activeTool: 'brush',
                          brushColor: col,
                        }))
                      }
                      style={{ backgroundColor: col }}
                      className={`w-4 h-4 rounded-full border cursor-pointer ${
                        (viewportState?.brushColor || '#EF4444') === col
                          ? 'ring-2 ring-amber-600 scale-110'
                          : 'border-slate-300'
                      }`}
                      title={col}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. COLUMNS (1, 2, 3, 4, 5, 6, 8) — STRICTLY ABOVE PHOTO */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <ColumnsIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>2. ग्रिड कॉलम्स (Grid Columns)</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-700 px-1.5 py-0.5 rounded bg-blue-100">
                {activeGridColumns} कॉलम सक्रिय
              </span>
            </div>

            <p className="text-[10px] text-blue-800 leading-tight">
              ब्रॉडशीट पेज का मुख्य कॉलम विभाजन चुनें (मानक मुद्रण: 8 कॉलम):
            </p>

            {/* Column Grid Buttons: 1, 2, 3, 4, 5, 6, 8 */}
            <div className="grid grid-cols-7 gap-1">
              {([1, 2, 3, 4, 5, 6, 8] as GridColumnCount[]).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onGridColumnsChange?.(col)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                    activeGridColumns === col
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : 'bg-white border border-blue-200 text-blue-900 hover:bg-blue-100'
                  }`}
                  title={`${col} कॉलम ग्रिड`}
                >
                  <span>{col}</span>
                </button>
              ))}
            </div>

            {/* Geometric specs */}
            <div className="p-2 bg-white/80 rounded-lg border border-blue-100 text-[9px] text-blue-900 grid grid-cols-2 gap-1 font-mono">
              <div>कॉलम चौड़ाई: {Math.round(gridCalculations.columnWidth)} pt</div>
              <div>गटर अंतराल: {gridCalculations.gutterWidth} pt</div>
              <div>मुद्रण हाशिया: 42.5 pt</div>
              <div>पेज आकार: 32.9 × 52 cm</div>
            </div>
          </div>

          {/* 3. PHOTO / IMAGE (STRICTLY BELOW COLUMNS) */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. चित्र / फोटो (Photo / Image)</span>
              </span>
            </div>

            <p className="text-[10px] text-emerald-800 leading-tight">
              अखबार चित्र स्लॉट जोड़ें अथवा सीधे नया छायाचित्र अपलोड करें।
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onAddPrimitive('IMAGE')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                title="कैनवास पर खाली फोटो स्लॉट जोड़ें"
              >
                <Plus className="w-3 h-3" />
                <span>+ फोटो तत्व</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerUpload('photo')}
                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                title="नया छायाचित्र तुरंत अपलोड करें"
              >
                <Upload className="w-3 h-3" />
                <span>अपलोड करें</span>
              </button>
            </div>
          </div>

          {/* 4. TEXT ELEMENTS */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>4. पाठ तत्व (Text Elements)</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onAddPrimitive('HEADLINE')}
                className="w-full text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-red-100 text-red-700 font-bold text-xs">H</div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 group-hover:text-red-700">शीर्षक बॉक्स (Headline)</h5>
                    <p className="text-[10px] text-slate-500">मल्टी-कॉलम बैनर शीर्षक, किकर व डेक</p>
                  </div>
                </div>
                <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600" />
              </button>

              <button
                type="button"
                onClick={() => onAddPrimitive('STORY')}
                className="w-full text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-100 text-blue-700 font-bold text-xs">S</div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 group-hover:text-blue-700">समाचार आलेख (Story)</h5>
                    <p className="text-[10px] text-slate-500">जस्टिफाइड देवनागरी फॉन्ट व रिपोर्टर बायलाइन</p>
                  </div>
                </div>
                <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </button>
            </div>
          </div>

          {/* 5. OTHER LAYOUT ELEMENTS (SHAPES, DIVIDERS, MASTHEAD, AD) */}
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5 text-purple-600" />
                <span>5. अन्य लेआउट तत्व (Other Elements)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onAddPrimitive('SHAPE')}
                className="p-2 rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">आकृति (Shape)</span>
                  <Plus className="w-3 h-3 text-purple-500" />
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">रंग बॉक्स व पैनल</span>
              </button>

              <button
                type="button"
                onClick={() => onAddPrimitive('DIVIDER')}
                className="p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">विभाजक (Divider)</span>
                  <Plus className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">कॉलम सेपरेटर लाइन</span>
              </button>

              <button
                type="button"
                onClick={() => onAddPrimitive('MASTHEAD')}
                className="p-2 rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">मास्टहेड (Header)</span>
                  <Plus className="w-3 h-3 text-purple-500" />
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">अखबार नामपट्टी</span>
              </button>

              <button
                type="button"
                onClick={() => onAddPrimitive('AD')}
                className="p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">विज्ञापन (ASCI Ad)</span>
                  <Plus className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">अनिवार्य विज्ञापन बॉक्स</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: APPROVED NEWS LIST                                           */}
      {/* =================================================================== */}
      {activeTab === 'stories' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="समाचार खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredArticles.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                कोई स्वीकृत समाचार नहीं मिला
              </div>
            ) : (
              filteredArticles.map((art) => {
                const assignedPage = placedArticleMap.get(art.id);
                const isAssignedHere = assignedPage === activePageNumber;
                const isAssignedOther = assignedPage !== undefined && !isAssignedHere;

                return (
                  <div
                    key={art.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {art.categoryName || art.category}
                        </span>
                        {!art.imageUrl && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠️ नो फोटो
                          </span>
                        )}
                      </div>

                      {isAssignedHere ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          इसी पेज पर
                        </span>
                      ) : isAssignedOther ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          पृष्ठ {assignedPage} पर
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          उपलब्ध
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {art.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {art.summary || art.content}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="truncate max-w-[120px]">
                        ✍️ {art.authorName || 'संवाददाता'}
                      </span>

                      <button
                        onClick={() => onAddStory(art)}
                        className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="पृष्ठ पर जोड़ें (Add to canvas)"
                      >
                        <Plus className="w-3 h-3" />
                        <span>जोड़ें</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: MEDIA UPLOADS                                                */}
      {/* =================================================================== */}
      {activeTab === 'uploads' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>मुद्रण-गुणवत्ता चित्र संधारण (300 DPI)</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              अखबार के लिए उच्च रिज़ॉल्यूशन (300 DPI) फोटोग्राफ सीधे अपलोड करें।
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                1. मुख्य अखबारीय चित्र (Lead Photo)
              </span>
              <p className="text-[10px] text-slate-500">
                प्रथम पृष्ठ अथवा संपादकीय पैकेज के मुख्य लीड समाचार हेतु उच्च रिज़ॉल्यूशन फोटोग्राफ।
              </p>
              <button
                type="button"
                onClick={() => handleTriggerUpload('newspaper')}
                disabled={isUploading}
                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                {isUploading && uploadCategory === 'newspaper' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>लीड फोटो अपलोड करें</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                2. सहायक छायाचित्र (Supporting Photo)
              </span>
              <p className="text-[10px] text-slate-500">
                फील्ड संवाददाताओं द्वारा भेजा गया सहायक घटना छायाचित्र अथवा दस्तावेज़।
              </p>
              <button
                type="button"
                onClick={() => handleTriggerUpload('photo')}
                disabled={isUploading}
                className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                {isUploading && uploadCategory === 'photo' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>सहायक फोटो अपलोड करें</span>
              </button>
            </div>
          </div>

          {uploadFeedback && (
            <div
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                uploadFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              {uploadFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{uploadFeedback.message}</span>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: BROADSHEET PAGE PRESETS                                      */}
      {/* =================================================================== */}
      {activeTab === 'templates' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500 px-1 mb-1">
            मानक ब्रॉडशीट टेम्पलेट्स ({DEFAULT_EPAPER_TEMPLATES.length}):
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'all', label: 'सभी' },
              { key: 'FRONT_PAGE', label: 'प्रथम पृष्ठ' },
              { key: 'DISTRICT_FOCUS', label: 'जिला' },
              { key: 'STATE', label: 'राज्य' },
              { key: 'POLITICAL', label: 'राजनीति' },
              { key: 'BUSINESS', label: 'व्यापार व कृषि' },
              { key: 'EDUCATION', label: 'शिक्षा' },
              { key: 'SPORTS', label: 'खेल' },
              { key: 'EDITORIAL', label: 'संपादकीय' },
              { key: 'SPECIAL', label: 'विशेषांक' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedTplCat(cat.key)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTplCat === cat.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {DEFAULT_EPAPER_TEMPLATES.filter(
            (tpl) => selectedTplCat === 'all' || tpl.category === selectedTplCat
          ).map((tpl, idx) => (
            <div
              key={tpl.id || idx}
              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  {tpl.pageNumberDefault ? `पृष्ठ ${tpl.pageNumberDefault}` : 'टेम्पलेट'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {tpl.regions?.length || 0} स्लॉट्स
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">{tpl.nameHi || tpl.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                  {tpl.description}
                </p>
              </div>

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `क्या आप पृष्ठ ${activePageNumber} पर "${tpl.nameHi || tpl.name}" टेम्पलेट लागू करना चाहते हैं? वर्तमान तत्व बदल दिए जाएंगे।`
                    )
                  ) {
                    onApplyTemplate(tpl);
                  }
                }}
                className="w-full py-1.5 rounded-lg bg-slate-50 hover:bg-purple-600 text-slate-700 hover:text-white font-bold text-xs border border-slate-200 hover:border-purple-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>टेम्पलेट लागू करें</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
