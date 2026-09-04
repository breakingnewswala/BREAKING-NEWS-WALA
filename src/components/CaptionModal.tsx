import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { NewsCardData } from '../types';

interface CaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: NewsCardData;
}

export const CaptionModal: React.FC<CaptionModalProps> = ({
  isOpen,
  onClose,
  card,
}) => {
  const [captionText, setCaptionText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate strictly 2 to 3 paragraphs of news + tags at the end (no headers, no phone, no links)
  useEffect(() => {
    if (!isOpen) return;

    // Clean headline without [yellow] tags
    const cleanHeadline = (card.headline || '').replace(/\[\/?yellow\]/g, '').trim();

    // Prepare tags
    const locationClean = (card.location || 'MP')
      .split(/[\/,]/)[0]
      .trim()
      .replace(/\s+/g, '');
    const locationTag = locationClean ? `#${locationClean}News` : '#MPNews';
    const defaultTags = `#BreakingNews ${locationTag} #HindiNews #LatestNews #NewsUpdate #BreakingNewsWala`;

    let newsStory = '';

    if (card.summary && card.summary.trim()) {
      let rawSummary = card.summary.trim();

      // If summary already ends with hashtags, extract them
      const tagMatch = rawSummary.match(/(#[a-zA-Z0-9_\u0900-\u097F]+\s*)+$/);
      let existingTags = '';
      if (tagMatch) {
        existingTags = tagMatch[0].trim();
        rawSummary = rawSummary.substring(0, tagMatch.index).trim();
      }

      // Check how many paragraphs exist
      const existingParagraphs = rawSummary
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (existingParagraphs.length >= 2) {
        // Already formatted in 2-3 paragraphs
        newsStory = existingParagraphs.join('\n\n');
      } else {
        // Single block of text - split into 2-3 balanced paragraphs
        const sentences = rawSummary.split(/(?<=[।!?])\s+/).filter(Boolean);
        if (sentences.length >= 4) {
          const mid = Math.ceil(sentences.length / 2);
          const p1 = sentences.slice(0, mid).join(' ');
          const p2 = sentences.slice(mid).join(' ');
          newsStory = `${p1}\n\n${p2}`;
        } else if (sentences.length >= 2) {
          const p1 = sentences[0];
          const p2 = sentences.slice(1).join(' ');
          newsStory = `${p1}\n\n${p2}`;
        } else {
          // Fallback with headline context
          newsStory = `${cleanHeadline}।\n\n${rawSummary}\n\nप्रशासन और संबंधित विभाग द्वारा मामले की गंभीरता को देखते हुए आवश्यक कदम उठाए जा रहे हैं।`;
        }
      }

      const tagsToUse = existingTags || defaultTags;
      setCaptionText(`${newsStory}\n\n${tagsToUse}`);
    } else {
      // Default template adhering strictly to 2-3 paragraphs + tags
      newsStory = `${cleanHeadline}। घटना को लेकर इलाके में हड़कंप मच गया है और प्रत्यक्षदर्शियों के अनुसार स्थिति काफी तनावपूर्ण बनी हुई है।\n\nमामले की सूचना मिलते ही वरिष्ठ प्रशासनिक अधिकारी और पुलिस बल मौके पर पहुंच गए हैं तथा राहत एवं आवश्यक कार्रवाई शुरू कर दी गई है।\n\nफिलहाल स्थिति पर लगातार नजर रखी जा रही है और पूरे घटनाक्रम की विस्तृत जांच के निर्देश दिए गए हैं।`;
      setCaptionText(`${newsStory}\n\n${defaultTags}`);
    }
  }, [isOpen, card]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                इंस्टाग्राम व फेसबुक पोस्ट कैप्शन
              </h3>
              <p className="text-[11px] text-neutral-400">
                2-3 पैराग्राफ में पूरी खबर + अंत में प्रासंगिक टैग (कोई अतिरिक्त लिंक या नंबर नहीं)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>कैप्शन टेक्स्ट (आवश्यकतानुसार एडिट भी कर सकते हैं):</span>
            <span className="text-green-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              रेडी टू पोस्ट
            </span>
          </div>

          <textarea
            rows={10}
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs sm:text-sm text-neutral-200 focus:border-green-500 focus:outline-none font-['Noto_Sans_Devanagari'] leading-relaxed resize-none shadow-inner"
            placeholder="2-3 पैराग्राफ खबर और अंत में हैशटैग..."
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 px-4 rounded-xl bg-green-500 hover:bg-green-400 active:scale-[0.99] text-neutral-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-950/40 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>कैप्शन कॉपी हो गया!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 stroke-[2.5]" />
                  <span>इंस्टा/फेसबुक कैप्शन कॉपी करें</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
