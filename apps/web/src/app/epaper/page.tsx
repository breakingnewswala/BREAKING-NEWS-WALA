/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Public Digital E-Paper Portal & Interactive Reader
 * Task ID: BNW-MASTER-008
 * Grounded in docs/02-Features.md (FEAT-PUB-014), docs/08-Sitemap.md (/epaper),
 * docs/12-Database.md (DOM-T), and docs/06-Business-Rules.md (RULE-PUB-001).
 */

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { fetchPublicEpaperEditions } from '../../lib/api';
import { PublicEpaperEdition } from '../../lib/types';
import { MP_DIVISIONS_AND_DISTRICTS } from '../../lib/constants';

export const revalidate = 60; // ISR every 60 seconds

export const metadata: Metadata = {
  title: 'दैनिक डिजिटल ई-पेपर (E-Paper) | ब्रेकिंग न्यूज़ वाला',
  description: 'मध्य प्रदेश के 55 जिलों का दैनिक डिजिटल ई-पेपर संस्करण। घर बैठे पढ़ें अपने शहर की ताज़ा खबरें।',
  alternates: {
    canonical: 'https://breakingnewswala.in/epaper',
  },
  openGraph: {
    title: 'दैनिक डिजिटल ई-पेपर (E-Paper) | ब्रेकिंग न्यूज़ वाला',
    description: 'मध्य प्रदेश के 55 जिलों का दैनिक डिजिटल ई-पेपर संस्करण।',
    url: 'https://breakingnewswala.in/epaper',
    siteName: 'BREAKING NEWS WALA',
    locale: 'hi_IN',
    type: 'website',
  },
};

interface EpaperPageProps {
  searchParams?: Promise<{
    date?: string;
    districtId?: string;
  }>;
}

export default async function EpaperPage({ searchParams }: EpaperPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const selectedDate = resolvedParams.date || new Date().toISOString().split('T')[0];
  const selectedDistrict = resolvedParams.districtId || '';

  const { editions } = await fetchPublicEpaperEditions({
    date: selectedDate,
    districtId: selectedDistrict || undefined,
    limit: 18,
  });

  return (
    <main className="site-container py-6">
      {/* 1. Masthead & Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-xl p-6 sm:p-8 mb-8 border border-gray-700 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FDE900] text-black text-xs font-bold px-2.5 py-1 rounded-full uppercase mb-2">
              <span>📰</span> डिजिटल संस्करण
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              दैनिक डिजिटल ई-पेपर आर्काइव (Digital E-Paper)
            </h1>
            <p className="text-gray-300 text-sm mt-1">
              मध्य प्रदेश के 55 जिलों का प्रामाणिक, प्रिंट-लेआउट डिजिटल समाचार पत्र
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              प्रकाशन तिथि: <strong className="text-white">{selectedDate}</strong>
            </span>
          </div>
        </div>

        {/* Filters: Date & District Selector */}
        <form method="GET" className="mt-6 pt-4 border-t border-gray-700 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="epaper-date" className="text-xs text-gray-300 font-medium">
              तिथि चुनें:
            </label>
            <input
              id="epaper-date"
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="epaper-district" className="text-xs text-gray-300 font-medium">
              जिला चुनें:
            </label>
            <select
              id="epaper-district"
              name="districtId"
              defaultValue={selectedDistrict}
              className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            >
              <option value="">सभी 55 जिले (राज्यव्यापी)</option>
              {(MP_DIVISIONS_AND_DISTRICTS as any[]).flatMap((div) => div.districts).map((d: any) => (
                <option key={d.slug || d.nameHi} value={d.slug}>
                  {d.nameHi}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-[#FDE900] text-black text-xs font-bold px-4 py-1.5 rounded hover:bg-yellow-400 transition-colors"
          >
            खोजें
          </button>
        </form>
      </div>

      {/* 2. Editions Grid */}
      {editions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {editions.map((edition: PublicEpaperEdition) => (
            <article
              key={edition.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative bg-gray-100 aspect-[3/4] flex items-center justify-center p-4 border-b border-gray-200">
                <div className="text-center">
                  <span className="text-4xl">📰</span>
                  <div className="mt-2 text-xs font-bold text-gray-700">{edition.title}</div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {edition.editionDate} • {edition.pageCount} पृष्ठ
                  </div>
                  <span className="inline-block mt-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    PDF संस्करण
                  </span>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                    {edition.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>📍 {edition.districtId ? 'जिला संस्करण' : 'राज्य मुख्य संस्करण'}</span>
                    <span>•</span>
                    <span>{(edition.pdfFileSize / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <a
                    href={edition.pdfAssetUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-gray-900 text-white hover:bg-black font-semibold text-xs py-2 px-3 rounded-lg transition-colors"
                  >
                    ई-पेपर पढ़ें
                  </a>
                  {edition.pdfAssetUrl && (
                    <a
                      href={edition.pdfAssetUrl}
                      download
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold text-xs py-2 px-3 rounded-lg transition-colors"
                      title="PDF डाउनलोड करें"
                    >
                      📥
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center my-8">
          <span className="text-5xl">📰</span>
          <h2 className="text-xl font-bold text-gray-800 mt-4">
            चयनित तिथि या जिले के लिए ई-पेपर संस्करण उपलब्ध नहीं है
          </h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            कृपया अन्य प्रकाशन तिथि चुनें या मुख्य राज्यव्यापी संस्करण देखें।
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/epaper"
              className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-black transition-colors"
            >
              आज का ई-पेपर देखें
            </Link>
          </div>
        </div>
      )}

      {/* 3. Statutory Reader Entitlement & Privacy Note */}
      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 flex items-center justify-between flex-wrap gap-2">
        <span>
          ★ <strong>सत्यनिष्ठ डिजिटल ई-पेपर:</strong> केवल संपादकीय डेस्क द्वारा विधिवत अनुमोदित व प्रकाशित संस्करण ही सार्वजनिक पठन के लिए उपलब्ध कराए जाते हैं।
        </span>
        <span className="text-gray-400">DEC-070 • कॉपीराइट © 2026 ब्रेकिंग न्यूज़ वाला</span>
      </div>
    </main>
  );
}
