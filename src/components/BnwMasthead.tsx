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
  Bell,
  ChevronUp,
  ChevronDown,
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNotificationClick?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
  onNotificationClick,
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

  if (isCollapsed) {
    return (
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-[36px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-tight text-red-500 font-news-hero">
              BREAKING NEWS WALA
            </span>
            <span className="text-[10px] text-slate-300 hidden sm:inline">
              • फुल-स्क्रीन कार्यक्षेत्र सक्रिय
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pendingQueueCount > 0 && onNotificationClick && (
              <button
                onClick={onNotificationClick}
                className="flex items-center gap-1 px-2 py-0.5 bg-red-600/90 hover:bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
              >
                <Bell className="w-3 h-3" />
                <span>समीक्षा अलर्ट ({pendingQueueCount})</span>
              </button>
            )}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="पूरा हेडर दिखाएं"
                className="flex items-center gap-1 px-2.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>हेडर दिखाएं</span>
              </button>
            )}
          </div>
        </div>
        <div className="w-full flex h-[2px]">
          <div className="flex-1 bg-[#ED1727]" />
          <div className="flex-1 bg-[#FDE900]" />
          <div className="flex-1 bg-[#344FD6]" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Main Navigation Bar: fixed crisp single-row height (53px + 3px accent = 56px) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-[53px] flex items-center justify-between gap-2">
        {/* Left Section: Menu Button + Brand Logo + Live Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onOpenMenu}
            aria-label="मुख्य मेन्यू खोलें"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 group cursor-pointer"
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
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'search'
                ? 'bg-red-50 text-[#ED1727]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>खोजें</span>
          </button>
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
              title="मास्टर एडमिन डैशबोर्ड खोलें"
              className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-opacity hover:opacity-90 ${roleBadge.color}`}
            >
              {roleBadge.label}
            </button>
          )}

          <button
            onClick={onSearchClick}
            aria-label="खोजें"
            className="lg:hidden p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Alert Bell */}
          <button
            onClick={onNotificationClick}
            title={pendingQueueCount > 0 ? `${pendingQueueCount} खबरें समीक्षा कतार में अनुमोदन हेतु प्रतीक्षारत हैं!` : 'संपादकीय सूचनाएं व अलर्ट'}
            className="relative p-1.5 sm:p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="सूचनाएं व अलर्ट्स"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {pendingQueueCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse shadow-xs">
                {pendingQueueCount}
              </span>
            )}
          </button>

          {/* Header Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="हेडर छिपाएं (कार्यक्षेत्र में फुल स्क्रीन स्पेस पाएं)"
              className="p-1.5 sm:p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="हेडर छिपाएं"
            >
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <button
            onClick={onProfileClick}
            aria-label="प्रोफ़ाइल / मास्टर एडमिन कंट्रोल"
            title="मास्टर एडमिन डैशबोर्ड खोलें"
            className={`flex p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
              activeTab === 'profile' || activeTab === 'admin'
                ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400'
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
