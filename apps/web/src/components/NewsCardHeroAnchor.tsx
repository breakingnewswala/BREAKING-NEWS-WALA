/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Hero Anchor News Card Component (COMP-PUB-001)
 * Grounded in docs/07-Design.md Section 10.2 and docs/09-Components.md Section 5.1
 */

import React from 'react';
import Link from 'next/link';
import { PublicArticle } from '../lib/types';

interface NewsCardHeroAnchorProps {
  article?: PublicArticle;
  story?: PublicArticle;
  priority?: boolean;
}

export const NewsCardHeroAnchor: React.FC<NewsCardHeroAnchorProps> = ({
  article: propArticle,
  story,
  priority = true,
}) => {
  const article = propArticle || story;
  if (!article) return null;
  const publishedDate = article.publishedAt
    ? new Intl.DateTimeFormat('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      }).format(new Date(article.publishedAt))
    : '';

  const fallbackImage = '/brand/logo.png';
  const imageUrl = article.featuredImageUrl || fallbackImage;

  return (
    <article className="news-card-hover group flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Link href={`/news/${article.slug}`} className="block relative overflow-hidden bg-gray-100" style={{ aspectRatio: '16 / 9' }}>
        <img
          src={imageUrl}
          alt={article.imageCaption || article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
        />
        {article.isBreaking && (
          <span className="absolute top-3 left-3 bg-[#ED1727] text-white text-xs font-bold px-2.5 py-1 rounded shadow flex items-center gap-1.5 z-10">
            <span className="live-pulse-dot" />
            ब्रेकिंग
          </span>
        )}
      </Link>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category & District Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          {article.primaryLocationNameHi && (
            <span className="district-tag-chip">
              <span>📍</span>
              {article.primaryLocationNameHi}
            </span>
          )}
          {article.primaryCategoryNameHi && (
            <span className="category-tag-chip">
              {article.primaryCategoryNameHi}
            </span>
          )}
          <span className="text-xs text-gray-500 ml-auto">
            {publishedDate}
          </span>
        </div>

        {/* Master Headline */}
        <h2 className="news-card-title headline-h1 text-gray-900 group-hover:text-[#344FD6] transition-colors mb-2.5 line-clamp-3 font-bold">
          <Link href={`/news/${article.slug}`}>
            {article.title}
          </Link>
        </h2>

        {/* Excerpt / Lead */}
        {article.excerpt && (
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-2 mb-4">
            {article.excerpt}
          </p>
        )}

        {/* Byline Dock */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            ब्यूरो रिपोर्ट • {article.authorName || 'विशेष संवाददाता'}
          </span>
          <span className="inline-flex items-center gap-1 text-[#344FD6] font-semibold group-hover:underline">
            पूरी खबर पढ़ें →
          </span>
        </div>
      </div>
    </article>
  );
};
