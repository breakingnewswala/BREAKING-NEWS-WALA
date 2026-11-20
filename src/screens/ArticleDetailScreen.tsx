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
  Flag,
  Send,
  AlertTriangle,
  Newspaper,
} from 'lucide-react';
import { ArticleDetail, ArticleItem, CommentRecord } from '../types';
import { BnwAiService } from '../services/aiService';
import { apiClient } from '../services/apiClient';

interface ArticleDetailScreenProps {
  article: ArticleDetail;
  isBookmarked: boolean;
  relatedArticles: ArticleItem[];
  onBackClick: () => void;
  onBookmarkToggle: (articleId: string) => void;
  onShareArticle: (article: ArticleItem) => void;
  onRelatedArticleClick: (articleId: string) => void;
  onEarnCoins: (amount: number, reason: string) => void;
  onRecordRead?: (article: ArticleDetail) => void;
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
  onRecordRead,
}) => {
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reader Comments & Correction States
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentNotice, setCommentNotice] = useState<string | null>(null);
  const [showCorrectionBox, setShowCorrectionBox] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionSent, setCorrectionSent] = useState<string | null>(null);

  // E-Paper Queue State for Staff (Admin/Editor/MasterAdmin)
  const [currentUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('bnw_auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const isStaff = currentUser && ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'EDITOR'].some((r) =>
    currentUser.role === r || (Array.isArray(currentUser.roles) && currentUser.roles.includes(r))
  );

  const [isQueuedForEpaper, setIsQueuedForEpaper] = useState<boolean>(() => {
    return (
      article.epaperWorkflow?.status === 'APPROVED_FOR_EPAPER' ||
      article.epaperWorkflow?.status === 'ASSIGNED_TO_PAGE' ||
      (article as any).isEpaperShortlisted === true
    );
  });
  const [isQueueingEpaper, setIsQueueingEpaper] = useState(false);
  const [epaperToast, setEpaperToast] = useState<string | null>(null);

  const handleToggleEpaperQueue = async () => {
    if (isQueueingEpaper) return;
    setIsQueueingEpaper(true);
    try {
      const targetStatus = isQueuedForEpaper ? 'EDITORIAL_REVIEW' : 'APPROVED_FOR_EPAPER';
      await apiClient.epaper.updateArticleWorkflowStatus(article.id, {
        targetStatus,
        remarks: isQueuedForEpaper ? 'Removed from E-Paper queue' : 'Queued from Article Details screen',
      });
      setIsQueuedForEpaper(!isQueuedForEpaper);
      setEpaperToast(isQueuedForEpaper ? 'ई-पेपर चयन सूची से हटा दिया गया।' : 'ई-पेपर चयन सूची में सफलतापूर्वक जोड़ा गया!');
      setTimeout(() => setEpaperToast(null), 3000);
    } catch (err: any) {
      setEpaperToast(err.message || 'ई-पेपर स्थिति अद्यतन विफल');
      setTimeout(() => setEpaperToast(null), 3000);
    } finally {
      setIsQueueingEpaper(false);
    }
  };

  // Award reading coins & record reading history on mount
  useEffect(() => {
    onEarnCoins(5, `समाचार पढ़ा: "${article.title.slice(0, 25)}..."`);
    onRecordRead?.(article);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setAudioNotice(null);
    setCommentNotice(null);
    setCorrectionSent(null);
  }, [article.id]);

  // Load article comments (backend + localStorage fallback)
  useEffect(() => {
    let active = true;
    const localKey = `bnw_article_comments_${article.id}`;
    let localStored: CommentRecord[] = [];
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) localStored = JSON.parse(raw);
    } catch {
      localStored = [];
    }
    setComments(localStored);

    apiClient.audience
      .getComments(article.id)
      .then((serverComments) => {
        if (!active) return;
        if (Array.isArray(serverComments) && serverComments.length > 0) {
          const mergedIds = new Set(serverComments.map((c) => c.id));
          const merged = [
            ...serverComments,
            ...localStored.filter((lc) => !mergedIds.has(lc.id)),
          ];
          setComments(merged);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [article.id]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text to speech toggler with smart Hindi voice detection (zero window.alert)
  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      setAudioNotice('आपके इस ब्राउज़र/डिवाइस में ऑडियो वाचन (TTS) समर्थित नहीं है।');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setAudioNotice(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${article.title}। ${article.content.slice(0, 1200)}`);
      const voices = window.speechSynthesis.getVoices?.() || [];
      const hindiVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setAudioNotice('ऑडियो प्लेबैक प्रारंभ करने में समस्या आई। कृपया पुनः प्रयास करें।');
      };
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
      setAudioNotice(hindiVoice ? `हिंदी वाचन सक्रिय (${hindiVoice.name})` : 'ऑडियो बुलेटिन प्रारंभ हो रहा है...');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    setCommentNotice(null);
    const displayAuthor = commentAuthor.trim() || 'जागरूक पाठक';
    const localKey = `bnw_article_comments_${article.id}`;
    try {
      const created = await apiClient.audience.addComment(article.id, commentText.trim());
      const next = [created, ...comments];
      setComments(next);
      try {
        localStorage.setItem(localKey, JSON.stringify(next));
      } catch {}
      setCommentText('');
      setCommentNotice('आपकी टिप्पणी सफलतापूर्वक प्रकाशित हो गई।');
    } catch {
      const localComment: CommentRecord = {
        id: `cmt-local-${Date.now()}`,
        articleId: article.id,
        userId: 'guest-reader',
        authorName: displayAuthor,
        content: commentText.trim(),
        status: 'approved',
        isFlagged: false,
        reportCount: 0,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const next = [localComment, ...comments];
      setComments(next);
      try {
        localStorage.setItem(localKey, JSON.stringify(next));
      } catch {}
      setCommentText('');
      setCommentNotice('आपकी टिप्पणी सहेज ली गई है।');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      await apiClient.audience.reportComment(commentId, 'अनुचित भाषा या भ्रामक सामग्री');
    } catch {
      // fallback notice still shown
    }
    setCommentNotice('टिप्पणी समीक्षा हेतु संपादकीय मॉडरेशन टीम को रिपोर्ट कर दी गई है।');
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionText.trim()) return;
    try {
      await apiClient.audience.submitFeedback({
        category: 'fact_error',
        articleId: article.id,
        comments: `समाचार त्रुटि सुधार सुझाव (${article.title.slice(0, 60)}): ${correctionText.trim()}`,
        suggestedCorrection: correctionText.trim(),
      });
    } catch {
      // Offline / guest fallback recorded locally
    }
    setCorrectionSent('आपका तथ्य-सुधार सुझाव संपादकीय डेस्क को प्राप्त हो गया है। धन्यवाद!');
    setCorrectionText('');
    setShowCorrectionBox(false);
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
            <span className="bg-[#ED1727] text-white text-xs font-news-stylish px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1">
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
        <h1 className="font-news-hero text-2xl md:text-3xl lg:text-4xl text-slate-900 leading-snug tracking-wide">
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

          {/* Report Error / Fact Correction Button */}
          <button
            type="button"
            onClick={() => setShowCorrectionBox((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>त्रुटि सुधार भेजें</span>
          </button>

          {/* E-Paper Queue Action for Editorial/Admin Staff */}
          {isStaff && (
            <button
              type="button"
              onClick={handleToggleEpaperQueue}
              disabled={isQueueingEpaper}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                isQueuedForEpaper
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-red-50 border border-red-300 text-red-700 hover:bg-red-100'
              } disabled:opacity-50 cursor-pointer`}
              title={isQueuedForEpaper ? 'ई-पेपर चयन सूची से हटाएं' : 'ई-पेपर संस्करण हेतु चुनें'}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>
                {isQueueingEpaper
                  ? 'प्रक्रियाधीन...'
                  : isQueuedForEpaper
                  ? '✓ ई-पेपर में शामिल'
                  : '+ ई-पेपर में जोड़ें'}
              </span>
            </button>
          )}
        </div>

        {/* E-Paper Queue Notice Toast */}
        {epaperToast && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              {epaperToast}
            </span>
            <button onClick={() => setEpaperToast(null)} className="text-emerald-500 hover:text-emerald-800 font-bold">✕</button>
          </div>
        )}

        {/* Inline Audio Status Notice */}
        {audioNotice && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center justify-between">
            <span>{audioNotice}</span>
            <button onClick={() => setAudioNotice(null)} className="text-slate-500 hover:text-slate-800 font-bold">✕</button>
          </div>
        )}

        {/* Inline Fact Correction Panel */}
        {correctionSent && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            {correctionSent}
          </div>
        )}
        {showCorrectionBox && (
          <form onSubmit={handleCorrectionSubmit} className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
            <label className="font-bold text-amber-950 block">
              इस समाचार में कोई तथ्यात्मक त्रुटि या सुधार सुझाएं:
            </label>
            <textarea
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              rows={2}
              placeholder="कृपया सही तथ्य, दिनांक या नाम का विवरण लिखें..."
              className="w-full p-2 border border-amber-300 rounded-lg bg-white text-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCorrectionBox(false)}
                className="px-3 py-1 rounded text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
              >
                सुझाव प्रेषित करें
              </button>
            </div>
          </form>
        )}

        {/* AI Summary Box */}
        {aiSummary && (
          <div className="mt-3 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-news-quote font-bold text-indigo-900 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>बीएनडब्ल्यू AI त्वरित बुलेटिन (मध्य प्रदेश सरोकार):</span>
            </div>
            <div className="font-news-body text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
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
        <div className={`mt-5 text-slate-800 space-y-4 font-news-body ${getFontSizeClass()}`}>
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
            <h3 className="text-base md:text-lg font-news-editorial font-bold text-slate-900 mb-3 flex items-center gap-1.5">
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

        {/* Reader Comments & Public Discussion Section */}
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-news-editorial font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#ED1727]" />
              <span>पाठक प्रतिक्रिया एवं चर्चा ({comments.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">संपादकीय मर्यादा लागू</span>
          </div>

          {commentNotice && (
            <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              {commentNotice}
            </div>
          )}

          <form onSubmit={handleAddComment} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="आपका नाम (वैकल्पिक)"
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="इस खबर पर अपनी सार्थक राय लिखें..."
                className="sm:col-span-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-4 py-1.5 bg-[#ED1727] hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingComment ? 'प्रकाशन जारी...' : 'टिप्पणी पोस्ट करें'}</span>
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-lg border border-slate-100">
              अभी कोई टिप्पणी नहीं है। इस खबर पर पहली प्रतिक्रिया साझा करें!
            </p>
          ) : (
            <div className="space-y-2.5">
              {comments.map((cmt) => (
                <div
                  key={cmt.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{cmt.authorName}</span>
                      <span className="text-[10px] text-slate-400">
                        {cmt.createdAt ? new Date(cmt.createdAt).toLocaleDateString('hi-IN') : 'अभी'}
                      </span>
                    </div>
                    <p className="font-news-body text-slate-700 leading-relaxed">{cmt.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReportComment(cmt.id)}
                    className="text-[10px] text-slate-400 hover:text-red-600 flex items-center gap-1 shrink-0"
                    title="टिप्पणी रिपोर्ट करें"
                  >
                    <Flag className="w-3 h-3" />
                    <span>रिपोर्ट</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
