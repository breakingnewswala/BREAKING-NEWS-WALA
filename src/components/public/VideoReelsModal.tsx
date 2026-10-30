import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Share2, Heart, MessageCircle } from 'lucide-react';
import { Article } from '../../types/index.ts';

interface VideoReelsModalProps {
  article: Article;
  onClose: () => void;
  onShare: (article: Article) => void;
}

export const VideoReelsModal: React.FC<VideoReelsModalProps> = ({ article, onClose, onShare }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(148);

  const handleToggleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
      setLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setLiked(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Reel Card Container 9:16 Aspect Ratio */}
      <div className="relative w-full max-w-[380px] h-[85vh] max-h-[720px] rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-800 flex flex-col justify-between">
        {/* Background Video / Animated Poster */}
        {article.videoUrl ? (
          <video
            src={article.videoUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={article.thumbnail}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover brightness-75 scale-105"
          />
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
              रील्स & शॉर्ट्स
            </span>
            <span className="bg-black/60 backdrop-blur-xs text-yellow-300 px-2 py-0.5 rounded text-xs font-bold">
              {article.district}
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Center Tap to Play/Pause Indicator */}
        <div 
          onClick={() => setIsPlaying(!isPlaying)}
          className="relative z-10 flex-1 flex items-center justify-center cursor-pointer"
        >
          {!isPlaying && (
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center text-white backdrop-blur-xs">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          )}
        </div>

        {/* Right Action Bar (TikTok/Insta Style) */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4 text-white">
          <button 
            onClick={handleToggleLike}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`p-2.5 rounded-full transition ${liked ? 'bg-red-600 text-white' : 'bg-black/50 text-white group-hover:bg-red-600/80'}`}>
              <Heart className={`w-5 h-5 ${liked ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[11px] font-bold drop-shadow-xs">{likesCount}</span>
          </button>

          <button 
            onClick={() => onShare(article)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-2.5 rounded-full bg-black/50 text-white group-hover:bg-blue-600 transition">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold drop-shadow-xs">शेयर</span>
          </button>
        </div>

        {/* Bottom Content Info */}
        <div className="relative z-10 p-4 text-white pr-14 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs font-black">
              BNW
            </div>
            <span className="text-xs font-bold text-gray-200">
              {article.authorName} ({article.category})
            </span>
          </div>

          <h3 className="text-sm font-black leading-snug drop-shadow-md">
            {article.title}
          </h3>

          <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed drop-shadow-xs">
            {article.content}
          </p>
        </div>
      </div>
    </div>
  );
};
