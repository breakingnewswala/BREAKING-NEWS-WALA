import React from 'react';
import {
  Menu,
  Search,
  User,
  Home,
  PenSquare,
  Building2,
  Lock,
  Flame,
  Video,
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
  accountRole?: AppRole;
  isAuthenticated?: boolean;
  onQuickMasterLogin?: () => void;
  pendingQueueCount?: number;
}

export const BnwMasthead: React.FC<BnwMastheadProps> = ({
  onOpenMenu,
  activeTab,
  onTabChange,
  onSearchClick,
  onProfileClick,
  currentRole,
  accountRole = currentRole,
  isAuthenticated = false,
  onQuickMasterLogin,
  pendingQueueCount = 0,
}) => {
  const isMasterAccount = accountRole === 'MASTER_ADMIN';

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'MASTER_ADMIN':
        return { label: 'मास्टर एडमिन', color: 'bg-amber-500 text-slate-950 font-extrabold' };
      case 'ADMIN':
        return { label: 'एडमिन', color: 'bg-red-600 text-white font-bold' };
      case 'EDITOR':
        return { label: 'संपादक', color: 'bg-indigo-600 text-white font-bold' };
      case 'REPORTER':
        return { label: 'रिपोर्टर', color: 'bg-blue-600 text-white font-bold' };
      default:
        return isMasterAccount
          ? { label: 'यूजर व्यू', color: 'bg-emerald-600 text-white font-bold' }
          : null;
    }
  };

  const roleBadge = getRoleBadge();
  const isAdminActive = ['admin', 'newsroom', 'reporter', 'epaper', 'graphics', 'videos', 'ai-newsroom'].includes(activeTab);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Main Navigation Bar: fixed crisp single-row height (53px + 3px accent = 56px) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-[53px] flex items-center justify-between gap-2">
        {/* Left Section: Menu Button + Brand Logo + Live Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onOpenMenu}
            aria-label="मुख्य मेन्यू खोलें"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 group"
          >
            <Menu className="w-4 h-4 text-[#ED1727] group-hover:scale-105 transition-transform" />
            <span className="font-extrabold tracking-wide">मेन्यू</span>
          </button>

          <div
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity shrink-0"
          >
            <img
              src="/brand/logo.png"
              alt="BREAKING NEWS WALA"
              className="h-8 md:h-9 w-auto object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const sibling = target.nextElementSibling;
                if (sibling) (sibling as HTMLElement).style.display = 'flex';
              }}
            />
            <div className="hidden flex-col items-start leading-none">
              <span className="text-base md:text-lg font-black tracking-tight text-red-600 font-news-hero whitespace-nowrap">
                BREAKING NEWS WALA
              </span>
              <span className="text-[10px] font-news-stylish font-bold text-slate-700 tracking-wider whitespace-nowrap">
                ब्रेकिंग न्यूज़ वाला • मध्य प्रदेश
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full shrink-0 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[10px] font-black tracking-wider text-red-600">LIVE</span>
          </div>
        </div>

        {/* Center Desktop Web Navigation Links: Clean, Limited & Single-Line */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
          <button
            onClick={() => onTabChange('home')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>होम</span>
          </button>

          <button
            onClick={() => onTabChange('taza')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'taza'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>ताज़ा खबरें</span>
          </button>

          <button
            onClick={() => onTabChange('video-feed')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'video-feed'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>वीडियो (VIDEO)</span>
          </button>

          <button
            onClick={() => onTabChange('search')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'search'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>खोजें</span>
          </button>

          {/* Single Unified Role Workspace Entry (all remaining desks & studios live inside tabs) */}
          {['MASTER_ADMIN', 'ADMIN'].includes(currentRole) && (
            <button
              onClick={() => onTabChange('admin')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                isAdminActive
                  ? 'bg-slate-900 text-amber-300 font-bold ring-1 ring-amber-400'
                  : 'text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>एडमिन पैनल</span>
              {pendingQueueCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full">
                  {pendingQueueCount}
                </span>
              )}
            </button>
          )}

          {currentRole === 'EDITOR' && (
            <button
              onClick={() => onTabChange('newsroom')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'newsroom'
                  ? 'bg-red-50 text-[#ED1727] font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>न्यूज़रूम डेस्क</span>
              {pendingQueueCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full">
                  {pendingQueueCount}
                </span>
              )}
            </button>
          )}

          {currentRole === 'REPORTER' && (
            <button
              onClick={() => onTabChange('reporter')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'reporter'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PenSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>रिपोर्टर डेस्क</span>
            </button>
          )}
        </nav>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!isAuthenticated && onQuickMasterLogin && (
            <button
              onClick={onQuickMasterLogin}
              title="प्रीव्यू मोड में मास्टर एडमिन के रूप में तुरंत लॉगिन करें"
              className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold transition-colors shadow-2xs"
            >
              मास्टर लॉगिन
            </button>
          )}
          {roleBadge && (
            <button
              onClick={onProfileClick}
              title="मोड या प्रोफ़ाइल बदलें"
              className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-opacity hover:opacity-90 ${roleBadge.color}`}
            >
              {roleBadge.label}
            </button>
          )}

          <button
            onClick={onSearchClick}
            aria-label="खोजें"
            className="lg:hidden p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onProfileClick}
            aria-label="प्रोफ़ाइल"
            className={`hidden lg:flex p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:text-red-600 hover:bg-slate-100'
            }`}
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
