import React, { useState, useEffect } from 'react';
import {
  EpaperAdSubmissionDoc,
  EpaperAdSlotType,
  EpaperAdCategory,
  EpaperEditionDoc,
} from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Megaphone,
  CreditCard,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  UploadCloud,
  FileText,
  DollarSign,
  AlertTriangle,
  Eye,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';

export interface EpaperAdManagerProps {
  editions?: EpaperEditionDoc[];
  onPlaceAdOnPage?: (ad: EpaperAdSubmissionDoc, editionId: string, pageNumber: number) => void;
}

const BROADSHEET_SLOTS: Array<{
  slotType: EpaperAdSlotType;
  nameHi: string;
  dimensionsMm: string;
  aspectRatio: string;
  colSpan: string;
  targetPage: string;
  baseRateInr: number;
}> = [
  {
    slotType: 'FULL_PAGE',
    nameHi: 'पूर्ण पृष्ठ विज्ञापन (Full Page)',
    dimensionsMm: '329 x 520 mm',
    aspectRatio: '2:3 (Broadsheet)',
    colSpan: '8 Columns',
    targetPage: 'अंतिम पृष्ठ / बैक पेज',
    baseRateInr: 15000,
  },
  {
    slotType: 'HALF_PAGE_HORIZONTAL',
    nameHi: 'क्षैतिज अर्ध-पृष्ठ (Half Page Horizontal)',
    dimensionsMm: '329 x 260 mm',
    aspectRatio: '16:9 / ~4:3',
    colSpan: '8 Columns',
    targetPage: 'पेज 2, 3 अथवा बैक पेज',
    baseRateInr: 8500,
  },
  {
    slotType: 'HALF_PAGE_VERTICAL',
    nameHi: 'ऊर्ध्वाधर अर्ध-पृष्ठ (Half Page Vertical)',
    dimensionsMm: '160 x 520 mm',
    aspectRatio: '~1:3',
    colSpan: '4 Columns',
    targetPage: 'आंतरिक पृष्ठ (पेज 6, 7)',
    baseRateInr: 8500,
  },
  {
    slotType: 'QUARTER_PAGE',
    nameHi: 'चतुर्थांश पृष्ठ (Quarter Page)',
    dimensionsMm: '160 x 260 mm',
    aspectRatio: '4:3 / 3:4',
    colSpan: '4 Columns',
    targetPage: 'पेज 2, 5, 8 (व्यापार)',
    baseRateInr: 4500,
  },
  {
    slotType: 'L_SHAPE',
    nameHi: 'एल-आकार विज्ञापन (L-Shape Wrap)',
    dimensionsMm: 'Compound L-Wrap',
    aspectRatio: 'custom',
    colSpan: '8 Bottom + 2 Side',
    targetPage: 'प्रथम पृष्ठ अथवा पेज 3',
    baseRateInr: 12000,
  },
  {
    slotType: 'BOTTOM_STRIP',
    nameHi: 'तल स्ट्रिप / पाद विज्ञापन (Bottom Strip / Footer)',
    dimensionsMm: '329 x 50 mm',
    aspectRatio: '~7:1',
    colSpan: '8 Columns',
    targetPage: 'प्रथम पृष्ठ व बैक पेज',
    baseRateInr: 2500,
  },
  {
    slotType: 'VERTICAL_EAR',
    nameHi: 'मास्टहेड ईयर पैनल (Ear Panel)',
    dimensionsMm: '45 x 35 mm',
    aspectRatio: '4:3',
    colSpan: '1 Column',
    targetPage: 'प्रथम पृष्ठ मास्टहेड के बाएँ/दाएँ',
    baseRateInr: 1500,
  },
  {
    slotType: 'CLASSIFIED',
    nameHi: 'वर्गीकृत विज्ञापन (Classified Box & Text)',
    dimensionsMm: '40 x 30 mm',
    aspectRatio: '1:1',
    colSpan: '1-2 Columns',
    targetPage: 'पेज 11 (वर्गीकृत पृष्ठ)',
    baseRateInr: 250,
  },
];

export const EpaperAdManager: React.FC<EpaperAdManagerProps> = ({
  editions = [],
  onPlaceAdOnPage,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'rate_card' | 'creator' | 'queue'>('queue');
  const [submissions, setSubmissions] = useState<EpaperAdSubmissionDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rate Card Calculator State
  const [calcSlot, setCalcSlot] = useState<EpaperAdSlotType>('BOTTOM_STRIP');
  const [calcTier, setCalcTier] = useState<'district' | 'division' | 'statewide'>('district');
  const [calcPage, setCalcPage] = useState<number>(1);
  const [calcWords, setCalcWords] = useState<number>(30);

  // Creative Ingestion & AI Copy Studio State
  const [advName, setAdvName] = useState<string>('');
  const [advPhone, setAdvPhone] = useState<string>('');
  const [advCategory, setAdvCategory] = useState<EpaperAdCategory>('COMMERCIAL');
  const [advSlot, setAdvSlot] = useState<EpaperAdSlotType>('BOTTOM_STRIP');
  const [advText, setAdvText] = useState<string>('');
  const [advImageUrl, setAdvImageUrl] = useState<string>('');
  const [advOfferDetails, setAdvOfferDetails] = useState<string>('');
  const [generatingCopy, setGeneratingCopy] = useState<boolean>(false);
  const [submittingAd, setSubmittingAd] = useState<boolean>(false);

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await apiClient.epaper.getClassifiedSubmissions({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setSubmissions(data);
    } catch (err: any) {
      console.error('Failed to load ad submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReviewSubmission = async (id: string, action: 'APPROVE' | 'REJECT', notes = '') => {
    try {
      await apiClient.epaper.reviewClassifiedSubmission(id, { action, reviewNotes: notes });
      showToast(action === 'APPROVE' ? 'विज्ञापन स्वीकृत किया गया!' : 'विज्ञापन अस्वीकृत किया गया');
      await loadSubmissions();
    } catch (err: any) {
      alert(err.message || 'समीक्षा विफल रही');
    }
  };

  const handleGenerateAiCopy = async () => {
    if (!advName.trim()) {
      alert('कृपया पहले प्रतिष्ठान अथवा विज्ञापनदाता का नाम दर्ज करें');
      return;
    }
    setGeneratingCopy(true);
    try {
      const result = await apiClient.epaper.generateAdCopy({
        businessName: advName,
        category: advCategory,
        offerDetails: advOfferDetails,
      });
      setAdvText(`${result.headline}\n\n${result.body}\n\n${result.cta}`);
      showToast('एआई देवनागरी कॉपीराइटिंग तैयार!');
    } catch (err: any) {
      alert(err.message || 'कॉपी निर्माण विफल रहा');
    } finally {
      setGeneratingCopy(false);
    }
  };

  const handleSubmitAd = async () => {
    if (!advName.trim() || !advPhone.trim()) {
      alert('विज्ञापनदाता का नाम और संपर्क फोन अनिवार्य हैं');
      return;
    }
    setSubmittingAd(true);
    try {
      await apiClient.epaper.submitClassifiedAd({
        advertiserName: advName,
        contactPhone: advPhone,
        category: advCategory,
        slotType: advSlot,
        text: advText,
        imageUrl: advImageUrl,
        amount: advSlot === 'CLASSIFIED' ? 250 : 2500,
        status: 'PENDING',
      });
      showToast('विज्ञापन प्रविष्टि सफलतापूर्वक दर्ज की गई!');
      setAdvName('');
      setAdvPhone('');
      setAdvText('');
      setAdvImageUrl('');
      setAdvOfferDetails('');
      setActiveTab('queue');
      await loadSubmissions();
    } catch (err: any) {
      alert(err.message || 'विज्ञापन दर्ज करना विफल रहा');
    } finally {
      setSubmittingAd(false);
    }
  };

  // Tariff calculator helper
  const calculateEstimate = () => {
    const slotObj = BROADSHEET_SLOTS.find((s) => s.slotType === calcSlot) || BROADSHEET_SLOTS[0];
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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ब्रॉडशीट प्रिंट विज्ञापन एवं समीक्षा केंद्र (Ad Engine & Review Desk)
              </h2>
              <p className="text-xs text-slate-500">
                8 ब्रॉडशीट स्लॉट विनिर्देश, क्षेत्रीय दर सूचियां, एआई कॉपीराइटर एवं अनिवार्य ASCI 'विज्ञापन' प्रमाणीकरण
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-lg border border-red-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span>ASCI 'विज्ञापन' अनिवार्य नियम सक्रिय</span>
          </span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>समीक्षा कतार (Review Queue)</span>
          {submissions.filter((s) => s.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-mono">
              {submissions.filter((s) => s.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>स्लॉट सूची (Slot Inventory)</span>
        </button>

        <button
          onClick={() => setActiveTab('rate_card')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rate_card'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>दर सूची व कैलकुलेटर (Rate Card)</span>
        </button>

        <button
          onClick={() => setActiveTab('creator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'creator'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>क्रिएटिव व एआई कॉपी (Copy Studio)</span>
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">स्थिति फ़िल्टर:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">सभी विज्ञापन</option>
                <option value="PENDING">लंबित (Pending)</option>
                <option value="APPROVED">स्वीकृत (Approved)</option>
                <option value="REJECTED">अस्वीकृत (Rejected)</option>
              </select>
            </div>

            <button
              onClick={loadSubmissions}
              className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg hover:bg-slate-100 cursor-pointer text-xs flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>रिफ्रेश</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">समीक्षा कतार लोड हो रही है...</div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">कोई विज्ञापन प्रविष्टि उपलब्ध नहीं है</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700">
                          {sub.submissionNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            sub.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status === 'APPROVED'
                            ? 'स्वीकृत (Approved)'
                            : sub.status === 'REJECTED'
                            ? 'अस्वीकृत'
                            : 'प्रतीक्षारत (Pending)'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.advertiserName}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800">₹{sub.amount || 250}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {sub.slotType}
                      </span>
                    </div>
                  </div>

                  {/* Body text & creative preview */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 relative">
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#ED1727] text-white text-[10px] font-bold rounded-sm">
                      विज्ञापन
                    </span>
                    <p className="text-xs text-slate-800 pr-16 whitespace-pre-wrap line-clamp-3">
                      {sub.text || 'विज्ञापन सामग्री'}
                    </p>
                    {sub.imageUrl && (
                      <div className="mt-2 text-[10px] text-blue-600 underline line-clamp-1">
                        क्रिएटिव: {sub.imageUrl}
                      </div>
                    )}
                  </div>

                  {/* Contact details */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sub.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sub.targetDistrictName || sub.targetDistrict}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      संवाददाता: {sub.reporterName || sub.reporterId}
                    </span>

                    <div className="flex items-center gap-2">
                      {sub.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleReviewSubmission(sub.id, 'REJECT')}
                            className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            अस्वीकार
                          </button>
                          <button
                            onClick={() => handleReviewSubmission(sub.id, 'APPROVE')}
                            className="px-3 py-1 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
                          >
                            स्वीकार करें
                          </button>
                        </>
                      )}
                      {sub.status === 'APPROVED' && onPlaceAdOnPage && editions.length > 0 && (
                        <button
                          onClick={() => onPlaceAdOnPage(sub, editions[0].id, sub.targetPage || 11)}
                          className="px-3 py-1 bg-blue-700 text-white hover:bg-blue-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          पेज पर जोड़ें
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SLOT INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BROADSHEET_SLOTS.map((slot) => (
            <div
              key={slot.slotType}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-mono font-bold rounded">
                    {slot.slotType}
                  </span>
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                    ASCI 'विज्ञापन'
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{slot.nameHi}</h4>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>आकार: <span className="font-semibold text-slate-700">{slot.dimensionsMm}</span></div>
                  <div>पहलू अनुपात: <span className="font-mono text-slate-700">{slot.aspectRatio}</span></div>
                  <div>ग्रिड विस्तार: <span className="font-semibold text-slate-700">{slot.colSpan}</span></div>
                  <div>लक्षित पृष्ठ: <span className="text-slate-700">{slot.targetPage}</span></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">आधार दर:</span>
                <span className="text-sm font-bold text-blue-700">₹{slot.baseRateInr}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RATE CARD & TARIFF CALCULATOR */}
      {activeTab === 'rate_card' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>ब्रॉडशीट विज्ञापन मूल्य गणक (Tariff Calculator)</span>
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
                  {BROADSHEET_SLOTS.map((s) => (
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
                  <option value="district">ज़िला स्तर (District Level - Base 1x)</option>
                  <option value="division">संभागीय स्तर (Division Level - 2.5x)</option>
                  <option value="statewide">राज्यव्यापी स्तर (Statewide - 8.0x)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  पृष्ठ स्थान (Page Placement):
                </label>
                <select
                  value={calcPage}
                  onChange={(e) => setCalcPage(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value={1}>पेज 1: प्रथम पृष्ठ (+100% प्रीमियम)</option>
                  <option value={2}>पेज 2 अथवा 3: प्रादेशिक व राष्ट्रीय (+25%)</option>
                  <option value={12}>पेज 12: अंतिम पृष्ठ (+50%)</option>
                  <option value={5}>आंतरिक पृष्ठ (पेज 4-11, सामान्य दर)</option>
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

          {/* Calculator Output */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                अनुमानित विज्ञापन शुल्क (Estimated Tariff)
              </h4>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                ₹{calculateEstimate().toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-slate-500">
                (जीएसटी 5% अतिरिक्त देय होगी)
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
                सभी विज्ञापनों पर भारतीय विज्ञापन मानक परिषद (ASCI) के दिशा-निर्देशानुसार लाल रंग का 'विज्ञापन' बैज अनिवार्य रूप से मुद्रित होगा।
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CREATIVE INGESTION & AI COPYWRITER */}
      {activeTab === 'creator' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>एआई देवनागरी कॉपीराइटर एवं विज्ञापन दर्ज करें</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  प्रतिष्ठान / विज्ञापनदाता का नाम:
                </label>
                <input
                  type="text"
                  value={advName}
                  onChange={(e) => setAdvName(e.target.value)}
                  placeholder="उदा. शुभम वस्त्र भंडार / भोपाल प्रॉपर्टीज"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    संपर्क फोन नंबर:
                  </label>
                  <input
                    type="text"
                    value={advPhone}
                    onChange={(e) => setAdvPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">श्रेणी:</label>
                  <select
                    value={advCategory}
                    onChange={(e) => setAdvCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="COMMERCIAL">व्यावसायिक (Commercial)</option>
                    <option value="OBITUARY">शोक संदेश (Obituary)</option>
                    <option value="TENDER">निविदा सूचना (Tender)</option>
                    <option value="PROPERTY">प्रॉपर्टी / रियल एस्टेट</option>
                    <option value="MATRIMONIAL">वैवाहिक (Matrimonial)</option>
                    <option value="CLASSIFIED">वर्गीकृत (Classified)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  विशेष ऑफर अथवा विवरण (एआई प्रॉम्प्ट हेतु):
                </label>
                <input
                  type="text"
                  value={advOfferDetails}
                  onChange={(e) => setAdvOfferDetails(e.target.value)}
                  placeholder="उदा. 20% की भारी छूट, नया शोरूम प्रारंभ..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAiCopy}
                disabled={generatingCopy}
                className="w-full py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{generatingCopy ? 'एआई कॉपी तैयार हो रही है...' : 'एआई देवनागरी कॉपी बनाएं'}</span>
              </button>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  विज्ञापन पाठ्य सामग्री (Ad Copy):
                </label>
                <textarea
                  rows={4}
                  value={advText}
                  onChange={(e) => setAdvText(e.target.value)}
                  placeholder="विज्ञापन की विषय-वस्तु यहाँ दर्ज करें अथवा एआई द्वारा जनरेट करें..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  क्रिएटिव इमेज URL (वैकल्पिक):
                </label>
                <input
                  type="text"
                  value={advImageUrl}
                  onChange={(e) => setAdvImageUrl(e.target.value)}
                  placeholder="https://example.com/ad-creative.jpg"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitAd}
                disabled={submittingAd}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submittingAd ? 'सहेजा जा रहा है...' : 'विज्ञापन समीक्षा हेतु दर्ज करें'}
              </button>
            </div>
          </div>

          {/* Live Ad Preview Card */}
          <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              लाइव प्रिंट लेआउट पूर्वावलोकन (ASCI Stamped)
            </h4>

            <div className="w-full max-w-sm bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-xl p-5 relative shadow-md">
              {/* Mandatory ASCI Badge */}
              <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-[#ED1727] text-white text-[10px] font-extrabold rounded-sm">
                विज्ञापन
              </div>

              <div className="mt-4 space-y-2">
                <h5 className="text-sm font-bold text-[#78350F] text-center">
                  {advName || 'विज्ञापन शीर्षक (Headline)'}
                </h5>
                <p className="text-xs text-[#92400E] whitespace-pre-wrap text-center">
                  {advText || 'विज्ञापन की मुख्य विषय-वस्तु यहाँ प्रदर्शित होगी।'}
                </p>
                {advPhone && (
                  <div className="text-[11px] font-semibold text-center text-[#78350F] pt-2 border-t border-[#FDE68A]">
                    संपर्क सूत्र: {advPhone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
