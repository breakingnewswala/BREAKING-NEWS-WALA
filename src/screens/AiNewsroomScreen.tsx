/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master AI Newsroom & Intelligent Automation Screen
 * 
 * Comprehensive Editorial AI Suite for Hyperlocal News:
 * 1. AI News Writer (8 journalistic formats, fact preservation, allegation isolation)
 * 2. 5-Tier Headline Generator (Strict 80-110, 100-130, 125-150, 130-160, 150-200 char ranges, 0 trailing full stops)
 * 3. News Summarizer & Rewriter (Short, Detailed, Bullets, Tones, Hindi/English, Grammar & Devanagari spelling fix)
 * 4. Fact-Checking Assistant (Claims decomposition, 10-point checklist, VERIFIED/UNVERIFIED classification)
 * 5. News Research Assistant (Dossier, Timeline, Facts vs Claims vs Opinions, Field questions)
 * 6. Social Media Caption Generator (FB, IG, X <= 280 chars, WhatsApp bulletin, YouTube)
 * 7. SEO Assistant (Meta title <= 60 chars, Meta description 140-160 chars, Keywords, Slugs, Schema)
 * 8. AI Content History (Audit trail, 1-click Save as Newsroom Draft)
 * 9. Prompt Library (System & task templates, category filtering)
 * 10. AI Usage & Quotas (Daily quotas, token counts, cost estimate in INR)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  FileText,
  Heading,
  AlignLeft,
  CheckCircle,
  AlertTriangle,
  Search,
  Share2,
  Globe,
  History,
  BookOpen,
  BarChart3,
  Copy,
  Check,
  RefreshCw,
  Send,
  Save,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Info,
  Sliders,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import {
  ArticleItem,
  AiNewsFormat,
  AiLanguage,
  HeadlineOptionItem,
  AiFactCheckResponse,
  AiResearchResponse,
  AiSocialMediaResponse,
  AiSeoResponse,
  AiPromptItem,
  AiContentHistoryItem,
  AiUsageRecord
} from '../types';
import { apiClient } from '../services/apiClient';

export interface AiNewsroomScreenProps {
  currentUser?: { id: string; name?: string; fullName?: string; role?: string; roles?: string[] };
  articles?: ArticleItem[];
  districts?: Array<string | { nameHi?: string; nameEn?: string; slug?: string; name?: string }>;
  categories?: Array<string | { nameHi?: string; nameEn?: string; slug?: string; name?: string }>;
  onNavigateToArticles?: () => void;
  onSelectArticle?: (article: ArticleItem) => void;
}

type AiTab =
  | 'dashboard'
  | 'writer'
  | 'headlines'
  | 'summarizer'
  | 'factcheck'
  | 'research'
  | 'social'
  | 'seo'
  | 'history'
  | 'prompts'
  | 'usage';

export const AiNewsroomScreen: React.FC<AiNewsroomScreenProps> = ({
  currentUser,
  articles = [],
  districts = [],
  categories = [],
  onNavigateToArticles
}) => {
  const [activeTab, setActiveTab] = useState<AiTab>('dashboard');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Common Provider info
  const [providersInfo, setProvidersInfo] = useState<{
    activeProvider: string;
    models: any[];
    roleQuotas: Record<string, number>;
  }>({
    activeProvider: 'mock',
    models: [],
    roleQuotas: {}
  });

  // Usage stats
  const [usageStats, setUsageStats] = useState<{
    totalCalls: number;
    totalTokens: number;
    totalCostInr: number;
    userRole: string;
    dailyQuota: number;
    remainingCallsToday: number;
    callsByCategory: Record<string, number>;
    recentRecords: AiUsageRecord[];
  }>({
    totalCalls: 0,
    totalTokens: 0,
    totalCostInr: 0,
    userRole: 'REPORTER',
    dailyQuota: 50,
    remainingCallsToday: 50,
    callsByCategory: {},
    recentRecords: []
  });

  // 1. AI News Writer State
  const [writerTitle, setWriterTitle] = useState('');
  const [writerFacts, setWriterFacts] = useState('');
  const [writerDistrict, setWriterDistrict] = useState('भोपाल');
  const [writerFormat, setWriterFormat] = useState<AiNewsFormat>('DETAILED');
  const [writerLang, setWriterLang] = useState<AiLanguage>('hi');
  const [writerClaims, setWriterClaims] = useState('');
  const [writerNotes, setWriterNotes] = useState('');
  const [writerLoading, setWriterLoading] = useState(false);
  const [writerResult, setWriterResult] = useState<any | null>(null);

  // 2. Headline Generator State
  const [hlTitle, setHlTitle] = useState('');
  const [hlSummary, setHlSummary] = useState('');
  const [hlDistrict, setHlDistrict] = useState('भोपाल');
  const [hlLoading, setHlLoading] = useState(false);
  const [hlResult, setHlResult] = useState<any | null>(null);

  // 3. Summarizer & Rewriter State
  const [sumContent, setSumContent] = useState('');
  const [sumMode, setSumMode] = useState<'SHORT' | 'DETAILED' | 'BULLETS'>('BULLETS');
  const [rewriteTone, setRewriteTone] = useState<string>('NEUTRAL');
  const [sumLoading, setSumLoading] = useState(false);
  const [sumResult, setSumResult] = useState<any | null>(null);
  const [rewriteResult, setRewriteResult] = useState<any | null>(null);

  // 4. Fact Check State
  const [fcHeadline, setFcHeadline] = useState('');
  const [fcContent, setFcContent] = useState('');
  const [fcDistrict, setFcDistrict] = useState('भोपाल');
  const [fcSources, setFcSources] = useState('');
  const [fcEvidenceNotes, setFcEvidenceNotes] = useState('');
  const [fcLoading, setFcLoading] = useState(false);
  const [fcResult, setFcResult] = useState<AiFactCheckResponse | null>(null);

  // 5. Research Assistant State
  const [resTopic, setResTopic] = useState('');
  const [resDistrict, setResDistrict] = useState('भोपाल');
  const [resNotes, setResNotes] = useState('');
  const [resEntities, setResEntities] = useState('');
  const [resLoading, setResLoading] = useState(false);
  const [resResult, setResResult] = useState<AiResearchResponse | null>(null);

  // 6. Social Media State
  const [socHeadline, setSocHeadline] = useState('');
  const [socSummary, setSocSummary] = useState('');
  const [socDistrict, setSocDistrict] = useState('भोपाल');
  const [socUrl, setSocUrl] = useState('https://breakingnewswala.in');
  const [socLoading, setSocLoading] = useState(false);
  const [socResult, setSocResult] = useState<AiSocialMediaResponse | null>(null);

  // 7. SEO State
  const [seoTitle, setSeoTitle] = useState('');
  const [seoContent, setSeoContent] = useState('');
  const [seoDistrict, setSeoDistrict] = useState('भोपाल');
  const [seoCategory, setSeoCategory] = useState('मध्य प्रदेश');
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<AiSeoResponse | null>(null);

  // 8. History State
  const [historyItems, setHistoryItems] = useState<AiContentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');

  // 9. Prompts State
  const [promptsList, setPromptsList] = useState<AiPromptItem[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptCategoryFilter, setPromptCategoryFilter] = useState('ALL');

  // Load Initial Metadata
  useEffect(() => {
    loadProvidersAndUsage();
  }, []);

  const loadProvidersAndUsage = async () => {
    try {
      const [prov, usage] = await Promise.all([
        apiClient.ai.fetchProviders(),
        apiClient.ai.fetchUsageStats()
      ]);
      setProvidersInfo(prov);
      setUsageStats(usage);
    } catch (err: any) {
      console.warn('Failed to load AI meta:', err.message);
    }
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('क्लिपबोर्ड पर कॉपी किया गया!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. News Writer Handler
  const handleGenerateNews = async () => {
    if (!writerTitle && !writerFacts) {
      showToast('कृपया शीर्षक अथवा मुख्य तथ्य दर्ज करें।', true);
      return;
    }
    setWriterLoading(true);
    try {
      const factsArr = writerFacts.split('\n').map(s => s.trim()).filter(Boolean);
      const claimsArr = writerClaims.split('\n').map(s => s.trim()).filter(Boolean);
      const res = await apiClient.ai.generateNewsDraft({
        title: writerTitle,
        keyFacts: factsArr,
        district: writerDistrict,
        format: writerFormat,
        language: writerLang,
        allegationsOrClaims: claimsArr,
        notes: writerNotes
      });
      setWriterResult(res);
      showToast('समाचार आलेख सफलतापूर्वक तैयार किया गया!');
      loadProvidersAndUsage();
    } catch (err: any) {
      showToast(err.message || 'न्यूज़ ड्राफ्ट बनाने में विफल', true);
    } finally {
      setWriterLoading(false);
    }
  };

  // 2. Headline Generator Handler
  const handleGenerateHeadlines = async () => {
    if (!hlTitle && !hlSummary) {
      showToast('कृपया हेडलाइन बनाने हेतु शीर्षक अथवा सार दर्ज करें।', true);
      return;
    }
    setHlLoading(true);
    try {
      const res = await apiClient.ai.generateHeadlines({
        title: hlTitle,
        summary: hlSummary,
        district: hlDistrict
      });
      setHlResult(res);
      showToast('5-स्तरीय हेडलाइन्स तैयार की गईं!');
      loadProvidersAndUsage();
    } catch (err: any) {
      showToast(err.message || 'हेडलाइन्स बनाने में विफल', true);
    } finally {
      setHlLoading(false);
    }
  };

  // 3. Summarize Handler
  const handleSummarize = async () => {
    if (!sumContent) {
      showToast('कृपया सारांश हेतु सामग्री दर्ज करें।', true);
      return;
    }
    setSumLoading(true);
    try {
      const res = await apiClient.ai.summarizeNews({
        content: sumContent,
        mode: sumMode
      });
      setSumResult(res);
      showToast('सारांश तैयार किया गया!');
      loadProvidersAndUsage();
    } catch (err: any) {
      showToast(err.message || 'सारांश में त्रुटि', true);
    } finally {
      setSumLoading(false);
    }
  };

  // 3b. Rewrite Handler
  const handleRewrite = async () => {
    if (!sumContent) {
      showToast('कृपया पुनर्लेखन हेतु सामग्री दर्ज करें।', true);
      return;
    }
    setSumLoading(true);
    try {
      const res = await apiClient.ai.rewriteNews({
        content: sumContent,
        tone: rewriteTone,
        fixGrammarAndSpelling: true
      });
      setRewriteResult(res);
      showToast('सामग्री का पुनर्लेखन व व्याकरण सुधार पूर्ण हुआ!');
      loadProvidersAndUsage();
    } catch (err: any) {
      showToast(err.message || 'पुनर्लेखन में त्रुटि', true);
    } finally {
      setSumLoading(false);
    }
  };

  // 4. Fact Check Handler
  const handleFactCheck = async () => {
    if (!fcHeadline && !fcContent) {
      showToast('तथ्य परीक्षण के लिए शीर्षक या सामग्री आवश्यक है।', true);
      return;
    }
    setFcLoading(true);
    try {
      const sourcesArr = fcSources.split('\n').map(s => s.trim()).filter(Boolean);
      const res = await apiClient.ai.performFactCheck({
        headline: fcHeadline,
        content: fcContent,
        district: fcDistrict,
        sources: sourcesArr,
        evidenceNotes: fcEvidenceNotes
      });
      setFcResult(res);
      showToast('तथ्य-परीक्षण पूर्ण हुआ!');
      loadProvidersAndUsage();
    } catch (err: any) {
      showToast(err.message || 'तथ्य-परीक्षण में त्रुटि', true);
    } finally {
      setFcLoading(false);
    }
  };

  // 5. Research Handler
  const handleResearch = async () => {
    if (!resTopic) {
      showToast('कृपया अनुसंधान हेतु विषय दर्ज करें।', true);
      return;
    }
    setResLoading(true);
    try {
      const entArr = resEntities.split(',').map(s => s.trim()).filter(Boolean);
      const res = await apiClient.ai.conductResearch({
        topic: resTopic,
        district: resDistrict,
        contextNotes: resNotes,
        knownEntities: entArr
      });
      setResResult(res);
      showToast('अनुसंधान डॉसियर तैयार किया गया!');
      loadProvidersAndUsage();
    } catch (err: any) {
      showToast(err.message || 'अनुसंधान में त्रुटि', true);
    } finally {
      setResLoading(false);
    }
  };

  // 6. Social Media Handler
  const handleSocial = async () => {
    if (!socHeadline && !socSummary) {
      showToast('सोशल पोस्ट बनाने हेतु शीर्षक या सार दर्ज करें।', true);
      return;
    }
    setSocLoading(true);
    try {
      const res = await apiClient.ai.generateSocialCaptions({
        headline: socHeadline,
        summary: socSummary,
        district: socDistrict,
        articleUrl: socUrl
      });
      setSocResult(res);
      showToast('सोशल मीडिया पोस्ट तैयार की गईं!');
      loadProvidersAndUsage();
    } catch (err: any) {
      showToast(err.message || 'सोशल पोस्ट में त्रुटि', true);
    } finally {
      setSocLoading(false);
    }
  };

  // 7. SEO Handler
  const handleSeo = async () => {
    if (!seoTitle && !seoContent) {
      showToast('एसईओ हेतु शीर्षक या सामग्री दर्ज करें।', true);
      return;
    }
    setSeoLoading(true);
    try {
      const res = await apiClient.ai.optimizeSeo({
        title: seoTitle,
        content: seoContent,
        district: seoDistrict,
        category: seoCategory
      });
      setSeoResult(res);
      showToast('एसईओ विश्लेषण पूर्ण हुआ!');
      loadProvidersAndUsage();
    } catch (err: any) {
      showToast(err.message || 'एसईओ में त्रुटि', true);
    } finally {
      setSeoLoading(false);
    }
  };

  // 8. History Loader
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.ai.fetchHistory({
        category: historyCategoryFilter,
        search: historySearch
      });
      setHistoryItems(res.items);
    } catch (err: any) {
      showToast('इतिहास लोड करने में विफल', true);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    } else if (activeTab === 'prompts') {
      loadPrompts();
    }
  }, [activeTab, historyCategoryFilter, promptCategoryFilter]);

  // 9. Prompts Loader
  const loadPrompts = async () => {
    setPromptsLoading(true);
    try {
      const res = await apiClient.ai.fetchPrompts({
        category: promptCategoryFilter
      });
      setPromptsList(res);
    } catch (err: any) {
      showToast('प्रॉम्ट सूची लोड करने में विफल', true);
    } finally {
      setPromptsLoading(false);
    }
  };

  // Save to Newsroom Draft Handler
  const handleSaveToNewsroomDraft = async (historyId?: string, overrideData?: any) => {
    try {
      if (historyId) {
        await apiClient.ai.saveAsDraft(historyId);
      } else if (overrideData) {
        // Save via regular draft endpoint
        await apiClient.reporter.createDraft({
          title: overrideData.headline || overrideData.title || 'AI जनरेटेड ड्राफ्ट',
          summary: overrideData.leadParagraph || overrideData.summary || '',
          content: overrideData.fullContent || overrideData.content || overrideData.body || '',
          districtId: 'dist-bhopal',
          categoryId: 'cat-mp',
          isBreaking: false,
        });
      }
      showToast('समाचार सफलतापूर्वक न्यूज़ रूम में ड्राफ्ट (DRAFT) के रूप में सहेज दिया गया!');
      if (activeTab === 'history') loadHistory();
    } catch (err: any) {
      showToast(err.message || 'ड्राफ्ट सहेजने में विफल', true);
    }
  };

  // District options
  const districtList = useMemo(() => {
    if (districts.length > 0) {
      return districts.map(d => typeof d === 'string' ? d : d.nameHi || d.name || 'भोपाल');
    }
    return ['भोपाल', 'इंदौर', 'ग्वालियर', 'जबलपुर', 'उज्जैन', 'सागर', 'रीवा', 'सतना', 'छिंदवाड़ा', 'मुरैना'];
  }, [districts]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Messages */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-rose-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Top Banner / Masthead */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white font-serif">
                    AI न्यूज़ रूम व ऑटोमेशन स्टूडियो
                  </h1>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 rounded font-mono">
                    {providersInfo.activeProvider.toUpperCase()} AI
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">
                  मध्य प्रदेश हाइपरलोकल पत्रकारिता: शोध, आलेखन, तथ्य-परीक्षण व एसईओ ऑटोमेशन
                </p>
              </div>
            </div>

            {/* Quota Badge */}
            <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">दैनिक AI कोटा (Daily Quota)</div>
                <div className="text-sm font-bold text-amber-400">
                  {usageStats.remainingCallsToday} / {usageStats.dailyQuota} शेष
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Mandatory Human Approval Policy Bar */}
          <div className="mt-4 bg-amber-950/40 border border-amber-600/40 rounded-lg p-2.5 flex items-center gap-2.5 text-xs text-amber-200/90">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>मानव संपादकीय सिद्धांत (Human-in-the-Loop):</strong> AI केवल सहायक ड्राफ्ट तैयार करता है। कोई भी सामग्री सीधे प्रकाशित नहीं होती। संपादक समीक्षा व अनुमोदन अनिवार्य है।
            </span>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="mt-6 flex gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
            {[
              { id: 'dashboard', label: 'डैशबोर्ड', icon: BarChart3 },
              { id: 'writer', label: 'न्यूज़ राइटर', icon: FileText },
              { id: 'headlines', label: 'हेडलाइन 5-स्तरीय', icon: Heading },
              { id: 'summarizer', label: 'सार व पुनर्लेखन', icon: AlignLeft },
              { id: 'factcheck', label: 'तथ्य-परीक्षण', icon: CheckCircle },
              { id: 'research', label: 'खोजी अनुसंधान', icon: Search },
              { id: 'social', label: 'सोशल मीडिया', icon: Share2 },
              { id: 'seo', label: 'एसईओ ऑप्टिमाइज़र', icon: Globe },
              { id: 'history', label: 'कंटेंट इतिहास', icon: History },
              { id: 'prompts', label: 'प्रॉम्ट लाइब्रेरी', icon: BookOpen },
              { id: 'usage', label: 'उपयोग व कोटा', icon: Sliders },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AiTab)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'bg-slate-800 text-amber-400 border-amber-400 shadow-sm'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">आज के AI कॉल्स</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{usageStats.totalCalls}</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">कोटा सीमा: {usageStats.dailyQuota}</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">टोकन खपत</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{usageStats.totalTokens.toLocaleString('hi-IN')}</div>
                <div className="text-xs text-slate-500 mt-1">औसत 650 प्रति कॉल</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">अनुमानित लागत</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">₹{usageStats.totalCostInr}</div>
                <div className="text-xs text-slate-500 mt-1">INR आधारित एस्टिमेट</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">सक्रिय मॉडल</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">Gemini 1.5</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">मॉक फेलओवर सक्रिय</div>
              </div>
            </div>

            {/* Quick Action Grid */}
            <h2 className="text-lg font-bold text-slate-900 mt-4">त्वरित उपकरण (Quick AI Tools)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { tab: 'writer', title: 'AI न्यूज़ राइटर', desc: 'तथ्यों व बयानों से 8 पत्रकारिता प्रारूपों में देवनागरी ड्राफ्ट तैयार करें।', icon: FileText, color: 'text-blue-600 bg-blue-50' },
                { tab: 'headlines', title: '5-स्तरीय हेडलाइन जनरेटर', desc: '80 से 200 अक्षरों की 5 सटीक हेडलाइन्स (शून्य पूर्णविराम नियम सहित)।', icon: Heading, color: 'text-amber-600 bg-amber-50' },
                { tab: 'summarizer', title: 'सार व पुनर्लेखन', desc: 'बुलेट पॉइंट्स सारांश, शैली परिवर्तन व शुद्ध देवनागरी व्याकरण सुधार।', icon: AlignLeft, color: 'text-emerald-600 bg-emerald-50' },
                { tab: 'factcheck', title: '10-सूत्रीय तथ्य-परीक्षण', desc: 'दावों का विभाजन, सत्यापन स्तर व साक्ष्य विसंगति विश्लेषण।', icon: CheckCircle, color: 'text-purple-600 bg-purple-50' },
                { tab: 'research', title: 'खोजी अनुसंधान डेस्क', desc: 'पृष्ठभूमि डॉसियर, कालक्रम, बीएनएस धाराएं व फील्ड पत्रकारों हेतु प्रश्न।', icon: Search, color: 'text-indigo-600 bg-indigo-50' },
                { tab: 'social', title: 'सोशल मीडिया जनरेटर', desc: 'FB, IG, X (280 वर्ण), WhatsApp व YouTube हेतु क्लिकबैट-मुक्त पोस्ट्स।', icon: Share2, color: 'text-rose-600 bg-rose-50' },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.tab}
                    onClick={() => setActiveTab(card.tab as AiTab)}
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {card.title}
                        </h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: AI NEWS WRITER */}
        {activeTab === 'writer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span>समाचार आलेख तैयार करें (News Writer)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">कच्चे नोट्स व मुख्य बिंदुओं से पत्रकारिता ड्राफ्ट बनाएं</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार प्रारूप (Format)</label>
                <select
                  value={writerFormat}
                  onChange={e => setWriterFormat(e.target.value as AiNewsFormat)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="SHORT">संक्षिप्त समाचार (Short - ~150 शब्द)</option>
                  <option value="DETAILED">विस्तृत रिपोर्ट (Detailed - ~450 शब्द)</option>
                  <option value="BREAKING">ब्रेकिंग न्यूज़ फ्लैश (Breaking Flash - ~100 शब्द)</option>
                  <option value="POLITICAL">राजनीतिक विश्लेषण (Political Report)</option>
                  <option value="DISTRICT">जिला / आंचलिक समाचार (District Report)</option>
                  <option value="CRIME">अपराध / सुरक्षा रिपोर्ट (Crime Report)</option>
                  <option value="GOVERNMENT">शासकीय योजना / जनहित नीति (Govt/Policy)</option>
                  <option value="SPECIAL_REPORT">विशेष पड़ताल / ग्राउंड रिपोर्ट (Special Report)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">जिला (District)</label>
                  <select
                    value={writerDistrict}
                    onChange={e => setWriterDistrict(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                  >
                    {districtList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">भाषा (Language)</label>
                  <select
                    value={writerLang}
                    onChange={e => setWriterLang(e.target.value as AiLanguage)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                  >
                    <option value="hi">हिंदी (देवनागरी)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">शीर्षक संकेत / विषय (Topic / Headline Clue)</label>
                <input
                  type="text"
                  value={writerTitle}
                  onChange={e => setWriterTitle(e.target.value)}
                  placeholder="उदा. सीहोर में किसानों की महापंचायत, मुआवजे की मांग"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">मुख्य सत्यापित तथ्य (Key Facts - प्रति पंक्ति 1 तथ्य)</label>
                <textarea
                  rows={4}
                  value={writerFacts}
                  onChange={e => setWriterFacts(e.target.value)}
                  placeholder="• 500 से अधिक किसान कलेक्ट्रेट पहुंचे&#10;• ओलावृष्टि से खराब हुई फसलों का मुआवजा मांग रहे&#10;• तहसीलदार ने 3 दिन में सर्वे का आश्वासन दिया"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">कथित आरोप / अपुष्ट दावे (Strictly Allegations)</label>
                <textarea
                  rows={2}
                  value={writerClaims}
                  onChange={e => setWriterClaims(e.target.value)}
                  placeholder="• किसानों का आरोप है कि पटवारी सर्वे करने गांव नहीं पहुंचे"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleGenerateNews}
                disabled={writerLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow transition-colors disabled:opacity-50"
              >
                {writerLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>AI ड्राफ्ट तैयार हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>समाचार ड्राफ्ट तैयार करें</span>
                  </>
                )}
              </button>
            </div>

            {/* Output View */}
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              {writerResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded">
                      DRAFT | AI ASSISTED
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{writerResult.wordCount} शब्द | ~{writerResult.estimatedReadTimeMinutes} मिनट पठन</span>
                      <button
                        onClick={() => copyToClipboard(writerResult.fullContent, 'writer-out')}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded"
                        title="Copy full draft"
                      >
                        {copiedId === 'writer-out' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-serif leading-snug">
                      {writerResult.headline}
                    </h3>
                    {writerResult.subHeadline && (
                      <p className="text-sm font-medium text-slate-600 mt-1 italic">
                        {writerResult.subHeadline}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border-l-4 border-amber-500 text-sm font-semibold text-slate-800">
                    {writerResult.leadParagraph}
                  </div>

                  <div className="text-sm text-slate-700 space-y-3 leading-relaxed whitespace-pre-line">
                    {writerResult.bodyParagraphs?.map((para: string, idx: number) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>

                  {writerResult.officialStatement && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                      <strong>प्रशासनिक / अधिकृत पक्ष:</strong> {writerResult.officialStatement}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      मॉडल: {writerResult.model} | जनरेशन समय: {writerResult.generationTimeMs}ms
                    </div>
                    <button
                      onClick={() => handleSaveToNewsroomDraft(undefined, writerResult)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>न्यूज़ रूम में ड्राफ्ट सहेजें</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                  <Bot className="w-16 h-16 stroke-1 mb-3 text-slate-300" />
                  <p className="text-sm font-medium">बाईं ओर जानकारी भरकर 'समाचार ड्राफ्ट तैयार करें' पर क्लिक करें।</p>
                  <p className="text-xs text-slate-400 mt-1">तैयार ड्राफ्ट यहां दिखाई देगा और आप इसे सीधे न्यूज़ रूम में सहेज सकेंगे।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 5-TIER HEADLINE GENERATOR */}
        {activeTab === 'headlines' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Heading className="w-5 h-5 text-amber-600" />
                  <span>5-स्तरीय हेडलाइन जनरेटर (Five-Tier Headline Generator)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  सख्त अक्षर सीमाओं (80–110, 100–130, 125–150, 130–160, 150–200) एवं शून्य पूर्णविराम नियम के साथ 5 विकल्प
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार शीर्षक / मुख्य सार</label>
                  <input
                    type="text"
                    value={hlTitle}
                    onChange={e => setHlTitle(e.target.value)}
                    placeholder="उदा. उज्जैन महाकाल मंदिर में सावन के पहले सोमवार को श्रद्धालुओं का जनसैलाब"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">जिला (District)</label>
                  <select
                    value={hlDistrict}
                    onChange={e => setHlDistrict(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                  >
                    {districtList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleGenerateHeadlines}
                  disabled={hlLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow transition-colors disabled:opacity-50"
                >
                  {hlLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>5 हेडलाइन्स जनरेट करें</span>
                </button>
              </div>
            </div>

            {/* Results Grid */}
            {hlResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <span>सख्त सत्यापन स्थिति: {hlResult.allOptionsInRange ? '✅ सभी 5 विकल्प सीमा में हैं' : '⚠️ सीमा समायोजन लागू'}</span>
                  <span>प्रदाता: {hlResult.provider}</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(hlResult.headlineOptions || hlResult.headlines || []).map((opt: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-400 shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            विकल्प {opt.optionNumber} ({opt.style})
                          </span>
                          <span className="text-slate-400">लक्षित सीमा: {opt.targetRange} वर्ण</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            (opt.lengthValid ?? opt.isValidLength ?? true) ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            लंबाई: {opt.characterCount} वर्ण
                          </span>
                          <button
                            onClick={() => copyToClipboard(opt.headline, `hl-${idx}`)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Copy headline"
                          >
                            {copiedId === `hl-${idx}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-base font-bold text-slate-900 font-serif leading-snug">
                        {opt.headline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SUMMARIZER & REWRITER */}
        {activeTab === 'summarizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlignLeft className="w-5 h-5 text-amber-600" />
                  <span>समाचार सार व पुनर्लेखन (Summarizer & Rewriter)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">मूल पाठ पेस्ट करें और सारांश अथवा शैली पुनर्लेखन चुनें</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">मूल समाचार पाठ (Original News Content)</label>
                <textarea
                  rows={8}
                  value={sumContent}
                  onChange={e => setSumContent(e.target.value)}
                  placeholder="यहां समाचार की संपूर्ण सामग्री पेस्ट करें..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">सारांश प्रारूप (Summary Mode)</label>
                  <select
                    value={sumMode}
                    onChange={e => setSumMode(e.target.value as any)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                  >
                    <option value="BULLETS">4-6 बुलेट पॉइंट्स (Bullets)</option>
                    <option value="SHORT">संक्षिप्त (Short - 60 शब्द)</option>
                    <option value="DETAILED">विस्तृत (Detailed - 150 शब्द)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">पुनर्लेखन शैली (Tone)</label>
                  <select
                    value={rewriteTone}
                    onChange={e => setRewriteTone(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                  >
                    <option value="NEUTRAL">निष्पक्ष (Neutral Journalistic)</option>
                    <option value="BREAKING">ब्रेकिंग अलर्ट (Breaking Flash)</option>
                    <option value="DISTRICT_VOICE">आंचलिक आवाज़ (District Voice)</option>
                    <option value="ANALYTICAL">विश्लेषणात्मक (Analytical)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSummarize}
                  disabled={sumLoading}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow transition-colors disabled:opacity-50"
                >
                  {sumLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlignLeft className="w-4 h-4" />}
                  <span>सार निकालें</span>
                </button>
                <button
                  onClick={handleRewrite}
                  disabled={sumLoading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow transition-colors disabled:opacity-50"
                >
                  {sumLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>पुनर्लेखन व व्याकरण सुधार</span>
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-6 space-y-4">
              {sumResult && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-800 uppercase">तैयार सारांश ({sumResult.mode})</span>
                    <button
                      onClick={() => copyToClipboard(sumResult.summary, 'sum-out')}
                      className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {sumResult.bulletPoints?.length > 0 ? (
                    <ul className="space-y-2 text-sm text-slate-800">
                      {sumResult.bulletPoints.map((bp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-800 leading-relaxed">{sumResult.summary}</p>
                  )}
                </div>
              )}

              {rewriteResult && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-amber-700 uppercase">पुनर्लेखित आलेख ({rewriteResult.toneApplied})</span>
                    <button
                      onClick={() => copyToClipboard(rewriteResult.rewrittenContent, 'rw-out')}
                      className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {rewriteResult.rewrittenContent}
                  </p>

                  {rewriteResult.correctionsMade?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-600 mb-2">देवनागरी व्याकरण व वर्तनी सुधार:</div>
                      <div className="space-y-1.5">
                        {rewriteResult.correctionsMade.map((c: any, i: number) => (
                          <div key={i} className="text-xs bg-slate-50 p-2 rounded border border-slate-200 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="line-through text-rose-500 mr-2">{c.before}</span>
                              <span className="font-bold text-emerald-700 mr-2">➔ {c.after}</span>
                              <span className="text-slate-500">({c.reason})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!sumResult && !rewriteResult && (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
                  <AlignLeft className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">बाईं ओर समाचार सामग्री दर्ज कर सार अथवा पुनर्लेखन का चयन करें।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: FACT CHECKING ASSISTANT */}
        {activeTab === 'factcheck' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <span>10-सूत्रीय तथ्य-परीक्षण (Fact Checker)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">दावों का विच्छेदन एवं साक्ष्य-आधारित सत्यापन</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार शीर्षक (Headline)</label>
                <input
                  type="text"
                  value={fcHeadline}
                  onChange={e => setFcHeadline(e.target.value)}
                  placeholder="उदा. रीवा में पुल टूटने का दावा, 5 की मौत की अफवाह"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार सामग्री / वायरल दावा</label>
                <textarea
                  rows={4}
                  value={fcContent}
                  onChange={e => setFcContent(e.target.value)}
                  placeholder="सोशल मीडिया पर वायरल दावा अथवा रिपोर्टर द्वारा प्रस्तुत कच्ची खबर..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">प्रस्तुत स्रोत कड़ियां (Source URLs - प्रति पंक्ति 1)</label>
                <textarea
                  rows={2}
                  value={fcSources}
                  onChange={e => setFcSources(e.target.value)}
                  placeholder="https://mpinfo.org/pressrelease..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">अतिरिक्त साक्ष्य नोट्स (Evidence Notes)</label>
                <input
                  type="text"
                  value={fcEvidenceNotes}
                  onChange={e => setFcEvidenceNotes(e.target.value)}
                  placeholder="उदा. एसपी से फोन पर बातचीत में पुल टूटने का खंडन किया गया"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleFactCheck}
                disabled={fcLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow transition-colors disabled:opacity-50"
              >
                {fcLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span>तथ्य-परीक्षण प्रारंभ करें</span>
              </button>
            </div>

            {/* Fact Check Results */}
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              {fcResult ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-xs text-slate-500 font-semibold uppercase">सत्यापन स्कोर (Verification Score)</div>
                      <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                        {fcResult.overallVerificationScore}%
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      fcResult.overallStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                      fcResult.overallStatus === 'PARTIALLY_VERIFIED' ? 'bg-amber-100 text-amber-800' :
                      fcResult.overallStatus === 'CONTRADICTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {fcResult.overallStatus}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">विशिष्ट दावों का विच्छेदन (Claim Breakdown)</h3>
                    {fcResult.claims?.map((c, i) => (
                      <div key={i} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">दावा #{i + 1}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            c.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'CONTRADICTED' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{c.claim}</p>
                        <p className="text-xs text-slate-600">{c.evidenceSummary}</p>
                        <p className="text-xs text-purple-700 italic">सुझाव: {c.recommendation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">10-सूत्रीय फैक्ट-चेकिंग प्रोटोकॉल मूल्यांकन</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {fcResult.checklistEvaluation?.slice(0, 6).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                          {item.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                  <CheckCircle className="w-16 h-16 stroke-1 mb-3 text-slate-300" />
                  <p className="text-sm font-medium">दावा व साक्ष्य दर्ज कर तथ्य परीक्षण चलाएं।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: RESEARCH ASSISTANT */}
        {activeTab === 'research' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  <span>खोजी अनुसंधान डेस्क (Research Desk)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">विषय की गहन पृष्ठभूमि, आंकड़े व फील्ड प्रश्नावली</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">अनुसंधान विषय (Topic)</label>
                <input
                  type="text"
                  value={resTopic}
                  onChange={e => setResTopic(e.target.value)}
                  placeholder="उदा. मध्य प्रदेश में अवैध रेत उत्खनन और नर्मदा किनारे कटाव"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">जिला / संभाग</label>
                <select
                  value={resDistrict}
                  onChange={e => setResDistrict(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                >
                  {districtList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">उल्लिखित संस्थाएं / अधिकारी / हस्तियां</label>
                <input
                  type="text"
                  value={resEntities}
                  onChange={e => setResEntities(e.target.value)}
                  placeholder="उदा. खनिज विभाग, एनजीटी, स्थानीय प्रशासन"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">संदर्भ नोट्स (Context)</label>
                <textarea
                  rows={3}
                  value={resNotes}
                  onChange={e => setResNotes(e.target.value)}
                  placeholder="हालिया घटनाएं अथवा जनहित याचिका का संदर्भ..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleResearch}
                disabled={resLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow transition-colors disabled:opacity-50"
              >
                {resLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span>अनुसंधान डॉसियर तैयार करें</span>
              </button>
            </div>

            {/* Research Dossier View */}
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              {resResult ? (
                <>
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900 font-serif">{resResult.topicSummary}</h3>
                    <p className="text-xs text-slate-500 mt-1">{resResult.historicalContext}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs font-bold text-slate-700 mb-1.5">सत्यापित तथ्य बनाम दावे (Facts vs Claims):</div>
                      <div className="space-y-1 text-xs">
                        {resResult.factBreakdown?.confirmedFacts?.map((f, i) => (
                          <div key={i} className="text-emerald-700 flex items-start gap-1.5">
                            <span>✔</span> <span>{f}</span>
                          </div>
                        ))}
                        {resResult.factBreakdown?.activeClaims?.map((c, i) => (
                          <div key={i} className="text-amber-700 flex items-start gap-1.5">
                            <span>⚡</span> <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1.5">फील्ड पत्रकारों हेतु प्रश्न (Field Questions):</div>
                      <ul className="space-y-1 text-xs text-slate-800">
                        {resResult.fieldInvestigationQuestions?.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 bg-indigo-50/60 p-2 rounded border border-indigo-100">
                            <span className="font-bold text-indigo-700">Q{i + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                  <Search className="w-16 h-16 stroke-1 mb-3 text-slate-300" />
                  <p className="text-sm font-medium">विषय दर्ज कर अनुसंधान डॉसियर तैयार करें।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SOCIAL MEDIA GENERATOR */}
        {activeTab === 'social' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-rose-600" />
                  <span>सोशल मीडिया जनरेटर (Social Media Suite)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">क्लिकबैट-मुक्त, मंच-अनुकूल पोस्ट्स</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार शीर्षक (Headline)</label>
                <input
                  type="text"
                  value={socHeadline}
                  onChange={e => setSocHeadline(e.target.value)}
                  placeholder="उदा. मध्य प्रदेश में मानसून की दस्तक, 22 जिलों में भारी बारिश का अलर्ट"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार सार (Summary)</label>
                <textarea
                  rows={4}
                  value={socSummary}
                  onChange={e => setSocSummary(e.target.value)}
                  placeholder="मौसम विभाग ने आगामी 48 घंटों में तेज हवाओं व गरज-चमक की चेतावनी दी है..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">वेबसाइट लिंक (URL)</label>
                <input
                  type="text"
                  value={socUrl}
                  onChange={e => setSocUrl(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSocial}
                disabled={socLoading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow transition-colors disabled:opacity-50"
              >
                {socLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                <span>सभी सोशल प्लेटफॉर्म्स हेतु पोस्ट बनाएं</span>
              </button>
            </div>

            {/* Social Cards */}
            <div className="lg:col-span-7 space-y-4">
              {socResult ? (
                <>
                  {/* WhatsApp */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 text-xs font-bold text-emerald-700">
                      <span>WhatsApp बुलेटिन (चैनल व ग्रुप्स)</span>
                      <button onClick={() => copyToClipboard(socResult.whatsapp?.bulletin || '', 'soc-wa')} className="p-1 hover:bg-slate-100 rounded">
                        <Copy className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                    <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans bg-slate-50 p-3 rounded border border-slate-100">
                      {socResult.whatsapp?.bulletin}
                    </pre>
                  </div>

                  {/* X / Twitter */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 text-xs font-bold text-slate-900">
                      <span>X (Twitter) - {socResult.xTwitter?.characterCount}/280 वर्ण</span>
                      <button onClick={() => copyToClipboard(socResult.xTwitter?.tweet || '', 'soc-x')} className="p-1 hover:bg-slate-100 rounded">
                        <Copy className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed">
                      {socResult.xTwitter?.tweet}
                    </p>
                  </div>

                  {/* Facebook & Instagram */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
                      <div className="flex justify-between font-bold text-blue-700 mb-1">
                        <span>Facebook</span>
                        <button onClick={() => copyToClipboard(socResult.facebook?.text || '', 'soc-fb')}>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                      <p className="text-slate-700 line-clamp-4">{socResult.facebook?.text}</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
                      <div className="flex justify-between font-bold text-pink-700 mb-1">
                        <span>Instagram</span>
                        <button onClick={() => copyToClipboard(socResult.instagram?.caption || '', 'soc-ig')}>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                      <p className="text-slate-700 line-clamp-4">{socResult.instagram?.caption}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
                  <Share2 className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">समाचार जानकारी भरकर सोशल मीडिया पोस्ट्स तैयार करें।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: SEO ASSISTANT */}
        {activeTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span>एसईओ व डिस्कवर ऑप्टिमाइज़र (SEO Assistant)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">गूगल सर्च व डिस्कवर हेतु शीर्षक व मेटा विवरण अनुकूलन</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार शीर्षक (Title)</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder="उदा. मध्य प्रदेश में लाड़ली बहना योजना की अगली किश्त जारी"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">समाचार सामग्री</label>
                <textarea
                  rows={5}
                  value={seoContent}
                  onChange={e => setSeoContent(e.target.value)}
                  placeholder="सामग्री का अंश पेस्ट करें..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSeo}
                disabled={seoLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow transition-colors disabled:opacity-50"
              >
                {seoLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                <span>एसईओ अनुकूलन प्रारंभ करें</span>
              </button>
            </div>

            {/* SEO Analysis Output */}
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              {seoResult ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-xs text-slate-500 font-semibold uppercase">एसईओ स्कोर</div>
                      <div className="text-2xl font-bold text-emerald-600">{seoResult.seoScore} / 100</div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-mono">
                      {seoResult.searchIntent}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Meta Title (लक्ष्य: &le; 60 वर्ण)</span>
                        <span className={(seoResult.metaTitleLength || 0) <= 60 ? 'text-emerald-600' : 'text-rose-500'}>
                          {seoResult.metaTitleLength || 0} / 60
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-sm font-semibold text-slate-900">
                        {seoResult.metaTitle}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Meta Description (लक्ष्य: 140-160 वर्ण)</span>
                        <span className="text-slate-500">{seoResult.metaDescriptionLength} वर्ण</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800">
                        {seoResult.metaDescription}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1">फोकस कीवर्ड्स (Keywords):</div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                          ★ {seoResult.primaryKeyword}
                        </span>
                        {seoResult.secondaryKeywords?.map((kw, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1">URL Slug (Transliterated):</div>
                      <div className="font-mono text-xs bg-slate-100 p-2 rounded text-slate-700">
                        /{seoResult.englishSlug}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                  <Globe className="w-16 h-16 stroke-1 mb-3 text-slate-300" />
                  <p className="text-sm font-medium">शीर्षक व सामग्री दर्ज कर एसईओ विश्लेषण करें।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: CONTENT HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">AI कंटेंट इतिहास (Generated History)</h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={historyCategoryFilter}
                  onChange={e => setHistoryCategoryFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-2 bg-slate-50"
                >
                  <option value="ALL">सभी श्रेणियां</option>
                  <option value="NEWS_WRITER">न्यूज़ राइटर</option>
                  <option value="HEADLINE">हेडलाइन</option>
                  <option value="SUMMARIZER">सार</option>
                  <option value="FACT_CHECK">तथ्य-परीक्षण</option>
                  <option value="RESEARCH">अनुसंधान</option>
                  <option value="SOCIAL">सोशल</option>
                  <option value="SEO">एसईओ</option>
                </select>
                <button
                  onClick={loadHistory}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                  title="रीफ्रेश करें"
                >
                  <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {historyItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString('hi-IN')}
                        </span>
                        {item.isDraftSaved && (
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                            ड्राफ्ट सहेजा गया
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm font-serif">{item.headline}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.inputSnippet}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!item.isDraftSaved && (
                        <button
                          onClick={() => handleSaveToNewsroomDraft(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>ड्राफ्ट बनाएं</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
                <History className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">कोई पूर्व AI सामग्री इतिहास उपलब्ध नहीं है।</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: PROMPT LIBRARY */}
        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">प्रॉम्ट लाइब्रेरी (Prompt Library)</h2>
              </div>
              <select
                value={promptCategoryFilter}
                onChange={e => setPromptCategoryFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-2 bg-slate-50"
              >
                <option value="ALL">सभी श्रेणियां</option>
                <option value="NEWS_WRITER">न्यूज़ राइटर</option>
                <option value="HEADLINE">हेडलाइन</option>
                <option value="FACT_CHECK">तथ्य-परीक्षण</option>
                <option value="SUMMARIZER">सार व पुनर्लेखन</option>
                <option value="RESEARCH">खोजी अनुसंधान</option>
                <option value="SOCIAL">सोशल मीडिया</option>
                <option value="SEO">एसईओ</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promptsList.map(prompt => (
                <div
                  key={prompt.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded">
                      {prompt.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">v{prompt.version} {prompt.isDefault && '• Built-in'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{prompt.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{prompt.description}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs text-slate-700 font-mono line-clamp-3">
                    {prompt.taskPrompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: USAGE & QUOTAS */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                <span>AI उपयोग एवं भूमिका-आधारित कोटा (Role Quotas & Tracking)</span>
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>दैनिक कोटा प्रगति ({usageStats.userRole})</span>
                  <span>{usageStats.totalCalls} / {usageStats.dailyQuota} कॉल्स</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usageStats.totalCalls / (usageStats.dailyQuota || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">कुल टोकन खपत</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{usageStats.totalTokens.toLocaleString('hi-IN')}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">अनुमानित लागत (Estimated INR)</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">₹{usageStats.totalCostInr}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">शेष दैनिक कॉल्स</div>
                  <div className="text-xl font-bold text-emerald-600 mt-1">{usageStats.remainingCallsToday}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
