import React, { useState } from 'react';
import {
  Sparkles,
  Heading,
  FileText,
  ShieldAlert,
  Languages,
  Tags,
  Copy,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  requestAiHeadlines,
  requestAiStructuring,
  requestAiFactCheck,
  requestAiSummarize,
  requestAiCategorize,
} from '../lib/api';
import { EditorialArticle } from '../types';

interface AiAssistantPanelProps {
  article: EditorialArticle;
  isOpen: boolean;
  onClose: () => void;
  onApplyHeadline?: (newHeadline: string) => void;
  onApplyStandfirst?: (newStandfirst: string) => void;
}

type AssistantTab = 'headlines' | 'structure' | 'factcheck' | 'summarize' | 'categorize';

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  article,
  isOpen,
  onClose,
  onApplyHeadline,
  onApplyStandfirst,
}) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>('headlines');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Results State
  const [headlinesResult, setHeadlinesResult] = useState<{
    options: Array<{ headline: string; subheadline?: string; tone: string; characterCount: number }>;
    suggestedTags: string[];
  } | null>(null);

  const [structuringResult, setStructuringResult] = useState<{
    suggestedHeadline: string;
    leadStandfirst: string;
    bodyParagraphs: string[];
    contextBackground: string;
    missingInformationNotices: string[];
  } | null>(null);

  const [factCheckResult, setFactCheckResult] = useState<{
    claimsIdentified: Array<{
      claimText: string;
      verificationDimension: string;
      status: string;
      riskLevel: string;
      editorialAdvice: string;
    }>;
    overallAdvisory: string;
    potentialContradictions: string[];
    missingEvidenceNotes: string[];
    humanReviewChecklist: string[];
  } | null>(null);

  const [summarizeResult, setSummarizeResult] = useState<{
    resultText: string;
    keyEntities: string[];
    wordCount: number;
  } | null>(null);

  const [categorizeResult, setCategorizeResult] = useState<{
    suggestedCategory: string;
    suggestedDistrict?: string;
    confidenceScore: number;
    keywords: string[];
  } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, indexKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(indexKey);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFetchHeadlines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestAiHeadlines({
        articleBody: article.bodyContent || '',
        category: article.primaryCategoryNameHi || 'सामान्य',
        district: article.primaryLocationNameHi || 'मध्यप्रदेश',
      });
      setHeadlinesResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'शीर्षक सुझाव लोड करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchStructuring = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestAiStructuring({
        rawNotes: article.bodyContent || '',
        category: article.primaryCategoryNameHi || 'सामान्य',
        district: article.primaryLocationNameHi || 'मध्यप्रदेश',
      });
      setStructuringResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'आलेख संरचना लोड करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchFactCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestAiFactCheck({
        articleTitle: article.title,
        articleBody: article.bodyContent || '',
        sourcesClaimed: ['ग्राउंड रिपोर्टर'],
        district: article.primaryLocationNameHi || 'मध्यप्रदेश',
      });
      setFactCheckResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'तथ्य-जांच विश्लेषण लोड करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSummarize = async (mode: 'short_summary' | 'en_to_hi') => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestAiSummarize({
        text: article.bodyContent || '',
        mode,
      });
      setSummarizeResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'सारांश लोड करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCategorize = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestAiCategorize({
        title: article.title,
        body: article.bodyContent || '',
      });
      setCategorizeResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'वर्गीकरण सुझाव लोड करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 120 }}>
      <div className="modal-card" style={{ maxWidth: 840, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--blue)',
            padding: '16px 20px',
            background: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--midnight)' }}>
                AI संपादकीय सह-पायलट (Editorial Assistant)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                मानवीय संपादकीय नियंत्रण में निष्पक्ष एवं तथ्यपरक विश्लेषण
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Strip */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFF',
            padding: '0 16px',
            gap: 4,
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => {
              setActiveTab('headlines');
              if (!headlinesResult) handleFetchHeadlines();
            }}
            className={`tab-btn ${activeTab === 'headlines' ? 'active' : ''}`}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'headlines' ? '3px solid var(--blue)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'headlines' ? 'var(--blue)' : '#64748B',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Heading size={16} />
            शीर्षक सुझाव
          </button>

          <button
            onClick={() => {
              setActiveTab('structure');
              if (!structuringResult) handleFetchStructuring();
            }}
            className={`tab-btn ${activeTab === 'structure' ? 'active' : ''}`}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'structure' ? '3px solid var(--blue)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'structure' ? 'var(--blue)' : '#64748B',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileText size={16} />
            आलेख संरचना
          </button>

          <button
            onClick={() => {
              setActiveTab('factcheck');
              if (!factCheckResult) handleFetchFactCheck();
            }}
            className={`tab-btn ${activeTab === 'factcheck' ? 'active' : ''}`}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'factcheck' ? '3px solid var(--blue)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'factcheck' ? 'var(--blue)' : '#64748B',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldAlert size={16} />
            तथ्य-जांच सलाह
          </button>

          <button
            onClick={() => {
              setActiveTab('summarize');
              if (!summarizeResult) handleFetchSummarize('short_summary');
            }}
            className={`tab-btn ${activeTab === 'summarize' ? 'active' : ''}`}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'summarize' ? '3px solid var(--blue)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'summarize' ? 'var(--blue)' : '#64748B',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Languages size={16} />
            अनुवाद व सारांश
          </button>

          <button
            onClick={() => {
              setActiveTab('categorize');
              if (!categorizeResult) handleFetchCategorize();
            }}
            className={`tab-btn ${activeTab === 'categorize' ? 'active' : ''}`}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'categorize' ? '3px solid var(--blue)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'categorize' ? 'var(--blue)' : '#64748B',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Tags size={16} />
            श्रेणी व टैग्स
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#F8FAFC' }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw size={28} className="spin" style={{ color: 'var(--blue)' }} />
              <div style={{ marginTop: 12, fontWeight: 600, color: '#64748B' }}>
                AI मॉडल विश्लेषण प्रगति पर है...
              </div>
            </div>
          )}

          {/* TAB 1: HEADLINES */}
          {!loading && activeTab === 'headlines' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  मूल शीर्षक: <strong>{article.title}</strong>
                </span>
                <button onClick={handleFetchHeadlines} className="btn btn-sm btn-outline">
                  पुनः उत्पन्न करें
                </button>
              </div>

              {headlinesResult?.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {headlinesResult.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="card"
                      style={{
                        padding: 16,
                        borderLeft: '4px solid var(--blue)',
                        background: '#FFF',
                        position: 'relative',
                      }}
                    >
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--midnight)', lineHeight: 1.6 }}>
                        {opt.headline}
                      </div>
                      {opt.subheadline && (
                        <div style={{ fontSize: '0.9rem', color: '#64748B', marginTop: 4 }}>{opt.subheadline}</div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          वर्ण संख्या: {opt.characterCount} • शैली: {opt.tone}
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => copyToClipboard(opt.headline, `h_${idx}`)}
                            className="btn btn-sm btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {copiedIndex === `h_${idx}` ? <Check size={12} /> : <Copy size={12} />}
                            {copiedIndex === `h_${idx}` ? 'कॉपी हुआ' : 'कॉपी करें'}
                          </button>
                          {onApplyHeadline && (
                            <button
                              onClick={() => onApplyHeadline(opt.headline)}
                              className="btn btn-sm btn-primary"
                            >
                              उपयोग करें
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

          {/* TAB 2: STRUCTURING */}
          {!loading && activeTab === 'structure' && structuringResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ padding: 16, background: '#FFF' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748B' }}>सुझावित लीड स्टैंडफर्स्ट:</div>
                <p style={{ margin: '6px 0 0 0', fontWeight: 600, color: 'var(--midnight)', lineHeight: 1.6 }}>
                  {structuringResult.leadStandfirst}
                </p>
                {onApplyStandfirst && (
                  <button
                    onClick={() => onApplyStandfirst(structuringResult.leadStandfirst)}
                    className="btn btn-sm btn-outline"
                    style={{ marginTop: 8 }}
                  >
                    स्टैंडफर्स्ट में जोड़ें
                  </button>
                )}
              </div>

              <div className="card" style={{ padding: 16, background: '#FFF' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748B', marginBottom: 8 }}>
                  अनुशंसित पैराग्राफ़ संरचना:
                </div>
                {structuringResult.bodyParagraphs.map((para, i) => (
                  <p key={i} style={{ margin: '0 0 10px 0', lineHeight: 1.7, color: '#334155' }}>
                    {para}
                  </p>
                ))}
              </div>

              {structuringResult.missingInformationNotices.length > 0 && (
                <div className="card" style={{ padding: 16, background: '#FFFBEB', borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={16} />
                    संपादकीय सूचना: छूटी हुई जानकारी
                  </div>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: 20, color: '#B45309', fontSize: '0.85rem' }}>
                    {structuringResult.missingInformationNotices.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FACT-CHECK ASSISTANCE */}
          {!loading && activeTab === 'factcheck' && factCheckResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  padding: 12,
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  color: '#991B1B',
                  lineHeight: 1.6,
                }}
              >
                <strong>संपादकीय चेतावनी:</strong> यह स्वचालित तथ्य-जांच सहायक केवल दावों की पहचान करता है। AI के पास
                समाचार को अनुमोदित या प्रमाणित करने का कोई अधिकार नहीं है। अंतिम सत्यापन का दायित्व केवल मानव संपादक का है।
              </div>

              <div className="card" style={{ padding: 16, background: '#FFF' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--midnight)', marginBottom: 8 }}>
                  पहचाने गए मुख्य दावे एवं सलाह:
                </div>
                {factCheckResult.claimsIdentified.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      background: '#F8FAFC',
                      borderRadius: 6,
                      marginBottom: 8,
                      borderLeft: `3px solid ${c.riskLevel === 'HIGH' ? '#EF4444' : '#3B82F6'}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{c.claimText}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                      आयाम: {c.verificationDimension} | जोखिम: {c.riskLevel}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: 6, fontStyle: 'italic' }}>
                      सलाह: {c.editorialAdvice}
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 16, background: '#FFF' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748B', marginBottom: 6 }}>
                  मानवीय समीक्षा हेतु चेकलिस्ट:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: '0.85rem', lineHeight: 1.8 }}>
                  {factCheckResult.humanReviewChecklist.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: SUMMARIZE & TRANSLATE */}
          {!loading && activeTab === 'summarize' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button
                  onClick={() => handleFetchSummarize('short_summary')}
                  className="btn btn-sm btn-outline"
                >
                  संक्षिप्त सारांश (Short Summary)
                </button>
                <button
                  onClick={() => handleFetchSummarize('en_to_hi')}
                  className="btn btn-sm btn-outline"
                >
                  हिंदी अनुवाद (English to Hindi)
                </button>
              </div>

              {summarizeResult && (
                <div className="card" style={{ padding: 16, background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      शब्द संख्या: {summarizeResult.wordCount}
                    </span>
                    <button
                      onClick={() => copyToClipboard(summarizeResult.resultText, 'sum_copy')}
                      className="btn btn-sm btn-outline"
                    >
                      {copiedIndex === 'sum_copy' ? 'कॉपी हुआ' : 'कॉपी करें'}
                    </button>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.8, color: '#334155' }}>{summarizeResult.resultText}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CATEGORIZE */}
          {!loading && activeTab === 'categorize' && (
            <div>
              <button onClick={handleFetchCategorize} className="btn btn-sm btn-primary" style={{ marginBottom: 14 }}>
                वर्गीकरण विश्लेषण चलाएं
              </button>

              {categorizeResult && (
                <div className="card" style={{ padding: 16, background: '#FFF' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--midnight)', marginBottom: 12 }}>
                    अनुशंसित श्रेणी: <strong>{categorizeResult.suggestedCategory}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: 12 }}>
                    अनुशंसित ज़िला: <strong>{categorizeResult.suggestedDistrict || 'भोपाल'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>पहचाने गए कीवर्ड्स: </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {categorizeResult.keywords.map((kw) => (
                        <span key={kw} className="badge badge-neutral">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '12px 20px',
            background: '#FFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            AI-सहायक आलेख को कभी भी सीधे प्रकाशित नहीं करता (RULE-AI-001)
          </span>
          <button onClick={onClose} className="btn btn-outline">
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
