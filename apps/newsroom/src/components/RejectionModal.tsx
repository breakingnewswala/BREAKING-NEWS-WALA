import React, { useState } from 'react';
import { XCircle, AlertCircle, X, ShieldX } from 'lucide-react';

interface RejectionModalProps {
  articleId: string;
  articleTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reasonCode: string, feedbackComments: string) => Promise<void>;
}

export const REJECTION_REASON_CODES = [
  { code: 'FACTUAL_ERRORS', labelHi: 'तथ्यात्मक असत्यता अथवा गलत रिपोर्टिंग (Factual Errors)' },
  { code: 'DEFAMATION_RISK', labelHi: 'मानहानि, एकपक्षीय लांछन अथवा विधिक जोखिम (Defamation/Legal Risk)' },
  { code: 'DUPLICATE_STORY', labelHi: 'समान खबर पहले से पोर्टल पर प्रकाशित है (Duplicate Submission)' },
  { code: 'OUTSIDE_EDITORIAL_SCOPE', labelHi: 'संपादकीय दिशा-निर्देशों व आचार संहिता के विपरीत (Policy Violation)' },
  { code: 'UNVERIFIED_SOURCE', labelHi: 'अपुष्ट अफवाह, अज्ञात स्रोत अथवा फर्जी दावा (Unverified Rumor)' },
  { code: 'POOR_QUALITY', labelHi: 'अस्पष्ट विवरण, खराब गुणवत्ता अथवा गैर-जिम्मेदाराना आलेख (Poor Quality)' },
];

export const RejectionModal: React.FC<RejectionModalProps> = ({
  articleTitle,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [reasonCode, setReasonCode] = useState('FACTUAL_ERRORS');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const rejectionCategories = REJECTION_REASON_CODES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonCode) {
      setError('अस्वीकृति हेतु आधिकारिक कारण श्रेणी का चयन अनिवार्य है (RULE-EDIT-005)।');
      return;
    }
    if (feedback.trim().length < 10) {
      setError('अस्वीकृति हेतु कम से कम 10 अक्षरों का विस्तृत संपादकीय स्पष्टीकरण अनिवार्य है।');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(reasonCode, feedback.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'आलेख अस्वीकृत करने में विफल।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={20} color="#DC2626" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              समाचार अस्वीकृति डेस्क (Formal Rejection Desk)
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ backgroundColor: '#FEF2F2', padding: '10px 14px', borderRadius: '6px', border: '1px solid #FECACA', marginBottom: '14px', fontSize: '12px' }}>
          <span style={{ color: '#991B1B' }}>अस्वीकृत किया जा रहा आलेख: </span>
          <strong style={{ color: '#7F1D1D' }}>{articleTitle}</strong>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #F87171', padding: '8px 12px', borderRadius: '6px', color: '#991B1B', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
              अस्वीकृति का प्राथमिक कारण कोड (Reason Code) *
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="filter-select"
              style={{ width: '100%' }}
              required
            >
              {rejectionCategories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.labelHi}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                विस्तृत संपादकीय स्पष्टीकरण (Mandatory Explanation) *
              </label>
              <span style={{ fontSize: '11px', color: feedback.trim().length >= 10 ? '#059669' : '#DC2626', fontWeight: 600 }}>
                {feedback.trim().length} अक्षर (न्यूनतम 10)
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="अस्वीकृति का ठोस तथ्यात्मक आधार स्पष्ट करें (यह रिकॉर्ड में सुरक्षित रहेगा और रिपोर्टर को प्रेषित होगा)..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontFamily: 'inherit',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              रद्द करें
            </button>
            <button type="submit" className="btn btn-danger" disabled={isSubmitting || feedback.trim().length < 10}>
              <ShieldX size={14} />
              <span>{isSubmitting ? 'अस्वीकृत किया जा रहा है...' : 'पुष्टि करें व अस्वीकृत करें'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
