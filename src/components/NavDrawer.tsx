import React, { useState } from 'react';
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
  HelpCircle,
  LogOut,
  Crown,
} from 'lucide-react';
import { AppRole, CategoryItem, DistrictItem, DivisionItem, EpaperEdition } from '../types';
import { NavTab } from './BottomNav';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onTabSelect: (tab: NavTab) => void;
  currentRole: AppRole;
  accountRole?: AppRole;
  onRoleChange: (role: AppRole) => void;
  onSwitchPersona?: (role: AppRole, targetTab?: NavTab) => void;
  userCoins: number;
  bookmarkedCount: number;
  categories: CategoryItem[];
  districts: DistrictItem[];
  divisions: DivisionItem[];
  epaperEditions: EpaperEdition[];
  onSelectCategory?: (categoryId: string) => void;
  onSelectDistrict?: (districtId: string) => void;
  onLogout?: () => void;
  onQuickMasterLogin?: () => void;
  isAuthenticated?: boolean;
}

type DrawerSectionTab = 'menu' | 'categories' | 'districts';

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabSelect,
  currentRole,
  accountRole = currentRole,
  onRoleChange,
  onSwitchPersona,
  userCoins,
  bookmarkedCount,
  categories,
  districts,
  epaperEditions,
  onSelectCategory,
  onSelectDistrict,
  onLogout,
  onQuickMasterLogin,
  isAuthenticated = false,
}) => {
  const [drawerTab, setDrawerTab] = useState<DrawerSectionTab>('menu');
  const [districtFilter, setDistrictFilter] = useState('');

  if (!isOpen) return null;

  const isMasterAccount = accountRole === 'MASTER_ADMIN';
  const isMasterAdmin = currentRole === 'MASTER_ADMIN';
  const isAdmin = currentRole === 'ADMIN' || isMasterAdmin;
  const isPrivilegedStaff = ['MASTER_ADMIN', 'ADMIN', 'EDITOR', 'REPORTER'].includes(currentRole);

  const navigateTo = (tab: NavTab) => {
    onTabSelect(tab);
    onClose();
  };

  // Switch persona directly inside Menu without closing drawer so user can inspect each role's menu bar & tabs
  const handlePersonaClick = (targetRole: AppRole) => {
    if (onSwitchPersona) {
      onSwitchPersona(targetRole);
    } else {
      onRoleChange(targetRole);
    }
    setDrawerTab('menu');
  };

  const filteredDistricts = districtFilter.trim()
    ? districts.filter(
        (d) =>
          d.nameHi.includes(districtFilter.trim()) ||
          d.nameEn.toLowerCase().includes(districtFilter.trim().toLowerCase())
      )
    : districts;

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
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <img
              src="/brand/logo.png"
              alt="BREAKING NEWS WALA"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <span className="text-sm font-black text-red-500 font-serif block leading-tight">
                BREAKING NEWS WALA
              </span>
              <span className="text-[10px] text-slate-300 font-bold">
                मध्य प्रदेश डिजिटल नेटवर्क • 55 जिले
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

        {/* Persona & Coins Quick Card */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                {isMasterAdmin ? '⭐' : isAdmin ? '👑' : currentRole === 'REPORTER' ? 'रि' : 'पा'}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  {isMasterAdmin
                    ? 'मास्टर एडमिन मोड'
                    : isAdmin
                    ? 'एडमिन मोड'
                    : currentRole === 'EDITOR'
                    ? 'डेस्क संपादक मोड'
                    : currentRole === 'REPORTER'
                    ? 'संवाददाता (रिपोर्टर) मोड'
                    : isMasterAccount
                    ? 'पाठक / यूजर मोड (मास्टर)'
                    : 'पाठक बंधु'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isMasterAdmin
                    ? 'पूर्ण प्रशासनिक एवं स्टूडियो नियंत्रण'
                    : currentRole === 'REPORTER'
                    ? 'फील्ड रिपोर्टिंग व ड्राफ्ट डेस्क'
                    : 'सार्वजनिक समाचार व पाठक अनुभव'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigateTo('profile')}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-[11px] font-bold cursor-pointer hover:bg-amber-500/30 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{userCoins}</span>
            </button>
          </div>

          {/* Master Admin 3-Tab Persona Switcher permanently inside Menu */}
          {isMasterAccount ? (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-amber-300/90 tracking-wide">
                रोल प्रीव्यू बदलें (मेन्यू टैब यहीं देखें):
              </p>
              <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-700/80 text-[10px] font-bold">
                <button
                  onClick={() => handlePersonaClick('MASTER_ADMIN')}
                  className={`py-1.5 px-1 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    currentRole === 'MASTER_ADMIN' || currentRole === 'ADMIN'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Crown className="w-3 h-3 shrink-0" />
                  <span className="truncate">मास्टर एडमिन</span>
                </button>
                <button
                  onClick={() => handlePersonaClick('REPORTER')}
                  className={`py-1.5 px-1 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    currentRole === 'REPORTER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <PenTool className="w-3 h-3 shrink-0" />
                  <span className="truncate">रिपोर्टर</span>
                </button>
                <button
                  onClick={() => handlePersonaClick('READER')}
                  className={`py-1.5 px-1 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    currentRole === 'READER'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">यूजर</span>
                </button>
              </div>
            </div>
          ) : (
            onQuickMasterLogin && (
              <button
                onClick={onQuickMasterLogin}
                className="w-full py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>मास्टर एडमिन प्रीव्यू अनलॉक करें (3-रोल स्विचर)</span>
              </button>
            )
          )}
        </div>

        {/* User-Friendly Drawer Section Tabs */}
        <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setDrawerTab('menu')}
            className={`py-2.5 border-b-2 transition-colors ${
              drawerTab === 'menu'
                ? 'border-[#ED1727] bg-white text-[#ED1727]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            मुख्य मेन्यू
          </button>
          <button
            onClick={() => setDrawerTab('categories')}
            className={`py-2.5 border-b-2 transition-colors ${
              drawerTab === 'categories'
                ? 'border-[#ED1727] bg-white text-[#ED1727]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            श्रेणियां ({categories.length})
          </button>
          <button
            onClick={() => setDrawerTab('districts')}
            className={`py-2.5 border-b-2 transition-colors ${
              drawerTab === 'districts'
                ? 'border-[#ED1727] bg-white text-[#ED1727]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            जिले ({districts.length})
          </button>
        </div>

        {/* Scrollable Drawer Tab Content */}
        <div className="flex-1 overflow-y-auto text-xs">
          {drawerTab === 'menu' && (
            <div className="divide-y divide-slate-100">
              {/* Staff Desks & Studios (Role-Aware) */}
              {isPrivilegedStaff && (
                <div className="p-3 bg-slate-50 space-y-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    कार्यक्षेत्र व स्टूडियो (Workspaces)
                  </p>

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
                        मास्टर एडमिन डैशबोर्ड
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                        कंट्रोल
                      </span>
                    </button>
                  )}

                  {(isAdmin || currentRole === 'EDITOR') && (
                    <button
                      onClick={() => navigateTo('newsroom')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        activeTab === 'newsroom' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-red-600" />
                        केंद्रीय संपादकीय (न्यूज़रूम) डेस्क
                      </span>
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">समीक्षा</span>
                    </button>
                  )}

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
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">प्रेस</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => navigateTo('epaper')}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          activeTab === 'epaper' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Newspaper className="w-3.5 h-3.5 text-[#344FD6]" />
                          दैनिक डिजिटल ई-पेपर
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">एडिशन</span>
                      </button>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          onClick={() => navigateTo('graphics')}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg font-bold border text-[11px] transition-colors ${
                            activeTab === 'graphics'
                              ? 'bg-orange-50 border-orange-300 text-orange-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-orange-50/50'
                          }`}
                        >
                          <Palette className="w-4 h-4 text-orange-500 mb-1" />
                          <span>ग्राफ़िक्स</span>
                        </button>
                        <button
                          onClick={() => navigateTo('videos')}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg font-bold border text-[11px] transition-colors ${
                            activeTab === 'videos'
                              ? 'bg-red-50 border-red-300 text-[#ED1727]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-red-50/50'
                          }`}
                        >
                          <Video className="w-4 h-4 text-[#ED1727] mb-1" />
                          <span>वीडियो Pro</span>
                        </button>
                        <button
                          onClick={() => navigateTo('ai-newsroom')}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg font-bold border text-[11px] transition-colors ${
                            activeTab === 'ai-newsroom'
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/50'
                          }`}
                        >
                          <Bot className="w-4 h-4 text-amber-500 mb-1" />
                          <span>AI न्यूज़</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Public User Navigation (Clean, zero duplicate links) */}
              <div className="p-3 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1">
                  सार्वजनिक नेविगेशन
                </p>

                <button
                  onClick={() => navigateTo('home')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
                    activeTab === 'home' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-red-600" />
                    होम व ताज़ा खबरें
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => navigateTo('search')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
                    activeTab === 'search' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-slate-600" />
                    समाचार खोजें (Archive)
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => navigateTo('profile')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
                    activeTab === 'profile' ? 'bg-red-50 text-[#ED1727]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Bookmark className="w-4 h-4 text-blue-600" />
                    सहेजे गए समाचार (बुकमार्क)
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                    {bookmarkedCount} सेव्ड
                  </span>
                </button>

                <button
                  onClick={() => navigateTo('profile')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-purple-600" />
                    मेरी प्रोफ़ाइल, सिक्के व सेटिंग्स
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                    {userCoins} सिक्के
                  </span>
                </button>

                <button
                  onClick={() => setDrawerTab('districts')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-red-500" />
                    ज़िला चुनें (55 जिले)
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                    एमपी विशेष
                  </span>
                </button>

                <button
                  onClick={() => navigateTo('profile')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-cyan-600" />
                    सहायता, फीडबैक व शिकायत
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      if (onLogout) onLogout();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-rose-600 hover:bg-rose-50 transition-colors mt-1"
                  >
                    <span className="flex items-center gap-2.5">
                      <LogOut className="w-4 h-4 text-rose-600" />
                      लॉग आउट (Logout)
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                )}
              </div>

              {/* Legal & Ethics Compact Footer */}
              <div className="p-3 space-y-1.5 text-[11px] text-slate-500 bg-slate-50">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  IT Rules 2021 व आचार संहिता
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
              </div>
            </div>
          )}

          {drawerTab === 'categories' && (
            <div className="p-3 space-y-2">
              <p className="text-[11px] font-bold text-slate-500 px-1">
                श्रेणी चुनकर तुरंत संबंधित समाचार देखें:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat.id);
                      navigateTo('home');
                    }}
                    className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 font-semibold text-slate-700 border border-slate-200/60 transition-colors truncate flex items-center gap-1.5"
                  >
                    <Flame className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{cat.nameHi}</span>
                  </button>
                ))}
              </div>

              {isAdmin && epaperEditions.length > 0 && (
                <div className="pt-3 mt-3 border-t border-slate-200 space-y-1.5">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    ई-पेपर जिला संस्करण (Admin)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {epaperEditions.map((ed) => (
                      <button
                        key={ed.id}
                        onClick={() => navigateTo('epaper')}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#344FD6] rounded-lg font-semibold text-[11px] transition-colors"
                      >
                        📰 {ed.districtName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {drawerTab === 'districts' && (
            <div className="p-3 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  placeholder="ज़िला खोजें (जैसे: भोपाल, इंदौर)..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                {filteredDistricts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      if (onSelectDistrict) onSelectDistrict(d.id);
                      navigateTo('home');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 rounded-lg text-slate-700 hover:text-red-600 font-semibold flex items-center justify-between border border-transparent hover:border-red-100 transition-colors"
                  >
                    <span>📍 {d.nameHi}</span>
                    <span className="text-[10px] text-slate-400">{d.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
