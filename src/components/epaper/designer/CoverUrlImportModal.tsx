import React, { useState, useRef } from 'react';
import {
  X,
  Globe,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Copy,
  ScanText,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { CoverExtractionResult } from '../../../types';

export interface CoverUrlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertStory: (story: {
    title: string;
    subheadline?: string;
    summary?: string;
    content: string;
    imageUrl?: string;
  }) => void;
}

export const CoverUrlImportModal: React.FC<CoverUrlImportModalProps> = ({
  isOpen,
  onClose,
  onInsertStory,
}) => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractResult, setExtractResult] = useState<CoverExtractionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual fallback inputs
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualSubheadline, setManualSubheadline] = useState<string>('');
  const [manualContent, setManualContent] = useState<string>('');
  const [manualImageUrl, setManualImageUrl] = useState<string>('');

  // OCR state
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExtractUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('कृपया वैध URL दर्ज करें');
      return;
    }
    setIsExtracting(true);
    setErrorMsg(null);
    setExtractResult(null);

    try {
      const res = await apiClient.epaper.tools.urlExtract(urlInput.trim());
      setExtractResult(res);
      const title = res.extractedTitle || res.mainHeadlines?.[0] || res.newspaperName || '';
      if (title) setManualTitle(title);
      if (res.subheadings?.[0]) setManualSubheadline(res.subheadings[0]);
      if (res.extractedText) setManualContent(res.extractedText);
      if (res.coverImageUrl) setManualImageUrl(res.coverImageUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'URL निष्कर्षण विफल रहा। कृपया सीधे टेक्स्ट पेस्ट करें।');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleOcrFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    try {
      // In real scenario, upload media first or send to OCR engine
      const res = await apiClient.epaper.tools.ocr(file.name);
      if (res?.text) {
        setManualContent((prev) => (prev ? `${prev}\n\n${res.text}` : res.text));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OCR टेक्स्ट निष्कर्षण विफल रहा');
    } finally {
      setIsOcrProcessing(false);
      if (ocrFileInputRef.current) ocrFileInputRef.current.value = '';
    }
  };

  const handleAiPolish = async () => {
    if (!manualContent.trim() && !manualTitle.trim()) {
      setErrorMsg('कृपया पहले सामग्री या शीर्षक दर्ज करें');
      return;
    }
    setIsExtracting(true);
    setErrorMsg(null);
    const textPayload = manualContent || manualTitle;
    try {
      const res = await apiClient.epaper.ai.interviewToArticle({
        sourceType: 'TRANSCRIPT',
        transcriptText: textPayload,
        rawText: textPayload,
        contextTopic: 'Cover URL Import News Extraction',
        outputFormat: 'INVERTED_PYRAMID',
      });
      if (res.headlines && res.headlines.length > 0) {
        setManualTitle(res.headlines[0].headline);
      } else if (res.headlineOptions && res.headlineOptions.length > 0) {
        setManualTitle(res.headlineOptions[0].headline);
      }
      if (res.articleDraft) {
        const bodyText = typeof res.articleDraft === 'string' ? res.articleDraft : res.articleDraft.body;
        setManualContent(bodyText);
        if (typeof res.articleDraft === 'object') {
          if (res.articleDraft.title && !manualTitle) setManualTitle(res.articleDraft.title);
          if (res.articleDraft.subheadline) setManualSubheadline(res.articleDraft.subheadline);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI संपादन विफल रहा');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmInsert = () => {
    if (!manualTitle.trim() && !manualContent.trim()) {
      setErrorMsg('शीर्षक अथवा सामग्री आवश्यक है');
      return;
    }
    onInsertStory({
      title: manualTitle.trim() || 'कवर से निष्कर्षित समाचार',
      subheadline: manualSubheadline.trim() || undefined,
      summary: manualContent.slice(0, 150),
      content: manualContent.trim(),
      imageUrl: manualImageUrl.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">कवर URL इंपोर्ट व समाचार निष्कर्षण</h3>
              <p className="text-[11px] text-slate-400">बाहरी वेबसाइट या ई-पेपर कवर से स्वचालित आलेख निर्माण</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Input Bar */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            समाचार अथवा ई-पेपर कवर URL दर्ज करें:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/epaper/page-cover-url"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
            <button
              onClick={handleExtractUrl}
              disabled={isExtracting}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>जांच जारी...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>सामग्री निकालें</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MANDATORY HINDI RESTRICTION MESSAGE (PART 5 REQUIREMENT) */}
        {extractResult && (extractResult.isRestricted || extractResult.isCoverOnly) && (
          <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs font-bold leading-relaxed text-amber-100">
                इस URL से केवल Cover उपलब्ध हो रहा है। वेबसाइट से पूरा Text या Article Content पढ़ने की अनुमति उपलब्ध नहीं है। कृपया Cover से आवश्यक Text Copy करके नीचे Paste करें।
              </div>
            </div>
          </div>
        )}

        {/* Result & Manual Paste Workspace */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              समाचार सामग्री संपादन व सत्यापन:
            </span>
            <div className="flex items-center gap-1.5">
              {/* OCR Fallback Button */}
              <input
                ref={ocrFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleOcrFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => ocrFileInputRef.current?.click()}
                disabled={isOcrProcessing}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="कवर स्क्रीनशॉट से OCR द्वारा टेक्स्ट निकालें"
              >
                <ScanText className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isOcrProcessing ? 'OCR स्कैन...' : 'कवर इमेज OCR'}</span>
              </button>

              {/* AI Polish Button */}
              <button
                type="button"
                onClick={handleAiPolish}
                disabled={isExtracting}
                className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="AI द्वारा 5 शीर्षक व इनवर्टेड पिरामिड समाचार बनाएं"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI आलेख सुधार</span>
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
              प्रिंट शीर्षक (Headline):
            </label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="समाचार का शीर्षक दर्ज करें या पेस्ट करें..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Subheadline input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
              उप-शीर्षक / डेक (Sub-headline):
            </label>
            <input
              type="text"
              value={manualSubheadline}
              onChange={(e) => setManualSubheadline(e.target.value)}
              placeholder="खबर का उप-शीर्षक दर्ज करें..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Body Content textarea */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
              समाचार सामग्री / कवर से कॉपी किया गया टेक्स्ट (Pasted Text):
            </label>
            <textarea
              rows={5}
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              placeholder="कवर या लेख से कॉपी किया गया विवरण यहाँ पेस्ट करें..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-none"
            />
          </div>

          {/* Cover Image URL / Preview */}
          {manualImageUrl && (
            <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300">
              <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate flex-1 font-mono text-[10px]">{manualImageUrl}</span>
              <button
                onClick={() => setManualImageUrl('')}
                className="text-[10px] text-red-400 hover:underline"
              >
                हटाएं
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            रद्द करें
          </button>
          <button
            onClick={handleConfirmInsert}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>पेज पर स्टोरी जोड़ें</span>
          </button>
        </div>
      </div>
    </div>
  );
};
