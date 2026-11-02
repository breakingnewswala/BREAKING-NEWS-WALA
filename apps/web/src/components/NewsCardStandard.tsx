/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Standard Horizontal News Card Component (COMP-PUB-003)
 * Grounded in docs/07-Design.md Section 10.2 and docs/09-Components.md Section 5.1
 */

import React from 'react';
import Link from 'next/link';
import { PublicArticle } from '../lib/types';

interface NewsCardStandardProps {
  article?: PublicArticle;
  story?: PublicArticle;
}

export const NewsCardStandard: React.FC<NewsCardStandardProps> = ({ article: propArticle, story }) => {
  const article = propArticle || story;
  if (!article) return null;
  const publishedDate = article.publishedAt
    ? new Intl.DateTimeFormat('hi-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      }).format(new Date(article.publishedAt))
    : '';

  const fallbackImage = '/brand/logo.png';
  const imageUrl = article.featuredImageUrl || fallbackImage;

  return (
    <article className="news-card-hover group flex flex-row items-center gap-3 sm:gap-4 p-3 bg-white border border-gray-200 rounded-lg">
      {/* Content Side (70%) */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Metadata Badges */}
          <div className="flex items-center gap-2 text-xs mb-1.5 flex-wrap">
            {article.primaryLocationNameHi && (
              <span className="district-tag-chip text-[11px] py-0.5 px-1.5">
                📍 {article.primaryLocationNameHi}
              </span>
            )}
            {article.primaryCategoryNameHi && (
              <span className="text-[11px] font-semibold text-[#ED1727]">
                {article.primaryCategoryNameHi}
              </span>
            )}
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 text-[11px]">{publishedDate}</span>
          </div>

          {/* Headline */}
          <h3 className="news-card-title text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#344FD6] transition-colors line-clamp-2 leading-snug">
            <Link href={`/news/${article.slug}`}>
              {article.title}
            </Link>
          </h3>
        </div>

        {/* Byline / Read Time */}
        <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-2">
          <span>{article.authorName || 'डेस्क रिपोर्ट'}</span>
          {article.isBreaking && (
            <span className="text-[#ED1727] font-bold">★ ब्रेकिंग</span>
          )}
        </div>
      </div>

      {/* Media Side (30%) - Fixed Aspect Ratio to prevent CLS */}
      <Link
        href={`/news/${article.slug}`}
        className="flex-shrink-0 w-24 h-20 sm:w-32 sm:h-24 rounded overflow-hidden bg-gray-100 relative"
      >
        <img
          src={imageUrl}
          alt={article.imageCaption || article.title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </Link>
    </article>
  );
};
