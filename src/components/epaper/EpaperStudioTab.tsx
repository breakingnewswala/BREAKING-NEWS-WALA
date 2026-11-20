import React, { useState, useEffect, useMemo } from 'react';
import {
  EpaperEditionDoc,
  EpaperEditionStatus,
  DivisionItem,
  DistrictItem,
  ArticleDetail,
  AppRole,
} from '../../types';
import {
  Newspaper,
  Calendar,
  Grid,
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layers,
  MapPin,
  Sparkles,
  Layout,
  Megaphone,
  UserCheck,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { DIVISIONS, DISTRICTS } from '../../data/mockNewsData';
import { EpaperEditionGrid } from './EpaperEditionGrid';
import { EpaperEditionCalendar } from './EpaperEditionCalendar';
import { EpaperCreationWizardModal } from './EpaperCreationWizardModal';
import { EpaperNewsSelectionDesk } from './EpaperNewsSelectionDesk';
import { EpaperTemplateManager } from './EpaperTemplateManager';
import { EpaperAdManager } from './EpaperAdManager';
import { EpaperReporterWorkspace } from './EpaperReporterWorkspace';
import { EpaperWhatsAppStudio } from './EpaperWhatsAppStudio';
import { EpaperAiNewsroomDesk } from './EpaperAiNewsroomDesk';
import { EpaperQualityDashboard } from './EpaperQualityDashboard';
import { EpaperDesignerModal } from '../../screens/EpaperDesignerModal';

export interface EpaperStudioTabProps {
  districts?: DistrictItem[];
  divisions?: DivisionItem[];
  articles: ArticleDetail[];
  pendingArticles?: ArticleDetail[];
  currentRole?: AppRole | string;
  initialAction?: 'create' | 'drafts' | 'published' | 'templates' | 'archive';
  onOpenDesigner?: (editionId: string, pageNumber: number) => void;
}

export const EpaperStudioTab: React.FC<EpaperStudioTabProps> = ({
  districts = DISTRICTS,
  divisions = DIVISIONS,
  articles,
  pendingArticles = [],
  currentRole = 'ADMIN',
  initialAction,
  onOpenDesigner,
}) => {
  const [editions, setEditions] = useState<EpaperEditionDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubView, setActiveSubView] = useState<'grid' | 'calendar' | 'news_desk' | 'templates' | 'ads' | 'reporter_workspace' | 'whatsapp_studio' | 'ai_newsroom' | 'quality_checker'>('grid');
  const [selectedEdition, setSelectedEdition] = useState<EpaperEditionDoc | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // Modals & Feedback
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [designerOpen, setDesignerOpen] = useState<boolean>(false);
  const [activeDesignerEditionId, setActiveDesignerEditionId] = useState<string | null>(null);
  const [activeDesignerPageNum, setActiveDesignerPageNum] = useState<number>(1);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle external navigation action signals
  useEffect(() => {
    if (initialAction === 'create') {
      setShowWizard(true);
    } else if (initialAction === 'drafts') {
      setSelectedStatus('DRAFT');
      setActiveSubView('grid');
    } else if (initialAction === 'published') {
      setSelectedStatus('PUBLISHED');
      setActiveSubView('grid');
    } else if (initialAction === 'templates') {
      setActiveSubView('templates');
    } else if (initialAction === 'archive') {
      setSelectedStatus('ARCHIVED');
      setActiveSubView('grid');
    }
  }, [initialAction]);

  const handleOpenDesigner = (editionId: string, pageNumber: number = 1) => {
    setActiveDesignerEditionId(editionId);
    setActiveDesignerPageNum(pageNumber);
    setDesignerOpen(true);
    if (onOpenDesigner) {
      onOpenDesigner(editionId, pageNumber);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load editions from backend
  const loadEditions = async () => {
    setLoading(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      const res = await apiClient.epaper.getEditions({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        divisionId: selectedDivision !== 'all' ? selectedDivision : undefined,
        districtId: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        date: selectedDate || undefined,
        search: searchQuery || undefined,
      });
      if (res && Array.isArray(res.editions)) {
        setEditions(res.editions);
      } else if (res && Array.isArray(res.items)) {
        setEditions(res.items);
      }
    } catch {
      // In local dev without backend, keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEditions();
  }, [selectedStatus, selectedDivision, selectedDistrict, selectedDate]);

  // Dynamic cascading districts
  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'all') return districts;
    return districts.filter((d) => d.divisionId === selectedDivision);
  }, [districts, selectedDivision]);

  // Client-side search & filtering
  const filteredEditions = useMemo(() => {
    return editions.filter((ed) => {
      if (selectedStatus !== 'all' && ed.status !== selectedStatus) return false;
      if (selectedDivision !== 'all' && ed.divisionId && ed.divisionId !== selectedDivision) return false;
      if (selectedDistrict !== 'all' && ed.districtId && ed.districtId !== selectedDistrict) return false;
      if (selectedDate && ed.publicationDate !== selectedDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ed.title?.toLowerCase().includes(q);
        const matchesCode = ed.editionCode?.toLowerCase().includes(q);
        const matchesDistrict = ed.districtName?.toLowerCase().includes(q);
        return matchesTitle || matchesCode || matchesDistrict;
      }
      return true;
    });
  }, [editions, selectedStatus, selectedDivision, selectedDistrict, selectedDate, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = editions.length;
    const published = editions.filter((e) => e.status === 'PUBLISHED').length;
    const draft = editions.filter((e) => e.status === 'DRAFT').length;
    const review = editions.filter((e) => ['EDITORIAL_REVIEW', 'LAYOUT_IN_PROGRESS', 'QUALITY_CHECK'].includes(e.status)).length;
    const archived = editions.filter((e) => e.status === 'ARCHIVED').length;
    const totalPages = editions.reduce((acc, e) => acc + (e.totalPages || 12), 0);
    return { total, published, draft, review, archived, totalPages };
  }, [editions]);

  const handleCreated = (newEdition: EpaperEditionDoc) => {
    setEditions((prev) => [newEdition, ...prev]);
    showNotification(`नया संस्करण "${newEdition.title}" सफलतापूर्वक निर्मित हुआ!`);
    setSelectedEdition(newEdition);
    setActiveSubView('news_desk');
  };

  const handleDeleteEdition = async (editionId: string) => {
    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.epaper.deleteEdition(editionId);
      setEditions((prev) => prev.filter((e) => e.id !== editionId));
      showNotification('संस्करण सफलतापूर्वक हटाया गया।');
    } catch (err: any) {
      showNotification(err.message || 'संस्करण हटाने में त्रुटि हुई।', 'error');
    }
  };

  const handleStatusChange = async (edition: EpaperEditionDoc, nextStatus: EpaperEditionStatus) => {
    try {
      const { apiClient } = await import('../../services/apiClient');
      const updated = await apiClient.epaper.updateEditionStatus(edition.id, nextStatus, edition.version);
      setEditions((prev) => prev.map((e) => (e.id === edition.id ? updated : e)));
      showNotification(`संस्करण स्थिति परिवर्तित: ${nextStatus}`);
    } catch (err: any) {
      showNotification(err.message || 'स्थिति अद्यतन विफल रहा', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Header Banner & Master Admin Entry Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold tracking-wider uppercase mb-1">
            <Newspaper className="w-4 h-4" />
            <span>ई-पेपर प्रबंधन प्रणाली (E-PAPER MANAGEMENT)</span>
          </div>
          <h2 className="text-xl font-bold text-white">डिजिटल समाचार पत्र एवं ब्रॉडशीट प्रकाशन केंद्र</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            मध्य प्रदेश के 55 जिलों एवं 10 संभागों हेतु 12-पृष्ठीय ब्रॉडशीट समाचार पत्र निर्माण, संपादकीय चयन डेस्क एवं स्वचालित लेआउट।
          </p>

          {/* Master Admin Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-bold">
            <button
              onClick={() => {
                setSelectedStatus('DRAFT');
                setActiveSubView('grid');
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedStatus === 'DRAFT' && activeSubView === 'grid'
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
              }`}
            >
              <span>1. प्रारूप संस्करण ({metrics.draft})</span>
            </button>
            <button
              onClick={() => {
                setSelectedStatus('PUBLISHED');
                setActiveSubView('grid');
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedStatus === 'PUBLISHED' && activeSubView === 'grid'
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
              }`}
            >
              <span>2. प्रकाशित संस्करण ({metrics.published})</span>
            </button>
            <button
              onClick={() => setActiveSubView('templates')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                activeSubView === 'templates'
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
              }`}
            >
              <span>3. टेम्पलेट लाइब्रेरी</span>
            </button>
            <button
              onClick={() => {
                setSelectedStatus('ARCHIVED');
                setActiveSubView('grid');
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedStatus === 'ARCHIVED' && activeSubView === 'grid'
                  ? 'bg-amber-600 border-amber-400 text-white'
                  : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
              }`}
            >
              <span>4. संस्करण अभिलेखागार ({metrics.archived})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadEditions()}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="डेटा पुनः लोड करें"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg hover:shadow-red-900/50 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>+ नया ई-पेपर बनाएँ (Create New E-Paper)</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">कुल संस्करण</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{metrics.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="text-[11px] text-emerald-600 font-medium">प्रकाशित (Live)</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{metrics.published}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="text-[11px] text-amber-600 font-medium">संपादकीय समीक्षा</div>
          <div className="text-lg font-bold text-amber-700 mt-0.5">{metrics.review}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="text-[11px] text-blue-600 font-medium">प्रारूप (Draft)</div>
          <div className="text-lg font-bold text-blue-700 mt-0.5">{metrics.draft}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">अभिलेखागार (Archived)</div>
          <div className="text-lg font-bold text-slate-700 mt-0.5">{metrics.archived}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="text-[11px] text-indigo-600 font-medium">प्रबंधित पृष्ठ</div>
          <div className="text-lg font-bold text-indigo-700 mt-0.5">{metrics.totalPages}</div>
        </div>
      </div>

      {/* Main Workspace Navigation & Filter Bar */}
      {activeSubView === 'news_desk' && selectedEdition ? (
        <EpaperNewsSelectionDesk
          edition={selectedEdition}
          articles={articles}
          onBack={() => {
            setActiveSubView('grid');
            loadEditions();
          }}
          onPageUpdated={() => {
            // refresh
          }}
          onOpenDesigner={handleOpenDesigner}
        />
      ) : (
        <div className="space-y-4">
          {/* Sub-View Switcher & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Sub-view switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveSubView('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeSubView === 'grid'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>संस्करण ग्रिड (Grid)</span>
                </button>
                <button
                  onClick={() => setActiveSubView('calendar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeSubView === 'calendar'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>प्रकाशन कैलेंडर (Calendar)</span>
                </button>
                <button
                  onClick={() => setActiveSubView('templates')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeSubView === 'templates'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>टेम्पलेट प्रबंधक (Templates)</span>
                </button>
                <button
                  onClick={() => setActiveSubView('ads')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeSubView === 'ads'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>विज्ञापन एवं क्लासिफाइड (Ads)</span>
                </button>
                <button
                  onClick={() => setActiveSubView('reporter_workspace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeSubView === 'reporter_workspace'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>संवाददाता कार्यक्षेत्र (Workspace)</span>
                </button>
                <button
                  onClick={() => setActiveSubView('whatsapp_studio')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeSubView === 'whatsapp_studio'
                      ? 'bg-white text-teal-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>व्हाट्सएप स्टूडियो (WhatsApp)</span>
                </button>
                <button
                  onClick={() => setActiveSubView('ai_newsroom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeSubView === 'ai_newsroom'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>एआई न्यूज़रूम (AI Studio)</span>
                </button>
                <button
                  onClick={() => setActiveSubView('quality_checker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeSubView === 'quality_checker'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>गुणवत्ता एवं प्रकाशन (Quality & Publish)</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="शीर्षक, कोड अथवा जिला खोजें..."
                  className="w-full text-xs px-3 py-1.5 pl-8 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>
            </div>

            {/* Cascading Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              {/* Division Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">संभाग (Division)</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => {
                    setSelectedDivision(e.target.value);
                    setSelectedDistrict('all');
                  }}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">सभी संभाग (10 संभाग)</option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.nameHi || div.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">जिला (District)</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">सभी जिले ({availableDistricts.length} जिले)</option>
                  {availableDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameHi || d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">स्थिति (Status)</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">सभी स्थितियां</option>
                  <option value="DRAFT">प्रारूप (Draft)</option>
                  <option value="EDITORIAL_REVIEW">संपादकीय समीक्षा (Review)</option>
                  <option value="LAYOUT_IN_PROGRESS">लेआउट प्रगति पर (Layout)</option>
                  <option value="QUALITY_CHECK">गुणवत्ता जांच (QC)</option>
                  <option value="APPROVED">स्वीकृत (Approved)</option>
                  <option value="PUBLISHED">प्रकाशित (Published)</option>
                  <option value="ARCHIVED">अभिलेखागार (Archived)</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">तिथि (Date)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate('')}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1"
                      title="तिथि फ़िल्टर हटाएं"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-view Rendering */}
          {activeSubView === 'grid' && (
            <EpaperEditionGrid
              editions={filteredEditions}
              onOpenNewsDesk={(ed) => {
                setSelectedEdition(ed);
                setActiveSubView('news_desk');
              }}
              onOpenDesigner={handleOpenDesigner}
              onOpenQualityChecker={(ed) => {
                setSelectedEdition(ed);
                setActiveSubView('quality_checker');
              }}
              onDeleteEdition={handleDeleteEdition}
              onStatusChange={handleStatusChange}
              onCreateNew={() => setShowWizard(true)}
              currentRole={currentRole}
              loading={loading}
            />
          )}

          {activeSubView === 'calendar' && (
            <EpaperEditionCalendar
              editions={editions}
              selectedDate={selectedDate || new Date().toISOString().split('T')[0]}
              onSelectDate={(date) => setSelectedDate(date)}
              onOpenNewsDesk={(ed) => {
                setSelectedEdition(ed);
                setActiveSubView('news_desk');
              }}
            />
          )}

          {activeSubView === 'templates' && (
            <EpaperTemplateManager
              onApplyTemplate={(tpl) => {
                if (selectedEdition) {
                  handleOpenDesigner(selectedEdition.id, tpl.pageNumberDefault || 1);
                } else if (editions.length > 0) {
                  handleOpenDesigner(editions[0].id, tpl.pageNumberDefault || 1);
                }
              }}
            />
          )}

          {activeSubView === 'ads' && (
            <EpaperAdManager
              editions={editions}
              onPlaceAdOnPage={(ad, editionId, pageNumber) => {
                handleOpenDesigner(editionId, pageNumber);
              }}
            />
          )}

          {activeSubView === 'reporter_workspace' && (
            <EpaperReporterWorkspace
              currentRole={currentRole}
              onOpenReader={(edId, pageNum) => {
                handleOpenDesigner(edId, pageNum);
              }}
              categories={[]}
              districts={districts}
            />
          )}

          {activeSubView === 'whatsapp_studio' && (
            <EpaperWhatsAppStudio isAdminMode={true} />
          )}

          {activeSubView === 'ai_newsroom' && (
            <EpaperAiNewsroomDesk
              articles={articles}
              editions={editions}
              currentRole={currentRole}
              onOpenDesigner={handleOpenDesigner}
            />
          )}

          {activeSubView === 'quality_checker' && (
            <EpaperQualityDashboard
              edition={selectedEdition}
              editions={editions}
              currentRole={currentRole}
              onOpenDesigner={handleOpenDesigner}
              onBack={() => {
                setActiveSubView('grid');
                loadEditions();
              }}
              onEditionUpdated={(updated) => {
                setSelectedEdition(updated);
                loadEditions();
              }}
            />
          )}
        </div>
      )}

      {/* Creation Wizard Modal */}
      <EpaperCreationWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={handleCreated}
        divisions={divisions}
        districts={districts}
      />

      {/* 3-Panel Page Designer Modal */}
      {designerOpen && activeDesignerEditionId && (
        <EpaperDesignerModal
          isOpen={designerOpen}
          editionId={activeDesignerEditionId}
          initialPageNumber={activeDesignerPageNum}
          articles={articles}
          onClose={() => setDesignerOpen(false)}
          onPageSaved={() => {
            loadEditions();
          }}
          currentRole={currentRole}
        />
      )}
    </div>
  );
};
