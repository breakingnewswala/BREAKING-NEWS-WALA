import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Scale,
  CreditCard,
  AlertCircle,
  Building2,
  Phone,
  FileText,
  Megaphone,
  CheckCircle2,
  Copy,
  Printer,
  Search,
  ArrowLeft,
  Mail,
  MapPin,
  Clock,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { PolicySectionKey } from '../types';

interface PolicyHubScreenProps {
  initialSection?: PolicySectionKey;
  onNavigateHome: () => void;
  onSectionChange?: (section: PolicySectionKey) => void;
}

interface PolicyMeta {
  key: PolicySectionKey;
  label: string;
  shortDesc: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const POLICY_SECTIONS: PolicyMeta[] = [
  {
    key: 'privacy',
    label: 'गोपनीयता नीति (Privacy Policy)',
    shortDesc: 'DPDPA 2023 अनुपालन व डेटा सुरक्षा',
    badge: 'DPDPA 2023',
    icon: ShieldCheck,
  },
  {
    key: 'terms',
    label: 'नियम एवं शर्तें (Terms of Service)',
    shortDesc: 'पोर्टल उपयोग व पाठक आचरण नियम',
    badge: 'IT Act 2000',
    icon: Scale,
  },
  {
    key: 'payments',
    label: 'भुगतान, रिफंड व रद्दीकरण नीति',
    shortDesc: 'Razorpay, ई-पेपर व विज्ञापन बिलिंग',
    badge: 'RBI / Razorpay',
    icon: CreditCard,
  },
  {
    key: 'grievance',
    label: 'शिकायत निवारण (Grievance Redressal)',
    shortDesc: 'IT Rules 2021 नियम 11 व अधिकारी संपर्क',
    badge: 'IT Rules 2021',
    icon: AlertCircle,
  },
  {
    key: 'editorial',
    label: 'संपादकीय संहिता व तथ्य-जांच',
    shortDesc: '10-बिंदु तथ्य-सत्यापन व शुद्धिपत्र',
    badge: 'PCI Standards',
    icon: FileText,
  },
  {
    key: 'about',
    label: 'हमारे बारे में (About Us)',
    shortDesc: 'परिचय, विज़न व 55 जिलों में नेटवर्क',
    badge: 'न्यूज़रूम परिचय',
    icon: Building2,
  },
  {
    key: 'contact',
    label: 'संपर्क करें व संभाग ब्यूरो',
    shortDesc: 'भोपाल मुख्यालय व 10 संभाग कार्यालय',
    badge: 'हेल्पलाइन व पते',
    icon: Phone,
  },
  {
    key: 'disclaimer',
    label: 'अस्वीकरण एवं कॉपीराइट',
    shortDesc: 'बौद्धिक संपदा व दायित्व सीमा',
    badge: 'कानूनी सुरक्षा',
    icon: HelpCircle,
  },
  {
    key: 'advertising',
    label: 'विज्ञापन एवं प्रायोजन नीति',
    shortDesc: 'पारदर्शिता व प्रायोजित सामग्री नियम',
    badge: 'कमर्शियल गाइडलाइंस',
    icon: Megaphone,
  },
];

export const PolicyHubScreen: React.FC<PolicyHubScreenProps> = ({
  initialSection = 'privacy',
  onNavigateHome,
  onSectionChange,
}) => {
  const [activeSection, setActiveSection] = useState<PolicySectionKey>(
    initialSection === 'refund' ? 'payments' : initialSection
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Grievance Form State
  const [grievanceForm, setGrievanceForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    articleUrlOrHeadline: '',
    category: 'FACTUAL_ERROR',
    description: '',
  });
  const [grievanceSubmitted, setGrievanceSubmitted] = useState(false);
  const [grievanceTicketId, setGrievanceTicketId] = useState('');

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    emailOrPhone: '',
    city: '',
    inquiryType: 'EDITORIAL',
    subject: '',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    if (initialSection) {
      const normalized = initialSection === 'refund' ? 'payments' : initialSection;
      setActiveSection(normalized);
    }
  }, [initialSection]);

  const handleSelectSection = (key: PolicySectionKey) => {
    setActiveSection(key);
    if (onSectionChange) {
      onSectionChange(key);
    }
    // Update hash for deep linking
    const targetHash = key === 'privacy' ? '#privacy' :
                       key === 'terms' ? '#terms' :
                       key === 'payments' ? '#payments' :
                       key === 'grievance' ? '#grievance' :
                       key === 'editorial' ? '#editorial-policy' :
                       key === 'about' ? '#about' :
                       key === 'contact' ? '#contact' :
                       key === 'disclaimer' ? '#disclaimer' :
                       key === 'advertising' ? '#advertising' : `#${key}`;
    window.location.hash = targetHash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceForm.name || !grievanceForm.phone || !grievanceForm.description) {
      alert('कृपया नाम, मोबाइल नंबर और शिकायत का विवरण अवश्य भरें।');
      return;
    }
    const ticket = `BNW-GR-${Date.now().toString().slice(-6)}`;
    setGrievanceTicketId(ticket);
    setGrievanceSubmitted(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.emailOrPhone || !contactForm.message) {
      alert('कृपया नाम, संपर्क सूत्र और अपना संदेश अवश्य भरें।');
      return;
    }
    setContactSubmitted(true);
  };

  const currentMeta = POLICY_SECTIONS.find((s) => s.key === activeSection) || POLICY_SECTIONS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-news-body">
      {/* Top Header / Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-red-600" />
              <span>मुख्य पृष्ठ (Home)</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>/</span>
              <span>नीतियां व कानूनी नियम</span>
              <span>/</span>
              <span className="text-red-600 font-bold">{currentMeta.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title="इस पेज का लिंक कॉपी करें"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">कॉपी हुआ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">शेयर लिंक</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title="दस्तावेज़ प्रिंट करें"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">प्रिंट</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Section Tabs */}
        <div className="lg:hidden border-t border-slate-100 overflow-x-auto no-scrollbar py-2 px-4 flex gap-2 bg-slate-50">
          {POLICY_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.key;
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => handleSelectSection(sec.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{sec.label.split('(')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Banner for Policy Hub */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white py-8 px-4 border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-red-600/30 border border-red-500 text-red-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>आधिकारिक वैधानिक एवं संपादकीय दस्तावेज़</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-news-hero tracking-tight text-white">
              {currentMeta.label}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) • मध्य प्रदेश का अग्रणी डिजिटल समाचार मंच
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="इस नीति में खोजें..."
              className="bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-hidden w-full px-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-white px-2"
              >
                हटाएं
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Sidebar (Desktop) + Right Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
              <h3 className="font-news-editorial font-bold text-sm text-slate-900 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span>दस्तावेज़ अनुक्रमणिका</span>
                <span className="text-[11px] text-red-600 font-bold">{POLICY_SECTIONS.length} नीतियां</span>
              </h3>
              <nav className="space-y-1">
                {POLICY_SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.key;
                  return (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => handleSelectSection(sec.key)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                        isActive
                          ? 'bg-red-50 text-red-950 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <span
                        className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                          isActive ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate block">{sec.label.split('(')[0].trim()}</span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                              isActive ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {sec.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">{sec.shortDesc}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Contact & Grievance Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-300 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>त्वरित शिकायत निवारण (IT Rules)</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                किसी भी लेख, तथ्य-त्रुटि या आपत्तिजनक टिप्पणी के सुधार हेतु हमारे नोडल अधिकारी से 24 घंटे में संपर्क करें।
              </p>
              <div className="pt-2 border-t border-amber-200/60 text-xs space-y-1">
                <p className="text-slate-900 font-bold">अधिवक्ता राजेश सक्सेना</p>
                <p className="text-slate-600 text-[11px]">grievance@breakingnewswala.com</p>
                <p className="text-slate-600 text-[11px]">+91 755 4920000</p>
              </div>
            </div>
          </aside>

          {/* Right Main Policy Content Area */}
          <main className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
            {/* 1. PRIVACY POLICY */}
            {activeSection === 'privacy' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      DPDPA 2023 अनुपालन
                    </span>
                    <span className="text-xs text-slate-500">अंतिम अद्यतन: 2026-11-24</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    गोपनीयता नीति (Digital Personal Data Protection Policy)
                  </h2>
                  <p className="text-xs text-slate-600">
                    भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDPA 2023) एवं सूचना प्रौद्योगिकी अधिनियम (IT Act 2000) के तहत पाठक डेटा सुरक्षा घोषणा।
                  </p>
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    1. परिचय एवं हमारी प्रतिबद्धता
                  </h3>
                  <p>
                    <strong>BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)</strong> पाठकों की व्यक्तिगत गोपनीयता का सर्वोच्च सम्मान करता है। हम केवल निष्पक्ष पत्रकारिता, स्थानीय समाचार प्रसारण, और व्यक्तिगत पठन प्राथमिकताओं के उद्देश्य से न्यूनतम आवश्यक डेटा ही संसाधित करते हैं। हम कभी भी पाठकों के डेटा का वाणिज्यिक विक्रय (Sale of Data) नहीं करते।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    2. हम कौन सा डेटा एकत्र करते हैं?
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li><strong>स्वैच्छिक प्रोफ़ाइल जानकारी:</strong> जब आप टिप्पणी करने, रिपोर्टर बनने या ई-पेपर सब्सक्रिप्शन के लिए पंजीकरण करते हैं (जैसे नाम, मोबाइल नंबर, ईमेल पता व ज़िला)।</li>
                    <li><strong>पठन प्राथमिकताएं व बुकमार्क्स:</strong> आपके द्वारा सुरक्षित किए गए समाचार लेख, पसंदीदा जिले और पढ़ी गई खबरें (केवल आपके डिवाइस और सुरक्षित प्रोफ़ाइल में)।</li>
                    <li><strong>पुश नोटिफिकेशन अनुमति:</strong> यदि आप ब्रेकिंग न्यूज़ अलर्ट स्वीकार करते हैं, तो एक अनाम डिवाइस टोकन (FCM Token)।</li>
                    <li><strong>तकनीकी लॉग:</strong> आईपी पता, ब्राउज़र संस्करण एवं डिवाइस प्रकार, जो केवल साइबर सुरक्षा, डीडीओएस सुरक्षा और सर्वर प्रदर्शन निगरानी हेतु उपयोग किए जाते हैं।</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    3. डेटा के उपयोग का प्रयोजन (Purpose Limitation)
                  </h3>
                  <p>
                    एकत्रित जानकारी का उपयोग केवल निम्नलिखित वैधानिक प्रयोजनों हेतु किया जाता है:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <strong className="block text-slate-900 text-xs font-bold">हाइपरलोकल समाचार वितरण</strong>
                      <span className="text-xs text-slate-600">आपके चयनित जिले और संभाग की खबरों को प्रमुखता से दिखाना।</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <strong className="block text-slate-900 text-xs font-bold">आपातकालीन जनसूचना</strong>
                      <span className="text-xs text-slate-600">मौसम, प्राकृतिक आपदा या प्रशासनिक यलो/रेड अलर्ट तुरंत प्रेषित करना।</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <strong className="block text-slate-900 text-xs font-bold">प्रमाणीकरण व सदस्यता</strong>
                      <span className="text-xs text-slate-600">ई-पेपर डिजिटल अभिलेखागार एवं रिपोर्टर डेस्क सत्यापन।</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <strong className="block text-slate-900 text-xs font-bold">कानूनी अनुपालन</strong>
                      <span className="text-xs text-slate-600">आईटी नियम 2021 और भारतीय कानूनों के अंतर्गत ऑडिट ट्रेल्स।</span>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    4. DPDPA 2023 के तहत पाठक के वैधानिक अधिकार
                  </h3>
                  <p>
                    भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम के अंतर्गत प्रत्येक पाठक को निम्नलिखित अधिकार प्राप्त हैं:
                  </p>
                  <ul className="space-y-2 pl-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>डेटा सारांश प्राप्त करने का अधिकार (Right to Information):</strong> आप अपनी प्रोफ़ाइल में जाकर जान सकते हैं कि आपका कौन सा डेटा हमारे पास दर्ज है।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>डेटा सुधार एवं विलोपन का अधिकार (Right to Erasure / Right to be Forgotten):</strong> आप कभी भी अपना डेटा या खाता स्थायी रूप से हटाने का अनुरोध कर सकते हैं।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>सहमति वापसी का अधिकार (Withdrawal of Consent):</strong> आप ब्राउज़र सेटिंग्स या प्रोफ़ाइल से पुश नोटिफिकेशंस व कुकीज़ कभी भी बंद कर सकते हैं।</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    5. डेटा सुरक्षा उपाय (Security Measures)
                  </h3>
                  <p>
                    हम 256-बिट एसएसएल एन्क्रिप्शन, सख्त फ़ायरवॉल (Cloudflare WAF), आर्गन2िड (Argon2id) पासवर्ड हैशिंग, तथा रोल-बेस्ड एक्सेस कंट्रोल (RBAC) का उपयोग करते हैं। हमारे कर्मचारियों को भी अनावश्यक रूप से पाठक का निजी विवरण देखने की अनुमति नहीं है।
                  </p>
                </section>

                <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs space-y-2">
                  <strong className="text-slate-900 block font-bold">डेटा सुरक्षा अधिकारी संपर्क:</strong>
                  <p>ईमेल: privacy@breakingnewswala.com | मुख्य कार्यालय: प्रेस परिसर, एमपी नगर जोन-1, भोपाल (मप्र) 462011</p>
                </div>
              </article>
            )}

            {/* 2. TERMS OF SERVICE */}
            {activeSection === 'terms' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      IT Act 2000 एवं नियम 2021
                    </span>
                    <span className="text-xs text-slate-500">अंतिम अद्यतन: 2026-11-24</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    नियम एवं शर्तें (Terms and Conditions of Use)
                  </h2>
                  <p className="text-xs text-slate-600">
                    BREAKING NEWS WALA वेबसाइट, मोबाइल वेब, ई-पेपर व संवाददाता सेवाओं के उपयोग का वैधानिक अनुबंध।
                  </p>
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    1. पोर्टल का वैधानिक उपयोग
                  </h3>
                  <p>
                    इस वेबसाइट एवं इसके किसी भी भाग का उपयोग केवल व्यक्तिगत, गैर-व्यावसायिक एवं वैध सूचनात्मक उद्देश्यों हेतु ही किया जा सकता है। वेबसाइट का उपयोग प्रारंभ करने के साथ ही आप इन नियमों व शर्तों से पूर्णतः बाध्य होने की सहमति प्रदान करते हैं।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    2. बौद्धिक संपदा एवं कॉपीराइट
                  </h3>
                  <p>
                    इस पोर्टल पर प्रकाशित समस्त मूल समाचार, विशेष आलेख, जिला ब्यूरो रिपोर्ट, इन्फोग्राफिक्स, ई-पेपर संस्करण, वीडियो बुलेटिन एवं लोगो <strong>BREAKING NEWS WALA</strong> की विशेष बौद्धिक संपदा हैं। बिना लिखित संपादकीय अनुमति के संपूर्ण लेख या ग्राफ़िक का पुनर्प्रकाशन, डेटा स्क्रैपिंग (Automated Scraping) अथवा व्यावसायिक वितरण सख्त वर्जित है।
                  </p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <strong>उचित उपयोग (Fair Use):</strong> किसी शैक्षणिक या सामाजिक चर्चा में अधिकतम 100 शब्दों का उद्धरण केवल तब अनुमत है जब स्पष्ट रूप से BREAKING NEWS WALA को क्रेडिट और एक्टिव हाइपरलिंक प्रदान किया गया हो।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    3. पाठक टिप्पणियां एवं उपयोगकर्ता आचरण (User Conduct)
                  </h3>
                  <p>
                    पाठक टिप्पणियों व जनसंवाद में भारतीय कानून की मर्यादा का पालन अनिवार्य है। निम्नलिखित सामग्री पोस्ट करना प्रतिबंधित है:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li>भारत की संप्रभुता, अखंडता या सार्वजनिक शांति को खतरे में डालने वाली सामग्री।</li>
                    <li>किसी जाति, धर्म, संप्रदाय, लिंग या समुदाय के विरुद्ध घृणास्पद भाषण (Hate Speech)।</li>
                    <li>न्यायालय की अवमानना, मानहानिकारक (Defamatory) या अश्लील वक्तव्य।</li>
                    <li>नाबालिगों, पोक्सो (POCSO) पीड़ितों अथवा यौन उत्पीड़न के मामलों में पहचान उजागर करना।</li>
                    <li>व्यावसायिक स्पैम, लॉटरी के झूठे दावे या अवैध लिंक।</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    4. रिपोर्टर एवं संवाददाताओं की जिम्मेदारी
                  </h3>
                  <p>
                    संवाददाता डेस्क से सबमिट की गई प्रत्येक खबर के लिए संवाददाता व्यक्तिगत रूप से सत्यनिष्ठा हेतु उत्तरदायी है। कोई भी मनगढ़ंत, असत्यापित अथवा पेड-न्यूज़ भेजने पर संवाददाता की मान्यता तत्काल समाप्त कर विधिक कार्रवाई की जा सकेगी।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    5. न्यायिक क्षेत्राधिकार (Jurisdiction)
                  </h3>
                  <p>
                    इस वेबसाइट, इसके कंटेंट या अनुबंध से उत्पन्न किसी भी विधिक विवाद की स्थिति में अनन्य न्यायिक क्षेत्राधिकार केवल <strong>भोपाल, मध्य प्रदेश (Bhopal, MP) स्थित सक्षम न्यायालयों</strong> का होगा।
                  </p>
                </section>
              </article>
            )}

            {/* 3. PAYMENTS, REFUND & CANCELLATION POLICY */}
            {activeSection === 'payments' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                      RBI एवं Razorpay पेमेंट गेटवे अनुपालन
                    </span>
                    <span className="text-xs text-slate-500">अंतिम अद्यतन: 2026-11-24</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    भुगतान, मूल्य निर्धारण, रद्दीकरण एवं धनवापसी नीति (Billing & Refund Policy)
                  </h2>
                  <p className="text-xs text-slate-600">
                    डिजिटल ई-पेपर, विज्ञापन स्लॉट व संवाददाता सत्यापन शुल्क हेतु पारदर्शी वित्तीय नियम।
                  </p>
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    1. सेवा एवं उत्पाद की प्रकृति
                  </h3>
                  <p>
                    BREAKING NEWS WALA मंच पर निम्नलिखित सेवाओं हेतु डिजिटल भुगतान स्वीकार किए जाते हैं:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li><strong>दैनिक डिजिटल ई-पेपर सदस्यता:</strong> मध्य प्रदेश के सभी जिला संस्करणों व प्रीमियम डिजिटल आर्काइव तक पहुंच।</li>
                    <li><strong>डिजिटल विज्ञापन एवं प्रायोजन स्लॉट:</strong> पोर्टल, लाइव बुलेटिन व ई-पेपर में स्थानीय व्यवसायों व संस्थानों के विज्ञापन।</li>
                    <li><strong>संवाददाता प्रेस कार्ड व सत्यापन शुल्क:</strong> फील्ड स्ट्रिंगर्स के भौतिक पहचान पत्र एवं पृष्ठभूमि सत्यापन की प्रशासनिक लागत।</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    2. मूल्य निर्धारण एवं मुद्रा (Pricing in INR)
                  </h3>
                  <p>
                    पोर्टल पर सभी शुल्क भारतीय रुपये (₹ / INR) में प्रदर्शित किए जाते हैं। नियम अनुसार लागू जीएसटी (Goods and Services Tax) बिलिंग के समय स्पष्ट रूप से दर्शाया जाता है। कोई भी छिपा हुआ शुल्क (Hidden Fee) नहीं लिया जाता।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    3. स्वीकृत भुगतान विधियां एवं सुरक्षा (Payment Methods & PCI-DSS)
                  </h3>
                  <p>
                    हम भारतीय रिज़र्व बैंक (RBI) द्वारा अधिकृत सुरक्षित पेमेंट एग्रीगेटर्स (जैसे <strong>Razorpay</strong> एवं <strong>PhonePe</strong>) के माध्यम से भुगतान स्वीकार करते हैं:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                      UPI (GPay / PhonePe / Paytm / BHIM)
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                      RuPay / Visa / MasterCard डेबिट कार्ड
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                      ऑल-बैंक नेटबैंकिंग (NetBanking)
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                      क्रेडिट कार्ड्स एवं अधिकृत वॉलेट्स
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-950 font-medium">
                    <strong>सुरक्षा गारंटी:</strong> लेन-देन 128/256-बिट SSL एन्क्रिप्टेड है। हम आपके डेबिट/क्रेडिट कार्ड का 16-अंकीय नंबर, सीवीवी (CVV) या बैंकिंग पासवर्ड अपने सर्वर पर कभी स्टोर नहीं करते।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    4. रद्दीकरण नीति (Cancellation Policy)
                  </h3>
                  <div className="space-y-2 text-slate-700">
                    <p>
                      • <strong>डिजिटल ई-पेपर सदस्यता:</strong> डिजिटल सामग्री तुरंत सक्रिय हो जाती है; अतः चालू माह की सक्रिय सदस्यता रद्द करने पर आंशिक राशि वापस नहीं की जा सकती, किंतु आप अगली बिलिंग साइकिल के लिए स्वतः-नवीनीकरण कभी भी रद्द कर सकते हैं।
                    </p>
                    <p>
                      • <strong>विज्ञापन बुकिंग:</strong> यदि विज्ञापनदाता निर्धारित प्रकाशन तिथि से कम से कम 24 घंटे पूर्व लिखित सूचना देता है, तो विज्ञापन रद्द किया जा सकता है (10% प्रशासनिक शुल्क काटकर)। प्रकाशन के उपरांत कोई रद्दीकरण मान्य नहीं होगा।
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    5. धनवापसी नीति (Refund Policy & Turnaround Timeline)
                  </h3>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2 text-purple-950">
                    <strong className="block text-sm font-bold">धनवापसी की शर्तें व समय-सीमा:</strong>
                    <ul className="list-disc list-inside space-y-1 text-xs text-purple-900">
                      <li><strong>दोहरा भुगतान (Duplicate Deduction):</strong> यदि तकनीकी त्रुटि से आपके खाते से एक ही लेन-देन के लिए दो बार राशि कट गई है, तो अतिरिक्त राशि 48 घंटे में स्वतः रिफंड की जाएगी।</li>
                      <li><strong>सेवा न मिलना (Service Non-Delivery):</strong> यदि भुगतान सफल होने पर भी तकनीकी खराबी के कारण ई-पेपर या विज्ञापन स्लॉट सक्रिय नहीं हुआ, तो पूर्ण 100% रिफंड दिया जाएगा।</li>
                      <li><strong>रिफंड ट्रांसफर समय:</strong> स्वीकृति के बाद राशि <strong>5 से 7 कार्यदिवसों (5-7 Business Days)</strong> के भीतर सीधे उसी मूल बैंक खाते / यूपीआई / कार्ड में क्रेडिट हो जाती है जिससे भुगतान किया गया था।</li>
                    </ul>
                  </div>
                </section>

                <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs space-y-2">
                  <strong className="text-slate-900 block font-bold">बिलिंग व रिफंड हेल्पडेस्क:</strong>
                  <p>ईमेल: billing@breakingnewswala.com | हेल्पलाइन: +91 755 4920000</p>
                  <p className="text-slate-500">कार्यालय समय: सोमवार से शनिवार, प्रातः 10:00 से सायं 6:00 बजे तक</p>
                </div>
              </article>
            )}

            {/* 4. GRIEVANCE REDRESSAL (IT RULES 2021) */}
            {activeSection === 'grievance' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                      IT Rules 2021 नियम 11 वैधानिक अनिवार्य
                    </span>
                    <span className="text-xs text-slate-500">शिकायत निवारण तंत्र</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    शिकायत निवारण अधिकारी एवं आचार संहिता (Grievance Redressal Mechanism)
                  </h2>
                  <p className="text-xs text-slate-600">
                    भारत सरकार के सूचना प्रौद्योगिकी (मध्यवर्ती दिशानिर्देश और डिजिटल मीडिया आचार संहिता) नियम, 2021 के अंतर्गत अनिवार्य शिकायत तंत्र।
                  </p>
                </div>

                {/* Grievance Officer Details Box */}
                <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-3">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    <span>नामित शिकायत निवारण अधिकारी (Resident Grievance Officer)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <p className="text-slate-500">अधिकारी का नाम व पदनाम:</p>
                      <p className="text-slate-950 font-bold text-sm">अधिवक्ता राजेश सक्सेना (Adv. Rajesh Saxena)</p>
                      <p className="text-slate-600">नोडल शिकायत निवारण अधिकारी (विधिक)</p>
                    </div>
                    <div>
                      <p className="text-slate-500">आधिकारिक संपर्क ईमेल:</p>
                      <p className="text-red-700 font-bold text-sm">grievance@breakingnewswala.com</p>
                      <p className="text-slate-600">हेल्पलाइन: +91 755 4920000</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-slate-500">पत्राचार का पता:</p>
                      <p className="text-slate-900 font-medium">
                        शिकायत निवारण प्रकोष्ठ, BREAKING NEWS WALA, प्रेस परिसर, एमपी नगर जोन-1, भोपाल (मध्य प्रदेश) - 462011
                      </p>
                    </div>
                  </div>
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    त्रि-स्तरीय शिकायत निवारण प्रक्रिया एवं समय-सीमा
                  </h3>
                  <div className="space-y-2 text-slate-700">
                    <p>
                      <strong>स्तर 1 (प्रकाशक स्तर):</strong> शिकायत प्राप्त होने के <strong>24 घंटे के भीतर</strong> पावती (Acknowledgment) ईमेल जारी की जाती है और <strong>15 दिनों के भीतर</strong> मामले का विधिवत निस्तारण या सुधार किया जाता है।
                    </p>
                    <p>
                      <strong>स्तर 2 (स्व-नियामक संस्था):</strong> डिजिटल मीडिया प्रकाशकों की स्व-नियामक संस्था के मानकों का पालन।
                    </p>
                    <p>
                      <strong>स्तर 3 (समीक्षा तंत्र):</strong> सूचना एवं प्रसारण मंत्रालय, भारत सरकार की निगरानी समिति।
                    </p>
                  </div>
                </section>

                {/* Interactive Grievance Form */}
                <section className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Send className="w-4 h-4 text-red-600" />
                    ऑनलाइन शिकायत दर्ज करें (Online Grievance Submission)
                  </h3>

                  {grievanceSubmitted ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>आपकी शिकायत दर्ज कर ली गई है!</span>
                      </div>
                      <p className="text-xs">
                        शिकायत संदर्भ संख्या (Ticket ID): <strong>{grievanceTicketId}</strong>
                      </p>
                      <p className="text-xs text-emerald-900">
                        हमारे शिकायत निवारण अधिकारी द्वारा 24 घंटे के भीतर पावती भेजी जाएगी एवं नियमानुसार 15 दिन में निस्तारण किया जाएगा।
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setGrievanceSubmitted(false);
                          setGrievanceForm({
                            name: '',
                            email: '',
                            phone: '',
                            city: '',
                            articleUrlOrHeadline: '',
                            category: 'FACTUAL_ERROR',
                            description: '',
                          });
                        }}
                        className="mt-2 px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        नई शिकायत दर्ज करें
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleGrievanceSubmit} className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">शिकायतकर्ता का नाम *</label>
                          <input
                            type="text"
                            required
                            value={grievanceForm.name}
                            onChange={(e) => setGrievanceForm({ ...grievanceForm, name: e.target.value })}
                            placeholder="पूरा नाम दर्ज करें"
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर *</label>
                          <input
                            type="tel"
                            required
                            value={grievanceForm.phone}
                            onChange={(e) => setGrievanceForm({ ...grievanceForm, phone: e.target.value })}
                            placeholder="10-अंकीय मोबाइल नंबर"
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">ईमेल पता</label>
                          <input
                            type="email"
                            value={grievanceForm.email}
                            onChange={(e) => setGrievanceForm({ ...grievanceForm, email: e.target.value })}
                            placeholder="name@example.com"
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">ज़िला / शहर (मध्य प्रदेश)</label>
                          <input
                            type="text"
                            value={grievanceForm.city}
                            onChange={(e) => setGrievanceForm({ ...grievanceForm, city: e.target.value })}
                            placeholder="उदा. भोपाल, इंदौर, ग्वालियर"
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">शिकायत का प्रकार</label>
                          <select
                            value={grievanceForm.category}
                            onChange={(e) => setGrievanceForm({ ...grievanceForm, category: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          >
                            <option value="FACTUAL_ERROR">तथ्यात्मक त्रुटि (Factual Inaccuracy)</option>
                            <option value="DEFAMATION">मानहानिकारक सामग्री (Defamation)</option>
                            <option value="PRIVACY_VIOLATION">निजता का हनन (Privacy Violation)</option>
                            <option value="COPYRIGHT">कॉपीराइट उल्लंघन (Copyright Infringement)</option>
                            <option value="OBSCENITY">अनुचित/आपत्तिजनक भाषा (Inappropriate Content)</option>
                            <option value="OTHER">अन्य कानूनी विषय (Other)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">संबंधित खबर का शीर्षक / वेब लिंक</label>
                          <input
                            type="text"
                            value={grievanceForm.articleUrlOrHeadline}
                            onChange={(e) => setGrievanceForm({ ...grievanceForm, articleUrlOrHeadline: e.target.value })}
                            placeholder="लेख का शीर्षक या URL"
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">शिकायत का विस्तृत विवरण *</label>
                        <textarea
                          required
                          rows={3}
                          value={grievanceForm.description}
                          onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                          placeholder="कृपया स्पष्ट करें कि खबर के किस हिस्से में क्या त्रुटि या आपत्ति है..."
                          className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>शिकायत दर्ज करें</span>
                      </button>
                    </form>
                  )}
                </section>
              </article>
            )}

            {/* 5. EDITORIAL CODE OF ETHICS & FACT-CHECK */}
            {activeSection === 'editorial' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      PCI एवं NBDSA मानक
                    </span>
                    <span className="text-xs text-slate-500">संपादकीय आचार संहिता</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    संपादकीय आचार संहिता एवं 10-बिंदु तथ्य-जांच प्रणाली (Editorial Ethics)
                  </h2>
                  <p className="text-xs text-slate-600">
                    प्रेस काउंसिल ऑफ इंडिया (PCI) के मानकों पर आधारित सत्यनिष्ठा, निष्पक्षता व त्रुटि-सुधार नीति।
                  </p>
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    १०-बिंदु तथ्य सत्यापन प्रणाली (10-Point Fact-Checking Protocol)
                  </h3>
                  <p>
                    BREAKING NEWS WALA की केंद्रीय न्यूज़रूम डेस्क पर किसी भी खबर को लाइव करने से पूर्व निम्नलिखित 10 चरणों से गुज़ारना अनिवार्य है:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { num: '१', title: 'मूल स्रोत प्रमाणीकरण', desc: 'सरकारी विज्ञप्ति, एफआईआर प्रति, या घटनास्थल के प्रत्यक्षदर्शी से पुष्टि।' },
                      { num: '२', title: 'दोहरे स्रोत का नियम', desc: 'किसी भी संवेदनशील या विवादास्पद दावे के लिए कम से कम दो स्वतंत्र स्रोत।' },
                      { num: '३', title: 'स्थान व समय का सत्यापन', desc: 'फोटो व वीडियो की जियो-टैगिंग और टाइमस्टैम्प की तकनीकी जांच।' },
                      { num: '४', title: 'डीपफेक व रिवर्स इमेज सर्च', desc: 'एआई जनरेटेड या पुराने भ्रामक विजुअल्स को पकड़ने के लिए इमेज सर्च।' },
                      { num: '५', title: 'संतुलित पक्ष (Right to Reply)', desc: 'आरोपी व पीड़ित दोनों पक्षों का अधिकृत बयान दर्ज करने का प्रयास।' },
                      { num: '६', title: 'संवेदनशील मामलों में नाम गोपनीयता', desc: 'नाबालिग, महिला व पोक्सो पीड़ितों के नाम-फोटो पर पूर्ण प्रतिबंध।' },
                      { num: '७', title: 'सांप्रदायिक व भड़काऊ सामग्री निषेध', desc: 'सार्वजनिक सौहार्द्र बिगाड़ने वाले असत्यापित दावों पर शून्य सहनशीलता।' },
                      { num: '८', title: 'मंडी भाव व मौसम पुष्टि', desc: 'कृषि उपज मंडी समिति एवं भारत मौसम विज्ञान विभाग (IMD) डेटा मिलान।' },
                      { num: '९', title: 'कॉपीराइट व क्रेडिट का उल्लेख', desc: 'साभार सामग्री में मूल छायाकार अथवा स्रोत संस्था का स्पष्ट नाम।' },
                      { num: '१०', title: 'डेस्क संपादक द्वारा अंतिम अनुमोदन', desc: 'वरिष्ठ डेस्क संपादक द्वारा सभी बिंदुओं पर हरी झंडी के बाद ही पब्लिश।' },
                    ].map((pt) => (
                      <div key={pt.num} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs shrink-0">
                          {pt.num}
                        </span>
                        <div>
                          <strong className="block text-slate-900 text-xs font-bold">{pt.title}</strong>
                          <span className="text-[11px] text-slate-600 leading-tight block">{pt.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    पारदर्शी त्रुटि-सुधार एवं शुद्धिपत्र नीति (Correction & Errata Policy)
                  </h3>
                  <p>
                    मानवीय अथवा स्रोतगत भूलवश यदि किसी खबर में कोई तथ्यात्मक त्रुटि प्रकाशित हो जाती है, तो संज्ञान में आते ही <strong>24 घंटे के भीतर</strong> सुधार किया जाता है। सुधारे गए लेख के शीर्ष या पाद में स्पष्ट रूप से <em>"शुद्धिपत्र (Correction Note)"</em> अंकित किया जाता है, जिसमें त्रुटि का स्वरूप और सुधार का समय स्पष्ट लिखा होता है।
                  </p>
                </section>
              </article>
            )}

            {/* 6. ABOUT US */}
            {activeSection === 'about' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                      मध्य प्रदेश 55 जिले • 10 संभाग
                    </span>
                    <span className="text-xs text-slate-500">परिचय एवं मिशन</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    हमारे बारे में (About BREAKING NEWS WALA)
                  </h2>
                  <p className="text-xs text-slate-600">
                    मध्य प्रदेश की धड़कन, ज़मीनी सच्चाइयों और ग्रामीण भारत की निर्भीक आवाज़।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <img
                    src="/brand/logo.png"
                    alt="Logo"
                    className="h-14 w-auto object-contain bg-white p-2 rounded-xl shrink-0"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div>
                    <h3 className="text-lg font-black font-news-hero">BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)</h3>
                    <p className="text-xs text-red-100 font-medium">
                      हमारा ध्येय: <strong>निष्पक्ष, निर्भीक, सटीक</strong> — सत्ता से सवाल, जनता के सरोकार।
                    </p>
                  </div>
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    हमारा उद्देश्य (Our Mission)
                  </h3>
                  <p>
                    मध्य प्रदेश के 55 जिलों, 428 तहसीलों और 50,000 से अधिक गांवों की उन खबरों को मुख्यधारा तक पहुंचाना जो बड़े मीडिया घरानों की नजरों से छूट जाती हैं। किसान की मंडी की समस्या हो, कस्बे के अस्पताल की बदहाली, या युवा रोजगार का संघर्ष — हमारी पत्रकारिता जनता के अधिकारों के प्रति समर्पित है।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    तकनीकी नवाचार एवं आधुनिक न्यूज़रूम
                  </h3>
                  <p>
                    BREAKING NEWS WALA मध्य प्रदेश का प्रथम स्वतंत्र डिजिटल न्यूज़ प्लेटफ़ॉर्म है जो निम्नलिखित अत्याधुनिक तकनीकों से संचालित है:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="block text-slate-900 text-xs font-bold">हाइपरफास्ट वेब पोर्टल</strong>
                      <span className="text-xs text-slate-600">बजट 4G/5G फोन पर भी 1 सेकंड में लोड होने वाला नेक्स्ट-जेन वेब आर्किटेक्चर।</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="block text-slate-900 text-xs font-bold">दैनिक डिजिटल ई-पेपर</strong>
                      <span className="text-xs text-slate-600">सभी 55 जिलों के लिए ब्रॉडशीट लेआउट और ज़ूम-सक्षम डिजिटल संस्करण।</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="block text-slate-900 text-xs font-bold">संवाददाता फील्ड PWA</strong>
                      <span className="text-xs text-slate-600">ग्रामीण संवाददाताओं के लिए लाइव ग्राउंड रिपोर्टिंग और तथ्य-जांच इनपुट।</span>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    संपादकीय नेतृत्व एवं टीम
                  </h3>
                  <p>
                    संपादकीय टीम में मध्य प्रदेश के वरिष्ठ पत्रकार, कानूनी सलाहकार, और फील्ड रिपोर्टर्स का एक मजबूत नेटवर्क शामिल है। हमारा मुख्य संपादकीय कार्यालय प्रेस परिसर, भोपाल में स्थित है।
                  </p>
                </section>
              </article>
            )}

            {/* 7. CONTACT US & BUREAU NETWORK */}
            {activeSection === 'contact' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      संपर्क व ब्यूरो निर्देशिका
                    </span>
                    <span className="text-xs text-slate-500">24×7 न्यूज़रूम हेल्पलाइन</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    संपर्क करें एवं संभाग ब्यूरो नेटवर्क (Contact Us & Bureaus)
                  </h2>
                  <p className="text-xs text-slate-600">
                    भोपाल मुख्यालय एवं मध्य प्रदेश के सभी 10 संभाग कार्यालयों के अधिकृत पते व दूरभाष।
                  </p>
                </div>

                {/* HQ Box */}
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>मुख्य संपादकीय कार्यालय (Headquarters)</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-news-hero">
                    BREAKING NEWS WALA न्यूज़ नेटवर्क प्राइवेट लिमिटेड
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    प्रेस परिसर, एमपी नगर जोन-1, भोपाल (मध्य प्रदेश) पिन: 462011 • शाखा ब्यूरो: ओरछा तिराहा, निवाड़ी (मप्र)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">संपादकीय डेस्क:</span>
                      <strong className="text-amber-400">editor@breakingnewswala.com</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">विज्ञापन एवं मार्केटिंग:</span>
                      <strong className="text-blue-400">ads@breakingnewswala.com</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">न्यूज़रूम हेल्पलाइन:</span>
                      <strong className="text-white">+91 755 4920000</strong>
                    </div>
                  </div>
                </div>

                {/* 10 Division Bureaus */}
                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-600" />
                    मध्य प्रदेश के 10 संभाग ब्यूरो (Division Bureaus)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { div: 'भोपाल संभाग', city: 'भोपाल', addr: 'एमपी नगर जोन-1', phone: '+91 755 4920001' },
                      { div: 'इंदौर संभाग', city: 'इंदौर', addr: 'प्रेस क्लब मार्ग, एमजी रोड', phone: '+91 731 4920002' },
                      { div: 'ग्वालियर संभाग', city: 'ग्वालियर', addr: 'सिटी सेंटर, महाराज बाड़ा', phone: '+91 751 4920003' },
                      { div: 'जबलपुर संभाग', city: 'जबलपुर', addr: 'मालवीय चौक, गोलबाजार', phone: '+91 761 4920004' },
                      { div: 'उज्जैन संभाग', city: 'उज्जैन', addr: 'फ्रीगंज, देवास रोड', phone: '+91 734 4920005' },
                      { div: 'सागर संभाग', city: 'सागर', addr: 'सिविल लाइन्स, कटरा बाजार', phone: '+91 7582 492006' },
                      { div: 'रीवा संभाग', city: 'रीवा', addr: 'सिरमौर चौराहा, कॉलेज रोड', phone: '+91 7662 492007' },
                      { div: 'चंबल संभाग', city: 'मुरैना', addr: 'स्टेशन रोड, मुरैना', phone: '+91 7532 492008' },
                      { div: 'शहडोल संभाग', city: 'शहडोल', addr: 'गांधी चौक, बुढार रोड', phone: '+91 7652 492009' },
                      { div: 'नर्मदापुरम संभाग', city: 'होशंगाबाद', addr: 'इटारसी मार्ग, नर्मदापुरम', phone: '+91 7574 492010' },
                    ].map((b) => (
                      <div key={b.div} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-bold">{b.div}</strong>
                          <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">{b.city}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{b.addr}</p>
                        <p className="text-slate-500 text-[11px]">फोन: {b.phone}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Direct Contact / Tip Form */}
                <section className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Mail className="w-4 h-4 text-red-600" />
                    संपादकीय डेस्क को सीधा संदेश या समाचार टिप भेजें
                  </h3>

                  {contactSubmitted ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>धन्यवाद! आपका संदेश सफलतापूर्वक प्राप्त हो गया है।</span>
                      </div>
                      <p className="text-xs text-emerald-900">
                        हमारी संपादकीय टीम शीघ्र ही आपके दिए गए संपर्क सूत्र पर संपर्क करेगी।
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setContactSubmitted(false);
                          setContactForm({
                            name: '',
                            emailOrPhone: '',
                            city: '',
                            inquiryType: 'EDITORIAL',
                            subject: '',
                            message: '',
                          });
                        }}
                        className="mt-2 px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        अन्य संदेश भेजें
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">आपका नाम *</label>
                          <input
                            type="text"
                            required
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            placeholder="पूरा नाम दर्ज करें"
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर अथवा ईमेल *</label>
                          <input
                            type="text"
                            required
                            value={contactForm.emailOrPhone}
                            onChange={(e) => setContactForm({ ...contactForm, emailOrPhone: e.target.value })}
                            placeholder="फ़ोन या ईमेल"
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">विषय श्रेणी</label>
                          <select
                            value={contactForm.inquiryType}
                            onChange={(e) => setContactForm({ ...contactForm, inquiryType: e.target.value as any })}
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          >
                            <option value="EDITORIAL">संपादकीय समाचार टिप / प्रेस नोट</option>
                            <option value="ADVERTISING">विज्ञापन एवं ब्रांड पार्टनरशिप</option>
                            <option value="STRINGER">संवाददाता आवेदन (Stringer Application)</option>
                            <option value="TECHNICAL">तकनीकी समस्या / बग रिपोर्ट</option>
                            <option value="GENERAL">सामान्य पूछताछ</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">ज़िला / शहर</label>
                          <input
                            type="text"
                            value={contactForm.city}
                            onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                            placeholder="आपका ज़िला"
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">विषय (Subject)</label>
                        <input
                          type="text"
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          placeholder="संदेश का संक्षिप्त विषय"
                          className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">संदेश का पूर्ण विवरण *</label>
                        <textarea
                          required
                          rows={3}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="अपना संदेश यहाँ लिखें..."
                          className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:outline-hidden"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>संदेश भेजें</span>
                      </button>
                    </form>
                  )}
                </section>
              </article>
            )}

            {/* 8. DISCLAIMER & COPYRIGHT */}
            {activeSection === 'disclaimer' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
                      विधिक अस्वीकरण
                    </span>
                    <span className="text-xs text-slate-500">कानूनी सुरक्षा घोषणा</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    अस्वीकरण एवं कॉपीराइट नीति (Disclaimer & Copyright Policy)
                  </h2>
                  <p className="text-xs text-slate-600">
                    संपादकीय दायित्व सीमा, मंडी भाव, मौसम चेतावनियां एवं तृतीय-पक्ष सामग्री संबंधी शर्तें।
                  </p>
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    1. सामान्य समाचार अस्वीकरण
                  </h3>
                  <p>
                    BREAKING NEWS WALA पर प्रकाशित सभी समाचार एवं विश्लेषणात्मक लेख सद्भावनापूर्वक एवं जनहित में प्रकाशित किए जाते हैं। यद्यपि हमारी संपादकीय टीम 10-बिंदु तथ्य-जांच प्रणाली के तहत प्रत्येक जानकारी का सत्यापन करती है, तथापि समाचार में उद्धृत व्यक्तियों, संस्थाओं अथवा प्रत्यक्षदर्शियों के व्यक्तिगत विचारों के लिए प्रकाशक प्रत्यक्ष रूप से उत्तरदायी नहीं है।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    2. कृषि उपज मंडी भाव एवं मौसम चेतावनियां
                  </h3>
                  <p>
                    पोर्टल पर प्रदर्शित <strong>मंडी भाव (Mandi Rates)</strong> विभिन्न कृषि उपज मंडी समितियों एवं सार्वजनिक मंडियों से संकलित सांकेतिक जानकारी है। व्यापारिक क्रय-विक्रय निर्णय लेने से पूर्व संबंधित मंडी कार्यालय या अधिकृत व्यापारी से भाव की पुष्टि अवश्य करें। मौसम संबंधी पूर्वानुमान भारत मौसम विज्ञान विभाग (IMD) के डेटा पर आधारित हैं।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    3. तृतीय-पक्ष लिंक एवं विज्ञापन
                  </h3>
                  <p>
                    पोर्टल पर बाहरी वेबसाइट्स, सोशल मीडिया पोस्ट्स या विज्ञापनों के लिंक हो सकते हैं। उन बाहरी प्लेटफॉर्म्स की गोपनीयता नीति, सामग्री और कार्यप्रणाली पर हमारा कोई नियंत्रण नहीं है और उनके प्रति हमारी कोई विधिक देयता नहीं होगी।
                  </p>
                </section>
              </article>
            )}

            {/* 9. ADVERTISING POLICY */}
            {activeSection === 'advertising' && (
              <article className="space-y-6 text-slate-800 text-sm leading-relaxed">
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      विज्ञापन एवं प्रायोजन दिशानिर्देश
                    </span>
                    <span className="text-xs text-slate-500">ASCI मानक अनुपालन</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-news-editorial text-slate-950">
                    विज्ञापन एवं प्रायोजन नीति (Advertising Policy)
                  </h2>
                  <p className="text-xs text-slate-600">
                    संपादकीय स्वतंत्रता का संरक्षण और विज्ञापनों का स्पष्ट सीमांकन।
                  </p>
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    1. समाचार और विज्ञापन का स्पष्ट पृथक्करण
                  </h3>
                  <p>
                    हम पत्रकारिता की स्वतंत्रता और निष्पक्षता पर कोई समझौता नहीं करते। पोर्टल पर प्रकाशित किसी भी प्रायोजित सामग्री, नेटिव विज्ञापन या ब्रांड साझेदारी को स्पष्ट रूप से <strong>[विज्ञापन / AD]</strong> या <strong>[प्रायोजित / Sponsored]</strong> लेबल के साथ चिह्नित किया जाता है ताकि पाठक को किसी प्रकार का भ्रम न हो।
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    2. प्रतिबंधित विज्ञापन श्रेणियां (Banned Categories)
                  </h3>
                  <p>
                    भारतीय विज्ञापन मानक परिषद (ASCI) एवं विधि के अनुसार निम्नलिखित श्रेणियों के विज्ञापन स्वीकार नहीं किए जाते:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li>अवैध सट्टेबाजी, गैंबलिंग, और बिना वैधानिक अनुमति वाले मनी-गेम्स।</li>
                    <li>जादुई उपचार, भ्रामक दवाएं या अंधविश्वास को बढ़ावा देने वाले दावे।</li>
                    <li>नकली निवेश योजनाएं, पोंजी स्कीम्स या असत्यापित क्रिप्टो वादे।</li>
                    <li>तंबाकू, नशीले पदार्थ, या हथियारों से संबंधित सामग्री।</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    3. विज्ञापन बुकिंग व संपर्क
                  </h3>
                  <p>
                    वेबसाइट, मोबाइल वेब, डिजिटल ई-पेपर एवं वीडियो बुलेटिन में स्थानीय और राष्ट्रीय ब्रांड विज्ञापनों हेतु दर-तालिका (Rate Card) के लिए संपर्क करें:
                  </p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p className="font-bold text-slate-900">विज्ञापन एवं ब्रांड समाधान डेस्क:</p>
                    <p className="text-slate-700">ईमेल: ads@breakingnewswala.com | फोन: +91 755 4920000</p>
                    <p className="text-slate-500">कार्यालय: प्रेस परिसर, एमपी नगर जोन-1, भोपाल (मप्र)</p>
                  </div>
                </section>
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
