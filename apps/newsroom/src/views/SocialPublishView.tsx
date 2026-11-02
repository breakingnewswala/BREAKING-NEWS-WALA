/**
 * BREAKING NEWS WALA — Central Newsroom Social Media Publishing Desk
 * Grounded in docs/05-Workflows.md, docs/06-Business-Rules.md (RULE-SOC-001), docs/20-Integrations.md
 */

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  ShieldCheck,
  FileText,
  Image,
  Video,
  Sparkles,
} from 'lucide-react';
import {
  fetchNewsroomSocialAccounts,
  fetchNewsroomPlatformConstraints,
  fetchNewsroomSocialJobs,
  createNewsroomSocialJob,
  approveNewsroomSocialJob,
  publishNewsroomSocialJobImmediately,
  retryNewsroomSocialDelivery,
  fetchArticlesQueue,
} from '../lib/api';
import type {
  SocialPlatform,
  SocialAccountItem,
  PlatformPublishingConstraints,
  SocialPublishingJobItem,
  CreateSocialPublishingJobDto,
  EditorialArticle,
} from '../types';

export const SocialPublishView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Accounts & Constraints
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([]);
  const [constraints, setConstraints] = useState<Record<string, PlatformPublishingConstraints>>({});
  const [jobs, setJobs] = useState<SocialPublishingJobItem[]>([]);
  const [articles, setArticles] = useState<EditorialArticle[]>([]);

  // Composer Form State
  const [selectedSource, setSelectedSource] = useState<'article' | 'graphic' | 'video' | 'custom'>('article');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [postTitle, setPostTitle] = useState<string>('');
  const [masterContent, setMasterContent] = useState<string>('');
  const [articleUrl, setArticleUrl] = useState<string>('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>('');

  // Active Preview Tab
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<SocialPlatform>('x');

  // Reviewer note for approval
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [selectedJobForReview, setSelectedJobForReview] = useState<SocialPublishingJobItem | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [accs, cnsts, jbs, artsRes] = await Promise.all([
        fetchNewsroomSocialAccounts(),
        fetchNewsroomPlatformConstraints(),
        fetchNewsroomSocialJobs(),
        fetchArticlesQueue({ status: 'published', limit: 50 }),
      ]);
      setAccounts(accs);
      setConstraints(cnsts as any);
      setJobs(jbs);
      setArticles(artsRes.items);

      // Pre-select active accounts
      const activeIds = accs.filter((a: SocialAccountItem) => a.isActive).map((a: SocialAccountItem) => a.id);
      setSelectedAccountIds(activeIds);
    } catch (err: any) {
      console.warn('Failed to load social desk data:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  // Prefill from published article
  const handleSelectArticle = (artId: string) => {
    setSelectedArticleId(artId);
    const art = articles.find((a) => a.id === artId);
    if (art) {
      setPostTitle(art.title);
      const excerpt = art.excerpt || '';
      const articleSlug = art.slug || art.id;
      setMasterContent(`${art.title}\n\n${excerpt}\n\nविस्तार से पढ़ें: https://breakingnewswala.com/article/${articleSlug}`);
      setArticleUrl(`https://breakingnewswala.com/article/${articleSlug}`);
    }
  };

  const toggleAccountSelection = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((accId) => accId !== id) : [...prev, id]
    );
  };

  const handleCreateJob = async () => {
    if (!postTitle || !masterContent) {
      showNotification('कृपया शीर्षक व पोस्ट सामग्री भरें');
      return;
    }
    if (selectedAccountIds.length === 0) {
      showNotification('कृपया कम से कम एक सोशल मीडिया खाता चुनें');
      return;
    }

    try {
      const payload: CreateSocialPublishingJobDto = {
        title: postTitle,
        masterContent,
        articleId: selectedSource === 'article' ? selectedArticleId : undefined,
        articleUrl: articleUrl || undefined,
        contentSource: selectedSource,
        targetAccountIds: selectedAccountIds,
        scheduledAt: scheduledAt || undefined,
      };

      const newJob = await createNewsroomSocialJob(payload);
      showNotification(`सोशल पोस्ट कार्य #${newJob.id} सफलतापूर्वक बनाया गया (स्थिति: ${newJob.status})`);
      setJobs((prev) => [newJob, ...prev]);

      // Reset form
      setPostTitle('');
      setMasterContent('');
      setArticleUrl('');
      setSelectedArticleId('');
      setScheduledAt('');
    } catch (err: any) {
      showNotification(`त्रुटि: ${err?.message}`);
    }
  };

  const handleApproveJob = async (jobId: string) => {
    try {
      const updated = await approveNewsroomSocialJob(jobId, reviewerNotes);
      showNotification(`पोस्ट #${jobId} अनुमोदित की गई!`);
      setSelectedJobForReview(null);
      setReviewerNotes('');
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
    } catch (err: any) {
      showNotification(`अनुमोदन विफल: ${err?.message}`);
    }
  };

  const handlePublishNow = async (jobId: string) => {
    try {
      const updated = await publishNewsroomSocialJobImmediately(jobId);
      showNotification(`पोस्ट #${jobId} का प्रकाशन शुरू किया गया! (स्थिति: ${updated.status})`);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
    } catch (err: any) {
      showNotification(`प्रकाशन विफल: ${err?.message}`);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      const updatedJob = await retryNewsroomSocialDelivery(deliveryId);
      showNotification(`डिलीवरी पुनः प्रयास पूर्ण! (स्थिति: ${updatedJob.status})`);
      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    } catch (err: any) {
      showNotification(`पुनः प्रयास विफल: ${err?.message}`);
    }
  };

  // Character limit calculations for preview
  const platformLimit =
    activePreviewPlatform === 'x'
      ? 280
      : activePreviewPlatform === 'instagram'
      ? 2200
      : activePreviewPlatform === 'telegram'
      ? 4096
      : activePreviewPlatform === 'linkedin'
      ? 3000
      : activePreviewPlatform === 'youtube'
      ? 5000
      : 63206;

  const currentChars = masterContent.length;
  const isOverLimit = currentChars > platformLimit;
  const currentConstraint = constraints[activePreviewPlatform];

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', color: '#E2E8F0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Share2 size={24} style={{ color: '#E11D48' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              सोशल मीडिया वितरण डेस्क (Multi-Platform Publishing Desk)
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
            प्रकाशित समाचार, ब्रेकिंग बुलेटिन व ग्राफिक्स का मेटा (Facebook/Instagram), X, YouTube, LinkedIn एवं Telegram पर सुरक्षित वितरण
          </p>
        </div>

        <button
          onClick={loadInitialData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#1E293B',
            color: '#E2E8F0',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          रिफ्रेश
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #38BDF8',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#38BDF8',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} />
          {actionMessage}
        </div>
      )}

      {/* Top Counters Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>सक्रिय सोशल खाते</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
            {accounts.filter((a) => a.isActive).length} / {accounts.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>समीक्षाधीन सोशल पोस्ट</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B', marginTop: '4px' }}>
            {jobs.filter((j) => j.status === 'PENDING_APPROVAL').length}
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>स्वीकृत / अनुसूचित पोस्ट</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>
            {jobs.filter((j) => j.status === 'APPROVED' || j.status === 'SCHEDULED').length}
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>प्रकाशित वितरण</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#E11D48', marginTop: '4px' }}>
            {jobs.filter((j) => j.status === 'PUBLISHED').length}
          </div>
        </div>
      </div>

      {/* Main Two-Column Workspace: Composer + Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '32px' }}>
        {/* LEFT COLUMN: Composer Form */}
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: '#E11D48' }} />
            सोशल मीडिया पोस्ट कंपोज़र
          </div>

          {/* Source Selection Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { id: 'article', label: 'प्रकाशित आलेख से', icon: FileText },
              { id: 'graphic', label: 'ग्राफ़िक्स स्टूडियो से', icon: Image },
              { id: 'video', label: 'वीडियो रेंडर से', icon: Video },
              { id: 'custom', label: 'कस्टम पोस्ट', icon: Sparkles },
            ].map((src) => {
              const Icon = src.icon;
              return (
                <button
                  key={src.id}
                  onClick={() => setSelectedSource(src.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: selectedSource === src.id ? '#E11D48' : '#1E293B',
                    color: '#FFFFFF',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={13} />
                  {src.label}
                </button>
              );
            })}
          </div>

          {/* Published Article Prefill Dropdown */}
          {selectedSource === 'article' && (
            <div style={{ marginBottom: '16px', backgroundColor: '#1E293B', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                सत्यापित व प्रकाशित आलेख चुनें (RULE-SOC-001):
              </div>
              <select
                value={selectedArticleId}
                onChange={(e) => handleSelectArticle(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                }}
              >
                <option value="">-- प्रकाशित आलेख चुनें --</option>
                {articles.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.title} ({art.primaryLocationNameHi || 'MP'})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} />
                केवल पूर्णतः प्रकाशित (PUBLISHED) आलेख ही सोशल मीडिया पर वितरित किए जा सकते हैं।
              </div>
            </div>
          )}

          {/* Post Title */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              शीर्षक / संदर्भ (Headline)
            </label>
            <input
              type="text"
              placeholder="सोशल पोस्ट का मुख्य शीर्षक..."
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#FFFFFF',
                fontSize: '13.5px',
              }}
            />
          </div>

          {/* Master Content */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8' }}>
                मास्टर सामग्री व कैप्शन (Master Content & Caption)
              </label>
              <span style={{ fontSize: '11.5px', color: isOverLimit ? '#F87171' : '#94A3B8' }}>
                अक्षर संख्या: {currentChars} / {platformLimit} {isOverLimit ? '(सीमा से अधिक!)' : ''}
              </span>
            </div>
            <textarea
              rows={6}
              placeholder="सोशल मीडिया के लिए तैयार विवरण, मुख्य बिंदु, हैशटैग (#MadhyaPradesh #Bhopal #BreakingNews)..."
              value={masterContent}
              onChange={(e) => setMasterContent(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: isOverLimit ? '1px solid #F87171' : '1px solid #334155',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '13.5px',
                lineHeight: '1.5',
              }}
            />
          </div>

          {/* Article Canonical URL */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              कैनोनिकल समाचार URL
            </label>
            <input
              type="url"
              placeholder="https://breakingnewswala.com/article/..."
              value={articleUrl}
              onChange={(e) => setArticleUrl(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#FFFFFF',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Target Accounts Selection */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px', fontWeight: 600 }}>
              लक्षित सोशल मीडिया खाते (Target Accounts):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {accounts.map((acc) => {
                const isSelected = selectedAccountIds.includes(acc.id);
                return (
                  <div
                    key={acc.id}
                    onClick={() => toggleAccountSelection(acc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: isSelected ? 'rgba(225, 29, 72, 0.15)' : '#1E293B',
                      border: isSelected ? '1px solid #E11D48' : '1px solid #334155',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{acc.accountName}</div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase' }}>
                        {acc.platform} • @{acc.accountIdentifier}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748B' }}>IST (Asia/Kolkata)</span>
            </div>

            <button
              onClick={handleCreateJob}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#E11D48',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Send size={14} />
              प्रकाशन हेतु सबमिट करें
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Tabbed Multi-Platform Preview */}
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} style={{ color: '#38BDF8' }} />
            रीयल-टाइम सोशल मीडिया प्रिव्यू {currentConstraint ? `(${currentConstraint.displayName})` : ''}
          </div>

          {/* Platform Switcher Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { id: 'x', label: 'X (280)' },
              { id: 'facebook', label: 'Facebook' },
              { id: 'instagram', label: 'Instagram' },
              { id: 'youtube', label: 'YouTube' },
              { id: 'linkedin', label: 'LinkedIn' },
              { id: 'telegram', label: 'Telegram' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePreviewPlatform(p.id as SocialPlatform)}
                style={{
                  backgroundColor: activePreviewPlatform === p.id ? '#38BDF8' : '#1E293B',
                  color: activePreviewPlatform === p.id ? '#020617' : '#94A3B8',
                  fontWeight: activePreviewPlatform === p.id ? 700 : 500,
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Mock Social Card Container */}
          <div
            style={{
              backgroundColor: '#020617',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '16px',
              minHeight: '260px',
            }}
          >
            {/* Mock User Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#E11D48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: '#FFFFFF',
                }}
              >
                BNW
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  @{activePreviewPlatform === 'x' ? 'bnw_official' : 'breakingnewswalamp'} • अभी
                </div>
              </div>
            </div>

            {/* Mock Content */}
            <div
              style={{
                fontSize: '13.5px',
                color: isOverLimit ? '#F87171' : '#E2E8F0',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                marginBottom: '14px',
              }}
            >
              {masterContent || 'यहाँ आपकी पोस्ट की सामग्री लाइव दिखेगी...'}
            </div>

            {/* Mock Link / Media Card */}
            {articleUrl && (
              <div
                style={{
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#0F172A',
                }}
              >
                <div style={{ height: '90px', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '12px' }}>
                  [आलेख मुख्य फ़ोटो थंबनेल]
                </div>
                <div style={{ padding: '8px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>breakingnewswala.com</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                    {postTitle || 'समाचार शीर्षक'}
                  </div>
                </div>
              </div>
            )}

            {/* Platform Constraints Alert */}
            {isOverLimit && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#F87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={14} />
                सावधानी: यह सामग्री {activePreviewPlatform.toUpperCase()} की निर्धारित {platformLimit} अक्षर सीमा से अधिक है!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publishing Queue & Review Workspace */}
      <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: '#E11D48' }} />
          संपादकीय समीक्षा एवं प्रकाशन कतार (Editorial Review & Queue)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
              कोई सोशल प्रकाशन कार्य उपलब्ध नहीं है
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#FFFFFF' }}>{job.title}</span>
                      <span
                        style={{
                          backgroundColor:
                            job.status === 'PUBLISHED'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : job.status === 'APPROVED'
                              ? 'rgba(56, 189, 248, 0.2)'
                              : job.status === 'FAILED'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            job.status === 'PUBLISHED'
                              ? '#10B981'
                              : job.status === 'APPROVED'
                              ? '#38BDF8'
                              : job.status === 'FAILED'
                              ? '#F87171'
                              : '#F59E0B',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                      ID: {job.id} • बनाया गया: {new Date(job.createdAt).toLocaleString('hi-IN')}
                    </div>
                  </div>

                  {/* Actions depending on status */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {job.status === 'PENDING_APPROVAL' && (
                      <button
                        onClick={() => setSelectedJobForReview(job)}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        समीक्षा व अनुमोदन दें
                      </button>
                    )}

                    {(job.status === 'APPROVED' || job.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handlePublishNow(job.id)}
                        style={{
                          backgroundColor: '#E11D48',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        तुरंत प्रकाशित करें
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#CBD5E1', margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>
                  {job.masterContent}
                </p>

                {/* Per-platform delivery list */}
                {job.deliveries && job.deliveries.length > 0 && (
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {job.deliveries.map((del) => (
                      <div
                        key={del.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                          color: '#94A3B8',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#E2E8F0', textTransform: 'capitalize' }}>{del.platform}</span>
                          <span>—</span>
                          <span style={{ color: del.status === 'PUBLISHED' ? '#10B981' : del.status === 'FAILED' ? '#F87171' : '#94A3B8' }}>
                            {del.status === 'PUBLISHED' ? 'प्रकाशित' : del.status === 'FAILED' ? `विफल (${del.errorMessage})` : 'प्रक्रियाधीन'}
                          </span>
                        </div>

                        {del.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetryDelivery(del.id)}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #F87171',
                              color: '#F87171',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            पुनः प्रयास
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review & Approval Modal */}
      {selectedJobForReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '10px',
              width: '540px',
              maxWidth: '90%',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#FFFFFF', fontWeight: 600 }}>
              सोशल मीडिया पोस्ट संपादकीय अनुमोदन
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 14px' }}>
              आलेख शीर्षक: <strong style={{ color: '#FFFFFF' }}>{selectedJobForReview.title}</strong>
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                संपादकीय टिप्पणी (वैकल्पिक)
              </label>
              <textarea
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="सत्यापन टिप्पणी या संपादकीय नोट..."
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedJobForReview(null)}
                style={{
                  backgroundColor: '#1E293B',
                  color: '#94A3B8',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                रद्द करें
              </button>
              <button
                onClick={() => handleApproveJob(selectedJobForReview.id)}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                अनुमोदन प्रदान करें (Approve)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
