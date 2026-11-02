import React, { useState } from 'react';
import { Edit3, AlertCircle, X, Save, Zap } from 'lucide-react';
import { CategoryItem, DistrictItem, EditorialArticle } from '../types';

interface ArticleEditorModalProps {
  article: EditorialArticle;
  categories: CategoryItem[];
  districts: DistrictItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    subheadline?: string;
    bodyContent: string;
    primaryCategoryId: string;
    primaryLocationId: string;
    isBreaking?: boolean;
    revisionSummary: string;
  }) => Promise<void>;
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const DISALLOWED_HTML_TAGS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>|<iframe\b|<embed\b|<object\b|on\w+\s*=/i;

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  article,
  categories,
  districts,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(article.title);
  const [subheadline, setSubheadline] = useState(article.subheadline || '');
  const [bodyContent, setBodyContent] = useState(article.bodyContent || '');
  const [categoryId, setCategoryId] = useState(article.primaryCategoryId);
  const [locationId, setLocationId] = useState(article.primaryLocationId);
  const [isBreaking, setIsBreaking] = useState(article.isBreaking || false);
  const [revisionSummary, setRevisionSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const countWords = (text: string) => (text ? text.trim().split(/\s+/).filter(Boolean).length : 0);
  const words = countWords(bodyContent);
  const chars = bodyContent.length;
  const isHeadlineValid = title.trim().length >= 15 && title.trim().length <= 150 && DEVANAGARI_REGEX.test(title.trim());
  const isBodyValid = (words >= 50 || chars >= 250) && words <= 5000 && !DISALLOWED_HTML_TAGS.test(bodyContent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHeadlineValid) {
      setError('शीर्षक 15 से 150 अक्षरों के बीच और हिंदी देवनागरी में होना अनिवार्य है (RULE-NEWS-003)।');
      return;
    }
    if (!isBodyValid) {
      setError('खबर का विस्तृत विवरण कम से कम 50 शब्दों या 250 अक्षरों का होना चाहिए और स्क्रिप्ट टैग वर्जित हैं (RULE-NEWS-004)।');
      return;
    }
    if (!revisionSummary.trim()) {
      setError('संपादकीय संशोधन सारांश (Revision Summary) दर्ज करना अनिवार्य है ताकि ऑडिट रिकॉर्ड में दर्ज हो सके।');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        subheadline: subheadline.trim() || undefined,
        bodyContent: bodyContent.trim(),
        primaryCategoryId: categoryId,
        primaryLocationId: locationId,
        isBreaking,
        revisionSummary: revisionSummary.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'आलेख संशोधन सहेजने में विफल।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={20} color="#344FD6" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              संपादकीय डेस्क आलेख संशोधन (Desk Editor Workspace)
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: '6px', color: '#991B1B', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Category & District Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                समाचार श्रेणी (Category)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="filter-select"
                style={{ width: '100%' }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameHi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                जिला क्षेत्र (Location Beat)
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="filter-select"
                style={{ width: '100%' }}
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    📍 {d.nameHi} {d.divisionNameHi ? `(${d.divisionNameHi})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                मुख्य शीर्षक (Headline) *
              </label>
              <span style={{ fontSize: '11px', color: isHeadlineValid ? '#059669' : '#DC2626', fontWeight: 600 }}>
                {title.trim().length}/150 अक्षर (न्यूनतम 15, देवनागरी)
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="filter-input"
              style={{ width: '100%', fontWeight: 700 }}
              required
            />
          </div>

          {/* Subheadline */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
              उप-शीर्षक (Subheadline / Lead - ऐच्छिक)
            </label>
            <input
              type="text"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Body Content */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                विस्तृत आलेख विवरण (Body Content) *
              </label>
              <span style={{ fontSize: '11px', color: isBodyValid ? '#059669' : '#DC2626', fontWeight: 600 }}>
                {words} शब्द • {chars} अक्षर (न्यूनतम 50 शब्द / 250 अक्षर)
              </span>
            </div>
            <textarea
              rows={8}
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                lineHeight: 1.8,
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontFamily: 'inherit',
              }}
              required
            />
          </div>

          {/* Breaking News Flag */}
          <div style={{ marginBottom: '14px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#ED1727" />
              <div>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>ब्रेकिंग न्यूज़ फ्लैग (Breaking News Priority)</strong>
                <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                  इस आलेख को राज्यव्यापी/जिला स्तर पर ब्रेकिंग रिबन व तत्काल प्राथमिकता प्रदान करें।
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isBreaking}
              onChange={(e) => setIsBreaking(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#ED1727', cursor: 'pointer' }}
            />
          </div>

          {/* Revision Summary (Mandatory for audit trail) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
              संशोधन सारांश टिप्पणी (Revision Summary for Audit Trail) *
            </label>
            <input
              type="text"
              placeholder="उदा. वर्तनी सुधार, पुलिस आधिकारिक बयान जोड़ा गया, शीर्षक अधिक संतुलित किया गया..."
              value={revisionSummary}
              onChange={(e) => setRevisionSummary(e.target.value)}
              className="filter-input"
              style={{ width: '100%' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              रद्द करें
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isHeadlineValid || !isBodyValid || !revisionSummary.trim()}>
              <Save size={14} />
              <span>{isSubmitting ? 'सहेजा जा रहा है...' : 'संपादकीय संशोधन सुरक्षित करें'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

