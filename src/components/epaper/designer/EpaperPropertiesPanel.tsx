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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Page level metric calculations
  const assignedStoriesCount = (page.elements || []).filter(
    (el) => el.elementType === 'STORY' || Boolean(el.articleId)
  ).length;

  const missingImagesCount = (page.elements || []).filter(
    (el) => (el.elementType === 'STORY' || el.elementType === 'IMAGE') && !el.imageUrl
  ).length;

  const missingCreditsCount = (page.elements || []).filter(
    (el) => el.missingReporterCredit || el.missingEditorCredit || !el.byline
  ).length;

  const overflowElementsCount = (page.elements || []).filter((el) => {
    const b = el.bounds;
    return b.x < 0 || b.y < 0 || b.x + b.width > 933 || b.y + b.height > 1475;
  }).length;

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
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 h-full overflow-y-auto select-none p-4 space-y-5">
      {selectedElement ? (
        <>
          {/* Element Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {selectedElement.elementType}
                </span>
                {refArticle?.priority && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      String(refArticle.priority).toUpperCase() === 'BREAKING' || String(refArticle.priority).toUpperCase() === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : String(refArticle.priority).toUpperCase() === 'URGENT' || String(refArticle.priority).toUpperCase() === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {refArticle.priority}
                  </span>
                )}
                {refArticle?.status && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {refArticle.status}
                  </span>
                )}
                <span className="text-xs font-mono text-slate-400">
                  {selectedElement.id.slice(-6)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">तत्व गुण (Element Inspector)</h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateElement({ ...selectedElement, isLocked: !selectedElement.isLocked })}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedElement.isLocked
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title={selectedElement.isLocked ? 'अनलॉक करें (Unlock)' : 'तत्व लॉक करें (Lock)'}
              >
                {selectedElement.isLocked ? <Lock className="w-4 h-4 text-amber-700" /> : <Unlock className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onDuplicateElement(selectedElement.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="प्रतिलिपि बनाएं (Duplicate - Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteElement(selectedElement.id)}
                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="हटाएं (Delete - Del)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Locked Status Banner */}
          {selectedElement.isLocked && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-bold">तत्व लॉक है (Position Locked)</span>
              </div>
              <button
                onClick={() => onUpdateElement({ ...selectedElement, isLocked: false })}
                className="text-[10px] font-bold text-amber-800 underline hover:text-amber-900"
              >
                अनलॉक करें
              </button>
            </div>
          )}

          {/* Dedicated Image Upload & Management Card */}
          {(selectedElement.elementType === 'IMAGE' || selectedElement.elementType === 'STORY' || selectedElement.elementType === 'COLUMN') && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>चित्र प्रबंधन (Image Attachment)</span>
                </span>
                {selectedElement.imageUrl && (
                  <button
                    onClick={() => onUpdateElement({ ...selectedElement, imageUrl: undefined })}
                    className="text-[10px] text-red-600 hover:underline flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" />
                    <span>हटाएं</span>
                  </button>
                )}
              </div>

              {selectedElement.imageUrl ? (
                <div className="space-y-1.5">
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black/5 aspect-video flex items-center justify-center">
                    <img
                      src={selectedElement.imageUrl}
                      alt="Element attachment"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {selectedElement.imageUrl}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                  <span>कोई चित्र संलग्न नहीं है</span>
                </div>
              )}

              {/* Upload input & button */}
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
                    <span>{selectedElement.imageUrl ? 'चित्र बदलें (Replace Image)' : 'फ़ोटो अपलोड करें (Upload Image)'}</span>
                  </>
                )}
              </button>

              {uploadError && (
                <span className="text-[10px] text-red-600 block">{uploadError}</span>
              )}
            </div>
          )}

          {/* Missing Image / Missing Credit Alerts */}
          {(selectedElement.elementType === 'STORY' || selectedElement.elementType === 'IMAGE') && !selectedElement.imageUrl && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">फ़ोटो अनुपलब्ध (Missing Image)</span>
                <span className="text-[11px] text-amber-700">यह स्टोरी बिना चित्र के टेक्स्ट रूप में मुद्रित होगी।</span>
              </div>
            </div>
          )}

          {(selectedElement.missingReporterCredit || !selectedElement.byline) && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">रिपोर्टर क्रेडिट रिक्त</span>
                <span className="text-[11px] text-amber-700">कृपया नीचे संवाददाता की बायलाइन दर्ज करें।</span>
              </div>
            </div>
          )}

          {(selectedElement.missingEditorCredit || !selectedElement.editorCredit) && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">संपादक क्रेडिट रिक्त</span>
                <span className="text-[11px] text-blue-700">डेस्क संपादक का नाम नीचे दर्ज करें।</span>
              </div>
            </div>
          )}

          {/* 1. Geometry Coordinates */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>ज्यामिति व स्थिति (Geometry - pt)</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">X स्थिति (pt)</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.bounds.x)}
                  onChange={(e) => handleGeometryChange('x', parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Y स्थिति (pt)</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.bounds.y)}
                  onChange={(e) => handleGeometryChange('y', parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">चौड़ाई (Width)</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.bounds.width)}
                  onChange={(e) => handleGeometryChange('width', parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ऊंचाई (Height)</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.bounds.height)}
                  onChange={(e) => handleGeometryChange('height', parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quick Column Span Pills */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 mb-1.5">
                त्वरित कॉलम स्नैप (Quick Column Span):
              </span>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: page.gridColumns || 8 }, (_, i) => i + 1).map((span) => (
                  <button
                    key={span}
                    onClick={() => handleQuickColSpan(span)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                      selectedElement.colSpan === span
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {span} Col
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Editorial Role & Layer */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>संपादकीय स्तर व लेयर (Role & Layers)</span>
            </h4>

            <div className="flex items-center gap-2">
              <select
                value={selectedElement.role || 'LEAD'}
                onChange={(e) =>
                  onUpdateElement({ ...selectedElement, role: e.target.value as any })
                }
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="LEAD">मुख्य लीड (Lead Story)</option>
                <option value="SECOND_LEAD">द्वितीय लीड (Second Lead)</option>
                <option value="ANCHOR">एंकर स्टोरी (Anchor)</option>
                <option value="BRIEF">संक्षिप्त खबर (Brief)</option>
                <option value="OPINION">संपादकीय आलेख (Opinion)</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onReorderZIndex(selectedElement.id, 'UP')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                  title="आगे लाएं (Bring Forward)"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onReorderZIndex(selectedElement.id, 'DOWN')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                  title="पीछे भेजें (Send Backward)"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Typography Controls */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>टाइपोग्राफी (Typography)</span>
            </h4>

            {/* Font Size Slider */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>फॉन्ट साइज़</span>
                <span>{selectedElement.fontSize || 12} pt</span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
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

            {/* Text Alignment */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'justify' })}
                className={`flex-1 py-1 rounded flex items-center justify-center text-xs font-bold transition-all ${
                  selectedElement.textAlign === 'justify' || !selectedElement.textAlign
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="जस्टिफाइड (Justified Newspaper)"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'left' })}
                className={`flex-1 py-1 rounded flex items-center justify-center text-xs font-bold transition-all ${
                  selectedElement.textAlign === 'left'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="बाएं अलाइन (Left Align)"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'center' })}
                className={`flex-1 py-1 rounded flex items-center justify-center text-xs font-bold transition-all ${
                  selectedElement.textAlign === 'center'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="मध्य अलाइन (Center Align)"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. Text Content Overrides (Preserves Immutability) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>संपादकीय सामग्री (Editorial Copy)</span>
              </h4>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                अपरिवर्तनीय स्रोत
              </span>
            </div>

            {/* Custom Headline */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                प्रिंट शीर्षक (Headline):
              </label>
              <input
                type="text"
                value={selectedElement.customHeadline || ''}
                onChange={(e) =>
                  onUpdateElement({ ...selectedElement, customHeadline: e.target.value })
                }
                placeholder="समाचार का शीर्षक दर्ज करें..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Custom Subheadline / Kicker */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                किकर / उपशीर्षक (Deck / Kicker):
              </label>
              <input
                type="text"
                value={selectedElement.customSubheadline || ''}
                onChange={(e) =>
                  onUpdateElement({ ...selectedElement, customSubheadline: e.target.value })
                }
                placeholder="किकर या उपशीर्षक..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Custom Body Text */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                समाचार विवरण (Body Copy):
              </label>
              <textarea
                rows={5}
                value={selectedElement.customBodyText || ''}
                onChange={(e) =>
                  onUpdateElement({ ...selectedElement, customBodyText: e.target.value })
                }
                placeholder="विस्तृत समाचार विवरण..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none"
              />
            </div>

            {/* Byline Attribution */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                रिपोर्टर बायलाइन (Byline):
              </label>
              <input
                type="text"
                value={selectedElement.byline || ''}
                onChange={(e) =>
                  onUpdateElement({ ...selectedElement, byline: e.target.value })
                }
                placeholder="संवाददाता का नाम..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Photo Credit */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                फोटो साभार (Photo Credit):
              </label>
              <input
                type="text"
                value={selectedElement.photoCredit || ''}
                onChange={(e) =>
                  onUpdateElement({ ...selectedElement, photoCredit: e.target.value })
                }
                placeholder="फोटो ब्यूरो / फोटोग्राफर..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Editor Credit */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                डेस्क संपादक साभार (Editor Credit):
              </label>
              <input
                type="text"
                value={selectedElement.editorCredit || ''}
                onChange={(e) =>
                  onUpdateElement({
                    ...selectedElement,
                    editorCredit: e.target.value,
                    missingEditorCredit: !e.target.value.trim(),
                  })
                }
                placeholder="डेस्क संपादक का नाम..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Page Reassignment */}
            {onReassignPage && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  <span>अन्य पृष्ठ पर भेजें (Move to Page):</span>
                </label>
                <select
                  value={page.pageNumber}
                  onChange={(e) => onReassignPage(selectedElement.id, parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 cursor-pointer hover:border-blue-400 transition-colors"
                >
                  {Array.from({ length: totalPages || 12 }, (_, i) => i + 1).map((pn) => (
                    <option key={pn} value={pn} disabled={pn === page.pageNumber}>
                      पृष्ठ {pn} {pn === page.pageNumber ? '(वर्तमान)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ASCI Badge Toggle for Ads */}
            {selectedElement.elementType === 'AD' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">ASCI विज्ञापन बैज</span>
                  <span className="text-[10px] text-amber-700">अनिवार्य 'विज्ञापन' मार्क</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                  सक्रिय (Mandatory)
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Page Properties when no element selected */
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
              पृष्ठ {page.pageNumber}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-1">पृष्ठ गुण (Page Inspector)</h3>
            <p className="text-xs text-slate-500 mt-0.5">ब्रॉडशीट पृष्ठ विन्यास व सामान्य सेटिंग्स</p>
          </div>

          {/* Page-level Warning Banners */}
          {hasCollision && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">ओवरलैप चेतावनी!</span>
                <span>कैनवास पर कुछ तत्व एक-दूसरे के ऊपर स्थित हैं। कृपया स्थान समायोजित करें।</span>
              </div>
            </div>
          )}

          {overflowElementsCount > 0 && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">पृष्ठ सीमा पार (Overflow)!</span>
                <span>{overflowElementsCount} तत्व अखबार के मुद्रण क्षेत्र (32.9 × 52 cm) से बाहर हैं।</span>
              </div>
            </div>
          )}

          {missingImagesCount > 0 && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">फ़ोटो अनुपलब्ध ({missingImagesCount})</span>
                <span className="text-[11px] text-amber-700">इस पृष्ठ के {missingImagesCount} समाचारों में चित्र नहीं है।</span>
              </div>
            </div>
          )}

          {missingCreditsCount > 0 && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">क्रेडिट रिक्त ({missingCreditsCount})</span>
                <span className="text-[11px] text-amber-700">रिपोर्टर या डेस्क संपादक क्रेडिट अपूर्ण है।</span>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Section Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">सेक्शन प्रकार (Section):</label>
            <select
              value={page.sectionType || 'FRONT_PAGE'}
              onChange={(e) => onUpdatePageSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
            >
              {sections.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Modular Grid Columns */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              कॉलम ग्रिड (Column Grid):
            </label>
            <div className="grid grid-cols-5 gap-1">
              {([3, 4, 5, 6, 8] as GridColumnCount[]).map((cols) => (
                <button
                  key={cols}
                  onClick={() => onUpdatePageGridColumns(cols)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    page.gridColumns === cols
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cols} Col
                </button>
              ))}
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>आवंटित समाचार (Stories):</span>
              <span className="font-bold text-blue-600">{assignedStoriesCount}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>कुल तत्व संख्या (Elements):</span>
              <span className="font-bold text-slate-800">{page.elements?.length || 0}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>अखबार आयाम:</span>
              <span className="font-mono text-slate-800">32.9 × 52.0 cm</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>मुद्रण क्षेत्र:</span>
              <span className="font-mono text-slate-800">29.9 × 44.0 cm</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>वर्तमान OCC संस्करण:</span>
              <span className="font-mono font-bold text-blue-600">v{page.version || 1}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
