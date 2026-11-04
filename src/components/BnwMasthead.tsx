import React from 'react';
import {
  Menu,
  Search,
  User,
  Radio,
  Home,
  Newspaper,
  PenSquare,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';
import { AppRole } from '../types';
import { NavTab } from './BottomNav';

interface BnwMastheadProps {
  onOpenMenu: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onSearchClick: () => void;
  onProfileClick: () => void;
  currentRole: AppRole;
  pendingQueueCount?: number;
}

export const BnwMasthead: React.FC<BnwMastheadProps> = ({
  onOpenMenu,
  activeTab,
  onTabChange,
  onSearchClick,
  onProfileClick,
  currentRole,
  pendingQueueCount = 0,
}) => {
  const getRoleBadge = () => {
    switch (currentRole) {
      case 'ADMIN':
        return { label: 'एडमिन', color: 'bg-red-600 text-white' };
      case 'EDITOR':
        return { label: 'संपादक', color: 'bg-indigo-600 text-white' };
      case 'REPORTER':
        return { label: 'रिपोर्टर', color: 'bg-blue-600 text-white' };
      default:
        return { label: 'पाठक', color: 'bg-emerald-600 text-white' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        {/* Left Section: Menu Button + Brand Logo + Live Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Prominent Menu Bar Button next to Logo */}
          <button
            onClick={onOpenMenu}
            aria-label="मुख्य मेन्यू खोलें"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all shadow-2xs group"
          >
            <Menu className="w-4 h-4 text-[#ED1727] group-hover:scale-110 transition-transform" />
            <span className="font-extrabold tracking-wide">मेन्यू</span>
          </button>

          {/* Official Brand Logo */}
          <div
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity"
          >
            <img
              src="/brand/logo.png"
              alt="BREAKING NEWS WALA"
              className="h-8 md:h-10 w-auto object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const sibling = target.nextElementSibling;
                if (sibling) (sibling as HTMLElement).style.display = 'flex';
              }}
            />
            {/* Fallback Brand Text */}
            <div className="hidden flex-col items-start leading-none">
              <span className="text-lg md:text-xl font-black tracking-tight text-red-600 font-serif">
                BREAKING NEWS WALA
              </span>
              <span className="text-[10px] font-bold text-slate-700 tracking-wider">
                ब्रेकिंग न्यूज़ वाला • मध्य प्रदेश
              </span>
            </div>
          </div>

          {/* Animated Blinking LIVE Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 md:py-1 bg-red-50 border border-red-200 rounded-full animate-pulse shrink-0">
            <Radio className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-600 animate-spin" />
            <span className="text-[10px] md:text-xs font-black tracking-wider text-red-600">LIVE</span>
          </div>
        </div>

        {/* Center Desktop Web Navigation Links (All 4 Primary Surfaces + Core Tools) */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-bold">
          {/* Surface 1: Public Portal */}
          <button
            onClick={() => onTabChange('home')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'home'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>होम</span>
          </button>

          {/* Epaper */}
          <button
            onClick={() => onTabChange('epaper')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'epaper'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 text-[#344FD6]" />
            <span>ई-पेपर</span>
          </button>

          {/* Surface 2: Reporter Portal */}
          <button
            onClick={() => onTabChange('reporter')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'reporter'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <PenSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>रिपोर्टर डेस्क</span>
          </button>

          {/* Surface 3: Central Newsroom Desk */}
          <button
            onClick={() => onTabChange('newsroom')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'newsroom'
                ? 'bg-red-50 text-[#ED1727] font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-red-600" />
            <span>न्यूज़रूम डेस्क</span>
            {pendingQueueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full">
                {pendingQueueCount}
              </span>
            )}
          </button>

          {/* Surface 4: Admin Control Panel */}
          <button
            onClick={() => onTabChange('admin')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>एडमिन कंट्रोल</span>
          </button>

          {/* Search */}
          <button
            onClick={() => onTabChange('search')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'search'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>खोजें</span>
          </button>
        </nav>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Role Indicator */}
          <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleBadge.color}`}>
            {roleBadge.label}
          </span>

          {/* Quick Search Icon Button (Mobile/Tablet) */}
          <button
            onClick={onSearchClick}
            aria-label="खोजें"
            className="lg:hidden p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Profile Button */}
          <button
            onClick={onProfileClick}
            aria-label="प्रोफ़ाइल"
            className="p-1.5 sm:p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Tri-color Accent Line (DEC-059: Red, Yellow, Blue) */}
      <div className="w-full flex h-[3px]">
        <div className="flex-1 bg-[#ED1727]" />
        <div className="flex-1 bg-[#FDE900]" />
        <div className="flex-1 bg-[#344FD6]" />
      </div>
    </header>
  );
};
