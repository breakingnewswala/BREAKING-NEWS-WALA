import React, { useState, useEffect } from 'react';
import {
  EpaperAdSubmissionDoc,
  EpaperAdSlotType,
  EpaperAdCategory,
  EpaperEditionDoc,
  EpaperAdStatus,
  EpaperAiAdCreative,
  EpaperAdReportSummary,
} from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Megaphone,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  AlertTriangle,
  Eye,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  ShieldCheck,
  Layers,
  Users,
  BarChart3,
  Calendar,
  Search,
  Trash2,
  Lock,
  Tag,
  ArrowRight,
  Send,
} from 'lucide-react';

export interface EpaperAdManagerProps {
  editions?: EpaperEditionDoc[];
  onPlaceAdOnPage?: (ad: EpaperAdSubmissionDoc, editionId: string, pageNumber: number) => void;
  currentUser?: {
    id?: string;
    uid?: string;
    email?: string;
    role?: string;
    roles?: string[];
  };
}

export const BROADSHEET_SLOTS_CATALOG: Array<{
  slotType: EpaperAdSlotType;
  nameHi: string;
  nameEn: string;
  dimensionsMm: string;
  dimensionsPt: { width: number; height: number };
  aspectRatio: string;
  colSpan: string;
  targetPage: string;
  baseRateInr: number;
}> = [
  {
    slotType: 'FULL_PAGE',
    nameHi: 'पूर्ण पृष्ठ विज्ञापन (Full Page)',
    nameEn: 'Full Page',
    dimensionsMm: '329 x 520 mm',
    dimensionsPt: { width: 932.6, height: 1474.0 },
    aspectRatio: '2:3 (Broadsheet)',
    colSpan: '8 Columns',
    targetPage: 'अंतिम पृष्ठ / बैक पेज',
    baseRateInr: 15000,
  },
  {
    slotType: 'HALF_PAGE_HORIZONTAL',
    nameHi: 'क्षैतिज अर्ध-पृष्ठ (Half Page Horizontal)',
    nameEn: 'Half Page Horizontal',
    dimensionsMm: '329 x 260 mm',
    dimensionsPt: { width: 932.6, height: 737.0 },
    aspectRatio: '16:9 / ~4:3',
    colSpan: '8 Columns',
    targetPage: 'पेज 2, 3 अथवा बैक पेज',
    baseRateInr: 8500,
  },
  {
    slotType: 'HALF_PAGE_VERTICAL',
    nameHi: 'ऊर्ध्वाधर अर्ध-पृष्ठ (Half Page Vertical)',
    nameEn: 'Half Page Vertical',
    dimensionsMm: '160 x 520 mm',
    dimensionsPt: { width: 453.5, height: 1474.0 },
    aspectRatio: '~1:3',
    colSpan: '4 Columns',
    targetPage: 'आंतरिक पृष्ठ (पेज 6, 7)',
    baseRateInr: 8500,
  },
  {
    slotType: 'QUARTER_PAGE',
    nameHi: 'चतुर्थांश पृष्ठ (Quarter Page)',
    nameEn: 'Quarter Page',
    dimensionsMm: '160 x 260 mm',
    dimensionsPt: { width: 453.5, height: 737.0 },
    aspectRatio: '4:3 / 3:4',
    colSpan: '4 Columns',
    targetPage: 'पेज 2, 5, 8 (व्यापार)',
    baseRateInr: 4500,
  },
  {
    slotType: 'ONE_EIGHTH_PAGE',
    nameHi: 'अष्टमांश पृष्ठ (One Eighth Page)',
    nameEn: 'One Eighth Page',
    dimensionsMm: '80 x 260 mm',
    dimensionsPt: { width: 226.8, height: 737.0 },
    aspectRatio: '~1:3.2',
    colSpan: '2 Columns',
    targetPage: 'आंतरिक पृष्ठ',
    baseRateInr: 2500,
  },
  {
    slotType: 'HORIZONTAL_BANNER',
    nameHi: 'क्षैतिज बैनर (Horizontal Banner)',
    nameEn: 'Horizontal Banner',
    dimensionsMm: '329 x 100 mm',
    dimensionsPt: { width: 932.6, height: 283.5 },
    aspectRatio: '~3.3:1',
    colSpan: '8 Columns',
    targetPage: 'पेज 2-11 मध्य',
    baseRateInr: 4000,
  },
  {
    slotType: 'VERTICAL_STRIP',
    nameHi: 'ऊर्ध्वाधर स्ट्रिप (Vertical Strip)',
    nameEn: 'Vertical Strip',
    dimensionsMm: '50 x 520 mm',
    dimensionsPt: { width: 141.7, height: 1474.0 },
    aspectRatio: '~1:10',
    colSpan: '1-2 Columns',
    targetPage: 'आंतरिक पृष्ठ किनारे',
    baseRateInr: 3500,
  },
  {
    slotType: 'L_SHAPE',
    nameHi: 'एल-आकार विज्ञापन (L-Shape Wrap)',
    nameEn: 'L-Shape Wrap',
    dimensionsMm: 'Compound L-Wrap',
    dimensionsPt: { width: 932.6, height: 500.0 },
    aspectRatio: 'custom',
    colSpan: '8 Bottom + 2 Side',
    targetPage: 'प्रथम पृष्ठ अथवा पेज 3',
    baseRateInr: 12000,
  },
  {
    slotType: 'BOTTOM_STRIP',
    nameHi: 'तल स्ट्रिप / बॉटम बैनर (Bottom Strip)',
    nameEn: 'Bottom Strip',
    dimensionsMm: '329 x 50 mm',
    dimensionsPt: { width: 932.6, height: 141.7 },
    aspectRatio: '~7:1',
    colSpan: '8 Columns',
    targetPage: 'प्रथम पृष्ठ व बैक पेज',
    baseRateInr: 2500,
  },
  {
    slotType: 'FOOTER',
    nameHi: 'पाद पट्टी (Footer Strip)',
    nameEn: 'Footer Strip',
    dimensionsMm: '329 x 35 mm',
    dimensionsPt: { width: 932.6, height: 99.2 },
    aspectRatio: '~9:1',
    colSpan: '8 Columns',
    targetPage: 'समस्त पृष्ठ तल',
    baseRateInr: 2000,
  },
  {
    slotType: 'VERTICAL_EAR',
    nameHi: 'मास्टहेड ईयर पैनल (Ear Panel)',
    nameEn: 'Ear Panel',
    dimensionsMm: '45 x 35 mm',
    dimensionsPt: { width: 127.6, height: 99.2 },
    aspectRatio: '4:3',
    colSpan: '1 Column',
    targetPage: 'प्रथम पृष्ठ मास्टहेड के बाएँ/दाएँ',
    baseRateInr: 1500,
  },
  {
    slotType: 'SPONSORED_FEATURE',
    nameHi: 'प्रायोजित फीचर सामग्री (Advertorial)',
    nameEn: 'Sponsored Advertorial',
    dimensionsMm: '160 x 260 mm',
    dimensionsPt: { width: 453.5, height: 737.0 },
    aspectRatio: '4:3',
    colSpan: '4 Columns',
    targetPage: 'फीचर / विशेष पृष्ठ',
    baseRateInr: 6000,
  },
  {
    slotType: 'CLASSIFIED',
    nameHi: 'वर्गीकृत विज्ञापन (Classified Box & Text)',
    nameEn: 'Classified',
    dimensionsMm: '40 x 30 mm',
    dimensionsPt: { width: 113.4, height: 85.0 },
    aspectRatio: '1:1',
    colSpan: '1-2 Columns',
    targetPage: 'पेज 11 (वर्गीकृत पृष्ठ)',
    baseRateInr: 250,
  },
];

export const EpaperAdManager: React.FC<EpaperAdManagerProps> = ({
  editions = [],
  onPlaceAdOnPage,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'ai_studio' | 'slot_manager' | 'reporters' | 'rate_card' | 'reports'>('inventory');
  const [submissions, setSubmissions] = useState<EpaperAdSubmissionDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Ad for Inspection / Actions
  const [selectedAd, setSelectedAd] = useState<EpaperAdSubmissionDoc | null>(null);
  const [statusTransitionNotes, setStatusTransitionNotes] = useState<string>('');

  // AI Ad Studio Generator State
  const [studioBusinessName, setStudioBusinessName] = useState<string>('');
  const [studioCategory, setStudioCategory] = useState<EpaperAdCategory>('COMMERCIAL');
  const [studioSlot, setStudioSlot] = useState<EpaperAdSlotType>('BOTTOM_STRIP');
  const [studioOfferDetails, setStudioOfferDetails] = useState<string>('');
  const [studioTargetAudience, setStudioTargetAudience] = useState<string>('');
  const [studioContactPhone, setStudioContactPhone] = useState<string>('');
  const [studioTone, setStudioTone] = useState<string>('आकर्षक व विश्वसनीय');
  const [generatingStudioCreative, setGeneratingStudioCreative] = useState<boolean>(false);
  const [generatedCreatives, setGeneratedCreatives] = useState<EpaperAiAdCreative | null>(null);
  const [selectedHeadlineIdx, setSelectedHeadlineIdx] = useState<number>(0);
  const [selectedCopyIdx, setSelectedCopyIdx] = useState<number>(0);
  const [selectedCtaIdx, setSelectedCtaIdx] = useState<number>(0);

  // Ad Creator & Draft State
  const [advName, setAdvName] = useState<string>('');
  const [advPhone, setAdvPhone] = useState<string>('');
  const [advEmail, setAdvEmail] = useState<string>('');
  const [advAddress, setAdvAddress] = useState<string>('');
  const [advCategory, setAdvCategory] = useState<EpaperAdCategory>('COMMERCIAL');
  const [advSlot, setAdvSlot] = useState<EpaperAdSlotType>('BOTTOM_STRIP');
  const [advHeadline, setAdvHeadline] = useState<string>('');
  const [advText, setAdvText] = useState<string>('');
  const [advCta, setAdvCta] = useState<string>('');
  const [advImageUrl, setAdvImageUrl] = useState<string>('');
  const [advTargetDistrict, setAdvTargetDistrict] = useState<string>('भोपाल');
  const [advIsSponsored, setAdvIsSponsored] = useState<boolean>(false);
  const [advSponsoredDisclaimer, setAdvSponsoredDisclaimer] = useState<string>('यह एक प्रायोजित विज्ञापन है। इसके दावों के प्रति प्रकाशक जिम्मेदार नहीं है।');
  const [advAssignedReporterId, setAdvAssignedReporterId] = useState<string>('');
  const [advAssignedReporterName, setAdvAssignedReporterName] = useState<string>('');
  const [submittingAd, setSubmittingAd] = useState<boolean>(false);

  // Slot Manager State
  const [slotSelectedEditionId, setSlotSelectedEditionId] = useState<string>(editions[0]?.id || '');
  const [slotSelectedPage, setSlotSelectedPage] = useState<number>(1);
  const [availableSlotsData, setAvailableSlotsData] = useState<{
    availableSlots: any[];
    occupiedSlots: any[];
  } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotAssignAdId, setSlotAssignAdId] = useState<string>('');
  const [slotAssignType, setSlotAssignType] = useState<EpaperAdSlotType>('BOTTOM_STRIP');

  // Rate Card Calculator State
  const [calcSlot, setCalcSlot] = useState<EpaperAdSlotType>('BOTTOM_STRIP');
  const [calcTier, setCalcTier] = useState<'district' | 'division' | 'statewide'>('district');
  const [calcPage, setCalcPage] = useState<number>(1);
  const [calcWords, setCalcWords] = useState<number>(30);

  // Reports Summary State
  const [reportsData, setReportsData] = useState<EpaperAdReportSummary | null>(null);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    if (editions.length > 0 && !slotSelectedEditionId) {
      setSlotSelectedEditionId(editions[0].id);
    }
  }, [editions]);

  useEffect(() => {
    if (activeTab === 'slot_manager' && slotSelectedEditionId) {
      loadPageSlots();
    }
  }, [activeTab, slotSelectedEditionId, slotSelectedPage]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await apiClient.epaper.getAds({
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchQuery.trim() || undefined,
      });
      setSubmissions(data);
    } catch (err: any) {
      console.error('Failed to load ad submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPageSlots = async () => {
    if (!slotSelectedEditionId) return;
    setLoadingSlots(true);
    try {
      const res = await apiClient.epaper.getAvailableAdSlots(slotSelectedEditionId, slotSelectedPage);
      setAvailableSlotsData(res);
    } catch (err: any) {
      console.error('Failed to load page slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const rep = await apiClient.epaper.getAdReports();
      setReportsData(rep);
    } catch (err: any) {
      console.error('Failed to load ad reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleStatusTransition = async (adId: string, targetStatus: EpaperAdStatus) => {
    try {
      await apiClient.epaper.updateAdStatus(adId, {
        status: targetStatus,
        notes: statusTransitionNotes.trim() || `Status moved to ${targetStatus}`,
      });
      showToast(`विज्ञापन स्थिति बदलकर '${targetStatus}' कर दी गई!`);
      setStatusTransitionNotes('');
      await loadSubmissions();
      if (selectedAd?.id === adId) {
        const refreshed = await apiClient.epaper.getAdById(adId);
        setSelectedAd(refreshed);
      }
    } catch (err: any) {
      alert(err.message || 'स्थिति परिवर्तन विफल रहा');
    }
  };

  const handleGenerateAiStudioCreative = async () => {
    if (!studioBusinessName.trim()) {
      alert('कृपया पहले प्रतिष्ठान अथवा ब्रांड का नाम दर्ज करें');
      return;
    }
    setGeneratingStudioCreative(true);
    try {
      const creative = await apiClient.epaper.generateAiAdStudio({
        businessName: studioBusinessName,
        category: studioCategory,
        offerDetails: studioOfferDetails,
        targetAudience: studioTargetAudience,
        contactInfo: studioContactPhone,
        tone: studioTone,
        language: 'hi',
      });
      setGeneratedCreatives(creative);
      setSelectedHeadlineIdx(0);
      setSelectedCopyIdx(0);
      setSelectedCtaIdx(0);
      showToast('AI Ad Studio: 3 शीर्षक, 3 कॉपी विकल्प व CTA सफलतापूर्वक निर्मित!');
    } catch (err: any) {
      alert(err.message || 'AI Ad Studio क्रिएटिव निर्माण विफल रहा');
    } finally {
      setGeneratingStudioCreative(false);
    }
  };

  const handleApplyAiStudioToDraft = () => {
    if (!generatedCreatives) return;
    const headlines = generatedCreatives.suggestedHeadlines || generatedCreatives.headlineVariants || [];
    const copies = generatedCreatives.suggestedCopy || generatedCreatives.copyVariants || [];
    const ctas = generatedCreatives.suggestedCtas || generatedCreatives.ctaVariants || [];
    const chosenHeadline = headlines[selectedHeadlineIdx] || '';
    const chosenCopy = copies[selectedCopyIdx] || '';
    const chosenCta = ctas[selectedCtaIdx] || '';

    setAdvName(studioBusinessName);
    setAdvCategory(studioCategory);
    setAdvSlot(studioSlot);
    setAdvHeadline(chosenHeadline);
    setAdvText(chosenCopy);
    setAdvCta(chosenCta);
    setAdvPhone(studioContactPhone);

    setActiveTab('inventory');
    showToast('AI क्रिएटिव ड्राफ्ट फॉर्म में लागू कर दिया गया!');
  };

  const handleSubmitNewAd = async (targetStatus: EpaperAdStatus = 'SUBMITTED') => {
    if (!advName.trim()) {
      alert('विज्ञापनदाता का नाम अनिवार्य है');
      return;
    }
    if (!advPhone.trim() && !advEmail.trim()) {
      alert('विज्ञापनदाता का संपर्क फ़ोन अथवा ईमेल अनिवार्य है');
      return;
    }
    setSubmittingAd(true);
    try {
      const slotDef = BROADSHEET_SLOTS_CATALOG.find((s) => s.slotType === advSlot);
      const newAd = await apiClient.epaper.submitAd({
        advertiserName: advName,
        businessName: advName,
        contactPhone: advPhone,
        contactEmail: advEmail,
        contactAddress: advAddress,
        category: advCategory,
        slotType: advSlot,
        headline: advHeadline,
        text: advText,
        ctaText: advCta,
        imageUrl: advImageUrl || undefined,
        targetDistrict: advTargetDistrict,
        targetDistrictName: advTargetDistrict,
        amount: slotDef?.baseRateInr || 2500,
        status: targetStatus,
        isSponsored: advIsSponsored || advCategory === 'SPONSORED_FEATURE',
        sponsoredDisclaimer: advSponsoredDisclaimer,
        assignedReporterId: advAssignedReporterId || undefined,
        assignedReporterName: advAssignedReporterName || undefined,
      });

      showToast(`विज्ञापन सफलतापूर्वक सहेजा गया! (स्थिति: ${newAd.status})`);
      setAdvName('');
      setAdvPhone('');
      setAdvEmail('');
      setAdvAddress('');
      setAdvHeadline('');
      setAdvText('');
      setAdvCta('');
      setAdvImageUrl('');
      setAdvAssignedReporterId('');
      setAdvAssignedReporterName('');
      await loadSubmissions();
    } catch (err: any) {
      alert(err.message || 'विज्ञापन दर्ज करना विफल रहा');
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleAssignSlot = async () => {
    if (!slotAssignAdId) {
      alert('कृपया स्लॉट आवंटित करने हेतु एक स्वीकृत विज्ञापन चुनें');
      return;
    }
    if (!slotSelectedEditionId) {
      alert('संस्करण चुनें');
      return;
    }
    try {
      await apiClient.epaper.assignAdToSlot(slotAssignAdId, {
        editionId: slotSelectedEditionId,
        pageNumber: slotSelectedPage,
        slotDetails: {
          slotType: slotAssignType,
          customBadgeText: 'विज्ञापन',
        },
      });
      showToast('विज्ञापन पृष्ठ स्लॉट पर सफलतापूर्वक आवंटित किया गया!');
      await loadPageSlots();
      await loadSubmissions();
      setSlotAssignAdId('');
    } catch (err: any) {
      alert(err.message || 'स्लॉट आवंटन विफल रहा');
    }
  };

  const handleRemoveSlot = async (adId: string) => {
    if (!confirm('क्या आप इस विज्ञापन को पृष्ठ स्लॉट से हटाना चाहते हैं?')) return;
    try {
      await apiClient.epaper.removeAdFromSlot(adId, {
        editionId: slotSelectedEditionId,
        pageNumber: slotSelectedPage,
      });
      showToast('विज्ञापन स्लॉट से हटा दिया गया');
      await loadPageSlots();
      await loadSubmissions();
    } catch (err: any) {
      alert(err.message || 'स्लॉट निष्कासन विफल रहा');
    }
  };

  // Tariff calculator helper
  const calculateEstimate = () => {
    const slotObj = BROADSHEET_SLOTS_CATALOG.find((s) => s.slotType === calcSlot) || BROADSHEET_SLOTS_CATALOG[0];
    let base = slotObj.baseRateInr;
    if (calcTier === 'division') base *= 2.5;
    if (calcTier === 'statewide') base *= 8.0;

    let pageMultiplier = 1.0;
    if (calcPage === 1) pageMultiplier = 2.0;
    else if (calcPage === 2 || calcPage === 3) pageMultiplier = 1.25;
    else if (calcPage === 12) pageMultiplier = 1.5;

    let total = base * pageMultiplier;
    if (calcSlot === 'CLASSIFIED' && calcWords > 30) {
      total += (calcWords - 30) * 5;
    }
    return Math.round(total);
  };

  const approvedAdsForSlotPlacement = submissions.filter(
    (s) => (s.status === 'APPROVED' || s.status === 'SCHEDULED') && !s.assignedEditionId
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl shadow-sm">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                विज्ञापन प्रबंधक एवं एआई एड स्टूडियो (E-Paper Ad Manager & Studio)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ब्रॉडशीट 13 स्लॉट विनिर्देश, 7-चरणीय स्टेट मशीन, एआई देवनागरी कॉपीराइटिंग, रिपोर्टर आवंटन एवं अनिवार्य 'विज्ञापन' प्रमाणीकरण
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>ASCI अनिवार्य 'विज्ञापन' प्रमाणीकरण सक्रिय</span>
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-1.5 shadow-2xs">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>प्रकाशित संस्करण अपरिवर्तनीयता (Immutable)</span>
          </span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Workspace Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>विज्ञापन इन्वेंटरी व कतार (Ad Inventory)</span>
          {submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-mono font-bold">
              {submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai_studio')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ai_studio'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>एआई एड स्टूडियो (AI Ad Studio)</span>
        </button>

        <button
          onClick={() => setActiveTab('slot_manager')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'slot_manager'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>पृष्ठ स्लॉट आवंटन (Slot Allocator)</span>
        </button>

        <button
          onClick={() => setActiveTab('reporters')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reporters'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>संवाददाता अभियान (Reporter Hub)</span>
        </button>

        <button
          onClick={() => setActiveTab('rate_card')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rate_card'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>दर सूची व कैलकुलेटर (Rate Card)</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>प्रशासनिक रिपोर्टिंग (Ad Analytics)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AD INVENTORY & LIFECYCLE MANAGEMENT                                */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Filtering & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadSubmissions()}
                  placeholder="खोजें: विज्ञापनदाता, फोन, आईडी..."
                  className="text-xs pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl w-60 focus:outline-blue-600"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">स्थिति:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="all">सभी स्थितियां</option>
                  <option value="DRAFT">DRAFT (प्रारूप)</option>
                  <option value="SUBMITTED">SUBMITTED (जमा)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (समीक्षाधीन)</option>
                  <option value="APPROVED">APPROVED (स्वीकृत)</option>
                  <option value="SCHEDULED">SCHEDULED (निर्धारित)</option>
                  <option value="PUBLISHED">PUBLISHED (प्रकाशित)</option>
                  <option value="COMPLETED">COMPLETED (पूर्ण)</option>
                  <option value="REJECTED">REJECTED (अस्वीकृत)</option>
                  <option value="CANCELLED">CANCELLED (रद्द)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">श्रेणी:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="all">सभी श्रेणियां</option>
                  <option value="COMMERCIAL">व्यावसायिक (Commercial)</option>
                  <option value="CLASSIFIED">वर्गीकृत (Classified)</option>
                  <option value="OBITUARY">शोक संदेश (Obituary)</option>
                  <option value="TENDER">निविदा सूचना (Tender)</option>
                  <option value="PROPERTY">प्रॉपर्टी (Real Estate)</option>
                  <option value="MATRIMONIAL">वैवाहिक (Matrimonial)</option>
                  <option value="EDUCATION">शिक्षा (Education)</option>
                  <option value="POLITICAL">राजनीतिक (Political)</option>
                  <option value="GOVERNMENT">सरकारी (Government)</option>
                  <option value="SPONSORED_FEATURE">प्रायोजित फीचर (Advertorial)</option>
                </select>
              </div>
            </div>

            <button
              onClick={loadSubmissions}
              className="px-3 py-1.5 text-slate-700 hover:text-blue-700 rounded-xl hover:bg-slate-100 cursor-pointer text-xs flex items-center gap-1.5 font-bold border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>रिफ्रेश</span>
            </button>
          </div>

          {/* Quick Ad Entry / Ingestion Form (Collapsible / Toggleable) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>त्वरित विज्ञापन प्रविष्टि दर्ज करें (Quick Ingestion)</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                सीधे ड्राफ्ट अथवा सबमिट स्थिति में दर्ज करें
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  प्रतिष्ठान / विज्ञापनदाता का नाम *
                </label>
                <input
                  type="text"
                  value={advName}
                  onChange={(e) => setAdvName(e.target.value)}
                  placeholder="उदा. भोपाल वस्त्रालय"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  संपर्क फ़ोन नंबर *
                </label>
                <input
                  type="text"
                  value={advPhone}
                  onChange={(e) => setAdvPhone(e.target.value)}
                  placeholder="उदा. 9826012345"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">स्लॉट प्रकार</label>
                <select
                  value={advSlot}
                  onChange={(e) => setAdvSlot(e.target.value as EpaperAdSlotType)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {BROADSHEET_SLOTS_CATALOG.map((s) => (
                    <option key={s.slotType} value={s.slotType}>
                      {s.nameHi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">श्रेणी</label>
                <select
                  value={advCategory}
                  onChange={(e) => setAdvCategory(e.target.value as EpaperAdCategory)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="COMMERCIAL">व्यावसायिक (Commercial)</option>
                  <option value="CLASSIFIED">वर्गीकृत (Classified)</option>
                  <option value="OBITUARY">शोक संदेश (Obituary)</option>
                  <option value="TENDER">निविदा सूचना (Tender)</option>
                  <option value="PROPERTY">प्रॉपर्टी (Real Estate)</option>
                  <option value="MATRIMONIAL">वैवाहिक (Matrimonial)</option>
                  <option value="EDUCATION">शिक्षा (Education)</option>
                  <option value="POLITICAL">राजनीतिक (Political)</option>
                  <option value="GOVERNMENT">सरकारी (Government)</option>
                  <option value="SPONSORED_FEATURE">प्रायोजित फीचर (Advertorial)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  विज्ञापन शीर्षक (Headline)
                </label>
                <input
                  type="text"
                  value={advHeadline}
                  onChange={(e) => setAdvHeadline(e.target.value)}
                  placeholder="आकर्षक मुख्य शीर्षक"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  विज्ञापन पाठ्य सामग्री (Copy Body)
                </label>
                <input
                  type="text"
                  value={advText}
                  onChange={(e) => setAdvText(e.target.value)}
                  placeholder="विज्ञापन का मुख्य विवरण व पेशकश..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 items-center">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  क्रिएटिव इमेज URL (वैकल्पिक)
                </label>
                <input
                  type="text"
                  value={advImageUrl}
                  onChange={(e) => setAdvImageUrl(e.target.value)}
                  placeholder="https://.../ad.jpg"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  संबद्ध संवाददाता (ID / Name)
                </label>
                <input
                  type="text"
                  value={advAssignedReporterName}
                  onChange={(e) => {
                    setAdvAssignedReporterName(e.target.value);
                    setAdvAssignedReporterId(e.target.value);
                  }}
                  placeholder="संवाददाता का नाम"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="advIsSponsoredCheckbox"
                  checked={advIsSponsored || advCategory === 'SPONSORED_FEATURE'}
                  onChange={(e) => setAdvIsSponsored(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="advIsSponsoredCheckbox" className="text-xs font-semibold text-slate-700">
                  प्रायोजित सामग्री ('प्रायोजित' टैग)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => handleSubmitNewAd('DRAFT')}
                  disabled={submittingAd}
                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ड्राफ्ट सहेजें
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitNewAd('SUBMITTED')}
                  disabled={submittingAd}
                  className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  सबमिट करें
                </button>
              </div>
            </div>
          </div>

          {/* Ad Submissions List / Grid */}
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-xs font-semibold">
              विज्ञापन डेटा लोड हो रहा है...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">कोई विज्ञापन प्रविष्टि नहीं मिली</p>
              <p className="text-xs text-slate-400 mt-1">
                फ़िल्टर बदलें अथवा ऊपर दिए गए फ़ॉर्म से नया विज्ञापन दर्ज करें।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {submissions.map((ad) => {
                const isApproved = ad.status === 'APPROVED';
                const isPublished = ad.status === 'PUBLISHED';
                const isUnderReview = ad.status === 'UNDER_REVIEW' || ad.status === 'SUBMITTED';

                return (
                  <div
                    key={ad.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between p-5 space-y-4 ${
                      selectedAd?.id === ad.id ? 'ring-2 ring-blue-600 border-blue-400' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top Meta Line: Number + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-black text-blue-700">
                            {ad.submissionNumber || ad.id.slice(0, 8)}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            श्रेणी: <strong className="text-slate-600">{ad.category}</strong>
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ad.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : ad.status === 'PUBLISHED'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : ad.status === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : ad.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : ad.status === 'CANCELLED'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {ad.status}
                          </span>
                          {ad.assignedEditionId && (
                            <span className="text-[10px] text-blue-700 font-semibold">
                              पृष्ठ {ad.assignedPageNumber || '1'} पर आवंटित
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Advertiser Info */}
                      <div className="mt-2.5">
                        <h4 className="text-base font-bold text-slate-900 leading-tight">
                          {ad.businessName || ad.advertiserName}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {ad.contactPhone || 'फ़ोन अनुपलब्ध'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {ad.targetDistrictName || ad.targetDistrict || 'मध्य प्रदेश'}
                          </span>
                        </div>
                      </div>

                      {/* Visual Broadsheet Card Preview with Mandatory ASCI Badge */}
                      <div className="mt-3.5 bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 relative overflow-hidden">
                        {/* Mandatory Stamp */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 bg-[#ED1727] text-white text-[9px] font-black rounded-xs tracking-wider uppercase">
                            {ad.isSponsored || ad.category === 'SPONSORED_FEATURE' ? 'प्रायोजित सामग्री' : 'विज्ञापन'}
                          </span>
                          <span className="text-[10px] font-mono text-amber-800 font-bold">
                            {ad.slotType}
                          </span>
                        </div>

                        {ad.headline && (
                          <h5 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                            {ad.headline}
                          </h5>
                        )}

                        <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                          {ad.text || 'विज्ञापन सामग्री'}
                        </p>

                        {ad.ctaText && (
                          <div className="mt-2 text-[10px] font-bold text-blue-800 bg-blue-50/60 p-1 rounded border border-blue-100 inline-block">
                            CTA: {ad.ctaText}
                          </div>
                        )}

                        {ad.imageUrl && (
                          <div className="mt-2 text-[10px] text-blue-700 underline truncate">
                            छवि: {ad.imageUrl}
                          </div>
                        )}
                      </div>

                      {/* Reporter Information */}
                      <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span>
                          संवाददाता:{' '}
                          <strong className="text-slate-700">
                            {ad.assignedReporterName || ad.reporterName || ad.reporterId || 'कार्यालय'}
                          </strong>
                        </span>
                        <span className="font-bold text-slate-800">₹{ad.amount || 2500}</span>
                      </div>
                    </div>

                    {/* Operational Actions & State Machine Controls */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isUnderReview && (
                          <>
                            <button
                              onClick={() => handleStatusTransition(ad.id, 'APPROVED')}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              स्वीकार करें (Approve)
                            </button>
                            <button
                              onClick={() => handleStatusTransition(ad.id, 'REJECTED')}
                              className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-rose-200"
                            >
                              अस्वीकार
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => {
                              setSelectedAd(ad);
                              setActiveTab('slot_manager');
                              setSlotAssignAdId(ad.id);
                              setSlotAssignType(ad.slotType);
                            }}
                            className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>स्लॉट आवंटित करें</span>
                          </button>
                        )}

                        {ad.status === 'SCHEDULED' && !isPublished && (
                          <button
                            onClick={() => handleStatusTransition(ad.id, 'PUBLISHED')}
                            className="flex-1 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            प्रकाशित मार्क करें (Published)
                          </button>
                        )}

                        {isPublished && (
                          <button
                            onClick={() => handleStatusTransition(ad.id, 'COMPLETED')}
                            className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            पूर्ण करें (Complete)
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAd(selectedAd?.id === ad.id ? null : ad)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="ऑडिट व इतिहास देखें"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Expanded Details / Audit Trail Modal / Card */}
                      {selectedAd?.id === ad.id && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2 animate-fadeIn">
                          <div className="flex items-center justify-between font-bold text-slate-700">
                            <span>ऑडिट इतिहास एवं ट्रैकिंग</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              बनाया गया: {new Date(ad.createdAt).toLocaleDateString('hi-IN')}
                            </span>
                          </div>

                          {(selectedAd.statusHistory || selectedAd.history || []).length > 0 ? (
                            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                              {(selectedAd.statusHistory || selectedAd.history || []).map((h: any, i: number) => (
                                <div key={i} className="text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                                  <span className="font-bold text-blue-700">{h.toStatus}</span>{' '}
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    ({new Date(h.changedAt).toLocaleTimeString('hi-IN')})
                                  </span>
                                  {h.notes && <div className="text-slate-500 italic mt-0.5">{h.notes}</div>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400">कोई पूर्व इतिहास नहीं</p>
                          )}

                          <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={statusTransitionNotes}
                              onChange={(e) => setStatusTransitionNotes(e.target.value)}
                              placeholder="स्टेटस परिवर्तन हेतु टिप्पणी..."
                              className="text-[11px] px-2 py-1 border border-slate-300 rounded-lg flex-1 bg-white"
                            />
                            <button
                              onClick={() => handleStatusTransition(ad.id, 'CANCELLED')}
                              className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold hover:bg-rose-100 cursor-pointer"
                            >
                              रद्द करें
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI AD STUDIO (CREATIVE ASSISTANT & GROUNDED GENERATION)             */}
      {/* ========================================================================= */}
      {activeTab === 'ai_studio' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Studio Inputs Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  एआई एड स्टूडियो (AI Broadsheet Ad Studio)
                </h3>
                <p className="text-xs text-slate-500">
                  सटीक विवरणों पर आधारित 3 शीर्षक, 3 कॉपी विकल्प एवं 3 सीटीए (कभी भी मनगढ़ंत मूल्य या फ़ोन नंबर नहीं)
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  प्रतिष्ठान अथवा ब्रांड का नाम *
                </label>
                <input
                  type="text"
                  value={studioBusinessName}
                  onChange={(e) => setStudioBusinessName(e.target.value)}
                  placeholder="उदा. श्री गणेश ज्वेलर्स / नर्मदा मोटर्स"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">श्रेणी</label>
                  <select
                    value={studioCategory}
                    onChange={(e) => setStudioCategory(e.target.value as EpaperAdCategory)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="COMMERCIAL">व्यावसायिक (Commercial)</option>
                    <option value="CLASSIFIED">वर्गीकृत (Classified)</option>
                    <option value="PROPERTY">प्रॉपर्टी (Real Estate)</option>
                    <option value="EDUCATION">शिक्षा (Education)</option>
                    <option value="MATRIMONIAL">वैवाहिक (Matrimonial)</option>
                    <option value="TENDER">निविदा सूचना (Tender)</option>
                    <option value="OBITUARY">शोक संदेश (Obituary)</option>
                    <option value="SPONSORED_FEATURE">प्रायोजित फीचर</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">स्लॉट प्रारूप</label>
                  <select
                    value={studioSlot}
                    onChange={(e) => setStudioSlot(e.target.value as EpaperAdSlotType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    {BROADSHEET_SLOTS_CATALOG.map((s) => (
                      <option key={s.slotType} value={s.slotType}>
                        {s.nameHi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  वास्तविक ऑफर / विवरण (Offer Details)
                </label>
                <textarea
                  rows={2}
                  value={studioOfferDetails}
                  onChange={(e) => setStudioOfferDetails(e.target.value)}
                  placeholder="उदा. धनतेरस पर मेकिंग चार्ज पर 25% की छूट, एक्सचेंज ऑफर उपलब्ध..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    लक्षित पाठक / उपभोक्ता (Target Audience)
                  </label>
                  <input
                    type="text"
                    value={studioTargetAudience}
                    onChange={(e) => setStudioTargetAudience(e.target.value)}
                    placeholder="उदा. स्थानीय परिवार, युवा वर्ग"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    वास्तविक संपर्क फ़ोन (Contact Info)
                  </label>
                  <input
                    type="text"
                    value={studioContactPhone}
                    onChange={(e) => setStudioContactPhone(e.target.value)}
                    placeholder="उदा. 98260XXXXX"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  अभिव्यक्ति शैली (Tone of Voice)
                </label>
                <select
                  value={studioTone}
                  onChange={(e) => setStudioTone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="आकर्षक व विश्वसनीय">आकर्षक व विश्वसनीय (Persuasive & Trusted)</option>
                  <option value="प्रतिष्ठित व औपचारिक">प्रतिष्ठित व औपचारिक (Formal & Authoritative)</option>
                  <option value="उत्सव व छूट केंद्रित">उत्सव व छूट केंद्रित (Festive & High Energy)</option>
                  <option value="संक्षिप्त व सूचनात्मक">संक्षिप्त व सूचनात्मक (Concise & Informational)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiStudioCreative}
                disabled={generatingStudioCreative}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>
                  {generatingStudioCreative
                    ? 'एआई एड स्टूडियो क्रिएटिव तैयार कर रहा है...'
                    : 'एआई एड स्टूडियो से क्रिएटिव उत्पन्न करें'}
                </span>
              </button>
            </div>
          </div>

          {/* Studio Output & Selection Panel */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  निर्मित विकल्प (Generated Variants)
                </h4>
                {generatedCreatives && (
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                    3 शीर्षक • 3 कॉपी • 3 CTA
                  </span>
                )}
              </div>

              {!generatedCreatives ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <Sparkles className="w-8 h-8 text-purple-300 mx-auto mb-2 opacity-50" />
                  <p>बाएँ फ़ॉर्म में विवरण दर्ज कर 'क्रिएटिव उत्पन्न करें' पर क्लिक करें।</p>
                </div>
              ) : (
                <div className="space-y-4 mt-3">
                  {/* Headline Variants */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      1. मुख्य शीर्षक चुनें (Headline Options):
                    </label>
                    <div className="space-y-1.5">
                      {(generatedCreatives.suggestedHeadlines || generatedCreatives.headlineVariants || []).map((h: string, i: number) => (
                        <div
                          key={i}
                          onClick={() => setSelectedHeadlineIdx(i)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            selectedHeadlineIdx === i
                              ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-mono text-purple-600 mr-1.5">#{i + 1}</span> {h}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Copy Body Variants */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      2. मुख्य पाठ्य कॉपी चुनें (Copy Body Options):
                    </label>
                    <div className="space-y-1.5">
                      {(generatedCreatives.suggestedCopy || generatedCreatives.copyVariants || []).map((c: string, i: number) => (
                        <div
                          key={i}
                          onClick={() => setSelectedCopyIdx(i)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            selectedCopyIdx === i
                              ? 'bg-purple-50 border-purple-400 text-purple-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-mono text-purple-600 mr-1.5">विकल्प {i + 1}:</span>{' '}
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Variants */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      3. कॉल-टू-एक्शन चुनें (Call to Action):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(generatedCreatives.suggestedCtas || generatedCreatives.ctaVariants || []).map((cta: string, i: number) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedCtaIdx(i)}
                          className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            selectedCtaIdx === i
                              ? 'bg-purple-600 text-white border-purple-600 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {cta}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview Card & Apply Button */}
            {generatedCreatives && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-xl p-4 relative shadow-sm">
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#ED1727] text-white text-[9px] font-black rounded-xs">
                    विज्ञापन
                  </div>
                  <h5 className="text-sm font-bold text-slate-900 pr-12">
                    {(generatedCreatives.suggestedHeadlines || generatedCreatives.headlineVariants || [])[selectedHeadlineIdx] || ''}
                  </h5>
                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                    {(generatedCreatives.suggestedCopy || generatedCreatives.copyVariants || [])[selectedCopyIdx] || ''}
                  </p>
                  <div className="mt-2 text-xs font-bold text-[#78350F] flex items-center justify-between">
                    <span>{(generatedCreatives.suggestedCtas || generatedCreatives.ctaVariants || [])[selectedCtaIdx] || ''}</span>
                    {studioContactPhone && <span>फ़ोन: {studioContactPhone}</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyAiStudioToDraft}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>चयनित क्रिएटिव को विज्ञापन ड्राफ्ट में लागू करें</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SLOT MANAGER (PAGE SLOT ALLOCATOR & CONFLICT CHECK)                */}
      {/* ========================================================================= */}
      {activeTab === 'slot_manager' && (
        <div className="space-y-6">
          {/* Edition & Page Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  ई-पेपर संस्करण (Edition):
                </label>
                <select
                  value={slotSelectedEditionId}
                  onChange={(e) => setSlotSelectedEditionId(e.target.value)}
                  className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
                >
                  {editions.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {(ed as any).editionName || ed.title} ({ed.publicationDate}) — {ed.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  पृष्ठ संख्या (Page Number):
                </label>
                <select
                  value={slotSelectedPage}
                  onChange={(e) => setSlotSelectedPage(Number(e.target.value))}
                  className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      पृष्ठ {p} {p === 1 ? '(Front)' : p === 12 ? '(Back)' : p === 11 ? '(Classified)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={loadPageSlots}
                  className="px-3 py-2 text-slate-700 hover:text-blue-700 rounded-xl hover:bg-slate-100 cursor-pointer text-xs flex items-center gap-1.5 font-bold border border-slate-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>स्लॉट स्थिति जांचें</span>
                </button>
              </div>
            </div>

            {/* Quick Allocation Bar */}
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <select
                value={slotAssignAdId}
                onChange={(e) => {
                  setSlotAssignAdId(e.target.value);
                  const found = submissions.find((s) => s.id === e.target.value);
                  if (found) setSlotAssignType(found.slotType);
                }}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white max-w-xs"
              >
                <option value="">-- स्वीकृत विज्ञापन चुनें ({approvedAdsForSlotPlacement.length}) --</option>
                {approvedAdsForSlotPlacement.map((ad) => (
                  <option key={ad.id} value={ad.id}>
                    {ad.businessName || ad.advertiserName} ({ad.slotType})
                  </option>
                ))}
              </select>

              <button
                onClick={handleAssignSlot}
                disabled={!slotAssignAdId}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                इस पृष्ठ पर आवंटित करें
              </button>
            </div>
          </div>

          {/* Visual Occupancy Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Occupied Slots on Selected Page */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>इस पृष्ठ पर अधिग्रहीत स्लॉट (Occupied)</span>
                <span className="font-mono text-blue-700">
                  {availableSlotsData?.occupiedSlots.length || 0} स्लॉट
                </span>
              </h4>

              {loadingSlots ? (
                <div className="p-8 text-center text-slate-400 text-xs">स्लॉट लोड हो रहे हैं...</div>
              ) : !availableSlotsData || availableSlotsData.occupiedSlots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  इस पृष्ठ पर कोई विज्ञापन आवंटित नहीं है।
                </div>
              ) : (
                <div className="space-y-2">
                  {availableSlotsData.occupiedSlots.map((oc, i) => (
                    <div
                      key={i}
                      className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-[#ED1727] text-white text-[8px] font-bold rounded-xs">
                            विज्ञापन
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{oc.businessName}</span>
                        </div>
                        <span className="text-[10px] text-amber-900 font-mono block mt-0.5">
                          {oc.slotType} (W:{oc.boundsPt.width}pt, H:{oc.boundsPt.height}pt)
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveSlot(oc.adId)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                        title="स्लॉट से हटाएं"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Broadsheet Slots for Selection */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>उपलब्ध ब्रॉडशीट स्लॉट विनिर्देश (Available Slots)</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  कुल {availableSlotsData?.availableSlots.length || BROADSHEET_SLOTS_CATALOG.length} विकल्प
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {(availableSlotsData?.availableSlots || BROADSHEET_SLOTS_CATALOG).map((slot, i) => {
                  const sType = slot.slotType;
                  const nameHi = slot.titleHindi || slot.nameHi;
                  const dim = slot.dimensionsMm;
                  const rate = slot.rateRupees || slot.baseRateInr;

                  return (
                    <div
                      key={i}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2 hover:border-blue-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-mono font-bold rounded">
                            {sType}
                          </span>
                          <span className="text-[9px] text-rose-700 font-bold bg-rose-50 px-1 rounded">
                            ASCI
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 mt-1">{nameHi}</h5>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">आकार: {dim}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-700">₹{rate}</span>
                        <button
                          onClick={() => {
                            setSlotAssignType(sType);
                            if (approvedAdsForSlotPlacement.length > 0 && !slotAssignAdId) {
                              setSlotAssignAdId(approvedAdsForSlotPlacement[0].id);
                            }
                          }}
                          className="block text-[10px] text-blue-600 hover:underline font-semibold mt-1 cursor-pointer"
                        >
                          स्लॉट चुनें
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REPORTER CAMPAIGNS & SUBMISSION HUB                                */}
      {/* ========================================================================= */}
      {activeTab === 'reporters' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-700" />
                <span>संवाददाता विज्ञापन हब (Reporter Campaign Hub)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ज़िला संवाददाताओं को क्लाइंट/अभियान असाइन करें एवं उनकी सबमिशन रिपोर्ट ट्रैक करें (संवाददाता गोपनीयता पृथक्करण सक्रिय)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">कुल रिपोर्टर सबमिशन</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {submissions.filter((s) => s.reporterId || s.assignedReporterId).length}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">स्वीकृत विज्ञापन</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {submissions.filter((s) => s.status === 'APPROVED' || s.status === 'PUBLISHED').length}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">समीक्षाधीन प्रविष्टियाँ</span>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-3">आईडी / नंबर</th>
                  <th className="p-3">संवाददाता</th>
                  <th className="p-3">विज्ञापनदाता / प्रतिष्ठान</th>
                  <th className="p-3">ज़िला</th>
                  <th className="p-3">स्लॉट प्रकार</th>
                  <th className="p-3">राशि</th>
                  <th className="p-3">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-blue-700">
                      {s.submissionNumber || s.id.slice(0, 8)}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {s.assignedReporterName || s.reporterName || s.reporterId || 'अविशिष्ट'}
                    </td>
                    <td className="p-3">{s.businessName || s.advertiserName}</td>
                    <td className="p-3">{s.targetDistrictName || s.targetDistrict || 'मध्य प्रदेश'}</td>
                    <td className="p-3 font-mono">{s.slotType}</td>
                    <td className="p-3 font-bold text-slate-900">₹{s.amount || 2500}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: RATE CARD & TARIFF CALCULATOR                                      */}
      {/* ========================================================================= */}
      {activeTab === 'rate_card' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>ब्रॉडशीट विज्ञापन दर गणक (Tariff Calculator)</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    विज्ञापन स्लॉट प्रकार:
                  </label>
                  <select
                    value={calcSlot}
                    onChange={(e) => setCalcSlot(e.target.value as EpaperAdSlotType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    {BROADSHEET_SLOTS_CATALOG.map((s) => (
                      <option key={s.slotType} value={s.slotType}>
                        {s.nameHi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    प्रसारण भौगोलिक स्तर (Geographic Tier):
                  </label>
                  <select
                    value={calcTier}
                    onChange={(e) => setCalcTier(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="district">ज़िला स्तर (District Level - Base 1.0x)</option>
                    <option value="division">संभागीय स्तर (Division Level - 2.5x)</option>
                    <option value="statewide">राज्यव्यापी स्तर (Statewide - 8.0x)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    पृष्ठ स्थान (Page Placement Multiplier):
                  </label>
                  <select
                    value={calcPage}
                    onChange={(e) => setCalcPage(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value={1}>पेज 1: प्रथम पृष्ठ (+100% प्रीमियम - 2.0x)</option>
                    <option value={2}>पेज 2 अथवा 3: प्रादेशिक व राष्ट्रीय (+25% - 1.25x)</option>
                    <option value={12}>पेज 12: अंतिम पृष्ठ (+50% - 1.5x)</option>
                    <option value={5}>आंतरिक पृष्ठ (पेज 4-11, सामान्य 1.0x)</option>
                  </select>
                </div>

                {calcSlot === 'CLASSIFIED' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      शब्द संख्या (अधिकतम 30 शब्द शामिल, अतिरिक्त ₹5/शब्द):
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={calcWords}
                      onChange={(e) => setCalcWords(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tariff Output Display */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  अनुमानित विज्ञापन शुल्क (Estimated Tariff)
                </h4>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  ₹{calculateEstimate().toLocaleString('en-IN')}
                </div>
                <span className="text-xs text-slate-500">
                  (जीएसटी 5% = ₹{Math.round(calculateEstimate() * 0.05).toLocaleString('en-IN')} अतिरिक्त देय होगी)
                </span>

                <div className="mt-6 space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-4">
                  <div className="flex justify-between">
                    <span>स्लॉट:</span>
                    <span className="font-semibold text-slate-900">{calcSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>प्रसारण दायरा:</span>
                    <span className="font-semibold text-slate-900">{calcTier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>पृष्ठ गुणांक:</span>
                    <span className="font-semibold text-slate-900">
                      {calcPage === 1 ? '2.0x (Front Page)' : calcPage === 12 ? '1.5x (Back Page)' : '1.0x'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  भारतीय विज्ञापन मानक परिषद (ASCI) के दिशा-निर्देशानुसार सभी विज्ञापनों पर स्पष्ट 'विज्ञापन' अथवा 'प्रायोजित' बैज अनिवार्य रूप से मुद्रित होगा।
                </span>
              </div>
            </div>
          </div>

          {/* Full Rate Card Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              मानकीकृत 13 ब्रॉडशीट विज्ञापन स्लॉट विनिर्देश तालिका
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BROADSHEET_SLOTS_CATALOG.map((slot) => (
                <div key={slot.slotType} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-mono text-[10px] font-bold rounded">
                      {slot.slotType}
                    </span>
                    <span className="text-xs font-bold text-slate-900">₹{slot.baseRateInr}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">{slot.nameHi}</h5>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>आकार: <span className="font-mono text-slate-700">{slot.dimensionsMm}</span></div>
                    <div>लक्ष्य: <span className="text-slate-700">{slot.targetPage}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ADMINISTRATIVE REPORTING & ANALYTICS                               */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-700" />
                <span>विज्ञापन प्रशासनिक रिपोर्टिंग (Honest Ad Reporting)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                सटीक वास्तविक स्थिति गणना, श्रेणी व स्लॉट वितरण, और ब्रॉडशीट स्लॉट अधिभोग आँकड़े
              </p>
            </div>

            <button
              onClick={loadReports}
              className="px-3 py-1.5 text-slate-700 hover:text-blue-700 rounded-xl hover:bg-slate-100 cursor-pointer text-xs flex items-center gap-1.5 font-bold border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>रिफ्रेश</span>
            </button>
          </div>

          {loadingReports ? (
            <div className="p-16 text-center text-slate-500 text-xs">रिपोर्ट तैयार हो रही है...</div>
          ) : reportsData ? (
            <div className="space-y-6">
              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">कुल विज्ञापन प्रविष्टियाँ</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{reportsData.totalAds}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">स्वीकृत विज्ञापन</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {(reportsData.statusBreakdown?.APPROVED ?? reportsData.statusCounts?.approved) || 0}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">प्रकाशित विज्ञापन</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">
                    {(reportsData.statusBreakdown?.PUBLISHED ?? reportsData.statusCounts?.published) || 0}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">कुल राजस्व मूल्य</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    ₹{(((reportsData.totalAmountPaise || 0) as number) / 100).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    स्थिति-वार विभाजन (Status Distribution)
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(reportsData.statusBreakdown || reportsData.statusCounts || {}).map(([st, cnt]) => (
                      <div key={st} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{st}</span>
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {String(cnt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    श्रेणी-वार विभाजन (Category Breakdown)
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(reportsData.categoryBreakdown || reportsData.byCategory || {}).map(([cat, cnt]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{cat}</span>
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {String(cnt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slot Occupancy Rate */}
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    ब्रॉडशीट स्लॉट अधिभोग दर (Broadsheet Slot Occupancy)
                  </h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    कुल उपलब्ध स्लॉट: {reportsData.slotOccupancy?.totalSlots ?? reportsData.slotOccupancy?.totalConfiguredSlots ?? 13} | अधिग्रहीत: {reportsData.slotOccupancy?.occupiedSlots ?? 0}
                  </p>
                </div>
                <div className="text-2xl font-black text-blue-800 font-mono">
                  {reportsData.slotOccupancy?.occupancyRatePct ?? reportsData.slotOccupancy?.occupancyPercent ?? 0}% अधिभोग
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">कोई रिपोर्ट डेटा उपलब्ध नहीं है।</div>
          )}
        </div>
      )}
    </div>
  );
};
