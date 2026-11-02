import React, { useState } from 'react';
import { RotateCcw, AlertCircle, X, Send } from 'lucide-react';

interface RevisionRequestModalProps {
  articleId: string;
  articleTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackComments: string) => Promise<void>;
}

export const REVISION_QUICK_TEMPLATES = [
  'कृपया घटना स्थल से संबंधित आधिकारिक प्रशासनिक बयान (एसपी अथवा कलेक्टर पक्ष) जोड़कर पुनः सबमिट करें।',
  'शीर्षक में प्रयुक्त दावों के समर्थन में प्रत्यक्ष साक्ष्य अथवा सरकारी आदेश का विवरण प्रदान करें।',
  'संवाददाता रिपोर्ट में दूसरे पक्ष (जिसके विरुद्ध आरोप हैं) का दृष्टिकोण शामिल करना अनिवार्य है।',
  'खबर के विस्तृत विवरण में तथ्यों का क्रम स्पष्ट करें तथा व्याकरण व देवनागरी वर्तनी सुधारें।',
];

export const RevisionRequestModal: React.FC<RevisionRequestModalProps> = ({
  articleTitle,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickTemplates = REVISION_QUICK_TEMPLATES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim().length < 10) {
      setError('संशोधन अनुरोध हेतु कम से कम 10 अक्षरों का स्पष्ट संपादकीय निर्देश अनिवार्य है।');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(feedback.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'संशोधन अनुरोध प्रेषित करने में विफल।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={20} color="#D97706" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              संशोधन अनुरोध डेस्क (Request Revisions)
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '14px', fontSize: '12px' }}>
          <span style={{ color: '#64748B' }}>संबंधित आलेख: </span>
          <strong style={{ color: '#0F172A' }}>{articleTitle}</strong>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: '6px', color: '#991B1B', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
              त्वरित संपादकीय सुझाव टेम्पलेट्स (Quick Presets):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {quickTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFeedback(tpl)}
                  style={{
                    textAlign: 'left',
                    fontSize: '11px',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                    color: '#334155',
                  }}
                >
                  📌 {tpl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                रिपोर्टर हेतु अनिवार्य सुधारात्मक निर्देश (Actionable Feedback) *
              </label>
              <span style={{ fontSize: '11px', color: feedback.trim().length >= 10 ? '#059669' : '#DC2626', fontWeight: 600 }}>
                {feedback.trim().length} अक्षर (न्यूनतम 10)
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="रिपोर्टर को बताएं कि खबर में क्या कमी है और क्या सुधार अपेक्षित है..."
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
            <button type="submit" className="btn btn-warning" disabled={isSubmitting || feedback.trim().length < 10}>
              <Send size={14} />
              <span>{isSubmitting ? 'भेजा जा रहा है...' : 'रिपोर्टर को वापस भेजें'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
