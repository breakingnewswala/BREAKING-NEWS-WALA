import React, { useState } from 'react';
import {
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calendar,
  Layers,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { EpaperEdition } from '../types';

interface EpaperScreenProps {
  editions: EpaperEdition[];
  onBackClick: () => void;
}

export const EpaperScreen: React.FC<EpaperScreenProps> = ({ editions, onBackClick }) => {
  const [selectedEditionId, setSelectedEditionId] = useState<string>(editions[0]?.id || '');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const selectedEdition = editions.find((e) => e.id === selectedEditionId) || editions[0];
  const currentPage = selectedEdition?.pages[currentPageIndex] || selectedEdition?.pages[0];

  const handleDownloadPdf = () => {
    if (!selectedEdition) return;
    setDownloadSuccessToast(
      `'${selectedEdition.title}' (PDF संस्करण - ${selectedEdition.totalPages} पृष्ठ) डाउनलोड हो रहा है...`
    );
    setTimeout(() => {
      setDownloadSuccessToast(null);
    }, 3500);
  };

  const handleShareEdition = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedEdition.title,
        text: `ब्रेकिंग न्यूज़ वाला - दैनिक डिजिटल ई-पेपर (${selectedEdition.districtName} संस्करण):`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setDownloadSuccessToast('ई-पेपर लिंक क्लिपबोर्ड पर कॉपी हो गया!');
      setTimeout(() => setDownloadSuccessToast(null), 2500);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-24">
      {/* Top Controls Bar */}
      <div className="bg-white border-b border-slate-200 px-3 py-2.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-600" />
              दैनिक डिजिटल ई-पेपर (E-Paper)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              {selectedEdition?.editionDate} • {selectedEdition?.districtName}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF डाउनलोड</span>
            </button>
            <button
              onClick={handleShareEdition}
              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="शेयर करें"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* District Editions Selector Bar */}
      <div className="bg-white border-b border-slate-200 px-3 py-2">
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-500 shrink-0">संपादकीय संस्करण:</span>
          {editions.map((edition) => {
            const isSelected = edition.id === selectedEdition?.id;
            return (
              <button
                key={edition.id}
                onClick={() => {
                  setSelectedEditionId(edition.id);
                  setCurrentPageIndex(0);
                  setZoomLevel(100);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#344FD6] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {edition.districtName} संस्करण
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {downloadSuccessToast && (
        <div className="max-w-md mx-auto my-2 px-3">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessToast}</span>
          </div>
        </div>
      )}

      {/* Main E-Paper Viewer Container */}
      <div className="max-w-4xl mx-auto px-3 py-3">
        {selectedEdition && currentPage && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Viewer Toolbar */}
            <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between text-xs">
              <span className="font-bold truncate max-w-[200px] md:max-w-none">
                पृष्ठ {currentPage.pageNumber} / {selectedEdition.totalPages}: {currentPage.title}
              </span>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-800 rounded px-1 py-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="ज़ूम कम करें"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="ज़ूम बढ़ाएं"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white ml-1 border-l border-slate-700 pl-1"
                  title="रीसेट"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulated Newspaper Broad-sheet Page */}
            <div className="relative overflow-auto p-4 flex justify-center bg-slate-200 min-h-[480px]">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="transition-transform duration-150 bg-white shadow-xl rounded border border-slate-300 max-w-xl w-full"
              >
                {/* Authentic Epaper Masthead on Page 1 */}
                <div className="border-b-2 border-slate-900 p-3 bg-amber-50/40">
                  <div className="flex items-center justify-between border-b border-slate-400 pb-1 text-[10px] font-bold text-slate-700 uppercase">
                    <span>वर्ष 10 • अंक 308</span>
                    <span>{selectedEdition.districtName} • {selectedEdition.editionDate}</span>
                    <span>कुल पृष्ठ: {selectedEdition.totalPages} • मूल्य: निःशुल्क डिजिटल</span>
                  </div>
                  <div className="text-center my-2">
                    <h1 className="text-2xl md:text-3xl font-black text-red-600 font-serif tracking-wide">
                      ब्रेकिंग न्यूज़ वाला
                    </h1>
                    <p className="text-[10px] font-bold text-slate-600 tracking-wider">
                      मध्य प्रदेश का सबसे विश्वसनीय डिजिटल समाचार पत्र
                    </p>
                  </div>
                  <div className="h-[2px] bg-red-600 w-full" />
                </div>

                {/* Simulated Newspaper Grid Page Layout */}
                <div className="p-3">
                  <div className="bg-red-50 border border-red-200 p-2 rounded mb-3">
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                      पेज {currentPage.pageNumber} • प्रमुख समाचार
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug mt-0.5">
                      {currentPage.title}
                    </h3>
                  </div>

                  <img
                    src={currentPage.imageUrl}
                    alt={currentPage.title}
                    className="w-full h-64 object-cover rounded border border-slate-200"
                  />

                  {/* Multi-column Mock Newspaper Typography */}
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-slate-700 leading-relaxed text-justify">
                    <p>
                      <strong>{selectedEdition.districtName}।</strong> आज की विशेष रिपोर्ट में शासन द्वारा जिले में क्रियान्वित की जा रही लोककल्याणकारी योजनाओं, कृषि मंडी में आवक और विकास कार्यों की व्यापक समीक्षा की गई है। प्रशासनिक स्तर पर सभी विभागों को जनसुनवाई में प्राप्त आवेदनों के 7 दिनों के भीतर निराकरण के कड़े निर्देश जारी किए गए हैं।
                    </p>
                    <p>
                      शिक्षा एवं स्वास्थ्य सेवाओं के सुदृढ़ीकरण हेतु नवीन बजट आवंटन को मंजूरी मिल गई है। जिले के ग्रामीण अंचलों में मोबाइल मेडिकल यूनिट्स की तैनाती सुनिश्चित की जाएगी। पाठकों के लिए ई-पेपर का यह अंक विशेष विश्लेषणात्मक सामग्री से परिपूर्ण है।
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Page Navigation Controls */}
            <div className="bg-white border-t border-slate-200 p-3 flex items-center justify-between">
              <button
                onClick={() => setCurrentPageIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentPageIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ED1727] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>पिछला पेज</span>
              </button>

              <span className="text-xs font-bold text-slate-700">
                पेज {currentPageIndex + 1} / {selectedEdition.totalPages}
              </span>

              <button
                onClick={() => setCurrentPageIndex((idx) => Math.min(selectedEdition.totalPages - 1, idx + 1))}
                disabled={currentPageIndex >= selectedEdition.totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ED1727] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                <span>अगला पेज</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Thumbnail Page Strip */}
        {selectedEdition && (
          <div className="mt-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              सभी पृष्ठों का त्वरित दृश्य (Jump to Page):
            </h4>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {selectedEdition.pages.map((p, idx) => (
                <button
                  key={p.pageNumber}
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`shrink-0 text-center rounded border transition-all ${
                    currentPageIndex === idx
                      ? 'border-red-600 ring-2 ring-red-500/30'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={p.imageUrl}
                    alt={`Page ${p.pageNumber}`}
                    className="w-16 h-20 object-cover rounded-t"
                  />
                  <span
                    className={`block text-[10px] py-0.5 ${
                      currentPageIndex === idx ? 'bg-red-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    पेज {p.pageNumber}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
