import React, { useRef, useState } from 'react';
import {
  EpaperPageDoc,
  EpaperPageElement,
  EpaperElementType,
  ArticleDetail,
} from '../../../types';
import {
  calculateColumnGrid,
  getColumnSpanWidth,
  GridColumnCount,
} from '../../../utils/epaperLayout';
import { apiClient } from '../../../services/apiClient';
import {
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sliders,
  Type,
  FileText,
  AlertTriangle,
  Sparkles,
  ArrowRightLeft,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Unlock,
  Upload,
  RefreshCw,
  X,
  Palette,
  Square,
  Newspaper,
  ChevronDown,
  ChevronUp,
  RotateCw,
} from 'lucide-react';

export interface EpaperPropertiesPanelProps {
  selectedElement: EpaperPageElement | null;
  page: EpaperPageDoc;
  hasCollision?: boolean;
  articles?: ArticleDetail[];
  totalPages?: number;
  onReassignPage?: (elementId: string, targetPageNum: number) => void;
  onUpdateElement: (updated: EpaperPageElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderZIndex: (id: string, direction: 'UP' | 'DOWN') => void;
  onUpdatePageTitle: (title: string) => void;
  onUpdatePageSection: (section: string) => void;
  onUpdatePageGridColumns: (cols: GridColumnCount) => void;
  onOpenHeaderTemplates?: () => void;
}

export const EpaperPropertiesPanel: React.FC<EpaperPropertiesPanelProps> = ({
  selectedElement,
  page,
  hasCollision,
  articles = [],
  totalPages = 12,
  onReassignPage,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderZIndex,
  onUpdatePageTitle,
  onUpdatePageSection,
  onUpdatePageGridColumns,
  onOpenHeaderTemplates,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Level 2 Collapsible Sections State
  const [activeTab, setActiveTab] = useState<'content' | 'typography' | 'styling' | 'image' | 'header'>('content');

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;
    setUploadError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('केवल JPG, PNG अथवा WebP प्रारूप अनुमत हैं।');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('फ़ाइल का आकार 10MB से अधिक नहीं होना चाहिए।');
      return;
    }
    setIsUploadingImage(true);
    try {
      const res = await apiClient.articles.uploadMedia(file, file.name);
      if (res?.url) {
        onUpdateElement({
          ...selectedElement,
          imageUrl: res.url,
          photoCredit: selectedElement.photoCredit || 'बीएनडब्ल्यू विशेष छायाकार',
        });
      }
    } catch (err: any) {
      setUploadError(err.message || 'चित्र अपलोड विफल रहा');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const grid = calculateColumnGrid(page.gridColumns || 8);

  const refArticle = selectedElement?.articleId && articles
    ? articles.find((a) => a.id === selectedElement.articleId)
    : null;

  const handleGeometryChange = (field: 'x' | 'y' | 'width' | 'height', val: number) => {
    if (!selectedElement) return;
    const num = isNaN(val) ? 0 : val;
    onUpdateElement({
      ...selectedElement,
      bounds: {
        ...selectedElement.bounds,
        [field]: Number(num.toFixed(2)),
      },
    });
  };

  const handleQuickColSpan = (span: number) => {
    if (!selectedElement) return;
    const newWidth = getColumnSpanWidth(span, grid.columnWidth, grid.gutterWidth);
    onUpdateElement({
      ...selectedElement,
      colSpan: span,
      bounds: {
        ...selectedElement.bounds,
        width: newWidth,
      },
    });
  };

  const isHeaderElement = selectedElement?.elementType === 'MASTHEAD' || selectedElement?.elementType === 'HEADER';
  const hasImage = selectedElement?.elementType === 'IMAGE' || selectedElement?.elementType === 'STORY' || Boolean(selectedElement?.imageUrl);

  const sections = [
    { key: 'FRONT_PAGE', label: 'प्रथम पृष्ठ (Front Page)' },
    { key: 'STATE', label: 'मध्य प्रदेश राज्य (State)' },
    { key: 'NATIONAL', label: 'राष्ट्रीय / देश (National)' },
    { key: 'EDITORIAL', label: 'संपादकीय विमर्श (Editorial/Op-Ed)' },
    { key: 'DISTRICT_FOCUS', label: 'जिला समाचार (District Focus)' },
    { key: 'SPORTS', label: 'खेल हलचल (Sports)' },
    { key: 'BUSINESS', label: 'व्यापार व मंडी (Business)' },
    { key: 'ENTERTAINMENT', label: 'मनोरंजन व संस्कृति (Entertainment)' },
    { key: 'SPECIAL', label: 'विशेष परिशिष्ट (Special Feature)' },
  ];

  return (
    <aside className="w-88 xl:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 h-full overflow-hidden select-none shadow-xs">
      {selectedElement ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* ================================================================= */}
          {/* LEVEL 1: PRIMARY CONTROLS (ALWAYS VISIBLE AT TOP)                 */}
          {/* ================================================================= */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
            {/* Element Header: Type, Title/ID, Lock, Duplicate, Delete */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-2xs">
                  {selectedElement.elementType}
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  #{selectedElement.id.slice(-6)}
                </span>
                {refArticle?.priority && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                    {refArticle.priority}
                  </span>
                )}
              </div>

              {/* Action Toolbar: Layer Up/Down, Lock, Duplicate, Delete */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onReorderZIndex(selectedElement.id, 'UP')}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                  title="आगे लाएं (Bring Forward)"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onReorderZIndex(selectedElement.id, 'DOWN')}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                  title="पीछे भेजें (Send Backward)"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateElement({ ...selectedElement, isLocked: !selectedElement.isLocked })}
                  className={`p-1 rounded-md transition-colors ${
                    selectedElement.isLocked
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                  title={selectedElement.isLocked ? 'अनलॉक करें (Unlock)' : 'तत्व लॉक करें (Lock)'}
                >
                  {selectedElement.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateElement(selectedElement.id)}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  title="प्रतिलिपि बनाएं (Duplicate - Ctrl+D)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteElement(selectedElement.id)}
                  className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  title="हटाएं (Delete - Del)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Lock Warning Banner */}
            {selectedElement.isLocked && (
              <div className="p-2 rounded-lg bg-amber-100/70 border border-amber-300 text-[11px] text-amber-900 flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>तत्व लॉक है (Position Locked)</span>
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateElement({ ...selectedElement, isLocked: false })}
                  className="text-[10px] text-amber-900 underline"
                >
                  अनलॉक
                </button>
              </div>
            )}

            {/* TWO-COLUMN GEOMETRY COORDINATES (X|Y, Width|Height) */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Column 1: X Position */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">X स्थिति (pt)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.bounds.x)}
                    onChange={(e) => handleGeometryChange('x', parseFloat(e.target.value))}
                    disabled={selectedElement.isLocked}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Column 2: Y Position */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Y स्थिति (pt)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.bounds.y)}
                    onChange={(e) => handleGeometryChange('y', parseFloat(e.target.value))}
                    disabled={selectedElement.isLocked}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Column 1: Width */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">चौड़ाई (Width)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.bounds.width)}
                    onChange={(e) => handleGeometryChange('width', parseFloat(e.target.value))}
                    disabled={selectedElement.isLocked}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Column 2: Height */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ऊंचाई (Height)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.bounds.height)}
                    onChange={(e) => handleGeometryChange('height', parseFloat(e.target.value))}
                    disabled={selectedElement.isLocked}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Column Span Selector (1 to 8 Col) */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-1">
                कॉलम स्पैन (Column Span):
              </span>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((span) => (
                  <button
                    key={span}
                    type="button"
                    onClick={() => handleQuickColSpan(span)}
                    disabled={selectedElement.isLocked}
                    className={`py-1 rounded text-[10px] font-bold transition-all text-center cursor-pointer ${
                      selectedElement.colSpan === span
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {span}C
                  </button>
                ))}
              </div>
            </div>

            {/* TWO-COLUMN QUICK ALIGNMENT & ROTATION */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Column 1: Alignment */}
              <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">अलाइनमेंट (Alignment)</label>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'justify' })}
                    className={`flex-1 py-1 rounded flex items-center justify-center transition-all ${
                      selectedElement.textAlign === 'justify' || !selectedElement.textAlign
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    title="जस्टिफाइड (Justified)"
                  >
                    <AlignJustify className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'left' })}
                    className={`flex-1 py-1 rounded flex items-center justify-center transition-all ${
                      selectedElement.textAlign === 'left'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    title="बाएं अलाइन (Left)"
                  >
                    <AlignLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'center' })}
                    className={`flex-1 py-1 rounded flex items-center justify-center transition-all ${
                      selectedElement.textAlign === 'center'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    title="मध्य अलाइन (Center)"
                  >
                    <AlignCenter className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'right' })}
                    className={`flex-1 py-1 rounded flex items-center justify-center transition-all ${
                      selectedElement.textAlign === 'right'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    title="दाएं अलाइन (Right)"
                  >
                    <AlignRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Column 2: Rotation */}
              <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>रोटेशन (Rotation)</span>
                  <span>{selectedElement.rotation || 0}°</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={selectedElement.rotation || 0}
                    onChange={(e) =>
                      onUpdateElement({
                        ...selectedElement,
                        rotation: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement({
                        ...selectedElement,
                        rotation: ((selectedElement.rotation || 0) + 90) % 360,
                      })
                    }
                    className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                    title="90° घुमाएं"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* LEVEL 2: ADVANCED PROPERTIES (COLLAPSIBLE TABS / ACCORDIONS)       */}
          {/* ================================================================= */}
          <div className="p-3.5 space-y-4">
            {/* Tab navigation pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
              {isHeaderElement && (
                <button
                  type="button"
                  onClick={() => setActiveTab('header')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'header'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Newspaper className="w-3 h-3 text-purple-300" />
                  <span>हेडर सेटिंग्स</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'content'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>सामग्री (Copy)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('typography')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'typography'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Type className="w-3 h-3" />
                <span>टाइपोग्राफी</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('styling')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'styling'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Palette className="w-3 h-3" />
                <span>स्टाइल व बॉर्डर</span>
              </button>

              {hasImage && (
                <button
                  type="button"
                  onClick={() => setActiveTab('image')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'image'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>चित्र (Image)</span>
                </button>
              )}
            </div>

            {/* TAB: HEADER SETTINGS (CRITICAL FIX FOR HEADER ELEMENTS) */}
            {isHeaderElement && activeTab === 'header' && (
              <div className="space-y-3 bg-purple-50/50 p-3 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between pb-1 border-b border-purple-200">
                  <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5 text-purple-600" />
                    <span>अखबार हेडर विन्यास (Header Controls)</span>
                  </span>
                  {onOpenHeaderTemplates && (
                    <button
                      type="button"
                      onClick={onOpenHeaderTemplates}
                      className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold shadow-2xs hover:bg-purple-700 cursor-pointer"
                    >
                      टेम्पलेट बदलें
                    </button>
                  )}
                </div>

                {/* Newspaper Title */}
                <div>
                  <label className="block text-[10px] font-bold text-purple-900 mb-0.5">
                    अखबार का मुख्य नाम (Newspaper Title):
                  </label>
                  <input
                    type="text"
                    value={selectedElement.headerConfig?.newspaperTitle || selectedElement.customHeadline || 'दैनिक ब्रेकिंग न्यूज़ वाला'}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateElement({
                        ...selectedElement,
                        customHeadline: val,
                        headerConfig: { ...(selectedElement.headerConfig || {}), newspaperTitle: val },
                      });
                    }}
                    placeholder="उदा. दैनिक भास्कर / ब्रेकिंग न्यूज़ वाला"
                    className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Tagline / Subtitle */}
                <div>
                  <label className="block text-[10px] font-bold text-purple-900 mb-0.5">
                    टैगलाइन (Tagline / Slogan):
                  </label>
                  <input
                    type="text"
                    value={selectedElement.headerConfig?.tagline || selectedElement.customSubheadline || 'मध्य प्रदेश का अग्रणी निष्पक्ष डिजिटल दैनिक'}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateElement({
                        ...selectedElement,
                        customSubheadline: val,
                        headerConfig: { ...(selectedElement.headerConfig || {}), tagline: val },
                      });
                    }}
                    placeholder="उदा. निष्पक्ष, निर्भीक, सटीक"
                    className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Two-Column: Logo Emblem & Date Folio */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-0.5">प्रतीक चिन्ह (Logo):</label>
                    <input
                      type="text"
                      value={selectedElement.headerConfig?.emblemText || 'ब'}
                      onChange={(e) =>
                        onUpdateElement({
                          ...selectedElement,
                          headerConfig: { ...(selectedElement.headerConfig || {}), emblemText: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs font-bold text-center text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-0.5">दिनांक / पंचांग:</label>
                    <input
                      type="text"
                      value={selectedElement.headerConfig?.dateFolio || 'भोपाल, 22 नवंबर 2026'}
                      onChange={(e) =>
                        onUpdateElement({
                          ...selectedElement,
                          headerConfig: { ...(selectedElement.headerConfig || {}), dateFolio: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Two-Column: Header Title Font & Size */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-0.5">फॉन्ट शैली:</label>
                    <select
                      value={selectedElement.fontFamily || 'Rozha One'}
                      onChange={(e) => onUpdateElement({ ...selectedElement, fontFamily: e.target.value })}
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="Rozha One">Rozha One (पारंपरिक)</option>
                      <option value="Noto Sans Devanagari">Noto Sans (आधुनिक)</option>
                      <option value="Cinzel">Cinzel (क्लासिक)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-purple-900 mb-0.5">
                      <span>शीर्षक आकार:</span>
                      <span>{selectedElement.fontSize || 36}pt</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="72"
                      value={selectedElement.fontSize || 36}
                      onChange={(e) => onUpdateElement({ ...selectedElement, fontSize: parseInt(e.target.value, 10) })}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EDITORIAL CONTENT (COPY) */}
            {activeTab === 'content' && (
              <div className="space-y-3">
                {/* Print Headline */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>प्रिंट शीर्षक (Headline):</span>
                    <span>{(selectedElement.customHeadline || '').length} वर्ण</span>
                  </div>
                  <input
                    type="text"
                    value={selectedElement.customHeadline || ''}
                    onChange={(e) => onUpdateElement({ ...selectedElement, customHeadline: e.target.value })}
                    placeholder="समाचार का मुख्य शीर्षक दर्ज करें..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Subheadline / Kicker */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    किकर / उपशीर्षक (Deck / Kicker):
                  </label>
                  <input
                    type="text"
                    value={selectedElement.customSubheadline || ''}
                    onChange={(e) => onUpdateElement({ ...selectedElement, customSubheadline: e.target.value })}
                    placeholder="किकर अथवा उपशीर्षक..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Body Text */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>समाचार विवरण (Body Copy):</span>
                    <span>
                      {(selectedElement.customBodyText || '').trim().split(/\s+/).filter(Boolean).length} शब्द
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={selectedElement.customBodyText || ''}
                    onChange={(e) => onUpdateElement({ ...selectedElement, customBodyText: e.target.value })}
                    placeholder="विस्तृत समाचार विवरण..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none"
                  />
                </div>

                {/* TWO-COLUMN: Byline & Editor Credit */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">रिपोर्टर बायलाइन:</label>
                    <input
                      type="text"
                      value={selectedElement.byline || ''}
                      onChange={(e) => onUpdateElement({ ...selectedElement, byline: e.target.value })}
                      placeholder="संवाददाता का नाम..."
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">संपादक साभार:</label>
                    <input
                      type="text"
                      value={selectedElement.editorCredit || ''}
                      onChange={(e) => onUpdateElement({ ...selectedElement, editorCredit: e.target.value })}
                      placeholder="डेस्क संपादक..."
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Page Reassignment */}
                {onReassignPage && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                      <span>अन्य पृष्ठ पर भेजें (Move to Page):</span>
                    </label>
                    <select
                      value={page.pageNumber}
                      onChange={(e) => onReassignPage(selectedElement.id, parseInt(e.target.value, 10))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 cursor-pointer hover:border-blue-400"
                    >
                      {Array.from({ length: totalPages || 12 }, (_, i) => i + 1).map((pn) => (
                        <option key={pn} value={pn} disabled={pn === page.pageNumber}>
                          पृष्ठ {pn} {pn === page.pageNumber ? '(वर्तमान)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* TAB: TYPOGRAPHY (TWO-COLUMN LAYOUT) */}
            {activeTab === 'typography' && (
              <div className="space-y-3">
                {/* Two-Column: Font Family & Font Weight */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">फॉन्ट परिवार:</label>
                    <select
                      value={selectedElement.fontFamily || 'Noto Sans Devanagari'}
                      onChange={(e) => onUpdateElement({ ...selectedElement, fontFamily: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="Noto Sans Devanagari">Noto Sans Devanagari</option>
                      <option value="Rozha One">Rozha One (हेडलाइन)</option>
                      <option value="Inter">Inter (अंग्रेजी)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">फॉन्ट वेट (Weight):</label>
                    <select
                      value={selectedElement.fontWeight || '400'}
                      onChange={(e) => onUpdateElement({ ...selectedElement, fontWeight: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">SemiBold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">ExtraBold (800)</option>
                    </select>
                  </div>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>फॉन्ट आकार (Font Size):</span>
                    <span>{selectedElement.fontSize || 12} pt</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="64"
                    step="1"
                    value={selectedElement.fontSize || 12}
                    onChange={(e) =>
                      onUpdateElement({
                        ...selectedElement,
                        fontSize: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Two-Column: Text Color & Background */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">टेक्स्ट रंग (Color):</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedElement.color || '#000000'}
                        onChange={(e) => onUpdateElement({ ...selectedElement, color: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedElement.color || '#000000'}
                        onChange={(e) => onUpdateElement({ ...selectedElement, color: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">पृष्ठभूमि रंग (BG):</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedElement.backgroundColor || '#FFFFFF'}
                        onChange={(e) => onUpdateElement({ ...selectedElement, backgroundColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedElement.backgroundColor || '#FFFFFF'}
                        onChange={(e) => onUpdateElement({ ...selectedElement, backgroundColor: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: STYLING & BORDERS (TWO-COLUMN LAYOUT) */}
            {activeTab === 'styling' && (
              <div className="space-y-3">
                {/* Two-Column: Border Width & Border Color */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">बॉर्डर मोटाई (Width):</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={selectedElement.borderWidth || 0}
                      onChange={(e) => onUpdateElement({ ...selectedElement, borderWidth: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">बॉर्डर रंग (Color):</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedElement.borderColor || '#000000'}
                        onChange={(e) => onUpdateElement({ ...selectedElement, borderColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedElement.borderColor || '#000000'}
                        onChange={(e) => onUpdateElement({ ...selectedElement, borderColor: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Two-Column: Padding & Border Radius */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">पैडिंग (Padding pt):</label>
                    <input
                      type="number"
                      min="0"
                      max="48"
                      value={selectedElement.padding || 0}
                      onChange={(e) => onUpdateElement({ ...selectedElement, padding: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">कोने की गोलाई (Radius):</label>
                    <input
                      type="number"
                      min="0"
                      max="32"
                      value={selectedElement.borderRadius || 0}
                      onChange={(e) => onUpdateElement({ ...selectedElement, borderRadius: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>पारदर्शिता (Opacity):</span>
                    <span>{Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}
                    onChange={(e) => onUpdateElement({ ...selectedElement, opacity: parseInt(e.target.value, 10) / 100 })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB: IMAGE SETTINGS */}
            {hasImage && activeTab === 'image' && (
              <div className="space-y-3">
                {selectedElement.imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black/5 aspect-video flex items-center justify-center">
                      <img
                        src={selectedElement.imageUrl}
                        alt="Attachment"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                        {selectedElement.imageUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedElement, imageUrl: undefined })}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        चित्र हटाएं
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                    कोई चित्र संलग्न नहीं है
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isUploadingImage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>अपलोड हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{selectedElement.imageUrl ? 'चित्र बदलें (Replace)' : 'फ़ोटो अपलोड करें (Upload)'}</span>
                    </>
                  )}
                </button>

                {uploadError && <span className="text-[10px] text-red-600 block">{uploadError}</span>}

                {/* Two-Column: Object Fit & Photo Credit */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">फ़िट मोड (Object Fit):</label>
                    <select
                      value={selectedElement.objectFit || 'cover'}
                      onChange={(e) => onUpdateElement({ ...selectedElement, objectFit: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    >
                      <option value="cover">कवर (Cover)</option>
                      <option value="contain">कंटेन (Contain)</option>
                      <option value="fill">स्ट्रेच (Fill)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">फोटो साभार (Credit):</label>
                    <input
                      type="text"
                      value={selectedElement.photoCredit || ''}
                      onChange={(e) => onUpdateElement({ ...selectedElement, photoCredit: e.target.value })}
                      placeholder="साभार..."
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Caption input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">चित्र कैप्शन (Caption):</label>
                  <input
                    type="text"
                    value={selectedElement.caption || ''}
                    onChange={(e) => onUpdateElement({ ...selectedElement, caption: e.target.value })}
                    placeholder="चित्र का संक्षिप्त विवरण..."
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /* PAGE INSPECTOR (WHEN NO ELEMENT IS SELECTED)                        */
        /* =================================================================== */
        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="pb-3 border-b border-slate-200">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
              पृष्ठ {page.pageNumber}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-1">पृष्ठ गुण (Page Inspector)</h3>
            <p className="text-xs text-slate-500 mt-0.5">ब्रॉडशीट पृष्ठ विन्यास व सेटिंग्स</p>
          </div>

          {/* Overlap collision warning */}
          {hasCollision && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2 text-xs text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">ओवरलैप चेतावनी!</span>
                <span>कैनवास पर कुछ तत्व एक-दूसरे के ऊपर स्थित हैं।</span>
              </div>
            </div>
          )}

          {/* Page Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">पृष्ठ शीर्षक (Title):</label>
            <input
              type="text"
              value={page.pageTitle || ''}
              onChange={(e) => onUpdatePageTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
            />
          </div>

          {/* Section Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">सेक्शन प्रकार (Section):</label>
            <select
              value={page.sectionType || 'FRONT_PAGE'}
              onChange={(e) => onUpdatePageSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 cursor-pointer"
            >
              {sections.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Column Grid (1 to 8) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">कॉलम ग्रिड (Column Grid):</label>
            <div className="grid grid-cols-7 gap-1">
              {([1, 2, 3, 4, 5, 6, 8] as GridColumnCount[]).map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => onUpdatePageGridColumns(cols)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    page.gridColumns === cols
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Page Summary Metrics */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <span className="font-bold text-slate-700 block mb-1">पृष्ठ सांख्यिकी:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>आवंटित समाचार: <strong>{(page.elements || []).filter((e) => e.articleId).length}</strong></div>
              <div>कुल तत्व: <strong>{(page.elements || []).length}</strong></div>
              <div>अखबार आकार: <strong>32.9 × 52.0 cm</strong></div>
              <div>OCC संस्करण: <strong>v{page.version || 1}</strong></div>
            </div>
          </div>

          {/* Master Admin Header Templates Button */}
          {onOpenHeaderTemplates && (
            <button
              type="button"
              onClick={onOpenHeaderTemplates}
              className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>हेडर टेम्पलेट मैनेजर खोलें</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
