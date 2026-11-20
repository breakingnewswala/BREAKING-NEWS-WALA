import React from 'react';
import { EpaperEditionDoc } from '../../types';
import {
  Calendar,
  MapPin,
  Eye,
  Edit3,
  Trash2,
  Layers,
  BookOpen,
  Newspaper,
  Plus,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { EpaperStatusPipeline } from './EpaperStatusPipeline';

export interface EpaperEditionGridProps {
  editions: EpaperEditionDoc[];
  onOpenNewsDesk: (edition: EpaperEditionDoc) => void;
  onOpenDesigner?: (editionId: string, pageNumber: number) => void;
  onOpenQualityChecker?: (edition: EpaperEditionDoc) => void;
  onDeleteEdition?: (editionId: string) => void;
  onStatusChange?: (edition: EpaperEditionDoc, nextStatus: any) => void;
  onCreateNew?: () => void;
  currentRole?: string;
  loading?: boolean;
}

export const EpaperEditionGrid: React.FC<EpaperEditionGridProps> = ({
  editions,
  onOpenNewsDesk,
  onOpenDesigner,
  onOpenQualityChecker,
  onDeleteEdition,
  onStatusChange,
  onCreateNew,
  currentRole = 'EDITOR',
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
        ))}
      </div>
    );
  }

  if (editions.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4 shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Newspaper className="w-7 h-7" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-800">कोई ई-पेपर संस्करण नहीं मिला</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            चयनित तिथि अथवा फ़िल्टर के अनुसार कोई संस्करण उपलब्ध नहीं है। नया दैनिक अथवा विशेष ब्रॉडशीट संस्करण आरंभ करें।
          </p>
        </div>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ नया संस्करण बनाएं</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {editions.map((edition) => {
        const isPublished = edition.status === 'PUBLISHED';
        const pagesCount = edition.totalPages || edition.pages?.length || 12;

        return (
          <div
            key={edition.id}
            className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex flex-col group"
          >
            {/* Top Preview Banner */}
            <div className="h-36 bg-gradient-to-br from-slate-900 to-slate-800 relative p-4 flex flex-col justify-between text-white overflow-hidden">
              {/* Subtle newspaper paper texture effect */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white uppercase font-bold tracking-wider">
                  {edition.editionCode || 'EP-DAILY'}
                </span>
                <EpaperStatusPipeline
                  edition={edition}
                  currentRole={currentRole}
                  onStatusChange={(nextStatus, remarks) => {
                    if (onStatusChange) onStatusChange(edition, nextStatus);
                  }}
                  isCompact={true}
                />
              </div>

              <div className="relative z-10">
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                  {edition.editionType === 'SPECIAL' ? '⭐ विशेष परिशिष्ट' : '📰 दैनिक ब्रॉडशीट (32.9 × 52 सेमी)'}
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-blue-200 transition-colors">
                  {edition.title}
                </h4>
              </div>
            </div>

            {/* Edition Details Card Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>प्रकाशन तिथि:</span>
                  </span>
                  <span className="font-semibold text-slate-800 font-sans">
                    {edition.publicationDate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>क्षेत्र / जिला:</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {edition.districtName || 'भोपाल'} ({edition.divisionName || 'भोपाल संभाग'})
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>कुल पृष्ठ:</span>
                  </span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {pagesCount} पृष्ठ
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenNewsDesk(edition)}
                  className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                    edition.status === 'DRAFT'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                  title={edition.status === 'DRAFT' ? 'प्रारूप संपादन जारी रखें' : 'समाचार चयन व पृष्ठ विन्यास देखें'}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{edition.status === 'DRAFT' ? 'संपादन जारी रखें (Continue Editing)' : 'समाचार चयन डेस्क'}</span>
                </button>

                {onOpenDesigner && (
                  <button
                    onClick={() => onOpenDesigner(edition.id, 1)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                    title="ई-पेपर डिज़ाइन स्टूडियो खोलें"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </button>
                )}

                {onOpenQualityChecker && (
                  <button
                    onClick={() => onOpenQualityChecker(edition)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="गुणवत्ता परीक्षक एवं प्रकाशन द्वार (Quality Checker & Publish)"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </button>
                )}

                {onDeleteEdition && !isPublished && (
                  <button
                    onClick={() => {
                      if (window.confirm(`क्या आप संस्करण "${edition.title}" को निश्चित रूप से हटाना चाहते हैं?`)) {
                        onDeleteEdition(edition.id);
                      }
                    }}
                    className="p-2 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="संस्करण हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
