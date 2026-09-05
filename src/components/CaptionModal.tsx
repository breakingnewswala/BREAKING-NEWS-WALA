import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { NewsCardData } from '../types';

interface CaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: NewsCardData;
}

// Ensure hashtags ALWAYS start with #breakingnewswala and end with #BNWTV
function buildHashtags(location?: string, existingTagsString?: string): string {
  const loc = (location || 'MP')
    .split(/[\/,]/)[0]
    .trim()
    .replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '');
  const locationTag = loc ? `#${loc}News` : '#MPNews';

  let tagList: string[] = [];

  if (existingTagsString && existingTagsString.trim()) {
    const extracted = existingTagsString.match(/#[a-zA-Z0-9_\u0900-\u097F]+/g) || [];
    tagList = extracted;
  }

  // If no or few existing tags, seed standard tags
  if (tagList.length < 3) {
    tagList = [
      '#breakingnewswala',
      '#BreakingNews',
      locationTag,
      '#HindiNews',
      '#LatestNews',
      '#NewsUpdate',
      '#BNWTV',
    ];
  }

  // Filter out any variations of #breakingnewswala and #bnwtv so we place them strictly at start & end
  const middleTags = tagList.filter((t) => {
    const lower = t.toLowerCase();
    return lower !== '#breakingnewswala' && lower !== '#bnwtv';
  });

  // Ensure locationTag is in middleTags
  if (!middleTags.some((t) => t.toLowerCase() === locationTag.toLowerCase())) {
    middleTags.splice(1, 0, locationTag);
  }

  // Deduplicate case-insensitively
  const seen = new Set<string>();
  const uniqueMiddle: string[] = [];
  for (const t of middleTags) {
    const lower = t.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueMiddle.push(t);
    }
  }

  // Return strictly with #breakingnewswala at index 0 and #BNWTV at last index
  return ['#breakingnewswala', ...uniqueMiddle, '#BNWTV'].join(' ');
}

export const CaptionModal: React.FC<CaptionModalProps> = ({
  isOpen,
  onClose,
  card,
}) => {
  const [captionText, setCaptionText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  // Generate strictly 2 to 3 detailed paragraphs of news + tags at the end
  useEffect(() => {
    if (!isOpen) return;

    // Clean headline without [yellow] tags
    const cleanHeadline = (card.headline || '').replace(/\[\/?yellow\]/g, '').trim();

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
        // Already formatted in 2-3 paragraphs (limit to max 3 for clean social post)
        newsStory = existingParagraphs.slice(0, 3).join('\n\n');
      } else {
        // Single block of text - split into 2-3 balanced paragraphs
        const sentences = rawSummary.split(/(?<=[।!?])\s+/).filter(Boolean);
        if (sentences.length >= 5) {
          const part1 = sentences.slice(0, 2).join(' ');
          const part2 = sentences.slice(2, Math.min(5, sentences.length - 1)).join(' ');
          const part3 = sentences.slice(Math.min(5, sentences.length - 1)).join(' ');
          newsStory = `${part1}\n\n${part2}\n\n${part3}`;
        } else if (sentences.length >= 3) {
          const mid = Math.ceil(sentences.length / 2);
          const p1 = sentences.slice(0, mid).join(' ');
          const p2 = sentences.slice(mid).join(' ');
          newsStory = `${p1}\n\n${p2}`;
        } else {
          // Detailed 2-paragraph news story
          newsStory = `${cleanHeadline}। घटना को लेकर इलाके में हड़कंप मच गया है और स्थानीय प्रशासन तुरंत हरकत में आ गया है।\n\n${rawSummary}\n\nमामले की गंभीरता को देखते हुए उच्चाधिकारियों द्वारा जांच के निर्देश दे दिए गए हैं तथा प्रभावितों की मदद की जा रही है।`;
        }
      }

      const tagsToUse = buildHashtags(card.location, existingTags);
      setCaptionText(`${newsStory}\n\n${tagsToUse}`);
    } else {
      // Default template strictly adhering to 2-3 detailed paragraphs + tags
      newsStory = `${cleanHeadline}। घटना को लेकर इलाके में हड़कंप मच गया है और प्रत्यक्षदर्शियों के अनुसार स्थिति काफी तनावपूर्ण बनी हुई है।\n\nमामले की सूचना मिलते ही वरिष्ठ प्रशासनिक अधिकारी और पुलिस बल मौके पर पहुंच गए हैं तथा राहत एवं आवश्यक कार्रवाई शुरू कर दी गई है।\n\nफिलहाल स्थिति पर लगातार नजर रखी जा रही है और पूरे घटनाक्रम की विस्तृत जांच के निर्देश दिए गए हैं।`;
      const tagsToUse = buildHashtags(card.location);
      setCaptionText(`${newsStory}\n\n${tagsToUse}`);
    }
  }, [isOpen, card]);

  // Expand into full 3 detailed paragraphs using Gemini AI
  const handleExpandWithAI = async () => {
    setIsExpanding(true);
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: (card.headline || '').replace(/\[\/?yellow\]/g, '').trim(),
          location: card.location,
          category: card.category,
          existingSummary: captionText || card.summary,
        }),
      });

      const data = await response.json();
      if (response.ok && data.caption) {
        // Enforce the #breakingnewswala ... #BNWTV order on the output
        let text = data.caption.trim();
        const tagMatch = text.match(/(#[a-zA-Z0-9_\u0900-\u097F]+\s*)+$/);
        if (tagMatch) {
          const bodyText = text.substring(0, tagMatch.index).trim();
          const enforcedTags = buildHashtags(card.location, tagMatch[0]);
          setCaptionText(`${bodyText}\n\n${enforcedTags}`);
        } else {
          const enforcedTags = buildHashtags(card.location);
          setCaptionText(`${text}\n\n${enforcedTags}`);
        }
      }
    } catch (e) {
      console.error('Failed to expand caption with AI:', e);
    } finally {
      setIsExpanding(false);
    }
  };

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
                2-3 पैराग्राफ में पूरी खबर • पहला टैग <span className="text-yellow-400 font-mono font-bold">#breakingnewswala</span> • अंतिम टैग <span className="text-yellow-400 font-mono font-bold">#BNWTV</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>कैप्शन टेक्स्ट (आवश्यकतानुसार एडिट भी कर सकते हैं):</span>
            <button
              type="button"
              onClick={handleExpandWithAI}
              disabled={isExpanding}
              className="text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 px-2.5 py-1 rounded-lg border border-yellow-400/30 transition-all cursor-pointer disabled:opacity-50"
              title="AI से खबर को 3 विस्तृत पैराग्राफ में तैयार करें"
            >
              {isExpanding ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>विस्तार हो रहा है...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span>AI से 3 पैराग्राफ में विस्तार करें</span>
                </>
              )}
            </button>
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
