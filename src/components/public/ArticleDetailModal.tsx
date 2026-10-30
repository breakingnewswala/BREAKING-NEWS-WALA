import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Eye, 
  Share2, 
  Bookmark, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Check, 
  MessageSquare, 
  AlertTriangle,
  Send
} from 'lucide-react';
import { Article } from '../../types/index.ts';

interface ArticleDetailModalProps {
  article: Article;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
  onSelectRelatedArticle: (article: Article) => void;
  relatedArticles: Article[];
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onShare,
  onSelectRelatedArticle,
  relatedArticles
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large': return 'text-lg leading-relaxed';
      case 'xlarge': return 'text-xl leading-loose';
      default: return 'text-base leading-relaxed';
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `*${article.title}*\n\nपढ़ें पूरी खबर BREAKING NEWS WALA पर:\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleToggleAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(`${article.title}. ${article.content}`);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } else {
      alert('आपके ब्राउज़र में ऑडियो वाचन समर्थित नहीं है।');
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setShowFeedbackModal(false);
      setFeedbackSent(false);
      setFeedbackText('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-6 border border-gray-200 relative flex flex-col max-h-[92vh]">
        
        {/* Sticky Action Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              {article.category}
            </span>
            <span className="text-gray-500 text-xs flex items-center gap-1 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              {article.district}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Scaler */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-xs font-bold">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded transition ${fontSize === 'normal' ? 'bg-white shadow-xs text-red-600' : 'text-gray-600'}`}
                title="सामान्य फ़ॉन्ट"
              >
                अ
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded transition ${fontSize === 'large' ? 'bg-white shadow-xs text-red-600' : 'text-gray-600'}`}
                title="बड़ा फ़ॉन्ट"
              >
                अ+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 rounded transition ${fontSize === 'xlarge' ? 'bg-white shadow-xs text-red-600' : 'text-gray-600'}`}
                title="विशाल फ़ॉन्ट"
              >
                अ++
              </button>
            </div>

            {/* Audio Reader */}
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-full border transition flex items-center gap-1 text-xs font-semibold ${
                isPlayingAudio 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
              }`}
              title={isPlayingAudio ? 'ऑडियो रोकें' : 'खबर सुनें'}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4 text-red-600 animate-pulse" /> : <Volume2 className="w-4 h-4 text-gray-700" />}
              <span className="hidden sm:inline">{isPlayingAudio ? 'रोकें' : 'सुनें'}</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={onToggleBookmark}
              className={`p-2 rounded-full border transition ${
                isBookmarked 
                  ? 'bg-red-50 text-red-600 border-red-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
              }`}
              title="सेव करें"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-red-600' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black transition"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6">
          {/* Main Headline */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-950 leading-tight">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-sm sm:text-base text-gray-700 font-semibold mt-3 leading-snug border-l-4 border-amber-500 pl-3">
                {article.subtitle}
              </p>
            )}
          </div>

          {/* Byline and Time */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                रिपोर्टर: {article.authorName}
              </span>
              {article.isTrustedPublish && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  सत्यापित पत्रकार
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(article.createdAt).toLocaleDateString('hi-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.views} व्यूज
              </span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="rounded-xl overflow-hidden shadow-xs border border-gray-200">
            <img 
              src={article.thumbnail} 
              alt={article.title} 
              className="w-full max-h-[450px] object-cover"
            />
            <div className="p-2 bg-gray-50 text-[11px] text-gray-500 text-center">
              चित्र साभार: ग्राउंड रिपोर्ट / BREAKING NEWS WALA आर्काइव
            </div>
          </div>

          {/* Social Share Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-red-600" />
              इस खबर को शेयर करें:
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs"
              >
                WhatsApp
              </button>
              <button
                onClick={handleCopyLink}
                className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                {copiedLink ? 'कॉपी हो गया' : 'लिंक कॉपी'}
              </button>
            </div>
          </div>

          {/* Full Article Content */}
          <div className={`text-gray-900 font-normal space-y-4 whitespace-pre-line ${getFontSizeClass()}`}>
            {article.content}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-500">संबंधित टैग्स:</span>
              {article.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Report an Error / Feedback */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>क्या इस खबर में कोई तथ्य त्रुटिपूर्ण है? हमें अवगत कराएं।</span>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="text-xs font-bold bg-white text-amber-900 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 transition shrink-0"
            >
              त्रुटि दर्ज करें
            </button>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="pt-6 border-t border-gray-200 space-y-4">
              <h3 className="text-lg font-black text-gray-950">
                संबंधित अन्य खबरें (Related News)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.slice(0, 4).map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelatedArticle(rel)}
                    className="p-3 bg-gray-50 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-300 transition cursor-pointer flex gap-3 group"
                  >
                    <img 
                      src={rel.thumbnail} 
                      alt={rel.title} 
                      className="w-16 h-16 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] text-red-600 font-bold">{rel.category}</span>
                      <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-600 line-clamp-2">
                        {rel.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Report an Error Form */}
        {showFeedbackModal && (
          <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  संपादकीय प्रतिक्रिया / त्रुटि निवारण
                </h4>
                <button onClick={() => setShowFeedbackModal(false)}>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {feedbackSent ? (
                <div className="py-6 text-center text-emerald-700 text-sm font-bold flex flex-col items-center gap-2">
                  <Check className="w-8 h-8 text-emerald-600 bg-emerald-100 p-1.5 rounded-full" />
                  आपकी प्रतिक्रिया दर्ज कर ली गई है। संपादकीय टीम इसकी समीक्षा करेगी।
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="mt-3 space-y-3">
                  <p className="text-xs text-gray-600">
                    खबर: <span className="font-bold">{article.title.slice(0, 50)}...</span>
                  </p>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder="कृपया बताएं कि क्या तथ्यात्मक त्रुटि या संशोधन अपेक्षित है..."
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(false)}
                      className="px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded text-xs font-bold bg-red-600 text-white hover:bg-red-700 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      भेजें
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
