/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Digital E-Paper Archive (Step 11 — F20)
 * 
 * Features:
 * 1. Year-wise edition browsing (2026, 2025, 2024...)
 * 2. Month-wise filtering (जनवरी - दिसंबर)
 * 3. Publication-date search (YYYY-MM-DD)
 * 4. Daily Edition & Special Edition filters
 * 5. District / Region filter across MP
 * 6. Pagination with total count and page indicators
 * 7. Server-Side Security Invariant: Only PUBLISHED editions and published snapshots are queried.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Archive,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Layers,
  MapPin,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  BookOpen,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { EpaperEditionDoc } from '../../../types';
import { apiClient } from '../../../services/apiClient';
import { DISTRICTS } from '../../../data/mockNewsData';

interface EpaperDigitalArchiveProps {
  onOpenReader: (editionId: string, pageNumber?: number) => void;
  onBackClick: () => void;
}

const HINDI_MONTHS = [
  { value: 'all', label: 'समस्त माह (All Months)' },
  { value: '01', label: 'जनवरी (January)' },
  { value: '02', label: 'फ़रवरी (February)' },
  { value: '03', label: 'मार्च (March)' },
  { value: '04', label: 'अप्रैल (April)' },
  { value: '05', label: 'मई (May)' },
  { value: '06', label: 'जून (June)' },
  { value: '07', label: 'जुलाई (July)' },
  { value: '08', label: 'अगस्त (August)' },
  { value: '09', label: 'सितंबर (September)' },
  { value: '10', label: 'अक्टूबर (October)' },
  { value: '11', label: 'नवंबर (November)' },
  { value: '12', label: 'दिसंबर (December)' },
];

const AVAILABLE_YEARS = ['all', '2026', '2025', '2024'];

export const EpaperDigitalArchive: React.FC<EpaperDigitalArchiveProps> = ({
  onOpenReader,
  onBackClick,
}) => {
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(12);
  const [totalEditions, setTotalEditions] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Data states
  const [editions, setEditions] = useState<EpaperEditionDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchArchiveData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.epaper.getArchiveEditions({
        year: selectedYear !== 'all' ? selectedYear : undefined,
        month: selectedMonth !== 'all' ? selectedMonth : undefined,
        date: selectedDate || undefined,
        editionType: selectedType !== 'all' ? selectedType : undefined,
        districtId: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        search: searchQuery.trim() || undefined,
        page: currentPage,
        limit: pageSize,
      });

      const list = Array.isArray(res) ? res : (res?.editions || res?.items || []);
      const total = res?.total ?? list.length;
      const pagesCount = res?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

      setEditions(list);
      setTotalEditions(total);
      setTotalPages(pagesCount);
    } catch (err) {
      console.warn('Archive query failed:', err);
      setEditions([]);
      setTotalEditions(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedDate, selectedType, selectedDistrict, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    fetchArchiveData();
  }, [fetchArchiveData]);

  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDate('');
    setSelectedType('all');
    setSelectedDistrict('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formatHindiDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const monthsHi = [
        'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
      ];
      return `${date.getDate()} ${monthsHi[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 select-none pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-2xs sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackClick}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="मुख्य पृष्ठ पर वापस जाएं"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-[#344FD6]" />
                डिजिटल ई-पेपर अभिलेखागार (Historical Digital Archive)
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                विगत वर्षों एवं महीनों के समस्त प्रकाशित ई-पेपर अंकों का आधिकारिक संग्रह
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            कुल प्रकाशित अंक: <span className="text-[#344FD6] font-black">{totalEditions}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Filter Controls Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Filter className="w-4 h-4 text-[#ED1727]" />
              अंक फ़िल्टर व खोज (Filters & Search)
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-500 hover:text-[#ED1727] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>फ़िल्टर रीसेट</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Year Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">वर्ष (Year):</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#344FD6] cursor-pointer"
              >
                <option value="all">समस्त वर्ष (All)</option>
                {AVAILABLE_YEARS.filter((y) => y !== 'all').map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* 2. Month Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">माह (Month):</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#344FD6] cursor-pointer"
              >
                {HINDI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* 3. Specific Date Picker */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">निश्चित तिथि (Date):</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#344FD6] cursor-pointer"
              />
            </div>

            {/* 4. Edition Type Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">प्रकार (Type):</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#344FD6] cursor-pointer"
              >
                <option value="all">समस्त प्रकार (All)</option>
                <option value="DAILY">दैनिक संस्करण (Daily, 12P)</option>
                <option value="SPECIAL">विशेष परिशिष्ट (Special)</option>
              </select>
            </div>

            {/* 5. District Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">जिला (District):</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#344FD6] cursor-pointer"
              >
                <option value="all">समस्त मध्य प्रदेश</option>
                {DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.nameHi}</option>
                ))}
              </select>
            </div>

            {/* 6. Keyword Search */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">शीर्षक/कोड खोज:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="उदा. भोपाल..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-2 outline-none focus:border-[#344FD6]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 text-[#344FD6] animate-spin mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">अभिलेखागार खोज जारी है...</h3>
            <p className="text-xs text-slate-500 mt-1">प्रकाशित संस्करण प्राप्त किए जा रहे हैं</p>
          </div>
        ) : editions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800">
              कोई प्रकाशित ई-पेपर अंक नहीं मिला
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              चयनित फिल्टर (वर्ष, माह, तिथि अथवा जिला) के अनुरूप कोई प्रकाशित संस्करण उपलब्ध नहीं है। कृपया फ़िल्टर बदलकर पुनः प्रयास करें।
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#344FD6] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>समस्त फ़िल्टर हटाएं</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Editions Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {editions.map((edition) => (
                <div
                  key={edition.id}
                  onClick={() => onOpenReader(edition.id, 1)}
                  className="group bg-white rounded-xl border border-slate-200 hover:border-[#344FD6] shadow-xs hover:shadow-md transition-all p-3.5 flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        edition.editionType === 'SPECIAL'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-50 text-[#344FD6] border border-blue-200'
                      }`}>
                        {edition.districtName || 'मध्य प्रदेश'} {edition.editionType === 'SPECIAL' ? 'विशेषांक' : 'संस्करण'}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {formatHindiDate(edition.publicationDate)}
                      </span>
                    </div>

                    {/* Cover Preview Frame */}
                    <div className="aspect-[1/1.4] bg-slate-100 rounded-lg p-2.5 border border-slate-200 flex flex-col justify-between text-center relative overflow-hidden group-hover:bg-slate-50">
                      <div className="border-b border-slate-300 pb-1">
                        <span className="text-[8px] font-black text-[#ED1727] block">
                          ब्रेकिंग न्यूज़ वाला
                        </span>
                        <span className="text-[7px] text-slate-500 font-bold block">
                          {edition.editionCode || 'EP-ARCHIVE'}
                        </span>
                      </div>

                      <div className="my-auto px-1">
                        <span className="text-[10px] font-black text-slate-900 line-clamp-2 leading-tight">
                          {edition.title}
                        </span>
                      </div>

                      <div className="border-t border-slate-200 pt-1 text-[8px] font-bold text-slate-500 flex items-center justify-between">
                        <span>{edition.editionType === 'SPECIAL' ? (edition.totalPages || 4) : 12} पृष्ठ</span>
                        <span className="text-blue-700 font-bold">ब्रोडशीट</span>
                      </div>

                      <div className="absolute inset-0 bg-[#344FD6]/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <BookOpen className="w-6 h-6 mb-1" />
                        <span className="text-xs font-bold">अख़बार पढ़ें</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#344FD6] line-clamp-2 transition-colors">
                      {edition.title}
                    </h4>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {edition.editionType === 'SPECIAL' ? (edition.totalPages || 4) : 12} पृष्ठ
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReader(edition.id, 1);
                      }}
                      className="px-2.5 py-1 bg-[#344FD6] hover:bg-blue-800 text-white text-[11px] font-bold rounded shadow-2xs transition-colors"
                    >
                      पढ़ें
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 font-medium">
                  पृष्ठ {currentPage} / {totalPages} (कुल {totalEditions} प्रकाशित अंक)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>पिछला</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                        if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${
                            currentPage === pageNum
                              ? 'bg-[#344FD6] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>अगला</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
