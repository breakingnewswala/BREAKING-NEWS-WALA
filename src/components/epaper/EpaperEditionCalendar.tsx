import React, { useState } from 'react';
import { EpaperEditionDoc } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  BookOpen,
} from 'lucide-react';

export interface EpaperEditionCalendarProps {
  editions: EpaperEditionDoc[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenNewsDesk: (edition: EpaperEditionDoc) => void;
}

export const EpaperEditionCalendar: React.FC<EpaperEditionCalendarProps> = ({
  editions,
  selectedDate,
  onSelectDate,
  onOpenNewsDesk,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNameHi = new Intl.DateTimeFormat('hi-IN', { month: 'long', year: 'numeric' }).format(currentMonth);

  // Generate calendar days
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells (shift Sunday to end or standard 0=Sun)
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dayNumber: d, dateStr });
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(today.toISOString().split('T')[0]);
  };

  // Group editions by publicationDate
  const editionsByDate = new Map<string, EpaperEditionDoc[]>();
  for (const ed of editions) {
    if (!ed.publicationDate) continue;
    const existing = editionsByDate.get(ed.publicationDate) || [];
    existing.push(ed);
    editionsByDate.set(ed.publicationDate, existing);
  }

  const selectedDateEditions = editionsByDate.get(selectedDate) || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900 capitalize">{monthNameHi}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            आज (Today)
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              title="पिछला माह"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              title="अगला माह"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
        <div>रवि (Sun)</div>
        <div>सोम (Mon)</div>
        <div>मंगल (Tue)</div>
        <div>बुध (Wed)</div>
        <div>गुरु (Thu)</div>
        <div>शुक्र (Fri)</div>
        <div>शनि (Sat)</div>
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-24 bg-slate-50/50 rounded-xl" />;
          }

          const isSelected = cell.dateStr === selectedDate;
          const dayEditions = editionsByDate.get(cell.dateStr) || [];
          const hasEditions = dayEditions.length > 0;

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`h-24 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100'
                  : hasEditions
                  ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                  : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isSelected ? 'text-blue-700' : hasEditions ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {cell.dayNumber}
                </span>
                {hasEditions && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                )}
              </div>

              {/* Mini Edition Chips */}
              <div className="space-y-1 overflow-hidden">
                {dayEditions.slice(0, 2).map((ed) => (
                  <div
                    key={ed.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNewsDesk(ed);
                    }}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate font-sans cursor-pointer ${
                      ed.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ed.status === 'APPROVED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                    title={`${ed.title} (${ed.status})`}
                  >
                    {ed.title}
                  </div>
                ))}
                {dayEditions.length > 2 && (
                  <span className="text-[9px] text-slate-400 font-bold block">
                    +{dayEditions.length - 2} अन्य
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Drawer */}
      <div className="pt-4 border-t border-slate-100">
        <div className="text-xs font-bold text-slate-700 mb-2">
          चयनित तिथि पर निर्धारित संस्करण ({selectedDate}):
        </div>
        {selectedDateEditions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">इस तिथि पर कोई ई-पेपर संस्करण निर्धारित नहीं है।</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDateEditions.map((ed) => (
              <div
                key={ed.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{ed.title}</div>
                  <div className="text-[11px] text-slate-500">
                    स्थिति: <span className="font-semibold">{ed.status}</span> • कुल {ed.totalPages || 12} पृष्ठ
                  </div>
                </div>
                <button
                  onClick={() => onOpenNewsDesk(ed)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>संपादकीय चयन</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
