import React, { useState } from 'react';
import { Sparkles, X, Check, AlertCircle, Loader2, Image as ImageIcon, Wand2, RefreshCw } from 'lucide-react';
import { AspectRatio } from '../types';

interface AIGenerateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHeadline: string;
  aspectRatio: AspectRatio;
  onApplyImage: (imageUrl: string, promptUsed?: string) => void;
  onAnalyzeOldImage?: (imageFile: File, userContext?: string) => void;
}

export const AIGenerateImageModal: React.FC<AIGenerateImageModalProps> = ({
  isOpen,
  onClose,
  currentHeadline,
  aspectRatio,
  onApplyImage,
}) => {
  const [headline, setHeadline] = useState<string>(currentHeadline || '');
  const [customDetail, setCustomDetail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [promptUsed, setPromptUsed] = useState<string | null>(null);

  // Sync when opening
  React.useEffect(() => {
    if (isOpen && currentHeadline) {
      setHeadline(currentHeadline);
    }
  }, [isOpen, currentHeadline]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!headline.trim() && !customDetail.trim()) {
      setError('कृपया हेडलाइन या फोटो का विवरण दर्ज करें');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const response = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headline.trim(),
          customPrompt: customDetail.trim() ? `${headline.trim()} - ${customDetail.trim()}` : undefined,
          aspectRatio: aspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI फोटो जनरेट करने में त्रुटि हुई');
      }

      setGeneratedImageUrl(data.imageUrl);
      setPromptUsed(data.promptUsed);
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(err.message || 'फोटो जनरेट नहीं हो सकी। कृपया दोबारा प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedImageUrl) {
      onApplyImage(generatedImageUrl, promptUsed || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 flex items-center justify-center font-black shadow">
              <Wand2 className="w-4 h-4 text-neutral-950" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                हेडलाइन देखकर AI फोटो बनाएं
              </h2>
              <p className="text-xs text-neutral-400">
                AI आपकी हेडलाइन को समझकर सटीक, रियलिस्टिक न्यूज़ बैकग्राउंड फोटो तैयार करेगा
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Current Headline Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
              <span>समाचार हेडलाइन:</span>
              <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                कार्ड से स्वतः ली गई
              </span>
            </label>
            <textarea
              rows={3}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="उदा: रीवा-सीधी हाईवे पर भीषण सड़क हादसा, बस और ट्रक में जोरदार टक्कर"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-yellow-400 focus:outline-none font-['Noto_Sans_Devanagari']"
            />
          </div>

          {/* Optional specific scene detail */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              अतिरिक्त संदर्भ / दृश्य संकेत (ऐच्छिक):
            </label>
            <input
              type="text"
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value)}
              placeholder="उदा: रात का दृश्य, एम्बुलेंस, पुलिस बल, हाईवे सड़क"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-yellow-400 focus:outline-none font-['Noto_Sans_Devanagari']"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                <span>AI द्वारा न्यूज़ बैकग्राउंड फोटो तैयार की जा रही है...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-neutral-950" />
                <span>हेडलाइन से AI फोटो बनाएं</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Image Result */}
          {generatedImageUrl && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-yellow-500/50 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>AI द्वारा जनरेट की गई फोटो तैयार है:</span>
                </span>
                <span className="text-[10px] bg-yellow-400 text-neutral-950 font-black px-2 py-0.5 rounded">
                  AI GENERATED
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-[4/5] max-h-[380px] flex items-center justify-center">
                <img
                  src={generatedImageUrl}
                  alt="AI Generated Background"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-neutral-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>दोबारा बनाएं</span>
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-[2] py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-neutral-950 text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Check className="w-4 h-4 text-neutral-950" />
                  <span>कार्ड के बैकग्राउंड में लगाएं</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
