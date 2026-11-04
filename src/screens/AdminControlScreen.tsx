import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Sparkles,
  Plus,
  MapPin,
  Zap,
  Server,
  FileText,
  Activity,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Radio,
  ExternalLink,
  Users,
  Award,
  Layers,
  Search,
  Check,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import {
  ArticleDetail,
  ReporterProfile,
  BreakingTickerItem,
  ApiPoolKeyItem,
  SystemAuditLogItem,
  AdBannerItem,
  DistrictItem,
  CategoryItem,
  EditorialFactCheckResult,
} from '../types';
import { BnwAiService } from '../services/aiService';

interface AdminControlScreenProps {
  articles: ArticleDetail[];
  pendingArticles: ArticleDetail[];
  reporters: ReporterProfile[];
  tickers: BreakingTickerItem[];
  ads: AdBannerItem[];
  apiPool: ApiPoolKeyItem[];
  auditLogs: SystemAuditLogItem[];
  districts: DistrictItem[];
  categories: CategoryItem[];
  onApproveArticle: (articleId: string) => void;
  onRequestRevision: (articleId: string, comments: string) => void;
  onRejectArticle: (articleId: string) => void;
  onAddTicker: (ticker: BreakingTickerItem) => void;
  onToggleTicker: (tickerId: string) => void;
  onDeleteTicker: (tickerId: string) => void;
  onUpdateReporterRole: (reporterId: string, role: 'reporter' | 'trusted_reporter') => void;
  onToggleAdActive: (adId: string) => void;
  onBroadcastAlert: (title: string, district: string) => void;
}

export const AdminControlScreen: React.FC<AdminControlScreenProps> = ({
  articles,
  pendingArticles,
  reporters,
  tickers,
  ads,
  apiPool,
  auditLogs,
  districts,
  categories,
  onApproveArticle,
  onRequestRevision,
  onRejectArticle,
  onAddTicker,
  onToggleTicker,
  onDeleteTicker,
  onUpdateReporterRole,
  onToggleAdActive,
  onBroadcastAlert,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'review_queue' | 'reporters' | 'tickers' | 'ads' | 'api_pool' | 'audit_logs'
  >('overview');

  // Review Queue state
  const [selectedReviewArticleId, setSelectedReviewArticleId] = useState<string>(
    pendingArticles[0]?.id || ''
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<EditorialFactCheckResult | null>(null);
  const [revisionComments, setRevisionComments] = useState('');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);

  // New Ticker Form State
  const [newTickerText, setNewTickerText] = useState('');
  const [newTickerDistrict, setNewTickerDistrict] = useState('पूरा मध्य प्रदेश');
  const [newTickerPriority, setNewTickerPriority] = useState<'normal' | 'critical'>('critical');

  // Broadcast Alert Form State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastHeadline, setBroadcastHeadline] = useState('');
  const [broadcastDistrict, setBroadcastDistrict] = useState('पूरा मध्य प्रदेश');
  const [broadcastToast, setBroadcastToast] = useState<string | null>(null);

  // Reporter Search / Filter
  const [reporterSearch, setReporterSearch] = useState('');

  const selectedReviewArticle =
    pendingArticles.find((a) => a.id === selectedReviewArticleId) || pendingArticles[0];

  const handleRunAiAudit = async () => {
    if (!selectedReviewArticle) return;
    setIsAuditing(true);
    try {
      const res = await BnwAiService.evaluateEditorialFactCheck(
        selectedReviewArticle.title,
        selectedReviewArticle.content,
        selectedReviewArticle.districtName || 'मध्य प्रदेश'
      );
      setAuditResult(res);
    } catch {
      alert('AI तथ्य-जांच विश्लेषण में समस्या हुई।');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCreateTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerText.trim()) return;

    const newTicker: BreakingTickerItem = {
      id: `tick-${Date.now()}`,
      textHindi: newTickerText.trim(),
      districtName: newTickerDistrict,
      priority: newTickerPriority,
      isActive: true,
      createdAt: 'अभी-अभी',
    };

    onAddTicker(newTicker);
    setNewTickerText('');
  };

  const handleSendBroadcast = () => {
    if (!broadcastHeadline.trim()) {
      alert('कृपया अलर्ट शीर्षक दर्ज करें।');
      return;
    }
    onBroadcastAlert(broadcastHeadline.trim(), broadcastDistrict);
    setShowBroadcastModal(false);
    setBroadcastToast(`🚨 [डेमो] सिम्युलेटेड राज्यव्यापी अलर्ट जारी (स्थानीय पूर्वावलोकन)`);
    setBroadcastHeadline('');
    setTimeout(() => setBroadcastToast(null), 4000);
  };

  const filteredReporters = reporters.filter((r) => {
    if (!reporterSearch.trim()) return true;
    const q = reporterSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.assignedDistricts.some((d) => d.toLowerCase().includes(q)) ||
      r.badgeNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-slate-100 min-h-screen pb-24 font-sans">
      {/* 1. Header Bar */}
      <div className="bg-slate-900 text-white px-4 py-5 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
              <ShieldCheck className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight font-serif">
                  एडमिनिस्ट्रेटिव कंट्रोल रूम (Admin Newsroom Console)
                </h1>
                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                  MASTER SUITE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                55 जिलों का केंद्रीय संपादकीय, संवाददाता मान्यता, विज्ञापन एवं सिस्टम मॉनिटर
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Radio className="w-4 h-4 animate-pulse text-white" />
              <span>राज्यव्यापी ब्रेकिंग अलर्ट</span>
            </button>
            <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>सिस्टम स्थिति: डेमो पूर्वावलोकन (In-Memory)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Toast Notification */}
      {broadcastToast && (
        <div className="max-w-7xl mx-auto mt-3 px-4">
          <div className="bg-red-600 text-white p-3 rounded-xl shadow-lg text-xs font-bold flex items-center justify-between">
            <span>{broadcastToast}</span>
            <button onClick={() => setBroadcastToast(null)} className="text-white hover:text-slate-200">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. Horizontal Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>सिस्टम ओवरव्यू</span>
          </button>

          <button
            onClick={() => setActiveTab('review_queue')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'review_queue'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>समीक्षा कतार</span>
            {pendingArticles.length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px]">
                {pendingArticles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reporters')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'reporters'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>संवाददाता मान्यता ({reporters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tickers')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'tickers'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>ब्रेकिंग टिकर ({tickers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'ads'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>विज्ञापन प्रबंधन</span>
          </button>

          <button
            onClick={() => setActiveTab('api_pool')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'api_pool'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-indigo-500" />
            <span>AI API Pool स्वास्थ्य</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'audit_logs'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ऑडिट लॉग्स</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Body Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 block">लाइव प्रकाशित समाचार</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{articles.length}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">✓ 55 जिलों में प्रसारित</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 block">लंबित संपादकीय समीक्षा</span>
                <div className="text-2xl font-black text-red-600 mt-1">{pendingArticles.length}</div>
                <div className="text-[11px] text-amber-600 font-semibold mt-1">10-बिंदु ऑडिट प्रतीक्षारत</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 block">मान्यता प्राप्त संवाददाता</span>
                <div className="text-2xl font-black text-blue-600 mt-1">{reporters.length}</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-1">10 संभागों में बीट आवंटित</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 block">दैनिक डिजिटल पाठक रीच</span>
                <div className="text-2xl font-black text-purple-600 mt-1">48,250+</div>
                <div className="text-[11px] text-purple-600 font-semibold mt-1">Core Web Vitals: 98% Good</div>
              </div>
            </div>

            {/* Middle Section: Quick Operations & Architecture Telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Operational Workflows */}
              <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-600" />
                    त्वरित संपादकीय नियंत्रण व संचालन
                  </span>
                  <span className="text-xs text-slate-500">Node.js + PostgreSQL Monolith</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() => setActiveTab('review_queue')}
                    className="p-3.5 bg-slate-50 border border-slate-200 hover:border-red-400 rounded-xl cursor-pointer transition-all hover:bg-red-50/20 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-red-700">
                        संपादकीय समीक्षा डेस्क
                      </span>
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black">
                        {pendingArticles.length} कतार में
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      फील्ड रिपोर्टर्स की नई खबरें पढ़ें, 10-बिंदु AI फैक्ट चेक चलाएं और राज्य स्तर पर प्रकाशित करें।
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('tickers')}
                    className="p-3.5 bg-slate-50 border border-slate-200 hover:border-red-400 rounded-xl cursor-pointer transition-all hover:bg-red-50/20 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-red-700">
                        टॉप ब्रेकिंग टिकर
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                        {tickers.filter((t) => t.isActive).length} सक्रिय
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      वेबसाइट के शीर्ष पर स्क्रॉल होने वाले समाचार टिकर अपडेट करें।
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('reporters')}
                    className="p-3.5 bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all hover:bg-blue-50/20 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                        संवाददाता व बीट प्रबंधन
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                        {reporters.length} एक्टिव
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      प्रेस पहचान पत्र (Digital Press ID) जारी करें और जिला अधिकार क्षेत्र निर्धारित करें।
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('api_pool')}
                    className="p-3.5 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl cursor-pointer transition-all hover:bg-indigo-50/20 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                        मल्टी-प्रोवाइडर AI Pool
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                        Failover OK
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Gemini 1.5, Claude, Groq व DeepSeek एपीआई स्वास्थ्य और टोकन कोटा मॉनिटर।
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Col: Cloud Architecture & Security Posture */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  क्लाउड इंफ्रास्ट्रक्चर स्थिति
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">होस्टिंग इंजन:</span>
                    <strong className="text-slate-900 font-mono">Firebase App Hosting (React 19)</strong>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">क्लाउड क्षेत्र:</span>
                    <strong className="text-slate-900 font-mono">asia-southeast1</strong>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">डेटाबेस क्लस्टर:</span>
                    <strong className="text-slate-900 font-mono">PostgreSQL v16 (Prisma)</strong>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">मीडिया स्टोरेज:</span>
                    <strong className="text-slate-900 font-mono">Cloudflare R2 / MinIO</strong>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">सुरक्षा मानक:</span>
                    <strong className="text-emerald-700 font-semibold">DPDPA 2023 & IT Rules</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REVIEW QUEUE */}
        {activeTab === 'review_queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  संपादकीय समीक्षा एवं अनुमोदन कतार ({pendingArticles.length})
                </h2>
                <p className="text-xs text-slate-500">
                  संवाददाताओं द्वारा भेजी गई खबरों का 10-बिंदु सत्यापन व प्रकाशन नियंत्रण
                </p>
              </div>
            </div>

            {pendingArticles.length === 0 ? (
              <div className="bg-white p-10 rounded-xl border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">समीक्षा कतार शून्य है!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  सभी फील्ड रिपोर्ट्स स्वीकृत कर प्रकाशित कर दी गई हैं।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: Queue List */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {pendingArticles.map((art) => {
                    const isSelected = art.id === selectedReviewArticle?.id;
                    return (
                      <div
                        key={art.id}
                        onClick={() => {
                          setSelectedReviewArticleId(art.id);
                          setAuditResult(null);
                          setShowRevisionDialog(false);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-red-500 shadow-md ring-1 ring-red-400/30'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {art.districtName}
                          </span>
                          <span className="text-slate-400 font-medium">{art.createdAt}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                          <span>संवाददाता: {art.authorName}</span>
                          {art.isBreaking && (
                            <span className="text-red-600 font-bold">🚨 ब्रेकिंग</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Review Workspace */}
                {selectedReviewArticle && (
                  <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">
                          {selectedReviewArticle.districtName}
                        </span>
                        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded">
                          {selectedReviewArticle.categoryName}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        संवाददाता: <strong>{selectedReviewArticle.authorName}</strong> ({selectedReviewArticle.authorRole})
                      </span>
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                      {selectedReviewArticle.title}
                    </h3>

                    {selectedReviewArticle.featuredImage && (
                      <div className="rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={selectedReviewArticle.featuredImage}
                          alt="ग्राउंड फोटो"
                          className="w-full h-48 object-cover"
                        />
                        {selectedReviewArticle.imageCaption && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 border-t border-slate-200">
                            {selectedReviewArticle.imageCaption}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                      {selectedReviewArticle.content}
                    </div>

                    {/* AI 10-Point Fact Check Audit */}
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>10-बिंदु संपादकीय फैक्ट-चेक ऑडिटर</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRunAiAudit}
                          disabled={isAuditing}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors"
                        >
                          {isAuditing ? 'विश्लेषण जारी...' : 'जांच शुरू करें'}
                        </button>
                      </div>

                      {auditResult && (
                        <div className="mt-2 pt-2 border-t border-indigo-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-900">
                              सत्यापन स्कोर: {auditResult.score}/100
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              {auditResult.credibilityRating}
                            </span>
                          </div>
                          <p className="text-slate-700 italic bg-white p-2 rounded border border-indigo-100">
                            "{auditResult.editorialRemarksHindi}"
                          </p>
                          <div className="space-y-1">
                            {auditResult.checklist.map((item, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                                {item.status === 'PASSED' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <span className="font-bold text-slate-800">{item.pointName}:</span>{' '}
                                  <span className="text-slate-600">{item.commentHindi}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Revision Dialog */}
                    {showRevisionDialog && (
                      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-amber-950">
                          संवाददाता के लिए संपादकीय निर्देश / आवश्यक संशोधन:
                        </label>
                        <textarea
                          value={revisionComments}
                          onChange={(e) => setRevisionComments(e.target.value)}
                          placeholder="उदा. स्थानीय एसडीएम का अधिकृत बयान संलग्न करें..."
                          className="w-full text-xs p-2 border border-amber-300 rounded bg-white"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRevisionDialog(false)}
                            className="px-2.5 py-1 text-xs text-slate-600"
                          >
                            रद्द करें
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!revisionComments.trim()) {
                                alert('कृपया संशोधन निर्देश लिखें।');
                                return;
                              }
                              onRequestRevision(selectedReviewArticle.id, revisionComments);
                              setShowRevisionDialog(false);
                              setRevisionComments('');
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded"
                          >
                            संशोधन हेतु वापस भेजें
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Editorial Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowRevisionDialog(true)}
                          className="flex items-center gap-1 px-3 py-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>संशोधन मांगें</span>
                        </button>

                        <button
                          onClick={() => onRejectArticle(selectedReviewArticle.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>अस्वीकृत करें</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onApproveArticle(selectedReviewArticle.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>स्वीकृत कर लाइव प्रकाशित करें</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REPORTERS */}
        {activeTab === 'reporters' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  मान्यता प्राप्त संवाददाता एवं बीट प्रबंधन
                </h3>
                <p className="text-xs text-slate-500">
                  मध्य प्रदेश के 55 जिलों के संवाददाताओं की मान्यता, डिजिटल प्रेस कार्ड व अधिकार क्षेत्र
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={reporterSearch}
                  onChange={(e) => setReporterSearch(e.target.value)}
                  placeholder="नाम, जिला या बैज नंबर से खोजें..."
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-64 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">संवाददाता</th>
                    <th className="py-2.5 px-3">प्रेस बैज ID</th>
                    <th className="py-2.5 px-3">आवंटित संभाग / जिले</th>
                    <th className="py-2.5 px-3">कवरेज आँकड़े</th>
                    <th className="py-2.5 px-3">भूमिका स्थिति</th>
                    <th className="py-2.5 px-3 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReporters.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rep.avatar}
                            alt={rep.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-300"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{rep.name}</span>
                            <span className="text-[11px] text-slate-500">{rep.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {rep.badgeNumber}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {rep.assignedDivision || 'मध्य प्रदेश'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {rep.assignedDistricts.join(', ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-700">{rep.totalStoriesPublished}</span>
                        <span className="text-slate-400"> / {rep.totalStoriesFiled} खबरें</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rep.role === 'trusted_reporter'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          {rep.role === 'trusted_reporter' ? 'वरिष्ठ संवाददाता' : 'जिला संवाददाता'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() =>
                            onUpdateReporterRole(
                              rep.id,
                              rep.role === 'trusted_reporter' ? 'reporter' : 'trusted_reporter'
                            )
                          }
                          className="px-2.5 py-1 text-[11px] font-bold rounded border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                        >
                          {rep.role === 'trusted_reporter' ? 'मान्यता संशोधित करें' : 'वरिष्ठता प्रदान करें'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TICKERS */}
        {activeTab === 'tickers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Ticker */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                नया ब्रेकिंग टिकर जोड़ें
              </h3>

              <form onSubmit={handleCreateTicker} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    टिकर सूचना (Devanagari Headline) *
                  </label>
                  <textarea
                    value={newTickerText}
                    onChange={(e) => setNewTickerText(e.target.value)}
                    rows={3}
                    placeholder="उदा. मौसम विभाग: इंदौर व उज्जैन संभाग में तेज बारिश की चेतावनी..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    प्रभावित क्षेत्र / जिला
                  </label>
                  <input
                    type="text"
                    value={newTickerDistrict}
                    onChange={(e) => setNewTickerDistrict(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    प्राथमिकता स्तर
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTickerPriority('critical')}
                      className={`flex-1 py-1.5 rounded font-bold transition-colors ${
                        newTickerPriority === 'critical'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      🚨 अति महत्वपूर्ण (Critical)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTickerPriority('normal')}
                      className={`flex-1 py-1.5 rounded font-bold transition-colors ${
                        newTickerPriority === 'normal'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      सामान्य (Normal)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#ED1727] hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-xs"
                >
                  टिकर लाइव सक्रिय करें
                </button>
              </form>
            </div>

            {/* Existing Tickers List */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                सक्रिय एवं पूर्व टिकर घोषणाएं ({tickers.length})
              </h3>

              <div className="space-y-2.5">
                {tickers.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            t.priority === 'critical'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {t.priority === 'critical' ? 'CRITICAL' : 'NORMAL'}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          [{t.districtName || 'मध्य प्रदेश'}] • {t.createdAt}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900">{t.textHindi}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleTicker(t.id)}
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          t.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {t.isActive ? 'सक्रिय' : 'निष्क्रिय'}
                      </button>
                      <button
                        onClick={() => onDeleteTicker(t.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ADS */}
        {activeTab === 'ads' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                हाइपरलोकल विज्ञापन अभियान प्रबंधन (AscAdBanner Slots)
              </h3>
              <p className="text-xs text-slate-500">
                मध्य प्रदेश के प्रमुख विभागों व ब्रांड्स के प्रायोजित प्रचार स्लॉट्स
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-300">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    <span className="absolute top-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">
                      {ad.placement}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-blue-600 font-bold block">
                      विज्ञापनदाता: {ad.advertiserName}
                    </span>
                    <h4 className="font-bold text-slate-900 line-clamp-2 mt-0.5">{ad.title}</h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      onClick={() => onToggleAdActive(ad.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        ad.isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ad.isActive ? 'सक्रिय (Live)' : 'बंद (Paused)'}
                    </button>

                    <a
                      href={ad.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]"
                    >
                      <span>लिंक देखें</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: API POOL */}
        {activeTab === 'api_pool' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  मल्टी-प्रोवाइडर AI API Pool सिमुलेशन एवं कोटा मॉनिटर
                </h3>
                <p className="text-xs text-slate-500">
                  दर-सीमा (Rate Limits) व स्वचालित फेलओवर (सिम्युलेटेड टेलीमेट्री डेटा)
                </p>
              </div>

              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                फेलओवर सिमुलेशन: सक्रिय (Demo)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apiPool.map((pool) => {
                const usagePercent = Math.round((pool.dailyQuotaUsed / pool.dailyQuotaLimit) * 100);
                return (
                  <div
                    key={pool.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{pool.name}</h4>
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        {pool.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>मॉडल:</span>
                        <strong className="font-mono text-slate-800">{pool.model}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>सुरक्षित की (Masked):</span>
                        <strong className="font-mono text-slate-800">{pool.keyMasked}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>दैनिक टोकन उपयोग:</span>
                        <strong>
                          {pool.dailyQuotaUsed.toLocaleString()} / {pool.dailyQuotaLimit.toLocaleString()} ({usagePercent}%)
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>औसत लेटेंसी:</span>
                        <strong>{pool.avgLatencyMs} ms</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                सिस्टम सुरक्षा एवं संपादकीय निर्णय ऑडिट लॉग्स (सत्र इतिहास)
              </h3>
              <p className="text-xs text-slate-500">
                वर्तमान ब्राउज़र सत्र के संपादकीय निर्णयों का इन-मेमोरी इतिहास (स्थानीय स्टेट)
              </p>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-black">
                        {log.actionType}
                      </span>
                      <span className="font-bold text-slate-900">
                        {log.actorName} ({log.actorRole})
                      </span>
                    </div>
                    <p className="text-slate-700">{log.description}</p>
                  </div>

                  <div className="text-[11px] text-slate-400 shrink-0">
                    {log.timestamp} • IP: {log.ipAddress}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <Radio className="w-5 h-5 animate-spin" />
                <span>राज्यव्यापी आपात अलर्ट जारी करें</span>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                प्रसारण क्षेत्र (Target Jurisdiction):
              </label>
              <select
                value={broadcastDistrict}
                onChange={(e) => setBroadcastDistrict(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="पूरा मध्य प्रदेश">पूरा मध्य प्रदेश (समस्त 55 जिले)</option>
                <option value="भोपाल संभाग">भोपाल संभाग</option>
                <option value="इंदौर संभाग">इंदौर संभाग</option>
                <option value="ग्वालियर-चंबल">ग्वालियर-चंबल संभाग</option>
                <option value="महाकोशल व विंध्य">महाकोशल व विंध्य संभाग</option>
                <option value="बुंदेलखंड व सागर">बुंदेलखंड व सागर संभाग</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                अलर्ट शीर्षक (Short Push Notification) *
              </label>
              <input
                type="text"
                value={broadcastHeadline}
                onChange={(e) => setBroadcastHeadline(e.target.value)}
                placeholder="उदा. मौसम विभाग: अगले 24 घंटे में मूसलाधार बारिश का रेड अलर्ट..."
                className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              ℹ️ [डेमो मोड] यह संदेश स्थानीय पूर्वावलोकन हेतु सिम्युलेटेड है। वास्तविक FCM पुश नोटिफिकेशन प्रेषण हेतु सर्वर बैकएंड व अधिकृत क्रेडेंशियल्स आवश्यक हैं।
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                🚨 अलर्ट प्रसारित करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

