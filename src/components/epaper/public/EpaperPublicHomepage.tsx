/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Public E-Paper Homepage (Step 11 — F19 & F20)
 * 
 * Responsibilities:
 * 1. Hero Section: Latest published Daily Edition with publication date, cover preview, and primary "अख़बार पढ़ें" action.
 * 2. Recently Published Editions: Strip / grid of recent daily editions across MP districts.
 * 3. Special Editions (विशेष परिशिष्ट / विशेषांक): Dedicated section with independent page counts and thematic badges.
 * 4. District / Region Filter: Interactive filter querying authentic published editions.
 * 5. Link to Digital Archive (अभिलेख / पुराना अंक खोजें).
 * 6. Server-Side Security Invariant: Only PUBLISHED editions with published snapshots are shown.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Layers,
  MapPin,
  Printer,
  Search,
  Share2,
  Sparkles,
  Star,
  CheckCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { EpaperEditionDoc } from '../../../types';
import { apiClient } from '../../../services/apiClient';
import { DISTRICTS } from '../../../data/mockNewsData';

interface EpaperPublicHomepageProps {
  onOpenReader: (editionId: string, pageNumber?: number) => void;
  onOpenArchive: () => void;
  onSelectDistrict?: (districtId: string) => void;
}

export const EpaperPublicHomepage: React.FC<EpaperPublicHomepageProps> = ({
  onOpenReader,
  onOpenArchive,
  onSelectDistrict,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [latestDailyEdition, setLatestDailyEdition] = useState<EpaperEditionDoc | null>(null);
  const [recentDailyEditions, setRecentDailyEditions] = useState<EpaperEditionDoc[]>([]);
  const [specialEditions, setSpecialEditions] = useState<EpaperEditionDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageEditions() {
      setIsLoading(true);
      setError(null);
      try {
        const distFilter = selectedDistrict !== 'all' ? selectedDistrict : undefined;

        // 1. Fetch latest daily edition
        const latest = await apiClient.epaper.getLatestEdition(distFilter, 'DAILY');

        // 2. Fetch recently published daily editions
        const recentRes = await apiClient.epaper.getEditions({
          status: 'PUBLISHED',
          editionType: 'DAILY',
          districtId: distFilter,
          limit: 8,
        });
        const recentList = recentRes.editions || recentRes.items || [];

        // 3. Fetch published special editions
        const specialRes = await apiClient.epaper.getEditions({
          status: 'PUBLISHED',
          editionType: 'SPECIAL',
          limit: 6,
        });
        const specialList = specialRes.editions || specialRes.items || [];

        if (isMounted) {
          setLatestDailyEdition(latest || recentList[0] || null);
          setRecentDailyEditions(recentList);
          setSpecialEditions(specialList);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Failed to load homepage editions:', err);
          setError('ई-पेपर संस्करण लोड करने में असमर्थ। कृपया पुनः प्रयास करें।');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHomepageEditions();
    return () => {
      isMounted = false;
    };
  }, [selectedDistrict]);

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrict(distId);
    if (onSelectDistrict) onSelectDistrict(distId);
  };

  const handleShare = (edition: EpaperEditionDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/epaper?editionId=${encodeURIComponent(edition.id)}`;
    if (navigator.share) {
      navigator.share({
        title: edition.title || 'ब्रेकिंग न्यूज़ वाला ई-पेपर',
        text: `ब्रेकिंग न्यूज़ वाला - दैनिक डिजिटल ई-पेपर (${edition.districtName || 'मध्य प्रदेश'} संस्करण):`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('ई-पेपर लिंक क्लिपबोर्ड पर कॉपी हो गया!');
    }
  };

  const handleDownloadPdf = async (edition: EpaperEditionDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingPdf(true);
    showToast(`'${edition.title}' (प्रिंट-रेडी PDF) डाउनलोड हो रहा है...`);
    try {
      const blob = await apiClient.epaper.exportPdf(edition.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${edition.editionCode || edition.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('PDF सफलतापूर्वक डाउनलोड हो गया!');
    } catch (err) {
      console.warn('PDF export failed:', err);
      showToast('PDF डाउनलोड विफल रहा। कृपया बाद में प्रयास करें।');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Format date in Hindi (e.g. 20 नवंबर 2026)
  const formatHindiDate = (dateStr?: string) => {
    if (!dateStr) return 'आज का संस्करण';
    try {
      const date = new Date(dateStr);
      const monthsHi = [
        'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
      ];
      const d = date.getDate();
      const m = monthsHi[date.getMonth()];
      const y = date.getFullYear();
      return `${d} ${m} ${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 select-none pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Subheader Brand Masthead */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#ED1727] text-white text-[11px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                डिजिटल ई-पेपर
              </span>
              <span className="text-xs font-extrabold text-[#344FD6]">
                मध्य प्रदेश का विश्वसनीय समाचार पत्र
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <span>ब्रेकिंग न्यूज़ वाला — डिजिटल संस्करण</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              प्रामाणिक ब्रॉडशीट लेआउट • 55 जिलों का संपूर्ण प्रादेशिक व स्थानीय कवरेज
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Archive CTA */}
            <button
              onClick={onOpenArchive}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-amber-700" />
              <span>पुराने अंक (अभिलेखागार)</span>
            </button>
          </div>
        </div>

        {/* District Filter Pill Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#ED1727]" />
              संपादकीय संस्करण:
            </span>
            <button
              onClick={() => handleDistrictChange('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedDistrict === 'all'
                  ? 'bg-[#344FD6] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              समस्त मध्य प्रदेश
            </button>
            {DISTRICTS.slice(0, 10).map((d) => {
              const isSelected = selectedDistrict === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => handleDistrictChange(d.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#344FD6] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {d.nameHi}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 text-[#ED1727] animate-spin mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">ई-पेपर संस्करण लोड हो रहे हैं...</h3>
            <p className="text-xs text-slate-500 mt-1">प्रकाशित ब्रॉडशीट संस्करण तैयार किए जा रहे हैं</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* 1. HERO: Latest Daily Edition Banner */}
        {!isLoading && latestDailyEdition && (
          <section className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Background Accent Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ED1727]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#344FD6]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Edition Metadata & Actions */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-red-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    आज का मुख्य संस्करण (Latest Daily Edition)
                  </span>
                  <span className="bg-blue-600/80 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                    {latestDailyEdition.districtName || 'भोपाल'} संस्करण
                  </span>
                  <span className="bg-white/10 text-slate-200 text-[11px] font-mono px-2 py-0.5 rounded">
                    {latestDailyEdition.editionCode || 'EP-DAILY'}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                    {latestDailyEdition.title || `${latestDailyEdition.districtName || 'भोपाल'} दैनिक ई-पेपर`}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>प्रकाशन तिथि: {formatHindiDate(latestDailyEdition.publicationDate)}</span>
                    <span>•</span>
                    <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>कुल 12 पृष्ठ (मानक ब्रॉडशीट P1–P12)</span>
                  </p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  अखबार मुद्रण की हूबहू ब्रॉडशीट प्रति (32.9 cm × 52.0 cm)। उच्च-रिजॉल्यूशन पठन, डीप-ज़ूमिंग, 
                  ऑडियो वाचन तथा 4:5 सोशल मीडिया क्लिपिंग की संपूर्ण सुविधा उपलब्ध।
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => onOpenReader(latestDailyEdition.id, 1)}
                    className="flex items-center gap-2 px-5 py-3 bg-[#ED1727] hover:bg-red-700 text-white rounded-xl text-sm font-black shadow-lg hover:shadow-red-900/30 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>अख़बार पढ़ें (Read Broadsheet)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDownloadPdf(latestDailyEdition, e)}
                    disabled={isExportingPdf}
                    className="flex items-center gap-1.5 px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="300 DPI प्रिंट-रेडी PDF डाउनलोड करें"
                  >
                    {isExportingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Printer className="w-4 h-4 text-amber-400" />
                    )}
                    <span>PDF डाउनलोड</span>
                  </button>

                  <button
                    onClick={(e) => handleShare(latestDailyEdition, e)}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-colors cursor-pointer"
                    title="ई-पेपर साझा करें"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: Newspaper Cover / Front Page Preview Card */}
              <div className="md:col-span-5 flex justify-center">
                <div
                  onClick={() => onOpenReader(latestDailyEdition.id, 1)}
                  className="group relative w-56 sm:w-64 aspect-[1/1.58] bg-white rounded-lg p-2 shadow-2xl border-2 border-slate-700 hover:border-red-500 transition-all cursor-pointer transform group-hover:scale-102"
                >
                  {/* Front Page Newspaper Frame */}
                  <div className="w-full h-full bg-slate-100 rounded flex flex-col justify-between p-2 text-slate-800 overflow-hidden relative">
                    {/* Simulated Masthead Header */}
                    <div className="border-b-2 border-slate-900 pb-1 text-center">
                      <span className="text-[9px] font-black tracking-widest text-[#ED1727] block">
                        ब्रेकिंग न्यूज़ वाला
                      </span>
                      <span className="text-[7px] text-slate-500 font-bold block">
                        {latestDailyEdition.districtName || 'भोपाल'} • {latestDailyEdition.publicationDate}
                      </span>
                    </div>

                    {/* Headline Simulation */}
                    <div className="my-auto text-center px-1">
                      <span className="text-[10px] font-extrabold text-slate-900 line-clamp-2 leading-tight">
                        {latestDailyEdition.title || 'मध्य प्रदेश प्रादेशिक व राष्ट्रीय मुख्य समाचार'}
                      </span>
                      <div className="w-8 h-0.5 bg-red-600 mx-auto my-1.5" />
                      <div className="w-full h-16 bg-slate-200 rounded my-1 flex items-center justify-center text-[9px] text-slate-400 font-bold">
                        [प्रथम पृष्ठ मुख्य छायाचित्र]
                      </div>
                      <p className="text-[8px] text-slate-600 line-clamp-3 leading-tight mt-1 text-left">
                        राज्य शासन के प्रमुख निर्णय, जनहित कल्याणकारी योजनाएं एवं प्रदेश भर की ताज़ा गतिविधियां...
                      </p>
                    </div>

                    {/* Footer strip */}
                    <div className="border-t border-slate-300 pt-1 flex items-center justify-between text-[7px] font-bold text-slate-500">
                      <span>पृष्ठ संख्या: 1 / 12</span>
                      <span className="text-blue-700 font-black">ब्रोडशीट प्रति</span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-[#344FD6]/85 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center rounded">
                      <BookOpen className="w-8 h-8 mb-2" />
                      <span className="text-xs font-black">पूरा अख़बार पढ़ें</span>
                      <span className="text-[10px] text-blue-200 mt-1">क्लिक करके 12 पृष्ठों का संस्करण खोलें</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. RECENT EDITIONS: Recently Published Editions Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#344FD6]" />
                हाल ही में प्रकाशित दैनिक संस्करण (Recent Daily Editions)
              </h3>
              <p className="text-xs text-slate-500">
                विगत दिनों के मुख्य 12-पृष्ठीय प्रकाशित ई-पेपर अंक
              </p>
            </div>
            <button
              onClick={onOpenArchive}
              className="text-xs font-bold text-[#344FD6] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>सभी देखें</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {recentDailyEditions.length === 0 && !isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              कोई हालिया दैनिक संस्करण उपलब्ध नहीं है।
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentDailyEditions.map((edition) => (
              <div
                key={edition.id}
                onClick={() => onOpenReader(edition.id, 1)}
                className="group bg-white rounded-xl border border-slate-200 hover:border-[#344FD6] shadow-xs hover:shadow-md transition-all p-3.5 flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="bg-blue-50 text-[#344FD6] font-bold px-2 py-0.5 rounded border border-blue-200">
                      {edition.districtName || 'भोपाल'}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {formatHindiDate(edition.publicationDate)}
                    </span>
                  </div>

                  {/* Thumbnail Preview Area */}
                  <div className="aspect-[1/1.4] bg-slate-100 rounded-lg p-2 border border-slate-200 flex flex-col justify-between text-center relative overflow-hidden group-hover:bg-slate-50">
                    <div className="border-b border-slate-300 pb-1">
                      <span className="text-[8px] font-black text-red-600 block">
                        ब्रेकिंग न्यूज़ वाला
                      </span>
                    </div>
                    <div className="my-auto px-1">
                      <span className="text-[10px] font-bold text-slate-800 line-clamp-2">
                        {edition.title}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-1 text-[8px] font-bold text-slate-400">
                      12 ब्रॉडशीट पृष्ठ
                    </div>

                    <div className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold bg-[#ED1727] px-3 py-1 rounded shadow">
                        पढ़ें
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#344FD6] line-clamp-2 transition-colors">
                    {edition.title}
                  </h4>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    12 पृष्ठ
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleShare(edition, e)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title="शेयर करें"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDownloadPdf(edition, e)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="PDF डाउनलोड"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. SPECIAL EDITIONS: Dedicated Section for Special Editions */}
        {specialEditions.length > 0 && (
          <section className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="bg-amber-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                  विशेष परिशिष्ट / विशेषांक
                </span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                  विशेष परिशिष्ट एवं विशेषांक (Special Editions)
                </h3>
                <p className="text-xs text-slate-600">
                  त्यौहार, बजट, चुनाव, पर्यटन एवं महाकाल विशेष परिशिष्ट
                </p>
              </div>

              <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                {specialEditions.length} विशेष अंक
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {specialEditions.map((edition) => (
                <div
                  key={edition.id}
                  onClick={() => onOpenReader(edition.id, 1)}
                  className="bg-white rounded-xl border border-amber-200 hover:border-amber-400 shadow-xs hover:shadow-md p-4 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded">
                        {edition.districtName || 'विशेष'} विशेषांक
                      </span>
                      <span className="text-slate-500 font-medium">
                        {formatHindiDate(edition.publicationDate)}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 hover:text-amber-700 transition-colors">
                      {edition.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      विशेष संदर्भ एवं स्वतंत्र पृष्ठ संख्या: {edition.totalPages || 4} पृष्ठ
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-amber-800">
                      {edition.totalPages || 4} पृष्ठ
                    </span>

                    <button
                      onClick={() => onOpenReader(edition.id, 1)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      विशेषांक पढ़ें
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. DIGITAL ARCHIVE PROMOTION BANNER */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded">
                डिजिटल अभिलेखागार
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              पुराने अखबार के अंक खोजें (Explore Historical Digital Archive)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              वर्ष-वार, माह-वार एवं तिथि-वार किसी भी पुराने प्रकाशित ई-पेपर को खोजें एवं ऑनलाइन पढ़ें।
            </p>
          </div>

          <button
            onClick={onOpenArchive}
            className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-[#344FD6] hover:bg-blue-800 text-white rounded-xl text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>डिजिटल अभिलेखागार खोलें</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </div>
    </div>
  );
};
