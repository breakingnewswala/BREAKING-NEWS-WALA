'use client';

import React, { useState } from 'react';
import { Share2, Check, Send } from 'lucide-react';
import { dispatchTelemetryEvent } from '../lib/api';

interface SocialShareBarProps {
  articleId: string;
  headline: string;
  url: string;
  className?: string;
}

export const SocialShareBar: React.FC<SocialShareBarProps> = ({
  articleId,
  headline,
  url,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const fullShareText = `${headline}\n\nपूरी खबर पढ़ें:\n${url}`;

  const trackShare = (channel: string) => {
    dispatchTelemetryEvent({
      event_name: 'article_shared',
      properties: {
        article_id: articleId,
        channel,
      },
    });
  };

  const handleWhatsAppShare = () => {
    trackShare('whatsapp');
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    trackShare('facebook');
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    trackShare('twitter');
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(headline)}&url=${encodeURIComponent(url)}&via=BreakingNewsWala`;
    window.open(twUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    trackShare('telegram');
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(headline)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    trackShare('native');
    if (navigator.share) {
      try {
        await navigator.share({
          title: headline,
          text: headline,
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Ignore clipboard failure
      }
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 py-3 border-y border-gray-100 ${className}`}>
      {/* Primary WhatsApp CTA */}
      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all active:scale-95"
        aria-label="WhatsApp पर शेयर करें"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.227-.557-1.802-.746-2.951-2.572-3.04-2.692-.09-.12-1.047-1.39-1.047-2.651 0-1.261.658-1.884.891-2.143.234-.259.51-.324.68-.324.17 0 .341.002.489.009.158.007.369-.06.578.441.218.52.744 1.815.81 1.948.066.133.11.289.022.464-.088.175-.132.285-.262.438-.13.153-.274.341-.392.457-.132.13-.27.271-.116.536.154.265.684 1.127 1.468 1.824 1.008.898 1.859 1.177 2.123 1.309.264.132.418.11.573-.066.155-.176.662-.772.839-1.036.176-.265.352-.22.593-.132.242.088 1.541.727 1.805.859.264.132.44.198.506.308.066.11.066.638-.078 1.043z" />
        </svg>
        <span>WhatsApp पर शेयर करें</span>
      </button>

      {/* Secondary Share Buttons */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Facebook */}
        <button
          type="button"
          onClick={handleFacebookShare}
          className="w-9 h-9 rounded-full bg-blue-50 text-[#1877F2] hover:bg-[#1877F2] hover:text-white flex items-center justify-center transition-colors"
          title="Facebook पर साझा करें"
          aria-label="Facebook पर साझा करें"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>

        {/* X / Twitter */}
        <button
          type="button"
          onClick={handleTwitterShare}
          className="w-9 h-9 rounded-full bg-gray-100 text-gray-900 hover:bg-black hover:text-white flex items-center justify-center transition-colors"
          title="X (Twitter) पर साझा करें"
          aria-label="X (Twitter) पर साझा करें"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>

        {/* Telegram */}
        <button
          type="button"
          onClick={handleTelegramShare}
          className="w-9 h-9 rounded-full bg-sky-50 text-[#0088cc] hover:bg-[#0088cc] hover:text-white flex items-center justify-center transition-colors"
          title="Telegram पर साझा करें"
          aria-label="Telegram पर साझा करें"
        >
          <Send className="w-4 h-4" />
        </button>

        {/* Native Web Share or Copy Link */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 hover:bg-[#344FD6] hover:text-white flex items-center justify-center transition-colors relative"
          title={copied ? 'लिंक कॉपी हो गया!' : 'अन्य माध्यमों से शेयर करें'}
          aria-label="शेयर या लिंक कॉपी करें"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
          {copied && (
            <span className="absolute -top-8 right-0 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
              कॉपी हो गया!
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default SocialShareBar;

