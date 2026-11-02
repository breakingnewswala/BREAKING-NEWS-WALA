/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Territory & District Selection Modal (COMP-GLO-007)
 * Grounded in docs/07-Design.md Section 9.1 and docs/08-Sitemap.md Section 12
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MP_DIVISIONS_AND_DISTRICTS, PRIORITY_DISTRICT_HUBS } from '../lib/constants';

interface DistrictSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDistrictSlug?: string;
}

export const DistrictSelectorModal: React.FC<DistrictSelectorModalProps> = ({
  isOpen,
  onClose,
  currentDistrictSlug,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const normalizedQuery = searchTerm.trim().toLowerCase();

  const filteredDivisions = MP_DIVISIONS_AND_DISTRICTS.map((div) => {
    const matchingDistricts = div.districts.filter(
      (d) =>
        d.nameHi.includes(normalizedQuery) ||
        d.slug.toLowerCase().includes(normalizedQuery) ||
        div.divisionNameHi.includes(normalizedQuery)
    );
    return {
      ...div,
      districts: matchingDistricts,
    };
  }).filter((div) => div.districts.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="district-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 id="district-modal-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📍</span> अपना जिला चुनें (मध्य प्रदेश के 55 जिले)
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              अपने क्षेत्र की ताज़ा खबरें सीधे अपने स्क्रीन पर पाएं
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-black p-1.5 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="डायलॉग बंद करें"
          >
            ✕
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 जिला या संभाग का नाम खोजें (उदा. निवाड़ी, भोपाल, इंदौर)..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#344FD6]"
            autoFocus
          />

          {/* Quick Hub Pills */}
          <div className="flex flex-wrap gap-1.5 mt-3 items-center">
            <span className="text-xs font-semibold text-gray-500 mr-1">प्रमुख केंद्र:</span>
            {PRIORITY_DISTRICT_HUBS.map((hub) => (
              <Link
                key={hub.slug}
                href={`/district/${hub.slug}`}
                onClick={onClose}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  currentDistrictSlug === hub.slug
                    ? 'bg-[#ED1727] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-[#344FD6]'
                }`}
              >
                {hub.nameHi}
              </Link>
            ))}
          </div>
        </div>

        {/* Divisions & Districts Listing */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {filteredDivisions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-base font-semibold">कोई जिला नहीं मिला</p>
              <p className="text-xs mt-1">कृपया जिले का नाम सही से लिखें</p>
            </div>
          ) : (
            filteredDivisions.map((div) => (
              <div key={div.divisionSlug} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>{div.divisionNameHi}</span>
                  <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                    {div.districts.length} जिले
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {div.districts.map((d) => {
                    const isSelected = currentDistrictSlug === d.slug;
                    return (
                      <Link
                        key={d.slug}
                        href={`/district/${d.slug}`}
                        onClick={onClose}
                        className={`p-2 text-sm font-medium rounded-md transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#344FD6] text-white font-bold'
                            : 'bg-white text-gray-800 hover:bg-blue-50 hover:text-[#344FD6] border border-gray-200'
                        }`}
                      >
                        <span>{d.nameHi}</span>
                        {(d as any).isPriorityHub && (
                          <span className={`text-[10px] px-1 py-0.5 rounded ${isSelected ? 'bg-blue-800 text-white' : 'bg-red-100 text-[#ED1727]'}`}>
                            मुख्य
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t bg-gray-50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};

