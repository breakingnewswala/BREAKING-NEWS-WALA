import React, { useState, useEffect } from 'react';
import {
  AppRole,
  ArticleDetail,
  ArticleItem,
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
import { EpaperScreen } from './screens/EpaperScreen';
import { ReporterDeskScreen } from './screens/ReporterDeskScreen';
import { NewsroomDeskScreen } from './screens/NewsroomDeskScreen';
import { AdminControlScreen } from './screens/AdminControlScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { Radio, X } from 'lucide-react';

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
      }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  // Article Click
  const handleArticleClick = (articleId: string) => {
    setSelectedArticleId(articleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Reporter Draft
  const handleSubmitReporterDraft = (draftReq: CreateDraftRequest, reporter?: ReporterProfile) => {
    const newId = `draft-${Date.now()}`;
    const dist = DISTRICTS.find((d) => d.id === draftReq.districtId);
    const cat = CATEGORIES.find((c) => c.id === draftReq.categoryId);
    const authorId = reporter?.id || 'rep-active';
    const authorName = reporter?.name || 'राजेश पटेल';
    const authorRole = reporter?.role === 'trusted_reporter' ? 'वरिष्ठ संवाददाता' : 'फील्ड संवाददाता';

    const newDraft: ArticleDetail = {
      id: newId,
      slug: `draft-${newId}`,
      title: draftReq.title,
      summary: draftReq.summary || draftReq.content.slice(0, 150),
      content: draftReq.content,
      status: 'PENDING_REVIEW',
      featuredImage:
        draftReq.featuredImage ||
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
      imageCaption: draftReq.imageCaption,
      imageAttribution: draftReq.imageAttribution || (reporter ? `${reporter.name} (${reporter.badgeNumber})` : 'बीएनडब्ल्यू फील्ड संवाददाता'),
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

    // Add Audit Log
    const newLog: SystemAuditLogItem = {
      id: `log-${Date.now()}`,
      actorName: authorName,
      actorRole: 'REPORTER',
      actionType: 'ARTICLE_PUBLISHED',
      description: `नई खबर दर्ज की गई (${reporter?.badgeNumber || 'REP'}): "${draftReq.title.slice(0, 50)}..."`,
      ipAddress: '49.36.128.91',
      timestamp: new Date().toLocaleString('hi-IN'),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Newsroom / Admin Approve and Publish (with desk sub-editing!)
  const handleApproveAndPublish = (
    articleId: string,
    updatedTitle?: string,
    updatedContent?: string
  ) => {
    const target = pendingStories.find((a) => a.id === articleId);
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

    setArticles((prev) => [publishedArticle, ...prev]);
    setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
    setReporterDrafts((prev) =>
      prev.map((d) => (d.id === articleId ? { ...d, status: 'PUBLISHED' } : d))
    );

    // If marked breaking, set alert
    if (target.isBreaking) {
      setActiveAlert({
        title: updatedTitle || target.title,
        district: target.districtName || 'मध्य प्रदेश',
      });
    }

    // Add Audit Log
    const newLog: SystemAuditLogItem = {
      id: `log-${Date.now()}`,
      actorName: 'मुख्य संपादक डेस्क',
      actorRole: 'ADMIN',
      actionType: 'ARTICLE_PUBLISHED',
      description: `खबर स्वीकृत व लाइव प्रकाशित: "${(updatedTitle || target.title).slice(0, 50)}..."`,
      ipAddress: '103.24.112.5',
      timestamp: new Date().toLocaleString('hi-IN'),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Request Revision
  const handleRequestRevision = (articleId: string, comments: string) => {
    setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
    setReporterDrafts((prev) =>
      prev.map((d) =>
        d.id === articleId
          ? { ...d, status: 'REVISION_REQUESTED', summary: `संशोधन अपेक्षित: ${comments}` }
          : d
      )
    );

    const newLog: SystemAuditLogItem = {
      id: `log-${Date.now()}`,
      actorName: 'मुख्य संपादक डेस्क',
      actorRole: 'ADMIN',
      actionType: 'REVISION_REQUESTED',
      description: `संशोधन अनुरोध भेजा गया (${articleId}): ${comments}`,
      ipAddress: '103.24.112.5',
      timestamp: new Date().toLocaleString('hi-IN'),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Reject Article
  const handleRejectArticle = (articleId: string) => {
    setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
    setReporterDrafts((prev) =>
      prev.map((d) => (d.id === articleId ? { ...d, status: 'REJECTED' } : d))
    );

    const newLog: SystemAuditLogItem = {
      id: `log-${Date.now()}`,
      actorName: 'मुख्य संपादक डेस्क',
      actorRole: 'ADMIN',
      actionType: 'ARTICLE_REJECTED',
      description: `खबर अस्वीकृत की गई: ${articleId}`,
      ipAddress: '103.24.112.5',
      timestamp: new Date().toLocaleString('hi-IN'),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Broadcast Statewide Alert
  const handleBroadcastAlert = (title: string, district: string) => {
    setActiveAlert({ title, district });
    const newLog: SystemAuditLogItem = {
      id: `log-${Date.now()}`,
      actorName: 'एडमिन कंट्रोल',
      actorRole: 'ADMIN',
      actionType: 'ALERT_BROADCAST',
      description: `राज्यव्यापी अलर्ट [${district}]: ${title}`,
      ipAddress: '103.24.112.5',
      timestamp: new Date().toLocaleString('hi-IN'),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Ticker Handlers
  const handleAddTicker = (ticker: BreakingTickerItem) => {
    setTickers((prev) => [ticker, ...prev]);
  };

  const handleToggleTicker = (tickerId: string) => {
    setTickers((prev) =>
      prev.map((t) => (t.id === tickerId ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const handleDeleteTicker = (tickerId: string) => {
    setTickers((prev) => prev.filter((t) => t.id !== tickerId));
  };

  // Reporter Role Upgrade / Revision Handler
  const handleUpdateReporterRole = (
    reporterId: string,
    role: 'reporter' | 'trusted_reporter'
  ) => {
    setReporters((prev) =>
      prev.map((r) => (r.id === reporterId ? { ...r, role } : r))
    );
    const newLog: SystemAuditLogItem = {
      id: `log-${Date.now()}`,
      actorName: 'एडमिन कंट्रोल',
      actorRole: 'ADMIN',
      actionType: 'ROLE_CHANGED',
      description: `संवाददाता (${reporterId}) की भूमिका परिवर्तित: ${role}`,
      ipAddress: '103.24.112.5',
      timestamp: new Date().toLocaleString('hi-IN'),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Ad Banner Toggle
  const handleToggleAdActive = (adId: string) => {
    setAds((prev) =>
      prev.map((a) => (a.id === adId ? { ...a, isActive: !a.isActive } : a))
    );
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
          <>
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
                onApproveAndPublish={handleApproveAndPublish}
                onRequestRevision={handleRequestRevision}
                onRejectArticle={handleRejectArticle}
                onBroadcastBreakingAlert={handleBroadcastAlert}
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
                    onApproveAndPublish={handleApproveAndPublish}
                    onRequestRevision={handleRequestRevision}
                    onRejectArticle={handleRejectArticle}
                    onBroadcastBreakingAlert={handleBroadcastAlert}
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
          </>
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
