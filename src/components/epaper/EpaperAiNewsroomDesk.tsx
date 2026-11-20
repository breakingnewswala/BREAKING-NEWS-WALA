import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  FileText,
  ShieldCheck,
  Layout,
  Image as ImageIcon,
  History,
  BookOpen,
  ArrowRightLeft,
  Sliders,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import {
  ArticleDetail,
  EpaperEditionDoc,
  EpaperAiHeadlineResult,
  EpaperAiSummaryResult,
  EpaperAiCopyEditResult,
  EpaperAiStructureSuggestion,
  EpaperAiTranslationResult,
  EpaperAiVerificationResult,
  EpaperAiDesignSuggestion,
  EpaperAiCompositionProposal,
  EpaperAiGraphicSuggestion,
  EpaperAiNewsroomHistoryItem,
} from '../../types';
import { apiClient } from '../../services/apiClient';

export interface EpaperAiNewsroomDeskProps {
  articles: ArticleDetail[];
  editions?: EpaperEditionDoc[];
  currentRole?: string;
  onOpenDesigner?: (editionId: string, pageNumber: number) => void;
}

export const EpaperAiNewsroomDesk: React.FC<EpaperAiNewsroomDeskProps> = ({
  articles,
  editions = [],
  currentRole = 'EDITOR',
  onOpenDesigner,
}) => {
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<'editorial' | 'writer' | 'verification' | 'design' | 'graphics' | 'history'>('editorial');
  const [editorialSubMode, setEditorialSubMode] = useState<'headlines' | 'summary' | 'copyedit' | 'structure' | 'translate'>('headlines');

  // Selected Article & Inputs
  const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || '');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customContent, setCustomContent] = useState<string>('');
  const [customDistrict, setCustomDistrict] = useState<string>('भोपाल');
  const [isBreaking, setIsBreaking] = useState<boolean>(false);

  // Verification Inputs
  const [sourcesInput, setSourcesInput] = useState<string>('');
  const [evidenceNotesInput, setEvidenceNotesInput] = useState<string>('');

  // Design Inputs
  const [targetPageNumber, setTargetPageNumber] = useState<number>(1);
  const [targetEditionId, setTargetEditionId] = useState<string>(editions[0]?.id || '');

  // Loading States
  const [loading, setLoading] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Result States
  const [headlineResult, setHeadlineResult] = useState<EpaperAiHeadlineResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<EpaperAiSummaryResult | null>(null);
  const [copyEditResult, setCopyEditResult] = useState<EpaperAiCopyEditResult | null>(null);
  const [structureResult, setStructureResult] = useState<EpaperAiStructureSuggestion | null>(null);
  const [translationResult, setTranslationResult] = useState<EpaperAiTranslationResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<EpaperAiVerificationResult | null>(null);
  const [designResult, setDesignResult] = useState<EpaperAiDesignSuggestion | null>(null);
  const [compositionResult, setCompositionResult] = useState<EpaperAiCompositionProposal | null>(null);
  const [graphicResult, setGraphicResult] = useState<EpaperAiGraphicSuggestion | null>(null);

  // Writer States (Workflow A: Raw Script, Workflow B: Topic/URL, Workflow C: Placement)
  const [writerSubMode, setWriterSubMode] = useState<'RAW_SCRIPT' | 'TOPIC_URL'>('RAW_SCRIPT');
  const [writerRawScript, setWriterRawScript] = useState<string>('');
  const [writerTopic, setWriterTopic] = useState<string>('');
  const [writerUrl, setWriterUrl] = useState<string>('');
  const [writerFormat, setWriterFormat] = useState<string>('DETAILED');
  const [writerDistrict, setWriterDistrict] = useState<string>('भोपाल');
  const [writerCategory, setWriterCategory] = useState<string>('STATE');
  const [writerLoading, setWriterLoading] = useState<boolean>(false);
  const [writerResult, setWriterResult] = useState<any | null>(null);
  const [writerTargetEditionId, setWriterTargetEditionId] = useState<string>(editions[0]?.id || '');
  const [writerTargetPageNum, setWriterTargetPageNum] = useState<number>(1);
  const [writerTargetColSpan, setWriterTargetColSpan] = useState<number>(2);
  const [writerTargetRole, setWriterTargetRole] = useState<string>('LEAD');
  const [writerIsPlacing, setWriterIsPlacing] = useState<boolean>(false);

  // History & Usage
  const [historyItems, setHistoryItems] = useState<EpaperAiNewsroomHistoryItem[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);

  // Sync selected article inputs
  const activeArticle = useMemo(() => {
    return articles.find((a) => a.id === selectedArticleId) || null;
  }, [articles, selectedArticleId]);

  useEffect(() => {
    if (activeArticle) {
      setCustomTitle(activeArticle.title || '');
      setCustomContent(activeArticle.content || activeArticle.summary || '');
      setCustomDistrict(activeArticle.districtName || (activeArticle as any).district || 'मध्य प्रदेश');
      setIsBreaking(Boolean(activeArticle.priority === 'BREAKING' || activeArticle.isBreaking));
    }
  }, [activeArticle]);

  // Load initial history & usage
  const loadHistoryAndUsage = async () => {
    try {
      const [histRes, usageRes] = await Promise.all([
        apiClient.epaper.ai.getHistory(),
        apiClient.epaper.ai.getUsage(),
      ]);
      if (histRes && Array.isArray(histRes.history)) {
        setHistoryItems(histRes.history);
      }
      if (usageRes) {
        setUsageStats(usageRes);
      }
    } catch {
      // Dev mode fallback
    }
  };

  useEffect(() => {
    loadHistoryAndUsage();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showNotification('टेक्स्ट क्लिपबोर्ड पर कॉपी किया गया!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Generate Headlines
  const handleGenerateHeadlines = async () => {
    setLoading(true);
    try {
      const res = await apiClient.epaper.ai.generateHeadlines({
        title: customTitle,
        content: customContent,
        district: customDistrict,
        isBreaking,
        articleId: selectedArticleId || undefined,
      });
      setHeadlineResult(res);
      showNotification('5-स्तरीय हेडलाइन सुझाव सफलतापूर्वक तैयार हुए!');
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'हेडलाइन निर्माण विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Summary
  const handleGenerateSummary = async (mode: 'SHORT' | 'DETAILED' | 'BULLETS' = 'BULLETS') => {
    setLoading(true);
    try {
      const res = await apiClient.epaper.ai.generateSummary({
        content: customContent,
        headline: customTitle,
        district: customDistrict,
        mode,
        articleId: selectedArticleId || undefined,
      });
      setSummaryResult(res);
      showNotification('समाचार सारांश तैयार हुआ!');
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'सारांश निर्माण विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Copy Edit
  const handleCopyEdit = async (tone: string = 'NEUTRAL') => {
    setLoading(true);
    try {
      const res = await apiClient.epaper.ai.copyEditHindi({
        content: customContent,
        tone,
        fixGrammarAndSpelling: true,
        articleId: selectedArticleId || undefined,
      });
      setCopyEditResult(res);
      showNotification('देवनागरी वर्तनी व भाषा सुधार विश्लेषण संपन्न!');
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'भाषा सुधार विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. Structure Analysis
  const handleAnalyzeStructure = async () => {
    setLoading(true);
    try {
      const res = await apiClient.epaper.ai.analyzeStructure({
        title: customTitle,
        content: customContent,
        articleId: selectedArticleId || undefined,
      });
      setStructureResult(res);
      showNotification('संरचना व पठनीयता विश्लेषण पूर्ण हुआ!');
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'संरचना विश्लेषण विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 5. Translate
  const handleTranslate = async (targetLang: 'hi' | 'en') => {
    setLoading(true);
    try {
      const res = await apiClient.epaper.ai.translateContent({
        content: customContent,
        sourceLanguage: targetLang === 'en' ? 'hi' : 'en',
        targetLanguage: targetLang,
        articleId: selectedArticleId || undefined,
      });
      setTranslationResult(res);
      showNotification('द्विभाषी अनुवाद तैयार! (मानवीय समीक्षा अनिवार्य)');
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'अनुवाद विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 6. Fact-Checking
  const handleVerify = async () => {
    setLoading(true);
    try {
      const srcList = sourcesInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await apiClient.epaper.ai.verifyClaims({
        headline: customTitle,
        content: customContent,
        district: customDistrict,
        sources: srcList,
        evidenceNotes: evidenceNotesInput,
        articleId: selectedArticleId || undefined,
      });
      setVerificationResult(res);
      showNotification('तथ्य परीक्षण व 10-सूत्रीय सत्यापन परिणाम तैयार!');
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'तथ्य परीक्षण विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 7. Design Suggestions
  const handleGetDesignSuggestions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.epaper.ai.getDesignSuggestions({
        pageNumber: targetPageNumber,
        articles: activeArticle ? [activeArticle] : articles.slice(0, 5),
        gridColumns: 8,
      });
      setDesignResult(res);
      showNotification('पृष्ठ डिज़ाइन व टेम्पलेट सुझाव तैयार!');
    } catch (err: any) {
      showNotification(err.message || 'डिज़ाइन सुझाव विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 8. Propose Page Composition
  const handleProposeComposition = async () => {
    setLoading(true);
    try {
      const res = await apiClient.epaper.ai.proposeComposition({
        pageNumber: targetPageNumber,
        selectedArticles: articles.slice(0, 6),
      });
      setCompositionResult(res);
      showNotification('पेज कम्पोज़िशन व स्टोरी प्लेसमेंट प्रस्ताव तैयार!');
    } catch (err: any) {
      showNotification(err.message || 'कम्पोज़िशन प्रस्ताव विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 9. Graphic Suggestions
  const handleGetGraphicSuggestions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.epaper.ai.getGraphicSuggestions({
        headline: customTitle,
        content: customContent,
        district: customDistrict,
        articleId: selectedArticleId || undefined,
      });
      setGraphicResult(res);
      showNotification('दृश्य अवधारणा, क्रॉपिंग व कैप्शन सुझाव तैयार!');
    } catch (err: any) {
      showNotification(err.message || 'ग्राफिक सुझाव विफल', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apply suggestion (Human-in-the-Loop)
  const handleApplySuggestion = async (
    suggestionType: 'HEADLINE' | 'SUMMARY' | 'COPY_EDIT' | 'TRANSLATION' | 'DESIGN_TEMPLATE' | 'COMPOSITION',
    selectedContent: any,
    notes: string
  ) => {
    setApplying(true);
    try {
      const res = await apiClient.epaper.ai.applySuggestion({
        sourceArticleId: selectedArticleId || undefined,
        editionId: targetEditionId || undefined,
        pageNumber: targetPageNumber,
        suggestionType,
        selectedContent,
        notes,
      });
      showNotification(`सुझाव स्वीकृत व लागू किया गया! (ऑडिट ID: ${res.auditLogId})`);
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'सुझाव लागू करने में त्रुटि', 'error');
    } finally {
      setApplying(false);
    }
  };

  // 10. Writer Handlers (Workflow A: Raw Script, Workflow B: Topic/URL, Workflow C: E-Paper Placement)
  const handleGenerateRawScriptDraft = async () => {
    if (!writerRawScript.trim()) {
      showNotification('कृपया कच्ची स्क्रिप्ट अथवा मुख्य बिंदु दर्ज करें।', 'error');
      return;
    }
    setWriterLoading(true);
    try {
      const res = await apiClient.ai.generateNewsDraft({
        title: customTitle || writerTopic || 'घटनाक्रम पर आधारित समाचार',
        notes: writerRawScript,
        district: writerDistrict,
        format: writerFormat as any,
        language: 'hi',
      });
      setWriterResult(res);
      showNotification('एआई समाचार प्रारूप सफलतापूर्वक तैयार हुआ!');
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'समाचार निर्माण विफल', 'error');
    } finally {
      setWriterLoading(false);
    }
  };

  const handleGenerateTopicUrlDraft = async () => {
    if (!writerTopic.trim() && !writerUrl.trim()) {
      showNotification('कृपया समाचार का विषय अथवा यूआरएल दर्ज करें।', 'error');
      return;
    }
    setWriterLoading(true);
    try {
      if (writerUrl.trim()) {
        try {
          const res = await apiClient.ai.conductResearch({
            topic: writerTopic.trim() || writerUrl.trim(),
            district: writerDistrict,
            referenceLinks: [writerUrl.trim()],
          });
          const draftRes = await apiClient.ai.generateNewsDraft({
            title: writerTopic.trim() || res.topicSummary || 'वेब संदर्भ रिपोर्ट',
            notes: `${res.topicSummary}\n${(res.factBreakdown?.confirmedFacts || []).join('\n')}`,
            district: writerDistrict,
            format: writerFormat as any,
            language: 'hi',
          });
          setWriterResult(draftRes);
          showNotification('वेब स्रोत से समाचार प्रारूप तैयार हुआ!');
        } catch (_urlErr: any) {
          // Transparent extraction failure handling: NEVER hallucinate
          setWriterResult({
            headline: writerTopic.trim() || 'वेब स्रोत संदर्भ',
            leadParagraph: 'सूचना: प्रदान किए गए वेब यूआरएल से सामग्री निष्कर्षण संभव नहीं हो सका।',
            fullContent: 'पत्रकारिता दिशानिर्देशों के अनुसार, अपुष्ट अथवा अनुपलब्ध वेब लिंक के आधार पर कोई भी काल्पनिक विवरण नहीं गढ़ा गया है। कृपया मान्य लिंक प्रदान करें अथवा कच्ची स्क्रिप्ट का उपयोग करें।',
            sourceExtractionFailed: true,
          });
          showNotification('स्रोत सामग्री निष्कर्षण में बाधा — कोई काल्पनिक तथ्य नहीं जोड़े गए', 'error');
        }
      } else {
        const res = await apiClient.ai.conductResearch({
          topic: writerTopic.trim(),
          district: writerDistrict,
        });
        const draftRes = await apiClient.ai.generateNewsDraft({
          title: writerTopic.trim(),
          notes: `${res.topicSummary}\n${(res.factBreakdown?.confirmedFacts || []).join('\n')}`,
          district: writerDistrict,
          format: writerFormat as any,
          language: 'hi',
        });
        setWriterResult(draftRes);
        showNotification('विषय अनुसंधान आधारित समाचार प्रारूप तैयार हुआ!');
      }
      loadHistoryAndUsage();
    } catch (err: any) {
      showNotification(err.message || 'समाचार निर्माण विफल', 'error');
    } finally {
      setWriterLoading(false);
    }
  };

  const handlePlaceWriterResultIntoPage = async () => {
    if (!writerResult) {
      showNotification('प्लेस करने हेतु पहले समाचार जनरेट करें।', 'error');
      return;
    }
    if (!writerTargetEditionId) {
      showNotification('कृपया लक्ष्य ई-पेपर संस्करण चुनें।', 'error');
      return;
    }
    setWriterIsPlacing(true);
    try {
      const headline = writerResult.headline || customTitle || 'एआई जनरेटेड समाचार';
      const summary = writerResult.leadParagraph || writerResult.summary || '';
      const content = writerResult.fullContent || writerResult.body || writerResult.leadParagraph || '';
      const draft = await apiClient.reporter.createDraft({
        title: headline,
        summary,
        content,
        districtId: writerDistrict || 'bhopal',
        categoryId: writerCategory || 'madhya-pradesh',
        isBreaking: false,
      });

      await apiClient.epaper.updateArticleWorkflowStatus(draft.id, {
        targetStatus: 'APPROVED_FOR_EPAPER',
        remarks: 'AI Writer placement into e-paper',
      });

      await apiClient.epaper.assignArticlesToPage(writerTargetEditionId, {
        pageNumber: writerTargetPageNum,
        articleIds: [draft.id],
        colSpan: writerTargetColSpan,
        role: writerTargetRole,
      });

      showNotification(`समाचार ई-पेपर संस्करण के पृष्ठ ${writerTargetPageNum} पर सफलतापूर्वक आवंटित हो गया!`);
    } catch (err: any) {
      showNotification(err.message || 'ई-पेपर पृष्ठ पर समाचार आवंटन विफल', 'error');
    } finally {
      setWriterIsPlacing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-bold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>ई-पेपर एआई न्यूज़रूम व डिज़ाइन स्टूडियो (STEP 9)</span>
          </div>
          <h2 className="text-xl font-bold text-white">संपादकीय एआई सहायक एवं समाचार पत्र डिज़ाइन टूलकिट</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            देवनागरी पत्रकारिता हेतु विशेष 5-स्तरीय हेडलाइन, तथ्य-परीक्षण, व्याकरण सुधार, 9-टेम्पलेट विन्यास एवं सुरक्षित कम्पोज़िशन।
            (एआई केवल सहायक है; प्रकाशन व अनुमोदन अधिकार केवल संपादक के पास सुरक्षित हैं)
          </p>
        </div>

        {/* Quota & Usage Mini Badge */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 flex items-center gap-4 text-xs">
          <div>
            <div className="text-[10px] text-purple-300 font-semibold">दैनिक अनुरोध सीमा</div>
            <div className="font-bold text-white text-sm">
              {usageStats?.todayRequests || 0} / {usageStats?.dailyLimit || 50}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-white/20" />
          <div>
            <div className="text-[10px] text-emerald-300 font-semibold">स्थिति</div>
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              सक्रिय (Live Pool)
            </div>
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('editorial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'editorial'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. संपादकीय सहायक (Editorial)</span>
          </button>
          <button
            onClick={() => setActiveTab('writer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'writer'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. एआई समाचार लेखक (AI Writer)</span>
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'verification'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. तथ्य-परीक्षण व सत्यापन (Verification)</span>
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'design'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>4. पेज डिज़ाइन व टेम्पलेट (Design)</span>
          </button>
          <button
            onClick={() => setActiveTab('graphics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'graphics'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>5. दृश्य व ग्राफिक सहायता (Graphics)</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>6. उपयोग व ऑडिट इतिहास (Audit)</span>
          </button>
        </div>
      </div>

      {/* Shared Context & Article Selector (For Tabs 1, 2, 4) */}
      {['editorial', 'verification', 'graphics'].includes(activeTab) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">समीक्षाधीन समाचार चुनें अथवा नया आलेख प्रविष्ट करें:</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-500 font-medium">सूची में से चयन:</label>
              <select
                value={selectedArticleId}
                onChange={(e) => setSelectedArticleId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- कस्टम टेक्स्ट इनपुट --</option>
                {articles.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.title.slice(0, 45)}... ({art.districtName || (art as any).district || 'मध्य प्रदेश'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3 space-y-2">
              <input
                type="text"
                placeholder="समाचार शीर्षक (Headline)..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                rows={3}
                placeholder="समाचार की मुख्य सामग्री (Article Content)..."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
              <div>
                <label className="text-slate-500 font-medium block mb-1">संबंधित जिला:</label>
                <input
                  type="text"
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkBreaking"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="chkBreaking" className="text-xs font-bold text-red-600">
                  ब्रेकिंग न्यूज़ (Breaking)
                </label>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                कुल अक्षर: <span className="font-bold text-slate-700">{customContent.length}</span> | शब्द:{' '}
                <span className="font-bold text-slate-700">
                  {customContent.trim() ? customContent.trim().split(/\s+/).length : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: EDITORIAL ASSISTANT                                     */}
      {/* ============================================================== */}
      {activeTab === 'editorial' && (
        <div className="space-y-4">
          {/* Sub-modes navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setEditorialSubMode('headlines')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                editorialSubMode === 'headlines' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1.1 5-स्तरीय हेडलाइन्स (Headlines)
            </button>
            <button
              onClick={() => setEditorialSubMode('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                editorialSubMode === 'summary' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1.2 सारगर्भित सारांश (Summary)
            </button>
            <button
              onClick={() => setEditorialSubMode('copyedit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                editorialSubMode === 'copyedit' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1.3 देवनागरी वर्तनी व भाषा (Copy-Edit)
            </button>
            <button
              onClick={() => setEditorialSubMode('structure')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                editorialSubMode === 'structure' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1.4 उल्टा पिरामिड संरचना (Structure)
            </button>
            <button
              onClick={() => setEditorialSubMode('translate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                editorialSubMode === 'translate' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1.5 द्विभाषी अनुवाद (Translation)
            </button>
          </div>

          {/* Submode 1.1: Headlines */}
          {editorialSubMode === 'headlines' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">5-स्तरीय मानक ब्रॉडशीट हेडलाइन्स</h3>
                  <p className="text-xs text-slate-500">
                    पांच सटीक वर्ण श्रेणियों में हेडलाइन (पूर्ण विराम चिन्ह '।' व '.' निषिद्ध, 100% तथ्य सुरक्षित)
                  </p>
                </div>
                <button
                  onClick={handleGenerateHeadlines}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'तैयार हो रहा है...' : 'हेडलाइन सुझाव उत्पन्न करें'}</span>
                </button>
              </div>

              {headlineResult ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                    <span>
                      मॉडल:{' '}
                      <strong className="text-slate-700">
                        {headlineResult.provider} ({headlineResult.model})
                      </strong>
                    </span>
                    <span>
                      समय: <strong className="text-slate-700">{headlineResult.generationTimeMs}ms</strong>
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> सभी विकल्प मानक सीमा में
                    </span>
                  </div>

                  <div className="space-y-3">
                    {headlineResult.headlines.map((hl) => (
                      <div
                        key={hl.optionNumber}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                              विकल्प {hl.optionNumber}: {hl.style}
                            </span>
                            <span className="text-slate-500 text-[11px]">मानक सीमा: {hl.targetRange} अक्षर</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                hl.isValidLength
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {hl.characterCount} अक्षर {hl.isValidLength ? '✓' : '!'}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm font-bold text-slate-900 leading-snug font-serif">
                          {hl.headline}
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => copyToClipboard(hl.headline, `hl-${hl.optionNumber}`)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1"
                          >
                            {copiedKey === `hl-${hl.optionNumber}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>कॉपी करें</span>
                          </button>
                          <button
                            onClick={() =>
                              handleApplySuggestion(
                                'HEADLINE',
                                hl.headline,
                                `विकल्प ${hl.optionNumber} (${hl.style}) हेडलाइन स्वीकृत`
                              )
                            }
                            disabled={applying}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>स्वीकारें व लागू करें</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  शीर्षक व समाचार सामग्री का चयन कर "हेडलाइन सुझाव उत्पन्न करें" बटन दबाएं।
                </div>
              )}
            </div>
          )}

          {/* Submode 1.2: Summary */}
          {editorialSubMode === 'summary' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">संपादकीय सारांश व अनुपलब्ध तथ्यों की जांच</h3>
                  <p className="text-xs text-slate-500">
                    बिंदुवार मुख्य सार एवं पत्रकारिता की दृष्टि से छूटे हुए विवरणों की स्वतः पहचान
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateSummary('BULLETS')}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs disabled:opacity-50"
                  >
                    <span>बुलेट सारांश</span>
                  </button>
                  <button
                    onClick={() => handleGenerateSummary('SHORT')}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-xs disabled:opacity-50"
                  >
                    <span>संक्षिप्त (50 शब्द)</span>
                  </button>
                  <button
                    onClick={() => handleGenerateSummary('DETAILED')}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-xs disabled:opacity-50"
                  >
                    <span>विस्तृत सार</span>
                  </button>
                </div>
              </div>

              {summaryResult ? (
                <div className="space-y-4 pt-2">
                  {/* Missing details warnings */}
                  {summaryResult.missingDetailsFlags && summaryResult.missingDetailsFlags.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>संपादकीय सतर्कता: निम्नलिखित आवश्यक विवरण मूल समाचार में अनुपलब्ध हैं:</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5 pl-2">
                        {summaryResult.missingDetailsFlags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-purple-700 uppercase">मुख्य निष्कर्ष (Key Takeaway)</span>
                      <span>कुल शब्द: {summaryResult.wordCount}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
                      {summaryResult.keyTakeaway || summaryResult.summary}
                    </div>

                    {summaryResult.bulletPoints && summaryResult.bulletPoints.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-700">प्रमुख बिंदु (Bullet Points):</div>
                        <ul className="space-y-1">
                          {summaryResult.bulletPoints.map((pt, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-800 flex items-start gap-2 bg-white p-2 rounded-md border border-slate-100"
                            >
                              <span className="text-purple-600 font-bold">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => copyToClipboard(summaryResult.summary, 'sum-1')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1 bg-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>सारांश कॉपी करें</span>
                      </button>
                      <button
                        onClick={() =>
                          handleApplySuggestion('SUMMARY', summaryResult.summary, 'संपादकीय सारांश स्वीकृत')
                        }
                        disabled={applying}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>स्वीकारें व लागू करें</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  सारांश उत्पन्न करने के लिए ऊपर दिए गए विकल्पों में से किसी एक पर क्लिक करें।
                </div>
              )}
            </div>
          )}

          {/* Submode 1.3: Copy-Editing */}
          {editorialSubMode === 'copyedit' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">देवनागरी व्याकरण व वर्तनी सुधार (Side-by-Side)</h3>
                  <p className="text-xs text-slate-500">
                    की/कि, है/हैं, नुक्ता (ज़, फ़) एवं पत्रकारिता शैली सुधारों का सूक्ष्म तुलनात्मक विश्लेषण
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyEdit('NEUTRAL')}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs disabled:opacity-50"
                  >
                    <span>मानक व्याकरण सुधार</span>
                  </button>
                  <button
                    onClick={() => handleCopyEdit('BREAKING')}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-xs disabled:opacity-50"
                  >
                    <span>तीव्र गति (Breaking)</span>
                  </button>
                  <button
                    onClick={() => handleCopyEdit('ANALYTICAL')}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-xs disabled:opacity-50"
                  >
                    <span>विश्लेषणात्मक (Analytical)</span>
                  </button>
                </div>
              </div>

              {copyEditResult ? (
                <div className="space-y-4 pt-2">
                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                        <span>मूल समाचार (Original)</span>
                        <span className="text-[10px] text-slate-400">अपरिवर्तित</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                        {copyEditResult.originalContent}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                      <div className="text-xs font-bold text-emerald-800 flex items-center justify-between">
                        <span>संपादित व शुद्ध समाचार (Revised)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                          पठनीयता: {copyEditResult.readabilityScore}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs text-slate-900 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-medium">
                        {copyEditResult.revisedContent}
                      </div>
                    </div>
                  </div>

                  {/* Corrections itemization */}
                  {copyEditResult.correctionsMade && copyEditResult.correctionsMade.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>किए गए व्याकरण व वर्तनी सुधार ({copyEditResult.correctionsMade.length}):</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {copyEditResult.correctionsMade.map((cor, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-purple-700">{cor.rule || cor.type}</span>
                              <span className="text-slate-400">सुधार #{idx + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="line-through text-red-500 font-medium">{cor.before}</span>
                              <span className="text-slate-400">→</span>
                              <span className="text-emerald-700 font-bold">{cor.after}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">{cor.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => copyToClipboard(copyEditResult.revisedContent, 'ce-1')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>संपादित पाठ कॉपी करें</span>
                    </button>
                    <button
                      onClick={() =>
                        handleApplySuggestion(
                          'COPY_EDIT',
                          copyEditResult.revisedContent,
                          'संपादकीय व्याकरण व भाषा सुधार स्वीकृत'
                        )
                      }
                      disabled={applying}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>स्वीकारें व लागू करें</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  समाचार सामग्री का चयन कर "मानक व्याकरण सुधार" पर क्लिक करें।
                </div>
              )}
            </div>
          )}

          {/* Submode 1.4: Structure */}
          {editorialSubMode === 'structure' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">उल्टा पिरामिड (Inverted Pyramid) संरचना व पठनीयता</h3>
                  <p className="text-xs text-slate-500">
                    मुखड़ा (Lead), विस्तार एवं निष्कर्ष का तार्किक क्रम, पुनरावृत्ति एवं अति-दीर्घ वाक्यों की पहचान
                  </p>
                </div>
                <button
                  onClick={handleAnalyzeStructure}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>संरचना का विश्लेषण करें</span>
                </button>
              </div>

              {structureResult ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-200 p-3 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-purple-900">संरचना स्कोर (Journalism Structure Score):</span>
                    </div>
                    <span className="text-base font-bold text-purple-700">
                      {structureResult.overallStructureScore} / 100
                    </span>
                  </div>

                  {/* Section Breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800">समाचार खंड विभाजन (Section Breakdown):</div>
                    <div className="space-y-2">
                      {structureResult.sections.map((sec, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-purple-800">{sec.titleHi}</span>
                            <span className="text-[11px] text-slate-500">
                              {sec.wordCount} शब्द | मूल्यांकन: {sec.assessment}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                            {sec.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Repetitive and unclear warnings */}
                  {(structureResult.repetitivePassages.length > 0 || structureResult.unclearSentences.length > 0) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                      {structureResult.repetitivePassages.length > 0 && (
                        <div>
                          <span className="font-bold text-amber-900">पहचानी गई पुनरावृत्तियां:</span>
                          <ul className="list-disc list-inside text-amber-800 mt-1 pl-2">
                            {structureResult.repetitivePassages.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {structureResult.unclearSentences.length > 0 && (
                        <div>
                          <span className="font-bold text-amber-900">अति-दीर्घ अथवा अस्पष्ट वाक्य:</span>
                          <ul className="list-disc list-inside text-amber-800 mt-1 pl-2">
                            {structureResult.unclearSentences.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommendations */}
                  {structureResult.recommendations && structureResult.recommendations.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span>संपादकीय सुझाव (Editorial Recommendations):</span>
                      </div>
                      <ul className="list-disc list-inside text-blue-800 pl-2">
                        {structureResult.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  समाचार का चयन कर "संरचना का विश्लेषण करें" बटन दबाएं।
                </div>
              )}
            </div>
          )}

          {/* Submode 1.5: Translate */}
          {editorialSubMode === 'translate' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">द्विभाषी अनुवाद (हिंदी ↔ अंग्रेजी)</h3>
                  <p className="text-xs text-slate-500">
                    व्यक्तिवाचक संज्ञा, तिथियां, आंकड़े सुरक्षित रखते हुए अनुवाद (मानवीय संपादन अनिवार्य)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTranslate('en')}
                    disabled={loading}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs disabled:opacity-50"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>हिंदी → अंग्रेजी (Translate to English)</span>
                  </button>
                  <button
                    onClick={() => handleTranslate('hi')}
                    disabled={loading}
                    className="px-3.5 py-1.5 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-xs disabled:opacity-50"
                  >
                    <span>English → हिंदी</span>
                  </button>
                </div>
              </div>

              {translationResult ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      सावधानी: यह एक प्रारंभिक अनुवाद मसौदा है। प्रकाशन से पूर्व भाषा व तथ्यों की मानवीय पुष्टि अनिवार्य है।
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-700">अनुवाद परिणाम ({translationResult.targetLanguage}):</span>
                      <span>
                        स्रोत भाषा: <strong>{translationResult.sourceLanguage}</strong>
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-900 leading-relaxed whitespace-pre-wrap font-medium">
                      {translationResult.translatedText}
                    </div>

                    {translationResult.preservedEntities && translationResult.preservedEntities.length > 0 && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        सुरक्षित रखे गए आंकड़े व इकाइयां: {translationResult.preservedEntities.join(', ')}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => copyToClipboard(translationResult.translatedText, 'tr-1')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>अनुवाद कॉपी करें</span>
                      </button>
                      <button
                        onClick={() =>
                          handleApplySuggestion(
                            'TRANSLATION',
                            translationResult.translatedText,
                            'द्विभाषी अनुवाद स्वीकृत'
                          )
                        }
                        disabled={applying}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>स्वीकारें व लागू करें</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  अनुवाद करने के लिए ऊपर दिए गए अनुवाद बटन पर क्लिक करें।
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: AI NEWS WRITER & E-PAPER COMPOSER (WORKFLOW A, B, C)    */}
      {/* ============================================================== */}
      {activeTab === 'writer' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  एआई समाचार लेखक व ई-पेपर कम्पोज़र (AI News Writer & Composer)
                </h3>
                <p className="text-xs text-slate-500">
                  कच्ची स्क्रिप्ट अथवा विषय/यूआरएल से पत्रकारिता-सम्मत समाचार तैयार करें और सीधे ई-पेपर पृष्ठ पर प्लेस करें
                </p>
              </div>

              {/* Sub-mode selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setWriterSubMode('RAW_SCRIPT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    writerSubMode === 'RAW_SCRIPT'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  वर्कफ्लो A: कच्ची स्क्रिप्ट
                </button>
                <button
                  type="button"
                  onClick={() => setWriterSubMode('TOPIC_URL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    writerSubMode === 'TOPIC_URL'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  वर्कफ्लो B: विषय / वेब यूआरएल
                </button>
              </div>
            </div>

            {/* Inputs based on Sub-mode */}
            {writerSubMode === 'RAW_SCRIPT' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार प्रारूप (Format):</label>
                    <select
                      value={writerFormat}
                      onChange={(e) => setWriterFormat(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="DETAILED">विस्तृत रिपोर्ट (450 शब्द)</option>
                      <option value="SHORT">संक्षिप्त समाचार (150 शब्द)</option>
                      <option value="BREAKING">ब्रेकिंग न्यूज़ फ्लैश (100 शब्द)</option>
                      <option value="POLITICAL">राजनीतिक हलचल (400 शब्द)</option>
                      <option value="DISTRICT">जिला आंचलिक समाचार (300 शब्द)</option>
                      <option value="CRIME">अपराध व सुरक्षा (350 शब्द)</option>
                      <option value="GOVERNMENT">शासकीय योजना/नीति (350 शब्द)</option>
                      <option value="SPECIAL_REPORT">विशेष पड़ताल (600 शब्द)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">संबंधित जिला (District):</label>
                    <input
                      type="text"
                      value={writerDistrict}
                      onChange={(e) => setWriterDistrict(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-purple-500"
                      placeholder="उदा. भोपाल, इंदौर, जबलपुर"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">श्रेणी (Category):</label>
                    <select
                      value={writerCategory}
                      onChange={(e) => setWriterCategory(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="STATE">मध्य प्रदेश (State)</option>
                      <option value="CITY">भोपाल / नगर (City)</option>
                      <option value="POLITICS">राजनीति (Politics)</option>
                      <option value="CRIME">अपराध (Crime)</option>
                      <option value="BUSINESS">व्यापार (Business)</option>
                      <option value="SPORTS">खेल (Sports)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    कच्ची स्क्रिप्ट / संवाददाता नोट्स (Raw Script / Bullet Points):
                  </label>
                  <textarea
                    rows={5}
                    value={writerRawScript}
                    onChange={(e) => setWriterRawScript(e.target.value)}
                    placeholder="संवाददाता द्वारा भेजी गई कच्ची स्क्रिप्ट, प्रत्यक्षदर्शी बयान, आंकड़े, पुलिस अथवा प्रशासनिक वक्तव्य, घटना का समय व स्थान दर्ज करें..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateRawScriptDraft}
                    disabled={writerLoading || !writerRawScript.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{writerLoading ? 'समाचार तैयार हो रहा है...' : 'एआई समाचार ड्राफ्ट बनाएं'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार विषय (News Topic):</label>
                    <input
                      type="text"
                      value={writerTopic}
                      onChange={(e) => setWriterTopic(e.target.value)}
                      placeholder="उदा. मध्य प्रदेश में नई सौर ऊर्जा नीति 2026"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">संबंधित जिला (District):</label>
                    <input
                      type="text"
                      value={writerDistrict}
                      onChange={(e) => setWriterDistrict(e.target.value)}
                      placeholder="उदा. मध्य प्रदेश, भोपाल"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    बाह्य संदर्भ अथवा स्रोत यूआरएल (External URL - Optional):
                  </label>
                  <input
                    type="url"
                    value={writerUrl}
                    onChange={(e) => setWriterUrl(e.target.value)}
                    placeholder="https://example.com/press-release"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-1 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    नोट: यदि यूआरएल दुर्गम या अनुपलब्ध है तो प्रणाली पारदर्शी चेतावनी देगी; किसी भी फर्जी तथ्य का निर्माण नहीं होगा।
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateTopicUrlDraft}
                    disabled={writerLoading || (!writerTopic.trim() && !writerUrl.trim())}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{writerLoading ? 'सामग्री विश्लेषित हो रही है...' : 'स्रोत विश्लेषण व समाचार तैयार करें'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Generated Output Preview & E-Paper Placement Desk */}
            {writerResult && (
              <div className="mt-5 pt-4 border-t border-slate-200 space-y-4 animate-in fade-in">
                {writerResult.sourceExtractionFailed && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>स्रोत निष्कर्षण चेतावनी:</strong> बाह्य वेब स्रोत से सीधे तथ्य प्राप्त नहीं हो सके। पत्रकारिता सत्यनिष्ठा नियम के तहत कोई भी मनगढ़ंत विवरण नहीं जोड़ा गया।
                    </span>
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      तैयार समाचार प्रारूप (Editable Draft)
                    </span>
                    <button
                      onClick={() => copyToClipboard(writerResult.fullContent || writerResult.leadParagraph || '', 'writer-copy')}
                      className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey === 'writer-copy' ? 'कॉपी हो गया' : 'टेक्स्ट कॉपी करें'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">मुख्य शीर्षक (Headline):</label>
                    <input
                      type="text"
                      value={writerResult.headline || ''}
                      onChange={(e) => setWriterResult({ ...writerResult, headline: e.target.value })}
                      className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white"
                    />
                  </div>

                  {writerResult.subHeadline && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">उप-शीर्षक (Sub-headline):</label>
                      <input
                        type="text"
                        value={writerResult.subHeadline || ''}
                        onChange={(e) => setWriterResult({ ...writerResult, subHeadline: e.target.value })}
                        className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 text-slate-800 bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">लीड परिच्छेद (5Ws + 1H Lead):</label>
                    <textarea
                      rows={2}
                      value={writerResult.leadParagraph || ''}
                      onChange={(e) => setWriterResult({ ...writerResult, leadParagraph: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">विस्तृत समाचार सामग्री (Full Body):</label>
                    <textarea
                      rows={6}
                      value={writerResult.fullContent || writerResult.body || writerResult.leadParagraph || ''}
                      onChange={(e) => setWriterResult({ ...writerResult, fullContent: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white leading-relaxed"
                    />
                  </div>
                </div>

                {/* Workflow C: Placement Desk into E-Paper Page */}
                <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-purple-700" />
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                      वर्कफ्लो C: ई-पेपर पृष्ठ व लेआउट स्लॉट आवंटन (E-Paper Page Placement)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">लक्ष्य ई-पेपर संस्करण:</label>
                      <select
                        value={writerTargetEditionId}
                        onChange={(e) => setWriterTargetEditionId(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
                      >
                        {editions.map((ed) => (
                          <option key={ed.id} value={ed.id}>
                            {ed.title} ({ed.editionType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">लक्ष्य पृष्ठ (Page Number):</label>
                      <select
                        value={writerTargetPageNum}
                        onChange={(e) => setWriterTargetPageNum(Number(e.target.value))}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-900 bg-white font-bold"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                          <option key={p} value={p}>
                            पृष्ठ {p} {p === 1 ? '(प्रथम पृष्ठ / Front Page)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">कॉलम विस्तार (Columns):</label>
                      <select
                        value={writerTargetColSpan}
                        onChange={(e) => setWriterTargetColSpan(Number(e.target.value))}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
                      >
                        <option value={1}>1 कॉलम (संक्षिप्त/सिंगल)</option>
                        <option value={2}>2 कॉलम (मध्यम/सामान्य)</option>
                        <option value={3}>3 कॉलम (प्रमुख/लीड)</option>
                        <option value={4}>4 कॉलम (फुल विड्थ/बैनर)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">स्थान भूमिका (Role):</label>
                      <select
                        value={writerTargetRole}
                        onChange={(e) => setWriterTargetRole(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
                      >
                        <option value="LEAD">प्रमुख खबर (Lead Story)</option>
                        <option value="SECONDARY">द्वितीयक खबर (Secondary)</option>
                        <option value="BRIEF">संक्षिप्त समाचार (Brief)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePlaceWriterResultIntoPage}
                      disabled={writerIsPlacing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{writerIsPlacing ? 'आवंटित हो रहा है...' : 'ई-पेपर पृष्ठ पर जोड़ें'}</span>
                    </button>

                    {onOpenDesigner && writerTargetEditionId && (
                      <button
                        type="button"
                        onClick={() => onOpenDesigner(writerTargetEditionId, writerTargetPageNum)}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layout className="w-3.5 h-3.5" />
                        <span>पेज डिज़ाइनर में खोलें (Open in Designer)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FACT-CHECKING & VERIFICATION PANEL                      */}
      {/* ============================================================== */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">तथ्य-परीक्षण व 10-सूत्रीय संपादकीय सत्यापन</h3>
                <p className="text-xs text-slate-500">
                  प्रत्येक दावे का प्राथमिक स्रोतों से मिलान, विसंगतियों की पहचान एवं स्वचालित अनुमोदन का पूर्ण निषेध
                </p>
              </div>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-2xs disabled:opacity-50"
              >
                <ShieldCheck className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'सत्यापन जारी...' : 'तथ्यों का परीक्षण करें'}</span>
              </button>
            </div>

            {/* Source and evidence inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-700">प्राथमिक स्रोत लिंक अथवा आधिकारिक दस्तावेज (प्रति पंक्ति एक):</label>
                <textarea
                  rows={3}
                  placeholder="उदा. https://police.mp.gov.in/press-release/123 या कलेक्टर कार्यालय प्रेस विज्ञप्ति सं. 45"
                  value={sourcesInput}
                  onChange={(e) => setSourcesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-700">ऑन-ग्राउंड संवाददाता के साक्ष्य नोट्स (Evidence Notes):</label>
                <textarea
                  rows={3}
                  placeholder="उदा. मौके पर प्रत्यक्षदर्शियों के बयान, थाना प्रभारी से दूरभाष पर पुष्टि, अस्पताल मेडिकल रिपोर्ट"
                  value={evidenceNotesInput}
                  onChange={(e) => setEvidenceNotesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* Non-negotiable anti-auto-approval notice */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong>नियम BR-EDT-010 (स्वचालित अनुमोदन निषिद्ध):</strong> AI सिस्टम समाचार को कभी स्वतः अनुमोदित (Auto-Approve) नहीं करेगा।
                किसी भी दावे के समर्थन में स्रोत न होने पर वह सीधे 'UNVERIFIED' चिह्नित होगा। अंतिम प्रकाशन निर्णय अधिकृत संपादक द्वारा ही होगा।
              </div>
            </div>

            {verificationResult && (
              <div className="space-y-4 pt-3">
                {/* Overall Status Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    verificationResult.overallStatus === 'VERIFIED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : verificationResult.overallStatus === 'CONTRADICTED'
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider">समग्र सत्यापन स्थिति</div>
                    <div className="text-base font-bold mt-0.5">{verificationResult.overallStatus}</div>
                    <div className="text-xs opacity-85 mt-0.5">{verificationResult.editorialActionRequired}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold opacity-75">सत्यापन स्कोर</div>
                    <div className="text-2xl font-bold">{verificationResult.overallVerificationScore}%</div>
                  </div>
                </div>

                {/* Contradictions & Missing Sources Alerts */}
                {verificationResult.contradictionsFound.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>विसंगति अथवा विरोधाभास (Contradictions Found):</span>
                    </div>
                    <ul className="list-disc list-inside pl-2">
                      {verificationResult.contradictionsFound.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {verificationResult.missingSourceFlags.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>अपुष्ट दावे (Missing Supporting Sources):</span>
                    </div>
                    <ul className="list-disc list-inside pl-2">
                      {verificationResult.missingSourceFlags.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Claims Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">विश्लेषित दावों की विस्तृत सूची (Claims Breakdown):</div>
                  <div className="space-y-2">
                    {verificationResult.claims.map((claim) => (
                      <div
                        key={claim.claimNumber}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">दावा #{claim.claimNumber}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                              प्रकार: {claim.type}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              claim.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : claim.status === 'CONTRADICTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {claim.status} ({claim.confidencePercent}%)
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900">{claim.claimText}</p>
                        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                          साक्ष्य सार: {claim.evidenceSummary}
                        </div>
                        {claim.matchedSourceSnippet && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            स्रोतः {claim.matchedSourceSnippet}
                          </div>
                        )}
                        <div className="text-[11px] text-purple-700 font-medium">
                          संपादकीय परामर्श: {claim.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10-Point Checklist Evaluation */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-800">
                    10-सूत्रीय संपादकीय चेकलिस्ट (10-Point Editorial Verification Checklist):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {verificationResult.checklistEvaluation.map((pt) => (
                      <div
                        key={pt.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          pt.passed
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {pt.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-400 shrink-0" />
                          )}
                          <span className="font-semibold">{pt.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{pt.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PAGE DESIGN & COMPOSITION ASSISTANT                     */}
      {/* ============================================================== */}
      {activeTab === 'design' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">समाचार पत्र पृष्ठ डिज़ाइन व संरचना सहायक</h3>
                <p className="text-xs text-slate-500">
                  9 मानक ब्रॉडशीट टेम्पलेट्स में से उपयुक्त टेम्पलेट सिफारिश, विज़ुअल बैलेंस स्कोर एवं फॉन्ट ओवरफ्लो जोखिम
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-slate-600 font-bold">पृष्ठ संख्या (Page #):</label>
                  <select
                    value={targetPageNumber}
                    onChange={(e) => setTargetPageNumber(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                      <option key={p} value={p}>
                        पृष्ठ {p} {p === 1 ? '(Front Page)' : p === 4 ? '(Editorial)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGetDesignSuggestions}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-2xs disabled:opacity-50"
                >
                  <Layout className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>टेम्पलेट व लेआउट सुझाव</span>
                </button>

                <button
                  onClick={handleProposeComposition}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-purple-600 text-purple-700 hover:bg-purple-50 font-bold text-xs flex items-center gap-2 shadow-2xs disabled:opacity-50"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>पेज कम्पोज़िशन प्रस्ताव</span>
                </button>
              </div>
            </div>

            {/* Design Suggestion Results */}
            {designResult && (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                    <div className="text-[11px] font-bold text-purple-700 uppercase">अनुशंसित टेम्पलेट</div>
                    <div className="text-base font-bold text-purple-950">{designResult.recommendedTemplateName}</div>
                    <div className="text-xs text-purple-800">{designResult.reasoning}</div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">दृश्य संतुलन (Visual Balance)</div>
                    <div className="text-2xl font-bold text-slate-900">{designResult.visualBalanceScore} / 100</div>
                    <div className="text-xs text-slate-600">लेआउट घनत्व: {designResult.layoutDensity}</div>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 space-y-1">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>विज्ञापन स्लॉट सुरक्षा</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-900">शत-प्रतिशत सुरक्षित</div>
                    <div className="text-xs text-emerald-700">कोई विज्ञापन स्लॉट विस्थापित नहीं होगा।</div>
                  </div>
                </div>

                {/* Overcrowded or Underutilized areas */}
                {(designResult.overcrowdedAreas.length > 0 || designResult.underutilizedAreas.length > 0) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-800">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>दृश्य संतुलन समायोजन (Visual Balance Alerts):</span>
                    </div>
                    {designResult.overcrowdedAreas.map((a, i) => (
                      <div key={i}>• {a}</div>
                    ))}
                    {designResult.underutilizedAreas.map((a, i) => (
                      <div key={i}>• {a}</div>
                    ))}
                  </div>
                )}

                {/* Devanagari typography overflow risks */}
                {designResult.textOverflowRisks && designResult.textOverflowRisks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800">
                      संभावित देवनागरी शीर्षक/पाठ ओवरफ्लो (Typography Overflow Risks):
                    </div>
                    <div className="space-y-2">
                      {designResult.textOverflowRisks.map((risk, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{risk.headlineOrSnippet}</span>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              अनुमानित पंक्तियां: {risk.estimatedLines} | सुझाव: {risk.mitigation}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              risk.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            जोखिम: {risk.riskLevel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onOpenDesigner && editions[0] && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onOpenDesigner(editions[0].id, targetPageNumber)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>पेज डिज़ाइनर में यह लेआउट खोलें</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Composition Proposal Results */}
            {compositionResult && (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    पेज {compositionResult.pageNumber} कम्पोज़िशन योजना ({compositionResult.templateName})
                  </h4>
                  <span className="text-xs text-purple-700 font-bold">
                    कुल संयोजित समाचार: {compositionResult.totalStoriesPlaced}
                  </span>
                </div>

                <div className="space-y-2">
                  {compositionResult.storyPlacements.map((st, i) => (
                    <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-700">#{i + 1} {st.positionDesc}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            स्पैन: {st.columnSpan} कॉलम
                          </span>
                        </div>
                        {st.suggestedCrop && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                            क्रॉप: {st.suggestedCrop}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900">{st.title}</div>
                      <div className="text-[11px] text-slate-500">{st.rationale}</div>
                    </div>
                  ))}
                </div>

                {compositionResult.unplacedStories.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <strong>स्थान सीमा के कारण शेष समाचार (अगले पृष्ठ हेतु):</strong>{' '}
                    {compositionResult.unplacedStories.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: GRAPHIC & VISUAL ASSISTANCE                             */}
      {/* ============================================================== */}
      {activeTab === 'graphics' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">समाचार पत्र दृश्य एवं ग्राफिक सहायता</h3>
                <p className="text-xs text-slate-500">
                  छवियों के अनुपात (Aspect Ratios), समाचार कैप्शन एवं एआई सांकेतिक दृश्य डिस्क्लेमर
                </p>
              </div>
              <button
                onClick={handleGetGraphicSuggestions}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-2xs disabled:opacity-50"
              >
                <ImageIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>दृश्य व कैप्शन सुझाव प्राप्त करें</span>
              </button>
            </div>

            {/* Ethical Notice: No fake documentary photos */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">पत्रकारिता प्रामाणिकता निर्देश:</strong> वास्तविक समाचार घटनाओं की फर्जी अथवा
                काल्पनिक तस्वीरें उत्पन्न करना पूर्णतः वर्जित है। एआई द्वारा सुझाए गए सभी विज़ुअल्स केवल
                सांकेतिक/ग्राफिक उद्देश्यों हेतु हैं और उन पर 'सांकेतिक/एआई-जनरेटेड दृश्य' का स्पष्ट डिस्क्लेमर अंकित होना अनिवार्य है।
              </div>
            </div>

            {graphicResult && (
              <div className="space-y-4 pt-2">
                {/* Visual Concepts */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">अनुशंसित दृश्य अवधारणाएं (Visual Concepts):</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {graphicResult.visualConcepts.map((concept, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800">
                        <span className="font-bold text-purple-700 block mb-1">अवधारणा {i + 1}</span>
                        {concept}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aspect ratios */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    अखबार ब्रॉडशीट हेतु अनुशंसित क्रॉप अनुपात (Crop Aspect Ratios):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {graphicResult.recommendedCropAspectRatios.map((cr, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                        <span className="font-bold text-purple-700 text-sm">{cr.ratio}</span>
                        <p className="text-slate-600">{cr.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Captions */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">पत्रकारिता फोटो कैप्शन सुझाव:</div>
                  <div className="space-y-2">
                    {graphicResult.suggestedCaptions.map((cap, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <p className="font-medium text-slate-900">{cap}</p>
                        <button
                          onClick={() => copyToClipboard(cap, `cap-${i}`)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1 bg-white shrink-0 ml-3"
                        >
                          <Copy className="w-3 h-3" />
                          <span>कॉपी</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: AI USAGE & AUDIT HISTORY                                */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">एआई न्यूज़रूम गतिविधि एवं ऑडिट इतिहास</h3>
                <p className="text-xs text-slate-500">
                  प्रत्येक एआई अनुरोध, लागू किए गए संपादकीय सुधार एवं उपयोगिता रिकॉर्ड
                </p>
              </div>
              <button
                onClick={loadHistoryAndUsage}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ताज़ा करें</span>
              </button>
            </div>

            {historyItems.length > 0 ? (
              <div className="space-y-2">
                {historyItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-700">{item.category}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-medium">{item.userRole} ({item.userId})</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(item.timestamp).toLocaleString('hi-IN')}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900">
                        {item.headline || item.summary || item.articleTitle || 'संपादकीय सहायता अनुरोध'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                        {item.provider} / {item.model}
                      </span>
                      {item.wasApplied && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          लागू किया गया (Applied)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                अभी तक कोई एआई अनुरोध रिकॉर्ड उपलब्ध नहीं है।
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
