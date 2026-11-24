import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Award,
  Globe,
  Radio,
  FileText,
  Building2,
  PenTool,
  Lock,
  X,
} from 'lucide-react';
import { CategoryItem, DistrictItem, DivisionItem, PolicySectionKey } from '../types';
import { NavTab } from './BottomNav';

interface FooterProps {
  categories: CategoryItem[];
  districts: DistrictItem[];
  divisions: DivisionItem[];
  onNavigateTab: (tab: NavTab) => void;
  onNavigatePolicy?: (sectionKey: PolicySectionKey) => void;
  onSelectCategory?: (catId: string) => void;
  onSelectDistrict?: (distId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  districts,
  divisions,
  onNavigateTab,
  onNavigatePolicy,
  onSelectCategory,
  onSelectDistrict,
}) => {
  const [isSitemapOpen, setIsSitemapOpen] = useState(false);

  const handleOpenPolicy = (key: PolicySectionKey) => {
    if (onNavigatePolicy) {
      onNavigatePolicy(key);
    } else {
      window.location.hash = `#${key}`;
      onNavigateTab('policies');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs mt-12 border-t-4 border-[#ED1727]">
      {/* Tri-color Accent Bar */}
      <div className="w-full flex h-[3px]">
        <div className="flex-1 bg-[#ED1727]" />
        <div className="flex-1 bg-[#FDE900]" />
        <div className="flex-1 bg-[#344FD6]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand & Head Office (2 cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/brand/logo.png"
                alt="BREAKING NEWS WALA"
                className="h-10 w-auto object-contain bg-white p-1 rounded-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <span className="text-lg font-black tracking-tight text-white font-news-hero block">
                  BREAKING NEWS WALA
                </span>
                <span className="text-[11px] font-news-stylish font-bold text-red-500">
                  ब्रेकिंग न्यूज़ वाला • निष्पक्ष, निर्भीक, सटीक
                </span>
              </div>
            </div>

            <p className="text-slate-300 font-news-body font-medium leading-relaxed pr-4">
              मध्य प्रदेश के 55 जिलों और 10 संभागों की ज़मीनी सच्चाइयों, जनसमस्याओं और त्वरित
              समाचारों का अग्रणी डिजिटल प्लेटफ़ॉर्म। हम ग्रामीण व कस्बाई भारत की आवाज़ को
              राज्य और राष्ट्रीय मंच पर स्थापित करते हैं।
            </p>

            <div className="space-y-2 text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>
                  <strong>मुख्य संपादकीय कार्यालय:</strong> प्रेस परिसर, एमपी नगर जोन-1, भोपाल (मप्र) 462011 • शाखा ब्यूरो: ओरछा तिराहा, निवाड़ी (मप्र)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>संपादक: editor@breakingnewswala.com | जनसंपर्क: press@breakingnewswala.com</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>हेल्पलाइन / समाचार कक्ष: +91 755 4920000 / +91 755 4920001</span>
              </div>
            </div>
          </div>

          {/* Col 2: Top News Categories */}
          <div className="space-y-3">
            <h4 className="text-white font-news-editorial font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              प्रमुख श्रेणियां
            </h4>
            <ul className="space-y-1.5">
              {categories.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat.id);
                      onNavigateTab('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5"
                  >
                    <span className="text-red-600 font-bold">•</span>
                    <span>{cat.nameHi}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Statutory Legal & Financial Policies */}
          <div className="space-y-3">
            <h4 className="text-white font-news-editorial font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              कानूनी व वित्तीय नीतियां
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('privacy')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>गोपनीयता नीति (DPDPA 2023)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('terms')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-blue-500 font-bold">•</span>
                  <span>नियम एवं शर्तें (Terms of Service)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('payments')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-purple-500 font-bold">•</span>
                  <span>भुगतान, रिफंड व रद्दीकरण नीति (Razorpay)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('disclaimer')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-slate-400 font-bold">•</span>
                  <span>अस्वीकरण एवं कॉपीराइट (Disclaimer)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('advertising')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-amber-500 font-bold">•</span>
                  <span>विज्ञापन एवं प्रायोजन नीति (Advertising)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Editorial, Grievance & Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-news-editorial font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-500" />
              संपादकीय व शिकायत निवारण
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('about')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-red-500 font-bold">•</span>
                  <span>हमारे बारे में (About Newsroom)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('editorial')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-amber-400 font-bold">•</span>
                  <span>संपादकीय आचार संहिता व 10-बिंदु तथ्य-जांच</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('grievance')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-amber-500 font-bold">•</span>
                  <span>शिकायत निवारण अधिकारी (IT Rules 2021)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('contact')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-blue-400 font-bold">•</span>
                  <span>संपर्क करें व 10 संभाग ब्यूरो नेटवर्क</span>
                </button>
              </li>
              <li className="pt-1 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('epaper');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-slate-400"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>दैनिक डिजिटल ई-पेपर (55 जिले)</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* MP 10 Divisions & 55 Districts Cloud Directory */}
        <div className="mt-10 pt-8 border-t border-slate-900">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-white font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-red-500" />
              मध्य प्रदेश के 55 जिले (10 प्रशासनिक संभाग)
            </h5>
            <span className="text-[11px] text-slate-500">ज़िले पर क्लिक कर स्थानीय समाचार देखें</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {districts.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  if (onSelectDistrict) onSelectDistrict(d.id);
                  onNavigateTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-red-950 hover:text-red-300 text-slate-400 text-[11px] font-medium border border-slate-900 hover:border-red-800 transition-colors"
              >
                {d.nameHi}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Legal Copyright Bar */}
        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} <strong>BREAKING NEWS WALA</strong> (ब्रेकिंग न्यूज़ वाला). सर्वाधिकार सुरक्षित।
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => handleOpenPolicy('privacy')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              गोपनीयता नीति (DPDPA 2023)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('terms')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              नियम व शर्तें
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('payments')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              भुगतान व रिफंड नीति
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('grievance')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              शिकायत निवारण (IT Rules)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('about')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              हमारे बारे में
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('contact')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              संपर्क करें
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsSitemapOpen(true)}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              साइटमैप ({divisions.length} संभाग • {districts.length} जिले)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Sitemap Modal */}
      {isSitemapOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-news-editorial text-base sm:text-lg font-bold text-slate-950">
                पूर्ण पोर्टल साइटमैप (मध्य प्रदेश 10 संभाग व 55 जिले)
              </h3>
              <button
                type="button"
                onClick={() => setIsSitemapOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                aria-label="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">मुख्य समाचार श्रेणियां:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(c.id);
                        onNavigateTab('home');
                        setIsSitemapOpen(false);
                      }}
                      className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200"
                    >
                      {c.nameHi}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-800">संभागवार जिले:</h4>
                {divisions.map((div) => (
                  <div key={div.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-900 block">
                      {div.nameHi} ({div.headquarters})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {districts
                        .filter((d) => d.divisionId === div.id)
                        .map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              if (onSelectDistrict) onSelectDistrict(d.id);
                              onNavigateTab('home');
                              setIsSitemapOpen(false);
                            }}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 text-[11px] font-medium"
                          >
                            {d.nameHi}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSitemapOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
              >
                समझ गया / बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

