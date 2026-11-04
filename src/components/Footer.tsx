import React from 'react';
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
} from 'lucide-react';
import { CategoryItem, DistrictItem, DivisionItem } from '../types';
import { NavTab } from './BottomNav';

interface FooterProps {
  categories: CategoryItem[];
  districts: DistrictItem[];
  divisions: DivisionItem[];
  onNavigateTab: (tab: NavTab) => void;
  onSelectCategory?: (catId: string) => void;
  onSelectDistrict?: (distId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  districts,
  divisions,
  onNavigateTab,
  onSelectCategory,
  onSelectDistrict,
}) => {
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
                <span className="text-lg font-black tracking-tight text-white font-serif block">
                  BREAKING NEWS WALA
                </span>
                <span className="text-[11px] font-bold text-red-500">
                  ब्रेकिंग न्यूज़ वाला • निष्पक्ष, निर्भीक, सटीक
                </span>
              </div>
            </div>

            <p className="text-slate-300 font-medium leading-relaxed pr-4">
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
            <h4 className="text-white font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
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

          {/* Col 3: Editorial Compliance & IT Rules */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              संपादकीय संहिता
            </h4>
            <div className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
              <p>• सूचना प्रौद्योगिकी नियम (IT Rules 2021) का पूर्ण अनुपालन।</p>
              <p>• 10-बिंदु तथ्य-सत्यापन (Fact Check) व अनिवार्य स्रोत प्रमाणीकरण।</p>
              <p>• भ्रामक दावों व फेक न्यूज़ के विरुद्ध शून्य सहनशीलता (Zero Tolerance)।</p>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                <span className="text-amber-400 font-bold block">शिकायत निवारण अधिकारी:</span>
                <p className="text-slate-300">अधिवक्ता राजेश सक्सेना</p>
                <p className="text-slate-400">ईमेल: grievance@breakingnewswala.com</p>
              </div>
            </div>
          </div>

          {/* Col 4: Operational Desks & Management Surfaces */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-500" />
              कार्यक्षेत्र व पोर्टल
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  onNavigateTab('epaper');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center gap-2 text-slate-200"
              >
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs block">दैनिक डिजिटल ई-पेपर</span>
                  <span className="text-[10px] text-slate-400">सभी जिला संस्करण व पेज आर्काइव</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigateTab('reporter');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center gap-2 text-slate-200"
              >
                <PenTool className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs block">संवाददाता फील्ड पोर्टल</span>
                  <span className="text-[10px] text-slate-400">कच्ची स्क्रिप्ट व AI सहायक ड्राफ्ट</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigateTab('newsroom');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center gap-2 text-slate-200"
              >
                <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs block">केंद्रीय न्यूज़रूम डेस्क</span>
                  <span className="text-[10px] text-slate-400">लाइव समीक्षा, अनुमोदन व अलर्ट</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigateTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center gap-2 text-slate-200"
              >
                <Lock className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <span className="font-bold text-xs block">एडमिन कंट्रोल पैनल</span>
                  <span className="text-[10px] text-slate-400">रिपोर्टर मान्यता, ऑडिट एवं विज्ञापन</span>
                </div>
              </button>
            </div>
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

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="hover:text-slate-300 cursor-pointer">नियम व शर्तें</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">गोपनीयता नीति (DPDPA 2023)</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">कॉपीराइट नीति</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">अस्वीकरण</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">साइटमैप</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

