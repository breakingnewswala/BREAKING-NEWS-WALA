import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Bookmark, BookmarkCheck, CheckCircle, Volume2, VolumeX, Sparkles, Eye, MessageCircle, Copy, Check, ZoomIn, MapPin, ShieldCheck, } from 'lucide-react';
import { BnwAiService } from '../services/aiService';
export const ArticleDetailScreen = ({ article, isBookmarked, relatedArticles, onBackClick, onBookmarkToggle, onShareArticle, onRelatedArticleClick, onEarnCoins, }) => {
    const [fontSizeLevel, setFontSizeLevel] = useState('normal');
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [aiSummary, setAiSummary] = useState(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    // Award reading coins on mount
    useEffect(() => {
        onEarnCoins(5, `समाचार पढ़ा: "${article.title.slice(0, 25)}..."`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [article.id]);
    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);
    // Text to speech toggler
    const handleToggleAudio = () => {
        if (!('speechSynthesis' in window)) {
            alert('आपके ब्राउज़र में ऑडियो वाचन समर्थित नहीं है।');
            return;
        }
        if (isPlayingAudio) {
            window.speechSynthesis.cancel();
            setIsPlayingAudio(false);
        }
        else {
            const utterance = new SpeechSynthesisUtterance(`${article.title}। ${article.content.slice(0, 1000)}`);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.95;
            utterance.onend = () => setIsPlayingAudio(false);
            utterance.onerror = () => setIsPlayingAudio(false);
            window.speechSynthesis.speak(utterance);
            setIsPlayingAudio(true);
        }
    };
    // Generate AI Summary
    const handleGenerateSummary = async () => {
        if (aiSummary) {
            setAiSummary(null);
            return;
        }
        setIsLoadingSummary(true);
        try {
            const summary = await BnwAiService.generateSummary(article.title, article.content);
            setAiSummary(summary);
        }
        catch {
            setAiSummary('AI सारांश लोड करने में असमर्थ।');
        }
        finally {
            setIsLoadingSummary(false);
        }
    };
    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };
    const getFontSizeClass = () => {
        switch (fontSizeLevel) {
            case 'large':
                return 'text-lg leading-relaxed';
            case 'xlarge':
                return 'text-xl leading-loose';
            default:
                return 'text-base leading-normal';
        }
    };
    return (_jsxs("div", { className: "bg-white min-h-screen pb-24", children: [_jsxs("div", { className: "sticky top-[52px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2 flex items-center justify-between", children: [_jsxs("button", { onClick: onBackClick, className: "flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-red-600 transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), _jsx("span", { children: "\u0935\u093E\u092A\u0938 \u091C\u093E\u090F\u0902" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("div", { className: "flex items-center bg-slate-100 rounded-lg p-0.5 mr-1", children: [_jsx("button", { onClick: () => setFontSizeLevel('normal'), title: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u092B\u093C\u0949\u0928\u094D\u091F", className: `px-1.5 py-0.5 text-xs font-bold rounded ${fontSizeLevel === 'normal' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'}`, children: "A" }), _jsx("button", { onClick: () => setFontSizeLevel('large'), title: "\u092C\u0921\u093C\u093E \u092B\u093C\u0949\u0928\u094D\u091F", className: `px-1.5 py-0.5 text-xs font-bold rounded ${fontSizeLevel === 'large' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'}`, children: _jsx(ZoomIn, { className: "w-3.5 h-3.5 inline" }) }), _jsx("button", { onClick: () => setFontSizeLevel('xlarge'), title: "\u0905\u0924\u093F \u092C\u0921\u093C\u093E \u092B\u093C\u0949\u0928\u094D\u091F", className: `px-1.5 py-0.5 text-xs font-bold rounded ${fontSizeLevel === 'xlarge' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'}`, children: "A+" })] }), _jsx("button", { onClick: () => onBookmarkToggle(article.id), "aria-label": "\u092C\u0941\u0915\u092E\u093E\u0930\u094D\u0915", className: `p-2 rounded-full hover:bg-slate-100 transition-colors ${isBookmarked ? 'text-[#ED1727]' : 'text-slate-600'}`, children: isBookmarked ? _jsx(BookmarkCheck, { className: "w-5 h-5 fill-current" }) : _jsx(Bookmark, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => onShareArticle(article), "aria-label": "\u0936\u0947\u092F\u0930 \u0915\u0930\u0947\u0902", className: "p-2 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors", children: _jsx(Share2, { className: "w-5 h-5" }) })] })] }), _jsxs("div", { className: "max-w-3xl mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [article.isBreaking && (_jsxs("span", { className: "bg-[#ED1727] text-white text-xs font-extrabold px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-white animate-ping" }), "\u092C\u094D\u0930\u0947\u0915\u093F\u0902\u0917 \u0928\u094D\u092F\u0942\u091C\u093C"] })), article.categoryName && (_jsx("span", { className: "bg-blue-50 text-[#344FD6] border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded", children: article.categoryName })), article.districtName && (_jsxs("span", { className: "bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1", children: [_jsx(MapPin, { className: "w-3 h-3 text-red-600" }), article.districtName] }))] }), _jsx("h1", { className: "text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight", children: article.title }), _jsxs("div", { className: "mt-2.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold", children: [_jsx(ShieldCheck, { className: "w-4 h-4 text-emerald-600 shrink-0" }), _jsxs("span", { children: [_jsx("strong", { children: "10-\u092C\u093F\u0902\u0926\u0941 \u0938\u0902\u092A\u093E\u0926\u0915\u0940\u092F \u0938\u0924\u094D\u092F\u093E\u092A\u0928 \u092A\u0942\u0930\u094D\u0923:" }), " \u0924\u0925\u094D\u092F, \u0938\u094D\u0925\u0932 \u0935 \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0938\u093E\u0915\u094D\u0937\u094D\u092F \u092C\u0940\u090F\u0928\u0921\u092C\u094D\u0932\u094D\u092F\u0942 \u0928\u094D\u092F\u0942\u091C\u093C\u0930\u0942\u092E \u0926\u094D\u0935\u093E\u0930\u093E \u092A\u0930\u0940\u0915\u094D\u0937\u093F\u0924\u0964"] })] }), _jsxs("div", { className: "mt-3.5 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm", children: article.authorName ? article.authorName[0] : 'बी' }), _jsxs("div", { children: [_jsxs("p", { className: "font-bold text-slate-900 flex items-center gap-1", children: [article.authorName, _jsx(CheckCircle, { className: "w-3.5 h-3.5 text-blue-600 inline" })] }), _jsxs("p", { className: "text-[11px] text-slate-500", children: [article.authorRole || 'संवाददाता', " \u2022 ", article.publishedAt || article.createdAt] })] })] }), _jsx("div", { className: "flex items-center gap-3 text-slate-500", children: _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Eye, { className: "w-3.5 h-3.5" }), article.viewCount.toLocaleString('hi-IN'), " \u0935\u094D\u092F\u0942\u091C"] }) })] }), _jsxs("div", { className: "mt-3.5 flex flex-wrap items-center gap-2", children: [_jsxs("button", { onClick: handleToggleAudio, className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isPlayingAudio
                                    ? 'bg-red-600 text-white animate-pulse'
                                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`, children: [isPlayingAudio ? _jsx(VolumeX, { className: "w-4 h-4" }) : _jsx(Volume2, { className: "w-4 h-4 text-red-600" }), _jsx("span", { children: isPlayingAudio ? 'ऑडियो रोकें' : 'खबर सुनें (ऑडियो)' })] }), _jsxs("button", { onClick: handleGenerateSummary, disabled: isLoadingSummary, className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${aiSummary
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`, children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 text-indigo-500" }), _jsx("span", { children: isLoadingSummary ? 'AI सारांश तैयार हो रहा है...' : aiSummary ? 'सारांश छिपाएं' : 'AI 3-बिंदु त्वरित सारांश' })] })] }), aiSummary && (_jsxs("div", { className: "mt-3 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-2xs", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-2", children: [_jsx(Sparkles, { className: "w-4 h-4 text-indigo-600" }), _jsx("span", { children: "\u092C\u0940\u090F\u0928\u0921\u092C\u094D\u0932\u094D\u092F\u0942 AI \u0924\u094D\u0935\u0930\u093F\u0924 \u092C\u0941\u0932\u0947\u091F\u093F\u0928 (\u092E\u0927\u094D\u092F \u092A\u094D\u0930\u0926\u0947\u0936 \u0938\u0930\u094B\u0915\u093E\u0930):" })] }), _jsx("div", { className: "text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium", children: aiSummary })] })), article.featuredImage && (_jsxs("div", { className: "mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-2xs", children: [_jsx("img", { src: article.featuredImage, alt: article.title, className: "w-full h-auto max-h-[420px] object-cover" }), (article.imageCaption || article.imageAttribution) && (_jsxs("div", { className: "bg-slate-50 px-3 py-2 text-[11px] text-slate-600 border-t border-slate-200 flex flex-col md:flex-row md:justify-between gap-1", children: [_jsx("span", { children: article.imageCaption }), article.imageAttribution && (_jsxs("span", { className: "font-semibold text-slate-500", children: ["\u0938\u094D\u0930\u094B\u0924: ", article.imageAttribution] }))] }))] })), _jsx("div", { className: `mt-5 text-slate-800 space-y-4 ${getFontSizeClass()}`, children: article.content.split('\n\n').map((para, idx) => (_jsx("p", { className: "whitespace-pre-line leading-relaxed font-normal", children: para }, idx))) }), article.tags && article.tags.length > 0 && (_jsxs("div", { className: "mt-6 pt-4 border-t border-slate-200", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 mb-2 uppercase", children: "\u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0935\u093F\u0937\u092F \u0935 \u091F\u0948\u0917\u094D\u0938:" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: article.tags.map((tag) => (_jsxs("span", { className: "bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors", children: ["#", tag] }, tag))) })] })), _jsxs("div", { className: "mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3", children: [_jsx("span", { className: "text-xs font-bold text-slate-700", children: "\u0907\u0938 \u091C\u0928\u0939\u093F\u0924 \u0916\u092C\u0930 \u0915\u094B \u092E\u093F\u0924\u094D\u0930\u094B\u0902 \u0938\u0947 \u0938\u093E\u091D\u093E \u0915\u0930\u0947\u0902:" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("a", { href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`*${article.title}*\n\nपूरी खबर पढ़ें 'ब्रेकिंग न्यूज़ वाला' पर:\nhttps://breakingnewswala.com/article/${article.slug}`)}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors", children: [_jsx(MessageCircle, { className: "w-4 h-4" }), "\u0935\u094D\u0939\u093E\u091F\u094D\u0938\u090F\u092A"] }), _jsxs("button", { onClick: handleCopyLink, className: "flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-colors", children: [copiedLink ? _jsx(Check, { className: "w-4 h-4 text-emerald-600" }) : _jsx(Copy, { className: "w-4 h-4" }), copiedLink ? 'लिंक कॉपी हो गया!' : 'लिंक कॉपी करें'] })] })] }), relatedArticles.length > 0 && (_jsxs("div", { className: "mt-8 pt-6 border-t border-slate-200", children: [_jsxs("h3", { className: "text-base font-bold text-slate-900 mb-3 flex items-center gap-1.5", children: [_jsx("span", { className: "w-1.5 h-4 bg-[#ED1727] rounded-full inline-block" }), "\u0905\u0928\u094D\u092F \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0916\u092C\u0930\u0947\u0902 (\u092E\u0927\u094D\u092F \u092A\u094D\u0930\u0926\u0947\u0936)"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: relatedArticles.slice(0, 4).map((rel) => (_jsxs("div", { onClick: () => onRelatedArticleClick(rel.id), className: "p-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:shadow-xs transition-all cursor-pointer flex gap-3", children: [rel.featuredImage && (_jsx("img", { src: rel.featuredImage, alt: rel.title, className: "w-20 h-16 object-cover rounded shrink-0" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "text-[10px] font-bold text-[#344FD6] uppercase", children: rel.districtName || rel.categoryName }), _jsx("p", { className: "text-xs font-bold text-slate-800 line-clamp-2 mt-0.5 leading-snug", children: rel.title })] })] }, rel.id))) })] }))] })] }));
};
