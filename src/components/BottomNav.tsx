import React from 'react';
import { Home, Newspaper, PenSquare, Search, User, ShieldCheck, Radio } from 'lucide-react';
import { AppRole } from '../types';

export type NavTab =
  | 'home'
  | 'epaper'
  | 'reporter'
  | 'newsroom'
  | 'admin'
  | 'desk'
  | 'search'
  | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentRole: AppRole;
  pendingQueueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  pendingQueueCount = 0,
}) => {
  const getDeskTarget = (): NavTab => {
    switch (currentRole) {
      case 'ADMIN':
        return 'newsroom';
      case 'REPORTER':
        return 'reporter';
      default:
        return 'desk';
    }
  };

  const getDeskLabel = () => {
    switch (currentRole) {
      case 'ADMIN':
        return 'न्यूज़रूम';
      case 'REPORTER':
        return 'रिपोर्टर';
      default:
        return 'प्रेस डेस्क';
    }
  };

  const isDeskActive =
    activeTab === 'desk' || activeTab === 'reporter' || activeTab === 'newsroom' || activeTab === 'admin';

  return (
    <nav className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-14">
        {/* 1. Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center relative transition-colors ${
            activeTab === 'home' ? 'text-[#ED1727]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>
            होम
          </span>
          {activeTab === 'home' && (
            <div className="absolute top-0 w-8 h-[2px] bg-[#ED1727] rounded-full" />
          )}
        </button>

        {/* 2. E-paper */}
        <button
          onClick={() => onTabChange('epaper')}
          className={`flex flex-col items-center justify-center relative transition-colors ${
            activeTab === 'epaper' ? 'text-[#ED1727]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Newspaper className="w-5 h-5" />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'epaper' ? 'font-bold' : 'font-medium'}`}>
            ई-पेपर
          </span>
          {activeTab === 'epaper' && (
            <div className="absolute top-0 w-8 h-[2px] bg-[#ED1727] rounded-full" />
          )}
        </button>

        {/* 3. Desk (Dynamic: Newsroom / Reporter / Press) */}
        <button
          onClick={() => onTabChange(getDeskTarget())}
          className={`flex flex-col items-center justify-center relative transition-colors ${
            isDeskActive ? 'text-[#ED1727]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <PenSquare className="w-5 h-5" />
            {currentRole === 'ADMIN' && pendingQueueCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {pendingQueueCount}
              </span>
            )}
          </div>
          <span className={`text-[11px] mt-0.5 ${isDeskActive ? 'font-bold' : 'font-medium'}`}>
            {getDeskLabel()}
          </span>
          {isDeskActive && (
            <div className="absolute top-0 w-8 h-[2px] bg-[#ED1727] rounded-full" />
          )}
        </button>

        {/* 4. Search */}
        <button
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center justify-center relative transition-colors ${
            activeTab === 'search' ? 'text-[#ED1727]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'search' ? 'font-bold' : 'font-medium'}`}>
            खोजें
          </span>
          {activeTab === 'search' && (
            <div className="absolute top-0 w-8 h-[2px] bg-[#ED1727] rounded-full" />
          )}
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center relative transition-colors ${
            activeTab === 'profile' ? 'text-[#ED1727]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'profile' ? 'font-bold' : 'font-medium'}`}>
            प्रोफ़ाइल
          </span>
          {activeTab === 'profile' && (
            <div className="absolute top-0 w-8 h-[2px] bg-[#ED1727] rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
