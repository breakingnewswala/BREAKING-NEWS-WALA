import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Search as SearchIcon, X, TrendingUp } from 'lucide-react';
import { NewsCard } from '../components/NewsCard';
export const SearchScreen = ({ articles, categories, districts, bookmarkedIds, onArticleClick, onBookmarkToggle, onShareArticle, }) => {
    const [query, setQuery] = useState('');
    const [selectedDistrictId, setSelectedDistrictId] = useState('all');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
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
            if (article.status !== 'PUBLISHED')
                return false;
            // Filter by district
            if (selectedDistrictId !== 'all' && article.districtId !== selectedDistrictId) {
                return false;
            }
            // Filter by category
            if (selectedCategoryId !== 'all' && article.categoryId !== selectedCategoryId) {
                return false;
            }
            // If no query string, show matching filtered articles
            if (!q)
                return true;
            const titleMatch = article.title.toLowerCase().includes(q);
            const summaryMatch = article.summary?.toLowerCase().includes(q) || false;
            const contentMatch = article.content.toLowerCase().includes(q);
            const districtMatch = article.districtName?.toLowerCase().includes(q) || false;
            const tagMatch = article.tags?.some((t) => t.toLowerCase().includes(q)) || false;
            return titleMatch || summaryMatch || contentMatch || districtMatch || tagMatch;
        });
    }, [articles, query, selectedDistrictId, selectedCategoryId]);
    return (_jsxs("div", { className: "bg-slate-50 min-h-screen pb-24", children: [_jsx("div", { className: "bg-white border-b border-slate-200 px-4 py-3 sticky top-[52px] z-30 shadow-2xs", children: _jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "relative flex items-center", children: [_jsx(SearchIcon, { className: "w-5 h-5 text-red-600 absolute left-3 pointer-events-none" }), _jsx("input", { type: "text", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "\u0916\u092C\u0930, \u0928\u0947\u0924\u093E, \u091C\u093C\u093F\u0932\u093E, \u092E\u0902\u0921\u0940, \u0908-\u0909\u092A\u093E\u0930\u094D\u091C\u0928 \u092F\u093E \u092F\u094B\u091C\u0928\u093E \u0916\u094B\u091C\u0947\u0902...", className: "w-full pl-10 pr-10 py-2.5 text-xs md:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 bg-slate-50 focus:bg-white transition-all", autoFocus: true }), query && (_jsx("button", { onClick: () => setQuery(''), className: "absolute right-3 p-1 text-slate-400 hover:text-slate-600", children: _jsx(X, { className: "w-4 h-4" }) }))] }), _jsxs("div", { className: "mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar", children: [_jsxs("select", { value: selectedDistrictId, onChange: (e) => setSelectedDistrictId(e.target.value), className: "text-[11px] font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700", children: [_jsx("option", { value: "all", children: "\uD83D\uDCCD \u0938\u092E\u0938\u094D\u0924 55 \u091C\u093F\u0932\u0947" }), districts.map((d) => (_jsx("option", { value: d.id, children: d.nameHi }, d.id)))] }), _jsxs("select", { value: selectedCategoryId, onChange: (e) => setSelectedCategoryId(e.target.value), className: "text-[11px] font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700", children: [_jsx("option", { value: "all", children: "\uD83D\uDCC2 \u0938\u092D\u0940 \u0936\u094D\u0930\u0947\u0923\u093F\u092F\u093E\u0902" }), categories.map((c) => (_jsx("option", { value: c.id, children: c.nameHi }, c.id)))] })] })] }) }), _jsxs("div", { className: "max-w-3xl mx-auto px-4 py-4 space-y-4", children: [_jsxs("div", { className: "bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2", children: [_jsx(TrendingUp, { className: "w-4 h-4 text-red-600" }), _jsx("span", { children: "\u092E\u0927\u094D\u092F \u092A\u094D\u0930\u0926\u0947\u0936 \u092E\u0947\u0902 \u091F\u094D\u0930\u0947\u0902\u0921\u093F\u0902\u0917 \u0935\u093F\u0937\u092F (Trending Searches):" })] }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: trendingKeywords.map((keyword) => (_jsxs("button", { onClick: () => setQuery(keyword), className: `text-xs px-2.5 py-1 rounded-full border transition-colors ${query === keyword
                                        ? 'bg-red-600 text-white border-red-600 font-bold'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`, children: ["#", keyword] }, keyword))) })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-slate-600 px-1", children: [_jsx("span", { children: query ? `"${query}" के परिणाम:` : 'मध्य प्रदेश के प्रमुख समाचार:' }), _jsxs("span", { className: "font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full", children: [searchResults.length, " \u0938\u092E\u093E\u091A\u093E\u0930 \u092E\u093F\u0932\u0947"] })] }), searchResults.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-white rounded-xl border border-slate-200 p-6", children: [_jsx(SearchIcon, { className: "w-12 h-12 text-slate-300 mx-auto mb-2" }), _jsx("h4", { className: "text-sm font-bold text-slate-800", children: "\u0915\u094B\u0908 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0938\u092E\u093E\u091A\u093E\u0930 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E" }), _jsx("p", { className: "text-xs text-slate-500 mt-1 max-w-sm mx-auto", children: "\u0915\u0943\u092A\u092F\u093E \u0935\u0930\u094D\u0924\u0928\u0940 \u091C\u093E\u0902\u091A\u0947\u0902 \u092F\u093E \u0915\u093F\u0938\u0940 \u0905\u0928\u094D\u092F \u0915\u0940\u0935\u0930\u094D\u0921, \u091C\u0948\u0938\u0947 '\u0907\u0902\u0926\u094C\u0930', '\u092D\u094B\u092A\u093E\u0932', '\u0915\u0943\u0937\u093F', '\u0938\u094B\u0932\u0930' \u0906\u0926\u093F \u0938\u0947 \u0916\u094B\u091C\u0947\u0902\u0964" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: searchResults.map((article) => (_jsx(NewsCard, { article: article, isBookmarked: bookmarkedIds.includes(article.id), onArticleClick: onArticleClick, onBookmarkToggle: onBookmarkToggle, onShareClick: onShareArticle }, article.id))) }))] })] }));
};
