import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Send,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import {
  CategoryItem,
  ReporterArticle,
  ReporterUser,
  TerritoryAssignment,
} from '../types';
import {
  createServerDraft,
  updateServerDraft,
  submitArticleForReview,
  directPublishArticle,
  fetchReporterCategories,
  fetchMyTerritories,
  saveLocalDraftSnapshot,
  removeLocalDraftSnapshot,
} from '../lib/api';
import { MediaUploadBox } from '../components/MediaUploadBox';

// Authoritative validation rules matching backend (RULE-NEWS-003, RULE-NEWS-004)
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const DISALLOWED_HTML_TAGS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>|<iframe\b|<embed\b|<object\b|on\w+\s*=/i;

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface NewsComposerViewProps {
  user: ReporterUser;
  editingArticle?: ReporterArticle | null;
  onNavigate: (route: string) => void;
  onSuccess: () => void;
}

export const NewsComposerView: React.FC<NewsComposerViewProps> = ({
  user,
  editingArticle,
  onNavigate,
  onSuccess,
}) => {
  const [title, setTitle] = useState(editingArticle?.title || '');
  const [subheadline, setSubheadline] = useState(editingArticle?.subheadline || '');
  const [bodyContent, setBodyContent] = useState(editingArticle?.bodyContent || '');
  const [categoryId, setCategoryId] = useState(editingArticle?.primaryCategoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(editingArticle?.subcategoryId || '');
  const [locationId, setLocationId] = useState(editingArticle?.primaryLocationId || '');
  const [featuredMediaId, setFeaturedMediaId] = useState(editingArticle?.featuredMediaId || '');
  const [featuredImageUrl, setFeaturedImageUrl] = useState(editingArticle?.featuredImageUrl || '');
  const [imageCaption, setImageCaption] = useState(editingArticle?.imageCaption || '');
  const [imageAttribution, setImageAttribution] = useState(editingArticle?.imageAttribution || '');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [territories, setTerritories] = useState<TerritoryAssignment[]>([]);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(editingArticle?.id || null);

  const [saveStatus, setSaveStatus] = useState<string>('नया आलेख');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const localDraftIdRef = useRef<string>(`draft_${Date.now()}`);

  // 1. Load Categories & Territories on Mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [cats, beats] = await Promise.all([
          fetchReporterCategories(),
          fetchMyTerritories(),
        ]);
        setCategories(cats);
        setTerritories(beats);

        if (!categoryId && cats.length > 0) {
          setCategoryId(cats[0]?.id || '');
        }
        if (!locationId && beats.length > 0) {
          setLocationId(beats[0]?.districtId || '');
        }
      } catch {
        // Fallback
      }
    }
    loadMetadata();
  }, [categoryId, locationId]);

  // 2. Autosave background timer (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (title.trim() && bodyContent.trim()) {
        saveLocalDraftSnapshot({
          localId: localDraftIdRef.current,
          serverId: currentArticleId || undefined,
          title,
          subheadline,
          bodyContent,
          primaryCategoryId: categoryId,
          primaryLocationId: locationId,
          featuredImageUrl,
          imageCaption,
          imageAttribution,
        });
        setSaveStatus(`स्थानीय ड्राफ्ट सुरक्षित (${new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })})`);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [title, subheadline, bodyContent, categoryId, locationId, featuredImageUrl, imageCaption, imageAttribution, currentArticleId]);

  // 3. Word & Character Counters and Validation Flags
  const wordCount = countWords(bodyContent);
  const charCount = bodyContent.length;
  const isHeadlineValid =
    title.trim().length >= 15 &&
    title.trim().length <= 150 &&
    DEVANAGARI_REGEX.test(title.trim());
  const isBodyValid =
    (wordCount >= 50 || charCount >= 250) &&
    wordCount <= 5000 &&
    !DISALLOWED_HTML_TAGS.test(bodyContent);

  // 4. Save Draft Action (Manual)
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setErrorMessage('कृपया ड्राफ्ट सहेजने के लिए कम से कम शीर्षक दर्ज करें।');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      title: title.trim(),
      subheadline: subheadline.trim() || undefined,
      bodyContent: bodyContent.trim(),
      primaryCategoryId: categoryId,
      subcategoryId: subcategoryId || undefined,
      primaryLocationId: locationId || (territories[0]?.districtId || 'bhopal'),
      featuredMediaId: featuredMediaId || undefined,
      featuredImageUrl: featuredImageUrl || undefined,
      imageCaption: imageCaption || undefined,
      imageAttribution: imageAttribution || undefined,
    };

    try {
      if (currentArticleId) {
        await updateServerDraft(currentArticleId, payload);
      } else {
        const created = await createServerDraft(payload);
        setCurrentArticleId(created.id);
      }
      setSaveStatus(`सर्वर पर सुरक्षित (${new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })})`);
    } catch (err: any) {
      // Local fallback
      saveLocalDraftSnapshot({
        localId: localDraftIdRef.current,
        serverId: currentArticleId || undefined,
        ...payload,
      });
      setSaveStatus('ऑफ़लाइन: केवल स्थानीय डिवाइस पर सुरक्षित');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Submit for Review Confirmation (WF-CRE-03, RULE-NEWS-003, RULE-NEWS-004)
  const handleConfirmSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = bodyContent.trim();

    // Validate headline (RULE-NEWS-003)
    if (!trimmedTitle) {
      setErrorMessage('शीर्षक दर्ज करना अनिवार्य है।');
      setShowSubmitModal(false);
      return;
    }
    if (trimmedTitle.length < 15 || trimmedTitle.length > 150) {
      setErrorMessage('समाचार शीर्षक 15 से 150 अक्षरों के बीच होना अनिवार्य है (RULE-NEWS-003)।');
      setShowSubmitModal(false);
      return;
    }
    if (!DEVANAGARI_REGEX.test(trimmedTitle)) {
      setErrorMessage('समाचार शीर्षक में हिंदी (देवनागरी) अक्षर होना अनिवार्य है (RULE-NEWS-003)।');
      setShowSubmitModal(false);
      return;
    }

    // Validate subheadline if provided
    if (subheadline && subheadline.trim().length > 250) {
      setErrorMessage('उप-शीर्षक 250 अक्षरों से अधिक नहीं हो सकता।');
      setShowSubmitModal(false);
      return;
    }

    // Validate body content (RULE-NEWS-004)
    if (!trimmedBody) {
      setErrorMessage('खबर का विस्तृत विवरण (बॉडी) दर्ज करना अनिवार्य है।');
      setShowSubmitModal(false);
      return;
    }
    if (wordCount < 50 && charCount < 250) {
      setErrorMessage('खबर का विस्तृत विवरण (बॉडी) कम से कम 50 शब्दों या 250 अक्षरों का होना चाहिए (RULE-NEWS-004)।');
      setShowSubmitModal(false);
      return;
    }
    if (wordCount > 5000) {
      setErrorMessage('खबर का विवरण 5,000 शब्दों से अधिक नहीं हो सकता (RULE-NEWS-004)।');
      setShowSubmitModal(false);
      return;
    }
    if (DISALLOWED_HTML_TAGS.test(trimmedBody)) {
      setErrorMessage('खबर विवरण में अमान्य या असुरक्षित HTML टैग्स (script, iframe, style आदि) वर्जित हैं (RULE-NEWS-004)।');
      setShowSubmitModal(false);
      return;
    }

    // Validate category and beat
    if (!categoryId) {
      setErrorMessage('कृपया समाचार श्रेणी का चयन करें।');
      setShowSubmitModal(false);
      return;
    }
    if (!locationId) {
      setErrorMessage('कृपया आवंटित जिला क्षेत्र का चयन करें।');
      setShowSubmitModal(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Step A: Ensure draft is saved to server
      let articleIdToSubmit = currentArticleId;
      const payload = {
        title: trimmedTitle,
        subheadline: subheadline.trim() || undefined,
        bodyContent: trimmedBody,
        primaryCategoryId: categoryId,
        subcategoryId: subcategoryId || undefined,
        primaryLocationId: locationId,
        featuredMediaId: featuredMediaId || undefined,
        featuredImageUrl: featuredImageUrl || undefined,
        imageCaption: imageCaption || undefined,
        imageAttribution: imageAttribution || undefined,
      };

      if (!articleIdToSubmit) {
        const created = await createServerDraft(payload);
        articleIdToSubmit = created.id;
        setCurrentArticleId(created.id);
      } else {
        await updateServerDraft(articleIdToSubmit, payload);
      }

      // Step B: Transition to PENDING_REVIEW
      await submitArticleForReview(articleIdToSubmit);

      // Clean local draft
      removeLocalDraftSnapshot(localDraftIdRef.current);
      setShowSubmitModal(false);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'समीक्षा के लिए सबमिट करने में विफल।');
      setShowSubmitModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Direct Publish Action (Only for Trusted Publisher)
  const handleDirectPublish = async () => {
    if (!user.isTrustedPublisher) return;

    const trimmedTitle = title.trim();
    const trimmedBody = bodyContent.trim();

    if (trimmedTitle.length < 15 || trimmedTitle.length > 150 || !DEVANAGARI_REGEX.test(trimmedTitle)) {
      setErrorMessage('प्रकाशन हेतु मान्य हिंदी शीर्षक (15-150 अक्षर) अनिवार्य है।');
      return;
    }
    if ((wordCount < 50 && charCount < 250) || wordCount > 5000 || DISALLOWED_HTML_TAGS.test(trimmedBody)) {
      setErrorMessage('प्रकाशन हेतु न्यूनतम 50 शब्द या 250 अक्षर का वैध विवरण अनिवार्य है।');
      return;
    }

    setIsSubmitting(true);
    try {
      let targetId = currentArticleId;
      const payload = {
        title: trimmedTitle,
        subheadline: subheadline.trim() || undefined,
        bodyContent: trimmedBody,
        primaryCategoryId: categoryId,
        primaryLocationId: locationId,
        featuredImageUrl: featuredImageUrl || undefined,
      };

      if (!targetId) {
        const created = await createServerDraft(payload);
        targetId = created.id;
      } else {
        await updateServerDraft(targetId, payload);
      }

      await directPublishArticle(targetId);
      removeLocalDraftSnapshot(localDraftIdRef.current);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'सीधे प्रकाशित करने में विफल।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selected category subcategories
  const selectedCatObj = categories.find((c) => c.id === categoryId);
  const subcategoriesList = selectedCatObj?.subcategories || [];

  return (
    <div className="reporter-container">
      {/* Top Bar: Back & Autosave Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          onClick={() => onNavigate('#/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            color: '#475569',
            cursor: 'pointer',
            padding: '6px 0',
          }}
        >
          <ArrowLeft size={16} />
          <span>डैशबोर्ड</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
          <Clock size={12} color="#059669" />
          <span>{saveStatus}</span>
        </div>
      </div>

      {/* Main Composer Card */}
      <div className="reporter-card">
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✍️</span>
          <span>{editingArticle ? 'समाचार संशोधन / संपादन डेस्क' : 'रॉ स्क्रिप्ट व समाचार लेखन डेस्क'}</span>
        </h1>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#991B1B',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Category & Territory Selectors (Server Enforced) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              आवंटित जिला क्षेत्र (Authorized Beat) *
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="form-select"
            >
              {territories.length > 0 ? (
                territories.map((t) => (
                  <option key={t.districtId} value={t.districtId}>
                    📍 {t.districtNameHi} {t.divisionNameHi ? `(${t.divisionNameHi} संभाग)` : ''}
                  </option>
                ))
              ) : (
                <option value="bhopal">📍 भोपाल (मुख्यालय)</option>
              )}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">समाचार श्रेणी (Category) *</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategoryId('');
              }}
              className="form-select"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameHi}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subcategories (If Available) */}
        {subcategoriesList.length > 0 && (
          <div className="form-group">
            <label className="form-label">उप-श्रेणी (Subcategory - ऐच्छिक)</label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="form-select"
            >
              <option value="">-- सामान्य उप-श्रेणी --</option>
              {subcategoriesList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nameHi}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2. Headline Input */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              मुख्य शीर्षक (Catchy Devanagari Headline) *
            </label>
            <span style={{ fontSize: '11px', color: isHeadlineValid ? '#059669' : '#DC2626', fontWeight: 600 }}>
              {title.trim().length}/150 अक्षर (न्यूनतम 15, देवनागरी)
            </span>
          </div>
          <input
            type="text"
            placeholder="उदा. निवाड़ी कलेक्ट्रेट में पेयजल संकट को लेकर ग्रामीणों का प्रदर्शन..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            style={{ fontWeight: 700 }}
          />
        </div>

        {/* 3. Subheadline / Summary Lead */}
        <div className="form-group">
          <label className="form-label">उप-शीर्षक / संदर्भ सार (Subheadline - ऐच्छिक)</label>
          <input
            type="text"
            placeholder="उदा. अधिकारियों को सौंपा ज्ञापन, 48 घंटे में समाधान का आश्वासन..."
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            className="form-input"
            style={{ fontSize: '14px' }}
          />
        </div>

        {/* 4. Ground Media Upload */}
        <MediaUploadBox
          initialImageUrl={featuredImageUrl}
          initialCaption={imageCaption}
          initialAttribution={imageAttribution}
          onMediaAttached={(media) => {
            setFeaturedMediaId(media.mediaId);
            setFeaturedImageUrl(media.url);
            if (media.caption) setImageCaption(media.caption);
            if (media.attribution) setImageAttribution(media.attribution);
          }}
          onMediaRemoved={() => {
            setFeaturedMediaId('');
            setFeaturedImageUrl('');
            setImageCaption('');
            setImageAttribution('');
          }}
        />

        {/* 5. Article Body Textarea */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              विस्तृत समाचार विवरण (Body Content) *
            </label>
            <span style={{ fontSize: '11px', color: isBodyValid ? '#059669' : '#DC2626', fontWeight: 600 }}>
              {wordCount} शब्द • {charCount} अक्षर (न्यूनतम 50 शब्द या 250 अक्षर)
            </span>
          </div>
          <textarea
            rows={8}
            placeholder="पूरी खबर का विवरण यहाँ लिखें: घटना क्या हुई, कब हुई, मुख्य बयान और प्रशासनिक प्रतिक्रिया..."
            value={bodyContent}
            onChange={(e) => setBodyContent(e.target.value)}
            className="form-textarea"
            style={{ lineHeight: '1.85' }}
          />
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <Save size={16} />
            <span>ड्राफ्ट सहेजें</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ flex: 2 }}
          >
            <Send size={16} />
            <span>समीक्षा के लिए भेजें</span>
          </button>

          {/* Conditional Direct Publish (Trusted Reporter Only) */}
          {user.isTrustedPublisher && (
            <button
              type="button"
              onClick={handleDirectPublish}
              disabled={isSubmitting}
              className="btn btn-success"
              style={{ flex: 1 }}
              title="सीधे प्रकाशित करें (अधिकृत प्रकाशक)"
            >
              <Zap size={16} />
              <span>सीधे प्रकाशित करें</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal (WF-CRE-03) */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 60,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
              संपादकीय समीक्षा हेतु पुष्टि
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '16px' }}>
              क्या आप यह खबर संपादकीय समीक्षा के लिए भेजना चाहते हैं? सबमिट होने के बाद न्यूज़रूम डेस्क द्वारा अनुमोदन होने तक आलेख लॉक रहेगा।
            </p>

            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px', fontSize: '12px' }}>
              <p style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                {title}
              </p>
              <p style={{ color: '#64748B' }}>
                कुल शब्द: {wordCount} • क्षेत्र: {territories.find((t) => t.districtId === locationId)?.districtNameHi || locationId}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px', minHeight: '40px' }}
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px', minHeight: '40px' }}
              >
                <CheckCircle size={15} />
                <span>हाँ, सबमिट करें</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsComposerView;

