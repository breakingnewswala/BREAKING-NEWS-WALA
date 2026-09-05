import React, { useState } from 'react';
import { RefreshCw, X, Link as LinkIcon, Send, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { AIAnalysisResult } from '../types';

interface NewsCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (result: AIAnalysisResult) => void;
}

export const NewsCommandModal: React.FC<NewsCommandModalProps> = ({
  isOpen,
  onClose,
  onApplyResult,
}) => {
  const [activeTab, setActiveTab] = useState<'command' | 'link'>('command');
  const [inputText, setInputText] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [useWebsitePhoto, setUseWebsitePhoto] = useState<boolean>(true);
  const [generatingAiImage, setGeneratingAiImage] = useState<boolean>(false);
  const [generatedAiImageUrl, setGeneratedAiImageUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcess = async () => {
    const inputPayload = activeTab === 'command' ? inputText.trim() : '';
    const urlPayload = activeTab === 'link' ? linkUrl.trim() : '';

    if (!inputPayload && !urlPayload) {
      setError('कृपया न्यूज़ लिंक या कमांड टेक्स्ट दर्ज करें');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setGeneratedAiImageUrl(null);

    try {
      const response = await fetch('/api/process-news-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: inputPayload || undefined,
          linkUrl: urlPayload || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'न्यूज़ प्रोसेस करने में त्रुटि');
      }

      setResult(data.data);
      if (data.data.pickedImages?.main) {
        setUseWebsitePhoto(true);
      }
    } catch (err: any) {
      console.error('Command processing error:', err);
      setError(err.message || 'त्रुटि उत्पन्न हुई');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiPhotoFromHeadline = async () => {
    if (!result?.headline) return;
    setGeneratingAiImage(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: result.headline,
          customPrompt: result.suggestedImagePrompt,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI फोटो जनरेट करने में त्रुटि');
      }
      setGeneratedAiImageUrl(data.imageUrl);
      setResult((prev) => (prev ? { ...prev, isAiGeneratedPhoto: true } : null));
    } catch (err: any) {
      console.error('AI image generation error:', err);
      setError(err.message || 'AI फोटो जनरेट नहीं हो सकी');
    } finally {
      setGeneratingAiImage(false);
    }
  };

  const handleApply = () => {
    if (result) {
      const finalResult: AIAnalysisResult = { ...result };
      if (generatedAiImageUrl) {
        finalResult.pickedImages = {
          main: generatedAiImageUrl,
        };
        finalResult.isAiGeneratedPhoto = true;
      } else if (!useWebsitePhoto) {
        // User opted out of using website photo
        finalResult.pickedImages = undefined;
      }
      onApplyResult(finalResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">
                लिंक या कमांड से न्यूज़ बनाएं
              </h2>
              <p className="text-xs text-neutral-400">
                न्यूज़ लिंक या कच्ची खबर लिखें, AI स्वतः हेडलाइन व हाइलाइट्स बनाएगा
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('command')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'command'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            कमांड / खबर टेक्स्ट
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'link'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            न्यूज़ वेबसाइट लिंक (URL)
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {activeTab === 'command' ? (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                समाचार कमांड या विवरण दर्ज करें:
              </label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="उदा: शहडोल में छात्राओं ने कॉलेज सुविधाओं को लेकर 10 किलोमीटर पैदल मार्च निकाला और कलेक्ट्रेट पहुंचकर केवल कलेक्टर को ही ज्ञापन देने पर अड़ी रहीं।"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-yellow-400 focus:outline-none font-['Noto_Sans_Devanagari']"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-yellow-400" />
                न्यूज़ आर्टिकल लिंक पेस्ट करें:
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/news-article-slug"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-yellow-400 focus:outline-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                वेबसाइट का शीर्षक और सामग्री विश्लेषण करके हिंदी हेडलाइन बनाई जाएगी।
              </p>
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI न्यूज़ हेडलाइन जनरेट कर रहा है...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>इमेज न्यूज़ हेडलाइन तैयार करें</span>
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Output */}
          {result && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-yellow-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> तैयार हेडलाइन:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
                  {result.location}
                </span>
              </div>

              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 font-extrabold text-white text-base font-['Noto_Sans_Devanagari'] leading-relaxed">
                {result.headline}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-neutral-400 text-[11px]">हाइलाइटेड:</span>
                {result.highlightWords?.map((hw, idx) => (
                  <span
                    key={idx}
                    className="bg-yellow-400 text-neutral-950 font-extrabold px-2 py-0.5 rounded text-[11px]"
                  >
                    {hw}
                  </span>
                ))}
              </div>

              {/* 1. Website Picked Image Preview & Toggle */}
              {result.pickedImages?.main && (
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <span>📸 वेबसाइट से प्राप्त फोटो:</span>
                      <span className="text-[10px] bg-green-950 text-green-400 border border-green-800/60 px-1.5 py-0.2 rounded font-bold">
                        Auto Picked
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseWebsitePhoto(!useWebsitePhoto)}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded border cursor-pointer ${
                        useWebsitePhoto
                          ? 'bg-green-600/30 text-green-300 border-green-500'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      {useWebsitePhoto ? 'फोटो शामिल करें (ON)' : 'हटाएं (OFF)'}
                    </button>
                  </div>
                  {useWebsitePhoto && (
                    <div className="flex items-center gap-3">
                      <img
                        src={result.pickedImages.main}
                        alt="Website Article"
                        className="w-20 h-16 object-cover rounded-lg border border-neutral-700 shadow"
                      />
                      {result.pickedImages.second && (
                        <img
                          src={result.pickedImages.second}
                          alt="Website Article 2"
                          className="w-20 h-16 object-cover rounded-lg border border-neutral-700 shadow"
                        />
                      )}
                      <div className="text-[11px] text-neutral-400">
                        यह फोटो कार्ड के बैकग्राउंड में स्वतः सेट हो जाएगी। बाद में आप इसे एडिटर में बदल भी सकते हैं।
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. AI Generated Photo Option */}
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>हेडलाइन से AI फोटो जनरेट करें:</span>
                  </span>
                  {!generatedAiImageUrl ? (
                    <button
                      type="button"
                      disabled={generatingAiImage}
                      onClick={handleGenerateAiPhotoFromHeadline}
                      className="px-3 py-1 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 border border-yellow-400/40 rounded text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {generatingAiImage ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>AI फोटो बन रही है...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>AI फोटो बनाएं</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] bg-yellow-400 text-neutral-950 font-black px-2 py-0.5 rounded">
                      AI फोटो तैयार ✅
                    </span>
                  )}
                </div>

                {generatedAiImageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-neutral-950 rounded-lg border border-yellow-500/40">
                    <img
                      src={generatedAiImageUrl}
                      alt="AI Generated Background"
                      className="w-20 h-20 object-cover rounded-lg border border-yellow-400/50 shadow"
                    />
                    <div className="text-[11px] text-neutral-300">
                      हेडलाइन के अनुसार AI द्वारा फोटो तैयार कर ली गई है। कार्ड में स्वतः यही बैकग्राउंड लगेगा और AI GENERATED मार्क ऑन रहेगा।
                    </div>
                  </div>
                )}
              </div>

              {/* AI Generated Photo Badge Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-neutral-900/90 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-bold text-neutral-200">
                    AI वाटरमार्क (AI GENERATED):
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setResult({
                      ...result,
                      isAiGeneratedPhoto: !result.isAiGeneratedPhoto,
                    })
                  }
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                    result.isAiGeneratedPhoto
                      ? 'bg-yellow-400 text-neutral-950 border-yellow-400 font-black'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {result.isAiGeneratedPhoto ? 'सक्रिय (ON)' : 'बंद (OFF)'}
                </button>
              </div>

              <button
                onClick={handleApply}
                className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Check className="w-4 h-4" />
                <span>कार्ड में लागू करें</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
