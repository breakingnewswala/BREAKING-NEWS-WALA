import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Edit3,
  AlertTriangle,
  History,
  FileText,
  Camera,
  CheckSquare,
  Clock,
  User,
  MapPin,
  Tag,
  AlertCircle,
  Zap,
  Sparkles,
  Palette,
  Video,
} from 'lucide-react';
import {
  CategoryItem,
  DistrictItem,
  EditorialArticle,
  EditorialReviewRecord,
  ArticleRevisionRecord,
  EditorialUser,
} from '../types';
import {
  fetchArticleById,
  fetchArticleReviews,
  fetchArticleRevisions,
  claimArticle,
  approveArticle,
  requestRevision,
  rejectArticle,
  retractArticle,
  updateArticleByEditor,
  fetchCategories,
  fetchDistricts,
} from '../lib/api';
import { FactCheckWorkspace } from '../components/FactCheckWorkspace';
import { RevisionRequestModal } from '../components/RevisionRequestModal';
import { RejectionModal } from '../components/RejectionModal';
import { ArticleEditorModal } from '../components/ArticleEditorModal';
import { AiAssistantPanel } from '../components/AiAssistantPanel';

interface ArticleWorkspaceViewProps {
  articleId: string;
  user: EditorialUser;
  onBack: () => void;
  onRefreshList?: () => void;
}

export const ArticleWorkspaceView: React.FC<ArticleWorkspaceViewProps> = ({
  articleId,
  user,
  onBack,
  onRefreshList,
}) => {
  const [article, setArticle] = useState<EditorialArticle | null>(null);
  const [reviews, setReviews] = useState<EditorialReviewRecord[]>([]);
  const [revisions, setRevisions] = useState<ArticleRevisionRecord[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);

  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'factcheck' | 'history'>('content');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  // Fact-check state
  const [factCheckComplete, setFactCheckComplete] = useState(false);
  const [_factCheckNotes, setFactCheckNotes] = useState('');

  const loadArticleData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [art, revs, revsn, cats, dists] = await Promise.all([
        fetchArticleById(articleId),
        fetchArticleReviews(articleId),
        fetchArticleRevisions(articleId),
        fetchCategories(),
        fetchDistricts(),
      ]);

      if (!art) {
        setErrorMessage('आलेख नहीं मिला अथवा आपको इसे देखने की अनुमति नहीं है।');
      } else {
        setArticle(art);
        setReviews(revs);
        setRevisions(revsn);
        setCategories(cats);
        setDistricts(dists);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'आलेख डेटा लोड करने में त्रुटि।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticleData();
  }, [articleId]);

  // 1. Claim Action
  const handleClaim = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await claimArticle(articleId);
      setArticle(updated);
      setSuccessMessage('आलेख आपके द्वारा समीक्षा हेतु सफलतापूर्वक क्लेम कर लिया गया है।');
      const revs = await fetchArticleReviews(articleId);
      setReviews(revs);
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setErrorMessage(err.message || 'क्लेम कार्रवाई विफल रही।');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Approve & Publish Action
  const handleApprove = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    setShowApproveConfirm(false);
    try {
      const updated = await approveArticle(articleId);
      setArticle(updated);
      setSuccessMessage('आलेख को अनुमोदित कर पब्लिक पोर्टल पर प्रकाशित कर दिया गया है।');
      const revs = await fetchArticleReviews(articleId);
      setReviews(revs);
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setErrorMessage(err.message || 'अनुमोदन व प्रकाशन विफल रहा।');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Request Revisions Action
  const handleRevisionSubmit = async (feedbackComments: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await requestRevision(articleId, feedbackComments);
      setArticle(updated);
      setSuccessMessage('संशोधन अनुरोध रिपोर्टर को सफलतापूर्वक प्रेषित कर दिया गया है।');
      const revs = await fetchArticleReviews(articleId);
      setReviews(revs);
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setErrorMessage(err.message || 'संशोधन अनुरोध विफल रहा।');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Reject Action
  const handleRejectSubmit = async (reasonCode: string, feedbackComments: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await rejectArticle(articleId, reasonCode, feedbackComments);
      setArticle(updated);
      setSuccessMessage('आलेख को आधिकारिक कारण सहित अस्वीकृत कर दिया गया है।');
      const revs = await fetchArticleReviews(articleId);
      setReviews(revs);
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setErrorMessage(err.message || 'अस्वीकृति कार्रवाई विफल रही।');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Retract Action
  const handleRetract = async () => {
    if (!confirm('क्या आप सुनिश्चित हैं कि इस प्रकाशित आलेख को तत्काल वापस (Retract) लेना चाहते हैं?')) {
      return;
    }
    setActionLoading(true);
    try {
      const updated = await retractArticle(articleId, 'संपादकीय आपातकालीन वापसी');
      setArticle(updated);
      setSuccessMessage('आलेख को पब्लिक पोर्टल से वापस ले लिया गया है।');
      const revs = await fetchArticleReviews(articleId);
      setReviews(revs);
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setErrorMessage(err.message || 'वापसी विफल रही।');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Save Edits Action
  const handleSaveEdits = async (payload: any) => {
    setActionLoading(true);
    try {
      const updated = await updateArticleByEditor(articleId, payload);
      setArticle(updated);
      setSuccessMessage('संपादकीय संशोधन सुरक्षित कर नया रिवीजन संस्करण दर्ज किया गया।');
      const [revs, revsn] = await Promise.all([
        fetchArticleReviews(articleId),
        fetchArticleRevisions(articleId),
      ]);
      setReviews(revs);
      setRevisions(revsn);
    } catch (err: any) {
      setErrorMessage(err.message || 'संशोधन सुरक्षित करने में विफल।');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="newsroom-content" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontSize: '13px', color: '#64748B' }}>आलेख विवरण व संपादकीय इतिहास लोड हो रहा है...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="newsroom-content">
        <button type="button" onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={14} />
          <span>कतार पर वापस जाएं</span>
        </button>
        <div style={{ backgroundColor: '#FEF2F2', padding: '20px', borderRadius: '8px', color: '#991B1B' }}>
          {errorMessage || 'आलेख अनुपलब्ध है।'}
        </div>
      </div>
    );
  }

  const wordCount = article.bodyContent ? article.bodyContent.trim().split(/\s+/).filter(Boolean).length : 0;
  const isClaimedByOther = article.status === 'under_review' && article.lastEditorId && article.lastEditorId !== user.id;

  return (
    <div className="newsroom-content">
      {/* Top Bar: Back & Main Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <button type="button" onClick={onBack} className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} />
          <span>समीक्षा कतार</span>
        </button>

        {/* Action Button Row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Claim Action */}
          {article.status === 'pending_review' && (
            <button
              type="button"
              onClick={handleClaim}
              disabled={actionLoading}
              className="btn btn-primary"
            >
              <ShieldCheck size={16} />
              <span>समीक्षा हेतु क्लेम करें</span>
            </button>
          )}

          {/* Under Review Actions */}
          {article.status === 'under_review' && (
            <>
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{
                  borderColor: 'var(--blue)',
                  color: 'var(--blue)',
                  backgroundColor: '#EFF6FF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={15} />
                <span>AI संपादकीय सह-पायलट</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = `#/studio?prefillNewsId=${encodeURIComponent(article.id)}`;
                }}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{
                  borderColor: '#8B5CF6',
                  color: '#8B5CF6',
                  backgroundColor: '#F5F3FF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                title="इस समाचार का थंबनेल या सोशल मीडिया ग्राफ़िक स्टूडियो में बनाएं"
              >
                <Palette size={15} />
                <span>स्टूडियो में खोलें</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = `#/video-studio?prefillNewsId=${encodeURIComponent(article.id)}`;
                }}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{
                  borderColor: '#ED1727',
                  color: '#ED1727',
                  backgroundColor: '#FEF2F2',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                title="इस समाचार से स्वचालित वीडियो रील / बुलेटिन बनाएं"
              >
                <Video size={15} />
                <span>वीडियो बनाएं</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEditorModal(true)}
                disabled={actionLoading}
                className="btn btn-secondary"
              >
                <Edit3 size={15} />
                <span>आलेख संपादित करें</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRevisionModal(true)}
                disabled={actionLoading}
                className="btn btn-warning"
              >
                <RotateCcw size={15} />
                <span>संशोधन अनुरोध</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRejectionModal(true)}
                disabled={actionLoading}
                className="btn btn-danger"
              >
                <XCircle size={15} />
                <span>अस्वीकार करें</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApproveConfirm(true)}
                disabled={actionLoading}
                className="btn btn-success"
              >
                <CheckCircle2 size={16} />
                <span>अनुमोदन व प्रकाशित करें</span>
              </button>
            </>
          )}

          {/* Published Story Actions */}
          {article.status === 'published' && (
            <>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = `#/studio?prefillNewsId=${encodeURIComponent(article.id)}`;
                }}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{
                  borderColor: '#8B5CF6',
                  color: '#8B5CF6',
                  backgroundColor: '#F5F3FF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                title="इस समाचार का थंबनेल या सोशल मीडिया ग्राफ़िक स्टूडियो में बनाएं"
              >
                <Palette size={15} />
                <span>थंबनेल / सोशल ग्राफ़िक बनाएं</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = `#/video-studio?prefillNewsId=${encodeURIComponent(article.id)}`;
                }}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{
                  borderColor: '#ED1727',
                  color: '#ED1727',
                  backgroundColor: '#FEF2F2',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                title="इस समाचार से स्वचालित वीडियो रील / बुलेटिन बनाएं"
              >
                <Video size={15} />
                <span>न्यूज़ वीडियो रील बनाएं</span>
              </button>

              <button
                type="button"
                onClick={handleRetract}
                disabled={actionLoading}
                className="btn btn-danger"
              >
                <AlertTriangle size={15} />
                <span>आपातकालीन वापसी (Retract)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: '8px', color: '#991B1B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', padding: '10px 14px', borderRadius: '8px', color: '#065F46', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Concurrency Warning Banner */}
      {isClaimedByOther && (
        <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', padding: '10px 14px', borderRadius: '8px', color: '#92400E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <AlertTriangle size={16} />
          <span>
            <strong>सावधानी:</strong> यह आलेख वर्तमान में किसी अन्य डेस्क संपादक द्वारा क्लेम किया हुआ है। समवर्ती संपादन से पूर्व सहकर्मी से समन्वय करें।
          </span>
        </div>
      )}

      {/* Article Header Summary Card */}
      <div className="newsroom-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span className={`badge badge-${article.status.replace(/_/g, '-')}`}>
            {article.status.toUpperCase()}
          </span>
          {article.isBreaking && (
            <span className="badge badge-breaking">
              <Zap size={11} /> ब्रेकिंग न्यूज़
            </span>
          )}
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            ID: {article.publicId || article.id}
          </span>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', lineHeight: 1.4, margin: '8px 0' }}>
          {article.title}
        </h1>

        {article.subheadline && (
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
            {article.subheadline}
          </p>
        )}

        {/* Metadata Dock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '12px', color: '#64748B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={13} color="#344FD6" />
            <span>संवाददाता: <strong style={{ color: '#0F172A' }}>{article.authorName || 'संवाद सूत्र'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} color="#ED1727" />
            <span>बीट जिला: <strong style={{ color: '#0F172A' }}>{article.primaryLocationNameHi || article.primaryLocationId}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={13} color="#059669" />
            <span>श्रेणी: <strong style={{ color: '#0F172A' }}>{article.primaryCategoryNameHi || article.primaryCategoryId}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            <span>सबमिशन: {new Date(article.submittedAt || article.createdAt).toLocaleString('hi-IN')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={13} />
            <span>{wordCount} शब्द • {article.bodyContent?.length || 0} अक्षर</span>
          </div>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="tab-list">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
        >
          <FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />
          <span>आलेख विस्तृत पाठ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
        >
          <Camera size={14} style={{ display: 'inline', marginRight: '6px' }} />
          <span>मीडिया व साक्ष्य समीक्षा</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('factcheck')}
          className={`tab-btn ${activeTab === 'factcheck' ? 'active' : ''}`}
        >
          <CheckSquare size={14} style={{ display: 'inline', marginRight: '6px' }} />
          <span>10-सूत्रीय तथ्य-जांच</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
        >
          <History size={14} style={{ display: 'inline', marginRight: '6px' }} />
          <span>संपादकीय इतिहास व ऑडिट ({reviews.length + revisions.length})</span>
        </button>
      </div>

      {/* Tab 1: Story Text Content */}
      {activeTab === 'content' && (
        <div className="newsroom-card">
          <h3 className="card-title">
            <FileText size={18} color="#344FD6" />
            <span>संवाददाता द्वारा दाखिल मूल खबर विवरण (Body Content)</span>
          </h3>
          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.9,
              color: '#1E293B',
              backgroundColor: '#F8FAFC',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              whiteSpace: 'pre-line',
            }}
          >
            {article.bodyContent}
          </div>
        </div>
      )}

      {/* Tab 2: Media Review */}
      {activeTab === 'media' && (
        <div className="newsroom-card">
          <h3 className="card-title">
            <Camera size={18} color="#ED1727" />
            <span>संलग्न ग्राउंड फोटोग्राफ व विजुअल साक्ष्य</span>
          </h3>

          {article.featuredImageUrl ? (
            <div style={{ maxWidth: '640px' }}>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1', backgroundColor: '#000' }}>
                <img
                  src={article.featuredImageUrl}
                  alt={article.imageCaption || 'आलेख फोटो'}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
              <div style={{ marginTop: '10px', fontSize: '13px' }}>
                <p><strong>फोटो विवरण (Caption):</strong> {article.imageCaption || 'संपादकीय कैप्शन उपलब्ध नहीं'}</p>
                <p style={{ color: '#64748B', marginTop: '2px' }}>
                  <strong>साभार (Credit/Attribution):</strong> {article.imageAttribution || article.sourceAttribution || 'संवाद सूत्र'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <Camera size={32} color="#CBD5E1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <p>इस आलेख के साथ कोई मीडिया अटैचमेंट संलग्न नहीं है।</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fact-Checking Workspace */}
      {activeTab === 'factcheck' && (
        <FactCheckWorkspace
          onVerificationChange={(allChecked, _count, notes) => {
            setFactCheckComplete(allChecked);
            setFactCheckNotes(notes);
          }}
        />
      )}

      {/* Tab 4: Editorial History & Audit Trail */}
      {activeTab === 'history' && (
        <div className="newsroom-card">
          <h3 className="card-title">
            <History size={18} color="#344FD6" />
            <span>संपादकीय समीक्षा एवं आलेख संशोधन इतिहास (Audit Trail)</span>
          </h3>

          {reviews.length === 0 && revisions.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#94A3B8', padding: '16px 0' }}>
              कोई पूर्व संपादकीय समीक्षा अथवा संशोधन रिकॉर्ड नहीं है।
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Reviews Timeline */}
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>
                      कार्रवाई: <span style={{ color: '#344FD6' }}>{rev.action}</span>
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {new Date(rev.createdAt).toLocaleString('hi-IN')}
                    </span>
                  </div>

                  {rev.reasonCode && (
                    <div style={{ fontSize: '12px', color: '#991B1B', fontWeight: 600, marginBottom: '4px' }}>
                      कारण कोड: {rev.reasonCode}
                    </div>
                  )}

                  {rev.feedbackComments && (
                    <div style={{ fontSize: '12px', color: '#334155', backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                      "{rev.feedbackComments}"
                    </div>
                  )}
                </div>
              ))}

              {/* Revisions Snapshots */}
              {revisions.map((revsn) => (
                <div
                  key={revsn.id}
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: '#1E40AF' }}>
                      रिवीजन संस्करण #{revsn.versionNumber}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {new Date(revsn.createdAt).toLocaleString('hi-IN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#1E293B', fontWeight: 600 }}>
                    संशोधित शीर्षक: {revsn.title}
                  </div>
                  {revsn.revisionSummary && (
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                      संशोधन सार: {revsn.revisionSummary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Publication */}
      {showApproveConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              आलेख अनुमोदन व लाइव प्रकाशन की पुष्टि
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '16px' }}>
              क्या आपने 10-सूत्रीय तथ्य-जांच व साक्ष्यों का परीक्षण पूर्ण कर लिया है? अनुमोदन के पश्चात यह आलेख तत्काल पब्लिक न्यूज़ पोर्टल पर प्रकाशित हो जाएगा।
            </p>

            {!factCheckComplete && (
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#92400E', marginBottom: '16px' }}>
                ⚠️ 10-सूत्रीय चेकलिस्ट के सभी बिंदु अभी मार्क नहीं हुए हैं। क्या आप फिर भी प्रकाशित करना चाहते हैं?
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowApproveConfirm(false)} className="btn btn-secondary">
                रद्द करें
              </button>
              <button type="button" onClick={handleApprove} className="btn btn-success" disabled={actionLoading}>
                <CheckCircle2 size={16} />
                <span>हाँ, लाइव प्रकाशित करें</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      <RevisionRequestModal
        articleId={article.id}
        articleTitle={article.title}
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        onSubmit={handleRevisionSubmit}
      />

      {/* Rejection Modal */}
      <RejectionModal
        articleId={article.id}
        articleTitle={article.title}
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onSubmit={handleRejectSubmit}
      />

      {/* Article Editor Modal */}
      <ArticleEditorModal
        article={article}
        categories={categories}
        districts={districts}
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        onSave={handleSaveEdits}
      />

      {/* AI Assistant Co-Pilot Panel */}
      {showAiModal && article && (
        <AiAssistantPanel
          article={article}
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          onApplyHeadline={(h) => {
            setArticle({ ...article, title: h });
            setShowAiModal(false);
          }}
          onApplyStandfirst={(s) => {
            setArticle({ ...article, subheadline: s });
            setShowAiModal(false);
          }}
        />
      )}
    </div>
  );
};
