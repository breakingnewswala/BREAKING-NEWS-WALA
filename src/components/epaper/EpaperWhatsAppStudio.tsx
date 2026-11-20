/**
 * BREAKING NEWS WALA — WhatsApp Edition Generator & News Cards Studio (STEP 8)
 * 
 * Production-ready, dedicated WhatsApp Edition Studio providing:
 * 1. Multi-Story WhatsApp Edition Package Generation (1:1 & 4:5 formats).
 * 2. News Selection Desk with strict server-side eligibility (approved/published only) and reporter isolation.
 * 3. Daily quota tracker with IST midnight reset indicator, concurrency protection, and zero deduction on failed attempts.
 * 4. High-resolution canvas renderer with Devanagari typography, anti-overflow shaping, and elegant missing-image fallback.
 * 5. Single card regeneration without altering rest of edition package.
 * 6. User-controlled download (PNG/JPG) and Web Share API (navigator.share) sharing workflow.
 * 7. History of generated editions and private storage download security.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Share2,
  Download,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  Smartphone,
  Square,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { GraphicRenderer } from '../../services/graphicRenderer';
import {
  WhatsAppCardFormat,
  WhatsAppEligibleArticleItem,
  EpaperWhatsAppEditionPackageDoc,
  EpaperWhatsAppEditionCardItem,
  EpaperWhatsAppQuotaResponse,
} from '../../types';

interface EpaperWhatsAppStudioProps {
  reporterId?: string;
  onClose?: () => void;
  isAdminMode?: boolean;
}

export const EpaperWhatsAppStudio: React.FC<EpaperWhatsAppStudioProps> = ({
  reporterId,
  onClose,
  isAdminMode = false,
}) => {
  // 1. Quota & State
  const [quota, setQuota] = useState<EpaperWhatsAppQuotaResponse | null>(null);
  const [loadingQuota, setLoadingQuota] = useState<boolean>(true);

  // 2. Eligible Articles & Filters
  const [eligibleArticles, setEligibleArticles] = useState<WhatsAppEligibleArticleItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 3. Multi-Story Selection
  const [selectedStories, setSelectedStories] = useState<WhatsAppEligibleArticleItem[]>([]);
  const [editionTitle, setEditionTitle] = useState<string>('दैनिक डिजिटल बुलेटिन');
  const [cardFormat, setCardFormat] = useState<WhatsAppCardFormat>('4:5');
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  // 4. Generation & Actions
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [generatedPackage, setGeneratedPackage] = useState<EpaperWhatsAppEditionPackageDoc | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 5. History
  const [historyPackages, setHistoryPackages] = useState<EpaperWhatsAppEditionPackageDoc[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // 6. Canvas Ref for Live Preview
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load Quota
  const loadQuota = useCallback(async () => {
    setLoadingQuota(true);
    try {
      if (reporterId && isAdminMode) {
        const q = await apiClient.epaper.getReporterWhatsAppQuota(reporterId);
        setQuota(q);
      } else {
        const q = await apiClient.epaper.getWhatsAppQuota();
        setQuota(q);
      }
    } catch (err: any) {
      console.warn('[EpaperWhatsAppStudio] Quota load error:', err.message);
    } finally {
      setLoadingQuota(false);
    }
  }, [reporterId, isAdminMode]);

  // Load Eligible Articles
  const loadEligibleArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await apiClient.epaper.getWhatsAppEligibleArticles({
        search: searchQuery || undefined,
        district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        reporterId: reporterId && isAdminMode ? reporterId : undefined,
      });
      setEligibleArticles(res.items || []);
    } catch (err: any) {
      console.warn('[EpaperWhatsAppStudio] Articles load error:', err.message);
    } finally {
      setLoadingArticles(false);
    }
  }, [searchQuery, selectedDistrict, selectedCategory, reporterId, isAdminMode]);

  // Load History
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const list = await apiClient.epaper.getWhatsAppEditionPackages({
        reporterId: reporterId && isAdminMode ? reporterId : undefined,
      });
      setHistoryPackages(list || []);
    } catch (err: any) {
      console.warn('[EpaperWhatsAppStudio] History load error:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [reporterId, isAdminMode]);

  useEffect(() => {
    loadQuota();
    loadEligibleArticles();
    loadHistory();
  }, [loadQuota, loadEligibleArticles, loadHistory]);

  // Handle Live Canvas Rendering for the Focused Story
  const renderPreview = useCallback(async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const currentStory = selectedStories[activePreviewIndex];
    if (!currentStory) {
      // Clear canvas if no story selected
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    try {
      await GraphicRenderer.renderArticleClipping(canvas, {
        headline: currentStory.title,
        body: currentStory.summary || currentStory.content || '',
        reporterName: currentStory.reporterName || currentStory.authorName || 'अधिकृत संवाददाता',
        reporterBadge: currentStory.reporterBadge || 'BNW-REP-0101',
        photoUrl: currentStory.featuredImage || currentStory.imageUrl || undefined,
        district: currentStory.districtName || currentStory.district || 'मध्य प्रदेश',
        category: currentStory.category || undefined,
        editionTitle: editionTitle || 'दैनिक डिजिटल बुलेटिन',
        format: cardFormat,
      });
    } catch (err) {
      console.warn('[EpaperWhatsAppStudio] Canvas preview render failed:', err);
    }
  }, [selectedStories, activePreviewIndex, cardFormat, editionTitle]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Story Selection Handlers
  const handleToggleSelectStory = (article: WhatsAppEligibleArticleItem) => {
    const exists = selectedStories.find((s) => s.id === article.id);
    if (exists) {
      const updated = selectedStories.filter((s) => s.id !== article.id);
      setSelectedStories(updated);
      if (activePreviewIndex >= updated.length) {
        setActivePreviewIndex(Math.max(0, updated.length - 1));
      }
    } else {
      setSelectedStories([...selectedStories, article]);
    }
  };

  const handleMoveStory = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= selectedStories.length) return;
    const items = [...selectedStories];
    const [moved] = items.splice(index, 1);
    items.splice(newIdx, 0, moved);
    setSelectedStories(items);
    setActivePreviewIndex(newIdx);
  };

  const handleRemoveStory = (index: number) => {
    const items = selectedStories.filter((_, i) => i !== index);
    setSelectedStories(items);
    if (activePreviewIndex >= items.length) {
      setActivePreviewIndex(Math.max(0, items.length - 1));
    }
  };

  // Generate Multi-Story Edition Package
  const handleGenerateEdition = async () => {
    if (selectedStories.length === 0) {
      setStatusMessage({ type: 'error', text: 'कृपया कम से कम एक समाचार चुनें।' });
      return;
    }

    const requiredQuota = selectedStories.length;
    if (quota && quota.remaining < requiredQuota) {
      setStatusMessage({
        type: 'error',
        text: `दैनिक कोटा अपर्याप्त है। आवश्यक: ${requiredQuota}, शेष: ${quota.remaining}। कृपया कुछ खबरें हटाएं या एडमिन से कोटा बढ़वाएं।`,
      });
      return;
    }

    setIsGenerating(true);
    setStatusMessage({ type: 'info', text: 'व्हाट्सएप एडिशन पैकेज तैयार किया जा रहा है...' });

    try {
      const pkg = await apiClient.epaper.generateWhatsAppEdition({
        editionTitle,
        format: cardFormat,
        articleIds: selectedStories.map((s) => s.id),
      });

      setGeneratedPackage(pkg);
      setStatusMessage({
        type: 'success',
        text: `व्हाट्सएप एडिशन पैकेज सफलतापूर्वक जनरेट हो गया! ${pkg.cardCount} कार्ड्स तैयार किए गए हैं।`,
      });

      // Reload quota and history
      loadQuota();
      loadHistory();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `जनरेशन त्रुटि: ${err.message || 'पैकेज निर्माण में विफल।'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate Single Card
  const handleRegenerateCard = async (cardItem: EpaperWhatsAppEditionCardItem) => {
    if (quota && quota.remaining < 1) {
      setStatusMessage({
        type: 'error',
        text: 'दैनिक कोटा समाप्त हो चुका है। कार्ड पुनः निर्माण हेतु 1 कोटा आवश्यक है।',
      });
      return;
    }

    setIsRegenerating(true);
    setStatusMessage({ type: 'info', text: `कार्ड ${cardItem.cardIndex} को पुनः तैयार किया जा रहा है...` });

    try {
      const res = await apiClient.epaper.regenerateWhatsAppCard({
        packageId: cardItem.packageId,
        cardId: cardItem.id,
        format: cardFormat,
      });

      if (generatedPackage && res.package) {
        setGeneratedPackage(res.package);
      }

      setStatusMessage({
        type: 'success',
        text: `कार्ड #${cardItem.cardIndex} सफलतापूर्वक पुनः निर्मित किया गया (वर्जन ${res.card.version || 2})। 1 कोटा प्रयुक्त हुआ।`,
      });

      loadQuota();
      loadHistory();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `कार्ड रीजेनरेशन त्रुटि: ${err.message}`,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Download Action for Canvas
  const handleDownloadActiveCard = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const link = document.createElement('a');
      link.download = `BNW-WhatsApp-${cardFormat.replace(':', 'x')}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setStatusMessage({ type: 'success', text: 'कार्ड सफलतापूर्वक डाउनलोड हो गया।' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'डाउनलोड विफल रहा।' });
    }
  };

  // User-Controlled Web Share API
  const handleShareActiveCard = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `BNW-News-Card-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: selectedStories[activePreviewIndex]?.title || 'ब्रेकिंग न्यूज़ वाला',
            text: 'ब्रेकिंग न्यूज़ वाला — मध्य प्रदेश की विश्वसनीय डिजिटल अख़बार कतरन',
            files: [file],
          });
          setStatusMessage({ type: 'success', text: 'शेयर विंडो सफलतापूर्वक खुल गई।' });
        } else {
          // Fallback: Copy to clipboard or trigger direct download
          const link = document.createElement('a');
          link.download = `BNW-News-Card-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          setStatusMessage({
            type: 'info',
            text: 'आपके ब्राउज़र में डायरेक्ट फाइल शेयरिंग उपलब्ध नहीं है; कार्ड डाउनलोड हो गया है, इसे व्हाट्सएप पर अटैच करें।',
          });
        }
      }, 'image/png');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatusMessage({ type: 'info', text: 'शेयर रद्द किया गया अथवा समर्थित नहीं है।' });
      }
    }
  };

  const currentPreviewStory = selectedStories[activePreviewIndex] || null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* 1. Header with Official Branding & Quota Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 border-b border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center font-bold text-xl font-serif text-white shadow-md">
              ब
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">व्हाट्सएप एडिशन व कार्ड स्टूडियो</h3>
                <span className="text-[10px] bg-red-600 text-white font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                  स्टेप 8
                </span>
                {isAdminMode && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                    मास्टर एडमिन मोड
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                वितरण हेतु तैयार 1:1 और 4:5 अनुपात के पेशेवर डिजिटल न्यूज़ कार्ड व एडिशन पैकेज
              </p>
            </div>
          </div>

          {/* Quota Badges */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">दैनिक कोटा (IST):</span>
                {loadingQuota ? (
                  <span className="text-slate-400 text-xs">लोड हो रहा है...</span>
                ) : (
                  <span className="font-bold text-white">
                    {quota?.used || 0} / {quota?.maxDaily || 20} प्रयुक्त
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">शेष कोटा:</span>
                <span
                  className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                    (quota?.remaining || 0) > 5
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {quota?.remaining ?? 20} कार्ड्स शेष
                </span>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-3 text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-700/50"
              >
                बंद करें
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Studio Workspace Layout */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: News Selection & Multi-Story Package Config (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controls Bar: Format Switcher & Edition Title */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-700" />
              1. एडिशन व कार्ड प्रारूप चयन
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  एडिशन शीर्षक (हेडर रिबन):
                </label>
                <input
                  type="text"
                  value={editionTitle}
                  onChange={(e) => setEditionTitle(e.target.value)}
                  placeholder="उदा. दैनिक डिजिटल बुलेटिन • विशेष रिपोर्ट"
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  पहलू अनुपात (Aspect Ratio):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardFormat('4:5')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold border transition ${
                      cardFormat === '4:5'
                        ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    4:5 पोर्ट्रेट
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardFormat('1:1')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold border transition ${
                      cardFormat === '1:1'
                        ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    1:1 वर्गाकार
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Stories Queue (Reorder, Remove, Card Count) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                2. चयनित खबरें ({selectedStories.length})
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                कोटा लागत: <strong className="text-slate-900">{selectedStories.length} कार्ड्स</strong>
              </span>
            </div>

            {selectedStories.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded text-center text-xs text-slate-500">
                नीचे दी गई सूची में से खबरें जोड़ें। आप खबरों का क्रम बदल सकते हैं।
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedStories.map((story, idx) => (
                  <div
                    key={story.id}
                    onClick={() => setActivePreviewIndex(idx)}
                    className={`p-2.5 rounded border text-xs flex items-center justify-between cursor-pointer transition ${
                      activePreviewIndex === idx
                        ? 'bg-teal-50/70 border-teal-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">{story.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {story.districtName || story.district || 'मध्य प्रदेश'} • {story.category || 'समाचार'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="ऊपर करें"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStory(idx, 'up');
                        }}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        title="नीचे करें"
                        disabled={idx === selectedStories.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStory(idx, 'down');
                        }}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        title="हटाएं"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStory(idx);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                कुल कार्ड: <strong>{selectedStories.length}</strong> | कोटा उपलब्ध: <strong>{quota?.remaining ?? 20}</strong>
              </span>

              <button
                type="button"
                disabled={isGenerating || selectedStories.length === 0 || (quota?.remaining ?? 20) < selectedStories.length}
                onClick={handleGenerateEdition}
                className="w-full sm:w-auto px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-bold flex items-center justify-center gap-2 shadow disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    पैकेज तैयार हो रहा है...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    व्हाट्सएप एडिशन पैकेज जनरेट करें ({selectedStories.length})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Eligible Articles Desk (Search & Filter) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-700" />
                3. पात्र स्वीकृत समाचार (केवल Approved/Published)
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                {eligibleArticles.length} उपलब्ध
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="शीर्षक अथवा स्थान से खोजें..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Articles List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {loadingArticles ? (
                <div className="p-4 text-center text-xs text-slate-400">समाचार लोड हो रहे हैं...</div>
              ) : eligibleArticles.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  कोई स्वीकृत अथवा प्रकाशित समाचार उपलब्ध नहीं है।
                </div>
              ) : (
                eligibleArticles.map((art) => {
                  const isSelected = selectedStories.some((s) => s.id === art.id);
                  return (
                    <div
                      key={art.id}
                      className={`p-3 rounded border text-xs flex items-start justify-between gap-3 transition ${
                        isSelected ? 'bg-teal-50/50 border-teal-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                            {art.status || 'APPROVED'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {art.districtName || art.district || 'मध्य प्रदेश'} • {art.category || 'समाचार'}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 leading-snug">{art.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{art.summary || art.content}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleSelectStory(art)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold shrink-0 flex items-center gap-1 transition ${
                          isSelected
                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            : 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Trash2 className="w-3 h-3" />
                            हटाएं
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            जोड़ें
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live High-Resolution Preview & Share Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 sticky top-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-700" />
                लाइव कार्ड पूर्वावलोकन
              </h4>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                प्रारूप: {cardFormat}
              </span>
            </div>

            {/* Carousel Navigation if multiple stories selected */}
            {selectedStories.length > 1 && (
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200">
                <button
                  type="button"
                  disabled={activePreviewIndex === 0}
                  onClick={() => setActivePreviewIndex(activePreviewIndex - 1)}
                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700" />
                </button>

                <span className="font-semibold text-slate-700">
                  कार्ड {activePreviewIndex + 1} / {selectedStories.length}
                </span>

                <button
                  type="button"
                  disabled={activePreviewIndex === selectedStories.length - 1}
                  onClick={() => setActivePreviewIndex(activePreviewIndex + 1)}
                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            )}

            {/* Live Canvas View */}
            <div className="relative bg-slate-100 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center p-2 min-h-[360px]">
              {selectedStories.length === 0 ? (
                <div className="text-center p-6 text-slate-400 space-y-2">
                  <Smartphone className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-xs font-medium">कोई खबर चयनित नहीं है</p>
                  <p className="text-[11px] opacity-75">बाईं सूची से खबर जोड़ें और पूर्वावलोकन देखें</p>
                </div>
              ) : (
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-auto max-h-[480px] object-contain rounded shadow border border-slate-200"
                />
              )}
            </div>

            {/* Card Information Badges */}
            {currentPreviewStory && (
              <div className="text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>संवाददाता: <strong>{currentPreviewStory.reporterName || currentPreviewStory.authorName || 'अधिकृत संवाददाता'}</strong></span>
                  <span>स्थान: <strong>{currentPreviewStory.districtName || currentPreviewStory.district || 'मध्य प्रदेश'}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>फोटो स्थिति: {currentPreviewStory.featuredImage || currentPreviewStory.imageUrl ? '✓ अधिकृत चित्र संलग्न' : '⚡ संपादकीय विभाजक (No Fake Image)'}</span>
                </div>
              </div>
            )}

            {/* User-Controlled Download & Sharing Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={selectedStories.length === 0}
                onClick={handleDownloadActiveCard}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                PNG डाउनलोड करें
              </button>

              <button
                type="button"
                disabled={selectedStories.length === 0}
                onClick={handleShareActiveCard}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <Share2 className="w-3.5 h-3.5" />
                व्हाट्सएप शेयर करें
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Generated Edition Package & Single-Card Regeneration Desk */}
      {generatedPackage && generatedPackage.cards && generatedPackage.cards.length > 0 && (
        <div className="p-5 border-t border-slate-200 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                सफलतापूर्वक जनरेटेड पैकेज: {generatedPackage.editionTitle} ({generatedPackage.cardCount} कार्ड्स)
              </h4>
              <p className="text-xs text-slate-500">
                प्रारूप: {generatedPackage.format} • पैकेज ID: {generatedPackage.id}
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded">
              कुल प्रयुक्त कोटा: {generatedPackage.quotaConsumed || generatedPackage.cardCount}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedPackage.cards.map((card) => (
              <div key={card.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">कार्ड #{card.cardIndex}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                    v{card.version || 1}
                  </span>
                </div>

                <p className="font-semibold text-slate-900 line-clamp-2">{card.headline}</p>
                <p className="text-[10px] text-slate-500">{card.districtName || 'मध्य प्रदेश'}</p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={isRegenerating || (quota?.remaining ?? 20) < 1}
                    onClick={() => handleRegenerateCard(card)}
                    className="flex-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <RefreshCw className="w-3 h-3" />
                    रीजेनरेट करें (1 कोटा)
                  </button>

                  <a
                    href={`/api/v1/storage/download?path=${encodeURIComponent(card.storagePath)}`}
                    download={`BNW-Card-${card.cardIndex}.png`}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Generation History Desk */}
      <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          पूर्व जनरेटेड व्हाट्सएप एडिशन पैकेज इतिहास
        </h4>

        {loadingHistory ? (
          <div className="text-xs text-slate-400 p-3">इतिहास लोड हो रहा है...</div>
        ) : historyPackages.length === 0 ? (
          <div className="text-xs text-slate-400 p-3 bg-white rounded border border-slate-200">
            अभी तक कोई पूर्व पैकेज जनरेट नहीं किया गया है।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {historyPackages.map((pkg) => (
              <div key={pkg.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate">{pkg.editionTitle}</span>
                  <span className="text-[10px] bg-teal-50 text-teal-800 font-semibold px-1.5 py-0.2 rounded border border-teal-200">
                    {pkg.format}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{pkg.cardCount} कार्ड्स (प्रयुक्त कोटा: {pkg.quotaConsumed})</span>
                  <span>{new Date(pkg.createdAt).toLocaleDateString('hi-IN')}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">ID: {pkg.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
