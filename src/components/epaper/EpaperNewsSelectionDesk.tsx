import React, { useState, useEffect, useMemo } from 'react';
import {
  EpaperEditionDoc,
  EpaperPageDoc,
  EpaperPageElement,
  ArticleDetail,
} from '../../types';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Lock,
  Layers,
  FileText,
  User,
  Camera,
  BookOpen,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export interface EpaperNewsSelectionDeskProps {
  edition: EpaperEditionDoc;
  articles: ArticleDetail[];
  onBack: () => void;
  onPageUpdated?: (updatedPage: EpaperPageDoc) => void;
  onOpenDesigner?: (editionId: string, pageNumber: number) => void;
}

export const EpaperNewsSelectionDesk: React.FC<EpaperNewsSelectionDeskProps> = ({
  edition,
  articles,
  onBack,
  onPageUpdated,
  onOpenDesigner,
}) => {
  const [pages, setPages] = useState<EpaperPageDoc[]>([]);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(true);
  const [isSavingPage, setIsSavingPage] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load edition pages
  useEffect(() => {
    let isMounted = true;
    async function loadPages() {
      setIsLoadingPages(true);
      try {
        const { apiClient } = await import('../../services/apiClient');
        const fetchedPages = await apiClient.epaper.getEditionPages(edition.id);
        if (isMounted) {
          if (fetchedPages && fetchedPages.length > 0) {
            setPages(fetchedPages);
          } else {
            // Fallback generation if no pages exist yet
            const total = edition.totalPages || 12;
            const fallback: EpaperPageDoc[] = Array.from({ length: total }).map((_, i) => ({
              id: `page-${edition.id}-${i + 1}`,
              editionId: edition.id,
              pageNumber: i + 1,
              pageTitle: i === 0 ? 'प्रथम पृष्ठ (मुख्य समाचार)' : `पृष्ठ ${i + 1}`,
              sectionType: i === 0 ? 'FRONT_PAGE' : 'STATE',
              gridColumns: i === 3 ? 6 : 8,
              elements: [],
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
            setPages(fallback);
          }
        }
      } catch {
        if (isMounted) {
          const total = edition.totalPages || 12;
          const fallback: EpaperPageDoc[] = Array.from({ length: total }).map((_, i) => ({
            id: `page-${edition.id}-${i + 1}`,
            editionId: edition.id,
            pageNumber: i + 1,
            pageTitle: i === 0 ? 'प्रथम पृष्ठ (मुख्य समाचार)' : `पृष्ठ ${i + 1}`,
            sectionType: i === 0 ? 'FRONT_PAGE' : 'STATE',
            gridColumns: i === 3 ? 6 : 8,
            elements: [],
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setPages(fallback);
        }
      } finally {
        if (isMounted) setIsLoadingPages(false);
      }
    }
    loadPages();
    return () => {
      isMounted = false;
    };
  }, [edition.id, edition.totalPages]);

  const activePage = pages.find((p) => p.pageNumber === activePageNum) || pages[0] || null;

  // Build duplicate placement index: articleId -> pageNumber
  const placedArticleMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const page of pages) {
      for (const el of page.elements || []) {
        if (el.articleId) {
          map.set(el.articleId, page.pageNumber);
        }
      }
    }
    return map;
  }, [pages]);

  // Approved articles filter
  const approvedArticles = useMemo(() => {
    return articles.filter((a) => {
      // Must be approved
      const isApproved = String(a.status).toUpperCase() === 'APPROVED' || String(a.status).toUpperCase() === 'PUBLISHED';
      if (!isApproved) return false;

      // Category filter
      if (selectedCategory !== 'all' && a.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title?.toLowerCase().includes(q);
        const matchesSummary = a.summary?.toLowerCase().includes(q);
        const matchesByline = a.authorName?.toLowerCase().includes(q) || (a as any).byline?.toLowerCase().includes(q);
        return matchesTitle || matchesSummary || matchesByline;
      }

      return true;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Place article onto active page (SOURCE ARTICLE IMMUTABILITY PRESERVED)
  const handleAssignArticle = async (article: ArticleDetail) => {
    if (!activePage) return;

    // Check duplicate placement
    const alreadyOnPage = placedArticleMap.get(article.id);
    if (alreadyOnPage && alreadyOnPage !== activePageNum) {
      const confirmPlace = window.confirm(
        `चेतावनी: यह समाचार पहले से पृष्ठ ${alreadyOnPage} पर असाइन है। क्या आप इसे पृष्ठ ${activePageNum} पर भी सम्मिलित करना चाहते हैं?`
      );
      if (!confirmPlace) return;
    }

    // Create layout element snapshot without mutating source article
    const newElement: EpaperPageElement = {
      id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      elementType: 'STORY',
      articleId: article.id,
      bounds: { x: 20, y: 50, width: 280, height: 180 },
      colSpan: 4,
      customHeadline: article.title,
      customBodyText: article.content || article.summary,
      byline: (article as any).byline || article.authorName || 'संवाददाता',
      photoCredit: (article as any).photographer || 'बीएनडब्ल्यू फोटो ब्यूरो',
      imageUrl: article.imageUrl,
      role: 'LEAD',
      zIndex: (activePage.elements?.length || 0) + 1,
    };

    const updatedElements = [...(activePage.elements || []), newElement];
    const updatedPage: EpaperPageDoc = {
      ...activePage,
      elements: updatedElements,
      version: (activePage.version || 1),
    };

    // Update in-memory pages state immediately
    setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p)));

    // Persist to backend
    setIsSavingPage(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      const saved = await apiClient.epaper.updatePage(activePage.id, {
        elements: updatedElements,
        version: activePage.version || 1,
      });
      setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? saved : p)));
      if (onPageUpdated) onPageUpdated(saved);
      setSaveToast('समाचार सफलतापूर्वक पृष्ठ पर असाइन किया गया!');
      setTimeout(() => setSaveToast(null), 3000);
    } catch {
      // Keep optimistic update in place
    } finally {
      setIsSavingPage(false);
    }
  };

  // Remove element from page
  const handleRemoveElement = async (elementId: string) => {
    if (!activePage) return;
    const updatedElements = (activePage.elements || []).filter((el) => el.id !== elementId);
    const updatedPage: EpaperPageDoc = {
      ...activePage,
      elements: updatedElements,
      version: activePage.version || 1,
    };

    setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p)));

    try {
      const { apiClient } = await import('../../services/apiClient');
      const saved = await apiClient.epaper.updatePage(activePage.id, {
        elements: updatedElements,
        version: activePage.version || 1,
      });
      setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? saved : p)));
      if (onPageUpdated) onPageUpdated(saved);
    } catch {}
  };

  // Update element editorial role
  const handleUpdateElementRole = async (elementId: string, role: any) => {
    if (!activePage) return;
    const updatedElements = (activePage.elements || []).map((el) =>
      el.id === elementId ? { ...el, role } : el
    );
    const updatedPage = { ...activePage, elements: updatedElements };
    setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p)));

    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.epaper.updatePage(activePage.id, {
        elements: updatedElements,
        version: activePage.version || 1,
      });
    } catch {}
  };

  // Update element text overrides (Immutability guarantee)
  const handleUpdateElementText = async (elementId: string, field: 'customHeadline' | 'byline' | 'customBodyText', val: string) => {
    if (!activePage) return;
    const updatedElements = (activePage.elements || []).map((el) =>
      el.id === elementId ? { ...el, [field]: val } : el
    );
    const updatedPage = { ...activePage, elements: updatedElements };
    setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p)));

    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.epaper.updatePage(activePage.id, {
        elements: updatedElements,
        version: activePage.version || 1,
      });
    } catch {}
  };

  // Reorder elements
  const handleMoveElement = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!activePage || !activePage.elements) return;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activePage.elements.length) return;

    const list = [...activePage.elements];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updatedPage = { ...activePage, elements: list };
    setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p)));

    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.epaper.updatePage(activePage.id, {
        elements: list,
        version: activePage.version || 1,
      });
    } catch {}
  };

  const categories = [
    { key: 'all', label: 'सभी श्रेणियां' },
    { key: 'POLITY', label: 'राजनीति' },
    { key: 'DEVELOPMENT', label: 'विकास व प्रशासन' },
    { key: 'CRIME', label: 'अपराध व कानून' },
    { key: 'CULTURE', label: 'संस्कृति व समाज' },
    { key: 'BUSINESS', label: 'व्यापार व मंडी' },
    { key: 'SPORTS', label: 'खेलकूद' },
    { key: 'HEALTH', label: 'स्वास्थ्य' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="संस्करण सूची पर वापस जाएं"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                {edition.editionCode || 'EP-BROADSHEET'}
              </span>
              <h3 className="text-base font-bold text-slate-900">{edition.title}</h3>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              प्रकाशन तिथि: <span className="font-semibold text-slate-700">{edition.publicationDate}</span> • क्षेत्र: {edition.districtName || 'भोपाल'} ({edition.divisionName || 'भोपाल संभाग'})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenDesigner && (
            <button
              onClick={() => onOpenDesigner(edition.id, activePageNum)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
              title="3-पैनल ब्रॉडशीट लेआउट डिज़ाइनर खोलें"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>लेआउट डिज़ाइनर खोलें</span>
            </button>
          )}

          {saveToast && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* Page Carousel Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="text-xs font-bold text-slate-500 mb-2 px-1">
          लक्षित पृष्ठ चुनें (Select Target Broadsheet Page):
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {pages.map((p) => {
            const isActive = p.pageNumber === activePageNum;
            const count = p.elements?.length || 0;

            return (
              <button
                key={p.pageNumber}
                onClick={() => setActivePageNum(p.pageNumber)}
                className={`py-2 px-3 rounded-xl border flex items-center gap-2 shrink-0 transition-all ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-100 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xs">पृष्ठ {p.pageNumber}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split-Screen Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL (7 Cols): Approved News Articles Browser */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4 flex flex-col h-[700px]">
          {/* Search & Category Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>सत्यापित समाचार ब्राउज़र (Approved Stories Queue)</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {approvedArticles.length} समाचार उपलब्ध
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="शीर्षक, विवरण अथवा संवाददाता खोजें..."
                className="w-full text-xs px-3 py-2 pl-9 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                    selectedCategory === cat.key
                      ? 'border-blue-600 bg-blue-600 text-white font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Approved Articles List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {approvedArticles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                कोई स्वीकृत समाचार उपलब्ध नहीं है।
              </div>
            ) : (
              approvedArticles.map((article) => {
                const placedOnPage = placedArticleMap.get(article.id);
                const isPlacedOnCurrent = placedOnPage === activePageNum;
                const isPlacedElsewhere = placedOnPage && placedOnPage !== activePageNum;

                return (
                  <div
                    key={article.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      isPlacedOnCurrent
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : isPlacedElsewhere
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    {/* Status & Placement Warning Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                        {article.category || 'NEWS'}
                      </span>

                      {isPlacedOnCurrent && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>इस पृष्ठ पर असाइन है</span>
                        </span>
                      )}

                      {isPlacedElsewhere && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>⚠️ चेतावनी: पहले से पृष्ठ {placedOnPage} पर असाइन है!</span>
                        </span>
                      )}
                    </div>

                    {/* Headline */}
                    <h5 className="text-xs font-bold text-slate-900 leading-snug">
                      {article.title}
                    </h5>

                    {/* Excerpt */}
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {article.summary || article.content}
                    </p>

                    {/* Footer: Attribution & Assign CTA */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{article.authorName || 'संवाददाता'}</span>
                        </span>
                        {(article as any).photographer && (
                          <span className="flex items-center gap-1">
                            <Camera className="w-3 h-3 text-slate-400" />
                            <span>{(article as any).photographer}</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAssignArticle(article)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                          isPlacedOnCurrent
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>पृष्ठ {activePageNum} पर जोड़ें</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL (5 Cols): Active Page Story Queue & Print Copy Overrides */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4 flex flex-col h-[700px]">
          {/* Header */}
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">सक्रिय पृष्ठ लेआउट सूची</div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>पृष्ठ {activePageNum}: {activePage?.pageTitle}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {activePage?.gridColumns || 8}-कॉलम
                </span>
              </h4>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {activePage?.elements?.length || 0} समाचार
            </span>
          </div>

          {/* Assigned Stories Queue */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {!activePage?.elements || activePage.elements.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p>इस पृष्ठ पर अभी कोई समाचार असाइन नहीं है।</p>
                <p className="text-[11px] text-slate-400">
                  बाईं ओर की सूची से समाचार का चयन कर "+ पृष्ठ {activePageNum} पर जोड़ें" दबाएं।
                </p>
              </div>
            ) : (
              activePage.elements.map((elem, idx) => (
                <div
                  key={elem.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 relative group"
                >
                  {/* Top Bar: Order buttons & Role Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveElement(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                        title="ऊपर ले जाएं"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveElement(idx, 'DOWN')}
                        disabled={idx === (activePage.elements?.length || 0) - 1}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                        title="नीचे ले जाएं"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-500 ml-1">#{idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={elem.role || 'LEAD'}
                        onChange={(e) => handleUpdateElementRole(elem.id, e.target.value)}
                        className="text-[11px] font-bold px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="LEAD">मुख्य लीड (8 Col)</option>
                        <option value="SECOND_LEAD">द्वितीय लीड (4 Col)</option>
                        <option value="ANCHOR">एंकर स्टोरी (Bottom)</option>
                        <option value="BRIEF">संक्षिप्त समाचार (2 Col)</option>
                        <option value="OPINION">विचार / कॉलम</option>
                      </select>

                      <button
                        onClick={() => handleRemoveElement(elem.id)}
                        className="p-1 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                        title="पृष्ठ से हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Print Headline Override Input */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      प्रिंट शीर्षक संशोधन (Print Headline Override):
                    </label>
                    <input
                      type="text"
                      value={elem.customHeadline || ''}
                      onChange={(e) => handleUpdateElementText(elem.id, 'customHeadline', e.target.value)}
                      className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900"
                    />
                  </div>

                  {/* Byline Override Input */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        बायलाइन क्रेडिट (Byline):
                      </label>
                      <input
                        type="text"
                        value={elem.byline || ''}
                        onChange={(e) => handleUpdateElementText(elem.id, 'byline', e.target.value)}
                        placeholder="उदा. विशेष प्रतिनिधि"
                        className="w-full text-[11px] px-2 py-1 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        कॉलम विस्तार (Columns):
                      </label>
                      <span className="text-[11px] font-bold px-2 py-1 bg-slate-200 text-slate-700 rounded-lg block text-center">
                        {elem.colSpan || 4} Columns
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Immutability Guarantee Notice */}
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>स्रोत सुरक्षा गारंटी (Source Article Immutability)</span>
            </div>
            <p className="leading-tight">
              मूल वेब समाचार अपरिवर्तनीय है। यहां किए गए शीर्षक या बायलाइन संशोधन केवल ई-पेपर प्रिंट लेआउट
              में सुरक्षित होते हैं; मुख्य समाचार डेटाबेस (newsArticles) में कोई बदलाव नहीं होता।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
