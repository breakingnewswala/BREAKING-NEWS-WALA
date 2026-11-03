import React from 'react';
import { Home, Newspaper, PenSquare, Search, User } from 'lucide-react';
import { AppRole } from '../types';

export type NavTab = 'home' | 'epaper' | 'desk' | 'search' | 'profile';

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

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'home',
      label: 'होम',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'epaper',
      label: 'ई-पेपर',
      icon: <Newspaper className="w-5 h-5" />,
    },
    {
      id: 'desk',
      label: getDeskLabel(),
      icon: <PenSquare className="w-5 h-5" />,
      badge: currentRole === 'ADMIN' && pendingQueueCount > 0 ? pendingQueueCount : undefined,
    },
    {
      id: 'search',
      label: 'खोजें',
      icon: <Search className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'प्रोफ़ाइल',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-14">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center relative transition-colors ${
                isActive ? 'text-[#ED1727]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-[#ED1727] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
