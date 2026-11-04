import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Flame,
  Layers,
  TrendingUp,
  Clock,
  Eye,
  Share2,
  Play,
  Newspaper,
  ChevronRight,
  SlidersHorizontal,
  Wheat,
  ShieldAlert,
} from 'lucide-react';
import { ArticleDetail, ArticleItem, CategoryItem, DistrictItem, MandiRateItem } from '../types';
import { NewsCard } from '../components/NewsCard';
import { BreakingNewsTicker } from '../components/BreakingNewsTicker';
import { AscAdBanner } from '../components/AscAdBanner';
import { MOCK_MANDI_RATES } from '../data/mockNewsData';

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
  onNavigateEpaper?: () => void;
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
  onNavigateEpaper,
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

  // Lead anchor story (featured) and secondary stories
  const leadStory = filteredArticles[0];
  const secondaryStories = filteredArticles.slice(1, 5);
  const remainingStories = filteredArticles.slice(5);

  // Trending / Most read stories
  const trendingStories = useMemo(() => {
    return [...articles]
      .filter((a) => a.status === 'PUBLISHED')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);
  }, [articles]);

  // Filter districts for quick chip selector
  const filteredDistrictChips = useMemo(() => {
    if (!searchDistrictQuery.trim()) return districts;
    const q = searchDistrictQuery.toLowerCase();
    return districts.filter(
      (d) => d.nameHi.includes(q) || d.nameEn.toLowerCase().includes(q)
    );
  }, [districts, searchDistrictQuery]);

  // Hyperlocal MP Categories
  const mpStateArticles = useMemo(
    () => articles.filter((a) => a.status === 'PUBLISHED' && a.categoryId === 'cat-mp'),
    [articles]
  );
  const agriArticles = useMemo(
    () => articles.filter((a) => a.status === 'PUBLISHED' && a.categoryId === 'cat-agri'),
    [articles]
  );
  const businessArticles = useMemo(
    () => articles.filter((a) => a.status === 'PUBLISHED' && a.categoryId === 'cat-business'),
    [articles]
  );

  return (
    <div className="pb-24 md:pb-12 bg-slate-50">
      {/* 1. Breaking News Ticker */}
      {topBreaking && (
        <BreakingNewsTicker
          headline={topBreaking.title}
          districtName={topBreaking.districtName}
          onClick={() => onArticleClick(topBreaking.id)}
        />
      )}

      {/* 2. Top Leaderboard Banner Ad */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3">
        <AscAdBanner
          creativeUrl="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&auto=format&fit=crop&q=80"
          headline="मध्य प्रदेश पर्यटन: पचमढ़ी, कान्हा और बांधवगढ़ में शीतकालीन सफारी बुकिंग शुरू"
          advertiserName="मध्य प्रदेश राज्य पर्यटन विकास निगम"
          isSponsored={true}
        />
      </div>

      {/* 3. Category Filter Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategoryId === null
                  ? 'bg-[#ED1727] text-white shadow-xs'
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#ED1727] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.nameHi}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. District Selector Bar (Madhya Pradesh 55 Districts) */}
      <div className="bg-slate-100/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>ज़िला चुनें (मध्य प्रदेश के 55 ज़िले):</span>
            </span>
            {selectedDistrictId && (
              <button
                onClick={() => setSelectedDistrictId(null)}
                className="text-[#344FD6] text-[11px] hover:underline font-bold"
              >
                फ़िल्टर हटाएं (Reset)
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedDistrictId(null)}
              className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
                selectedDistrictId === null
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              📍 पूरा मध्य प्रदेश
            </button>

            {filteredDistrictChips.slice(0, 18).map((dist) => {
              const isSelected = selectedDistrictId === dist.id;
              return (
                <button
                  key={dist.id}
                  onClick={() => setSelectedDistrictId(dist.id)}
                  className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#344FD6] text-white font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  {dist.nameHi}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Sub-header: Feed Stats & Reader Coins */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-600" />
            {showOnlyBookmarks
              ? 'सहेजे गए समाचार (Saved)'
              : selectedDistrictId
              ? `${districts.find((d) => d.id === selectedDistrictId)?.nameHi || ''} का ताज़ा समाचार प्रवाह`
              : 'प्रमुख डिजिटल समाचार प्रवाह'}
          </span>
          <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
            {filteredArticles.length}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Reader Coins Indicator */}
          <div
            title="समाचार पढ़ने पर मिले सिक्के"
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-bold shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{userCoins} सिक्के</span>
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-colors ${
              showOnlyBookmarks
                ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
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

      {/* 6. PRIMARY EDITORIAL HERO SECTION (12-Column Grid: 8-col Main + 4-col Sidebar) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 my-4 p-8">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">
              {showOnlyBookmarks
                ? 'कोई सहेजा गया समाचार नहीं मिला'
                : 'इस चयन के लिए वर्तमान में समाचार उपलब्ध नहीं हैं'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {showOnlyBookmarks
                ? 'समाचार कार्ड पर बुकमार्क आइकन दबाकर अपनी पसंदीदा खबरें यहाँ सुरक्षित करें।'
                : 'कृपया अन्य ज़िला या श्रेणी का चयन करें अथवा फ़िल्टर रीसेट करें।'}
            </p>
            <button
              onClick={() => {
                setSelectedCategoryId(null);
                setSelectedDistrictId(null);
                setShowOnlyBookmarks(false);
              }}
              className="mt-4 px-4 py-2 bg-[#ED1727] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-red-700 transition-colors"
            >
              सभी समाचार देखें
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 8 COLUMNS: Lead Story + Secondary 2x2 Grid */}
            <div className="lg:col-span-8 space-y-6">
              {/* Anchor Lead Story */}
              {leadStory && (
                <div
                  onClick={() => onArticleClick(leadStory.id)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
                >
                  <div className="relative aspect-video sm:aspect-21/9 w-full overflow-hidden">
                    <img
                      src={leadStory.featuredImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80'}
                      alt={leadStory.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="bg-[#ED1727] text-white text-xs font-black px-2.5 py-1 rounded shadow-sm tracking-wide">
                        बड़ी खबर
                      </span>
                      <span className="bg-black/60 backdrop-blur-xs text-amber-300 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        {leadStory.districtName || 'मध्य प्रदेश'}
                      </span>
                      {leadStory.categoryName && (
                        <span className="bg-white/90 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded">
                          {leadStory.categoryName}
                        </span>
                      )}
                    </div>

                    {/* Overlay Text */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-snug drop-shadow-md group-hover:text-amber-300 transition-colors">
                        {leadStory.title}
                      </h2>
                      {leadStory.summary && (
                        <p className="hidden sm:block text-xs sm:text-sm text-slate-200 mt-2 line-clamp-2 drop-shadow-xs">
                          {leadStory.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lead Story Bottom Bar */}
                  <div className="p-3.5 bg-white flex items-center justify-between text-xs text-slate-600 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900">
                        संवाददाता: {leadStory.authorName || 'बीएनडब्ल्यू ब्यूरो'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {leadStory.publishedAt || leadStory.createdAt}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Eye className="w-3.5 h-3.5" />
                        {leadStory.viewCount} व्यूज
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => onBookmarkToggle(leadStory.id, e)}
                        className="p-1.5 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors"
                        title="बुकमार्क"
                      >
                        {bookmarkedIds.includes(leadStory.id) ? (
                          <BookmarkCheck className="w-4 h-4 text-red-600" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => onShareArticle(leadStory, e)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors"
                        title="शेयर करें"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary Stories 2-Column Grid */}
              {secondaryStories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {secondaryStories.map((story) => (
                    <NewsCard
                      key={story.id}
                      article={story}
                      isBookmarked={bookmarkedIds.includes(story.id)}
                      onArticleClick={onArticleClick}
                      onBookmarkToggle={onBookmarkToggle}
                      onShareClick={onShareArticle}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT 4 COLUMNS: Trending Stories, E-Paper Promo, Sidebar Ad */}
            <div className="lg:col-span-4 space-y-6">
              {/* 1. Trending Stories Box */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    सबसे ज्यादा पढ़े गए समाचार
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                    TRENDING
                  </span>
                </h3>

                <div className="space-y-3">
                  {trendingStories.map((story, idx) => (
                    <div
                      key={story.id}
                      onClick={() => onArticleClick(story.id)}
                      className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0
                            ? 'bg-[#ED1727] text-white shadow-xs'
                            : idx === 1
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 line-clamp-2 leading-snug">
                          {story.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span className="font-semibold text-blue-700">{story.districtName}</span>
                          <span>•</span>
                          <span>{story.viewCount} व्यूज</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. E-Paper Digital Edition Promotion Card */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl shadow-md space-y-3 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="bg-[#ED1727] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    दैनिक ई-पेपर
                  </span>
                  <span className="text-xs text-amber-300 font-bold">आज का डिजिटल संस्करण</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&auto=format&fit=crop&q=80"
                      alt="Epaper Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white leading-tight">
                      भोपाल, इंदौर, ग्वालियर, जबलपुर व निवाड़ी संस्करण
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      प्रिंट लेआउट में सभी 8 पृष्ठों की प्रामाणिक डिजिटल कॉपी।
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onNavigateEpaper) onNavigateEpaper();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Newspaper className="w-4 h-4" />
                  <span>डिजिटल ई-पेपर पढ़ें (Read E-Paper)</span>
                </button>
              </div>

              {/* 3. Sanchi Milk / Khadi Hyperlocal Ad Banner */}
              <AscAdBanner
                creativeUrl="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80"
                headline="मध्य प्रदेश हस्तशिल्प: चंदेरी व महेश्वरी हैंडलूम वस्त्रों पर 30% तक की छूट"
                advertiserName="मप्र खादी एवं ग्रामोद्योग बोर्ड"
              />
            </div>
          </div>
        )}
      </div>

      {/* 7. MIDDLE SECTION: Real-time Mandi Rates & Agriculture Desk */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <Wheat className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  मध्य प्रदेश कृषि उपज मंडी भाव (डेमो / नमूना डेटा)
                </h3>
                <p className="text-xs text-slate-500">
                  सीहोर, विदिशा, नरसिंहपुर, मुरैना, मंदसौर व राजगढ़ मंडियों के सांकेतिक भाव (नमूना डेटा)
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              डेमो बुलेटिन (Sample Rates)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">फसल / जिंस (Commodity)</th>
                  <th className="py-2.5 px-3">मंडी का नाम</th>
                  <th className="py-2.5 px-3">ज़िला</th>
                  <th className="py-2.5 px-3">मॉडल भाव (औसत)</th>
                  <th className="py-2.5 px-3">न्यूनतम - अधिकतम</th>
                  <th className="py-2.5 px-3 text-right">अपडेट समय</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_MANDI_RATES.map((mandi) => (
                  <tr key={mandi.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{mandi.commodityName}</td>
                    <td className="py-3 px-3 text-slate-700">{mandi.mandiName}</td>
                    <td className="py-3 px-3 font-semibold text-blue-700">{mandi.districtName}</td>
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-emerald-700 text-sm">
                        ₹ {mandi.modalPrice.toLocaleString('hi-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">/ क्विंटल</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      ₹ {mandi.minPrice} - ₹ {mandi.maxPrice}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {mandi.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 8. LOWER SECTION: Extended Categorized Feeds (MP State, Business, Crime, Agriculture) */}
      {remainingStories.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
            <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-600" />
              ताज़ा डिजिटल ग्राउंड रिपोर्ट्स (All Stories Feed)
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              कुल {filteredArticles.length} खबरें
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {remainingStories.map((story) => (
              <NewsCard
                key={story.id}
                article={story}
                isBookmarked={bookmarkedIds.includes(story.id)}
                onArticleClick={onArticleClick}
                onBookmarkToggle={onBookmarkToggle}
                onShareClick={onShareArticle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
