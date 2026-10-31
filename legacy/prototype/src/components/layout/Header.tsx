import React from 'react';
import { 
  MapPin, 
  Search, 
  Bell, 
  Bookmark, 
  Coins, 
  Newspaper, 
  Video, 
  TrendingUp, 
  ChevronDown, 
  ShieldAlert, 
  Edit3, 
  Globe 
} from 'lucide-react';
import { UserRole } from '../../types/index.ts';
import { useAuth } from '../../firebase/AuthContext.tsx';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedDistrict: string;
  onOpenDistrictModal: () => void;
  onOpenSearchModal: () => void;
  onOpenProfileModal: () => void;
  savedCount: number;
  coinsCount: number;
  unreadNotifications: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  selectedDistrict,
  onOpenDistrictModal,
  onOpenSearchModal,
  onOpenProfileModal,
  savedCount,
  coinsCount,
  unreadNotifications
}) => {
  const { user, signInWithGoogle } = useAuth();
  // Hindi Day & Date Formatter
  const todayHindi = new Intl.DateTimeFormat('hi-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="w-full bg-white border-b border-gray-200">
      {/* Top Super Bar */}
      <div className="bg-gray-900 text-gray-300 text-xs px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="font-medium text-amber-400 capitalize">{todayHindi}</span>
          <span className="hidden sm:inline text-gray-600">|</span>
          <button 
            onClick={onOpenDistrictModal}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-yellow-300 px-2 py-0.5 rounded text-xs transition border border-gray-700"
            title="जिला बदलें"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span className="font-semibold">{selectedDistrict}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-gray-300">
            <span className="flex items-center gap-1 hover:text-white cursor-pointer">
              <Newspaper className="w-3.5 h-3.5 text-amber-400" />
              ई-पेपर
            </span>
            <span className="text-gray-700">•</span>
            <span className="flex items-center gap-1 hover:text-white cursor-pointer">
              <Video className="w-3.5 h-3.5 text-red-400" />
              वीडियो बुलेटिन
            </span>
            <span className="text-gray-700">•</span>
            <span className="flex items-center gap-1 hover:text-white cursor-pointer">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ट्रेंडिंग
            </span>
          </div>

          {/* Quick Portal Switcher */}
          <div className="flex items-center bg-gray-800 p-0.5 rounded border border-gray-700">
            <button
              onClick={() => onRoleChange('public')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentRole === 'public' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              पब्लिक
            </button>
            <button
              onClick={() => onRoleChange('reporter')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentRole === 'reporter' || currentRole === 'trusted_reporter'
                  ? 'bg-amber-500 text-gray-950 font-bold shadow-xs' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              रिपोर्टर
            </button>
            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentRole === 'admin' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              एडमिन
            </button>
          </div>
        </div>
      </div>

      {/* Main Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/public/assets/aistudio/LOGO_88407b32.png" 
            alt="BREAKING NEWS WALA Logo" 
            className="h-12 sm:h-16 object-contain cursor-pointer"
            onClick={() => onRoleChange('public')}
          />
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onOpenSearchModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition border border-gray-200"
          >
            <Search className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline text-xs">खबरें, जिले, विषय खोजें...</span>
          </button>

          {/* Bookmarks */}
          <button
            onClick={onOpenProfileModal}
            className="relative p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition"
            title="सेव की गई खबरें"
          >
            <Bookmark className="w-5 h-5" />
            {savedCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenProfileModal}
            className="relative p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-full transition"
            title="सूचनाएं"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-amber-500 text-gray-950 text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Coins Reward Badge */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold transition"
            title="आपके सिक्के एवं रिवार्ड्स"
          >
            <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{coinsCount} सिक्के</span>
          </button>

          {/* Firebase Google Auth */}
          {user ? (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition border border-gray-200"
              title={`${user.displayName || user.email} (लॉगिन स्थिति)`}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-3 py-1 rounded-full text-xs font-bold transition shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>लॉगिन</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
