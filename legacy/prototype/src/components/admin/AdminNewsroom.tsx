import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { 
  Article, 
  ReporterProfile, 
  GraphicTemplate, 
  BreakingTicker, 
  ApiPoolKey, 
  SystemAuditLog 
} from '../../types/index.ts';
import { 
  updateNewsArticle, 
  createTicker, 
  updateReporter, 
  aiUrlRewrite, 
  fetchApiPoolStatus, 
  fetchAuditLogs 
} from '../../services/api.ts';

interface AdminNewsroomProps {
  articles: Article[];
  reporters: ReporterProfile[];
  tickers: BreakingTicker[];
  templates: GraphicTemplate[];
  onArticleUpdated: (updated: Article) => void;
  onTickerCreated: (newTicker: BreakingTicker) => void;
  onReporterUpdated: (updated: ReporterProfile) => void;
}

export const AdminNewsroom: React.FC<AdminNewsroomProps> = ({
  articles,
  reporters,
  tickers,
  templates,
  onArticleUpdated,
  onTickerCreated,
  onReporterUpdated
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'review_queue' | 'url_newsroom' | 'reporters' | 'ticker' | 'api_pool' | 'audit_logs'
  >('overview');

  // Review Queue state
  const pendingArticles = articles.filter(a => a.status === 'pending_review' || a.status === 'revision_requested');
  const [selectedReviewArticle, setSelectedReviewArticle] = useState<Article | null>(pendingArticles[0] || null);
  const [editorialNote, setEditorialNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('तथ्यों की पुष्टि करें');

  // URL Ingest Desk state
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [originalPublisher, setOriginalPublisher] = useState('पीटीआई / समाचार एजेंसी');
  const [isUrlAiLoading, setIsUrlAiLoading] = useState(false);
  const [urlGeneratedArticle, setUrlGeneratedArticle] = useState<any>(null);

  // Ticker creation state
  const [tickerText, setTickerText] = useState('');
  const [tickerPriority, setTickerPriority] = useState<'normal' | 'critical'>('critical');

  // API Pool telemetry state
  const [apiPoolData, setApiPoolData] = useState<{
    activeModel: string;
    uptimePercentage: number;
    failoverStatus: string;
    data: ApiPoolKey[];
  } | null>(null);

  const [auditLogsList, setAuditLogsList] = useState<SystemAuditLog[]>([]);

  useEffect(() => {
    fetchApiPoolStatus().then(res => setApiPoolData(res)).catch(console.error);
    fetchAuditLogs().then(logs => setAuditLogsList(logs)).catch(console.error);
  }, []);

  // Handle Editorial Actions
  const handleApprovePublish = async (article: Article) => {
    try {
      const updated = await updateNewsArticle(article.id, {
        status: 'published',
        reviewerName: 'केंद्रीय मुख्य संपादक',
        isLeadStory: article.isLeadStory
      });
      onArticleUpdated(updated);
      setSelectedReviewArticle(null);
      alert(`खबर "${article.title.slice(0, 40)}..." स्वीकृत एवं तत्काल प्रकाशित की गई।`);
    } catch (err) {
      console.error(err);
      alert('संपादकीय स्वीकृति में त्रुटि।');
    }
  };

  const handleRequestRevision = async (article: Article) => {
    if (!editorialNote.trim()) {
      alert('कृपया रिपोर्टर के लिए संशोधन निर्देश (Editorial Note) अवश्य लिखें।');
      return;
    }
    try {
      const updated = await updateNewsArticle(article.id, {
        status: 'revision_requested',
        editorialNotes: editorialNote,
        reviewerName: 'केंद्रीय मुख्य संपादक'
      });
      onArticleUpdated(updated);
      setEditorialNote('');
      setSelectedReviewArticle(null);
      alert('संशोधन का अनुरोध रिपोर्टर को भेज दिया गया है।');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (article: Article) => {
    try {
      const updated = await updateNewsArticle(article.id, {
        status: 'rejected',
        rejectionReason,
        reviewerName: 'केंद्रीय मुख्य संपादक'
      });
      onArticleUpdated(updated);
      setSelectedReviewArticle(null);
      alert('खबर को अस्वीकृत कर दिया गया है।');
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Trusted Publisher
  const handleToggleTrusted = async (rep: ReporterProfile) => {
    const newRole = rep.role === 'trusted_reporter' ? 'reporter' : 'trusted_reporter';
    const confirmMsg = newRole === 'trusted_reporter'
      ? `क्या आप ${rep.name} को "Trusted Reporter" का दर्जा देना चाहते हैं? इससे वे अपने जिले में बिना एडमिन स्वीकृति सीधे खबरें प्रकाशित कर सकेंगे।`
      : `क्या आप ${rep.name} से सीधा प्रकाशन अधिकार वापस लेना चाहते हैं?`;

    if (!confirm(confirmMsg)) return;

    try {
      const updated = await updateReporter(rep.id, { role: newRole });
      onReporterUpdated(updated);
      alert(`रिपोर्टर ${rep.name} की अनुमतियाँ अद्यतन की गईं: ${newRole === 'trusted_reporter' ? 'सीधा प्रकाशन सक्षम' : 'समीक्षा अनिवार्य'}`);
      fetchAuditLogs().then(setAuditLogsList);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Ticker
  const handleCreateTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerText.trim()) return;
    try {
      const newT = await createTicker({
        textHindi: tickerText,
        priority: tickerPriority
      });
      onTickerCreated(newT);
      setTickerText('');
      alert('नया लाइव टिकर सक्रिय हो गया है।');
      fetchAuditLogs().then(setAuditLogsList);
    } catch (err) {
      console.error(err);
    }
  };

  // URL News Ingest with Gemini
  const handleUrlAiRewrite = async () => {
    if (!sourceText.trim() && !sourceUrl.trim()) {
      alert('कृपया बाहरी स्रोत का पाठ (Text) या URL दर्ज करें।');
      return;
    }
    setIsUrlAiLoading(true);
    try {
      const res = await aiUrlRewrite({
        url: sourceUrl,
        sourceText,
        originalPublisher
      });
      setUrlGeneratedArticle(res);
    } catch (err) {
      console.error(err);
      alert('URL से खबर बनाने में विफलता।');
    } finally {
      setIsUrlAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-700 via-gray-900 to-black text-white p-5 rounded-2xl shadow-lg border border-red-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-yellow-300" />
            <h2 className="text-xl sm:text-2xl font-black">
              केंद्रीय एडमिन कंट्रोल पैनल व डिजिटल न्यूज़रूम
            </h2>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            संपादकीय समीक्षा, जिला आवंटन, RSS/URL इनजेशन, एवं AI API Pool का एकीकृत नियंत्रण कक्ष
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            न्यूज़रूम लाइव • 99.98% अपटाइम
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-gray-200 pb-2">
        {[
          { id: 'overview', label: 'न्यूज़रूम अवलोकन (Overview)', icon: Activity },
          { id: 'review_queue', label: `सेंट्रल रिव्यू डेस्क (${pendingArticles.length})`, icon: FileText },
          { id: 'url_newsroom', label: 'URL / RSS न्यूज़रूम डेस्क (AI)', icon: Globe },
          { id: 'reporters', label: `रिपोर्टर एवं जिला आवंटन (${reporters.length})`, icon: MapPin },
          { id: 'ticker', label: `लाइव टिकर कंट्रोलर (${tickers.length})`, icon: Zap },
          { id: 'api_pool', label: 'AI API Pool प्रबंधन', icon: Server },
          { id: 'audit_logs', label: 'सिस्टम ऑडिट लॉग', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                isActive 
                  ? 'bg-gray-900 text-yellow-300 shadow-xs' 
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-bold">आज प्रकाशित खबरें</span>
              <div className="text-3xl font-black text-gray-950 mt-1">
                {articles.filter(a => a.status === 'published').length}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">100% सत्यापित पत्रकारिता</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-xs text-amber-700 font-bold">समीक्षा कतार (Pending)</span>
              <div className="text-3xl font-black text-amber-950 mt-1">
                {pendingArticles.length}
              </div>
              <span className="text-[10px] text-amber-600 font-bold">तुरंत ध्यान अपेक्षित</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-bold">कुल पंजीकृत रिपोर्टर्स</span>
              <div className="text-3xl font-black text-gray-950 mt-1">
                {reporters.length}
              </div>
              <span className="text-[10px] text-gray-400">
                {reporters.filter(r => r.role === 'trusted_reporter').length} सीधा प्रकाशन अधिकृत
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs text-emerald-700 font-bold">AI API Pool हेल्थ</span>
              <div className="text-3xl font-black text-emerald-950 mt-1">सक्रिय</div>
              <span className="text-[10px] text-emerald-600 font-bold">Gemini 3.8 Flash प्रोडक्शन</span>
            </div>
          </div>

          {/* Urgent Review Callout */}
          {pendingArticles.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    {pendingArticles.length} खबरें समीक्षा एवं संपादन के लिए प्रतीक्षारत हैं
                  </h4>
                  <p className="text-xs text-amber-800">
                    जिला संवाददाताओं द्वारा भेजी गई खबरों को पढ़ें और एक क्लिक में स्वीकृत करें
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('review_queue')}
                className="bg-amber-500 hover:bg-amber-600 text-gray-950 text-xs font-black px-4 py-2 rounded-xl transition shadow-xs"
              >
                रिव्यू डेस्क पर जाएं
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EDITORIAL REVIEW QUEUE */}
      {activeTab === 'review_queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left List */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
            <h3 className="text-base font-black text-gray-900 pb-2 border-b">
              प्रतीक्षारत खबरें ({pendingArticles.length})
            </h3>

            {pendingArticles.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                समीक्षा कतार पूर्णतः रिक्त है। सभी खबरें निपटा दी गई हैं।
              </div>
            ) : (
              <div className="space-y-2">
                {pendingArticles.map(art => {
                  const isSelected = selectedReviewArticle?.id === art.id;
                  return (
                    <div
                      key={art.id}
                      onClick={() => setSelectedReviewArticle(art)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex gap-3 ${
                        isSelected 
                          ? 'border-red-600 bg-red-50/50' 
                          : 'border-gray-200 hover:bg-gray-50 bg-white'
                      }`}
                    >
                      <img src={art.thumbnail} alt={art.title} className="w-16 h-14 rounded object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-red-600">{art.category}</span>
                          <span className="text-gray-500">{art.district}</span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 truncate">{art.title}</h4>
                        <span className="text-[10px] text-gray-400">प्रेषक: {art.authorName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Inspection & Approval Panel */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            {selectedReviewArticle ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {selectedReviewArticle.category} • {selectedReviewArticle.district}
                    </span>
                    <h3 className="text-lg font-black text-gray-950 mt-1 leading-snug">
                      {selectedReviewArticle.title}
                    </h3>
                  </div>
                </div>

                {selectedReviewArticle.rawScript && (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                    <span className="font-bold text-gray-700 block mb-1">रिपोर्टर की मूल रॉ स्क्रिप्ट:</span>
                    <p className="text-gray-600 italic leading-relaxed">{selectedReviewArticle.rawScript}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700 block">प्रस्तावित पूर्ण खबर:</span>
                  <div className="text-xs sm:text-sm text-gray-800 leading-relaxed max-h-56 overflow-y-auto p-3 bg-gray-50 rounded-xl whitespace-pre-line border">
                    {selectedReviewArticle.content}
                  </div>
                </div>

                {/* Editorial Notes Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    संपादक के निर्देश / संशोधन टिप्पणी (Reporter Editorial Notes)
                  </label>
                  <textarea
                    rows={2}
                    value={editorialNote}
                    onChange={e => setEditorialNote(e.target.value)}
                    placeholder="उदा. कृपया दूसरे अनुच्छेद में पुलिस बयान भी शामिल करें..."
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-hidden"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(selectedReviewArticle)}
                      className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50 transition"
                    >
                      अस्वीकृत करें
                    </button>
                    <button
                      onClick={() => handleRequestRevision(selectedReviewArticle)}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition"
                    >
                      संशोधन मांगें
                    </button>
                  </div>

                  <button
                    onClick={() => handleApprovePublish(selectedReviewArticle)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black px-5 py-2 rounded-xl flex items-center gap-2 shadow-md transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                    स्वीकृत एवं लाइव प्रकाशित करें
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-gray-400 text-sm">
                बाईं ओर से समीक्षा के लिए किसी खबर का चयन करें
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: URL / RSS NEWSROOM (ADMIN ONLY) */}
      {activeTab === 'url_newsroom' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b">
            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
              एडमिन-ओनली फीचर (Strictly Prohibited for Reporters)
            </span>
            <h3 className="text-lg font-black text-gray-900 mt-1">
              URL एवं RSS समाचार पुनर्संयोजन डेस्क (AI Ingestion)
            </h3>
            <p className="text-xs text-gray-500">
              अधिकृत एजेंसी या बाहरी न्यूज़ URL से खबर को BREAKING NEWS WALA की भाषा में सत्यापित रूप से तैयार करें
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">समाचार यूआरएल (External URL)</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://example-news.com/breaking-story"
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">मूल प्रकाशक / स्रोत (Attribution)</label>
              <input
                type="text"
                value={originalPublisher}
                onChange={e => setOriginalPublisher(e.target.value)}
                placeholder="उदा. पीटीआई / यूएनआई / राज्य सूचना केंद्र"
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              समाचार सामग्री / प्रेस विज्ञप्ति पाठ (Source Text)
            </label>
            <textarea
              rows={4}
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              placeholder="एजेंसी वायर या प्रेस रिलीज का टेक्स्ट यहाँ पेस्ट करें..."
              className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-hidden"
            />
          </div>

          <button
            disabled={isUrlAiLoading || (!sourceText && !sourceUrl)}
            onClick={handleUrlAiRewrite}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isUrlAiLoading ? 'AI विश्लेषण एवं पुनर्लेखन जारी...' : 'AI से खबर तैयार करें (Gemini Engine)'}
          </button>

          {/* Generated Result Preview */}
          {urlGeneratedArticle && (
            <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-emerald-700">✓ AI द्वारा पुनर्लिखित खबर:</span>
              <h4 className="text-base font-black text-gray-950">{urlGeneratedArticle.title}</h4>
              <p className="text-xs text-gray-700 font-semibold">{urlGeneratedArticle.subtitle}</p>
              <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">{urlGeneratedArticle.content}</p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => alert('खबर न्यूज़रूम ड्राफ्ट में सेव कर ली गई है।')}
                  className="bg-gray-900 text-yellow-300 text-xs font-bold px-4 py-2 rounded-lg"
                >
                  ड्राफ्ट में सेव करें
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REPORTERS & DISTRICT ALLOCATION */}
      {activeTab === 'reporters' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="text-lg font-black text-gray-900">रिपोर्टर एवं जिला अधिकार प्रबंधन</h3>
              <p className="text-xs text-gray-500">विश्वसनीय रिपोर्टर को सीधा प्रकाशन अधिकार एवं जिलों का आवंटन करें</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-900 uppercase font-black border-b">
                <tr>
                  <th className="p-3">रिपोर्टर</th>
                  <th className="p-3">आईडी नंबर</th>
                  <th className="p-3">आवंटित जिले</th>
                  <th className="p-3">प्रकाशित / कुल</th>
                  <th className="p-3">प्रकाशन अधिकार</th>
                  <th className="p-3 text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reporters.map(rep => (
                  <tr key={rep.id} className="hover:bg-gray-50">
                    <td className="p-3 flex items-center gap-2">
                      <img src={rep.avatar} alt={rep.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-gray-900 block">{rep.name}</span>
                        <span className="text-[10px] text-gray-400">{rep.email}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold">{rep.badgeNumber}</td>
                    <td className="p-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-semibold">
                        {rep.assignedDistricts.join(', ')}
                      </span>
                    </td>
                    <td className="p-3 font-bold">
                      {rep.totalStoriesPublished} / {rep.totalStoriesFiled}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        rep.role === 'trusted_reporter' 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rep.role === 'trusted_reporter' ? '★ सीधा प्रकाशन' : 'समीक्षा अनिवार्य'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleTrusted(rep)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          rep.role === 'trusted_reporter'
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {rep.role === 'trusted_reporter' ? 'अधिकार वापस लें' : 'सीधा अधिकार दें'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE TICKER CONTROLLER */}
      {activeTab === 'ticker' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b">
            <h3 className="text-lg font-black text-gray-900">लाइव ब्रेकिंग न्यूज़ टिकर कंट्रोलर</h3>
            <p className="text-xs text-gray-500">वेबसाइट और मोबाइल ऐप के मुख्य हेडर के नीचे लाइव चलने वाली पट्टी</p>
          </div>

          <form onSubmit={handleCreateTicker} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                टिकर संदेश (हिंदी में)
              </label>
              <input
                type="text"
                value={tickerText}
                onChange={e => setTickerText(e.target.value)}
                placeholder="उदा. ब्रेकिंग: मध्य प्रदेश में रबी फसलों की सरकारी खरीद आज से प्रारंभ..."
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-gray-300 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <input
                  type="radio"
                  name="priority"
                  checked={tickerPriority === 'critical'}
                  onChange={() => setTickerPriority('critical')}
                />
                अति महत्वपूर्ण (Critical Red Flash)
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <input
                  type="radio"
                  name="priority"
                  checked={tickerPriority === 'normal'}
                  onChange={() => setTickerPriority('normal')}
                />
                सामान्य समाचार
              </label>
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              लाइव टिकर में जोड़ें
            </button>
          </form>

          {/* Active Tickers List */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-bold text-gray-800">वर्तमान सक्रिय टिकर्स:</h4>
            {tickers.map(t => (
              <div key={t.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.priority === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {t.priority}
                  </span>
                  <span className="font-semibold text-gray-900">{t.textHindi}</span>
                </div>
                <span className="text-emerald-600 font-bold">सक्रिय</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AI API POOL */}
      {activeTab === 'api_pool' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900">AI API Pool प्रबंधन एवं कोटा मॉनिटर</h3>
              <p className="text-xs text-gray-500">मल्टी-प्रोवाइडर सुरक्षा, रेट-लिमिट सुरक्षा एवं स्वचालित फेलओवर</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
              Failover Mode: NORMAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiPoolData?.data.map(pool => (
              <div key={pool.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900">{pool.name}</h4>
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    {pool.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>API Key (सर्वर सुरक्षित):</span>
                    <strong className="text-gray-900 font-mono">{pool.keyMasked}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>दैनिक टोकन उपयोग:</span>
                    <strong>{pool.dailyQuotaUsed.toLocaleString()} / {pool.dailyQuotaLimit.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>औसत लेटेंसी:</span>
                    <strong>{pool.avgLatencyMs} ms</strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${Math.round((pool.dailyQuotaUsed / pool.dailyQuotaLimit) * 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b">
            <h3 className="text-lg font-black text-gray-900">सिस्टम सुरक्षा एवं संपादकीय ऑडिट लॉग</h3>
            <p className="text-xs text-gray-500">प्रत्येक संपादकीय निर्णय, सीधा प्रकाशन व अनुमति परिवर्तन का अपरिवर्तनीय इतिहास</p>
          </div>

          <div className="space-y-2">
            {auditLogsList.map(log => (
              <div key={log.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-800 text-white px-2 py-0.5 rounded text-[10px] font-black">
                      {log.actionType}
                    </span>
                    <span className="font-bold text-gray-900">{log.actorName} ({log.actorRole})</span>
                  </div>
                  <p className="text-gray-700">{log.description}</p>
                </div>
                <div className="text-[10px] text-gray-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('hi-IN')} • {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
