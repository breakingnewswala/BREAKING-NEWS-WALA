/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Footer Component (COMP-GLO-005)
 * Grounded in docs/07-Design.md Section 9.1 and docs/09-Components.md Section 4.5
 */

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { CANONICAL_CATEGORIES, SITE_CONFIG } from '../lib/constants';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-container">
        {/* Top 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-gray-800">
          {/* Col 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="footer-emblem" showTagline={false} />
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              <strong>ब्रेकिंग न्यूज़ वाला</strong> — मध्य प्रदेश का अग्रणी, निष्पक्ष एवं तीव्रतम हाइपरलोकल डिजिटल समाचार नेटवर्क। भारत के 55 जिलों की धड़कन सीधे आपके स्क्रीन तक।
            </p>
            <div className="text-xs text-yellow-400 font-semibold">
              ★ निष्पक्ष • निर्भीक • सटीक • जनहितैषी
            </div>
            <div className="pt-2 text-xs text-gray-500">
              मान्यता प्राप्त डिजिटल पब्लिशर | सूचना एवं प्रौद्योगिकी नियम (IT Rules, 2021) के अनुरूप संचालित।
            </div>
          </div>

          {/* Col 2: Top News Categories */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#ED1727] pl-2">
              प्रमुख श्रेणियां
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {CANONICAL_CATEGORIES.slice(0, 7).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className="hover:text-white transition-colors">
                    {cat.nameHi}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: More Categories */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#344FD6] pl-2">
              अन्य विषय
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {CANONICAL_CATEGORIES.slice(7, 14).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className="hover:text-white transition-colors">
                    {cat.nameHi}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Statutory Compliance & Grievance Redressal (IT Rules 2021) */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#FDE900] pl-2 text-yellow-400">
              शिकायत निवारण अधिकारी
            </h3>
            <div className="space-y-2 text-xs text-gray-400 leading-normal">
              <p className="font-semibold text-gray-200">
                {SITE_CONFIG.grievanceOfficer.name}
              </p>
              <p className="text-gray-400">
                {SITE_CONFIG.grievanceOfficer.designation}
              </p>
              <p>
                ईमेल:{' '}
                <a
                  href={`mailto:${SITE_CONFIG.grievanceOfficer.email}`}
                  className="text-blue-400 hover:underline"
                >
                  {SITE_CONFIG.grievanceOfficer.email}
                </a>
              </p>
              <p className="pt-2 text-gray-500">
                {SITE_CONFIG.grievanceOfficer.address}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>
            © {currentYear} BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला). सर्वाधिकार सुरक्षित।
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/about-us" className="hover:text-gray-300">
              हमारे बारे में
            </Link>
            <Link href="/contact-us" className="hover:text-gray-300">
              संपर्क करें
            </Link>
            <Link href="/privacy-policy" className="hover:text-gray-300">
              गोपनीयता नीति (DPDP Act)
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-gray-300">
              नियम एवं शर्तें
            </Link>
            <Link href="/editorial-policy" className="hover:text-gray-300">
              संपादकीय आचार संहिता
            </Link>
            <Link href="/advertisement-disclosure" className="hover:text-gray-300">
              विज्ञापन नीति (ASCI)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

