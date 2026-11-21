import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PenTool,
  History,
  MessageSquare,
  Sparkles,
  Mic,
  MicOff,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Send,
  ShieldCheck,
  Check,
  UserCheck,
  Layers,
  Award,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  Users,
  QrCode,
  Printer,
  Megaphone,
  Tag,
  Receipt,
  Share2,
  Download,
  Cloud,
  X,
  RefreshCw,
  Eye,
  Newspaper,
  Coins,
  Wallet,
  Trash2,
  Plus,
  Edit3,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { EpaperReporterWorkspace } from '../components/epaper/EpaperReporterWorkspace';
import {
  ArticleDetail,
  CategoryItem,
  CreateDraftRequest,
  DistrictItem,
  ReporterAiDraft,
  ReporterProfile,
  EpaperAdSubmissionDoc,
  EpaperAdCategory,
  EpaperAdSlotType,
  EpaperWhatsAppQuotaResponse,
} from '../types';
import { BnwAiService } from '../services/aiService';
import { apiClient } from '../services/apiClient';
import { GraphicRenderer } from '../services/graphicRenderer';

interface ReporterDeskScreenProps {
  categories: CategoryItem[];
  districts: DistrictItem[];
  reporterDrafts: ArticleDetail[];
  reporters?: ReporterProfile[];
  onSubmitDraft: (draft: CreateDraftRequest, reporter?: ReporterProfile) => void;
  onBackClick: () => void;
}

interface ReporterArticleClippingModalProps {
  story: ArticleDetail;
  reporter: ReporterProfile;
  quota: EpaperWhatsAppQuotaResponse | null;
  onClose: () => void;
  onQuotaUpdated: () => void;
}

export const ReporterArticleClippingModal: React.FC<ReporterArticleClippingModalProps> = ({
  story,
  reporter,
  quota,
  onClose,
  onQuotaUpdated,
}) => {
  const [format, setFormat] = useState<'4:5' | '1:1'>('4:5');
  const [headline, setHeadline] = useState(story.title || '');
  const [body, setBody] = useState(story.content || story.summary || '');
  const [district, setDistrict] = useState(story.districtName || reporter.assignedDistricts[0] || 'मध्य प्रदेश');
  const [photoUrl, setPhotoUrl] = useState(story.imageUrl || '');
  const [isRendering, setIsRendering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderCard = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsRendering(true);
    try {
      if (format === '4:5') {
        await GraphicRenderer.renderArticleClipping(canvasRef.current, {
          headline,
          body,
          reporterName: reporter.name,
          reporterBadge: reporter.badgeNumber || 'BNW-REP-0101',
          reporterAvatar: reporter.avatar,
          photoUrl: photoUrl || undefined,
          date: new Date().toLocaleDateString('hi-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          district,
          editionTitle: 'अख़बार कतरन • डिजिटल संस्करण',
        });
      } else {
        await GraphicRenderer.renderToCanvas(
          canvasRef.current,
          {
            aspectRatio: '1:1',
            headline,
            subtext: body.slice(0, 180),
            imageUrl: photoUrl || undefined,
            districtName: district,
            authorName: `संवाददाता: ${reporter.name} • ${reporter.badgeNumber || 'BNW-REP-0101'}`,
            themeColor: '#0F172A',
          },
          undefined,
          { scale: 1 }
        );
      }
    } catch (err: any) {
      console.warn('[ReporterArticleClippingModal] Render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [format, headline, body, district, photoUrl, reporter]);

  useEffect(() => {
    renderCard();
  }, [renderCard]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    GraphicRenderer.downloadImage(
      dataUrl,
      `bnw-clipping-${story.id || 'story'}-${format.replace(':', 'x')}.png`
    );
  };

  const handleShareWhatsApp = () => {
    const shareText = `*${headline}*\n\n${body.slice(0, 220)}...\n\nपूरी खबर पढ़ें: https://breakingnewswala.com/article/${story.slug || story.id}\n\n— अधिकृत संवाददाता: ${reporter.name} (${reporter.badgeNumber || 'BNW-REP-0101'})\nब्रेकिंग न्यूज़ वाला (मध्य प्रदेश)`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleSaveToCloud = async () => {
    if (quota && quota.remaining <= 0) {
      setStatusMessage({
        type: 'error',
        text: 'दैनिक व्हाट्सएप कार्ड निर्माण सीमा (20 कार्ड/दिन) समाप्त हो चुकी है।',
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      await apiClient.epaper.generateWhatsAppCard({
        format,
        headline,
        body,
        imageUrl: photoUrl || undefined,
        articleId: story.id,
      });
      setStatusMessage({
        type: 'success',
        text: 'कार्ड क्लाउड में सफलतापूर्वक सहेजा गया (निजी व सुरक्षित भंडारण)।',
      });
      onQuotaUpdated();
    } catch (err: any) {
      const errMsg =
        err.code === 'ERR_QUOTA_EXHAUSTED' || err.statusCode === 429
          ? 'दैनिक व्हाट्सएप कार्ड निर्माण सीमा (20 कार्ड/दिन) समाप्त हो चुकी है।'
          : err.message || 'क्लाउड में कार्ड सहेजना विफल रहा।';
      setStatusMessage({ type: 'error', text: errMsg });
      onQuotaUpdated();
    } finally {
      setIsSaving(false);
    }
  };

  const isQuotaExhausted = quota ? quota.remaining <= 0 : false;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg text-white">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>अख़बार कतरन एवं सोशल कार्ड जनरेटर</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  {format}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                उच्च-गुणवत्ता देवनागरी अख़बार कतरन व व्हाट्सएप कार्ड
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                isQuotaExhausted
                  ? 'bg-red-950/80 border-red-700 text-red-300'
                  : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isQuotaExhausted ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
              <span>कोटा: {quota?.remaining ?? 20}/{quota?.maxDaily ?? 20} शेष</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Canvas Preview */}
          <div className="lg:col-span-6 flex flex-col items-center gap-3">
            {/* Format Selector Pills */}
            <div className="w-full grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFormat('4:5')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  format === '4:5'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>4:5 (अख़बार कतरन / स्टोरी)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('1:1')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  format === '1:1'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>1:1 (व्हाट्सएप स्क्वायर)</span>
              </button>
            </div>

            {/* Canvas Preview Container */}
            <div className="relative w-full max-w-[340px] bg-slate-50 border border-slate-200 rounded-xl p-2 shadow-inner flex items-center justify-center min-h-[380px]">
              {isRendering && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center rounded-xl z-10">
                  <RefreshCw className="w-6 h-6 text-red-600 animate-spin" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="w-full h-auto max-h-[460px] object-contain rounded-lg shadow-sm border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Right Column: Editor Controls & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div className="space-y-3.5 text-xs">
              {/* Status Alert Banner */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Quota Exhausted Warning */}
              {isQuotaExhausted && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">दैनिक कोटा समाप्त (20/20 प्रयुक्त):</span>{' '}
                    आप निःशुल्क उच्च-रिज़ॉल्यूशन PNG डाउनलोड व व्हाट्सएप शेयर कर सकते हैं। क्लाउड में नया कार्ड कल सुबह 5:30 बजे के बाद ही सहेजा जा सकेगा।
                  </div>
                </div>
              )}

              {/* Headline Input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">शीर्षक (Headline)</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-red-600"
                />
              </div>

              {/* Body / Snippet Input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">मुख्य विवरण / सारांश (Justified Hindi Body)</label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal focus:outline-hidden focus:border-red-600 resize-none"
                />
              </div>

              {/* District & Photo Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">जिला टैग</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">तस्वीर URL (वैकल्पिक)</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Reporter Attribution Card Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={reporter.avatar}
                    alt={reporter.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-300"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{reporter.name}</div>
                    <div className="text-[11px] text-blue-700 font-semibold">
                      प्रमाणित संवाददाता • {reporter.badgeNumber || 'BNW-REP-0101'}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div className="font-bold text-slate-700">breakingnewswala.com</div>
                  <div>डिजिटल ई-पेपर नेटवर्क</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="py-2.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG डाउनलोड</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>व्हाट्सएप शेयर</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToCloud}
                disabled={isSaving || isQuotaExhausted}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all ${
                  isSaving || isQuotaExhausted
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                }`}
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span>क्लाउड में सहेजें</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReporterDeskScreen: React.FC<ReporterDeskScreenProps> = ({
  categories,
  districts,
  reporterDrafts,
  reporters = [],
  onSubmitDraft,
  onBackClick,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'my_stories' | 'assignments' | 'profile' | 'classified_ads' | 'epaper_workspace'>('create');

  // Classified Ads Submission State
  const [adAdvertiserName, setAdAdvertiserName] = useState<string>('');
  const [adContactPhone, setAdContactPhone] = useState<string>('');
  const [adCategory, setAdCategory] = useState<EpaperAdCategory>('COMMERCIAL');
  const [adSlotType, setAdSlotType] = useState<EpaperAdSlotType>('CLASSIFIED');
  const [adText, setAdText] = useState<string>('');
  const [adReceiptNumber, setAdReceiptNumber] = useState<string>('');
  const [adDistrict, setAdDistrict] = useState<string>('dist-bhopal');
  const [adSubmitting, setAdSubmitting] = useState<boolean>(false);
  const [myClassifiedAds, setMyClassifiedAds] = useState<EpaperAdSubmissionDoc[]>([]);
  const [loadingMyAds, setLoadingMyAds] = useState<boolean>(false);
  const [adToast, setAdToast] = useState<string | null>(null);

  // 4:5 Article Clipping & WhatsApp Card Generator State
  const [selectedStoryForClipping, setSelectedStoryForClipping] = useState<ArticleDetail | null>(null);
  const [whatsappQuota, setWhatsappQuota] = useState<EpaperWhatsAppQuotaResponse | null>(null);

  const loadWhatsAppQuota = useCallback(async () => {
    try {
      const q = await apiClient.epaper.getWhatsAppQuota();
      setWhatsappQuota(q);
    } catch (err) {
      console.warn('[ReporterDeskScreen] Failed to load WhatsApp quota:', err);
    }
  }, []);

  useEffect(() => {
    loadWhatsAppQuota();
  }, [loadWhatsAppQuota]);

  // Active Reporter Selection (Persona Switcher)
  const [selectedReporterId, setSelectedReporterId] = useState<string>(
    reporters[0]?.id || 'rep-active'
  );

  const activeReporter: ReporterProfile =
    reporters.find((r) => r.id === selectedReporterId) ||
    reporters[0] || {
      id: 'rep-active',
      name: 'राजेश पटेल',
      email: 'rajesh.patel@breakingnewswala.com',
      phone: '+91 98260 12345',
      role: 'trusted_reporter',
      assignedDistricts: ['भोपाल', 'सीहोर'],
      assignedDivision: 'भोपाल संभाग',
      totalStoriesFiled: 148,
      totalStoriesPublished: 142,
      badgeNumber: 'BNW-REP-0101',
      joinedDate: '15 जनवरी 2024',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
    };

  // Form states
  const [creationMode, setCreationMode] = useState<'raw_script' | 'manual'>('manual');
  const [rawNotes, setRawNotes] = useState('');
  const [headline, setHeadline] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat-mp');
  const [selectedDistrictId, setSelectedDistrictId] = useState('dist-bhopal');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80'
  );
  const [imageCaption, setImageCaption] = useState('');
  const [imageAttribution, setImageAttribution] = useState('बीएनडब्ल्यू फील्ड संवाददाता');
  const [isBreaking, setIsBreaking] = useState(false);

  // Self Fact-Checking Protocol checks
  const [checkSource, setCheckSource] = useState(true);
  const [checkOfficial, setCheckOfficial] = useState(true);
  const [checkMediaAuthentic, setCheckMediaAuthentic] = useState(true);
  const [checkHarmonious, setCheckHarmonious] = useState(true);

  // Multi-Media Upload State
  const [uploadedMediaList, setUploadedMediaList] = useState<
    Array<{
      id: string;
      url: string;
      caption: string;
      attribution: string;
      type: 'image' | 'video';
    }>
  >([
    {
      id: 'media-initial-1',
      url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
      caption: 'ग्राउंड रिपोर्ट मुख्य दृश्य',
      attribution: 'बीएनडब्ल्यू फील्ड संवाददाता',
      type: 'image',
    },
  ]);

  // Profile Form & Coin Wallet States
  const [reporterProfileForm, setReporterProfileForm] = useState({
    name: activeReporter.name,
    phone: activeReporter.phone,
    email: activeReporter.email,
    bio: 'वरिष्ठ जिला संवाददाता, मध्य प्रदेश ब्यूरो। निष्पक्ष एवं खोजी पत्रकारिता।',
    upiId: 'rajesh.patel@okaxis',
    avatar: activeReporter.avatar,
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [reporterCoins, setReporterCoins] = useState(activeReporter.totalStoriesPublished * 50 + 250);
  const [coinWithdrawAmount, setCoinWithdrawAmount] = useState(500);
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);

  // AI Assistant state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState<ReporterAiDraft | null>(null);

  // Live Media / Video upload state
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadStatus, setMediaUploadStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Voice note dictation (Web Speech API hi-IN + timed fallback)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const recordingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Digital Press ID QR Verification state
  const [isVerifyingBadge, setIsVerifyingBadge] = useState(false);
  const [badgeVerificationResult, setBadgeVerificationResult] = useState<{
    verified: boolean;
    badgeNumber: string;
    name: string;
    division: string;
    districts: string[];
    status: string;
    checkedAt: string;
  } | null>(null);

  React.useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore cleanup errors
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Success modal
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Story Status Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Multi-file media upload handler
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setMediaUploadStatus(null);
    setIsUploadingMedia(true);

    let successCount = 0;
    const newItems: Array<{
      id: string;
      url: string;
      caption: string;
      attribution: string;
      type: 'image' | 'video';
    }> = [];

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        setMediaUploadStatus({ type: 'error', text: `${file.name} 50MB से बड़ी है।` });
        continue;
      }
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
      try {
        const uploaded = await apiClient.reporter.uploadMedia(file, imageCaption || file.name);
        newItems.push({
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: uploaded.url,
          caption: imageCaption || file.name.replace(/\.[^/.]+$/, ''),
          attribution: imageAttribution || activeReporter.name,
          type: isVideo ? 'video' : 'image',
        });
        successCount++;
      } catch {
        // Fallback to FileReader data URL
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
        if (dataUrl) {
          newItems.push({
            id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: dataUrl,
            caption: imageCaption || file.name.replace(/\.[^/.]+$/, ''),
            attribution: imageAttribution || activeReporter.name,
            type: isVideo ? 'video' : 'image',
          });
          successCount++;
        }
      }
    }

    if (newItems.length > 0) {
      setUploadedMediaList((prev) => {
        const filtered = prev.filter((p) => p.id !== 'media-initial-1');
        return [...filtered, ...newItems];
      });
      // Set the first uploaded item as primary imageUrl
      setImageUrl(newItems[0].url);
      setMediaUploadStatus({
        type: 'success',
        text: `${successCount} मीडिया फ़ाइलें सफलतापूर्वक जोड़ी गईं।`,
      });
    }

    setIsUploadingMedia(false);
    e.target.value = '';
  };

  const handleRemoveMediaItem = (id: string) => {
    setUploadedMediaList((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      if (remaining.length > 0 && imageUrl === prev.find((m) => m.id === id)?.url) {
        setImageUrl(remaining[0].url);
      }
      return remaining;
    });
  };

  const handleSetPrimaryMedia = (url: string) => {
    setImageUrl(url);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3500);
  };

  const handleWithdrawCoins = () => {
    if (coinWithdrawAmount < 100) {
      setWithdrawStatus('न्यूनतम रिडेम्पशन सीमा 100 सिक्के (₹10) है।');
      return;
    }
    if (coinWithdrawAmount > reporterCoins) {
      setWithdrawStatus('अपर्याप्त कॉइन बैलेंस!');
      return;
    }
    const cashValue = (coinWithdrawAmount / 10).toFixed(2);
    setReporterCoins((prev) => prev - coinWithdrawAmount);
    setWithdrawStatus(
      `सफलता: ${coinWithdrawAmount} सिक्के (₹${cashValue}) का भुगतान अनुरोध UPI (${reporterProfileForm.upiId}) पर प्रेषित कर दिया गया है।`
    );
  };

  const handleOpenGraphicCardGenerator = () => {
    setSelectedStoryForClipping({
      id: `custom-card-${Date.now()}`,
      title: headline || 'मध्य प्रदेश बड़ी खबर: ताज़ा ग्राउंड रिपोर्ट',
      summary:
        bodyContent.slice(0, 180) ||
        'ब्रेकिंग न्यूज़ वाला ग्राउंड रिपोर्टर द्वारा सत्यापित ताज़ा घटनाक्रम।',
      content: bodyContent || 'विस्तृत रिपोर्ट के लिए ब्रेकिंग न्यूज़ वाला से जुड़े रहें।',
      districtName: districts.find((d) => d.id === selectedDistrictId)?.nameHi || 'मध्य प्रदेश',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
      authorName: reporterProfileForm.name || activeReporter.name,
      badgeNumber: activeReporter.badgeNumber,
      avatar: reporterProfileForm.avatar || activeReporter.avatar,
      slug: 'breaking-ground-report',
    } as any);
  };

  // Trigger AI Field Assistance (Backend /api/v1/ai/news-writer + fallback)
  const handleAiAssist = async () => {
    const inputContent = rawNotes.trim() || bodyContent.trim() || headline.trim();
    if (!inputContent) {
      setMediaUploadStatus({
        type: 'error',
        text: 'कृपया पहले कुछ कच्चे नोट्स या विवरण दर्ज करें ताकि AI आपकी सहायता कर सके।',
      });
      return;
    }
    setIsAiLoading(true);
    setMediaUploadStatus(null);
    try {
      const selectedDist = districts.find((d) => d.id === selectedDistrictId)?.nameHi || 'भोपाल';
      const result = await BnwAiService.assistReporter(inputContent, selectedDist);
      setAiDraftResult(result);
      if (!headline) {
        setHeadline(result.suggestedHeadline);
      }
      if (!bodyContent && result.leadParagraph) {
        setBodyContent(`${result.leadParagraph}\n\n${inputContent}`);
      }
    } catch {
      setMediaUploadStatus({ type: 'error', text: 'AI सहायता लोड करने में समस्या हुई।' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = (suggestion: ReporterAiDraft) => {
    setHeadline(suggestion.suggestedHeadline);
    if (!bodyContent.includes(suggestion.leadParagraph)) {
      setBodyContent(`${suggestion.leadParagraph}\n\n${bodyContent || rawNotes}`);
    }
    setCreationMode('manual');
    setAiDraftResult(null);
  };

  const stopVoiceRecording = (appendFallbackNote = false) => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoice(false);
    if (appendFallbackNote) {
      const note = `[फील्ड वॉइस डिक्टेशन (${recordingSeconds}s): स्थानीय प्रत्यक्षदर्शियों व प्रशासनिक पक्ष का विवरण दर्ज किया गया।]`;
      if (creationMode === 'raw_script') {
        setRawNotes((prev) => (prev ? `${prev}\n${note}` : note));
      } else {
        setBodyContent((prev) => (prev ? `${prev}\n\n${note}` : note));
      }
    }
    setRecordingSeconds(0);
  };

  const handleVoiceNoteToggle = () => {
    if (isRecordingVoice) {
      const hadRecognition = Boolean(recognitionRef.current);
      stopVoiceRecording(!hadRecognition);
      if (hadRecognition) {
        setVoiceStatus('हिंदी वॉइस डिक्टेशन पूर्ण हुआ और पाठ में जोड़ा गया।');
      }
      return;
    }

    setVoiceStatus(null);
    setRecordingSeconds(0);
    setIsRecordingVoice(true);

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognitionCtor) {
      try {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = 'hi-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let spoken = '';
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            spoken += `${event.results[i][0]?.transcript || ''} `;
          }
          const cleanText = spoken.trim();
          if (cleanText) {
            if (event.results[event.results.length - 1]?.isFinal) {
              if (creationMode === 'raw_script') {
                setRawNotes((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
              } else {
                setBodyContent((prev) => (prev ? `${prev}\n${cleanText}` : cleanText));
              }
            }
            setVoiceStatus(`लाइव डिक्टेशन: "${cleanText.slice(0, 70)}"`);
          }
        };

        recognition.onerror = () => {
          setVoiceStatus('माइक्रोफ़ोन अनुमति न मिलने के कारण टाइम्ड नोट मोड सक्रिय है — रोकें दबाकर नोट जोड़ें।');
          recognitionRef.current = null;
        };

        recognition.start();
        recognitionRef.current = recognition;
        setVoiceStatus('हिंदी वॉइस डिक्टेशन चालू है (hi-IN)... स्पष्ट बोलें।');
        return;
      } catch {
        recognitionRef.current = null;
      }
    }

    setVoiceStatus('ब्राउज़र में स्पीच API उपलब्ध नहीं है — टाइम्ड वॉइस नोट रिकॉर्डिंग चल रही है, पूर्ण होने पर "रोकें" दबाएं।');
  };

  const handleVerifyBadge = async () => {
    setIsVerifyingBadge(true);
    try {
      const res = await apiClient.publicNews.verifyReporterBadge(activeReporter.badgeNumber);
      setBadgeVerificationResult({
        verified: Boolean(res?.verified !== false),
        badgeNumber: res?.badgeNumber || activeReporter.badgeNumber,
        name: res?.name || activeReporter.name,
        division: res?.assignedDivision || activeReporter.assignedDivision || 'मध्य प्रदेश',
        districts: res?.assignedDistricts || activeReporter.assignedDistricts,
        status: res?.status || activeReporter.status || 'ACTIVE',
        checkedAt: new Date().toLocaleTimeString('hi-IN'),
      });
    } catch {
      setBadgeVerificationResult({
        verified: (activeReporter.status || 'ACTIVE') === 'ACTIVE',
        badgeNumber: activeReporter.badgeNumber,
        name: activeReporter.name,
        division: activeReporter.assignedDivision || 'मध्य प्रदेश',
        districts: activeReporter.assignedDistricts,
        status: activeReporter.status || 'ACTIVE',
        checkedAt: new Date().toLocaleTimeString('hi-IN'),
      });
    } finally {
      setIsVerifyingBadge(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !bodyContent.trim()) {
      setMediaUploadStatus({
        type: 'error',
        text: 'कृपया समाचार का शीर्षक और मुख्य विवरण दोनों दर्ज करें।',
      });
      return;
    }

    const draftReq: CreateDraftRequest = {
      title: headline,
      content: bodyContent,
      summary: bodyContent.slice(0, 160),
      categoryId: selectedCategoryId,
      districtId: selectedDistrictId,
      featuredImage: imageUrl,
      imageCaption:
        imageCaption ||
        `जिला ${districts.find((d) => d.id === selectedDistrictId)?.nameHi || ''} से फील्ड कवरेज`,
      imageAttribution: imageAttribution || activeReporter.name,
      isBreaking: isBreaking,
    };

    onSubmitDraft(draftReq, activeReporter);
    setSubmittedSuccess(true);
    setHeadline('');
    setBodyContent('');
    setRawNotes('');
    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveTab('my_stories');
    }, 2000);
  };

  const loadMyClassifiedAds = async () => {
    setLoadingMyAds(true);
    try {
      const ads = await apiClient.epaper.getClassifiedSubmissions({
        reporterId: activeReporter.id,
      });
      setMyClassifiedAds(ads);
    } catch (err: any) {
      console.error('Failed to load reporter classified ads:', err);
    } finally {
      setLoadingMyAds(false);
    }
  };

  const handleSubmitClassifiedAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adAdvertiserName.trim() || !adContactPhone.trim()) {
      alert('विज्ञापनदाता का नाम और संपर्क फोन अनिवार्य हैं');
      return;
    }
    setAdSubmitting(true);
    try {
      const districtObj = districts.find((d) => d.id === adDistrict);
      await apiClient.epaper.submitClassifiedAd({
        advertiserName: adAdvertiserName.trim(),
        contactPhone: adContactPhone.trim(),
        category: adCategory,
        slotType: adSlotType,
        text: adText.trim(),
        receiptNumber: adReceiptNumber.trim(),
        targetDistrict: adDistrict,
        targetDistrictName: districtObj?.nameHi || 'भोपाल',
        reporterId: activeReporter.id,
        reporterName: activeReporter.name,
        reporterBadge: activeReporter.badgeNumber,
        amount: adSlotType === 'CLASSIFIED' ? 250 : 2500,
        status: 'PENDING',
      });
      setAdToast('विज्ञापन सफलतापूर्वक दर्ज हो गया! समीक्षा उपरांत ई-पेपर में प्रकाशित किया जाएगा।');
      setAdAdvertiserName('');
      setAdContactPhone('');
      setAdText('');
      setAdReceiptNumber('');
      setTimeout(() => setAdToast(null), 4000);
      await loadMyClassifiedAds();
    } catch (err: any) {
      alert(err.message || 'विज्ञापन दर्ज करने में विफलता!');
    } finally {
      setAdSubmitting(false);
    }
  };

  const filteredDrafts = reporterDrafts.filter((d) => {
    if (statusFilter === 'ALL') return true;
    return d.status === statusFilter;
  });

  return (
    <div className="bg-slate-100 min-h-screen pb-24 font-sans">
      {/* 1. Reporter Profile Header Bar */}
      <div className="bg-slate-900 text-white px-4 py-3.5 border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-yellow-400 overflow-hidden shrink-0 shadow-sm">
              <img
                src={activeReporter.avatar}
                alt={activeReporter.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black tracking-tight font-serif">
                  संवाददाता डिजिटल कार्यक्षेत्र (Reporter Desk)
                </h1>
                <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded-full">
                  प्रमाणित बीट
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                संवाददाता: <strong>{activeReporter.name}</strong> • प्रेस बैज:{' '}
                <strong className="font-mono text-yellow-300">{activeReporter.badgeNumber}</strong> • बीट:{' '}
                <strong>{activeReporter.assignedDistricts.join(', ')}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Persona Switcher Dropdown */}
            {reporters.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                <Users className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <select
                  value={selectedReporterId}
                  onChange={(e) => setSelectedReporterId(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-hidden pr-2 cursor-pointer"
                  title="सक्रिय संवाददाता प्रोफ़ाइल बदलें"
                >
                  {reporters.map((rep) => (
                    <option key={rep.id} value={rep.id} className="bg-slate-900 text-white">
                      {rep.name} ({rep.badgeNumber} - {rep.assignedDistricts[0]})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="px-2.5 py-1 bg-emerald-900/70 border border-emerald-600 rounded-lg text-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>विश्वास स्कोर: 98% (A+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[56px] z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'create'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>समाचार दर्ज करें</span>
          </button>

          <button
            onClick={() => setActiveTab('my_stories')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'my_stories'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>मेरी खबरें ({reporterDrafts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'assignments'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>संपादकीय असाइनमेंट्स (3)</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'profile'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>मेरी प्रोफ़ाइल व कॉइन ({reporterCoins} सिक्के)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('classified_ads');
              loadMyClassifiedAds();
            }}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'classified_ads'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>स्थानीय विज्ञापन / क्लासिफाइड</span>
          </button>

          <button
            onClick={() => setActiveTab('epaper_workspace')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'epaper_workspace'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>ई-पेपर कार्यक्षेत्र</span>
          </button>

          <div className="ml-auto flex items-center gap-2 shrink-0 py-1">
            <button
              onClick={handleOpenGraphicCardGenerator}
              className="py-1 px-3 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white flex items-center gap-1.5 whitespace-nowrap shadow-xs text-xs font-black transition-all cursor-pointer"
              title="सोशल मीडिया ब्रेकिंग न्यूज़ ग्राफिक कार्ड बनाएं"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>सोशल मीडिया कार्ड</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {submittedSuccess && (
          <div className="mb-4 bg-emerald-100 border border-emerald-400 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              समाचार ड्राफ्ट सफलतापूर्वक दर्ज हुआ! इसे मुख्य संपादक डेस्क की समीक्षा में भेज दिया गया है।
            </span>
          </div>
        )}

        {/* TAB 1: COMPOSE STORY */}
        {activeTab === 'create' && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-red-600" />
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  ग्राउंड रिपोर्ट अथवा ब्रेकिंग न्यूज़ फाइल करें
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                10-बिंदु संपादकीय संहिता अनिवार्य
              </span>
            </div>

            {/* Creation Mode Toggle (Raw Notes vs Structured) */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCreationMode('manual')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  creationMode === 'manual'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 मानक रिपोर्टर एडिटर
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('raw_script')}
                className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  creationMode === 'raw_script'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>कच्ची स्क्रिप्ट / AI फील्ड सहायक (सिम्युलेटर)</span>
              </button>
            </div>

            {/* Raw Script Input Mode */}
            {creationMode === 'raw_script' && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    कच्ची स्क्रिप्ट या त्वरित ऑडियो नोट्स दर्ज करें:
                  </span>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={isAiLoading}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-xs transition-colors"
                  >
                    {isAiLoading ? 'AI तैयार कर रहा...' : 'AI से खबर तैयार कराएं'}
                  </button>
                </div>
                <textarea
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  rows={4}
                  placeholder="उदा. सीहोर मंडी में आज सोयाबीन की रिकॉर्ड आवक हुई, किसानों को 5100 का भाव मिला। एसडीएम ने उपार्जन केंद्रों का दौरा किया..."
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-slate-900"
                />
                <span className="text-[10px] text-indigo-600 block italic">
                  * यह सुविधा स्थानीय हेयूरिस्टिक इंजन द्वारा संचालित है।
                </span>
              </div>
            )}

            {/* District & Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ज़िला चुनें (Madhya Pradesh 55 Districts) *
                </label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameHi} ({d.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  समाचार श्रेणी *
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameHi}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Headline Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  समाचार शीर्षक (Headline in Devanagari) *
                </label>
                <span className="text-[10px] text-slate-400">
                  {headline.length}/120 अक्षर
                </span>
              </div>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="उदा. सीहोर कृषि उपज मंडी में सोयाबीन के भाव में उछाल, किसानों के चेहरे खिले..."
                className="w-full text-sm font-semibold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Content Textarea + Voice Dictation + AI Assist */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  समाचार का मुख्य विवरण व ग्राउंड रिपोर्ट *
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVoiceNoteToggle}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                      isRecordingVoice
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title="ऑडियो डिक्टेशन सिम्युलेटर"
                  >
                    {isRecordingVoice ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span>
                      {isRecordingVoice
                        ? `रिकॉर्डिंग (${recordingSeconds}s)... रोकें`
                        : 'हिंदी वॉइस डिक्टेशन (Mic)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={isAiLoading}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAiLoading ? 'AI तैयार कर रहा...' : 'AI सुधार'}</span>
                  </button>
                </div>
              </div>

              {voiceStatus && (
                <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-[11px] font-semibold text-red-800 flex items-center justify-between gap-2">
                  <span>{voiceStatus}</span>
                  <button
                    type="button"
                    onClick={() => setVoiceStatus(null)}
                    className="text-red-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              <textarea
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                rows={6}
                placeholder="घटना स्थल का पूरा ब्यौरा लिखें: क्या हुआ, कब हुआ, संबंधित अधिकारी (DM/SP/SDM) का क्या कहना है, प्रत्यक्षदर्शियों का पक्ष..."
                className="w-full text-xs font-normal border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 leading-relaxed"
                required
              />
            </div>

            {/* AI Assistant Output Box */}
            {aiDraftResult && (
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI फील्ड संपादन सुझाव (हेयूरिस्टिक):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyAiSuggestion(aiDraftResult)}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700"
                  >
                    सुझाव लागू करें
                  </button>
                </div>
                <p>
                  <strong>सुझाया गया शीर्षक:</strong> {aiDraftResult.suggestedHeadline}
                </p>
                <p>
                  <strong>लीड पैराग्राफ:</strong> {aiDraftResult.leadParagraph}
                </p>
              </div>
            )}

            {/* Multi-Media Ground Photo / Video Upload & Attribution */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  ग्राउंड फोटो व वीडियो अपलोड ({uploadedMediaList.length} चयनित)
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingMedia ? 'अपलोड हो रहा है...' : '+ फोटो/वीडियो फ़ाइलें चुनें'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                      onChange={handleMediaFileUpload}
                      disabled={isUploadingMedia}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {mediaUploadStatus && (
                <div
                  className={`px-3 py-2 rounded-lg text-[11px] font-semibold ${
                    mediaUploadStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {mediaUploadStatus.text}
                </div>
              )}

              {/* Uploaded Media Thumbnails Grid */}
              {uploadedMediaList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                  {uploadedMediaList.map((media) => {
                    const isPrimary = imageUrl === media.url;
                    return (
                      <div
                        key={media.id}
                        className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-slate-900 ${
                          isPrimary ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="h-28 w-full bg-black flex items-center justify-center overflow-hidden">
                          {media.type === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(media.url) ? (
                            <video src={media.url} className="h-full w-full object-cover" />
                          ) : (
                            <img src={media.url} alt={media.caption} className="h-full w-full object-cover" />
                          )}
                        </div>

                        {/* Badges & Actions */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                          {isPrimary ? (
                            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                              ★ मुख्य कवर
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryMedia(media.url)}
                              className="pointer-events-auto bg-black/60 hover:bg-black/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow cursor-pointer transition-colors"
                            >
                              कवर बनाएं
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaItem(media.id)}
                            className="pointer-events-auto bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md shadow cursor-pointer transition-colors"
                            title="हटाएं"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="p-1.5 bg-white border-t border-slate-100">
                          <input
                            type="text"
                            value={media.caption}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUploadedMediaList((prev) =>
                                prev.map((m) => (m.id === media.id ? { ...m, caption: val } : m))
                              );
                            }}
                            placeholder="कैप्शन लिखें..."
                            className="w-full text-[10px] text-slate-700 font-medium px-1 py-0.5 border border-slate-200 rounded"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    कवर फ़ोटो / वीडियो वेब URL:
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... या /media/uploads/... लिंक"
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    स्रोत व साभार क्रेडिट:
                  </label>
                  <input
                    type="text"
                    value={imageAttribution}
                    onChange={(e) => setImageAttribution(e.target.value)}
                    placeholder="फोटो/वीडियो स्रोत / क्रेडिट (उदा. बीएनडब्ल्यू ब्यूरो)"
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Breaking News Checkbox */}
            <div className="flex items-center gap-2.5 p-3 bg-red-50/70 border border-red-200 rounded-xl">
              <input
                type="checkbox"
                id="isBreakingCheckbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <label htmlFor="isBreakingCheckbox" className="text-xs font-bold text-red-900 cursor-pointer">
                🚨 इसे तत्काल 'राज्यव्यापी ब्रेकिंग न्यूज़' के रूप में चिह्नित करें
              </label>
            </div>

            {/* Mandatory 10-Point Self Declaration */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                संवाददाता 10-बिंदु स्व-सत्यापन घोषणा (Mandatory):
              </span>
              <div className="space-y-1.5 text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkSource}
                    onChange={(e) => setCheckSource(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600"
                  />
                  <span>1. सूचना प्रत्यक्ष स्थल अथवा प्रत्यक्षदर्शी स्रोतों से जांची गई है।</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkOfficial}
                    onChange={(e) => setCheckOfficial(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600"
                  />
                  <span>2. प्रशासनिक पक्ष (कलेक्टर/पुलिस/तहसीलदार) को सूचना से अवगत करा दिया गया है।</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkMediaAuthentic}
                    onChange={(e) => setCheckMediaAuthentic(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600"
                  />
                  <span>3. फोटो व वीडियो आज के घटना स्थल के वास्तविक हैं, कोई भ्रामक फुटेज नहीं।</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkHarmonious}
                    onChange={(e) => setCheckHarmonious(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600"
                  />
                  <span>4. रिपोर्ट किसी भी प्रकार की धार्मिक अथवा सामाजिक वैमनस्यता को बढ़ावा नहीं देती।</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!checkSource || !checkOfficial || !checkMediaAuthentic || !checkHarmonious}
              className="w-full py-3 bg-[#ED1727] hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>संपादकीय समीक्षा हेतु प्रेषित करें (Submit for Desk Review)</span>
            </button>
          </form>
        )}

        {/* TAB 2: MY STORIES & DRAFT TRACKING */}
        {activeTab === 'my_stories' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                आपके द्वारा सबमिट की गई खबरें व वर्तमान स्थिति:
              </h2>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {whatsappQuota && (
                  <div
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 mr-1 ${
                      whatsappQuota.remaining <= 0
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span>व्हाट्सएप कार्ड: {whatsappQuota.remaining}/{whatsappQuota.maxDaily} शेष</span>
                  </div>
                )}
                {['ALL', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'PUBLISHED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'सभी'
                      : st === 'PENDING_REVIEW'
                      ? 'कतार में'
                      : st === 'REVISION_REQUESTED'
                      ? 'संशोधन'
                      : 'प्रकाशित'}
                  </button>
                ))}
              </div>
            </div>

            {filteredDrafts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">इस फ़िल्टर में कोई खबर उपलब्ध नहीं है।</p>
              </div>
            ) : (
              filteredDrafts.map((draft) => {
                const getStatusBadge = () => {
                  switch (draft.status) {
                    case 'PUBLISHED':
                      return { text: 'प्रकाशित (LIVE)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                    case 'UNDER_REVIEW':
                      return { text: 'समीक्षाधीन (Under Review)', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
                    case 'REVISION_REQUESTED':
                      return { text: 'संशोधन अपेक्षित', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
                    default:
                      return { text: 'डेस्क कतार में (Pending)', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
                  }
                };

                const badge = getStatusBadge();

                return (
                  <div
                    key={draft.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {draft.districtName} • {draft.categoryName}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {draft.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {draft.content}
                    </p>

                    {draft.status === 'REVISION_REQUESTED' && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>संपादकीय निर्देश:</strong>{' '}
                          {draft.summary || 'कृपया संबंधित प्रशासनिक अधिकारी का पक्ष शामिल करें।'}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>दर्ज समय: {draft.createdAt}</span>
                      {draft.isBreaking && (
                        <span className="text-red-600 font-bold">🚨 ब्रेकिंग टैग</span>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedStoryForClipping(draft)}
                        className="px-3 py-1.5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>4:5 कतरन एवं सोशल कार्ड</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              केंद्रीय डेस्क द्वारा आवंटित प्राथमिकता कवरेज
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                    अति आवश्यक (HIGH PRIORITY)
                  </span>
                  <span className="text-slate-500 font-semibold">समय सीमा: आज शाम 05:00 बजे तक</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  सीहोर व रायसेन उपार्जन केंद्रों पर किसानों के पंजीयन व स्लॉट बुकिंग की ग्राउंड रिपोर्ट
                </h4>
                <p className="text-slate-700">
                  सोसायटियों पर बायोमेट्रिक सर्वर की स्थिति और किसानों की समस्याओं पर 300 शब्दों की खबर व 2 ग्राउंड फोटोज़ भेजें।
                </p>
                <button
                  onClick={() => {
                    setActiveTab('create');
                    setHeadline(
                      'सीहोर उपार्जन केंद्रों पर किसान पंजीयन में सर्वर धीमा, कतारों में खड़े अन्नदाता...'
                    );
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700"
                >
                  इस असाइनमेंट पर खबर दर्ज करें
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                    विशेष बीट
                  </span>
                  <span className="text-slate-500 font-semibold">समय सीमा: कल दोपहर 12:00 बजे</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  भोपाल नगर निगम: स्वच्छता सर्वेक्षण 2026 नवाचार व वार्ड स्तर पर गीले-सूखे कचरे का पृथक्करण
                </h4>
                <p className="text-slate-600">
                  अपर आयुक्त स्वास्थ्य का अधिकृत पक्ष और स्थानीय नागरिकों की प्रतिक्रिया शामिल करें।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REPORTER PROFILE & COIN WALLET & DIGITAL PRESS ID */}
        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white p-5 rounded-2xl shadow-md border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={reporterProfileForm.avatar || activeReporter.avatar}
                  alt={reporterProfileForm.name}
                  className="w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-sm shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{reporterProfileForm.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                      {activeReporter.badgeNumber}
                    </span>
                  </div>
                  <p className="text-xs text-amber-200 font-medium">
                    {activeReporter.assignedDivision || 'मध्य प्रदेश ब्यूरो'} • {activeReporter.assignedDistricts.join(', ')}
                  </p>
                </div>
              </div>

              {/* Coin Counter Badge */}
              <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-right">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  कुल संचित कॉइन्स (Coin Balance)
                </span>
                <div className="text-xl font-black text-yellow-300 flex items-center justify-end gap-1.5">
                  <Coins className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <span>{reporterCoins.toLocaleString('hi-IN')}</span>
                  <span className="text-xs text-slate-300 font-normal">सिक्के</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold block">
                  नकद मूल्य: ₹{(reporterCoins / 10).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Grid 1: Coin Wallet & Payout Card + Profile Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Card 1: Coin Wallet & UPI Redemption */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>संवाददाता कॉइन वॉलेट व आय विवरण</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    10 सिक्के = ₹1.00
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-600 font-bold block">स्वीकृत खबरें</span>
                    <span className="text-base font-black text-amber-900">
                      {activeReporter.totalStoriesPublished}
                    </span>
                    <span className="text-[9px] text-amber-700 block">+50 प्रति खबर</span>
                  </div>
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-600 font-bold block">ब्रेकिंग इंसेंटिव</span>
                    <span className="text-base font-black text-red-900">12 बार</span>
                    <span className="text-[9px] text-red-700 block">+50 प्रति अलर्ट</span>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-600 font-bold block">विथड्रॉएबल कैश</span>
                    <span className="text-base font-black text-emerald-800">
                      ₹{(reporterCoins / 10).toFixed(0)}
                    </span>
                    <span className="text-[9px] text-emerald-600 block">UPI तत्काल ट्रांसफर</span>
                  </div>
                </div>

                {/* Cash Redemption Form */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                  <span className="font-bold text-slate-800 block">
                    सिक्कों का नकद भुगतान हेतु रिडेम्पशन अनुरोध:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        सिक्के की संख्या (न्यूनतम 100):
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={reporterCoins}
                        step={50}
                        value={coinWithdrawAmount}
                        onChange={(e) => setCoinWithdrawAmount(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        नकद राशि (₹):
                      </label>
                      <div className="w-full border border-slate-200 rounded p-2 text-xs bg-slate-100 font-black text-emerald-700">
                        ₹{(coinWithdrawAmount / 10).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      भुगतान प्राप्तकर्ता UPI ID:
                    </label>
                    <input
                      type="text"
                      value={reporterProfileForm.upiId}
                      onChange={(e) =>
                        setReporterProfileForm({ ...reporterProfileForm, upiId: e.target.value })
                      }
                      placeholder="username@okaxis या phone@paytm"
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-mono"
                    />
                  </div>

                  {withdrawStatus && (
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-medium">
                      {withdrawStatus}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleWithdrawCoins}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>UPI खाते में ट्रांसफर का अनुरोध भेजें</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Reporter Profile Editor */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>संवाददाता प्रोफ़ाइल सम्पादन (Edit Profile)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    सत्यापित प्रोफ़ाइल
                  </span>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">पूरा नाम (Full Name):</label>
                    <input
                      type="text"
                      value={reporterProfileForm.name}
                      onChange={(e) =>
                        setReporterProfileForm({ ...reporterProfileForm, name: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">फ़ोन (Mobile):</label>
                      <input
                        type="tel"
                        value={reporterProfileForm.phone}
                        onChange={(e) =>
                          setReporterProfileForm({ ...reporterProfileForm, phone: e.target.value })
                        }
                        className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">ईमेल (Email):</label>
                      <input
                        type="email"
                        value={reporterProfileForm.email}
                        onChange={(e) =>
                          setReporterProfileForm({ ...reporterProfileForm, email: e.target.value })
                        }
                        className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      संवाददाता परिचय / बीट (Bio):
                    </label>
                    <textarea
                      rows={2}
                      value={reporterProfileForm.bio}
                      onChange={(e) =>
                        setReporterProfileForm({ ...reporterProfileForm, bio: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      अवतार फ़ोटो लिंक (Avatar Photo URL):
                    </label>
                    <input
                      type="text"
                      value={reporterProfileForm.avatar}
                      onChange={(e) =>
                        setReporterProfileForm({ ...reporterProfileForm, avatar: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-mono text-[11px]"
                    />
                  </div>

                  {profileSaveSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>प्रोफ़ाइल विवरण सफलतापूर्वक अपडेट हो गया!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>प्रोफ़ाइल विवरण सहेजें (Save Changes)</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Section 2: Digital Press ID Card */}
            <div className="max-w-lg mx-auto space-y-4 pt-2">
              <div className="text-center pb-1">
                <h3 className="text-base font-black text-slate-900">
                  डिजिटल प्रेस पहचान पत्र (Digital Press ID Card)
                </h3>
                <p className="text-xs text-slate-500">
                  BREAKING NEWS WALA अधिकृत फील्ड संवाददाता पहचान पत्र • QR सार्वजनिक सत्यापन सहित
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-700 via-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-xl border-2 border-yellow-400 space-y-4 print:shadow-none">
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <img
                    src="/brand/logo.png"
                    alt="Logo"
                    className="h-7 w-auto object-contain bg-white p-1 rounded"
                  />
                  <div className="text-right">
                    <span className="text-[10px] text-amber-200 block uppercase font-bold tracking-wider">
                      Official Press Credential
                    </span>
                    <span className="text-xs font-bold text-yellow-300 font-mono">
                      ID: {activeReporter.badgeNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={reporterProfileForm.avatar || activeReporter.avatar}
                      alt={reporterProfileForm.name}
                      className="w-18 h-18 rounded-xl border-2 border-white object-cover shadow-sm shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-base font-black truncate">{reporterProfileForm.name}</h4>
                      <p className="text-xs text-yellow-300 font-bold">
                        {activeReporter.role === 'trusted_reporter'
                          ? 'वरिष्ठ जिला संवाददाता'
                          : 'जिला संवाददाता'}
                      </p>
                      <p className="text-[11px] text-slate-200">
                        {activeReporter.assignedDivision || 'मध्य प्रदेश'} •{' '}
                        {activeReporter.assignedDistricts.join(', ')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{reporterProfileForm.phone}</p>
                    </div>
                  </div>

                  {/* Deterministic SVG QR Code Matrix for Badge Verification */}
                  <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-inner" title={`Verify ${activeReporter.badgeNumber}`}>
                    <svg viewBox="0 0 21 21" className="w-16 h-16" shapeRendering="crispEdges">
                      <rect width="21" height="21" fill="#ffffff" />
                      {Array.from({ length: 21 }).map((_, y) =>
                        Array.from({ length: 21 }).map((__, x) => {
                          const inTopLeft = x < 7 && y < 7;
                          const inTopRight = x >= 14 && y < 7;
                          const inBottomLeft = x < 7 && y >= 14;
                          let filled = false;
                          if (inTopLeft || inTopRight || inBottomLeft) {
                            const lx = x >= 14 ? x - 14 : x;
                            const ly = y >= 14 ? y - 14 : y;
                            filled =
                              lx === 0 ||
                              lx === 6 ||
                              ly === 0 ||
                              ly === 6 ||
                              (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
                          } else {
                            const seedStr = activeReporter.badgeNumber || 'BNW';
                            const code = seedStr.charCodeAt((x * 7 + y * 13) % seedStr.length);
                            filled = ((code + x * 3 + y * 5) % 2) === 0;
                          }
                          return filled ? (
                            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0f172a" />
                          ) : null;
                        })
                      )}
                    </svg>
                  </div>
                </div>

                <div className="text-[10px] text-slate-300 border-t border-white/20 pt-2.5 flex justify-between items-center">
                  <span>जारी दिनांक: {activeReporter.joinedDate}</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    वैधता: {activeReporter.status === 'SUSPENDED' ? 'निलंबित' : 'सक्रिय (Active)'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleVerifyBadge}
                  disabled={isVerifyingBadge}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isVerifyingBadge ? 'सत्यापन जारी...' : 'QR सार्वजनिक सत्यापन जांचें'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रेस कार्ड प्रिंट / PDF सेव करें</span>
                </button>
              </div>

              {badgeVerificationResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                    badgeVerificationResult.verified
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      ब्यूरो रजिस्ट्री सत्यापन परिणाम: {badgeVerificationResult.verified ? 'वैध व सक्रिय ✓' : 'अवैध / निलंबित'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{badgeVerificationResult.checkedAt}</span>
                  </div>
                  <p>
                    <strong>बैज नंबर:</strong> {badgeVerificationResult.badgeNumber} • <strong>नाम:</strong>{' '}
                    {badgeVerificationResult.name}
                  </p>
                  <p>
                    <strong>अधिकृत क्षेत्र:</strong> {badgeVerificationResult.division} ({badgeVerificationResult.districts.join(', ')})
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: LOCAL CLASSIFIED ADS INGESTION */}
        {activeTab === 'classified_ads' && (
          <div className="space-y-6">
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-700" />
                  <span>स्थानीय वर्गीकृत विज्ञापन एवं शोक संदेश डेस्क</span>
                </h3>
                <p className="text-xs text-amber-800 mt-1">
                  ज़िला व तहसील स्तर पर स्थानीय व्यावसायिक प्रतिष्ठानों, निविदाओं एवं शोक संदेशों के विज्ञापन दर्ज करें।
                </p>
              </div>
              <span className="px-3 py-1 bg-[#ED1727] text-white text-xs font-bold rounded-lg shadow-2xs">
                अनिवार्य ASCI 'विज्ञापन' टैग युक्त
              </span>
            </div>

            {adToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{adToast}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submission Form */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>नया स्थानीय विज्ञापन दर्ज करें</span>
                </h4>

                <form onSubmit={handleSubmitClassifiedAd} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      विज्ञापनदाता / प्रतिष्ठान का नाम: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adAdvertiserName}
                      onChange={(e) => setAdAdvertiserName(e.target.value)}
                      placeholder="उदा. श्री राम मिष्ठान भंडार"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        संपर्क फोन / बिलिंग: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={adContactPhone}
                        onChange={(e) => setAdContactPhone(e.target.value)}
                        placeholder="+91 98XXXXXXXX"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">श्रेणी:</label>
                      <select
                        value={adCategory}
                        onChange={(e) => setAdCategory(e.target.value as EpaperAdCategory)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="COMMERCIAL">व्यावसायिक (Commercial)</option>
                        <option value="OBITUARY">शोक संदेश / श्रद्धांजलि</option>
                        <option value="TENDER">सार्वजनिक निविदा (Tender)</option>
                        <option value="PROPERTY">प्रॉपर्टी / रियल एस्टेट</option>
                        <option value="MATRIMONIAL">वैवाहिक (Matrimonial)</option>
                        <option value="CLASSIFIED">वर्गीकृत (Classified)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">स्लॉट प्रकार:</label>
                      <select
                        value={adSlotType}
                        onChange={(e) => setAdSlotType(e.target.value as EpaperAdSlotType)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="CLASSIFIED">वर्गीकृत बॉक्स (₹250 - 30 शब्द)</option>
                        <option value="BOTTOM_STRIP">तल स्ट्रिप विज्ञापन (₹2,500)</option>
                        <option value="QUARTER_PAGE">क्वाटर पेज विज्ञापन (₹4,500)</option>
                        <option value="VERTICAL_EAR">मास्टहेड ईयर पैनल (₹1,500)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">लक्षित जिला:</label>
                      <select
                        value={adDistrict}
                        onChange={(e) => setAdDistrict(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nameHi} ({d.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      रसीद / भुगतान वाउचर संख्या (वैकल्पिक):
                    </label>
                    <input
                      type="text"
                      value={adReceiptNumber}
                      onChange={(e) => setAdReceiptNumber(e.target.value)}
                      placeholder="उदा. RCPT-2026-081"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      विज्ञापन का मुख्य पाठ्य मैटर: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={adText}
                      onChange={(e) => setAdText(e.target.value)}
                      placeholder="अखबार में मुद्रित होने वाला पूर्ण विज्ञापन संदेश..."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adSubmitting}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {adSubmitting ? 'विज्ञापन दर्ज हो रहा है...' : 'समीक्षा हेतु विज्ञापन दर्ज करें'}
                  </button>
                </form>
              </div>

              {/* History / My Filed Ads */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <span>मेरे द्वारा दर्ज किए गए विज्ञापन ({myClassifiedAds.length})</span>
                    </h4>
                    <button
                      onClick={loadMyClassifiedAds}
                      className="text-xs text-blue-700 hover:underline font-semibold"
                    >
                      रिफ्रेश
                    </button>
                  </div>

                  {loadingMyAds ? (
                    <div className="p-8 text-center text-xs text-slate-500">लोड हो रहा है...</div>
                  ) : myClassifiedAds.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      आपने अभी तक कोई विज्ञापन दर्ज नहीं किया है।
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {myClassifiedAds.map((ad) => (
                        <div
                          key={ad.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-700">{ad.submissionNumber}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ad.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ad.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ad.status === 'APPROVED'
                                ? 'स्वीकृत (Approved)'
                                : ad.status === 'REJECTED'
                                ? 'अस्वीकृत'
                                : 'लंबित (Pending)'}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800">{ad.advertiserName}</div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{ad.text}</p>
                          <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                            <span>ज़िला: {ad.targetDistrictName || ad.targetDistrict}</span>
                            <span>राशि: ₹{ad.amount || 250}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>
                    संवाददाताओं द्वारा दर्ज विज्ञापन संपादकीय डेस्क द्वारा स्वीकृत होने के बाद ही ई-पेपर के पृष्ठ 11 (वर्गीकृत पृष्ठ) पर मुद्रित होते हैं।
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: EPAPER WORKSPACE */}
        {activeTab === 'epaper_workspace' && (
          <div className="w-full">
            <EpaperReporterWorkspace
              reporterId={activeReporter?.id || activeReporter?.badgeNumber}
              categories={categories}
              districts={districts}
            />
          </div>
        )}
      </div>

      {/* 4:5 Portrait Article Clipping & WhatsApp Card Generator Modal */}
      {selectedStoryForClipping && (
        <ReporterArticleClippingModal
          story={selectedStoryForClipping}
          reporter={activeReporter}
          quota={whatsappQuota}
          onClose={() => setSelectedStoryForClipping(null)}
          onQuotaUpdated={loadWhatsAppQuota}
        />
      )}
    </div>
  );
};
