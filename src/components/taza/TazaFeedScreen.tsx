import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  ExternalLink,
  Flame,
  Radio,
  Clock,
  MapPin,
  User,
  X,
  Sparkles,
} from 'lucide-react';
import { ArticleItem } from '../../types';

interface TazaFeedScreenProps {
  articles: ArticleItem[];
  bookmarkedIds?: string[];
  onBookmarkToggle?: (articleId: string) => void;
  onShareArticle?: (article: ArticleItem) => void;
  onEarnCoins?: (amount: number) => void;
  onArticleClick?: (articleId: string) => void;
}

const TAZA_CATEGORIES = [
  { id: 'all', nameHi: 'सभी खबरें' },
  { id: 'madhya-pradesh', nameHi: 'मध्य प्रदेश' },
  { id: 'politics', nameHi: 'राजनीति' },
  { id: 'crime', nameHi: 'क्राइम / अपराध' },
  { id: 'business', nameHi: 'व्यापार व मंडी' },
  { id: 'sports', nameHi: 'खेल जगत' },
  { id: 'entertainment', nameHi: 'मनोरंजन' },
  { id: 'lifestyle', nameHi: 'धर्म व संस्कृति' },
];

export const TazaFeedScreen: React.FC<TazaFeedScreenProps> = ({
  articles,
  bookmarkedIds = [],
  onBookmarkToggle,
  onShareArticle,
  onEarnCoins,
  onArticleClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showFullArticle, setShowFullArticle] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchMoveXRef = useRef<number>(0);
  const touchMoveYRef = useRef<number>(0);

  // Filter approved/published articles
  const filteredArticles = useMemo(() => {
    const published = articles.filter(
      (a) => !a.status || a.status === 'PUBLISHED' || a.status === 'APPROVED'
    );
    if (selectedCategory === 'all') return published;
    return published.filter((a) => {
      const cat = (a.categoryName || a.category || a.categoryId || '').toLowerCase();
      if (selectedCategory === 'madhya-pradesh') {
        return cat.includes('mp') || cat.includes('मध्य') || cat.includes('प्रदेश');
      }
      if (selectedCategory === 'politics') {
        return cat.includes('politi') || cat.includes('राजनीति') || cat.includes('शासन');
      }
      if (selectedCategory === 'crime') {
        return cat.includes('crime') || cat.includes('अपराध') || cat.includes('हादसा');
      }
      if (selectedCategory === 'business') {
        return cat.includes('business') || cat.includes('व्यापार') || cat.includes('मंडी');
      }
      if (selectedCategory === 'sports') {
        return cat.includes('sport') || cat.includes('खेल');
      }
      if (selectedCategory === 'entertainment') {
        return cat.includes('entertain') || cat.includes('मनोरंजन') || cat.includes('सिनेमा');
      }
      if (selectedCategory === 'lifestyle') {
        return cat.includes('धर्म') || cat.includes('संस्कृति') || cat.includes('life');
      }
      return false;
    });
  }, [articles, selectedCategory]);

  // Keep index within bounds
  useEffect(() => {
    setCurrentIndex(0);
    setShowFullArticle(false);
  }, [selectedCategory]);

  const currentArticle = filteredArticles[currentIndex] || null;

  // Next / Previous Story Actions
  const handleNextStory = useCallback(() => {
    if (isAnimating) return;
    if (currentIndex < filteredArticles.length - 1) {
      setIsAnimating(true);
      setDirection('up');
      setCurrentIndex((prev) => prev + 1);
      setShowFullArticle(false);
      onEarnCoins?.(1);
      setTimeout(() => {
        setIsAnimating(false);
        setDirection('none');
      }, 300);
    }
  }, [currentIndex, filteredArticles.length, isAnimating, onEarnCoins]);

  const handlePrevStory = useCallback(() => {
    if (isAnimating) return;
    if (currentIndex > 0) {
      setIsAnimating(true);
      setDirection('down');
      setCurrentIndex((prev) => prev - 1);
      setShowFullArticle(false);
      setTimeout(() => {
        setIsAnimating(false);
        setDirection('none');
      }, 300);
    }
  }, [currentIndex, isAnimating]);

  // Next / Previous Category Actions
  const handleNextCategory = useCallback(() => {
    const catIdx = TAZA_CATEGORIES.findIndex((c) => c.id === selectedCategory);
    if (catIdx < TAZA_CATEGORIES.length - 1) {
      setSelectedCategory(TAZA_CATEGORIES[catIdx + 1].id);
    } else {
      setSelectedCategory(TAZA_CATEGORIES[0].id);
    }
  }, [selectedCategory]);

  const handlePrevCategory = useCallback(() => {
    const catIdx = TAZA_CATEGORIES.findIndex((c) => c.id === selectedCategory);
    if (catIdx > 0) {
      setSelectedCategory(TAZA_CATEGORIES[catIdx - 1].id);
    } else {
      setSelectedCategory(TAZA_CATEGORIES[TAZA_CATEGORIES.length - 1].id);
    }
  }, [selectedCategory]);

  // Touch Gesture Handling (Distinguish Vertical Story Swipe from Horizontal Category Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchMoveXRef.current = e.touches[0].clientX;
    touchMoveYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchMoveXRef.current = e.touches[0].clientX;
    touchMoveYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchMoveXRef.current - touchStartXRef.current;
    const deltaY = touchMoveYRef.current - touchStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const SWIPE_THRESHOLD = 45;

    // Determine primary gesture axis
    if (absY > absX && absY > SWIPE_THRESHOLD) {
      // Vertical gesture: Story navigation
      if (deltaY < 0) {
        // Swiped UP -> Next Story
        handleNextStory();
      } else {
        // Swiped DOWN -> Previous Story
        handlePrevStory();
      }
    } else if (absX > absY && absX > SWIPE_THRESHOLD) {
      // Horizontal gesture: Category navigation
      if (deltaX < 0) {
        // Swiped LEFT -> Next Category
        handleNextCategory();
      } else {
        // Swiped RIGHT -> Previous Category
        handlePrevCategory();
      }
    }
  };

  // Keyboard navigation for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFullArticle) return;
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevStory();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextStory();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCategory();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCategory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextStory, handlePrevStory, handleNextCategory, handlePrevCategory, showFullArticle]);

  // Audio Read-aloud (SpeechSynthesis)
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!currentArticle) return;
    const textToRead = `${currentArticle.title}। ${currentArticle.summary || currentArticle.content || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'hi-IN';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentIndex, selectedCategory]);

  const isBookmarked = currentArticle ? bookmarkedIds.includes(currentArticle.id) : false;

  return (
    <div
      className="w-full flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden relative"
      style={{ minHeight: 'calc(100dvh - 56px - 56px)', height: 'calc(100dvh - 56px - 56px)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Category Switcher Indicator Bar */}
      <div className="shrink-0 bg-slate-950/95 border-b border-slate-800 px-2 py-1.5 z-20 backdrop-blur-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-black shrink-0 tracking-wider">
            <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>ताज़ा</span>
          </div>
          {TAZA_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-xs scale-102'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.nameHi}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Story Stage */}
      {filteredArticles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <Flame className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">इस श्रेणी में कोई ताज़ा खबर नहीं है</h3>
          <p className="text-xs text-slate-400 mb-4">कृपया अन्य श्रेणी चुनें अथवा मुख्य होम पेज देखें।</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            सभी खबरें देखें
          </button>
        </div>
      ) : currentArticle ? (
        <div
          className={`flex-1 flex flex-col justify-between overflow-hidden relative transition-all duration-300 ${
            direction === 'up'
              ? 'translate-y-2 opacity-80'
              : direction === 'down'
              ? '-translate-y-2 opacity-80'
              : 'translate-y-0 opacity-100'
          }`}
        >
          {/* Top Half: High-Impact Visual / Photograph */}
          <div className="relative w-full h-[46%] sm:h-[48%] bg-slate-950 shrink-0 overflow-hidden">
            {currentArticle.featuredImage || currentArticle.imageUrl ? (
              <img
                src={currentArticle.featuredImage || currentArticle.imageUrl}
                alt={currentArticle.title}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-radial from-slate-800 to-slate-950 p-6 text-center">
                <Radio className="w-12 h-12 text-red-500 mb-2 animate-pulse" />
                <span className="text-xs font-black tracking-widest text-red-400 uppercase">
                  BREAKING NEWS WALA
                </span>
                <span className="text-[11px] text-slate-400 font-bold mt-1">
                  मध्य प्रदेश हाइपरलोकल ग्राउंड रिपोर्ट
                </span>
              </div>
            )}

            {/* Gradient Overlays for readable tags */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/60 pointer-events-none" />

            {/* Top Tag Badges */}
            <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-1.5">
                {currentArticle.categoryName || currentArticle.category ? (
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-md shadow-xs">
                    {currentArticle.categoryName || currentArticle.category}
                  </span>
                ) : null}
                {currentArticle.districtName ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-900/85 border border-slate-700 text-amber-300 text-[10px] font-bold rounded-md">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{currentArticle.districtName}</span>
                  </span>
                ) : null}
              </div>

              {/* Feed Progress Indicator (e.g., "3 / 15") */}
              <div className="px-2 py-0.5 bg-black/60 text-slate-300 rounded-full text-[10px] font-mono font-bold backdrop-blur-xs">
                {currentIndex + 1} / {filteredArticles.length}
              </div>
            </div>

            {/* Image Attribution */}
            {(currentArticle.imageCredit || currentArticle.imageCaption) && (
              <div className="absolute bottom-2 left-3 right-3 text-[10px] text-slate-300/90 truncate drop-shadow-md">
                साभार: {currentArticle.imageCredit || currentArticle.imageCaption}
              </div>
            )}
          </div>

          {/* Bottom Half: News Headline, Structured Content & Reporter Attribution */}
          <div className="flex-1 flex flex-col justify-between px-4 py-3 bg-gradient-to-b from-slate-900 to-slate-950 overflow-y-auto">
            <div className="space-y-2">
              {/* News Headline */}
              <h2 className="text-base sm:text-lg md:text-xl font-black text-white font-news-hero leading-snug tracking-tight">
                {currentArticle.title}
              </h2>

              {/* Short News Content */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal line-clamp-4 sm:line-clamp-5">
                {currentArticle.summary || currentArticle.content || ''}
              </p>

              {/* Read Full Article Button */}
              {(currentArticle.content || '').length > 200 && (
                <button
                  onClick={() => setShowFullArticle(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  <span>विस्तार से पढ़ें (Full Report)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Footer Bar: Reporter Attribution & Interactive Action Buttons */}
            <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              {/* Reporter Attribution */}
              <div className="flex items-center gap-2 truncate pr-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="truncate text-[11px] leading-tight">
                  <p className="font-bold text-slate-200 truncate">
                    {currentArticle.authorName || 'बीएनडब्ल्यू विशेष संवाददाता'}
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>ताज़ा ग्राउंड रिपोर्ट</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions: Audio, Bookmark, Share */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={toggleSpeech}
                  title={isSpeaking ? 'ऑडियो बंद करें' : 'समाचार सुनें (Listen)'}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isSpeaking ? 'bg-amber-400 text-slate-950 font-bold animate-pulse' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle?.(currentArticle.id);
                  }}
                  title={isBookmarked ? 'बुकमार्क हटाएं' : 'सहेजें'}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isBookmarked ? 'text-amber-400 bg-amber-400/10' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onShareArticle) {
                      onShareArticle(currentArticle);
                    } else if (navigator.share) {
                      navigator.share({
                        title: currentArticle.title,
                        text: currentArticle.summary,
                        url: window.location.href,
                      }).catch(() => {});
                    }
                  }}
                  title="शेयर करें"
                  className="p-2 hover:bg-slate-800 text-slate-300 rounded-full transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. Floating Quick Swipe Buttons (Accessibility & Desktop Control) */}
      <div className="absolute right-3 bottom-14 flex flex-col gap-1.5 z-30 pointer-events-auto">
        <button
          onClick={handlePrevStory}
          disabled={currentIndex === 0}
          aria-label="पिछली खबर"
          title="पिछली खबर (स्वाइप डाउन)"
          className={`p-2 rounded-full bg-slate-800/90 text-white border border-slate-700 shadow-md backdrop-blur-xs transition-opacity ${
            currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100 cursor-pointer active:scale-95'
          }`}
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          onClick={handleNextStory}
          disabled={currentIndex >= filteredArticles.length - 1}
          aria-label="अगली खबर"
          title="अगली खबर (स्वाइप अप)"
          className={`p-2 rounded-full bg-red-600/90 text-white border border-red-500 shadow-md backdrop-blur-xs transition-opacity ${
            currentIndex >= filteredArticles.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-90 hover:opacity-100 cursor-pointer active:scale-95 animate-bounce'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Full Article Reading Slide-Up Modal / Sheet */}
      {showFullArticle && currentArticle && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col p-4 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>विस्तृत ग्राउंड रिपोर्ट</span>
            </span>
            <button
              onClick={() => setShowFullArticle(false)}
              className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4 max-w-2xl mx-auto flex-1">
            <h1 className="text-lg md:text-2xl font-black text-white font-news-hero leading-tight">
              {currentArticle.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{currentArticle.authorName || 'संवाददाता'}</span>
              <span>•</span>
              <span>{currentArticle.districtName || 'मध्य प्रदेश'}</span>
              <span>•</span>
              <span>{currentArticle.publishedAt ? new Date(currentArticle.publishedAt).toLocaleDateString('hi-IN') : 'आज'}</span>
            </div>

            {currentArticle.featuredImage || currentArticle.imageUrl ? (
              <img
                src={currentArticle.featuredImage || currentArticle.imageUrl}
                alt={currentArticle.title}
                className="w-full rounded-xl max-h-72 object-cover"
              />
            ) : null}

            <div className="text-sm md:text-base text-slate-200 leading-relaxed font-serif space-y-3 whitespace-pre-line">
              {currentArticle.content || currentArticle.summary || ''}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => onArticleClick?.(currentArticle.id)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>वेबसाइट विवरण पेज पर खोलें</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowFullArticle(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                स्वाइप फ़ीड पर लौटें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
