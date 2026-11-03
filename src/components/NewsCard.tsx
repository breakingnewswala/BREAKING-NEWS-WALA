import React from 'react';
import { Share2, Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import { ArticleItem } from '../types';

interface NewsCardProps {
  article: ArticleItem;
  isBookmarked?: boolean;
  onArticleClick: (id: string) => void;
  onBookmarkToggle?: (id: string, e: React.MouseEvent) => void;
  onShareClick?: (article: ArticleItem, e: React.MouseEvent) => void;
  featured?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  isBookmarked = false,
  onArticleClick,
  onBookmarkToggle,
  onShareClick,
  featured = false,
}) => {
  return (
    <article
      onClick={() => onArticleClick(article.id)}
      className={`group bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col ${
        featured ? 'ring-1 ring-red-500/20' : ''
      }`}
    >
      {/* Featured Image */}
      {article.featuredImage && (
        <div className={`relative w-full overflow-hidden bg-slate-100 ${featured ? 'h-52 md:h-64' : 'h-44'}`}>
          <img
            src={article.featuredImage}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />

          {/* Breaking News Ribbon */}
          {article.isBreaking && (
            <div className="absolute top-2.5 left-2.5 bg-[#ED1727] text-white text-[11px] font-extrabold px-2.5 py-1 rounded shadow-md tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              ब्रेकिंग न्यूज़
            </div>
          )}

          {/* District Tag Overlay on bottom right of image */}
          {article.districtName && (
            <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded">
              📍 {article.districtName}
            </span>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="p-3.5 md:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata Row: Category • District • Time */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
            {article.categoryName && (
              <span className="font-bold text-[#344FD6] uppercase tracking-wide">
                {article.categoryName}
              </span>
            )}
            {article.categoryName && article.publishedAt && <span>•</span>}
            {article.publishedAt && <span>{article.publishedAt}</span>}
          </div>

          {/* Title / Headline */}
          <h3
            className={`font-bold text-slate-900 leading-snug group-hover:text-[#ED1727] transition-colors line-clamp-3 ${
              featured ? 'text-base md:text-lg' : 'text-sm md:text-base'
            }`}
          >
            {article.title}
          </h3>

          {/* Summary / Excerpt */}
          {article.summary && (
            <p className="mt-1.5 text-xs md:text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {article.summary}
            </p>
          )}
        </div>

        {/* Footer Actions: Reporter Info & Buttons */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[65%]">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-[10px] shrink-0">
              {article.authorName ? article.authorName[0] : 'बी'}
            </span>
            <span className="truncate text-slate-700 font-medium">
              {article.authorName || 'बीएनडब्ल्यू विशेष संवाददाता'}
            </span>
            <span title="सत्यापित संवाददाता">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Bookmark button */}
            {onBookmarkToggle && (
              <button
                type="button"
                onClick={(e) => onBookmarkToggle(article.id, e)}
                aria-label="बुकमार्क करें"
                className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors ${
                  isBookmarked ? 'text-[#ED1727]' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}

            {/* Share button */}
            {onShareClick && (
              <button
                type="button"
                onClick={(e) => onShareClick(article, e)}
                aria-label="शेयर करें"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
