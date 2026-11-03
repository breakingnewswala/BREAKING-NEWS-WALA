import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Sparkles, MapPin, Bookmark, BookmarkCheck, Flame, Layers } from 'lucide-react';
import { NewsCard } from '../components/NewsCard';
import { BreakingNewsTicker } from '../components/BreakingNewsTicker';
import { AscAdBanner } from '../components/AscAdBanner';
export const HomeScreen = ({ articles, categories, districts, bookmarkedIds, userCoins, onArticleClick, onBookmarkToggle, onShareArticle, }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState(null);
    const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
    const [searchDistrictQuery, setSearchDistrictQuery] = useState('');
    // Top Breaking story for the ticker
    const topBreaking = useMemo(() => {
        return articles.find((a) => a.isBreaking && a.status === 'PUBLISHED') || articles[0];
    }, [articles]);
    // Filtered articles
    const filteredArticles = useMemo(() => {
        return articles.filter((article) => {
            if (article.status !== 'PUBLISHED')
                return false;
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
        if (!searchDistrictQuery.trim())
            return districts;
        const q = searchDistrictQuery.toLowerCase();
        return districts.filter((d) => d.nameHi.includes(q) || d.nameEn.toLowerCase().includes(q));
    }, [districts, searchDistrictQuery]);
    return (_jsxs("div", { className: "pb-24 md:pb-10", children: [topBreaking && (_jsx(BreakingNewsTicker, { headline: topBreaking.title, districtName: topBreaking.districtName, onClick: () => onArticleClick(topBreaking.id) })), _jsx("div", { className: "bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-2xs", children: _jsxs("div", { className: "flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-2", children: [_jsx("button", { onClick: () => setSelectedCategoryId(null), className: `px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategoryId === null
                                ? 'bg-[#ED1727] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`, children: "\u0938\u092D\u0940 \u0936\u094D\u0930\u0947\u0923\u093F\u092F\u093E\u0902" }), categories.map((cat) => {
                            const isSelected = selectedCategoryId === cat.id;
                            return (_jsx("button", { onClick: () => setSelectedCategoryId(cat.id), className: `px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${isSelected
                                    ? 'bg-[#ED1727] text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`, children: cat.nameHi }, cat.id));
                        })] }) }), _jsxs("div", { className: "bg-slate-50 border-b border-slate-200 px-3 py-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(MapPin, { className: "w-3.5 h-3.5 text-red-600" }), "\u091C\u093C\u093F\u0932\u093E \u091A\u0941\u0928\u0947\u0902 (55 \u091C\u093C\u093F\u0932\u0947)"] }), selectedDistrictId && (_jsx("button", { onClick: () => setSelectedDistrictId(null), className: "text-[#344FD6] text-[11px] hover:underline", children: "\u092B\u093C\u093F\u0932\u094D\u091F\u0930 \u0939\u091F\u093E\u090F\u0902" }))] }), _jsxs("div", { className: "flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5", children: [_jsx("button", { onClick: () => setSelectedDistrictId(null), className: `px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${selectedDistrictId === null
                                    ? 'bg-slate-800 text-white font-bold'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`, children: "\uD83D\uDCCD \u092A\u0942\u0930\u093E \u092E\u092A\u094D\u0930" }), filteredDistrictChips.slice(0, 15).map((dist) => {
                                const isSelected = selectedDistrictId === dist.id;
                                return (_jsx("button", { onClick: () => setSelectedDistrictId(dist.id), className: `px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${isSelected
                                        ? 'bg-[#344FD6] text-white font-bold'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`, children: dist.nameHi }, dist.id));
                            })] })] }), _jsxs("div", { className: "max-w-4xl mx-auto px-3 py-2.5 flex items-center justify-between border-b border-slate-100", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm font-bold text-slate-800 flex items-center gap-1", children: [_jsx(Flame, { className: "w-4 h-4 text-red-600" }), showOnlyBookmarks
                                        ? 'सहेजे गए समाचार'
                                        : selectedDistrictId
                                            ? `${districts.find((d) => d.id === selectedDistrictId)?.nameHi || ''} का समाचार प्रवाह`
                                            : 'ताज़ा समाचार प्रवाह'] }), _jsx("span", { className: "text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full", children: filteredArticles.length })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { title: "\u0938\u092E\u093E\u091A\u093E\u0930 \u092A\u0922\u093C\u0928\u0947 \u092A\u0930 \u092E\u093F\u0932\u0947 \u0938\u093F\u0915\u094D\u0915\u0947", className: "flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-bold shadow-2xs", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 text-amber-500" }), _jsxs("span", { children: [userCoins, " \u0938\u093F\u0915\u094D\u0915\u0947"] })] }), _jsxs("button", { onClick: () => setShowOnlyBookmarks(!showOnlyBookmarks), className: `flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${showOnlyBookmarks
                                    ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`, children: [showOnlyBookmarks ? (_jsx(BookmarkCheck, { className: "w-3.5 h-3.5" })) : (_jsx(Bookmark, { className: "w-3.5 h-3.5" })), _jsxs("span", { children: ["\u0938\u0939\u0947\u091C\u0947 \u0917\u090F (", bookmarkedIds.length, ")"] })] })] })] }), _jsx("div", { className: "max-w-4xl mx-auto px-3 py-3", children: filteredArticles.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-white rounded-xl border border-slate-200 my-4 p-6", children: [_jsx(Layers, { className: "w-12 h-12 text-slate-300 mx-auto mb-3" }), _jsx("h4", { className: "text-base font-bold text-slate-800", children: showOnlyBookmarks
                                ? 'कोई सहेजा गया समाचार नहीं मिला'
                                : 'इस चयन के लिए समाचार उपलब्ध नहीं हैं' }), _jsx("p", { className: "text-xs text-slate-500 mt-1 max-w-sm mx-auto", children: showOnlyBookmarks
                                ? 'समाचार कार्ड पर बुकमार्क आइकन दबाकर अपनी पसंदीदा खबरें यहाँ सुरक्षित करें।'
                                : 'कृपया अन्य ज़िला या श्रेणी का चयन करें अथवा फ़िल्टर रीसेट करें।' }), (selectedCategoryId || selectedDistrictId || showOnlyBookmarks) && (_jsx("button", { onClick: () => {
                                setSelectedCategoryId(null);
                                setSelectedDistrictId(null);
                                setShowOnlyBookmarks(false);
                            }, className: "mt-4 px-4 py-1.5 bg-[#ED1727] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-red-700 transition-colors", children: "\u0938\u092D\u0940 \u0938\u092E\u093E\u091A\u093E\u0930 \u0926\u0947\u0916\u0947\u0902" }))] })) : (_jsxs("div", { className: "space-y-4", children: [leadStory && (_jsx(NewsCard, { article: leadStory, isBookmarked: bookmarkedIds.includes(leadStory.id), onArticleClick: onArticleClick, onBookmarkToggle: onBookmarkToggle, onShareClick: onShareArticle, featured: true })), _jsx(AscAdBanner, { creativeUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80", headline: "\u092E\u0927\u094D\u092F \u092A\u094D\u0930\u0926\u0947\u0936 \u0939\u0938\u094D\u0924\u0936\u093F\u0932\u094D\u092A: \u091A\u0902\u0926\u0947\u0930\u0940 \u0935 \u092E\u0939\u0947\u0936\u094D\u0935\u0930\u0940 \u0939\u0948\u0902\u0921\u0932\u0942\u092E \u0935\u0938\u094D\u0924\u094D\u0930\u094B\u0902 \u092A\u0930 30% \u0924\u0915 \u0915\u0940 \u091B\u0942\u091F", advertiserName: "\u092E\u092A\u094D\u0930 \u0916\u093E\u0926\u0940 \u090F\u0935\u0902 \u0917\u094D\u0930\u093E\u092E\u094B\u0926\u094D\u092F\u094B\u0917 \u092C\u094B\u0930\u094D\u0921" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3.5", children: regularStories.map((article) => (_jsx(NewsCard, { article: article, isBookmarked: bookmarkedIds.includes(article.id), onArticleClick: onArticleClick, onBookmarkToggle: onBookmarkToggle, onShareClick: onShareArticle }, article.id))) }), regularStories.length > 2 && (_jsx(AscAdBanner, { isSponsored: true, headline: "\u090F\u092E\u092A\u0940 \u092A\u0930\u094D\u092F\u091F\u0928: \u092A\u091A\u092E\u0922\u093C\u0940, \u0915\u093E\u0928\u094D\u0939\u093E \u0914\u0930 \u092C\u093E\u0902\u0927\u0935\u0917\u0922\u093C \u092E\u0947\u0902 \u0936\u0940\u0924\u0915\u093E\u0932\u0940\u0928 \u0938\u092B\u093E\u0930\u0940 \u092C\u0941\u0915\u093F\u0902\u0917 \u0936\u0941\u0930\u0942", advertiserName: "\u092E\u0927\u094D\u092F \u092A\u094D\u0930\u0926\u0947\u0936 \u0930\u093E\u091C\u094D\u092F \u092A\u0930\u094D\u092F\u091F\u0928 \u0935\u093F\u0915\u093E\u0938 \u0928\u093F\u0917\u092E", creativeUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&auto=format&fit=crop&q=80" }))] })) })] }));
};
