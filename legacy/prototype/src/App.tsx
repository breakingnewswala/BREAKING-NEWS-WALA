import React, { useState, useEffect } from 'react';
import { 
  Article, 
  Category, 
  ReporterProfile, 
  GraphicTemplate, 
  BreakingTicker, 
  AdBanner, 
  UserRole 
} from './types/index.ts';
import { 
  fetchNews, 
  fetchCategories, 
  fetchLocations, 
  fetchReporters, 
  fetchTickers, 
  fetchTemplates, 
  fetchAds 
} from './services/api.ts';
import { Header } from './components/layout/Header.tsx';
import { BreakingTickerBar } from './components/layout/BreakingTicker.tsx';
import { CategoryNav } from './components/layout/CategoryNav.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { PublicHome } from './components/public/PublicHome.tsx';
import { ArticleDetailModal } from './components/public/ArticleDetailModal.tsx';
import { VideoReelsModal } from './components/public/VideoReelsModal.tsx';
import { DistrictSelectorModal } from './components/public/DistrictSelectorModal.tsx';
import { SearchModal } from './components/public/SearchModal.tsx';
import { UserProfileModal } from './components/public/UserProfileModal.tsx';
import { ReporterDashboard } from './components/reporter/ReporterDashboard.tsx';
import { AdminNewsroom } from './components/admin/AdminNewsroom.tsx';
import { AuthGuard } from './components/auth/AuthGuard.tsx';
import { fetchArticlesFromFirestore } from './firebase/firestore.ts';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('public');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [reporters, setReporters] = useState<ReporterProfile[]>([]);
  const [tickers, setTickers] = useState<BreakingTicker[]>([]);
  const [templates, setTemplates] = useState<GraphicTemplate[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);

  // Navigation State
  const [selectedCategory, setSelectedCategory] = useState<string>('होम');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('निवाड़ी (Niwari)');

  // Modals State
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeReelArticle, setActiveReelArticle] = useState<Article | null>(null);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // User engagement
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(['art-1']);
  const [coinsCount, setCoinsCount] = useState<number>(120);

  // Active Reporter for Reporter Desk
  const [currentReporter, setCurrentReporter] = useState<ReporterProfile | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        const [newsData, catsData, locData, repsData, tickData, tplsData, adsData] = await Promise.all([
          fetchNews(),
          fetchCategories(),
          fetchLocations(),
          fetchReporters(),
          fetchTickers(),
          fetchTemplates(),
          fetchAds()
        ]);

        setArticles(newsData);
        setCategories(catsData);
        setDistricts(locData.districts || []);
        setReporters(repsData);
        if (repsData.length > 0) setCurrentReporter(repsData[0]);
        setTickers(tickData);
        setTemplates(tplsData);
        setAds(adsData);
      } catch (err) {
        console.error('Initial data loading failed:', err);
      }
    }
    init();
  }, []);

  // Real-time synchronization with Cloud Firestore 'news' collection
  useEffect(() => {
    const unsubscribe = fetchArticlesFromFirestore((realtimeArticles) => {
      if (realtimeArticles && realtimeArticles.length > 0) {
        setArticles(prev => {
          const map = new Map<string, Article>();
          // Preserve seed/local articles
          prev.forEach(art => map.set(art.id, art));
          // Overlay real-time Firestore articles
          realtimeArticles.forEach(art => map.set(art.id, art));
          return Array.from(map.values());
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter articles for public view
  const filteredArticles = articles.filter(art => {
    if (selectedCategory !== 'होम') {
      if (art.category !== selectedCategory && art.subcategory !== selectedCategory) {
        return false;
      }
    }
    if (selectedSubcategory) {
      if (art.subcategory !== selectedSubcategory && art.city !== selectedSubcategory) {
        return false;
      }
    }
    if (selectedDistrict && selectedDistrict !== 'सभी जिले') {
      const match = art.district.includes(selectedDistrict) || (art.city && selectedDistrict.includes(art.city));
      // For general categories, allow state news or district news
      if (selectedCategory !== 'होम' && !match && art.state !== 'मध्य प्रदेश') {
        return false;
      }
    }
    return true;
  });

  const handleToggleBookmark = (id: string) => {
    setSavedArticleIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOpenArticle = (article: Article) => {
    setActiveArticle(article);
    // Award 5 reward coins for reading an article
    setCoinsCount(prev => prev + 5);
  };

  const handleShareArticle = (article: Article) => {
    const text = `*${article.title}*\n\nपढ़ें पूरी खबर BREAKING NEWS WALA पर:\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text,
        url: window.location.href
      }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 antialiased selection:bg-red-500 selection:text-white">
      {/* 1. Header with portal switcher, date, search, bookmarks, coins */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        selectedDistrict={selectedDistrict}
        onOpenDistrictModal={() => setIsDistrictModalOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        savedCount={savedArticleIds.length}
        coinsCount={coinsCount}
        unreadNotifications={3}
      />

      {/* 2. Breaking Live Ticker */}
      <BreakingTickerBar
        tickers={tickers}
        onSelectTickerArticle={(id) => {
          const found = articles.find(a => a.id === id);
          if (found) handleOpenArticle(found);
        }}
      />

      {/* 3. Category Navigation (Sticky) */}
      <CategoryNav
        categories={categories}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        onSelectCategory={cat => {
          setSelectedCategory(cat);
          if (currentRole !== 'public') setCurrentRole('public');
        }}
        onSelectSubcategory={setSelectedSubcategory}
      />

      {/* 4. Main Body: Depends on selected Portal Role */}
      <main className="flex-1">
        {currentRole === 'public' && (
          <PublicHome
            articles={filteredArticles}
            selectedDistrict={selectedDistrict}
            onOpenDistrictModal={() => setIsDistrictModalOpen(true)}
            onSelectArticle={handleOpenArticle}
            onOpenReelsModal={setActiveReelArticle}
            savedArticleIds={savedArticleIds}
            onToggleBookmark={handleToggleBookmark}
            onShareArticle={handleShareArticle}
            ads={ads}
          />
        )}

        {(currentRole === 'reporter' || currentRole === 'trusted_reporter') && currentReporter && (
          <AuthGuard sectionTitle="रिपोर्टर डिजिटल न्यूज़ डेस्क">
            <ReporterDashboard
              reporters={reporters}
              currentReporter={currentReporter}
              onChangeReporter={setCurrentReporter}
              articles={articles}
              categories={categories}
              templates={templates}
              onArticleCreated={(newArt) => {
                setArticles(prev => [newArt, ...prev]);
              }}
            />
          </AuthGuard>
        )}

        {currentRole === 'admin' && (
          <AuthGuard requireAdmin={true} sectionTitle="केंद्रीय एडमिन न्यूज़रूम कंट्रोल">
            <AdminNewsroom
              articles={articles}
              reporters={reporters}
              tickers={tickers}
              templates={templates}
              onArticleUpdated={(updated) => {
                setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
              }}
              onTickerCreated={(newT) => {
                setTickers(prev => [newT, ...prev]);
              }}
              onReporterUpdated={(updated) => {
                setReporters(prev => prev.map(r => r.id === updated.id ? updated : r));
                if (currentReporter?.id === updated.id) setCurrentReporter(updated);
              }}
            />
          </AuthGuard>
        )}
      </main>

      {/* 5. Footer */}
      <Footer
        onRoleChange={setCurrentRole}
        onSelectCategory={cat => {
          setSelectedCategory(cat);
          setCurrentRole('public');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals */}
      {activeArticle && (
        <ArticleDetailModal
          article={activeArticle}
          onClose={() => setActiveArticle(null)}
          isBookmarked={savedArticleIds.includes(activeArticle.id)}
          onToggleBookmark={() => handleToggleBookmark(activeArticle.id)}
          onShare={() => handleShareArticle(activeArticle)}
          onSelectRelatedArticle={art => {
            setActiveArticle(art);
            setCoinsCount(prev => prev + 5);
          }}
          relatedArticles={articles.filter(a => a.id !== activeArticle.id && a.category === activeArticle.category)}
        />
      )}

      {activeReelArticle && (
        <VideoReelsModal
          article={activeReelArticle}
          onClose={() => setActiveReelArticle(null)}
          onShare={handleShareArticle}
        />
      )}

      {isDistrictModalOpen && (
        <DistrictSelectorModal
          districts={districts}
          currentDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          onClose={() => setIsDistrictModalOpen(false)}
        />
      )}

      {isSearchModalOpen && (
        <SearchModal
          articles={articles}
          onSelectArticle={handleOpenArticle}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}

      {isProfileModalOpen && (
        <UserProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          savedArticles={articles.filter(a => savedArticleIds.includes(a.id))}
          onRemoveBookmark={handleToggleBookmark}
          onSelectArticle={handleOpenArticle}
          coinsCount={coinsCount}
        />
      )}
    </div>
  );
}
