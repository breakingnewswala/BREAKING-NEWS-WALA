import React from 'react';

interface FooterGraphicProps {
  socialHandle?: string;
  whatsappNumber?: string;
  customFooterPng?: string;
}

export const FooterGraphic: React.FC<FooterGraphicProps> = ({
  socialHandle = '/BreakingNewsWala',
  whatsappNumber = '+91 96698 02408',
  customFooterPng,
}) => {
  // If user provided custom Footer.png file, render it directly
  if (customFooterPng) {
    return (
      <div className="w-full bg-white select-none overflow-hidden">
        <img
          src={customFooterPng}
          alt="News Card Footer"
          className="w-full h-auto object-contain block"
        />
      </div>
    );
  }

  // Exact vector replica of Footer.png
  return (
    <div className="w-full bg-white border-t border-neutral-200 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 shadow-inner select-none overflow-hidden">
      {/* Left side: Social Icons Cluster + Social Handle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 1. Instagram */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-sm" title="Instagram">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </div>

          {/* 2. Facebook */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-sm" title="Facebook">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </div>

          {/* 3. X (Twitter) */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-sm" title="X">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>

          {/* 4. Threads */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-sm" title="Threads">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10c0-4.4-3.6-8-8-8s-8 3.6-8 8a8 8 0 0 0 13.7 5.7" />
              <path d="M16 11.5a4 4 0 1 0-2.5 3.8c1.5.3 2.5-.5 2.5-1.8v-4" />
            </svg>
          </div>

          {/* 5. YouTube */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-sm" title="YouTube">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 15l5-3-5-3v6z" />
              <path d="M21.5 8s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C15.6 4.8 12 4.8 12 4.8s-3.6 0-6.6.3c-.4.1-1.3.1-2.1.9-.6.6-.8 2-.8 2S2.2 9.6 2.2 11.2v1.6c0 1.6.3 3.2.3 3.2s.2 1.4.8 2c.8.8 1.9.8 2.4.9 1.7.2 6.3.3 6.3.3s3.6 0 6.6-.3c.4-.1 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.3-1.6.3-3.2v-1.6c0-1.6-.3-3.2-.3-3.2z" />
            </svg>
          </div>

          {/* 6. LinkedIn */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-sm" title="LinkedIn">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </div>
        </div>

        {/* Social Handle */}
        <span className="text-black font-extrabold text-[10px] sm:text-xs tracking-tight truncate">
          {socialHandle}
        </span>

        {/* WhatsApp Cluster */}
        <div className="flex items-center gap-1 shrink-0 ml-1 sm:ml-2">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-sm" title="WhatsApp">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <span className="text-black font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
            {whatsappNumber.startsWith('/') ? whatsappNumber : `/${whatsappNumber}`}
          </span>
        </div>
      </div>

      {/* Right side: "# News Update" Badge as seen in Footer.png */}
      <div className="shrink-0">
        <div className="flex items-stretch border-2 border-[#FFE600] rounded-sm bg-white overflow-hidden shadow-sm">
          {/* Yellow # Icon Box */}
          <div className="bg-[#FFE600] px-1.5 sm:px-2 flex items-center justify-center text-black font-black text-xs sm:text-sm">
            #
          </div>
          {/* News Update Text */}
          <div className="px-2 sm:px-3 py-1 flex items-center bg-white text-black font-black text-[10px] sm:text-xs tracking-tight whitespace-nowrap">
            News Update
          </div>
        </div>
      </div>
    </div>
  );
};
