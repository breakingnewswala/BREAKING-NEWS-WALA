import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, Award } from 'lucide-react';
import { UserRole } from '../../types/index.ts';

interface FooterProps {
  onRoleChange: (role: UserRole) => void;
  onSelectCategory: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onRoleChange, onSelectCategory }) => {
  return (
    <footer className="bg-gray-950 text-gray-400 text-xs sm:text-sm mt-12 border-t-4 border-red-600">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <img 
              src="/public/assets/aistudio/LOGO_88407b32.png" 
              alt="BREAKING NEWS WALA" 
              className="h-14 object-contain brightness-105"
            />
            <p className="text-gray-300 font-semibold text-xs leading-relaxed">
              भारत के जिलों से, आपके दिलों तक - डिजिटल पत्रकारिता और जिलास्तरीय रिपोर्टिंग का सबसे विश्वसनीय राष्ट्रीय मंच।
            </p>
            <div className="pt-2 flex flex-col gap-1.5 text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                मुख्य न्यूज़रूम: भोपाल एवं निवाड़ी, मध्य प्रदेश
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                breakingnewswala.com@gmail.com
              </span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 border-b border-gray-800 pb-1.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              प्रमुख श्रेणियां
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {['टॉप न्यूज़', 'मध्य प्रदेश', 'राजनीति', 'बिजनेस', 'खेल', 'मनोरंजन', 'शिक्षा', 'टेक्नोलॉजी', 'क्राइम', 'धर्म एवं अध्यात्म'].map((cat, i) => (
                <button
                  key={i}
                  onClick={() => onSelectCategory(cat)}
                  className="text-left text-gray-400 hover:text-amber-400 transition py-0.5"
                >
                  • {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Editorial Governance & IT Rules */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 border-b border-gray-800 pb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              संपादकीय आचार संहिता
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>• सूचना प्रौद्योगिकी नियम (IT Rules 2021) अनुपालन</li>
              <li>• त्रिस्तरीय तथ्य-सत्यापन एवं संपादकीय समीक्षा</li>
              <li>• शिकायत निवारण अधिकारी (Grievance Redressal)</li>
              <li>• फेक न्यूज़ एवं भ्रामक सूचनाओं के विरुद्ध शून्य सहनशीलता</li>
              <li>• कॉपीराइट एवं स्रोत साभार नीति</li>
            </ul>
          </div>

          {/* Newsroom Portals */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 border-b border-gray-800 pb-1.5">
              न्यूज़रूम कार्यक्षेत्र
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => onRoleChange('reporter')}
                className="w-full text-left bg-gray-900 hover:bg-gray-800 text-yellow-300 p-2.5 rounded border border-gray-800 text-xs font-semibold transition"
              >
                📝 रिपोर्टर लॉगिन एवं डिजिटल डेस्क
                <div className="text-[10px] text-gray-400 mt-0.5">कच्ची स्क्रिप्ट से खबर व ग्राफिक्स तैयार करें</div>
              </button>
              <button
                onClick={() => onRoleChange('admin')}
                className="w-full text-left bg-gray-900 hover:bg-gray-800 text-red-400 p-2.5 rounded border border-gray-800 text-xs font-semibold transition"
              >
                🛡️ केंद्रीय एडमिन व न्यूज़रूम कंट्रोल
                <div className="text-[10px] text-gray-400 mt-0.5">संपादकीय स्वीकृति, RSS व AI API Pool प्रबंधन</div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div>
            © {new Date().getFullYear()} BREAKING NEWS WALA. सर्वाधिकार सुरक्षित।
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="hover:text-white cursor-pointer">नियम व शर्तें</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">गोपनीयता नीति</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">अस्वीकरण</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">संपर्क करें</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
