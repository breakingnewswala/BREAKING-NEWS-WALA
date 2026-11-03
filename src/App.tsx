import React, { useState, useEffect } from 'react';
import { AppRole, ArticleDetail, ArticleItem, CreateDraftRequest } from './types';
import {
  CATEGORIES,
  DISTRICTS,
  DIVISIONS,
  EPAPER_EDITIONS,
  INITIAL_ARTICLES,
  INITIAL_PENDING_STORIES,
} from './data/mockNewsData';
import { BnwMasthead } from './components/BnwMasthead';
import { BottomNav, NavTab } from './components/BottomNav';
import { NavDrawer } from './components/NavDrawer';
import { HomeScreen } from './screens/HomeScreen';
import { ArticleDetailScreen } from './screens/ArticleDetailScreen';
import { EpaperScreen } from './screens/EpaperScreen';
import { ReporterDeskScreen } from './screens/ReporterDeskScreen';
import { NewsroomDeskScreen } from './screens/NewsroomDeskScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { Radio, X } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // App Role Persona
  const [currentRole, setCurrentRole] = useState<AppRole>('READER');

  // Filter signals from Drawer Menu to Home
  const [initialCategoryFilter, setInitialCategoryFilter] = useState<string | null>(null);
  const [initialDistrictFilter, setInitialDistrictFilter] = useState<string | null>(null);

  // News State
  const [articles, setArticles] = useState<ArticleDetail[]>(INITIAL_ARTICLES);
  const [pendingStories, setPendingStories] = useState<ArticleDetail[]>(INITIAL_PENDING_STORIES);
  const [reporterDrafts, setReporterDrafts] = useState<ArticleDetail[]>(INITIAL_PENDING_STORIES);

  // User engagement
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['art-1', 'art-3']);
  const [userCoins, setUserCoins] = useState<number>(45);

  // Active Statewide Alert
  const [activeAlert, setActiveAlert] = useState<{ title: string; district: string } | null>({
    title: 'मौसम विभाग: ग्वालियर-चंबल एवं विंध्य अंचल में अगले 24 घंटे गरज-चमक के साथ यलो अलर्ट जारी।',
    district: 'पूरा मध्य प्रदेश',
  });

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
  };

  // Submit Reporter Draft
  const handleSubmitReporterDraft = (draftReq: CreateDraftRequest) => {
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
      imageAttribution: draftReq.imageAttribution || 'बीएनडब्ल्यू फील्ड संवाददाता',
      categoryId: draftReq.categoryId,
      categoryName: cat?.nameHi || 'मध्य प्रदेश',
      districtId: draftReq.districtId,
      districtName: dist?.nameHi || 'भोपाल',
      authorId: 'rep-active',
      authorName: 'राजेश पटेल',
      authorRole: 'फील्ड संवाददाता',
      isBreaking: draftReq.isBreaking,
      viewCount: 0,
      shareCount: 0,
      createdAt: 'अभी-अभी दर्ज किया गया',
      factChecked: false,
    };

    setPendingStories((prev) => [newDraft, ...prev]);
    setReporterDrafts((prev) => [newDraft, ...prev]);
  };

  // Newsroom Approve and Publish
  const handleApproveAndPublish = (articleId: string) => {
    const target = pendingStories.find((a) => a.id === articleId);
    if (!target) return;

    const publishedArticle: ArticleDetail = {
      ...target,
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
        title: target.title,
        district: target.districtName || 'मध्य प्रदेश',
      });
    }
  };

  // Newsroom Request Revision
  const handleRequestRevision = (articleId: string, comments: string) => {
    setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
    setReporterDrafts((prev) =>
      prev.map((d) =>
        d.id === articleId
          ? { ...d, status: 'REVISION_REQUESTED', summary: `संशोधन अपेक्षित: ${comments}` }
          : d
      )
    );
  };

  // Newsroom Reject
  const handleRejectArticle = (articleId: string) => {
    setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
    setReporterDrafts((prev) =>
      prev.map((d) => (d.id === articleId ? { ...d, status: 'REJECTED' } : d))
    );
  };

  // Broadcast Statewide Alert
  const handleBroadcastAlert = (title: string, district: string) => {
    setActiveAlert({ title, district });
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
        onTabChange={(tab) => {
          setSelectedArticleId(null);
          setActiveTab(tab);
        }}
        onSearchClick={() => {
          setSelectedArticleId(null);
          setActiveTab('search');
        }}
        onProfileClick={() => {
          setSelectedArticleId(null);
          setActiveTab('profile');
        }}
        currentRole={currentRole}
        pendingQueueCount={pendingStories.length}
      />

      {/* 2. Comprehensive Navigation Menu Drawer (Opens on touching Menu button next to logo) */}
      <NavDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onTabSelect={(tab) => {
          setSelectedArticleId(null);
          setActiveTab(tab);
        }}
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
          setSelectedArticleId(null);
          setActiveTab('home');
        }}
        onSelectDistrict={(distId) => {
          setInitialDistrictFilter(distId);
          setSelectedArticleId(null);
          setActiveTab('home');
        }}
      />

      {/* 3. Statewide Emergency Breaking Notice Banner if active */}
      {activeAlert && (
        <div className="bg-red-600 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold shadow-xs">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <Radio className="w-4 h-4 text-white animate-spin shrink-0" />
            <span className="bg-white text-red-600 px-1.5 rounded text-[10px] shrink-0 font-black">
              आपात अलर्ट [{activeAlert.district}]
            </span>
            <span className="truncate">{activeAlert.title}</span>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="text-white hover:text-red-200 shrink-0 p-0.5"
            title="हटाएं"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Main Body Content Switcher */}
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
              />
            )}

            {activeTab === 'epaper' && (
              <EpaperScreen
                editions={EPAPER_EDITIONS}
                onBackClick={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'desk' && (
              <>
                {/* Role-Aware Desk Switcher */}
                <div className="bg-slate-900 border-b border-slate-800 px-3 py-2">
                  <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-white">
                    <span className="font-bold">
                      {currentRole === 'ADMIN'
                        ? 'मुख्य संपादक एवं न्यूज़रूम डेस्क'
                        : currentRole === 'REPORTER'
                        ? 'मान्यता प्राप्त संवाददाता डेस्क'
                        : 'प्रेस कार्यक्षेत्र (पाठक पूर्वावलोकन)'}
                    </span>

                    {/* Quick Mode Toggle for Testing */}
                    <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                      <button
                        onClick={() => setCurrentRole('REPORTER')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          currentRole === 'REPORTER'
                            ? 'bg-[#ED1727] text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        रिपोर्टर
                      </button>
                      <button
                        onClick={() => setCurrentRole('ADMIN')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          currentRole === 'ADMIN'
                            ? 'bg-[#344FD6] text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        एडमिन
                      </button>
                    </div>
                  </div>
                </div>

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
                    onSubmitDraft={handleSubmitReporterDraft}
                    onBackClick={() => setActiveTab('home')}
                  />
                )}
              </>
            )}

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

      {/* 5. Bottom Tab Navigation (Mobile & Tablet only, completely hidden on Desktop Web) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedArticleId(null);
          setActiveTab(tab);
        }}
        currentRole={currentRole}
        pendingQueueCount={pendingStories.length}
      />
    </div>
  );
};
