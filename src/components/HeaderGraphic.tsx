import React from 'react';

interface HeaderGraphicProps {
  customHeaderPng?: string;
  brandTagline?: string;
  brandName?: string;
  customLogoUrl?: string;
}

export const HeaderGraphic: React.FC<HeaderGraphicProps> = ({
  customHeaderPng,
  brandTagline = 'भारत के जिलों से आपके दिलों तक',
  brandName = 'ब्रेकिंग न्यूज़ वाला',
  customLogoUrl,
}) => {
  // If user uploaded a custom header PNG, render it directly
  if (customHeaderPng) {
    return (
      <div className="absolute top-0 inset-x-0 z-20 pointer-events-none select-none">
        <img
          src={customHeaderPng}
          alt="News Card Header"
          className="w-full h-auto object-contain object-top drop-shadow-md block"
        />
      </div>
    );
  }

  // Split brand name into two visual parts if space exists, otherwise use single line
  const nameParts = brandName.trim().split(/\s+/);
  const firstWord = nameParts[0] || 'ब्रेकिंग';
  const restWords = nameParts.slice(1).join(' ') || (nameParts.length === 1 ? '' : 'न्यूज़वाला');

  // Exact vector reproduction of IMAGE NEWS.png (Logo on Left, Signature Curves on Right)
  return (
    <div className="absolute top-0 inset-x-0 z-20 pointer-events-none select-none flex items-start justify-between">
      {/* 1. Left: Official Brand / Channel Logo Box */}
      <div className="pt-3.5 pl-3.5 sm:pt-4 sm:pl-4">
        <div className="bg-[#FFE600] border-2 border-[#D91A2A] rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-xl flex items-center gap-2 sm:gap-2.5 max-w-[240px] sm:max-w-[280px] pointer-events-auto">
          {/* Custom Logo Image OR Blue Globe Icon */}
          {customLogoUrl ? (
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white border-2 border-yellow-300 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
              <img
                src={customLogoUrl}
                alt="Channel Logo"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-blue-900 via-blue-700 to-blue-500 border-2 border-yellow-300 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
              <div className="absolute top-1 left-1.5 w-3.5 h-2.5 bg-yellow-400/90 rounded-full blur-[0.2px]" />
              <div className="absolute bottom-1 right-2 w-3.5 h-2.5 bg-yellow-400/90 rounded-full blur-[0.2px]" />
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
          )}

          {/* Text: Brand Name + Tagline */}
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1">
              <span className="text-[#DC2626] font-black text-base sm:text-lg tracking-tight font-['Mukta']">
                {firstWord}
              </span>
              {restWords && (
                <span className="text-[#DC2626] font-extrabold text-xs sm:text-sm font-['Mukta']">
                  {restWords}
                </span>
              )}
            </div>
            {brandTagline && (
              <div className="bg-black text-white text-[8px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded tracking-tight mt-1 whitespace-nowrap font-['Noto_Sans_Devanagari']">
                {brandTagline}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Right: Signature Curved Stripes (Black, Yellow, Red) cascading down from top-right */}
      <div className="shrink-0">
        <svg
          width="130"
          height="155"
          viewBox="0 0 130 155"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-24 sm:w-32 h-auto"
        >
          {/* Black background curve */}
          <path
            d="M130 0H20C65 24 115 65 130 155V0Z"
            fill="#050505"
          />
          {/* Yellow curve */}
          <path
            d="M130 0H38C75 22 118 60 130 135V0Z"
            fill="#FFDD00"
          />
          {/* Red curve */}
          <path
            d="M130 0H56C90 20 120 54 130 110V0Z"
            fill="#E50914"
          />
        </svg>
      </div>
    </div>
  );
};
