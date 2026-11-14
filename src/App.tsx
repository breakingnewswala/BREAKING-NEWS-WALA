import React, { useState, useEffect } from 'react';
import {
  AppRole,
  ArticleDetail,
  ArticleItem,
  ArticlePriority,
  CreateDraftRequest,
  ReporterProfile,
  BreakingTickerItem,
  AdBannerItem,
  ApiPoolKeyItem,
  SystemAuditLogItem,
} from './types';
import {
  CATEGORIES,
  DISTRICTS,
  DIVISIONS,
  EPAPER_EDITIONS,
  INITIAL_ARTICLES,
  INITIAL_PENDING_STORIES,
  MOCK_REPORTERS,
  MOCK_ADS,
  MOCK_API_POOL,
  MOCK_AUDIT_LOGS,
  MOCK_TICKERS,
} from './data/mockNewsData';
import { BnwMasthead } from './components/BnwMasthead';
import { BottomNav, NavTab } from './components/BottomNav';
import { NavDrawer } from './components/NavDrawer';
import { Footer } from './components/Footer';
import { HomeScreen } from './screens/HomeScreen';
import { ArticleDetailScreen } from './screens/ArticleDetailScreen';

// Performance Optimization (ME-027): Code-splitting heavy operational and studio surfaces
const EpaperScreen = React.lazy(() => import('./screens/EpaperScreen').then((m) => ({ default: m.EpaperScreen })));
const ReporterDeskScreen = React.lazy(() => import('./screens/ReporterDeskScreen').then((m) => ({ default: m.ReporterDeskScreen })));
const NewsroomDeskScreen = React.lazy(() => import('./screens/NewsroomDeskScreen').then((m) => ({ default: m.NewsroomDeskScreen })));
const AdminControlScreen = React.lazy(() => import('./screens/AdminControlScreen').then((m) => ({ default: m.AdminControlScreen })));
const SearchScreen = React.lazy(() => import('./screens/SearchScreen').then((m) => ({ default: m.SearchScreen })));
const ProfileScreen = React.lazy(() => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })));
const GraphicsStudioScreen = React.lazy(() => import('./screens/GraphicsStudioScreen').then((m) => ({ default: m.GraphicsStudioScreen })));
const VideoStudioScreen = React.lazy(() => import('./screens/VideoStudioScreen').then((m) => ({ default: m.VideoStudioScreen })));
const AiNewsroomScreen = React.lazy(() => import('./screens/AiNewsroomScreen').then((m) => ({ default: m.AiNewsroomScreen })));
import { Radio, X } from 'lucide-react';
import { apiClient } from './services/apiClient';

export const App: React.FC = () => {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // App Role Persona
  const [currentRole, setCurrentRole] = useState<AppRole>('ADMIN');

  // Filter signals from Drawer Menu to Home
  const [initialCategoryFilter, setInitialCategoryFilter] = useState<string | null>(null);
  const [initialDistrictFilter, setInitialDistrictFilter] = useState<string | null>(null);

  // News State
  const [articles, setArticles] = useState<ArticleDetail[]>(INITIAL_ARTICLES);
  const [pendingStories, setPendingStories] = useState<ArticleDetail[]>(INITIAL_PENDING_STORIES);
  const [reporterDrafts, setReporterDrafts] = useState<ArticleDetail[]>(INITIAL_PENDING_STORIES);

  // Operational Surface States
  const [reporters, setReporters] = useState<ReporterProfile[]>(MOCK_REPORTERS);
  const [ads, setAds] = useState<AdBannerItem[]>(MOCK_ADS);
  const [tickers, setTickers] = useState<BreakingTickerItem[]>(MOCK_TICKERS);
  const [apiPool, setApiPool] = useState<ApiPoolKeyItem[]>(MOCK_API_POOL);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogItem[]>(MOCK_AUDIT_LOGS);

  // User engagement
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['art-1', 'art-3']);
  const [userCoins, setUserCoins] = useState<number>(45);

  // Active Statewide Alert
  const [activeAlert, setActiveAlert] = useState<{ title: string; district: string } | null>({
    title: 'मौसम विभाग: ग्वालियर-चंबल एवं विंध्य अंचल में अगले 24 घंटे गरज-चमक के साथ यलो अलर्ट जारी।',
    district: 'पूरा मध्य प्रदेश',
  });

  // URL Hash Synchronizer for direct surface deep-linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const pathname = window.location.pathname.replace('/', '').toLowerCase();
      const target = hash || pathname;

      if (target === 'reporter' || target === 'newsroom' || target === 'admin' || target === 'epaper' || target === 'search' || target === 'profile') {
        setSelectedArticleId(null);
        setActiveTab(target as NavTab);
      } else if (target === 'home' || target === '') {
        setSelectedArticleId(null);
        setActiveTab('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Shared Backend Server Data Synchronizer (Section 7, STEP E)
  useEffect(() => {
    let isMounted = true;
    async function syncSharedBackend() {
      try {
        const [pubArticlesRes, queueRes, tickersRes, adsRes, reportersRes, logsRes] = await Promise.all([
          apiClient.publicNews.fetchArticles({ status: 'PUBLISHED' }),
          apiClient.newsroom.fetchIncomingQueue(),
          apiClient.admin.fetchTickers(),
          apiClient.admin.fetchAds(),
          apiClient.admin.fetchReporters(),
          apiClient.admin.fetchAuditLogs(),
        ]);

        if (!isMounted) return;
        if (pubArticlesRes.items && pubArticlesRes.items.length > 0) {
          setArticles(pubArticlesRes.items);
        }
        if (queueRes && queueRes.length > 0) {
          setPendingStories(queueRes);
          setReporterDrafts(queueRes);
        }
        if (tickersRes && tickersRes.length > 0) {
          setTickers(tickersRes);
        }
        if (adsRes && adsRes.length > 0) {
          setAds(adsRes);
        }
        if (reportersRes && reportersRes.length > 0) {
          setReporters(reportersRes);
        }
        if (logsRes && logsRes.length > 0) {
          setAuditLogs(logsRes);
        }
      } catch (err) {
        console.warn('[BNW Shared Backend Sync] Using initial offline state:', err);
      }
    }
    syncSharedBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const navigateToTab = (tab: NavTab) => {
    setSelectedArticleId(null);
    setActiveTab(tab);
    window.location.hash = tab === 'home' ? '' : tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Coin earning helper
  const handleEarnCoins = (amount: number) => {
    setUserCoins((prev) => prev + amount);
  };

  // Toggle bookmark
  const handleBookmarkToggle = (articleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
  };

  // Share article helper
  const handleShareArticle = (article: ArticleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareText = `*${article.title}*\n\nपूरी खबर पढ़ें 'ब्रेकिंग न्यूज़ वाला' पर:\nhttps://breakingnewswala.com/article/${article.slug}`;
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: shareText,
        url: window.location.href,
      }).catch(() => { });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  // Article Click
  const handleArticleClick = (articleId: string) => {
    setSelectedArticleId(articleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Reporter Draft (Section 7, STEP A)
  const handleSubmitReporterDraft = async (draftReq: CreateDraftRequest, reporter?: ReporterProfile) => {
    const authorId = reporter?.id || 'rep-001';
    const authorName = reporter?.name || 'राजेश पटेल';
    const authorRole = reporter?.role === 'trusted_reporter' ? 'वरिष्ठ संवाददाता' : 'फील्ड संवाददाता';

    try {
      // 1. Submit through Server API Engine
      const draft = await apiClient.reporter.createDraft(draftReq, {
        id: authorId,
        name: authorName,
        role: authorRole,
      });
      const submitted = await apiClient.reporter.submitStory(draft.id);

      setPendingStories((prev) => [submitted, ...prev.filter((p) => p.id !== submitted.id)]);
      setReporterDrafts((prev) => [submitted, ...prev.filter((d) => d.id !== submitted.id)]);

      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch (err: any) {
      console.warn('[Reporter Submit] Local fallback:', err?.message);
      const newId = `draft-${Date.now()}`;
      const dist = DISTRICTS.find((d) => d.id === draftReq.districtId);
      const cat = CATEGORIES.find((c) => c.id === draftReq.categoryId);
      const newDraft: ArticleDetail = {
        id: newId,
        slug: `draft-${newId}`,
        title: draftReq.title,
        summary: draftReq.summary || draftReq.content.slice(0, 150),
        content: draftReq.content,
        status: 'PENDING_REVIEW',
        featuredImage: draftReq.featuredImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
        imageCaption: draftReq.imageCaption,
        imageAttribution: draftReq.imageAttribution || `${authorName} (${reporter?.badgeNumber || 'BNW'})`,
        categoryId: draftReq.categoryId,
        categoryName: cat?.nameHi || 'मध्य प्रदेश',
        districtId: draftReq.districtId,
        districtName: dist?.nameHi || 'भोपाल',
        authorId,
        authorName,
        authorRole,
        isBreaking: draftReq.isBreaking,
        viewCount: 0,
        shareCount: 0,
        createdAt: 'अभी-अभी दर्ज किया गया',
        factChecked: false,
      };
      setPendingStories((prev) => [newDraft, ...prev]);
      setReporterDrafts((prev) => [newDraft, ...prev]);
    }
  };

  // Newsroom / Admin Approve and Publish (Section 7, STEP B & C)
  const handleApproveAndPublish = async (
    articleId: string,
    updatedTitle?: string,
    updatedContent?: string
  ) => {
    const target = pendingStories.find((a) => a.id === articleId) || reporterDrafts.find((d) => d.id === articleId);

    try {
      // 1. Submit through Server API Engine
      const published = await apiClient.newsroom.reviewStory(articleId, {
        action: 'approve',
        updatedTitle,
        updatedContent,
      });

      setArticles((prev) => [published, ...prev.filter((a) => a.id !== articleId)]);
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? { ...d, status: 'PUBLISHED' } : d))
      );

      if (published.isBreaking) {
        setActiveAlert({
          title: published.title,
          district: published.districtName || 'मध्य प्रदेश',
        });
      }

      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch (err: any) {
      console.warn('[Newsroom Publish] Local fallback:', err?.message);
      if (!target) return;
      const publishedArticle: ArticleDetail = {
        ...target,
        title: updatedTitle || target.title,
        content: updatedContent || target.content,
        status: 'PUBLISHED',
        publishedAt: 'अभी-अभी लाइव',
        factChecked: true,
        factCheckScore: 98,
      };

      setArticles((prev) => [publishedArticle, ...prev.filter((a) => a.id !== articleId)]);
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? { ...d, status: 'PUBLISHED' } : d))
      );
      if (target.isBreaking) {
        setActiveAlert({
          title: updatedTitle || target.title,
          district: target.districtName || 'मध्य प्रदेश',
        });
      }
    }
  };

  // Request Revision
  const handleRequestRevision = async (articleId: string, comments: string) => {
    try {
      const revised = await apiClient.newsroom.reviewStory(articleId, {
        action: 'request_changes',
        notes: comments,
        feedbackComments: comments,
      });
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? revised : d))
      );
      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch {
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) =>
          d.id === articleId
            ? { ...d, status: 'REVISION_REQUESTED', summary: `संशोधन अपेक्षित: ${comments}` }
            : d
        )
      );
    }
  };

  // Reject Article
  const handleRejectArticle = async (articleId: string, reason = 'संपादकीय नीति के अनुरूप नहीं।') => {
    try {
      const rejected = await apiClient.newsroom.reviewStory(articleId, {
        action: 'reject',
        reasonCode: 'EDITORIAL_POLICY_VIOLATION',
        feedbackComments: reason,
      });
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? rejected : d))
      );
      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch {
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? { ...d, status: 'REJECTED' } : d))
      );
    }
  };

  // Advanced Newsroom 020: Claim Article
  const handleClaimArticle = async (articleId: string, editorId: string, editorName: string) => {
    try {
      const updated = await apiClient.newsroom.reviewStory(articleId, {
        action: 'claim',
        assignedEditorId: editorId,
        assignedEditorName: editorName,
      });
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
    } catch {
      setPendingStories((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, claimedBy: editorName, assignedEditorName: editorName } : a))
      );
    }
  };

  // Advanced Newsroom 020: Reassign Story
  const handleReassignArticle = async (articleId: string, editorId: string, editorName: string) => {
    try {
      const updated = await apiClient.newsroom.reassignStory(articleId, editorId, editorName);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
    } catch {
      setPendingStories((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, assignedEditorId: editorId, assignedEditorName: editorName } : a))
      );
    }
  };

  // Advanced Newsroom 020: Update Priority
  const handleUpdatePriority = async (articleId: string, priority: ArticlePriority) => {
    try {
      const updated = await apiClient.newsroom.updatePriority(articleId, priority);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, priority } : a)));
    } catch {
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? { ...a, priority } : a)));
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, priority } : a)));
    }
  };

  // Advanced Newsroom 020: Toggle Breaking
  const handleToggleBreaking = async (articleId: string, isBreaking: boolean) => {
    try {
      const updated = await apiClient.newsroom.toggleBreaking(articleId, isBreaking);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, isBreaking } : a)));
    } catch {
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? { ...a, isBreaking } : a)));
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, isBreaking } : a)));
    }
  };

  // Advanced Newsroom 020: Schedule Publication
  const handleSchedulePublication = async (articleId: string, scheduledAt: string) => {
    try {
      const updated = await apiClient.newsroom.schedulePublication(articleId, scheduledAt);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
    } catch {
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? { ...a, scheduledAt } : a)));
    }
  };

  // Advanced Newsroom 020: Save Editorial Notes
  const handleSaveEditorialNotes = async (articleId: string, notes: string) => {
    try {
      const updated = await apiClient.newsroom.addEditorialNotes(articleId, notes);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
    } catch {
      // Local fallback
    }
  };

  // Advanced Newsroom 020: Update Reporter Verification Status
  const handleUpdateReporterStatus = async (
    reporterId: string,
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TRAINEE'
  ) => {
    try {
      await apiClient.admin.updateReporterStatus(reporterId, status);
      setReporters((prev) =>
        prev.map((r) =>
          r.id === reporterId
            ? {
              ...r,
              status,
              verificationStatus: status === 'ACTIVE' ? 'VERIFIED' : status,
            }
            : r
        )
      );
    } catch {
      setReporters((prev) =>
        prev.map((r) =>
          r.id === reporterId
            ? {
              ...r,
              status,
              verificationStatus: status === 'ACTIVE' ? 'VERIFIED' : status,
            }
            : r
        )
      );
    }
  };

  // Advanced Newsroom 020: Assign Reporter Beats
  const handleAssignReporterBeats = async (reporterId: string, beats: string[]) => {
    try {
      await apiClient.admin.assignReporterBeats(reporterId, beats);
      setReporters((prev) => prev.map((r) => (r.id === reporterId ? { ...r, beats } : r)));
    } catch {
      setReporters((prev) => prev.map((r) => (r.id === reporterId ? { ...r, beats } : r)));
    }
  };

  // Broadcast Statewide Alert
  const handleBroadcastAlert = async (title: string, district: string) => {
    setActiveAlert({ title, district });
    try {
      await apiClient.admin.broadcastAlert(title, district);
      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch {
      // Local fallback
    }
  };

  // Ticker Handlers
  const handleAddTicker = async (ticker: BreakingTickerItem) => {
    setTickers((prev) => [ticker, ...prev]);
    try {
      await apiClient.admin.createTicker({
        textHindi: ticker.textHindi,
        districtName: ticker.districtName,
        priority: ticker.priority,
      });
    } catch {
      // Offline fallback
    }
  };

  const handleToggleTicker = async (tickerId: string) => {
    setTickers((prev) =>
      prev.map((t) => (t.id === tickerId ? { ...t, isActive: !t.isActive } : t))
    );
    try {
      await apiClient.admin.toggleTicker(tickerId);
    } catch {
      // Offline fallback
    }
  };

  const handleDeleteTicker = async (tickerId: string) => {
    setTickers((prev) => prev.filter((t) => t.id !== tickerId));
    try {
      await apiClient.admin.deleteTicker(tickerId);
    } catch {
      // Offline fallback
    }
  };

  // Reporter Role Upgrade Handler
  const handleUpdateReporterRole = async (
    reporterId: string,
    role: 'reporter' | 'trusted_reporter'
  ) => {
    setReporters((prev) =>
      prev.map((r) => (r.id === reporterId ? { ...r, role } : r))
    );
    try {
      await apiClient.admin.updateReporterRole(reporterId, role);
      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch {
      // Offline fallback
    }
  };

  // Ad Banner Toggle
  const handleToggleAdActive = async (adId: string) => {
    setAds((prev) =>
      prev.map((a) => (a.id === adId ? { ...a, isActive: !a.isActive } : a))
    );
    try {
      await apiClient.admin.toggleAd(adId);
    } catch {
      // Offline fallback
    }
  };

  // Resolve currently active article for detail view
  const currentDetailArticle = articles.find((a) => a.id === selectedArticleId);

  // Bookmarked articles list
  const bookmarkedArticlesList = articles.filter((a) => bookmarkedIds.includes(a.id));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Global Masthead with Menu button next to Logo */}
      <BnwMasthead
        onOpenMenu={() => setIsMenuOpen(true)}
        activeTab={activeTab}
        onTabChange={navigateToTab}
        onSearchClick={() => navigateToTab('search')}
        onProfileClick={() => navigateToTab('profile')}
        currentRole={currentRole}
        pendingQueueCount={pendingStories.length}
      />

      {/* 2. Comprehensive Navigation Menu Drawer */}
      <NavDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onTabSelect={navigateToTab}
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        userCoins={userCoins}
        bookmarkedCount={bookmarkedIds.length}
        categories={CATEGORIES}
        districts={DISTRICTS}
        divisions={DIVISIONS}
        epaperEditions={EPAPER_EDITIONS}
        onSelectCategory={(catId) => {
          setInitialCategoryFilter(catId);
          navigateToTab('home');
        }}
        onSelectDistrict={(distId) => {
          setInitialDistrictFilter(distId);
          navigateToTab('home');
        }}
      />

      {/* 3. Statewide Emergency Breaking Notice Banner if active */}
      {activeAlert && (
        <div className="bg-[#ED1727] text-white px-3 sm:px-4 py-2 flex items-center justify-between text-xs font-bold shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate pr-2">
              <Radio className="w-4 h-4 text-white animate-spin shrink-0" />
              <span className="bg-white text-red-600 px-2 py-0.5 rounded text-[10px] shrink-0 font-black">
                आपात अलर्ट [{activeAlert.district}]
              </span>
              <span className="truncate">{activeAlert.title}</span>
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="text-white hover:text-red-200 shrink-0 p-1"
              title="हटाएं"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Body Content Switcher (4 Unified Surfaces + Utilities) */}
      <main className="flex-1">
        {selectedArticleId && currentDetailArticle ? (
          <ArticleDetailScreen
            article={currentDetailArticle}
            isBookmarked={bookmarkedIds.includes(currentDetailArticle.id)}
            relatedArticles={articles.filter((a) => a.id !== currentDetailArticle.id)}
            onBackClick={() => setSelectedArticleId(null)}
            onBookmarkToggle={handleBookmarkToggle}
            onShareArticle={handleShareArticle}
            onRelatedArticleClick={handleArticleClick}
            onEarnCoins={handleEarnCoins}
          />
        ) : (
          <React.Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-600">लोड हो रहा है... / Loading...</p>
              </div>
            }
          >
            {/* Surface 1: Public News Website */}
            {activeTab === 'home' && (
              <HomeScreen
                articles={articles}
                categories={CATEGORIES}
                districts={DISTRICTS}
                bookmarkedIds={bookmarkedIds}
                userCoins={userCoins}
                onArticleClick={handleArticleClick}
                onBookmarkToggle={handleBookmarkToggle}
                onShareArticle={handleShareArticle}
                onEarnCoins={handleEarnCoins}
                onNavigateEpaper={() => navigateToTab('epaper')}
              />
            )}

            {/* Epaper */}
            {activeTab === 'epaper' && (
              <EpaperScreen
                editions={EPAPER_EDITIONS}
                onBackClick={() => navigateToTab('home')}
              />
            )}

            {/* Surface 2: Reporter Web Application */}
            {activeTab === 'reporter' && (
              <ReporterDeskScreen
                categories={CATEGORIES}
                districts={DISTRICTS}
                reporterDrafts={reporterDrafts}
                reporters={reporters}
                onSubmitDraft={handleSubmitReporterDraft}
                onBackClick={() => navigateToTab('home')}
              />
            )}

            {/* Surface 3: Central Newsroom Desk */}
            {activeTab === 'newsroom' && (
              <NewsroomDeskScreen
                pendingArticles={pendingStories}
                allArticles={articles}
                reporters={reporters}
                categories={CATEGORIES}
                districts={DISTRICTS}
                currentUser={{ id: 'usr-desk-chief', name: 'मुख्य संपादक (Desk Editor)', role: currentRole }}
                onApproveAndPublish={handleApproveAndPublish}
                onRequestRevision={handleRequestRevision}
                onRejectArticle={handleRejectArticle}
                onBroadcastBreakingAlert={handleBroadcastAlert}
                onClaimArticle={handleClaimArticle}
                onReassignArticle={handleReassignArticle}
                onUpdatePriority={handleUpdatePriority}
                onToggleBreaking={handleToggleBreaking}
                onSchedulePublication={handleSchedulePublication}
                onSaveEditorialNotes={handleSaveEditorialNotes}
                onUpdateReporterStatus={handleUpdateReporterStatus}
                onAssignReporterBeats={handleAssignReporterBeats}
              />
            )}

            {/* Surface 4: Admin Control Panel */}
            {activeTab === 'admin' && (
              <AdminControlScreen
                articles={articles}
                pendingArticles={pendingStories}
                reporters={reporters}
                tickers={tickers}
                ads={ads}
                apiPool={apiPool}
                auditLogs={auditLogs}
                districts={DISTRICTS}
                categories={CATEGORIES}
                onApproveArticle={handleApproveAndPublish}
                onRequestRevision={handleRequestRevision}
                onRejectArticle={handleRejectArticle}
                onAddTicker={handleAddTicker}
                onToggleTicker={handleToggleTicker}
                onDeleteTicker={handleDeleteTicker}
                onUpdateReporterRole={handleUpdateReporterRole}
                onToggleAdActive={handleToggleAdActive}
                onBroadcastAlert={handleBroadcastAlert}
              />
            )}

            {/* Backwards Compatibility: Desk Tab */}
            {activeTab === 'desk' && (
              <>
                {currentRole === 'ADMIN' ? (
                  <NewsroomDeskScreen
                    pendingArticles={pendingStories}
                    allArticles={articles}
                    reporters={reporters}
                    categories={CATEGORIES}
                    districts={DISTRICTS}
                    currentUser={{ id: 'usr-desk-chief', name: 'मुख्य संपादक (Desk Editor)', role: currentRole }}
                    onApproveAndPublish={handleApproveAndPublish}
                    onRequestRevision={handleRequestRevision}
                    onRejectArticle={handleRejectArticle}
                    onBroadcastBreakingAlert={handleBroadcastAlert}
                    onClaimArticle={handleClaimArticle}
                    onReassignArticle={handleReassignArticle}
                    onUpdatePriority={handleUpdatePriority}
                    onToggleBreaking={handleToggleBreaking}
                    onSchedulePublication={handleSchedulePublication}
                    onSaveEditorialNotes={handleSaveEditorialNotes}
                    onUpdateReporterStatus={handleUpdateReporterStatus}
                    onAssignReporterBeats={handleAssignReporterBeats}
                  />
                ) : (
                  <ReporterDeskScreen
                    categories={CATEGORIES}
                    districts={DISTRICTS}
                    reporterDrafts={reporterDrafts}
                    reporters={reporters}
                    onSubmitDraft={handleSubmitReporterDraft}
                    onBackClick={() => navigateToTab('home')}
                  />
                )}
              </>
            )}

            {/* Search */}
            {activeTab === 'search' && (
              <SearchScreen
                articles={articles}
                categories={CATEGORIES}
                districts={DISTRICTS}
                bookmarkedIds={bookmarkedIds}
                onArticleClick={handleArticleClick}
                onBookmarkToggle={handleBookmarkToggle}
                onShareArticle={handleShareArticle}
              />
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <ProfileScreen
                currentRole={currentRole}
                onRoleChange={(newRole) => setCurrentRole(newRole)}
                userCoins={userCoins}
                bookmarkedArticles={bookmarkedArticlesList}
                onArticleClick={handleArticleClick}
                onRemoveBookmark={(id) => handleBookmarkToggle(id)}
              />
            )}

            {/* Surface 5: Graphics & Design Studio */}
            {activeTab === 'graphics' && (
              <GraphicsStudioScreen
                currentUser={{
                  id: 'usr-desk-chief',
                  name: 'मुख्य संपादक (Desk Editor)',
                  role: currentRole,
                  roles: [currentRole],
                }}
                articles={articles}
                districts={DISTRICTS}
                categories={CATEGORIES}
                onNavigateHome={() => navigateToTab('home')}
                onNavigateDesk={() => navigateToTab('newsroom')}
              />
            )}

            {/* Surface 6: Video Production Studio */}
            {activeTab === 'videos' && (
              <VideoStudioScreen
                currentUser={{
                  id: 'usr-desk-chief',
                  name: 'मुख्य संपादक (Desk Editor)',
                  role: currentRole,
                  roles: [currentRole],
                }}
                articles={articles}
                districts={DISTRICTS}
                categories={CATEGORIES}
                onNavigateHome={() => navigateToTab('home')}
                onNavigateDesk={() => navigateToTab('newsroom')}
              />
            )}

            {/* Surface 7: AI Newsroom & Intelligent Automation */}
            {activeTab === 'ai-newsroom' && (
              <AiNewsroomScreen
                currentUser={{
                  id: 'usr-desk-chief',
                  name: 'मुख्य संपादक (Desk Editor)',
                  role: currentRole,
                  roles: [currentRole],
                }}
                articles={articles}
                districts={DISTRICTS}
                categories={CATEGORIES}
                onNavigateToArticles={() => navigateToTab('newsroom')}
              />
            )}
          </React.Suspense>
        )}
      </main>

      {/* 5. Comprehensive Editorial Footer */}
      {(activeTab === 'home' ||
        activeTab === 'epaper' ||
        activeTab === 'search' ||
        activeTab === 'profile' ||
        selectedArticleId) && (
          <Footer
            categories={CATEGORIES}
            districts={DISTRICTS}
            divisions={DIVISIONS}
            onNavigateTab={navigateToTab}
            onSelectCategory={(catId) => {
              setInitialCategoryFilter(catId);
              navigateToTab('home');
            }}
            onSelectDistrict={(distId) => {
              setInitialDistrictFilter(distId);
              navigateToTab('home');
            }}
          />
        )}

      {/* 6. Bottom Tab Navigation (Mobile & Tablet only) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={navigateToTab}
        currentRole={currentRole}
        pendingQueueCount={pendingStories.length}
      />
    </div>
  );
};
