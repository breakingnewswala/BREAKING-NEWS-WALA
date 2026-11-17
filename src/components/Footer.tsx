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
import { CategoryItem, DistrictItem, DivisionItem } from '../types';
import { NavTab } from './BottomNav';

type LegalDocKey = 'terms' | 'privacy' | 'copyright' | 'disclaimer' | 'sitemap';

const LEGAL_DOCS: Record<Exclude<LegalDocKey, 'sitemap'>, { title: string; points: string[] }> = {
  terms: {
    title: 'नियम व शर्तें (Terms of Service)',
    points: [
      'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) मध्य प्रदेश केंद्रित डिजिटल समाचार एवं जनसरोकार मंच है। पोर्टल के किसी भी लेख, ग्राफ़िक या ई-पेपर का उपयोग केवल व्यक्तिगत एवं गैर-व्यावसायिक पठन हेतु अनुमन्य है।',
      'पाठक टिप्पणियों एवं संवाददाता रिपोर्ट्स में भारतीय सूचना प्रौद्योगिकी नियम (IT Rules 2021), मानहानि कानून तथा संवैधानिक मर्यादा का पूर्ण पालन अनिवार्य है।',
      'विवाद की स्थिति में न्यायिक क्षेत्राधिकार भोपाल (मध्य प्रदेश) होगा।',
    ],
  },
  privacy: {
    title: 'गोपनीयता नीति (DPDPA 2023 अनुपालन)',
    points: [
      'भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDPA 2023) के अंतर्गत हम पाठकों का केवल न्यूनतम आवश्यक डेटा (जैसे पठन प्राथमिकताएं, बुकमार्क्स, सूचना अनुमति व स्वैच्छिक लॉगिन प्रोफ़ाइल) सुरक्षित रखते हैं।',
      'किसी भी पाठक का व्यक्तिगत मोबाइल नंबर या ईमेल बिना स्पष्ट सहमति के तीसरे पक्ष या विज्ञापनदाताओं को साझा नहीं किया जाता।',
      'आप अपनी प्रोफ़ाइल के "इतिहास व DPDPA" टैब से कभी भी अपना संपूर्ण डेटा डाउनलोड या खाता विलोपन अनुरोध दर्ज कर सकते हैं।',
    ],
  },
  copyright: {
    title: 'कॉपीराइट व संपादकीय स्वामित्व नीति',
    points: [
      'इस वेबसाइट पर प्रकाशित समस्त मूल समाचार रिपोर्ट्स, विशेष फ़ोटो, ग्राफ़िक्स स्टूडियो क्रिएशंस, वीडियो बुलेटिन व ई-पेपर संस्करण BREAKING NEWS WALA की बौद्धिक संपदा हैं।',
      'बिना लिखित संपादकीय अनुमति के सामग्री का पुनर्प्रकाशन, स्क्रैपिंग या व्यावसायिक पुनर्वितरण वर्जित है। किसी साभार चित्र या प्रेस विज्ञप्ति में स्रोत का स्पष्ट उल्लेख किया जाता है।',
    ],
  },
  disclaimer: {
    title: 'अस्वीकरण एवं तथ्य सुधार नीति (Disclaimer)',
    points: [
      'संपादकीय डेस्क प्रत्येक समाचार को 10-बिंदु तथ्य-जांच (Fact Check) प्रक्रिया से गुज़ारने के बाद ही लाइव करता है; तथापि किसी मानवीय या स्रोतगत त्रुटि के संज्ञान में आने पर 24 घंटे में सुधार/शुद्धिपत्र प्रकाशित किया जाता है।',
      'मंडी भाव एवं मौसम बुलेटिन सांकेतिक जानकारी हेतु हैं — व्यापारिक निर्णय से पूर्व संबंधित कृषि उपज मंडी कार्यालय से पुष्टि अवश्य करें।',
      'शिकायत निवारण अधिकारी: अधिवक्ता राजेश सक्सेना (grievance@breakingnewswala.com)।',
    ],
  },
};

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
  const [activeLegalTopic, setActiveLegalTopic] = useState<LegalDocKey | null>(null);

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

          {/* Col 3: Editorial Compliance & IT Rules */}
          <div className="space-y-3">
            <h4 className="text-white font-news-editorial font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
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
            <h4 className="text-white font-news-editorial font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setActiveLegalTopic('terms')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              नियम व शर्तें
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalTopic('privacy')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              गोपनीयता नीति (DPDPA 2023)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalTopic('copyright')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              कॉपीराइट नीति
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalTopic('disclaimer')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              अस्वीकरण
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalTopic('sitemap')}
              className="hover:text-white underline-offset-2 hover:underline cursor-pointer"
            >
              साइटमैप ({divisions.length} संभाग • {districts.length} जिले)
            </button>
          </div>
        </div>
      </div>

      {/* Legal Policy & Interactive Sitemap Modal */}
      {activeLegalTopic && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-news-editorial text-base sm:text-lg font-bold text-slate-950">
                {activeLegalTopic === 'sitemap'
                  ? 'पूर्ण पोर्टल साइटमैप (मध्य प्रदेश 10 संभाग व 55 जिले)'
                  : LEGAL_DOCS[activeLegalTopic].title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveLegalTopic(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                aria-label="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeLegalTopic === 'sitemap' ? (
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
                          setActiveLegalTopic(null);
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
                                setActiveLegalTopic(null);
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
            ) : (
              <div className="space-y-3 text-xs sm:text-sm font-news-body text-slate-700 leading-relaxed">
                {LEGAL_DOCS[activeLegalTopic].points.map((pt, i) => (
                  <p key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {pt}
                  </p>
                ))}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
                  <strong>शिकायत व संपादकीय संपर्क:</strong> grievance@breakingnewswala.com • मुख्य कार्यालय: एमपी नगर जोन-1, भोपाल (मप्र)
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLegalTopic(null)}
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

