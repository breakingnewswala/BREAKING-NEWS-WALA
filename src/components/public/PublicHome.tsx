import React from 'react';
import { 
  Clock, 
  Eye, 
  Share2, 
  Bookmark, 
  MapPin, 
  Play, 
  Flame, 
  TrendingUp, 
  ChevronRight, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Article, AdBanner } from '../../types/index.ts';

interface PublicHomeProps {
  articles: Article[];
  selectedDistrict: string;
  onOpenDistrictModal: () => void;
  onSelectArticle: (article: Article) => void;
  onOpenReelsModal: (article: Article) => void;
  savedArticleIds: string[];
  onToggleBookmark: (id: string) => void;
  onShareArticle: (article: Article) => void;
  ads: AdBanner[];
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  articles,
  selectedDistrict,
  onOpenDistrictModal,
  onSelectArticle,
  onOpenReelsModal,
  savedArticleIds,
  onToggleBookmark,
  onShareArticle,
  ads
}) => {
  // Extract Lead / Breaking Story
  const leadStory = articles.find(a => a.isLeadStory) || articles[0];
  const secondaryStories = articles.filter(a => a.id !== leadStory?.id).slice(0, 4);

  // Hyperlocal District News
  const districtNews = articles.filter(a => 
    a.district.toLowerCase().includes(selectedDistrict.toLowerCase()) || 
    (a.city && a.city.toLowerCase().includes(selectedDistrict.toLowerCase()))
  );

  // Video and Reels Stories
  const videoStories = articles.filter(a => a.videoUrl || a.isReel);

  // Trending Stories
  const trendingStories = [...articles].sort((a, b) => (b.views + b.shares * 3) - (a.views + a.shares * 3)).slice(0, 5);

  const topAd = ads.find(a => a.placement === 'top_leaderboard' && a.isActive);
  const inFeedAd = ads.find(a => a.placement === 'in_feed' && a.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      {/* Top Leaderboard Ad */}
      {topAd && (
        <div className="w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
          <div className="absolute top-1 right-2 text-[9px] uppercase tracking-wider text-gray-700 bg-white/80 px-1.5 py-0.5 rounded font-bold">
            विज्ञापन
          </div>
          <a href={topAd.targetUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={topAd.imageUrl} 
              alt={topAd.title} 
              className="w-full h-24 sm:h-32 object-cover" 
            />
          </a>
        </div>
      )}

      {/* Hero Section: Lead Story & Secondary Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Anchor Story */}
        {leadStory && (
          <div className="lg:col-span-8 bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col">
            <div className="relative aspect-video w-full overflow-hidden group cursor-pointer" onClick={() => onSelectArticle(leadStory)}>
              <img 
                src={leadStory.thumbnail} 
                alt={leadStory.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded shadow-xs uppercase tracking-wide">
                  बड़ी खबर
                </span>
                <span className="bg-black/60 backdrop-blur-xs text-yellow-300 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-400" />
                  {leadStory.district}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug drop-shadow-md hover:text-yellow-300 transition">
                  {leadStory.title}
                </h1>
                {leadStory.subtitle && (
                  <p className="hidden sm:block text-xs sm:text-sm text-gray-200 mt-2 line-clamp-2 drop-shadow-xs">
                    {leadStory.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Meta & Actions */}
            <div className="p-4 bg-white flex items-center justify-between text-xs text-gray-600 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-900">{leadStory.authorName}</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {leadStory.readingTimeMinutes} मिनट पठन
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Eye className="w-3.5 h-3.5" />
                  {leadStory.views.toLocaleString('hi-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onToggleBookmark(leadStory.id)}
                  className={`p-1.5 rounded-full hover:bg-gray-100 transition ${
                    savedArticleIds.includes(leadStory.id) ? 'text-red-600 fill-red-600' : 'text-gray-500'
                  }`}
                  title="सेव करें"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onShareArticle(leadStory)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition"
                  title="शेयर करें"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Stories Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1 border-b-2 border-red-600">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-600" />
              प्रमुख सुर्खियां
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {secondaryStories.map(story => (
              <div 
                key={story.id}
                onClick={() => onSelectArticle(story)}
                className="bg-white p-3 rounded-lg border border-gray-200 hover:border-red-400 hover:shadow-xs transition cursor-pointer flex gap-3 group"
              >
                <img 
                  src={story.thumbnail} 
                  alt={story.title} 
                  className="w-24 h-20 rounded object-cover shrink-0 group-hover:scale-105 transition"
                />
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-[11px] text-red-600 font-bold mb-1">
                    <span>{story.category}</span>
                    <span>•</span>
                    <span className="text-gray-500">{story.district}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-600 transition">
                    {story.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {story.readingTimeMinutes} मिनट
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {story.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hyper-Local District News Section */}
      <section className="bg-amber-50/60 p-4 sm:p-6 rounded-2xl border border-amber-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-amber-200">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              जिलास्तरीय विशेष कवरेज
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              मेरा शहर / मेरा जिला : <span className="text-red-600">{selectedDistrict}</span>
            </h2>
          </div>
          
          <button
            onClick={onOpenDistrictModal}
            className="flex items-center gap-1.5 bg-white hover:bg-amber-100 text-gray-800 border border-amber-300 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-xs"
          >
            जिला बदलें
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {districtNews.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">
            इस जिले ({selectedDistrict}) के लिए वर्तमान में कोई नई खबर उपलब्ध नहीं है। हमारे रिपोर्टर शीघ्र ही अपडेट करेंगे।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {districtNews.map(story => (
              <div
                key={story.id}
                onClick={() => onSelectArticle(story)}
                className="bg-white rounded-xl overflow-hidden border border-amber-200 hover:shadow-md transition cursor-pointer flex flex-col group"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <img 
                    src={story.thumbnail} 
                    alt={story.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    {story.city || story.district}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-600 transition mb-2">
                    {story.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-2 mt-auto">
                    <span>{story.authorName}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {story.readingTimeMinutes} मि.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Multimedia Stream: Video & Reels */}
      {videoStories.length > 0 && (
        <section className="bg-gray-900 text-white p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
            <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
              <Play className="w-5 h-5 text-red-500 fill-red-500" />
              वीडियो और रील्स (Shorts & Video Reports)
            </h2>
            <span className="text-xs text-gray-400">9:16 वर्टिकल न्यूज़</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {videoStories.map(story => (
              <div
                key={story.id}
                onClick={() => onOpenReelsModal(story)}
                className="relative aspect-9/16 rounded-xl overflow-hidden border border-gray-800 group cursor-pointer hover:border-red-500 transition shadow-lg"
              >
                <img 
                  src={story.thumbnail} 
                  alt={story.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                {/* Play Button Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-yellow-300 font-bold">
                  {story.district}
                </div>

                <div className="absolute bottom-3 left-2 right-2">
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                    {story.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* In-Feed Ad Banner */}
      {inFeedAd && (
        <div className="w-full bg-amber-50 rounded-lg overflow-hidden border border-amber-200 relative my-6">
          <div className="absolute top-1 right-2 text-[9px] uppercase tracking-wider text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded font-bold">
            प्रायोजित विज्ञापन
          </div>
          <a href={inFeedAd.targetUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={inFeedAd.imageUrl} 
              alt={inFeedAd.title} 
              className="w-full h-24 sm:h-28 object-cover" 
            />
          </a>
        </div>
      )}

      {/* Categorized Feed & Trending List */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* All Stories Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
            <h2 className="text-lg font-black text-gray-950">
              ताज़ा डिजिटल समाचार
            </h2>
            <span className="text-xs text-gray-500 font-bold">
              कुल {articles.length} खबरें
            </span>
          </div>

          <div className="space-y-4">
            {articles.slice(0, 10).map(story => (
              <div
                key={story.id}
                onClick={() => onSelectArticle(story)}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row gap-4 group"
              >
                <img 
                  src={story.thumbnail} 
                  alt={story.title} 
                  className="w-full sm:w-44 h-32 rounded-lg object-cover group-hover:scale-102 transition"
                />
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold mb-1.5">
                      <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        {story.category}
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {story.district}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-950 leading-snug group-hover:text-red-600 transition">
                      {story.title}
                    </h3>
                    {story.subtitle && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {story.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 mt-3">
                    <span className="font-semibold text-gray-700">{story.authorName}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {story.readingTimeMinutes} मि.
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {story.views}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Trending Stories & Engagement */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <h3 className="text-base font-black text-gray-950 flex items-center gap-2 pb-2 border-b border-gray-200 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              सबसे ज्यादा पढ़ी गई खबरें (Trending)
            </h3>

            <div className="space-y-3">
              {trendingStories.map((story, idx) => (
                <div
                  key={story.id}
                  onClick={() => onSelectArticle(story)}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition group"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    idx === 0 
                      ? 'bg-red-600 text-white' 
                      : idx === 1 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-red-600 line-clamp-2 leading-snug">
                      {story.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                      <span>{story.district}</span>
                      <span>•</span>
                      <span>{story.views} व्यूज</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
