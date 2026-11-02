/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Brand Header Component (COMP-GLO-002)
 * Grounded in docs/07-Design.md Section 9.1 and docs/09-Components.md Section 4.2
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import { BreakingNewsTicker } from './BreakingNewsTicker';
import { PrimaryCategoryNavbar } from './PrimaryCategoryNavbar';
import { DistrictSelectorModal } from './DistrictSelectorModal';
import { BreakingBulletin, PublicCategory } from '../lib/types';

interface HeaderProps {
  categories?: PublicCategory[];
  bulletins?: BreakingBulletin[];
  currentDistrict?: { slug: string; nameHi: string };
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  bulletins,
  currentDistrict = { slug: 'niwari', nameHi: 'निवाड़ी' },
}) => {
  const router = useRouter();
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Format today's date in Hindi (Asia/Kolkata)
  const todayHindi = new Intl.DateTimeFormat('hi-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="w-full bg-white flex flex-col border-b border-gray-200" role="banner">
      {/* 1. Top Masthead Super-Bar */}
      <div className="bg-[#111827] text-gray-300 text-xs py-1.5 border-b border-gray-800">
        <div className="site-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-300">{todayHindi}</span>
            <span className="hidden sm:inline text-gray-500">•</span>
            <span className="hidden sm:inline text-yellow-400 font-bold">
              ★ निष्पक्ष, निर्भीक, सटीक पत्रकारिता
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Territory Picker Launcher */}
            <button
              type="button"
              onClick={() => setDistrictModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              aria-label="जिला बदलें"
            >
              <span className="text-[#FDE900]">📍</span>
              <span>{currentDistrict.nameHi}</span>
              <span className="text-gray-400 text-[10px]">▼</span>
            </button>

            {/* Quick Links */}
            <Link href="/category/madhya-pradesh" className="hidden md:inline hover:text-white">
              मध्य प्रदेश
            </Link>
            <Link href="/category/politics" className="hidden md:inline hover:text-white">
              राजनीति
            </Link>
            <Link href="/category/crime" className="hidden md:inline hover:text-white">
              क्राइम
            </Link>
            <Link href="/epaper" className="inline-flex items-center gap-1 text-[#FDE900] font-bold hover:underline ml-2">
              <span>📰 ई-पेपर</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Brand Header Bar */}
      <div className="py-3 sm:py-4 site-container flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex-shrink-0">
          <BrandLogo variant="desktop-masthead" />
        </div>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md mx-4 relative"
          role="search"
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 खबर, जिला या विषय खोजें..."
            className="w-full py-2 pl-4 pr-10 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#344FD6] bg-gray-50 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#344FD6]"
            aria-label="खोजें"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <Link
            href="/search"
            className="md:hidden p-2 text-gray-600 hover:text-[#344FD6] rounded-full hover:bg-gray-100"
            aria-label="सर्च पेज"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* District Selector Icon Pill (Mobile) */}
          <button
            type="button"
            onClick={() => setDistrictModalOpen(true)}
            className="md:hidden inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-full bg-blue-50 text-[#344FD6] font-bold border border-blue-200"
          >
            <span>📍</span>
            <span>{currentDistrict.nameHi}</span>
          </button>

          {/* Citizen Login Button */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-[#344FD6] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">लॉगिन</span>
          </Link>
        </div>
      </div>

      {/* 3. Live Breaking News Ticker */}
      <BreakingNewsTicker bulletins={bulletins} />

      {/* 4. Primary Category Navigation Bar */}
      <PrimaryCategoryNavbar categories={categories} />

      {/* 5. District Selection Modal */}
      <DistrictSelectorModal
        isOpen={districtModalOpen}
        onClose={() => setDistrictModalOpen(false)}
        currentDistrictSlug={currentDistrict.slug}
      />
    </header>
  );
};

