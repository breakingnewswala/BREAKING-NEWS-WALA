import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface NewsFeedSectionHeaderProps {
  titleHindi: string;
  viewAllHref?: string;
  badge?: string;
  className?: string;
}

export const NewsFeedSectionHeader: React.FC<NewsFeedSectionHeaderProps> = ({
  titleHindi,
  viewAllHref,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between border-b border-gray-200 pb-2 mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-6 bg-[#ED1727] rounded-full inline-block" aria-hidden="true" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-normal">
          {titleHindi}
        </h2>
        {badge && (
          <span className="text-xs bg-red-100 text-[#ED1727] font-semibold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="text-xs md:text-sm font-semibold text-[#344FD6] hover:text-[#ED1727] flex items-center gap-0.5 transition-colors group"
        >
          <span>सभी देखें</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
};

export default NewsFeedSectionHeader;

