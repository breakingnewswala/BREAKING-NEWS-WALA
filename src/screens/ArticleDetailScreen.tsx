import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  MessageCircle,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  MapPin,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { ArticleDetail, ArticleItem } from '../types';
import { BnwAiService } from '../services/aiService';

interface ArticleDetailScreenProps {
  article: ArticleDetail;
  isBookmarked: boolean;
  relatedArticles: ArticleItem[];
  onBackClick: () => void;
  onBookmarkToggle: (articleId: string) => void;
  onShareArticle: (article: ArticleItem) => void;
  onRelatedArticleClick: (articleId: string) => void;
  onEarnCoins: (amount: number, reason: string) => void;
}

export const ArticleDetailScreen: React.FC<ArticleDetailScreenProps> = ({
  article,
  isBookmarked,
  relatedArticles,
  onBackClick,
  onBookmarkToggle,
  onShareArticle,
  onRelatedArticleClick,
  onEarnCoins,
}) => {
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
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
    } else {
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
    } catch {
      setAiSummary('AI सारांश लोड करने में असमर्थ।');
    } finally {
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

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Sticky Sub-Header */}
      <div className="sticky top-[52px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2 flex items-center justify-between">
        <button
          onClick={onBackClick}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>वापस जाएं</span>
        </button>

        <div className="flex items-center gap-1">
          {/* Font Size Adjusters */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 mr-1">
            <button
              onClick={() => setFontSizeLevel('normal')}
              title="सामान्य फ़ॉन्ट"
              className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                fontSizeLevel === 'normal' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel('large')}
              title="बड़ा फ़ॉन्ट"
              className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                fontSizeLevel === 'large' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5 inline" />
            </button>
            <button
              onClick={() => setFontSizeLevel('xlarge')}
              title="अति बड़ा फ़ॉन्ट"
              className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                fontSizeLevel === 'xlarge' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'
              }`}
            >
              A+
            </button>
          </div>

          {/* Bookmark Toggle */}
          <button
            onClick={() => onBookmarkToggle(article.id)}
            aria-label="बुकमार्क"
            className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${
              isBookmarked ? 'text-[#ED1727]' : 'text-slate-600'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
          </button>

          {/* Share Action */}
          <button
            onClick={() => onShareArticle(article)}
            aria-label="शेयर करें"
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Category & District Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {article.isBreaking && (
            <span className="bg-[#ED1727] text-white text-xs font-extrabold px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              ब्रेकिंग न्यूज़
            </span>
          )}

          {article.categoryName && (
            <span className="bg-blue-50 text-[#344FD6] border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded">
              {article.categoryName}
            </span>
          )}

          {article.districtName && (
            <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-600" />
              {article.districtName}
            </span>
          )}
        </div>

        {/* Article Headline */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
          {article.title}
        </h1>

        {/* Fact Checked Badge (DEC-059 & 10-Point Editorial Policy) */}
        <div className="mt-2.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>10-बिंदु संपादकीय सत्यापन पूर्ण:</strong> तथ्य, स्थल व प्रत्यक्ष साक्ष्य बीएनडब्ल्यू न्यूज़रूम द्वारा परीक्षित।
          </span>
        </div>

        {/* Author Byline & Timestamps */}
        <div className="mt-3.5 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm">
              {article.authorName ? article.authorName[0] : 'बी'}
            </div>
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-1">
                {article.authorName}
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 inline" />
              </p>
              <p className="text-[11px] text-slate-500">
                {article.authorRole || 'संवाददाता'} • {article.publishedAt || article.createdAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.viewCount.toLocaleString('hi-IN')} व्यूज
            </span>
          </div>
        </div>

        {/* Action Controls Bar: Listen to News & AI Summary */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {/* Read Aloud Button */}
          <button
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isPlayingAudio
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-600" />}
            <span>{isPlayingAudio ? 'ऑडियो रोकें' : 'खबर सुनें (ऑडियो)'}</span>
          </button>

          {/* AI 3-Point Summary Button */}
          <button
            onClick={handleGenerateSummary}
            disabled={isLoadingSummary}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              aiSummary
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isLoadingSummary ? 'AI सारांश तैयार हो रहा है...' : aiSummary ? 'सारांश छिपाएं' : 'AI 3-बिंदु त्वरित सारांश'}</span>
          </button>
        </div>

        {/* AI Summary Box */}
        {aiSummary && (
          <div className="mt-3 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>बीएनडब्ल्यू AI त्वरित बुलेटिन (मध्य प्रदेश सरोकार):</span>
            </div>
            <div className="text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
              {aiSummary}
            </div>
          </div>
        )}

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-auto max-h-[420px] object-cover"
            />
            {(article.imageCaption || article.imageAttribution) && (
              <div className="bg-slate-50 px-3 py-2 text-[11px] text-slate-600 border-t border-slate-200 flex flex-col md:flex-row md:justify-between gap-1">
                <span>{article.imageCaption}</span>
                {article.imageAttribution && (
                  <span className="font-semibold text-slate-500">स्रोत: {article.imageAttribution}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content Paragraphs */}
        <div className={`mt-5 text-slate-800 space-y-4 ${getFontSizeClass()}`}>
          {article.content.split('\n\n').map((para, idx) => (
            <p key={idx} className="whitespace-pre-line leading-relaxed font-normal">
              {para}
            </p>
          ))}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">संबंधित विषय व टैग्स:</p>
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social Share & Copy Buttons */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-700">इस जनहित खबर को मित्रों से साझा करें:</span>
          <div className="flex items-center gap-2">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `*${article.title}*\n\nपूरी खबर पढ़ें 'ब्रेकिंग न्यूज़ वाला' पर:\nhttps://breakingnewswala.com/article/${article.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              व्हाट्सएप
            </a>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'लिंक कॉपी हो गया!' : 'लिंक कॉपी करें'}
            </button>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-[#ED1727] rounded-full inline-block" />
              अन्य संबंधित खबरें (मध्य प्रदेश)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedArticles.slice(0, 4).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onRelatedArticleClick(rel.id)}
                  className="p-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:shadow-xs transition-all cursor-pointer flex gap-3"
                >
                  {rel.featuredImage && (
                    <img
                      src={rel.featuredImage}
                      alt={rel.title}
                      className="w-20 h-16 object-cover rounded shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#344FD6] uppercase">
                      {rel.districtName || rel.categoryName}
                    </span>
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5 leading-snug">
                      {rel.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
