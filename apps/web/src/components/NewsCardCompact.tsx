import React from 'react';
import Link from 'next/link';

interface NewsCardCompactProps {
  story: {
    id: string;
    headline: string;
    slug: string;
    rankIndex?: number;
    districtName?: string;
    publishedAt?: string;
    imageUrl?: string;
  };
}

export const NewsCardCompact: React.FC<NewsCardCompactProps> = ({ story }) => {
  return (
    <article className="group py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded px-2 -mx-2">
      <Link href={`/news/${encodeURIComponent(story.slug)}`} className="flex items-start gap-3">
        {story.rankIndex !== undefined && (
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-50 text-[#ED1727] font-bold text-sm flex items-center justify-center font-mono border border-red-100 group-hover:bg-[#ED1727] group-hover:text-white transition-colors">
            {story.rankIndex}
          </span>
        )}

        {story.imageUrl && !story.rankIndex && (
          <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-100 relative">
            <img
              src={story.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#344FD6] line-clamp-2 leading-[1.6]">
            {story.headline}
          </h4>

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-sans">
            {story.districtName && (
              <span className="text-red-700 font-medium">{story.districtName}</span>
            )}
            {story.publishedAt && (
              <span>• {new Date(story.publishedAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default NewsCardCompact;

