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
  Shield,
  Phone,
  Mail,
  ChevronRight,
  Lock,
  Palette,
  Video,
  Bot,
  Flame,
  Bell,
  Sliders,
  Settings,
  HelpCircle,
  LogOut,
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
  onLogout?: () => void;
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
  onLogout,
}) => {
  if (!isOpen) return null;

  const isMasterAdmin = currentRole === 'MASTER_ADMIN';
  const isAdmin = currentRole === 'ADMIN' || isMasterAdmin;
  const isPrivilegedStaff = ['MASTER_ADMIN', 'ADMIN', 'EDITOR', 'REPORTER'].includes(currentRole);

  const navigateTo = (tab: NavTab) => {
    onTabSelect(tab);
    onClose();
  };

  const districtListRef = React.useRef<HTMLDivElement>(null);

  const scrollToDistricts = () => {
    if (districtListRef.current) {
      districtListRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

        {/* 1. User Persona & Coins Quick Card (Item 1: Reader Profile) */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {isMasterAdmin ? '⭐' : isAdmin ? '👑' : 'पा'}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  {isMasterAdmin
                    ? 'मास्टर एडमिनिस्ट्रेटर'
                    : isAdmin
                    ? 'एडमिनिस्ट्रेटर'
                    : currentRole === 'EDITOR'
                    ? 'डेस्क संपादक'
                    : currentRole === 'REPORTER'
                    ? 'फील्ड संवाददाता'
                    : 'पाठक बंधु'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isMasterAdmin
                    ? 'पूर्ण प्रशासनिक नियंत्रण'
                    : isAdmin
                    ? 'संपादकीय नियंत्रण'
                    : currentRole === 'EDITOR'
                    ? 'संपादकीय डेस्क'
                    : currentRole === 'REPORTER'
                    ? 'सत्यापित रिपोर्टर'
                    : 'सामान्य पाठक मोड'}
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
          {/* Master Admin / Privileged Staff Section (Only for Authorized Staff) */}
          {isPrivilegedStaff && (
            <div className="p-3 bg-slate-50 space-y-1">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                प्रशासनिक व संपादकीय कार्यक्षेत्र (Staff Desks)
              </p>

              {/* Master Admin Dashboard Button */}
              {isAdmin && (
                <button
                  onClick={() => navigateTo('admin')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
                    activeTab === 'admin'
                      ? 'bg-slate-900 text-amber-400 shadow-xs'
                      : 'bg-amber-500/10 text-slate-800 hover:bg-amber-500/20 border border-amber-500/30'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    {isMasterAdmin ? '⭐ मास्टर एडमिन डैशबोर्ड' : 'एडमिनिस्ट्रेटिव कंट्रोल रूम'}
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                    कंट्रोल रूम
                  </span>
                </button>
              )}

              {/* Reporter Desk */}
              <button
                onClick={() => navigateTo('reporter')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'reporter' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5 text-blue-600" />
                  संवाददाता फील्ड डेस्क
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">प्रेस पोर्टल</span>
              </button>

              {/* Newsroom Desk */}
              {(isMasterAdmin || isAdmin || currentRole === 'EDITOR') && (
                <button
                  onClick={() => navigateTo('newsroom')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    activeTab === 'newsroom' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-red-600" />
                    केंद्रीय संपादकीय डेस्क
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">समीक्षा</span>
                </button>
              )}

              {/* Studios */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => navigateTo('graphics')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      activeTab === 'graphics' ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-orange-500" />
                      ग्राफ़िक्स स्टूडियो
                    </span>
                    <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">STUDIO</span>
                  </button>
                  <button
                    onClick={() => navigateTo('videos')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      activeTab === 'videos' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-[#ED1727]" />
                      वीडियो स्टूडियो Pro
                    </span>
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded">HD MP4</span>
                  </button>
                  <button
                    onClick={() => navigateTo('ai-newsroom')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      activeTab === 'ai-newsroom' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-amber-500" />
                      AI न्यूज़ रूम
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">AI AUTO</span>
                  </button>
                  {/* E-Paper (Staff Only) */}
                  <button
                    onClick={() => navigateTo('epaper')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      activeTab === 'epaper' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Newspaper className="w-3.5 h-3.5 text-[#344FD6]" />
                      दैनिक डिजिटल ई-पेपर (E-Paper)
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">एडिशन</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Standard 12-Item Public User Navigation List */}
          <div className="p-3 space-y-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1">
              नेविगेशन मेन्यू (Navigation)
            </p>

            {/* Item 2: Home (होम पेज) */}
            <button
              onClick={() => navigateTo('home')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'home' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-red-600" />
                होम पेज
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Item 3: All News (ताज़ा व समस्त समाचार) */}
            <button
              onClick={() => navigateTo('home')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-amber-500" />
                ताज़ा व समस्त समाचार
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Item 4: Saved News (सेव्ड समाचार / बुकमार्क) */}
            <button
              onClick={() => navigateTo('profile')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-blue-600" />
                सेव्ड समाचार (बुकमार्क)
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                {bookmarkedCount} सेव्ड
              </span>
            </button>

            {/* Item 5: Coin Wallet (सिक्के / कॉइन रिवॉर्ड्स) */}
            <button
              onClick={() => navigateTo('profile')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                सिक्के व कॉइन रिवॉर्ड्स
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                {userCoins} सिक्के
              </span>
            </button>

            {/* Item 6: Notifications (अधिसूचनाएं) */}
            <button
              onClick={() => navigateTo('profile')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-emerald-600" />
                अधिसूचनाएं (Notifications)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Item 7: Select My District (ज़िला चयन) */}
            <button
              onClick={scrollToDistricts}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-red-500" />
                ज़िला चयन (55 जिले)
              </span>
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                एमपी विशेष
              </span>
            </button>

            {/* Item 8: News Preferences (प्राथमिकताएं) */}
            <button
              onClick={() => navigateTo('profile')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                समाचार प्राथमिकताएं
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Item 9: My Profile (मेरी प्रोफ़ाइल) */}
            <button
              onClick={() => navigateTo('profile')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'profile' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-purple-600" />
                मेरी प्रोफ़ाइल (My Profile)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Item 10: Settings (ऐप सेटिंग्स) */}
            <button
              onClick={() => navigateTo('profile')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-600" />
                ऐप सेटिंग्स (Settings)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Item 11: Help and Contact (सहायता व संपर्क) */}
            <button
              onClick={() => navigateTo('profile')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-cyan-600" />
                सहायता व संपर्क (Help & Contact)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Item 12: Logout (लॉग आउट) */}
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  navigateTo('profile');
                }
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-rose-600" />
                लॉग आउट (Logout)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>

          {/* Search Archive */}
          <div className="p-3">
            <button
              onClick={() => navigateTo('search')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'search' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-600" />
                समाचार खोजें (Search Archive)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* News Categories (11 specific categories) */}
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

          {/* Daily Epaper Editions (Shown ONLY to Authorized Master Admin & Admin) */}
          {isAdmin && (
            <div className="p-3 space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1">
                ई-पेपर जिला संस्करण (Staff Only)
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
          )}

          {/* 55 Districts of Madhya Pradesh Directory */}
          <div ref={districtListRef} className="p-3 space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-600" />
                मध्य प्रदेश के 55 जिले
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">10 संभाग</span>
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/70 space-y-1">
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

          {/* Legal & Ethics */}
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
