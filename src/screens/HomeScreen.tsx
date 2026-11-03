import React, { useState, useMemo } from 'react';
import { Sparkles, MapPin, Bookmark, BookmarkCheck, Flame, Layers } from 'lucide-react';
import { ArticleDetail, ArticleItem, CategoryItem, DistrictItem } from '../types';
import { NewsCard } from '../components/NewsCard';
import { BreakingNewsTicker } from '../components/BreakingNewsTicker';
import { AscAdBanner } from '../components/AscAdBanner';

interface HomeScreenProps {
  articles: ArticleDetail[];
  categories: CategoryItem[];
  districts: DistrictItem[];
  bookmarkedIds: string[];
  userCoins: number;
  onArticleClick: (articleId: string) => void;
  onBookmarkToggle: (articleId: string, e: React.MouseEvent) => void;
  onShareArticle: (article: ArticleItem, e: React.MouseEvent) => void;
  onEarnCoins: (amount: number, reason: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  articles,
  categories,
  districts,
  bookmarkedIds,
  userCoins,
  onArticleClick,
  onBookmarkToggle,
  onShareArticle,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  const [searchDistrictQuery, setSearchDistrictQuery] = useState('');

  // Top Breaking story for the ticker
  const topBreaking = useMemo(() => {
    return articles.find((a) => a.isBreaking && a.status === 'PUBLISHED') || articles[0];
  }, [articles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (article.status !== 'PUBLISHED') return false;

      if (showOnlyBookmarks && !bookmarkedIds.includes(article.id)) {
        return false;
      }

      if (selectedCategoryId && article.categoryId !== selectedCategoryId) {
        return false;
      }

      if (selectedDistrictId && article.districtId !== selectedDistrictId) {
        return false;
      }

      return true;
    });
  }, [articles, selectedCategoryId, selectedDistrictId, showOnlyBookmarks, bookmarkedIds]);

  // Lead story is first breaking or first article
  const leadStory = filteredArticles[0];
  const regularStories = filteredArticles.slice(1);

  // Filter districts for quick chip selector
  const filteredDistrictChips = useMemo(() => {
    if (!searchDistrictQuery.trim()) return districts;
    const q = searchDistrictQuery.toLowerCase();
    return districts.filter(
      (d) => d.nameHi.includes(q) || d.nameEn.toLowerCase().includes(q)
    );
  }, [districts, searchDistrictQuery]);

  return (
    <div className="pb-24 md:pb-10">
      {/* 1. Breaking News Ticker */}
      {topBreaking && (
        <BreakingNewsTicker
          headline={topBreaking.title}
          districtName={topBreaking.districtName}
          onClick={() => onArticleClick(topBreaking.id)}
        />
      )}

      {/* 2. Category Filter Pills */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-2">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategoryId === null
                ? 'bg-[#ED1727] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            सभी श्रेणियां
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#ED1727] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.nameHi}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. District Selector Horizontal Bar (Madhya Pradesh 55 Districts) */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            ज़िला चुनें (55 ज़िले)
          </span>
          {selectedDistrictId && (
            <button
              onClick={() => setSelectedDistrictId(null)}
              className="text-[#344FD6] text-[11px] hover:underline"
            >
              फ़िल्टर हटाएं
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedDistrictId(null)}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              selectedDistrictId === null
                ? 'bg-slate-800 text-white font-bold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            📍 पूरा मप्र
          </button>

          {/* Quick Major Districts */}
          {filteredDistrictChips.slice(0, 15).map((dist) => {
            const isSelected = selectedDistrictId === dist.id;
            return (
              <button
                key={dist.id}
                onClick={() => setSelectedDistrictId(dist.id)}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#344FD6] text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {dist.nameHi}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Bookmarks & Coins Status Bar */}
      <div className="max-w-4xl mx-auto px-3 py-2.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
            <Flame className="w-4 h-4 text-red-600" />
            {showOnlyBookmarks
              ? 'सहेजे गए समाचार'
              : selectedDistrictId
              ? `${districts.find((d) => d.id === selectedDistrictId)?.nameHi || ''} का समाचार प्रवाह`
              : 'ताज़ा समाचार प्रवाह'}
          </span>
          <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
            {filteredArticles.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Reader Coins Indicator */}
          <div
            title="समाचार पढ़ने पर मिले सिक्के"
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-bold shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{userCoins} सिक्के</span>
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              showOnlyBookmarks
                ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {showOnlyBookmarks ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
            <span>सहेजे गए ({bookmarkedIds.length})</span>
          </button>
        </div>
      </div>

      {/* 5. Main Feed Container */}
      <div className="max-w-4xl mx-auto px-3 py-3">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 my-4 p-6">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">
              {showOnlyBookmarks
                ? 'कोई सहेजा गया समाचार नहीं मिला'
                : 'इस चयन के लिए समाचार उपलब्ध नहीं हैं'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {showOnlyBookmarks
                ? 'समाचार कार्ड पर बुकमार्क आइकन दबाकर अपनी पसंदीदा खबरें यहाँ सुरक्षित करें।'
                : 'कृपया अन्य ज़िला या श्रेणी का चयन करें अथवा फ़िल्टर रीसेट करें।'}
            </p>
            {(selectedCategoryId || selectedDistrictId || showOnlyBookmarks) && (
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSelectedDistrictId(null);
                  setShowOnlyBookmarks(false);
                }}
                className="mt-4 px-4 py-1.5 bg-[#ED1727] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-red-700 transition-colors"
              >
                सभी समाचार देखें
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lead Story */}
            {leadStory && (
              <NewsCard
                article={leadStory}
                isBookmarked={bookmarkedIds.includes(leadStory.id)}
                onArticleClick={onArticleClick}
                onBookmarkToggle={onBookmarkToggle}
                onShareClick={onShareArticle}
                featured={true}
              />
            )}

            {/* Hyperlocal Ad Banner */}
            <AscAdBanner
              creativeUrl="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80"
              headline="मध्य प्रदेश हस्तशिल्प: चंदेरी व महेश्वरी हैंडलूम वस्त्रों पर 30% तक की छूट"
              advertiserName="मप्र खादी एवं ग्रामोद्योग बोर्ड"
            />

            {/* Regular Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {regularStories.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  isBookmarked={bookmarkedIds.includes(article.id)}
                  onArticleClick={onArticleClick}
                  onBookmarkToggle={onBookmarkToggle}
                  onShareClick={onShareArticle}
                />
              ))}
            </div>

            {/* Second Hyperlocal Ad Banner */}
            {regularStories.length > 2 && (
              <AscAdBanner
                isSponsored={true}
                headline="एमपी पर्यटन: पचमढ़ी, कान्हा और बांधवगढ़ में शीतकालीन सफारी बुकिंग शुरू"
                advertiserName="मध्य प्रदेश राज्य पर्यटन विकास निगम"
                creativeUrl="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&auto=format&fit=crop&q=80"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
