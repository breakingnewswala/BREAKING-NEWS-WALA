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
  ExternalLink,
  Users,
  Award,
  Layers,
  Search,
  Check,
  RotateCcw,
  Sliders,
  Rss,
  Share2,
  MessageSquare,
  Key,
  RefreshCw,
  Send,
  Clock,
  Database,
  DollarSign,
  Video,
  TrendingUp,
  Receipt,
  Briefcase,
  CreditCard,
  PenTool,
  Building2,
  Newspaper,
  Palette,
  Bot,
  Bookmark,
  Wheat,
  Archive,
  Layout,
  Coins,
  LogOut,
  FileQuestion,
  Download,
  CheckCheck,
  Cpu,
} from 'lucide-react';
import {
  AppRole,
  ArticleDetail,
  ReporterProfile,
  BreakingTickerItem,
  ApiPoolKeyItem,
  SystemAuditLogItem,
  AdBannerItem,
  MandiRateItem,
  DistrictItem,
  CategoryItem,
  EditorialFactCheckResult,
  IntegrationProviderItem,
  RssSourceItem,
  ImportedRssItemDto,
  SocialAccountItem,
  SocialPublishingJobItem,
  WhatsAppTemplateItem,
  WhatsAppSubscriberItem,
  WebhookLogItem,
  ApiPoolUsageSummary,
  SubscriptionPlanItem,
  AdCampaignItem,
  AdvertiserProfile,
  SponsoredArticleItem,
  InvoiceItem,
  BusinessDashboardSummary,
  CrmProposalItem,
  TaxConfigItem,
  AudienceOverviewSummary,
  ContentPerformanceSummary,
  AudienceSegmentRecord,
  ReaderFeedbackRecord,
  NotificationRecord,
  CreateDraftRequest,
} from '../types';
import { NavTab } from '../components/BottomNav';
import { BnwAiService } from '../services/aiService';
import { apiClient } from '../services/apiClient';
import { DIVISIONS } from '../data/mockNewsData';
import { EpaperStudioTab } from '../components/epaper/EpaperStudioTab';
import { NewsroomDeskScreen } from './NewsroomDeskScreen';
import { ReporterDeskScreen } from './ReporterDeskScreen';
import { GraphicsStudioScreen } from './GraphicsStudioScreen';
import { VideoStudioScreen } from './VideoStudioScreen';
import { AiNewsroomScreen } from './AiNewsroomScreen';
import { RssManagementDesk } from '../components/admin/RssManagementDesk';
import { ReporterCoinManagementDesk } from '../components/admin/ReporterCoinManagementDesk';

export type AdminTab =
  | 'overview'
  | 'review_queue'
  | 'reporters'
  | 'reporter_coins'
  | 'tickers'
  | 'ads'
  | 'mandi'
  | 'monetization'
  | 'audience'
  | 'api_pool'
  | 'audit_logs'
  | 'rss_management'
  | 'epaper_studio'
  | 'newsroom_studio'
  | 'reporter_studio'
  | 'graphics_studio'
  | 'videos_studio'
  | 'ai_newsroom_studio';

interface AdminControlScreenProps {
  articles: ArticleDetail[];
  pendingArticles: ArticleDetail[];
  reporters: ReporterProfile[];
  tickers: BreakingTickerItem[];
  ads: AdBannerItem[];
  mandiRates?: MandiRateItem[];
  apiPool: ApiPoolKeyItem[];
  auditLogs: SystemAuditLogItem[];
  districts: DistrictItem[];
  categories: CategoryItem[];
  currentRole?: AppRole;
  accountRole?: AppRole;
  onSwitchPersona?: (role: AppRole, targetTab?: NavTab) => void;
  onNavigateTab?: (tab: NavTab) => void;
  onApproveArticle: (articleId: string) => void;
  onRequestRevision: (articleId: string, comments: string) => void;
  onRejectArticle: (articleId: string) => void;
  onAddTicker: (ticker: BreakingTickerItem) => void;
  onToggleTicker: (tickerId: string) => void;
  onDeleteTicker: (tickerId: string) => void;
  onUpdateReporterRole: (reporterId: string, role: 'reporter' | 'trusted_reporter') => void;
  onToggleAdActive: (adId: string) => void;
  onAddAd?: (dto: Partial<AdBannerItem>) => Promise<void> | void;
  onDeleteAd?: (adId: string) => void;
  onAddMandiRate?: (dto: Partial<MandiRateItem>) => Promise<void> | void;
  onUpdateMandiRate?: (id: string, dto: Partial<MandiRateItem>) => Promise<void> | void;
  onDeleteMandiRate?: (id: string) => void;
  onBroadcastAlert: (title: string, district: string) => void;
  initialTab?: AdminTab;
  initialEpaperAction?: 'create' | 'drafts' | 'published' | 'templates' | 'header_templates' | 'archive';
  onSignOut?: () => void;
  bookmarkedArticles?: ArticleDetail[];
  reporterDrafts?: ArticleDetail[];
  onSubmitReporterDraft?: (draftReq: CreateDraftRequest, reporter?: ReporterProfile) => Promise<void> | void;
  onAddPendingArticle?: (article: Partial<ArticleDetail>) => void;
  onPublishArticle?: (article: Partial<ArticleDetail>) => Promise<void> | void;
  onClaimArticle?: (articleId: string, editorId?: string, editorName?: string) => void | Promise<void>;
  onReassignArticle?: (articleId: string, editorId: string, editorName?: string) => void | Promise<void>;
  onUpdatePriority?: (articleId: string, priority: any) => void;
  onToggleBreaking?: (articleId: string, isBreaking: boolean) => void;
  onSchedulePublication?: (articleId: string, scheduledAt: string) => void;
  onUpdateReporterCoins?: (reporterId: string, amount: number, reason: string) => void;
}

export const AdminControlScreen: React.FC<AdminControlScreenProps> = ({
  articles,
  pendingArticles,
  reporters,
  tickers,
  ads,
  mandiRates = [],
  apiPool,
  auditLogs,
  districts,
  categories,
  currentRole = 'MASTER_ADMIN',
  accountRole = currentRole,
  onSwitchPersona,
  onNavigateTab,
  onApproveArticle,
  onRequestRevision,
  onRejectArticle,
  onAddTicker,
  onToggleTicker,
  onDeleteTicker,
  onUpdateReporterRole,
  onToggleAdActive,
  onAddAd,
  onDeleteAd,
  onAddMandiRate,
  onUpdateMandiRate,
  onDeleteMandiRate,
  onBroadcastAlert,
  initialTab,
  initialEpaperAction,
  onSignOut,
  bookmarkedArticles = [],
  reporterDrafts = [],
  onSubmitReporterDraft,
  onAddPendingArticle,
  onPublishArticle,
  onClaimArticle,
  onReassignArticle,
  onUpdatePriority,
  onToggleBreaking,
  onSchedulePublication,
  onUpdateReporterCoins,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'overview');
  const [epaperAction, setEpaperAction] = useState<'create' | 'drafts' | 'published' | 'templates' | 'header_templates' | 'archive' | undefined>(initialEpaperAction);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (initialEpaperAction) setEpaperAction(initialEpaperAction);
  }, [initialTab, initialEpaperAction]);

  // Review Queue state
  const [selectedReviewArticleId, setSelectedReviewArticleId] = useState<string>(
    pendingArticles[0]?.id || ''
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<EditorialFactCheckResult | null>(null);
  const [revisionComments, setRevisionComments] = useState('');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);

  // Master Admin Profile Bar Modals
  const [showSavedNewsModal, setShowSavedNewsModal] = useState(false);
  const [showPdfGuideModal, setShowPdfGuideModal] = useState(false);

  // New Ticker Form State
  const [newTickerText, setNewTickerText] = useState('');
  const [newTickerDistrict, setNewTickerDistrict] = useState('पूरा मध्य प्रदेश');
  const [newTickerPriority, setNewTickerPriority] = useState<'normal' | 'critical'>('critical');

  // Broadcast Alert Form State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastHeadline, setBroadcastHeadline] = useState('');
  const [broadcastDistrict, setBroadcastDistrict] = useState('पूरा मध्य प्रदेश');
  const [broadcastToast, setBroadcastToast] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // New Ad Banner Form State
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdAdvertiser, setNewAdAdvertiser] = useState('');
  const [newAdPlacement, setNewAdPlacement] = useState<'top_leaderboard' | 'sidebar' | 'in_feed' | 'sticky_bottom'>('top_leaderboard');
  const [newAdImageUrl, setNewAdImageUrl] = useState(
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&auto=format&fit=crop&q=80'
  );
  const [newAdTargetUrl, setNewAdTargetUrl] = useState('https://breakingnewswala.com');

  // Mandi Rates CRUD State
  const [newMandiCommodity, setNewMandiCommodity] = useState('');
  const [newMandiName, setNewMandiName] = useState('');
  const [newMandiDistrict, setNewMandiDistrict] = useState('भोपाल');
  const [newMandiModalPrice, setNewMandiModalPrice] = useState('');
  const [newMandiMinPrice, setNewMandiMinPrice] = useState('');
  const [newMandiMaxPrice, setNewMandiMaxPrice] = useState('');
  const [editingMandiId, setEditingMandiId] = useState<string | null>(null);
  const [editMandiModal, setEditMandiModal] = useState('');
  const [editMandiMin, setEditMandiMin] = useState('');
  const [editMandiMax, setEditMandiMax] = useState('');

  // Reporter Search / Filter
  const [reporterSearch, setReporterSearch] = useState('');

  // Master Admin Reporter WhatsApp Quota State (Step 16 / FINDING-15-03)
  const [reporterQuotas, setReporterQuotas] = useState<Record<string, { used: number; maxDaily: number; remaining: number }>>({});
  const [editingQuotaReporterId, setEditingQuotaReporterId] = useState<string | null>(null);
  const [editingQuotaValue, setEditingQuotaValue] = useState<number>(20);
  const [isUpdatingQuota, setIsUpdatingQuota] = useState<boolean>(false);
  const [quotaFeedback, setQuotaFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [loadingQuotas, setLoadingQuotas] = useState<boolean>(false);

  const fetchReporterQuotas = async () => {
    setLoadingQuotas(true);
    const quotas: Record<string, { used: number; maxDaily: number; remaining: number }> = {};
    try {
      await Promise.all(
        reporters.map(async (rep) => {
          try {
            const q = await apiClient.epaper.getReporterWhatsAppQuota(rep.id);
            quotas[rep.id] = { used: q.used, maxDaily: q.maxDaily, remaining: q.remaining };
          } catch {
            quotas[rep.id] = { used: 0, maxDaily: 20, remaining: 20 };
          }
        })
      );
      setReporterQuotas(quotas);
    } catch {
      // Fallback
    } finally {
      setLoadingQuotas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reporters') {
      fetchReporterQuotas();
    }
  }, [activeTab]);

  const handleSaveReporterQuota = async (reporterId: string) => {
    if (editingQuotaValue < 0 || isNaN(editingQuotaValue)) {
      setQuotaFeedback({ text: 'कोटा एक मान्य गैर-ऋणात्मक संख्या होनी चाहिए', isError: true });
      return;
    }
    setIsUpdatingQuota(true);
    setQuotaFeedback(null);
    try {
      const res = await apiClient.epaper.updateReporterWhatsAppQuota(reporterId, editingQuotaValue);
      setReporterQuotas((prev) => {
        const existing = prev[reporterId] || { used: 0, maxDaily: 20, remaining: 20 };
        return {
          ...prev,
          [reporterId]: {
            ...existing,
            maxDaily: res.maxDaily,
            remaining: Math.max(0, res.maxDaily - existing.used),
          },
        };
      });
      setQuotaFeedback({ text: `संवाददाता कोटा सफलतापूर्वक अपडेट हुआ: ${res.maxDaily} जनरेशन/दिन`, isError: false });
      setEditingQuotaReporterId(null);
    } catch (err: any) {
      setQuotaFeedback({ text: err.message || 'कोटा अपडेट करने में त्रुटि', isError: true });
    } finally {
      setIsUpdatingQuota(false);
    }
  };

  // =========================================================================
  // MASTER EXECUTION 024: INTEGRATION & API POOL DASHBOARD STATE
  // =========================================================================
  const [integrationSubTab, setIntegrationSubTab] = useState<'providers' | 'rss' | 'social' | 'whatsapp' | 'webhooks'>('providers');
  const [liveProviders, setLiveProviders] = useState<IntegrationProviderItem[]>([]);
  const [liveUsage, setLiveUsage] = useState<ApiPoolUsageSummary | null>(null);
  const [rssSources, setRssSources] = useState<RssSourceItem[]>([]);
  const [rssItems, setRssItems] = useState<ImportedRssItemDto[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountItem[]>([]);
  const [socialJobs, setSocialJobs] = useState<SocialPublishingJobItem[]>([]);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [waSubscribers, setWaSubscribers] = useState<WhatsAppSubscriberItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [integrationMsg, setIntegrationMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // New API Provider Modal State
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvType, setNewProvType] = useState('GEMINI');
  const [newProvKey, setNewProvKey] = useState('');
  const [newProvBaseUrl, setNewProvBaseUrl] = useState('');
  const [newProvDailyLimit, setNewProvDailyLimit] = useState(100000);

  // Update Existing Provider Key Modal State
  const [showUpdateKeyModal, setShowUpdateKeyModal] = useState(false);
  const [selectedProviderForEdit, setSelectedProviderForEdit] = useState<IntegrationProviderItem | null>(null);
  const [editKeyInput, setEditKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // New RSS Source Form
  const [newRssName, setNewRssName] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');
  const [newRssPublisher, setNewRssPublisher] = useState('');
  const [newRssCategory, setNewRssCategory] = useState('madhya-pradesh');

  // Webhook Test Tester
  const [testWebhookPayload, setTestWebhookPayload] = useState('{"event":"news_alert","title":"भोपाल में मेट्रो विस्तार"}');
  const [testWebhookSecret, setTestWebhookSecret] = useState('bnw_default_test_webhook_secret_2026');
  const [testWebhookSig, setTestWebhookSig] = useState('');
  const [testWebhookResult, setTestWebhookResult] = useState<any>(null);

  // WhatsApp Simulator
  const [simWaPhone, setSimWaPhone] = useState('+919826011111');
  const [simWaKeyword, setSimWaKeyword] = useState('STOP');

  const loadIntegrationData = async () => {
    setLoadingIntegrations(true);
    try {
      const [provs, usage, sources, items, accounts, jobs, templates, subs, logs] = await Promise.all([
        apiClient.integrations.getProviders(),
        apiClient.integrations.getUsageSummary(),
        apiClient.rss.listSources(),
        apiClient.rss.listItems({ limit: 10 }),
        apiClient.social.getAccounts(),
        apiClient.social.listJobs(),
        apiClient.whatsapp.getTemplates(),
        apiClient.whatsapp.getSubscribers(),
        apiClient.webhooks.listLogs(20),
      ]);
      setLiveProviders(provs);
      setLiveUsage(usage);
      setRssSources(sources.items);
      setRssItems(items.items);
      setSocialAccounts(accounts);
      setSocialJobs(jobs);
      setWaTemplates(templates);
      setWaSubscribers(subs);
      setWebhookLogs(logs);
    } catch {
      // Fallback gracefully
    } finally {
      setLoadingIntegrations(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'api_pool') {
      loadIntegrationData();
    }
  }, [activeTab]);

  const handleToggleProvider = async (id: string, currentEnabled: boolean) => {
    try {
      await apiClient.integrations.toggleProvider(id, !currentEnabled);
      setIntegrationMsg({ text: `प्रोवाइडर स्थिति सफलतापूर्वक बदली गई।` });
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'स्थिति बदलने में विफल', isError: true });
    }
  };

  const handleTestProviderHealth = async (id: string) => {
    try {
      const res = await apiClient.integrations.testHealth(id);
      setIntegrationMsg({ text: `${res.name}: लाइव हेल्थ चेक संपन्न [स्थिति: ${res.healthStatus}, लेटेंसी: ${res.avgLatencyMs}ms]` });
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'हेल्थ टेस्ट विफल', isError: true });
    }
  };

  const handleUpdateProviderKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderForEdit || !editKeyInput.trim()) return;
    setSavingKey(true);
    try {
      await apiClient.integrations.updateProvider(selectedProviderForEdit.id, {
        apiKey: editKeyInput.trim(),
        isEnabled: true,
      });
      setIntegrationMsg({ text: `✨ ${selectedProviderForEdit.name}: API Key सफलतापूर्वक अपडेट व सक्रिय कर दी गई!` });
      setShowUpdateKeyModal(false);
      setEditKeyInput('');
      setSelectedProviderForEdit(null);
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'Key अपडेट विफल', isError: true });
    } finally {
      setSavingKey(false);
    }
  };

  const handleAddProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim() || !newProvKey.trim()) return;
    try {
      const created = await apiClient.integrations.registerProvider({
        name: newProvName.trim(),
        providerId: `prov-${newProvType.toLowerCase()}-${Date.now()}`,
        category: 'ai_services',
        apiKey: newProvKey.trim(),
        baseUrl: newProvBaseUrl.trim() || undefined,
        dailyQuotaLimit: Number(newProvDailyLimit) || 100000,
        monthlyQuotaLimit: (Number(newProvDailyLimit) || 100000) * 30,
        rateLimitInfo: '60 RPM, 1000 TPM',
        costPer1kInputTokensUsd: 0.0015,
        costPer1kOutputTokensUsd: 0.002,
      });
      setLiveProviders((prev) => [created, ...prev]);
      setShowAddProviderModal(false);
      setNewProvName('');
      setNewProvKey('');
      setNewProvBaseUrl('');
      setIntegrationMsg({ text: `नया API प्रोवाइडर "${created.name}" सफलतापूर्वक जोड़ दिया गया!` });
    } catch (err: any) {
      setIntegrationMsg({ text: `प्रोवाइडर जोड़ने में त्रुटि: ${err.message}`, isError: true });
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!window.confirm(`क्या आप सचमुच API प्रोवाइडर "${name}" को हटाना चाहते हैं?`)) return;
    try {
      await apiClient.integrations.deleteProvider(id);
      setLiveProviders((prev) => prev.filter((p) => p.id !== id));
      setIntegrationMsg({ text: `API प्रोवाइडर "${name}" सफलतापूर्वक हटा दिया गया।` });
    } catch (err: any) {
      setIntegrationMsg({ text: `हटाने में त्रुटि: ${err.message}`, isError: true });
    }
  };

  const handleCreateRssSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRssName || !newRssUrl || !newRssPublisher) return;
    try {
      await apiClient.rss.createSource({
        name: newRssName,
        feedUrl: newRssUrl,
        publisherName: newRssPublisher,
        sourceCategory: newRssCategory,
      });
      setNewRssName('');
      setNewRssUrl('');
      setNewRssPublisher('');
      setIntegrationMsg({ text: 'RSS स्रोत सफलतापूर्वक जोड़ा गया (SSRF सत्यापित)।' });
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'स्रोत जोड़ने में विफल', isError: true });
    }
  };

  const handleSyncRssSource = async (id: string) => {
    try {
      const res = await apiClient.rss.syncSource(id);
      setIntegrationMsg({ text: `सिंक संपन्न! आयातित: ${res.importedCount}, डुप्लिकेट रोके गए: ${res.duplicateCount}` });
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'सिंक विफल', isError: true });
    }
  };

  const handleConvertWireItem = async (id: string) => {
    try {
      const res = await apiClient.rss.convertToDraft(id);
      setIntegrationMsg({ text: res.message || 'वायर सामग्री को ड्राफ्ट में सहेज लिया गया।' });
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'रूपांतरण विफल', isError: true });
    }
  };

  const handleApproveSocialJob = async (id: string) => {
    try {
      await apiClient.social.approveJob(id);
      setIntegrationMsg({ text: 'सोशल पोस्ट संपादकीय स्तर पर अनुमोदित।' });
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'अनुमोदन विफल', isError: true });
    }
  };

  const handlePublishSocialJob = async (id: string) => {
    try {
      const res = await apiClient.social.publishImmediately(id);
      setIntegrationMsg({ text: `सोशल मीडिया पर प्रसारण संपन्न! (सफल: ${res.successfulDeliveries})` });
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'प्रकाशन विफल', isError: true });
    }
  };

  const handleTestWebhookVerify = async () => {
    try {
      const res = await apiClient.webhooks.testVerify({
        rawBody: testWebhookPayload,
        signature: testWebhookSig,
        secret: testWebhookSecret,
        timestamp: Math.floor(Date.now() / 1000),
      });
      setTestWebhookResult(res);
    } catch (err: any) {
      setTestWebhookResult({ isValid: false, error: err.message });
    }
  };

  const handleSimulateWhatsAppKeyword = async () => {
    try {
      if (simWaKeyword.toUpperCase() === 'STOP' || simWaKeyword === 'रोकें') {
        await apiClient.whatsapp.optOut({ phoneNumber: simWaPhone, reason: 'keyword_stop_simulated' });
        setIntegrationMsg({ text: `${simWaPhone} को सफलतापूर्वक अनसब्सक्राइब (OPTED_OUT) कर दिया गया।` });
      } else {
        await apiClient.whatsapp.optIn({ phoneNumber: simWaPhone });
        setIntegrationMsg({ text: `${simWaPhone} का ऑप्ट-इन (ACTIVE) दर्ज हुआ।` });
      }
      loadIntegrationData();
    } catch (err: any) {
      setIntegrationMsg({ text: err.message || 'कार्रवाई विफल', isError: true });
    }
  };

  // =========================================================================
  // MASTER EXECUTION 025: BUSINESS & MONETIZATION DASHBOARD STATE
  // =========================================================================
  const [monetizationSubTab, setMonetizationSubTab] = useState<
    'dashboard' | 'plans' | 'campaigns' | 'sponsored' | 'crm' | 'invoices'
  >('dashboard');
  const [dashboardSummary, setDashboardSummary] = useState<BusinessDashboardSummary | null>(null);
  const [subPlans, setSubPlans] = useState<SubscriptionPlanItem[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaignItem[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserProfile[]>([]);
  const [sponsoredArticles, setSponsoredArticles] = useState<SponsoredArticleItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [proposals, setProposals] = useState<CrmProposalItem[]>([]);
  const [taxConfig, setTaxConfig] = useState<TaxConfigItem | null>(null);
  const [loadingMonetization, setLoadingMonetization] = useState(false);
  const [monetizationMsg, setMonetizationMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadMonetizationData = async () => {
    setLoadingMonetization(true);
    try {
      const [summary, plansData, campaignsData, advertisersData, sponsoredData, invoicesData, proposalsData, taxData] = await Promise.all([
        apiClient.monetization.getDashboardSummary(),
        apiClient.monetization.getPlans(),
        apiClient.monetization.listCampaigns(),
        apiClient.monetization.listAdvertisers(),
        apiClient.monetization.listSponsoredArticles(),
        apiClient.monetization.listInvoices(),
        apiClient.monetization.getCrmProposals(),
        apiClient.monetization.getTaxConfig(),
      ]);
      setDashboardSummary(summary);
      setSubPlans(plansData || []);
      setAdCampaigns(campaignsData || []);
      setAdvertisers(advertisersData || []);
      setSponsoredArticles(sponsoredData || []);
      setInvoices(invoicesData || []);
      setProposals(proposalsData || []);
      setTaxConfig(taxData || null);
    } catch (err: any) {
      console.error('Failed to load monetization data:', err);
    } finally {
      setLoadingMonetization(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monetization') {
      loadMonetizationData();
    }
  }, [activeTab]);

  const handleTogglePlan = async (id: string, currentActive: boolean) => {
    try {
      await apiClient.monetization.togglePlan(id, !currentActive);
      setMonetizationMsg({ text: `सब्सक्रिप्शन प्लान स्थिति सफलतापूर्वक बदली गई।` });
      loadMonetizationData();
    } catch (err: any) {
      setMonetizationMsg({ text: err.message || 'प्लान स्थिति बदलने में विफल', isError: true });
    }
  };

  const handleApproveCampaign = async (id: string) => {
    try {
      await apiClient.monetization.reviewCampaign(id, 'approve', 'अनुमोदित (Admin Approved via Dashboard)');
      setMonetizationMsg({ text: `विज्ञापन अभियान अनुमोदित हुआ!` });
      loadMonetizationData();
    } catch (err: any) {
      setMonetizationMsg({ text: err.message || 'अभियान अनुमोदन विफल', isError: true });
    }
  };

  const handleRejectCampaign = async (id: string) => {
    try {
      await apiClient.monetization.reviewCampaign(id, 'reject', 'अस्वीकृत - संपादकीय व सुरक्षा मानकों के अनुरूप नहीं');
      setMonetizationMsg({ text: `विज्ञापन अभियान अस्वीकृत किया गया।` });
      loadMonetizationData();
    } catch (err: any) {
      setMonetizationMsg({ text: err.message || 'कार्रवाई विफल', isError: true });
    }
  };

  const handleReviewSponsored = async (id: string, approve: boolean) => {
    try {
      await apiClient.monetization.reviewSponsoredArticle(id, approve ? 'approve' : 'reject', approve ? 'संपादकीय रूप से स्वीकृत' : 'अस्वीकृत');
      setMonetizationMsg({
        text: approve
          ? `प्रायोजित लेख स्वीकृत! न्यूज़ रूम ड्राफ्ट निर्मित किया गया।`
          : `प्रायोजित लेख अस्वीकृत।`,
      });
      loadMonetizationData();
    } catch (err: any) {
      setMonetizationMsg({ text: err.message || 'समीक्षा विफल', isError: true });
    }
  };

  const handleVerifyAdvertiser = async (id: string) => {
    try {
      await apiClient.monetization.verifyAdvertiser(id);
      setMonetizationMsg({ text: `विज्ञापनदाता सफलतापूर्वक सत्यापित (Verified) हुआ।` });
      loadMonetizationData();
    } catch (err: any) {
      setMonetizationMsg({ text: err.message || 'सत्यापन विफल', isError: true });
    }
  };

  const handleMarkInvoicePaid = async (id: string) => {
    try {
      await apiClient.monetization.markInvoicePaid(id);
      setMonetizationMsg({ text: `इनवॉइस सफलतापूर्वक भुगतान चिह्नित (PAID) किया गया।` });
      loadMonetizationData();
    } catch (err: any) {
      setMonetizationMsg({ text: err.message || 'इनवॉइस अपडेट विफल', isError: true });
    }
  };

  // =========================================================================
  // MASTER EXECUTION 026: AUDIENCE GROWTH & INTELLIGENCE STATE & HANDLERS
  // =========================================================================
  const [audienceSubTab, setAudienceSubTab] = useState<
    'overview' | 'content_perf' | 'segments' | 'notifications' | 'feedback' | 'privacy'
  >('overview');
  const [audienceOverview, setAudienceOverview] = useState<AudienceOverviewSummary | null>(null);
  const [contentPerf, setContentPerf] = useState<ContentPerformanceSummary | null>(null);
  const [audienceSegments, setAudienceSegments] = useState<AudienceSegmentRecord[]>([]);
  const [feedbackList, setFeedbackList] = useState<ReaderFeedbackRecord[]>([]);
  const [audienceTimeRange, setAudienceTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [audienceBroadcastTitle, setAudienceBroadcastTitle] = useState('');
  const [audienceBroadcastMessage, setAudienceBroadcastMessage] = useState('');
  const [audienceBroadcastDistrict, setAudienceBroadcastDistrict] = useState('ALL');
  const [audienceBroadcastPriority, setAudienceBroadcastPriority] = useState<'normal' | 'high' | 'critical'>('normal');
  const [audienceMsg, setAudienceMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [loadingAudience, setLoadingAudience] = useState(false);

  const loadAudienceData = async () => {
    setLoadingAudience(true);
    try {
      const [overview, perf, segments, feedback] = await Promise.all([
        apiClient.audience.getDashboardOverview(audienceTimeRange).catch(() => null),
        apiClient.audience.getContentPerformance(audienceTimeRange).catch(() => null),
        apiClient.audience.getSegments().catch(() => []),
        apiClient.audience.getFeedbackList().catch(() => []),
      ]);
      if (overview) setAudienceOverview(overview);
      if (perf) setContentPerf(perf);
      if (segments) setAudienceSegments(segments);
      if (feedback) setFeedbackList(feedback);
    } catch (err: any) {
      console.warn('Failed to load audience data:', err);
    } finally {
      setLoadingAudience(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audience') {
      loadAudienceData();
    }
  }, [activeTab, audienceTimeRange]);

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audienceBroadcastTitle.trim() || !audienceBroadcastMessage.trim()) return;
    try {
      const res = await apiClient.audience.broadcastNotification({
        title: audienceBroadcastTitle.trim(),
        message: audienceBroadcastMessage.trim(),
        district: audienceBroadcastDistrict,
        priority: audienceBroadcastPriority,
      });
      setAudienceMsg({ text: res.suppressedDuplicate ? res.message : 'अधिसूचना सफलतापूर्वक प्रसारित कर दी गई!' });
      setAudienceBroadcastTitle('');
      setAudienceBroadcastMessage('');
    } catch (err: any) {
      setAudienceMsg({ text: err.message || 'अधिसूचना प्रसारण विफल', isError: true });
    }
  };

  const handleUpdateFeedbackStatus = async (id: string, status: string) => {
    try {
      await apiClient.audience.updateFeedbackStatus(id, status, 'संपादकीय डैशबोर्ड द्वारा स्थिति अद्यतित');
      setAudienceMsg({ text: 'फीडबैक स्थिति सफलतापूर्वक अद्यतित हुई!' });
      loadAudienceData();
    } catch (err: any) {
      setAudienceMsg({ text: err.message || 'फीडबैक स्थिति अद्यतन विफल', isError: true });
    }
  };

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
      setAdminNotice({ type: 'error', text: 'AI तथ्य-जांच विश्लेषण में समस्या हुई।' });
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
    setAdminNotice({ type: 'success', text: 'नया ब्रेकिंग टिकर लाइव किया गया।' });
  };

  const handleCreateAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdAdvertiser.trim()) {
      setAdminNotice({ type: 'error', text: 'कृपया विज्ञापन शीर्षक व विज्ञापनदाता का नाम भरें।' });
      return;
    }
    await onAddAd?.({
      title: newAdTitle.trim(),
      advertiserName: newAdAdvertiser.trim(),
      placement: newAdPlacement,
      imageUrl: newAdImageUrl.trim() || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&auto=format&fit=crop&q=80',
      targetUrl: newAdTargetUrl.trim() || 'https://breakingnewswala.com',
      isActive: true,
    });
    setNewAdTitle('');
    setNewAdAdvertiser('');
    setAdminNotice({ type: 'success', text: 'नया विज्ञापन स्लॉट सफलतापूर्वक जोड़ा गया।' });
  };

  const handleCreateMandiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMandiCommodity.trim() || !newMandiName.trim() || !newMandiModalPrice) {
      setAdminNotice({ type: 'error', text: 'कृपया फसल, मंडी व मॉडल भाव अवश्य दर्ज करें।' });
      return;
    }
    const modal = Number(newMandiModalPrice);
    const min = Number(newMandiMinPrice) || Math.round(modal * 0.9);
    const max = Number(newMandiMaxPrice) || Math.round(modal * 1.1);
    await onAddMandiRate?.({
      commodityName: newMandiCommodity.trim(),
      mandiName: newMandiName.trim(),
      districtName: newMandiDistrict.trim() || 'भोपाल',
      modalPrice: modal,
      minPrice: min,
      maxPrice: max,
    });
    setNewMandiCommodity('');
    setNewMandiName('');
    setNewMandiModalPrice('');
    setNewMandiMinPrice('');
    setNewMandiMaxPrice('');
    setAdminNotice({ type: 'success', text: 'नया मंडी भाव सफलतापूर्वक अपडेट किया गया।' });
  };

  const handleSendBroadcast = () => {
    if (!broadcastHeadline.trim()) {
      setAdminNotice({ type: 'error', text: 'कृपया अलर्ट शीर्षक दर्ज करें।' });
      return;
    }
    onBroadcastAlert(broadcastHeadline.trim(), broadcastDistrict);
    setShowBroadcastModal(false);
    setBroadcastToast(`🚨 राज्यव्यापी अलर्ट जारी किया गया: ${broadcastHeadline.trim()}`);
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
      {/* 1. Master Admin System Profile & Session Bar */}
      <div className="bg-slate-950 text-white px-4 py-2 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">मास्टर एडमिनिस्ट्रेटर सत्र सक्रिय:</span>
            <span className="font-bold text-amber-400 font-mono">breakingnewswala.com@gmail.com</span>
            <span className="text-[10px] bg-red-700 text-white px-2 py-0.5 rounded font-extrabold">SUPER ADMIN</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowSavedNewsModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>सहेजे समाचार ({bookmarkedArticles.length})</span>
            </button>

            <button
              onClick={() => setShowPdfGuideModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileQuestion className="w-3.5 h-3.5 text-blue-400" />
              <span>सहायता व PDF गाइड</span>
            </button>

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लॉग आउट</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Control Room Title Header */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-lg text-red-400 shrink-0">
              <ShieldCheck className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black tracking-tight font-serif">
                  एडमिनिस्ट्रेटिव कंट्रोल रूम
                </h1>
                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                  MASTER SUITE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                55 जिलों का केंद्रीय संपादकीय, संवाददाता मान्यता, विज्ञापन एवं सिस्टम मॉनिटर
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
              <span>राज्यव्यापी ब्रेकिंग अलर्ट</span>
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Toast Notification */}
      {broadcastToast && (
        <div className="max-w-7xl mx-auto mt-2.5 px-4">
          <div className="bg-red-600 text-white p-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center justify-between">
            <span>{broadcastToast}</span>
            <button onClick={() => setBroadcastToast(null)} className="text-white hover:text-slate-200 cursor-pointer">
              ✕
            </button>
          </div>
        </div>
      )}

      {adminNotice && (
        <div className="max-w-7xl mx-auto mt-2.5 px-4">
          <div
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
              adminNotice.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            <span>{adminNotice.text}</span>
            <button onClick={() => setAdminNotice(null)} className="px-2 font-bold cursor-pointer">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Reorganized 2-Row Admin Navigation Bar (Zero Cutoff - All Tabs Visible) */}
      <div className="bg-white border-b border-slate-200 sticky top-[56px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-2 space-y-1.5">
          {/* ROW 1: Core Operations */}
          <div className="flex flex-wrap items-center gap-1 text-xs font-bold">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1.5">
              कोर संचालन:
            </span>

            <button
              onClick={() => setActiveTab('overview')}
              className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-400 font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-red-600" />
              <span>सिस्टम ओवरव्यू</span>
            </button>

            <button
              onClick={() => setActiveTab('review_queue')}
              className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'review_queue'
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-400 font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-red-600" />
              <span>समीक्षा कतार</span>
              {pendingArticles.length > 0 && (
                <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-black">
                  {pendingArticles.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reporters')}
              className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'reporters'
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-400 font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>संवाददाता मान्यता ({reporters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reporter_coins')}
              className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'reporter_coins'
                  ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-400 font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>संवाददाता कॉइन प्रबंधन</span>
            </button>

            <button
              onClick={() => setActiveTab('tickers')}
              className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'tickers'
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-400 font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-500" />
              <span>ब्रेकिंग टिकर ({tickers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ads')}
              className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'ads'
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-400 font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>विज्ञापन ({ads.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('mandi')}
              className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'mandi'
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400 font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Wheat className="w-3.5 h-3.5 text-emerald-600" />
              <span>मंडी भाव ({mandiRates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rss_management')}
              className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'rss_management'
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400 font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Rss className="w-3.5 h-3.5 text-indigo-600" />
              <span>RSS प्रबंधन (ऑटो AI फ़ीड)</span>
            </button>
          </div>

          {/* ROW 2: Embedded Desks & Studios (NO REDIRECTION) */}
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold border-t border-slate-100 pt-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1.5">
              एकीकृत स्टूडियो:
            </span>

            <button
              onClick={() => setActiveTab('newsroom_studio')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'newsroom_studio'
                  ? 'bg-red-600 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Building2 className="w-3 h-3 text-red-500" />
              <span>न्यूज़रूम डेस्क</span>
              {pendingArticles.length > 0 && (
                <span className="px-1 bg-red-800 text-white rounded-full text-[9px]">
                  {pendingArticles.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reporter_studio')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'reporter_studio'
                  ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <PenTool className="w-3 h-3 text-blue-500" />
              <span>रिपोर्टर डेस्क</span>
            </button>

            <button
              onClick={() => setActiveTab('epaper_studio')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'epaper_studio'
                  ? 'bg-indigo-600 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Newspaper className="w-3 h-3 text-indigo-500" />
              <span>ई-पेपर प्रबंधन (Studio)</span>
            </button>

            <button
              onClick={() => setActiveTab('graphics_studio')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'graphics_studio'
                  ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Palette className="w-3 h-3 text-amber-500" />
              <span>ग्राफ़िक्स स्टूडियो</span>
            </button>

            <button
              onClick={() => setActiveTab('videos_studio')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'videos_studio'
                  ? 'bg-red-700 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Video className="w-3 h-3 text-red-500" />
              <span>वीडियो स्टूडियो</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_newsroom_studio')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'ai_newsroom_studio'
                  ? 'bg-purple-700 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Bot className="w-3 h-3 text-purple-600" />
              <span>AI न्यूज़ रूम</span>
            </button>

            <button
              onClick={() => setActiveTab('api_pool')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'api_pool'
                  ? 'bg-slate-900 text-amber-300 font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Server className="w-3 h-3 text-indigo-500" />
              <span>AI API Pool</span>
            </button>

            <button
              onClick={() => setActiveTab('monetization')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'monetization'
                  ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>बिजनेस व मुद्रीकरण</span>
            </button>

            <button
              onClick={() => setActiveTab('audience')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'audience'
                  ? 'bg-blue-700 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Users className="w-3 h-3 text-blue-500" />
              <span>दर्शक व सहभागिता</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-slate-800 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>ऑडिट लॉग्स</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Tab Body Container */}
      <div className="max-w-7xl mx-auto px-4 py-4">
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

            {/* E-PAPER MANAGEMENT SECTION (MASTER ADMIN CONTROL PANEL) */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl border-2 border-red-200/80 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-red-600 text-white rounded-lg shadow-xs">
                      <Newspaper className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>ई-पेपर प्रबंधन प्रणाली</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                          E-PAPER MANAGEMENT
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        मध्य प्रदेश के 55 जिलों के लिए दैनिक व विशेष डिजिटल संस्करण निर्माण, प्रारूप, प्रकाशन एवं अभिलेखागार नियंत्रण
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button Prominently Displayed */}
                <button
                  onClick={() => {
                    setEpaperAction('create');
                    setActiveTab('epaper_studio');
                  }}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group ring-2 ring-red-500/20 active:scale-98"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                  <span>+ नया ई-पेपर बनाएँ (Create New E-Paper)</span>
                </button>
              </div>

              {/* 4 E-Paper Management Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => {
                    setEpaperAction('drafts');
                    setActiveTab('epaper_studio');
                  }}
                  className="p-4 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-xl cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-amber-100 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                        Action 2
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800">
                        Manage Draft Editions
                      </h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        प्रारूप संस्करण प्रबंधन
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      अधूरे, संपादनरत एवं अनुमोदन के लिए लंबित प्रारूप संस्करणों को पुनः खोलें व संपादित करें।
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                    <span>प्रारूप खोलें</span> &rarr;
                  </div>
                </div>

                <div
                  onClick={() => {
                    setEpaperAction('published');
                    setActiveTab('epaper_studio');
                  }}
                  className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-xl cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        Action 3
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                        Manage Published Editions
                      </h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        प्रकाशित संस्करण प्रबंधन
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      लाइव पाठकों के लिए प्रसारित संस्करणों की स्थिति, पेज रीच व डाउनलोड एनालिटिक्स देखें।
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <span>प्रकाशित सूची</span> &rarr;
                  </div>
                </div>

                <div
                  onClick={() => {
                    setEpaperAction('templates');
                    setActiveTab('epaper_studio');
                  }}
                  className="p-4 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-400 rounded-xl cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-purple-100 text-purple-700 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Layout className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                        Action 4
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-800">
                        E-Paper Template Library
                      </h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        ई-पेपर टेम्पलेट लाइब्रेरी
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ब्रॉडशीट (32.9 × 52 cm) 8-कॉलम ग्रिड लेआउट, फ्रंट पेज, संपादकीय और खेल पृष्ठ टेम्पलेट्स।
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-purple-700 flex items-center gap-1">
                    <span>टेम्पलेट्स देखें</span> &rarr;
                  </div>
                </div>

                <div
                  onClick={() => {
                    setEpaperAction('header_templates');
                    setActiveTab('epaper_studio');
                  }}
                  className="p-4 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-xl cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-red-100 text-red-700 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <Newspaper className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                        Master Admin
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-700">
                        Header Template Manager
                      </h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        हेडर टेम्पलेट प्रबंधक
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      मास्टर एडमिन हेडर डिज़ाइनर: क्लासिक, मॉडर्न, बोल्ड, मिनिमल व विशेषांक मास्टहेड संपादन व प्रबंधन।
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-red-700 flex items-center gap-1">
                    <span>हेडर डिज़ाइनर खोलें</span> &rarr;
                  </div>
                </div>

                <div
                  onClick={() => {
                    setEpaperAction('archive');
                    setActiveTab('epaper_studio');
                  }}
                  className="p-4 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Archive className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                        Action 5
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-800">
                        Edition Archive Management
                      </h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        संस्करण अभिलेखागार प्रबंधन
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      पुराने ऐतिहासिक ई-पेपर संस्करणों की खोज, जिलावार फ़िल्टरिंग एवं बैकअप स्टोरेज सत्यापन।
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-blue-700 flex items-center gap-1">
                    <span>अभिलेखागार खोलें</span> &rarr;
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
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
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

                    {(selectedReviewArticle.featuredImage || selectedReviewArticle.imageUrl) && (
                      <div className="rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={selectedReviewArticle.featuredImage || selectedReviewArticle.imageUrl}
                          alt="ग्राउंड फोटो"
                          className="w-full h-56 object-cover"
                        />
                        {(selectedReviewArticle.imageCaption || selectedReviewArticle.imageCredit) && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 border-t border-slate-200 flex items-center justify-between">
                            <span>{selectedReviewArticle.imageCaption}</span>
                            {selectedReviewArticle.imageCredit && (
                              <span className="text-slate-400">फोटो साभार: {selectedReviewArticle.imageCredit}</span>
                            )}
                          </div>
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
                                setAdminNotice({ type: 'error', text: 'कृपया संशोधन निर्देश लिखें।' });
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
                  मध्य प्रदेश के 55 जिलों के संवाददाताओं की मान्यता, डिजिटल प्रेस कार्ड, दैनिक व्हाट्सएप कोटा व अधिकार क्षेत्र
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchReporterQuotas}
                  disabled={loadingQuotas}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  title="दैनिक व्हाट्सएप कोटा स्थिति पुनः लोड करें"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingQuotas ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                  <span>कोटा रीफ्रेश करें</span>
                </button>
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
            </div>

            {quotaFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center justify-between ${
                  quotaFeedback.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {quotaFeedback.isError ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{quotaFeedback.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuotaFeedback(null)}
                  className="text-xs underline ml-4 hover:opacity-75"
                >
                  बंद करें
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">संवाददाता</th>
                    <th className="py-2.5 px-3">प्रेस बैज ID</th>
                    <th className="py-2.5 px-3">आवंटित संभाग / जिले</th>
                    <th className="py-2.5 px-3">कवरेज आँकड़े</th>
                    <th className="py-2.5 px-3">दैनिक व्हाट्सएप कोटा</th>
                    <th className="py-2.5 px-3">भूमिका स्थिति</th>
                    <th className="py-2.5 px-3 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReporters.map((rep) => {
                    const quotaInfo = reporterQuotas[rep.id] || { used: 0, maxDaily: 20, remaining: 20 };
                    const isEditingThisQuota = editingQuotaReporterId === rep.id;

                    return (
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
                          {isEditingThisQuota ? (
                            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-emerald-300">
                              <input
                                type="number"
                                min="0"
                                max="500"
                                value={editingQuotaValue}
                                onChange={(e) => setEditingQuotaValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-xs font-mono font-bold bg-white text-center focus:outline-hidden focus:border-emerald-600"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveReporterQuota(rep.id)}
                                disabled={isUpdatingQuota}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {isUpdatingQuota ? '...' : 'सेव'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingQuotaReporterId(null)}
                                disabled={isUpdatingQuota}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300"
                              >
                                रद्द
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">
                                  {quotaInfo.maxDaily} जनरेशन / दिन
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  प्रयुक्त: <strong className="text-slate-700">{quotaInfo.used}</strong> | शेष:{' '}
                                  <strong className={quotaInfo.remaining === 0 ? 'text-rose-600' : 'text-emerald-700'}>
                                    {quotaInfo.remaining}
                                  </strong>
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuotaReporterId(rep.id);
                                  setEditingQuotaValue(quotaInfo.maxDaily);
                                  setQuotaFeedback(null);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition-colors"
                                title="दैनिक कोटा संशोधित करें"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rep.role === 'trusted_reporter'
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
                    );
                  })}
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
                      className={`flex-1 py-1.5 rounded font-bold transition-colors ${newTickerPriority === 'critical'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      🚨 अति महत्वपूर्ण (Critical)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTickerPriority('normal')}
                      className={`flex-1 py-1.5 rounded font-bold transition-colors ${newTickerPriority === 'normal'
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
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${t.priority === 'critical'
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
                        className={`px-2 py-1 rounded text-[11px] font-bold ${t.isActive
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
          <div className="space-y-6">
            {/* Create Ad Slot Form */}
            <form
              onSubmit={handleCreateAdSubmit}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                नया हाइपरलोकल विज्ञापन स्लॉट जोड़ें (AscAdBanner Slot)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder="विज्ञापन शीर्षक *"
                  className="p-2 border border-slate-300 rounded-lg md:col-span-2"
                  required
                />
                <input
                  type="text"
                  value={newAdAdvertiser}
                  onChange={(e) => setNewAdAdvertiser(e.target.value)}
                  placeholder="विज्ञापनदाता नाम *"
                  className="p-2 border border-slate-300 rounded-lg"
                  required
                />
                <select
                  value={newAdPlacement}
                  onChange={(e) => setNewAdPlacement(e.target.value as any)}
                  className="p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="top_leaderboard">Top Leaderboard (शीर्ष)</option>
                  <option value="sidebar">Sidebar Box (साइडबार)</option>
                  <option value="in_feed">In-Feed (फीड के बीच)</option>
                  <option value="sticky_bottom">Sticky Bottom (निचला पट्टी)</option>
                </select>
                <button
                  type="submit"
                  className="py-2 px-3 bg-[#ED1727] hover:bg-red-700 text-white font-bold rounded-lg shadow-xs"
                >
                  + स्लॉट जोड़ें
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newAdImageUrl}
                  onChange={(e) => setNewAdImageUrl(e.target.value)}
                  placeholder="बैनर इमेज URL (https://...)"
                  className="p-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={newAdTargetUrl}
                  onChange={(e) => setNewAdTargetUrl(e.target.value)}
                  placeholder="टार्गेट लिंक URL (https://...)"
                  className="p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </form>

            {/* Ad Slots Grid with Live Telemetry */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  हाइपरलोकल विज्ञापन अभियान एवं लाइव प्रदर्शन ({ads.length})
                </h3>
                <p className="text-xs text-slate-500">
                  रीयल-टाइम इंप्रेशन व क्लिक टेलीमेट्री सहित मध्य प्रदेश के प्रायोजित प्रचार स्लॉट्स
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

                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded">
                        👁 इंप्रेशन: {ad.impressionsCount ?? 0}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                        👆 क्लिक्स: {ad.clicksCount ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => onToggleAdActive(ad.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold ${ad.isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                          }`}
                      >
                        {ad.isActive ? 'सक्रिय (Live)' : 'बंद (Paused)'}
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href={ad.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]"
                        >
                          <span>लिंक</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {onDeleteAd && (
                          <button
                            type="button"
                            onClick={() => onDeleteAd(ad.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="विज्ञापन हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5B: MANDI RATES CRUD */}
        {activeTab === 'mandi' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-emerald-600" />
                नया कृषि उपज मंडी भाव दर्ज करें
              </h3>
              <form onSubmit={handleCreateMandiSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">फसल / जिंस *</label>
                  <input
                    type="text"
                    value={newMandiCommodity}
                    onChange={(e) => setNewMandiCommodity(e.target.value)}
                    placeholder="उदा. सोयाबीन (पीला) / शरबती गेहूं"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">मंडी का नाम *</label>
                  <input
                    type="text"
                    value={newMandiName}
                    onChange={(e) => setNewMandiName(e.target.value)}
                    placeholder="उदा. सीहोर कृषि उपज मंडी"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ज़िला *</label>
                  <select
                    value={newMandiDistrict}
                    onChange={(e) => setNewMandiDistrict(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.nameHi}>
                        {d.nameHi}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">न्यूनतम ₹</label>
                    <input
                      type="number"
                      value={newMandiMinPrice}
                      onChange={(e) => setNewMandiMinPrice(e.target.value)}
                      placeholder="4200"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">मॉडल ₹ *</label>
                    <input
                      type="number"
                      value={newMandiModalPrice}
                      onChange={(e) => setNewMandiModalPrice(e.target.value)}
                      placeholder="4750"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">अधिकतम ₹</label>
                    <input
                      type="number"
                      value={newMandiMaxPrice}
                      onChange={(e) => setNewMandiMaxPrice(e.target.value)}
                      placeholder="5100"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  मंडी भाव लाइव प्रकाशित करें
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  मध्य प्रदेश मंडी भाव सूची ({mandiRates.length} मंडियां)
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold">होमपेज से रीयल-टाइम सिंक</span>
              </div>

              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">जिंस व मंडी</th>
                      <th className="py-2 px-2.5">ज़िला</th>
                      <th className="py-2 px-2.5">मॉडल भाव (₹/क्विंटल)</th>
                      <th className="py-2 px-2.5">रेंज</th>
                      <th className="py-2 px-2.5 text-right">कार्रवाई</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mandiRates.map((m) => {
                      const isRowEditing = editingMandiId === m.id;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2.5">
                            <span className="font-bold text-slate-900 block">{m.commodityName}</span>
                            <span className="text-[11px] text-slate-500">{m.mandiName}</span>
                          </td>
                          <td className="py-2.5 px-2.5 font-semibold text-blue-700">{m.districtName}</td>
                          <td className="py-2.5 px-2.5">
                            {isRowEditing ? (
                              <input
                                type="number"
                                value={editMandiModal}
                                onChange={(e) => setEditMandiModal(e.target.value)}
                                className="w-20 p-1 border border-emerald-400 rounded text-xs font-bold"
                              />
                            ) : (
                              <span className="font-extrabold text-emerald-700">
                                ₹ {m.modalPrice.toLocaleString('hi-IN')}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600">
                            {isRowEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={editMandiMin}
                                  onChange={(e) => setEditMandiMin(e.target.value)}
                                  className="w-16 p-1 border border-slate-300 rounded text-xs"
                                />
                                <span>-</span>
                                <input
                                  type="number"
                                  value={editMandiMax}
                                  onChange={(e) => setEditMandiMax(e.target.value)}
                                  className="w-16 p-1 border border-slate-300 rounded text-xs"
                                />
                              </div>
                            ) : (
                              `₹ ${m.minPrice} - ₹ ${m.maxPrice}`
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              {isRowEditing ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onUpdateMandiRate?.(m.id, {
                                      modalPrice: Number(editMandiModal) || m.modalPrice,
                                      minPrice: Number(editMandiMin) || m.minPrice,
                                      maxPrice: Number(editMandiMax) || m.maxPrice,
                                    });
                                    setEditingMandiId(null);
                                    setAdminNotice({ type: 'success', text: `${m.commodityName} का भाव अपडेट हुआ।` });
                                  }}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                                >
                                  सेव
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMandiId(m.id);
                                    setEditMandiModal(String(m.modalPrice));
                                    setEditMandiMin(String(m.minPrice));
                                    setEditMandiMax(String(m.maxPrice));
                                  }}
                                  className="p-1 text-slate-500 hover:text-blue-600 rounded"
                                  title="संपादित करें"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onDeleteMandiRate?.(m.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="हटाएं"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BUSINESS MANAGEMENT & MONETIZATION (MASTER EXECUTION 025) */}
        {activeTab === 'monetization' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5 text-xs">
            {/* Header & Sub-Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>बिजनेस प्रबंधन एवं राजस्व प्रणाली (Monetization & Revenue Desk)</span>
                </h3>
                <p className="text-slate-500 text-xs">
                  राजस्व ऑडिट, प्रीमियम सब्सक्रिप्शन, विज्ञापन अभियान, ASCI प्रायोजित सामग्री एवं जीएसटी इनवॉइसिंग
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadMonetizationData}
                  disabled={loadingMonetization}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-1.5 text-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMonetization ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{loadingMonetization ? 'लोड हो रहा है...' : 'डेटा रिफ्रेश'}</span>
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {monetizationMsg && (
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${monetizationMsg.isError
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
              >
                <span>{monetizationMsg.text}</span>
                <button
                  onClick={() => setMonetizationMsg(null)}
                  className="text-xs font-bold hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Sub-Tabs Selector */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                onClick={() => setMonetizationSubTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${monetizationSubTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>बिजनेस डैशबोर्ड</span>
              </button>
              <button
                onClick={() => setMonetizationSubTab('plans')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${monetizationSubTab === 'plans'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>सब्सक्रिप्शन योजनाएं ({subPlans.length})</span>
              </button>
              <button
                onClick={() => setMonetizationSubTab('campaigns')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${monetizationSubTab === 'campaigns'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>विज्ञापन अभियान ({adCampaigns.length})</span>
              </button>
              <button
                onClick={() => setMonetizationSubTab('sponsored')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${monetizationSubTab === 'sponsored'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>प्रायोजित सामग्री (ASCI) ({sponsoredArticles.length})</span>
              </button>
              <button
                onClick={() => setMonetizationSubTab('crm')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${monetizationSubTab === 'crm'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>विज्ञापनदाता CRM ({advertisers.length})</span>
              </button>
              <button
                onClick={() => setMonetizationSubTab('invoices')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${monetizationSubTab === 'invoices'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>जीएसटी इनवॉइस व टैक्स ({invoices.length})</span>
              </button>
            </div>

            {/* SUB-TAB 1: BUSINESS DASHBOARD */}
            {monetizationSubTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 6 Metric KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-800 block">कुल प्राप्त राजस्व (Realized)</span>
                    <span className="text-lg font-black text-emerald-900 mt-1 block">
                      ₹{dashboardSummary?.revenue?.totalRealizedRupees ?? '0'}
                    </span>
                    <span className="text-[10px] text-emerald-600">वास्तविक प्राप्त (Non-Refunded)</span>
                  </div>

                  <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-sky-800 block">मासिक प्राप्त (Month)</span>
                    <span className="text-lg font-black text-sky-900 mt-1 block">
                      ₹{dashboardSummary?.revenue?.monthlyRealizedRupees ?? '0'}
                    </span>
                    <span className="text-[10px] text-sky-600">चालू माह का संचित</span>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-indigo-800 block">अनुमानित कुल (Projected)</span>
                    <span className="text-lg font-black text-indigo-900 mt-1 block">
                      ₹{dashboardSummary?.revenue?.projectedRupees ?? '0'}
                    </span>
                    <span className="text-[10px] text-indigo-600">प्राप्त + सक्रिय बजट + बकाया</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-amber-800 block">बकाया राशि (Receivables)</span>
                    <span className="text-lg font-black text-amber-900 mt-1 block">
                      ₹{dashboardSummary?.revenue?.outstandingReceivablesRupees ?? '0'}
                    </span>
                    <span className="text-[10px] text-amber-600">जारी इनवॉइस जिनका भुगतान शेष</span>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-rose-800 block">रिफंड राशि (Refunded)</span>
                    <span className="text-lg font-black text-rose-900 mt-1 block">
                      ₹{dashboardSummary?.revenue?.refundsTotalRupees ?? '0'}
                    </span>
                    <span className="text-[10px] text-rose-600">रिफंड संसाधित</span>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-purple-800 block">सक्रिय सब्सक्रिप्शन</span>
                    <span className="text-lg font-black text-purple-900 mt-1 block">
                      {dashboardSummary?.counts?.activeSubscriptions ?? 0}
                    </span>
                    <span className="text-[10px] text-purple-600">सक्रिय पेड पाठक</span>
                  </div>
                </div>

                {/* 2-Column Breakdown Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Revenue by Stream */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>राजस्व स्रोत विभाजन (Revenue by Stream)</span>
                    </h4>

                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>डिस्प्ले विज्ञापन (Display Ads)</span>
                          <span className="font-bold">₹{dashboardSummary?.revenue?.bySource?.advertisingRupees ?? '0'}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>प्रायोजित सामग्री (Sponsored Content)</span>
                          <span className="font-bold">₹{dashboardSummary?.revenue?.bySource?.sponsoredRupees ?? '0'}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-sky-500 h-2 rounded-full" style={{ width: '30%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>पाठक सब्सक्रिप्शन (Subscriptions)</span>
                          <span className="font-bold">₹{dashboardSummary?.revenue?.bySource?.subscriptionsRupees ?? '0'}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>पार्टनरशिप पैकेज (Partner Packages)</span>
                          <span className="font-bold">₹{dashboardSummary?.revenue?.bySource?.partnersRupees ?? '0'}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: '10%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6-Month Realized Trend */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span>विगत 6 माह राजस्व रुझान (Monthly Trends)</span>
                    </h4>

                    <div className="space-y-2">
                      {(dashboardSummary?.monthlyTrends || []).map((t, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-800">{t.month}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-emerald-700 font-bold">
                              राजस्व: ₹{t.revenueRupees.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compliance & Security Banner */}
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      <strong>वैधानिक अनुपालन:</strong> यह प्रणाली भारतीय विज्ञापन मानक परिषद (ASCI) एवं मध्य प्रदेश जीएसटी (SAC 998363 - 18% GST) मानकों के पूर्णतः अनुरूप है।
                    </span>
                  </div>
                  <span className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                    ऑडिट ट्रेल सक्रिय
                  </span>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: SUBSCRIPTION PLANS */}
            {monetizationSubTab === 'plans' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">
                    पाठक सदस्यता एवं प्रीमियम योजनाएं (Reader Subscription Plans)
                  </h4>
                  <span className="text-xs text-slate-500">
                    कुल सक्रिय योजनाएं: {subPlans.filter(p => p.isActive).length} / {subPlans.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {subPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border rounded-xl p-4 space-y-3 relative flex flex-col justify-between ${plan.isActive ? 'border-emerald-300 bg-white shadow-2xs' : 'border-slate-200 bg-slate-50 opacity-75'
                        }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-bold text-slate-900 text-sm">{plan.nameHi}</h5>
                            <span className="text-[11px] text-slate-500">{plan.nameEn}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                              }`}
                          >
                            {plan.isActive ? 'सक्रिय' : 'निष्क्रिय'}
                          </span>
                        </div>

                        <div className="text-2xl font-black text-slate-900 my-2">
                          ₹{plan.priceRupees}
                          <span className="text-xs font-normal text-slate-500 ml-1">/{plan.billingCycle}</span>
                        </div>

                        <div className="space-y-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-700">
                          <div className="flex items-center gap-1.5">
                            {plan.entitlements?.includes('ad_free') ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                            <span>विज्ञापन मुक्त (Ad-Free)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {plan.entitlements?.includes('pdf_download') ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                            <span>ई-पेपर पीडीएफ डाउनलोड</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {plan.entitlements?.includes('epaper_archive') ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                            <span>ई-पेपर पुराना आर्काइव</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {plan.entitlements?.includes('patron_badge') ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                            <span>संरक्षक बैज (Patron Badge)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 pt-1">
                            डाउनलोड सीमा: {plan.usageLimits?.maxDownloadsPerMonth ? `${plan.usageLimits.maxDownloadsPerMonth} डाउनलोड/माह` : 'असीमित'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTogglePlan(plan.id, plan.isActive)}
                        className={`w-full mt-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${plan.isActive
                          ? 'border-red-300 text-red-700 hover:bg-red-50'
                          : 'border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                      >
                        {plan.isActive ? 'निष्क्रिय करें' : 'सक्रिय करें'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 3: AD CAMPAIGNS */}
            {monetizationSubTab === 'campaigns' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      डिजिटल विज्ञापन अभियान (Digital Ad Campaigns)
                    </h4>
                    <p className="text-xs text-slate-500">
                      मप्र के 55 जिलों में स्लॉट-आधारित एवं जियो-टारगेटेड विज्ञापन प्रबंधन
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    कुल अभियान: {adCampaigns.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold">
                        <th className="p-2.5 rounded-l-lg">अभियान / शीर्षक</th>
                        <th className="p-2.5">विज्ञापनदाता</th>
                        <th className="p-2.5">स्लॉट कोड</th>
                        <th className="p-2.5">बजट / खर्च</th>
                        <th className="p-2.5">व्यू / क्लिक (CTR)</th>
                        <th className="p-2.5">स्थिति</th>
                        <th className="p-2.5 rounded-r-lg text-right">कार्रवाई</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {adCampaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">{camp.campaignName}</span>
                            <span className="text-[10px] text-slate-500">
                              टारगेट: {camp.targetDistricts?.join(', ') || 'पूरा मध्य प्रदेश'}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium text-slate-700">{camp.advertiserName}</td>
                          <td className="p-2.5">
                            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-mono">
                              {camp.slotCode}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-800">
                              ₹{(camp.budgetSpentPaise ? camp.budgetSpentPaise / 100 : 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-slate-400"> / ₹{(camp.budgetTotalPaise ? camp.budgetTotalPaise / 100 : 0).toLocaleString('en-IN')}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="text-slate-800 block">
                              {camp.metrics?.impressions ?? 0} व्यूज • {camp.metrics?.clicks ?? 0} क्लिक्स
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              CTR: {camp.metrics?.ctr ?? 0}%
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${camp.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : camp.status === 'review'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : camp.status === 'approved'
                                    ? 'bg-sky-100 text-sky-800'
                                    : camp.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {camp.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-1">
                            {['review', 'draft'].includes(camp.status) && (
                              <>
                                <button
                                  onClick={() => handleApproveCampaign(camp.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                                >
                                  अनुमोदन
                                </button>
                                <button
                                  onClick={() => handleRejectCampaign(camp.id)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                                >
                                  अस्वीकार
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: SPONSORED CONTENT (MANDATORY EDITORIAL FIREWALL) */}
            {monetizationSubTab === 'sponsored' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      अनिवार्य संपादकीय फ़ायरवॉल (Mandatory Editorial Firewall - Rule BR-MON-004):
                    </span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      ASCI दिशानिर्देशों के तहत, प्रायोजित लेख स्वतः प्रकाशित नहीं हो सकते। संपादकीय समीक्षा एवं स्पष्ट
                      &apos;प्रायोजित सामग्री / Sponsored Content&apos; प्रकटीकरण अनिवार्य है।
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {sponsoredArticles.map((art) => (
                    <div
                      key={art.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                            {art.brandDisclosure || 'प्रायोजित सामग्री'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${art.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : art.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-800'
                              }`}
                          >
                            {art.status}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-sm">{art.title}</h5>
                        <p className="text-[11px] text-slate-500">
                          विज्ञापनदाता: <strong className="text-slate-700">{art.advertiserName}</strong>
                          {art.articleId && (
                            <span className="ml-2 text-emerald-700 font-bold">
                              • न्यूज़ रूम लेख आईडी: {art.articleId}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {art.status === 'PENDING_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleReviewSponsored(art.id, true)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                            >
                              संपादकीय अनुमोदन व ड्राफ्ट बनाएं
                            </button>
                            <button
                              onClick={() => handleReviewSponsored(art.id, false)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                            >
                              अस्वीकार
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 5: ADVERTISER CRM */}
            {monetizationSubTab === 'crm' && (
              <div className="space-y-6">
                {/* Advertisers Directory */}
                <div className="space-y-3">
                  <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">
                      पंजीकृत विज्ञापनदाता प्रोफ़ाइल (Advertiser Directory)
                    </h4>
                    <span className="text-xs text-slate-500">
                      कुल विज्ञापनदाता: {advertisers.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {advertisers.map((adv) => (
                      <div
                        key={adv.id}
                        className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-slate-900 text-xs">{adv.organizationName}</h5>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${adv.verificationStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                                }`}
                            >
                              {adv.verificationStatus.toUpperCase()}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 space-y-0.5 mt-2">
                            <div>सम्पर्क: {adv.contactPerson}</div>
                            <div>फ़ोन: {adv.phone}</div>
                            <div>ईमेल: {adv.email}</div>
                            <div>राज्य कोड: {adv.stateCode || '23 (मध्य प्रदेश)'}</div>
                            <div className="font-mono text-[10px] text-slate-500 pt-1">
                              GSTIN: {adv.gstin || 'लागू नहीं'}
                            </div>
                          </div>
                        </div>

                        {adv.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => handleVerifyAdvertiser(adv.id)}
                            className="w-full mt-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                          >
                            सत्यापित करें (Verify)
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proposals Section */}
                <div className="space-y-3 pt-2">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      व्यावसायिक साझेदारी प्रस्ताव (Commercial Proposals)
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold">
                          <th className="p-2.5 rounded-l-lg">प्रस्ताव संख्या</th>
                          <th className="p-2.5">शीर्षक</th>
                          <th className="p-2.5">मूल्य (INR)</th>
                          <th className="p-2.5">वैधता</th>
                          <th className="p-2.5 rounded-r-lg">स्थिति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {proposals.map((prop) => (
                          <tr key={prop.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-bold text-slate-800">{prop.proposalNumber}</td>
                            <td className="p-2.5 text-slate-700 font-semibold">{prop.title}</td>
                            <td className="p-2.5 font-bold text-emerald-800">
                              ₹{prop.amountRupees}
                            </td>
                            <td className="p-2.5 text-slate-500">{prop.validUntil}</td>
                            <td className="p-2.5">
                              <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                {prop.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 6: INVOICES & TAX */}
            {monetizationSubTab === 'invoices' && (
              <div className="space-y-5">
                {/* Tax Configuration Card */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <span>जीएसटी कर विन्यास एवं पैरामीटर्स (GST Configuration)</span>
                    </h4>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      सक्रिय विन्यास
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">पंजीकृत राज्य (Home State)</span>
                      <strong className="text-slate-800">
                        {taxConfig?.homeStateName || 'मध्य प्रदेश'} (कोड: {taxConfig?.homeStateCode || '23'})
                      </strong>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">डिजिटल विज्ञापन SAC कोड</span>
                      <strong className="text-slate-800">{taxConfig?.sacCode || '998363'}</strong>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">राज्यीय कर (Intra-State GST)</span>
                      <strong className="text-emerald-700">
                        {taxConfig ? taxConfig.cgstRatePercent + taxConfig.sgstRatePercent : 18}% (CGST {taxConfig?.cgstRatePercent || 9}% + SGST {taxConfig?.sgstRatePercent || 9}%)
                      </strong>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">अंतर-राज्यीय कर (Inter-State IGST)</span>
                      <strong className="text-indigo-700">{taxConfig?.igstRatePercent || 18}% (IGST 18%)</strong>
                    </div>
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="space-y-3">
                  <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">
                      जीएसटी इनवॉइस रजिस्टर (GST Invoices Register)
                    </h4>
                    <span className="text-xs text-slate-500">कुल इनवॉइस: {invoices.length}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold">
                          <th className="p-2.5 rounded-l-lg">इनवॉइस संख्या</th>
                          <th className="p-2.5">ग्राहक / विज्ञापनदाता</th>
                          <th className="p-2.5">राज्य कोड</th>
                          <th className="p-2.5">कर योग्य मूल्य</th>
                          <th className="p-2.5">जीएसटी कर</th>
                          <th className="p-2.5">कुल राशि</th>
                          <th className="p-2.5">स्थिति</th>
                          <th className="p-2.5 rounded-r-lg text-right">कार्रवाई</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{inv.customerName}</td>
                            <td className="p-2.5 text-slate-600">{inv.customerStateCode}</td>
                            <td className="p-2.5 text-slate-700">₹{(inv.taxableAmountPaise / 100).toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-slate-600">₹{(inv.totalTaxPaise / 100).toLocaleString('en-IN')}</td>
                            <td className="p-2.5 font-black text-emerald-800">
                              ₹{inv.totalAmountRupees}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.status === 'ISSUED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-700'
                                  }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              {inv.status === 'ISSUED' && (
                                <button
                                  onClick={() => handleMarkInvoicePaid(inv.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                                >
                                  भुगतान दर्ज करें
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: API POOL & THIRD-PARTY INTEGRATIONS (MASTER EXECUTION 024) */}
        {activeTab === 'api_pool' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5 text-xs">
            {/* 1. Header with Live Telemetry & Sub-Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-red-600" />
                  <span>सेंट्रल API Pool व थर्ड-पार्टी इंटीग्रेशन कंसोल</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI मॉडल प्रोवाइडर्स, RSS वायर फ़ीड्स, सोशल मीडिया चैनल्स, व्हाट्सएप बिजनेस एवं वेबहुक सुरक्षा नियंत्रण
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadIntegrationData}
                  disabled={loadingIntegrations}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingIntegrations ? 'animate-spin text-red-600' : ''}`} />
                  <span>रिफ्रेश टेलीमेट्री</span>
                </button>
              </div>
            </div>

            {/* Notification / Toast Message */}
            {integrationMsg && (
              <div
                className={`p-3 rounded-lg flex items-center justify-between ${integrationMsg.isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
              >
                <span>{integrationMsg.text}</span>
                <button onClick={() => setIntegrationMsg(null)} className="text-xs font-bold underline ml-2">
                  बंद करें
                </button>
              </div>
            )}

            {/* 2. Sub-Tabs Bar */}
            <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar font-bold">
              <button
                type="button"
                onClick={() => setIntegrationSubTab('providers')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${integrationSubTab === 'providers' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>API प्रोवाइडर्स व कोटा ({liveProviders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationSubTab('rss')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${integrationSubTab === 'rss' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Rss className="w-3.5 h-3.5" />
                <span>RSS व वायर फ़ीड्स ({rssSources.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationSubTab('social')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${integrationSubTab === 'social' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>सोशल मीडिया चैनल्स ({socialAccounts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationSubTab('whatsapp')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${integrationSubTab === 'whatsapp' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>व्हाट्सएप बिजनेस ({waSubscribers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationSubTab('webhooks')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${integrationSubTab === 'webhooks' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>वेबहुक्स व सुरक्षा ({webhookLogs.length})</span>
              </button>
            </div>

            {/* -------------------------------------------------------- */}
            {/* SUBTAB 1: API PROVIDERS & QUOTAS                         */}
            {/* -------------------------------------------------------- */}
            {integrationSubTab === 'providers' && (
              <div className="space-y-4">
                {/* KPI Metrics Strip */}
                {liveUsage && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">कुल सक्रिय प्रोवाइडर्स</span>
                      <strong className="text-base text-slate-900 font-mono">
                        {liveUsage.activeProviders} / {liveUsage.totalProviders}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">दैनिक कुल टोकन उपभोग</span>
                      <strong className="text-base text-slate-900 font-mono">
                        {liveUsage.totalDailyTokens.toLocaleString()}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">मासिक कुल टोकन उपभोग</span>
                      <strong className="text-base text-slate-900 font-mono">
                        {liveUsage.totalMonthlyTokens.toLocaleString()}
                      </strong>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-emerald-700 block text-[11px]">अनुमानित दैनिक लागत</span>
                      <strong className="text-base text-emerald-900 font-mono">
                        ₹{liveUsage.totalEstimatedCostInr.toFixed(2)} (${liveUsage.totalEstimatedCostUsd.toFixed(4)})
                      </strong>
                      <span className="text-[10px] text-emerald-600 block">दर: ₹87.5 / USD (अनुमानित)</span>
                    </div>
                  </div>
                )}

                {/* Provider Cards Header with Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">पंजीकृत AI व API प्रोवाइडर्स ({liveProviders.length})</h4>
                    <p className="text-xs text-slate-500">सभी AI मॉडल्स, सर्च एंडपॉइंट्स व थर्ड-पार्टी सेवाएं</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddProviderModal(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ नया API प्रोवाइडर जोड़ें</span>
                  </button>
                </div>

                {/* Provider Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveProviders.map((prov) => {
                    const usagePercent = Math.min(
                      100,
                      Math.round(((prov.dailyQuotaUsed || 0) / (prov.dailyQuotaLimit || 1)) * 100)
                    );
                    return (
                      <div
                        key={prov.id}
                        className={`p-4 rounded-xl border space-y-3 transition-colors ${prov.isEnabled ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/70 border-slate-300 opacity-75'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{prov.name}</h4>
                            <span className="text-[11px] text-slate-500 font-mono">{prov.baseUrl || prov.providerId}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${prov.healthStatus === 'healthy'
                                ? 'bg-emerald-600 text-white'
                                : prov.healthStatus === 'degraded'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-red-600 text-white'
                                }`}
                            >
                              {prov.healthStatus}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${prov.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {prov.isEnabled ? 'सक्रिय' : 'बंद'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-slate-600">
                          <div className="flex justify-between">
                            <span>सुरक्षित की संदर्भ (Masked):</span>
                            <strong className="font-mono text-slate-800">{prov.maskedCredential || 'N/A'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>दैनिक कोटा उपयोग:</span>
                            <strong>
                              {(prov.dailyQuotaUsed || 0).toLocaleString()} / {(prov.dailyQuotaLimit || 0).toLocaleString()} ({usagePercent}%)
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>औसत लेटेंसी:</span>
                            <strong className="font-mono text-slate-800">{prov.avgLatencyMs || 200} ms</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>दर-सीमा विनिर्देश:</span>
                            <span className="text-slate-500">{prov.rateLimitInfo || 'Standard'}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleProvider(prov.id, prov.isEnabled)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${prov.isEnabled ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                          >
                            {prov.isEnabled ? 'प्रोवाइडर निष्क्रिय करें' : 'सक्रिय करें'}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProviderForEdit(prov);
                                setEditKeyInput('');
                                setShowUpdateKeyModal(true);
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="नई API Key दर्ज करें"
                            >
                              <Key className="w-3 h-3 text-blue-600" />
                              <span>Key अपडेट</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTestProviderHealth(prov.id)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Activity className="w-3 h-3 text-red-600" />
                              <span>हेल्थ टेस्ट</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProvider(prov.id, prov.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="API प्रोवाइडर हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add API Provider Modal */}
                {showAddProviderModal && (
                  <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-red-600" />
                          <h3 className="font-bold text-slate-900 text-base">नया API प्रोवाइडर जोड़ें</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddProviderModal(false)}
                          className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleAddProviderSubmit} className="space-y-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">प्रोवाइडर नाम (Provider Name)</label>
                          <input
                            type="text"
                            required
                            placeholder="उदा. Google Gemini 1.5 Pro Central"
                            value={newProvName}
                            onChange={(e) => setNewProvName(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">मॉडल / प्रकार</label>
                            <select
                              value={newProvType}
                              onChange={(e) => setNewProvType(e.target.value)}
                              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                            >
                              <option value="GEMINI">Google Gemini</option>
                              <option value="CLAUDE">Anthropic Claude</option>
                              <option value="OPENAI">OpenAI GPT</option>
                              <option value="GROQ">Groq LPU</option>
                              <option value="DEEPSEEK">DeepSeek AI</option>
                              <option value="CUSTOM">Custom Endpoint</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">दैनिक टोकन सीमा</label>
                            <input
                              type="number"
                              value={newProvDailyLimit}
                              onChange={(e) => setNewProvDailyLimit(Number(e.target.value))}
                              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">API Key / Secret</label>
                          <input
                            type="password"
                            required
                            placeholder="AIzaSy... अथवा sk-..."
                            value={newProvKey}
                            onChange={(e) => setNewProvKey(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            * की सर्वर-साइड KMS से एन्क्रिप्ट कर सुरक्षित रखी जाती है।
                          </span>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">वैकल्पिक बेस URL (Custom Endpoint)</label>
                          <input
                            type="url"
                            placeholder="https://api.openai.com/v1"
                            value={newProvBaseUrl}
                            onChange={(e) => setNewProvBaseUrl(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                          />
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddProviderModal(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                          >
                            रद्द करें
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                          >
                            प्रोवाइडर सुरक्षित करें
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Update API Key Modal */}
                {showUpdateKeyModal && selectedProviderForEdit && (
                  <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Key className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{selectedProviderForEdit.name}</h3>
                            <p className="text-[11px] text-slate-500">API Key / क्रेडेंशियल अपडेट करें</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUpdateKeyModal(false);
                            setSelectedProviderForEdit(null);
                          }}
                          className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleUpdateProviderKey} className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                          वर्तमान क्रेडेंशियल: <strong className="font-mono">{selectedProviderForEdit.maskedCredential || 'कॉन्फ़िगर नहीं है'}</strong>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            नई वास्तविक API Key (Real API Key) *
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="अपनी वास्तविक API Key यहां पेस्ट करें..."
                            value={editKeyInput}
                            onChange={(e) => setEditKeyInput(e.target.value)}
                            className="w-full p-2.5 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            * यह की सीधे सर्वर पर सुरक्षित सेव होगी और तुरंत एक्टिवेट हो जाएगी।
                          </span>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowUpdateKeyModal(false);
                              setSelectedProviderForEdit(null);
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                          >
                            रद्द करें
                          </button>
                          <button
                            type="submit"
                            disabled={savingKey || !editKeyInput.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {savingKey ? 'सहेज रहे हैं...' : 'Key सहेजें व सक्रिय करें'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* SUBTAB 2: RSS & NEWS SOURCES                             */}
            {/* -------------------------------------------------------- */}
            {integrationSubTab === 'rss' && (
              <div className="space-y-6">
                {/* 1. Register Source Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4 text-red-600" />
                      <span>नया अधिकृत RSS / वायर स्रोत पंजीकृत करें</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">
                      🛡️ Anti-SSRF & Safe-XXE Active
                    </span>
                  </div>

                  <form onSubmit={handleCreateRssSource} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">स्रोत का नाम *</label>
                      <input
                        type="text"
                        value={newRssName}
                        onChange={(e) => setNewRssName(e.target.value)}
                        placeholder="उदा. पीटीआई भाषा, एमपी जनसंपर्क"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">फ़ीड URL *</label>
                      <input
                        type="url"
                        value={newRssUrl}
                        onChange={(e) => setNewRssUrl(e.target.value)}
                        placeholder="https://.../feed.xml"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">प्रकाशक का नाम *</label>
                      <input
                        type="text"
                        value={newRssPublisher}
                        onChange={(e) => setNewRssPublisher(e.target.value)}
                        placeholder="उदा. Press Trust of India"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                      >
                        स्रोत पंजीकृत करें
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Registered Sources List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">सक्रिय RSS व सरकारी सूचना स्रोत ({rssSources.length})</h4>

                  <div className="space-y-2.5">
                    {rssSources.map((src) => (
                      <div
                        key={src.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${src.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                                }`}
                            >
                              {src.status}
                            </span>
                            <span className="font-bold text-slate-900">{src.name}</span>
                            <span className="text-slate-500 font-mono text-[11px]">[{src.publisherName}]</span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-600 truncate max-w-xl">{src.feedUrl}</p>
                          <div className="text-[11px] text-slate-500">
                            श्रेणी: {src.sourceCategory} • आवृत्ति: प्रत्येक {src.pollingIntervalMinutes} मिनट • डुप्लिकेट रोके गए: {src.duplicateCount || 0}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSyncRssSource(src.id)}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold flex items-center gap-1 shadow-xs"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>तुरंत सिंक करें</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Ingested Wire News Stream (Draft Conversion) */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    सिंक की गई वायर सामग्री (Human-in-the-Loop Review Queue) ({rssItems.length})
                  </h4>

                  <div className="space-y-2">
                    {rssItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-black">
                              {item.sourceAttribution || item.sourceName}
                            </span>
                            <span className="text-slate-400 text-[11px]">{new Date(item.importedAt).toLocaleTimeString('hi-IN')}</span>
                          </div>
                          <h5 className="font-bold text-slate-900">{item.originalTitle}</h5>
                          <p className="text-slate-600 line-clamp-1">{item.originalSummary}</p>
                        </div>

                        <div className="shrink-0">
                          {item.status === 'DRAFT_CONVERTED' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-[11px]">
                              ✓ ड्राफ्ट में परिवर्तित
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConvertWireItem(item.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-400" />
                              <span>ड्राफ्ट में बदलें</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* SUBTAB 3: SOCIAL MEDIA PUBLISHING                        */}
            {/* -------------------------------------------------------- */}
            {integrationSubTab === 'social' && (
              <div className="space-y-6">
                {/* 1. Platform Constraints Reference */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">प्लेटफ़ॉर्म प्रकाशन सीमाएं व नियम (Publishing Limits)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <strong className="block text-slate-900">X (Twitter)</strong>
                      <span className="text-red-600 font-bold">अधिकतम 280 अक्षर</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <strong className="block text-slate-900">Facebook Page</strong>
                      <span className="text-slate-600 font-bold">अधिकतम 63,206 अक्षर</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <strong className="block text-slate-900">Instagram</strong>
                      <span className="text-slate-600 font-bold">अधिकतम 2,200 अक्षर</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <strong className="block text-slate-900">YouTube</strong>
                      <span className="text-slate-600 font-bold">विवरण 5,000 अक्षर</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <strong className="block text-slate-900">WhatsApp</strong>
                      <span className="text-slate-600 font-bold">अधिकतम 1,024 अक्षर</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <strong className="block text-slate-900">LinkedIn</strong>
                      <span className="text-slate-600 font-bold">अधिकतम 3,000 अक्षर</span>
                    </div>
                  </div>
                </div>

                {/* 2. Connected Social Accounts */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">कनेक्टेड आधिकारिक सोशल मीडिया खाते ({socialAccounts.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {socialAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-white">
                              {acc.platform}
                            </span>
                            <span className="font-bold text-slate-900">{acc.accountName}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                            @{acc.accountIdentifier} • स्थिति: {acc.connectionStatus}
                          </span>
                        </div>

                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold">
                          ✓ कनेक्टेड
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Social Publishing Queue (Human-in-the-Loop Approval Required) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">सोशल पब्लिशिंग कतार ({socialJobs.length})</h4>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black">
                      संपादकीय अनुमोदन अनिवार्य (Human Approval Gate)
                    </span>
                  </div>

                  {socialJobs.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      वर्तमान में कोई लंबित सोशल पोस्ट कतार में नहीं है।
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {socialJobs.map((job) => (
                        <div
                          key={job.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-slate-900">{job.title}</h5>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${job.status === 'PUBLISHED'
                                ? 'bg-emerald-600 text-white'
                                : job.status === 'APPROVED'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-amber-500 text-white'
                                }`}
                            >
                              {job.status}
                            </span>
                          </div>

                          <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">{job.masterContent}</p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400 text-[11px]">वितरण लक्ष्य: {job.deliveries.length} प्लेटफॉर्म</span>

                            <div className="flex items-center gap-2">
                              {job.status === 'PENDING_APPROVAL' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveSocialJob(job.id)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                                >
                                  अनुमोदित करें
                                </button>
                              )}
                              {(job.status === 'APPROVED' || job.status === 'SCHEDULED') && (
                                <button
                                  type="button"
                                  onClick={() => handlePublishSocialJob(job.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>तुरंत प्रसारित करें</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* SUBTAB 4: WHATSAPP BUSINESS PLATFORM                     */}
            {/* -------------------------------------------------------- */}
            {integrationSubTab === 'whatsapp' && (
              <div className="space-y-6">
                {/* 1. Pre-approved HSM Templates */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">मेटा अनुमोदित व्हाट्सएप टेम्पलेट्स ({waTemplates.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {waTemplates.map((tpl) => (
                      <div key={tpl.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900">{tpl.displayName}</h5>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">
                            {tpl.approvalStatus}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 whitespace-pre-line">
                          {tpl.bodyText}
                        </p>
                        <span className="text-[10px] text-slate-500 block">फ़ूटर: {tpl.footerText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Opt-in & STOP Simulator */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">व्हाट्सएप ऑप्ट-इन व STOP अनसब्सक्राइब सिमुलेटर (TRAI/Meta Policy)</h4>
                  <p className="text-[11px] text-slate-500">
                    यदि कोई नागरिक "STOP", "UNSUBSCRIBE" अथवा "रोकें" लिखकर भेजता है, तो सिस्टम स्वतः उसे निष्क्रिय (OPTED_OUT) कर देता है।
                  </p>

                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      value={simWaPhone}
                      onChange={(e) => setSimWaPhone(e.target.value)}
                      placeholder="+91..."
                      className="p-2 border border-slate-300 rounded-lg bg-white font-mono text-xs flex-1"
                    />
                    <select
                      value={simWaKeyword}
                      onChange={(e) => setSimWaKeyword(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold"
                    >
                      <option value="STOP">STOP (अनसब्सक्राइब करें)</option>
                      <option value="रोकें">रोकें (अनसब्सक्राइब करें)</option>
                      <option value="START">START (ऑप्ट-इन सक्रिय करें)</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleSimulateWhatsAppKeyword}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
                    >
                      सिमुलेट संदेश भेजें
                    </button>
                  </div>
                </div>

                {/* 3. Subscribers Directory */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">पंजीकृत पाठक व ऑप्ट-इन स्थिति ({waSubscribers.length})</h4>
                  <div className="space-y-2">
                    {waSubscribers.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 font-mono">{sub.phoneNumber}</span>
                          <span className="text-slate-500 ml-2">[{sub.district || 'मध्य प्रदेश'}]</span>
                          <span className="text-slate-400 text-[11px] block mt-0.5">स्रोतः {sub.consentSource}</span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-black ${sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {sub.status === 'ACTIVE' ? '✓ सक्रिय (ACTIVE)' : '✕ अनसब्सक्राइब्ड (OPTED_OUT)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* SUBTAB 5: WEBHOOKS & INGRESS SECURITY                    */}
            {/* -------------------------------------------------------- */}
            {integrationSubTab === 'webhooks' && (
              <div className="space-y-6">
                {/* 1. Webhook Ingress Architecture Reference */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>क्रिप्टोग्राफिक वेबहुक आर्किटेक्चर (DOC-20-INT-2026-V1.0)</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    <li><strong>पब्लिक एंडपॉइंट:</strong> <code className="font-mono bg-white px-1 py-0.5 rounded">POST /api/v1/webhooks/ingress/:provider</code></li>
                    <li><strong>हस्ताक्षर सत्यापन:</strong> HMAC-SHA256 (<code className="font-mono bg-white px-1 py-0.5 rounded">X-BNW-Signature</code>) विद <code className="font-mono">crypto.timingSafeEqual</code></li>
                    <li><strong>रीप्ले सुरक्षा:</strong> <code className="font-mono bg-white px-1 py-0.5 rounded">X-BNW-Nonce</code> डुप्लिकेट जांच एवं 300 सेकंड अधिकतम टाइमस्टैम्प ड्रिफ्ट</li>
                  </ul>
                </div>

                {/* 2. Webhook Signature Verification Tester */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">वेबहुक हस्ताक्षर सत्यापन परीक्षक (Interactive Verifier)</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">पेलोड स्ट्रिंग (Raw Body) *</label>
                      <textarea
                        value={testWebhookPayload}
                        onChange={(e) => setTestWebhookPayload(e.target.value)}
                        rows={2}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">शेयर्ड सीक्रेट *</label>
                        <input
                          type="text"
                          value={testWebhookSecret}
                          onChange={(e) => setTestWebhookSecret(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">HMAC-SHA256 सिग्नेचर *</label>
                        <input
                          type="text"
                          value={testWebhookSig}
                          onChange={(e) => setTestWebhookSig(e.target.value)}
                          placeholder="sha256=... अथवा hex hash"
                          className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestWebhookVerify}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg"
                    >
                      हस्ताक्षर सत्यापन जांचें
                    </button>

                    {testWebhookResult && (
                      <div
                        className={`p-3 rounded-lg border font-mono text-[11px] ${testWebhookResult.isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                          }`}
                      >
                        <strong>सत्यापन परिणाम:</strong> {testWebhookResult.isValid ? '✓ हस्ताक्षर वैध है (VERIFIED)' : `✕ अस्वीकृत: ${testWebhookResult.error}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Ingress Audit Logs */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">वेबहुक इनग्रेस ऑडिट लॉग्स ({webhookLogs.length})</h4>

                  <div className="space-y-2">
                    {webhookLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.status === 'verified' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                                }`}
                            >
                              {log.status}
                            </span>
                            <span className="font-bold text-slate-900">{log.providerId}</span>
                            <span className="text-slate-500 font-mono text-[11px]">[{log.eventType}]</span>
                          </div>
                          {log.errorDetails && <p className="text-red-600 text-[11px] mt-0.5">{log.errorDetails}</p>}
                        </div>

                        <span className="text-slate-400 font-mono text-[11px]">{new Date(log.receivedAt).toLocaleTimeString('hi-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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

        {/* TAB 8: AUDIENCE INTELLIGENCE & ENGAGEMENT CONSOLE (MASTER EXECUTION 026) */}
        {activeTab === 'audience' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5 text-xs">
            {/* Header & Sub-Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>दर्शक सहभागिता एवं विश्लेषण कंसोल (Audience Intelligence & Engagement Desk)</span>
                </h3>
                <p className="text-slate-500 text-xs">
                  सक्रिय पाठक ट्रैफ़िक, पठन समय (Dwell Time), सामग्री प्रदर्शन, DPDPA 2023 गोपनीयता एवं पाठक प्रतिक्रिया
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-bold">अवधि:</span>
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setAudienceTimeRange(range)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                      audienceTimeRange === range
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {range === '24h' ? '24 घंटे' : range === '7d' ? '7 दिन' : '30 दिन'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification alert message banner */}
            {audienceMsg && (
              <div className={`p-3 rounded-lg text-xs font-bold flex items-center justify-between ${
                audienceMsg.isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                <span>{audienceMsg.text}</span>
                <button onClick={() => setAudienceMsg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            )}

            {/* Sub-Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                onClick={() => setAudienceSubTab('overview')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  audienceSubTab === 'overview'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>दर्शक सारांश</span>
              </button>

              <button
                onClick={() => setAudienceSubTab('content_perf')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  audienceSubTab === 'content_perf'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>सामग्री प्रदर्शन</span>
              </button>

              <button
                onClick={() => setAudienceSubTab('segments')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  audienceSubTab === 'segments'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>दर्शक वर्ग (Segments)</span>
              </button>

              <button
                onClick={() => setAudienceSubTab('notifications')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  audienceSubTab === 'notifications'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>पुश अलर्ट प्रसारण</span>
              </button>

              <button
                onClick={() => setAudienceSubTab('feedback')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  audienceSubTab === 'feedback'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>पाठक फीडबैक ({feedbackList.filter((f) => f.status === 'pending').length} लंबित)</span>
              </button>

              <button
                onClick={() => setAudienceSubTab('privacy')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  audienceSubTab === 'privacy'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DPDPA 2023 अनुपालन</span>
              </button>
            </div>

            {/* Sub-Tab 1: Overview */}
            {audienceSubTab === 'overview' && (
              <div className="space-y-4">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold block">दैनिक सक्रिय (DAU)</span>
                    <span className="text-lg font-black text-slate-900">
                      {audienceOverview?.overview?.dailyActiveUsers?.toLocaleString('hi-IN') || '35,490'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">↑ 42% सहभागिता दर</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold block">साप्ताहिक सक्रिय (WAU)</span>
                    <span className="text-lg font-black text-slate-900">
                      {audienceOverview?.overview?.weeklyActiveUsers?.toLocaleString('hi-IN') || '64,220'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">76% पहुंच</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold block">मासिक पाठक (MAU)</span>
                    <span className="text-lg font-black text-slate-900">
                      {audienceOverview?.overview?.monthlyActiveUsers?.toLocaleString('hi-IN') || '84,500'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">कुल पाठक आधार</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold block">औसत पठन समय</span>
                    <span className="text-lg font-black text-indigo-700">
                      {audienceOverview?.overview?.avgReadingTimeFormatted || '2 मिनट 22 सेकंड'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">योग्य पठन SLA</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold block">30-दिवसीय प्रतिधारण</span>
                    <span className="text-lg font-black text-slate-900">
                      {audienceOverview?.overview?.retention30DayPercent || '74.2'}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">पुनरावर्ती पाठक</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold block">कुल समाचार पठन</span>
                    <span className="text-lg font-black text-slate-900">
                      {audienceOverview?.overview?.totalArticleReads?.toLocaleString('hi-IN') || '3,21,100'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">अवलोकन एवं अध्ययन</span>
                  </div>
                </div>

                {/* District Distribution & Traffic Sources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* District Readers */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                      <span>ज़िलावार पाठक वितरण (Top Hyperlocal Districts)</span>
                      <span className="text-slate-400 font-normal">मध्य प्रदेश</span>
                    </h4>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {(audienceOverview?.districtDistribution || [
                        { district: 'भोपाल', readers: 19800, percentage: 23.4 },
                        { district: 'इंदौर', readers: 17200, percentage: 20.3 },
                        { district: 'जबलपुर', readers: 9800, percentage: 11.6 },
                        { district: 'ग्वालियर', readers: 8700, percentage: 10.3 },
                        { district: 'उज्जैन', readers: 6500, percentage: 7.7 },
                        { district: 'सागर', readers: 4800, percentage: 5.7 },
                        { district: 'रीवा', readers: 4100, percentage: 4.8 },
                      ]).map((item) => (
                        <div key={item.district} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
                          <span className="font-bold text-slate-800">{item.district}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{item.readers.toLocaleString('hi-IN')} पाठक</span>
                            <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Platforms & Traffic Sources */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs">ट्रैफ़िक स्रोत व प्लेटफ़ॉर्म विभाजन</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                          <span>मोबाइल वेब (Mobile Web)</span>
                          <span>78.4%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '78.4%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                          <span>डेस्कटॉप पोर्टल (Desktop Portal)</span>
                          <span>18.2%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '18.2%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                          <span>व्हाट्सएप शेयर ट्रैफ़िक (WhatsApp Direct)</span>
                          <span>34.2%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '34.2%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                          <span>ऑर्गेनिक सर्च व डिस्कवरी (Google News & SEO)</span>
                          <span>18.1%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: '18.1%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Content Performance */}
            {audienceSubTab === 'content_perf' && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-xs">प्रकाशित समाचारों का गहन प्रदर्शन (Article Dwell Time & Scroll Depth)</h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2.5">समाचार शीर्षक</th>
                        <th className="p-2.5">ज़िला</th>
                        <th className="p-2.5">श्रेणी</th>
                        <th className="p-2.5">अवलोकन (Views)</th>
                        <th className="p-2.5">औसत पठन समय</th>
                        <th className="p-2.5">स्क्रॉल गहराई</th>
                        <th className="p-2.5">शेयर/बुकमार्क</th>
                        <th className="p-2.5">सहभागिता दर</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(contentPerf?.topStories || []).map((story) => (
                        <tr key={story.articleId} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900 max-w-xs truncate">{story.title}</td>
                          <td className="p-2.5 text-slate-600">{story.district}</td>
                          <td className="p-2.5 text-slate-600">{story.category}</td>
                          <td className="p-2.5 font-bold text-slate-800">{story.metrics.views.toLocaleString('hi-IN')}</td>
                          <td className="p-2.5 font-mono text-indigo-700 font-bold">{story.metrics.avgDwellSeconds}s</td>
                          <td className="p-2.5 font-mono text-slate-700">{story.metrics.avgScrollDepthPercent}%</td>
                          <td className="p-2.5 text-slate-600">{story.metrics.shares} / {story.metrics.bookmarks}</td>
                          <td className="p-2.5 font-bold text-emerald-600">{story.metrics.engagementRatePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Audience Segments */}
            {audienceSubTab === 'segments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">मानक एवं कस्टम दर्शक वर्ग (Canonical Segments)</h4>
                  <span className="text-xs text-slate-500">DPDPA 2023 गैर-संवेदनशील सामूहिक संकेतक</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(audienceSegments.length > 0 ? audienceSegments : [
                    { id: 'seg-1', code: 'malwa_rural_agri', nameHi: 'मालवा ग्रामीण एवं कृषि पाठक', estimatedReach: 18500, descriptionHi: 'उज्जैन, देवास, धार क्षेत्र के किसान व कृषि-उन्मुख पाठक' },
                    { id: 'seg-2', code: 'bhopal_policy_urban', nameHi: 'भोपाल शासकीय व नीति पाठक', estimatedReach: 14200, descriptionHi: 'राज्य मंत्रालय, विकास नीतियां एवं प्रशासन में रुचि रखने वाले' },
                    { id: 'seg-3', code: 'indore_business_youth', nameHi: 'इंदौर व्यवसाय व युवा उद्यमी', estimatedReach: 16800, descriptionHi: 'स्टार्टअप, वाणिज्य, रोजगार व तकनीकी समाचार पाठक' },
                    { id: 'seg-4', code: 'gwalior_chambal_civic', nameHi: 'ग्वालियर-चंबल नागरिक एवं सुरक्षा', estimatedReach: 11200, descriptionHi: 'स्थानीय अपराध, जनसमस्याएं एवं सामाजिक सुरक्षा पाठक' },
                    { id: 'seg-5', code: 'epaper_digital_loyalists', nameHi: 'ई-पेपर व डिजिटल निष्ठावान पाठक', estimatedReach: 8900, descriptionHi: 'दैनिक ई-पेपर संस्करण के नियमित पाठक एवं सब्सक्राइबर' },
                  ]).map((seg) => (
                    <div key={seg.id || seg.code} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{seg.nameHi}</span>
                        <span className="font-mono text-indigo-700 bg-indigo-50 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          ~{seg.estimatedReach?.toLocaleString('hi-IN')} पाठक
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{seg.descriptionHi}</p>
                      <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                        पहचानकर्ता: {seg.code}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Push Notification Broadcast */}
            {audienceSubTab === 'notifications' && (
              <div className="space-y-4 max-w-xl">
                <h4 className="font-bold text-slate-900 text-xs">लक्षित पुश अधिसूचना प्रसारण (FCM Alert Dispatcher)</h4>
                <p className="text-xs text-slate-500">
                  डुप्लिकेट दमन सुरक्षा (Duplicate Suppression: 10 मिनट में समान अलर्ट केवल एक बार प्रसारित होगा)
                </p>

                <form onSubmit={handleBroadcastAlert} className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">लक्षित ज़िला / संभाग *</label>
                      <select
                        value={audienceBroadcastDistrict}
                        onChange={(e) => setAudienceBroadcastDistrict(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="ALL">समस्त मध्य प्रदेश (ALL 55 Districts)</option>
                        <option value="भोपाल">भोपाल ज़िला</option>
                        <option value="इंदौर">इंदौर ज़िला</option>
                        <option value="जबलपुर">जबलपुर ज़िला</option>
                        <option value="ग्वालियर">ग्वालियर ज़िला</option>
                        <option value="उज्जैन">उज्जैन ज़िला</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">प्राथमिकता स्तर *</label>
                      <select
                        value={audienceBroadcastPriority}
                        onChange={(e: any) => setAudienceBroadcastPriority(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="normal">सामान्य बुलेटिन (Normal)</option>
                        <option value="high">प्रमुख खबर (High)</option>
                        <option value="critical">🚨 आपात ब्रेकिंग अलर्ट (Critical)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">अधिसूचना शीर्षक *</label>
                    <input
                      type="text"
                      value={audienceBroadcastTitle}
                      onChange={(e) => setAudienceBroadcastTitle(e.target.value)}
                      placeholder="उदा. एमपी मौसम: अगले 24 घंटों में भारी वर्षा का अलर्ट..."
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">संदेश विवरण *</label>
                    <textarea
                      value={audienceBroadcastMessage}
                      onChange={(e) => setAudienceBroadcastMessage(e.target.value)}
                      rows={2}
                      placeholder="विस्तृत अलर्ट संदेश लिखें..."
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                  >
                    🚨 अलर्ट प्रसारित करें
                  </button>
                </form>
              </div>
            )}

            {/* Sub-Tab 5: Reader Feedback */}
            {audienceSubTab === 'feedback' && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-xs">पाठक प्रतिक्रिया एवं तथ्य सुधार कतार (Editorial Review Queue)</h4>
                {feedbackList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">कोई लंबित पाठक प्रतिक्रिया नहीं है।</p>
                ) : (
                  <div className="space-y-2.5">
                    {feedbackList.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.authorName}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              {item.categoryNameHi || item.category}
                            </span>
                            <span className="text-[10px] text-slate-500">SLA: {item.slaHours} घंटे</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'resolved' ? 'bg-emerald-600 text-white' : item.status === 'reviewed' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <p className="text-slate-800 text-xs">{item.comments}</p>
                        {item.suggestedCorrection && (
                          <div className="p-2 bg-white border border-slate-200 rounded text-xs">
                            <strong className="text-slate-700">प्रस्तावित सुधार:</strong> {item.suggestedCorrection}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.createdAt).toLocaleString('hi-IN')}
                          </span>
                          <div className="flex items-center gap-2">
                            {item.status !== 'resolved' && (
                              <button
                                onClick={() => handleUpdateFeedbackStatus(item.id, 'resolved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                              >
                                सुधार स्वीकृत व निस्तारित
                              </button>
                            )}
                            {item.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateFeedbackStatus(item.id, 'dismissed')}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-bold"
                              >
                                खारिज करें
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 6: DPDPA 2023 Privacy */}
            {audienceSubTab === 'privacy' && (
              <div className="space-y-4 max-w-2xl">
                <h4 className="font-bold text-slate-900 text-xs">डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDPA 2023) अनुपालन स्थिति</h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 leading-relaxed text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>सत्यापित अनुपालन: सक्रिय (Active Compliance)</span>
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    <li>• <strong>डेटा न्यूनीकरण (Data Minimization):</strong> केवल गैर-संवेदनशील पठन व्यवहार व चयनित प्राथमिकताओं का संग्रहण।</li>
                    <li>• <strong>डेटा पोर्टेबिलिटी अधिकार (Portability):</strong> पाठक अपने संपूर्ण प्रोफाइल, बुकमार्क व पठन इतिहास को एक क्लिक में JSON प्रारूप में SHA-256 सुरक्षा चेकसम सहित डाउनलोड कर सकते हैं।</li>
                    <li>• <strong>विस्मृति व विलोपन अधिकार (Right to Erasure):</strong> 30-दिवसीय अनुग्रह अवधि (Grace Period) के साथ खाता विलोपन की स्वचालित सुविधा।</li>
                    <li>• <strong>तटस्थ वैयक्तिकरण (Neutral Default):</strong> पाठक किसी भी समय वैयक्तिकरण रीसेट कर विशुद्ध समय-आधारित (Chronological) समाचार प्रवाह चुन सकते हैं।</li>
                    <li>• <strong>फ़िल्टर बबल सुरक्षा (Anti-Filter-Bubble Defense):</strong> ब्रेकिंग न्यूज़ एवं जनहित के समाचार कभी भी वैयक्तिकरण में छिपे नहीं रहेंगे।</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: EPAPER STUDIO & NEWS SELECTION DESK */}
        {activeTab === 'epaper_studio' && (
          <div className="space-y-6">
            <EpaperStudioTab
              districts={districts}
              divisions={DIVISIONS}
              articles={articles}
              pendingArticles={pendingArticles}
              currentRole={currentRole}
              initialAction={epaperAction}
            />
          </div>
        )}

        {/* TAB 10: EMBEDDED NEWSROOM DESK */}
        {activeTab === 'newsroom_studio' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-500" />
                <span className="font-bold text-sm">एकीकृत न्यूज़रूम डेस्क (Embedded Newsroom Desk)</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black">ACTIVE WORKSPACE</span>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                ← एडमिन ओवरव्यू पर वापस जाएं
              </button>
            </div>
            <NewsroomDeskScreen
              pendingArticles={pendingArticles}
              allArticles={articles}
              reporters={reporters}
              categories={categories}
              districts={districts}
              currentUser={{ id: 'usr-desk-chief', name: 'मुख्य संपादक (Master Admin)', role: currentRole }}
              onApproveAndPublish={onApproveArticle}
              onRequestRevision={onRequestRevision}
              onRejectArticle={onRejectArticle}
              onBroadcastBreakingAlert={onBroadcastAlert}
              onClaimArticle={onClaimArticle}
              onReassignArticle={onReassignArticle}
              onUpdatePriority={onUpdatePriority}
              onToggleBreaking={onToggleBreaking}
              onSchedulePublication={onSchedulePublication}
              onPublishArticle={onPublishArticle}
              onAddPendingArticle={onAddPendingArticle}
            />
          </div>
        )}

        {/* TAB 11: EMBEDDED REPORTER DESK */}
        {activeTab === 'reporter_studio' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-sm">एकीकृत रिपोर्टर डेस्क (Embedded Reporter Intake Desk)</span>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-black">ACTIVE WORKSPACE</span>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                ← एडमिन ओवरव्यू पर वापस जाएं
              </button>
            </div>
            <ReporterDeskScreen
              categories={categories}
              districts={districts}
              reporterDrafts={reporterDrafts}
              reporters={reporters}
              onSubmitDraft={onSubmitReporterDraft || (async () => {})}
              onBackClick={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* TAB 12: EMBEDDED GRAPHICS STUDIO */}
        {activeTab === 'graphics_studio' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-sm">एकीकृत ग्राफ़िक्स स्टूडियो (Embedded Graphics Studio)</span>
                <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded font-black">ACTIVE WORKSPACE</span>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                ← एडमिन ओवरव्यू पर वापस जाएं
              </button>
            </div>
            <GraphicsStudioScreen
              currentUser={{
                id: 'usr-desk-chief',
                name: 'मुख्य संपादक (Master Admin)',
                role: currentRole,
                roles: [currentRole],
              }}
              articles={articles}
              districts={districts}
              categories={categories}
              onNavigateHome={() => setActiveTab('overview')}
              onNavigateDesk={() => setActiveTab('newsroom_studio')}
            />
          </div>
        )}

        {/* TAB 13: EMBEDDED VIDEO STUDIO */}
        {activeTab === 'videos_studio' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-red-500" />
                <span className="font-bold text-sm">एकीकृत वीडियो स्टूडियो (Embedded Video Studio)</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black">ACTIVE WORKSPACE</span>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                ← एडमिन ओवरव्यू पर वापस जाएं
              </button>
            </div>
            <VideoStudioScreen
              currentUser={{
                id: 'usr-desk-chief',
                name: 'मुख्य संपादक (Master Admin)',
                role: currentRole,
                roles: [currentRole],
              }}
              articles={articles}
              districts={districts}
              categories={categories}
              onNavigateHome={() => setActiveTab('overview')}
              onNavigateDesk={() => setActiveTab('newsroom_studio')}
            />
          </div>
        )}

        {/* TAB 14: EMBEDDED AI NEWSROOM */}
        {activeTab === 'ai_newsroom_studio' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm">एकीकृत AI न्यूज़ रूम (Embedded AI Newsroom Suite)</span>
                <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-black">ACTIVE WORKSPACE</span>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                ← एडमिन ओवरव्यू पर वापस जाएं
              </button>
            </div>
            <AiNewsroomScreen
              currentUser={{
                id: 'usr-desk-chief',
                name: 'मुख्य संपादक (Master Admin)',
                role: currentRole,
                roles: [currentRole],
              }}
              articles={articles}
              districts={districts}
              categories={categories}
              onNavigateToArticles={() => setActiveTab('newsroom_studio')}
              onPublishArticle={onPublishArticle}
              onAddToReviewQueue={(art) => {
                if (onAddPendingArticle) onAddPendingArticle(art as ArticleDetail);
              }}
            />
          </div>
        )}

        {/* TAB 15: RSS MANAGEMENT DESK */}
        {activeTab === 'rss_management' && (
          <RssManagementDesk
            districts={districts}
            categories={categories}
            onAddPendingArticle={(art) => {
              if (onAddPendingArticle) onAddPendingArticle(art);
            }}
            onPublishArticle={onPublishArticle}
            onNavigateToReviewQueue={() => setActiveTab('review_queue')}
          />
        )}

        {/* TAB 16: REPORTER COIN MANAGEMENT DESK */}
        {activeTab === 'reporter_coins' && (
          <ReporterCoinManagementDesk
            reporters={reporters}
            onUpdateReporterCoins={onUpdateReporterCoins}
          />
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                🚨 अलर्ट प्रसारित करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Articles Modal for Master Admin */}
      {showSavedNewsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">सहेजे गए समाचार (Saved Articles)</h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                  {bookmarkedArticles.length}
                </span>
              </div>
              <button
                onClick={() => setShowSavedNewsModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {bookmarkedArticles.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  कोई सहेजा गया समाचार उपलब्ध नहीं है।
                </div>
              ) : (
                bookmarkedArticles.map((art) => (
                  <div
                    key={art.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{art.title}</h4>
                      <span className="text-[10px] text-slate-500">{art.districtName} • {art.categoryName || art.category}</span>
                    </div>
                    <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold shrink-0">
                      बुकमार्क
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSavedNewsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Admin Editorial Guide & Guidelines PDF Modal */}
      {showPdfGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">मास्टर एडमिनिस्ट्रेटर गाइड व संपादकीय दिशानिर्देश</h3>
              </div>
              <button
                onClick={() => setShowPdfGuideModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 text-xs text-slate-700 leading-relaxed pr-1">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <h4 className="font-bold text-sm mb-1">1. 10-सूत्रीय संपादकीय सत्यापन प्रोटोकॉल</h4>
                <p>प्रत्येक सबमिशन को 10-बिंदु तथ्य-सत्यापन, धारा-अनुपालन व स्रोत पुष्टि के बाद ही राज्य स्तर पर प्रकाशित किया जाता है।</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-slate-900 mb-1">2. एकीकृत स्टूडियो व आरएसएस प्रबंधन</h4>
                <p>न्यूज़रूम, ई-पेपर, ग्राफ़िक्स, वीडियो व AI न्यूज़ रूम सीधे एडमिन डैशबोर्ड में एम्बेडेड हैं। RSS फ़ीड्स से सामग्री स्वतः देवनागरी में रूपांतरित होकर समीक्षा कतार में आती है।</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-slate-900 mb-1">3. संवाददाता कॉइन गवर्नेंस</h4>
                <p>कॉइन केवल फील्ड संवाददाताओं के स्टोरी कंट्रीब्यूशन व इंसेंटिव हेतु हैं। एडमिन या पाठक के लिए कॉइन लागू नहीं हैं।</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const blob = new Blob([
                    `BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) - मास्टर एडमिनिस्ट्रेटर मैनुअल\n\n1. 10-सूत्रीय संपादकीय सत्यापन\n2. आरएसएस व एआई न्यूज़ रूम\n3. संवाददाता कॉइन गवर्नेंस\n4. 55 जिले कवरेज व ई-पेपर प्रबंधन`
                  ], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'BREAKING_NEWS_WALA_Master_Admin_Guide.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>गाइड पैकेज डाउनलोड करें</span>
              </button>

              <button
                onClick={() => setShowPdfGuideModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

