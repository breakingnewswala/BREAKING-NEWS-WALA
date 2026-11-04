import React from 'react';
import {
  X,
  Home,
  Newspaper,
  PenTool,
  Building2,
  Search,
  User,
  Sparkles,
  Bookmark,
  MapPin,
  Layers,
  Shield,
  Phone,
  Mail,
  ChevronRight,
  Radio,
  Award,
  Lock,
} from 'lucide-react';
import { AppRole, CategoryItem, DistrictItem, DivisionItem, EpaperEdition } from '../types';
import { NavTab } from './BottomNav';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onTabSelect: (tab: NavTab) => void;
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  userCoins: number;
  bookmarkedCount: number;
  categories: CategoryItem[];
  districts: DistrictItem[];
  divisions: DivisionItem[];
  epaperEditions: EpaperEdition[];
  onSelectCategory?: (categoryId: string) => void;
  onSelectDistrict?: (districtId: string) => void;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabSelect,
  currentRole,
  onRoleChange,
  userCoins,
  bookmarkedCount,
  categories,
  districts,
  divisions,
  epaperEditions,
  onSelectCategory,
  onSelectDistrict,
}) => {
  if (!isOpen) return null;

  const navigateTo = (tab: NavTab) => {
    onTabSelect(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Sliding Drawer Panel */}
      <div className="fixed inset-y-0 left-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <img
              src="/brand/logo.png"
              alt="BREAKING NEWS WALA"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <span className="text-sm font-black text-red-500 font-serif block leading-tight">
                BREAKING NEWS WALA
              </span>
              <span className="text-[10px] text-slate-300 font-bold">
                मुख्य मेन्यू • 55 जिले
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="मेन्यू बंद करें"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tri-color Accent Line */}
        <div className="w-full flex h-[3px]">
          <div className="flex-1 bg-[#ED1727]" />
          <div className="flex-1 bg-[#FDE900]" />
          <div className="flex-1 bg-[#344FD6]" />
        </div>

        {/* User Persona & Coins Quick Card */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                अ
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">अमित कुमार शर्मा</p>
                <p className="text-[11px] text-slate-400">
                  {currentRole === 'ADMIN'
                    ? '🔴 मुख्य संपादक / एडमिन'
                    : currentRole === 'REPORTER'
                    ? '🔵 फील्ड संवाददाता'
                    : '🟢 पाठक मोड'}
                </p>
              </div>
            </div>

            <div
              onClick={() => navigateTo('profile')}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-500/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{userCoins} सिक्के</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
          {/* 1. Core Primary Navigation (All 4 Surfaces) */}
          <div className="p-3 space-y-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1">
              मुख्य पृष्ठ व कार्यक्षेत्र
            </p>

            {/* Surface 1: Public Home */}
            <button
              onClick={() => navigateTo('home')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-colors ${
                activeTab === 'home'
                  ? 'bg-red-50 text-[#ED1727]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-red-600" />
                होम पेज (मुख्य समाचार प्रवाह)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* E-Paper */}
            <button
              onClick={() => navigateTo('epaper')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-colors ${
                activeTab === 'epaper'
                  ? 'bg-red-50 text-[#ED1727]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Newspaper className="w-4 h-4 text-[#344FD6]" />
                दैनिक डिजिटल ई-पेपर (E-Paper)
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                आज का अंक
              </span>
            </button>

            {/* Surface 2: Reporter Desk */}
            <button
              onClick={() => navigateTo('reporter')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-colors ${
                activeTab === 'reporter'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PenTool className="w-4 h-4 text-blue-600" />
                संवाददाता फील्ड डेस्क (Reporter)
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                प्रेस पोर्टल
              </span>
            </button>

            {/* Surface 3: Newsroom Desk */}
            <button
              onClick={() => navigateTo('newsroom')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-colors ${
                activeTab === 'newsroom'
                  ? 'bg-red-50 text-[#ED1727]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-red-600" />
                केंद्रीय संपादकीय डेस्क (Newsroom)
              </span>
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                समीक्षा व अनुमोदन
              </span>
            </button>

            {/* Surface 4: Admin Control Panel */}
            <button
              onClick={() => navigateTo('admin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-colors ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-500" />
                एडमिनिस्ट्रेटिव कंट्रोल रूम (Admin)
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                मास्टर कंट्रोल
              </span>
            </button>

            {/* Search */}
            <button
              onClick={() => navigateTo('search')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-colors ${
                activeTab === 'search'
                  ? 'bg-red-50 text-[#ED1727]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-600" />
                समाचार खोजें (Search Archive)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile */}
            <button
              onClick={() => navigateTo('profile')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-colors ${
                activeTab === 'profile'
                  ? 'bg-red-50 text-[#ED1727]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-purple-600" />
                मेरी प्रोफ़ाइल, सिक्के एवं सेटिंग्स
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                {bookmarkedCount} सेव्ड
              </span>
            </button>
          </div>

          {/* 2. Persona Role Switcher */}
          <div className="p-3 space-y-2 bg-slate-50">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-2">
              सक्रिय भूमिका बदलें (Role Persona)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onRoleChange('READER')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center border transition-colors ${
                  currentRole === 'READER'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                पाठक
              </button>
              <button
                onClick={() => onRoleChange('REPORTER')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center border transition-colors ${
                  currentRole === 'REPORTER'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                रिपोर्टर
              </button>
              <button
                onClick={() => onRoleChange('ADMIN')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center border transition-colors ${
                  currentRole === 'ADMIN'
                    ? 'bg-red-600 text-white border-red-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                एडमिन
              </button>
            </div>
          </div>

          {/* 3. News Categories */}
          <div className="p-3 space-y-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1">
              समाचार श्रेणियां (Categories)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(cat.id);
                    navigateTo('home');
                  }}
                  className="text-left px-2.5 py-1.5 rounded bg-slate-50 hover:bg-red-50 hover:text-red-600 font-medium text-slate-700 transition-colors truncate"
                >
                  • {cat.nameHi}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Daily Epaper Editions */}
          <div className="p-3 space-y-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1">
              ई-पेपर जिला संस्करण
            </p>
            <div className="flex flex-wrap gap-1.5">
              {epaperEditions.map((ed) => (
                <button
                  key={ed.id}
                  onClick={() => navigateTo('epaper')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#344FD6] rounded font-semibold text-[11px] transition-colors"
                >
                  📰 {ed.districtName}
                </button>
              ))}
            </div>
          </div>

          {/* 5. 55 Districts of Madhya Pradesh Directory */}
          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-600" />
                मध्य प्रदेश के 55 जिले
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">10 संभाग</span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/70 space-y-1">
              {districts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    if (onSelectDistrict) onSelectDistrict(d.id);
                    navigateTo('home');
                  }}
                  className="block w-full text-left px-2 py-1 hover:bg-white rounded text-slate-700 hover:text-red-600 font-medium truncate"
                >
                  📍 {d.nameHi} ({d.nameEn})
                </button>
              ))}
            </div>
          </div>

          {/* 6. Legal & Ethics */}
          <div className="p-3 space-y-2 text-[11px] text-slate-500 bg-slate-50">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              डिजिटल मीडिया आचार संहिता व विधिक जानकारी
            </p>
            <p className="leading-tight">
              प्रेस काउंसिल ऑफ इंडिया व आईटी रूल्स 2021 के तहत संचालित।
            </p>
            <div className="space-y-0.5 text-slate-600">
              <p className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-red-600" />
                grievance@breakingnewswala.com
              </p>
              <p className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-blue-600" />
                +91 755 4920000 (भोपाल ब्यूरो)
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
              <span>संस्करण: v1.6.0 (Web)</span>
              <span>BREAKING NEWS WALA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
