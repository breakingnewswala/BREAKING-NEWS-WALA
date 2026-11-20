import React, { useState } from 'react';
import {
  Video as VideoIcon,
  Play,
  ExternalLink,
  Share2,
  Plus,
  Eye,
  Clock,
  MapPin,
  Film,
  Sparkles,
} from 'lucide-react';
import { VideoPost, AppRole } from '../../types';

interface PublicVideoFeedScreenProps {
  videoPosts: VideoPost[];
  currentRole: AppRole;
  onOpenVideoManager?: () => void;
  onShareVideo?: (post: VideoPost) => void;
}

export const PublicVideoFeedScreen: React.FC<PublicVideoFeedScreenProps> = ({
  videoPosts,
  currentRole,
  onOpenVideoManager,
  onShareVideo,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'FACEBOOK' | 'INSTAGRAM'>('ALL');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const canManageVideos = ['MASTER_ADMIN', 'ADMIN'].includes(currentRole);

  const filteredPosts = videoPosts.filter((post) => {
    if (post.status !== 'PUBLISHED' && !canManageVideos) return false;
    if (platformFilter === 'ALL') return true;
    return post.platform === platformFilter;
  });

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return { label: 'Facebook Video', bg: 'bg-blue-600 text-white', icon: 'FB' };
      case 'INSTAGRAM':
        return { label: 'Instagram Reel', bg: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white', icon: 'IG' };
      case 'YOUTUBE':
        return { label: 'YouTube Video', bg: 'bg-red-600 text-white', icon: 'YT' };
      default:
        return { label: 'वीडियो', bg: 'bg-slate-700 text-white', icon: 'VID' };
    }
  };

  return (
    <div className="w-full min-h-[calc(100dvh-56px-56px)] bg-slate-950 text-white pb-20">
      {/* 1. Header & Controls */}
      <div className="sticky top-[53px] z-30 bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600 rounded-lg text-white shadow-xs">
              <VideoIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white font-news-hero tracking-wide flex items-center gap-1.5">
                <span>बीएनडब्ल्यू वीडियो डेस्क</span>
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                  LIVE FEED
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">
                फेसबुक एवं इंस्टाग्राम से सत्यापित डिजिटल ग्राउंड रिपोर्ट्स
              </p>
            </div>
          </div>

          {/* Admin "+ नया वीडियो जोड़ें" Button */}
          {canManageVideos && onOpenVideoManager && (
            <button
              onClick={onOpenVideoManager}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">नया वीडियो लिंक जोड़ें</span>
              <span className="sm:hidden">जोड़ें</span>
            </button>
          )}
        </div>

        {/* Platform Filter Tabs */}
        <div className="max-w-3xl mx-auto flex items-center gap-2 mt-2 pt-1 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setPlatformFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              platformFilter === 'ALL'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            सभी वीडियो ({videoPosts.length})
          </button>
          <button
            onClick={() => setPlatformFilter('FACEBOOK')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              platformFilter === 'FACEBOOK'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Facebook ({videoPosts.filter((p) => p.platform === 'FACEBOOK').length})
          </button>
          <button
            onClick={() => setPlatformFilter('INSTAGRAM')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              platformFilter === 'INSTAGRAM'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Instagram Reels ({videoPosts.filter((p) => p.platform === 'INSTAGRAM').length})
          </button>
        </div>
      </div>

      {/* 2. Main Feed Stream */}
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Film className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">कोई वीडियो उपलब्ध नहीं है</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              एडमिन द्वारा फेसबुक या इंस्टाग्राम वीडियो लिंक जोड़े जाने पर वे यहाँ लाइव प्रदर्शित होंगे।
            </p>
            {canManageVideos && onOpenVideoManager && (
              <button
                onClick={onOpenVideoManager}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
              >
                + पहला वीडियो URL जोड़ें
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => {
            const badge = getPlatformBadge(post.platform);
            const isPlaying = activeVideoId === post.id;

            return (
              <article
                key={post.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-slate-700"
              >
                {/* Video Player / Preview Frame */}
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  {isPlaying && post.embedUrl ? (
                    <iframe
                      src={post.embedUrl}
                      title={post.title}
                      className="w-full h-full border-0"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"
                    />
                  ) : (
                    <div
                      onClick={() => setActiveVideoId(post.id)}
                      className="w-full h-full relative cursor-pointer group flex items-center justify-center"
                    >
                      {/* Thumbnail or Fallback */}
                      {post.thumbnailUrl ? (
                        <img
                          src={post.thumbnailUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                          <VideoIcon className="w-10 h-10 text-slate-600 mb-2" />
                          <span className="text-xs text-slate-400 font-bold">{badge.label}</span>
                        </div>
                      )}

                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />

                      {/* Play Button */}
                      <div className="absolute w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-red-600 transition-all">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>

                      {/* Platform Tag */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {post.category && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 text-[10px] font-bold border border-slate-700">
                            {post.category}
                          </span>
                        )}
                      </div>

                      {/* Views Count */}
                      {post.viewsCount && (
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 rounded-full text-[10px] text-slate-300 font-mono flex items-center gap-1 backdrop-blur-xs">
                          <Eye className="w-3 h-3" />
                          <span>{post.viewsCount.toLocaleString('hi-IN')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2.5">
                  <h2 className="text-sm sm:text-base font-bold text-white font-news-hero leading-snug">
                    {post.title}
                  </h2>

                  {post.caption && (
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {post.caption}
                    </p>
                  )}

                  {/* Fallback Notice for Browser Sandboxing */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      {post.authorName && (
                        <span className="font-medium text-slate-300 truncate">
                          {post.authorName}
                        </span>
                      )}
                      {post.districtId && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <MapPin className="w-3 h-3" />
                          <span>{post.districtId.replace('dist-', '')}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors"
                        title="मूल ऐप या वेबसाइट में देखें"
                      >
                        <span>मूल ऐप में खोलें</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => {
                          if (onShareVideo) {
                            onShareVideo(post);
                          } else if (navigator.share) {
                            navigator.share({
                              title: post.title,
                              text: post.caption,
                              url: post.url,
                            }).catch(() => {});
                          }
                        }}
                        className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 transition-colors"
                        title="शेयर करें"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
