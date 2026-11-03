import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, TrendingUp, Filter, MapPin } from 'lucide-react';
import { ArticleDetail, ArticleItem, CategoryItem, DistrictItem } from '../types';
import { NewsCard } from '../components/NewsCard';

interface SearchScreenProps {
  articles: ArticleDetail[];
  categories: CategoryItem[];
  districts: DistrictItem[];
  bookmarkedIds: string[];
  onArticleClick: (articleId: string) => void;
  onBookmarkToggle: (articleId: string, e: React.MouseEvent) => void;
  onShareArticle: (article: ArticleItem, e: React.MouseEvent) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  articles,
  categories,
  districts,
  bookmarkedIds,
  onArticleClick,
  onBookmarkToggle,
  onShareArticle,
}) => {
  const [query, setQuery] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const trendingKeywords = [
    'गेहूं उपार्जन पंजीयन',
    'रीवा सोलर पार्क',
    'इंदौर मेट्रो',
    'महाकाल लोक',
    'ग्वालियर उद्योग',
    'भेड़ाघाट जबलपुर',
    'केन-बेतवा लिंक',
  ];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return articles.filter((article) => {
      if (article.status !== 'PUBLISHED') return false;

      // Filter by district
      if (selectedDistrictId !== 'all' && article.districtId !== selectedDistrictId) {
        return false;
      }

      // Filter by category
      if (selectedCategoryId !== 'all' && article.categoryId !== selectedCategoryId) {
        return false;
      }

      // If no query string, show matching filtered articles
      if (!q) return true;

      const titleMatch = article.title.toLowerCase().includes(q);
      const summaryMatch = article.summary?.toLowerCase().includes(q) || false;
      const contentMatch = article.content.toLowerCase().includes(q);
      const districtMatch = article.districtName?.toLowerCase().includes(q) || false;
      const tagMatch = article.tags?.some((t) => t.toLowerCase().includes(q)) || false;

      return titleMatch || summaryMatch || contentMatch || districtMatch || tagMatch;
    });
  }, [articles, query, selectedDistrictId, selectedCategoryId]);

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Search Input Box */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-[52px] z-30 shadow-2xs">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <SearchIcon className="w-5 h-5 text-red-600 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="खबर, नेता, ज़िला, मंडी, ई-उपार्जन या योजना खोजें..."
              className="w-full pl-10 pr-10 py-2.5 text-xs md:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 bg-slate-50 focus:bg-white transition-all"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* District dropdown */}
            <select
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="text-[11px] font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700"
            >
              <option value="all">📍 समस्त 55 जिले</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameHi}
                </option>
              ))}
            </select>

            {/* Category dropdown */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="text-[11px] font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700"
            >
              <option value="all">📂 सभी श्रेणियां</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameHi}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Trending Keywords */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span>मध्य प्रदेश में ट्रेंडिंग विषय (Trending Searches):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trendingKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => setQuery(keyword)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  query === keyword
                    ? 'bg-red-600 text-white border-red-600 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                #{keyword}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span>
            {query ? `"${query}" के परिणाम:` : 'मध्य प्रदेश के प्रमुख समाचार:'}
          </span>
          <span className="font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
            {searchResults.length} समाचार मिले
          </span>
        </div>

        {/* Results List */}
        {searchResults.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
            <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">
              कोई संबंधित समाचार नहीं मिला
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              कृपया वर्तनी जांचें या किसी अन्य कीवर्ड, जैसे 'इंदौर', 'भोपाल', 'कृषि', 'सोलर' आदि से खोजें।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.map((article) => (
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
        )}
      </div>
    </div>
  );
};
