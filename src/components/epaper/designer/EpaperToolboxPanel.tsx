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
} from 'lucide-react';
import {
  ArticleDetail,
  EpaperPageDoc,
  EpaperElementType,
  EpaperTemplateDoc,
} from '../../../types';
import { DEFAULT_EPAPER_TEMPLATES } from '../../../data/defaultEpaperTemplates';
import { apiClient } from '../../../services/apiClient';

export interface EpaperToolboxPanelProps {
  articles: ArticleDetail[];
  editionPages: EpaperPageDoc[];
  activePageNumber: number;
  onAddStory: (article: ArticleDetail) => void;
  onAddPrimitive: (elementType: EpaperElementType) => void;
  onApplyTemplate: (template: EpaperTemplateDoc) => void;
  onUploadMedia?: (file: File, category: 'newspaper' | 'article' | 'photo', caption?: string) => Promise<void> | void;
}

export const EpaperToolboxPanel: React.FC<EpaperToolboxPanelProps> = ({
  articles,
  editionPages,
  activePageNumber,
  onAddStory,
  onAddPrimitive,
  onApplyTemplate,
  onUploadMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'stories' | 'uploads' | 'primitives' | 'templates'>('stories');
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
    { key: 'SPORTS', label: 'खेल' },
    { key: 'HEALTH', label: 'स्वास्थ्य' },
  ];

  const primitives: Array<{
    type: EpaperElementType;
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      type: 'HEADLINE',
      title: 'शीर्षक बॉक्स (Headline)',
      desc: 'मल्टी-कॉलम बैनर शीर्षक, किकर व डेक सहित',
      icon: <Type className="w-5 h-5 text-red-600" />,
      color: 'border-red-200 bg-red-50/50 hover:border-red-400',
    },
    {
      type: 'STORY',
      title: 'समाचार विवरण (Story)',
      desc: 'जस्टिफाइड देवनागरी फॉन्ट व रिपोर्टर बायलाइन',
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50/50 hover:border-blue-400',
    },
    {
      type: 'IMAGE',
      title: 'चित्र / फोटो (Image)',
      desc: 'अखबार फोटो व फोटोग्राफर साभार पट्टी',
      icon: <ImageIcon className="w-5 h-5 text-emerald-600" />,
      color: 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400',
    },
    {
      type: 'AD',
      title: 'विज्ञापन (ASCI Ad Box)',
      desc: 'अनिवार्य "विज्ञापन" लेबल युक्त व्यावसायिक स्लॉट',
      icon: <DollarSign className="w-5 h-5 text-amber-600" />,
      color: 'border-amber-200 bg-amber-50/50 hover:border-amber-400',
    },
    {
      type: 'MASTHEAD',
      title: 'अखबार मास्टहेड (Masthead)',
      desc: 'पारंपरिक देवनागरी नामपट्टी व पंचांग बॉक्स',
      icon: <Newspaper className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-200 bg-purple-50/50 hover:border-purple-400',
    },
    {
      type: 'COLUMN',
      title: 'संपादकीय आलेख (Column)',
      desc: 'लेखक प्रोफाइल फोटो, विशेष दृष्टिकोण आलेख',
      icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
      color: 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-400',
    },
  ];

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Hidden File Input for Media Upload */}
      <input
        ref={mediaFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleMediaFileSelected}
        className="hidden"
      />

      {/* Tab Switcher */}
      <div className="p-2 border-b border-slate-200 bg-slate-50 grid grid-cols-4 gap-1">
        <button
          onClick={() => setActiveTab('stories')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'stories'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="स्वीकृत समाचार सूची"
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate">समाचार</span>
        </button>

        <button
          onClick={() => setActiveTab('uploads')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'uploads'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="अखबार चित्र व फोटोग्राफ अपलोड"
        >
          <Upload className="w-3 h-3 shrink-0 text-emerald-600" />
          <span className="truncate">अपलोड</span>
        </button>

        <button
          onClick={() => setActiveTab('primitives')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'primitives'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="पेज तत्व (हेडलाइन, स्टोरी, इमेज, विज्ञापन)"
        >
          <Layers className="w-3 h-3 shrink-0" />
          <span className="truncate">तत्व</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'templates'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="ब्रॉडशीट टेम्पलेट्स"
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span className="truncate">टेम्पलेट</span>
        </button>
      </div>

      {/* Tab 2: Media & Image Uploads (Section 5) */}
      {activeTab === 'uploads' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              मीडिया एवं फ़ोटो प्रबंधन
            </span>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5">
              पृष्ठ {activePageNumber} हेतु चित्र अपलोड करें
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              सीधे क्लाउड स्टोरेज में अपलोड करें व ब्रॉडशीट कैनवास पर तुरंत संलग्न करें।
            </p>
          </div>

          {/* Caption Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              चित्र कैप्शन / शीर्षक (वैकल्पिक):
            </label>
            <input
              type="text"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              placeholder="चित्र का शीर्षक अथवा विवरण..."
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* 3 Clear Upload Actions */}
          <div className="space-y-2.5">
            {/* 1. Upload Newspaper Image */}
            <div className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4 text-blue-600" />
                  <span>1. समाचार पत्र फोटो (Newspaper Image)</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">
                अखबार की मुख्य खबर हेतु उच्च-रिज़ॉल्यूशन लीड फोटो (JPG, PNG, WebP ≤ 10MB)।
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
                <span>समाचार पत्र फोटो अपलोड करें</span>
              </button>
            </div>

            {/* 2. Upload Article Image */}
            <div className="p-3 bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-xl transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>2. आलेख चित्र (Article Image)</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">
                विशेष आलेख अथवा विश्लेषण समाचार से संबंधित प्रासंगिक चित्र अपलोड करें।
              </p>
              <button
                type="button"
                onClick={() => handleTriggerUpload('article')}
                disabled={isUploading}
                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                {isUploading && uploadCategory === 'article' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>आलेख चित्र अपलोड करें</span>
              </button>
            </div>

            {/* 3. Upload Supporting Photograph */}
            <div className="p-3 bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-xl transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>3. सहायक छायाचित्र (Supporting Photo)</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">
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
                <span>सहायक छायाचित्र अपलोड करें</span>
              </button>
            </div>
          </div>

          {/* Feedback banner */}
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

          {/* Infrastructure guarantee note */}
          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[10px] text-blue-900 space-y-0.5">
            <span className="font-bold block">🔒 अधिकृत मीडिया पाइपलाइन:</span>
            <span>Cloud Storage / MinIO इंजन द्वारा 300 DPI मुद्रण मानकों पर आधारित सुरक्षित मीडिया संधारण।</span>
          </div>
        </div>
      )}

      {/* Tab 1: Approved Stories Queue */}
      {activeTab === 'stories' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search & Category Filter */}
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

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
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

          {/* Stories List */}
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
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {art.categoryName || art.category || 'सामान्य'}
                        </span>
                        {art.priority && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              String(art.priority).toUpperCase() === 'BREAKING' || String(art.priority).toUpperCase() === 'CRITICAL'
                                ? 'bg-red-100 text-red-800'
                                : String(art.priority).toUpperCase() === 'URGENT' || String(art.priority).toUpperCase() === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {art.priority}
                          </span>
                        )}
                        {!art.imageUrl && (
                          <span
                            className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                            title="फ़ोटो अनुपलब्ध"
                          >
                            ⚠️ नो फ़ोटो
                          </span>
                        )}
                        {!art.authorName && !(art as any).byline && (
                          <span
                            className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                            title="रिपोर्टर साभार रिक्त"
                          >
                            ⚠️ नो साभार
                          </span>
                        )}
                      </div>

                      {/* Duplicate Placement Badges */}
                      {isAssignedHere ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>इस पृष्ठ पर</span>
                        </span>
                      ) : isAssignedOther ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>पृष्ठ {assignedPage} पर</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
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
                        className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold flex items-center gap-1 transition-colors"
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

      {/* Tab 2: Element Primitives */}
      {activeTab === 'primitives' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500 px-1 mb-1">
            क्लिक करके खाली तत्व पृष्ठ पर जोड़ें:
          </div>

          {primitives.map((prim) => (
            <div
              key={prim.type}
              onClick={() => onAddPrimitive(prim.type)}
              className={`p-3 rounded-xl border ${prim.color} cursor-pointer transition-all flex items-start gap-3 group`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                {prim.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{prim.title}</h4>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  {prim.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Broadsheet Page Presets */}
      {activeTab === 'templates' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500 px-1 mb-1">
            मानक ब्रॉडशीट टेम्पलेट्स ({DEFAULT_EPAPER_TEMPLATES.length}):
          </div>

          {/* Template Category Pills */}
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
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
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
