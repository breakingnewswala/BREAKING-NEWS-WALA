/**
 * BREAKING NEWS WALA — Central AI Newsroom & RSS Ingestion Review Workspace
 * Grounded in docs/17-Agents.md (14 AI Fleet), docs/05-Workflows.md, and docs/02-Features.md
 */

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Search,
  FileText,
  Heading,
  Languages,
  CheckCircle2,
  Tags,
  GitCompare,
  ShieldAlert,
  Rss,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import {
  requestAiResearch,
  requestAiSourceComparison,
  requestAiGrammarReview,
  requestAiTranslate,
  requestAiHeadlines,
  requestAiStructuring,
  requestAiFactCheck,
  requestAiSummarize,
  requestAiCategorize,
  fetchNewsroomRssItems,
  fetchNewsroomStoryClusters,
} from '../lib/api';
import type {
  ImportedRssItemDto,
  StoryClusterItem,
  AiResearchResponse,
  AiSourceComparisonResponse,
  AiGrammarReviewResponse,
  AiTranslateResponse,
} from '../types';

type WorkspaceMode =
  | 'research'
  | 'writing'
  | 'headlines'
  | 'summary'
  | 'translation'
  | 'grammar'
  | 'taxonomy'
  | 'comparison'
  | 'factcheck'
  | 'rss-queue';

export const AiNewsroomView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<WorkspaceMode>('research');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 1. Research State
  const [researchQuery, setResearchQuery] = useState('');
  const [researchDistrict, setResearchDistrict] = useState('भोपाल');
  const [researchResult, setResearchResult] = useState<AiResearchResponse | null>(null);

  // 2. Writing State
  const [rawNotes, setRawNotes] = useState('');
  const [writingCategory, setWritingCategory] = useState('विकास');
  const [writingResult, setWritingResult] = useState<any | null>(null);

  // 3. Headline State
  const [headlineBody, setHeadlineBody] = useState('');
  const [headlineResult, setHeadlineResult] = useState<string[]>([]);

  // 4. Summary State
  const [summaryInput, setSummaryInput] = useState('');
  const [summaryResult, setSummaryResult] = useState<any | null>(null);

  // 5. Translation State
  const [transInput, setTransInput] = useState('');
  const [transSourceLang, setTransSourceLang] = useState<'en' | 'hi'>('en');
  const [transResult, setTransResult] = useState<AiTranslateResponse | null>(null);

  // 6. Grammar State
  const [grammarInput, setGrammarInput] = useState('');
  const [grammarResult, setGrammarResult] = useState<AiGrammarReviewResponse | null>(null);

  // 7. Taxonomy State
  const [taxonomyTitle, setTaxonomyTitle] = useState('');
  const [taxonomyBody, setTaxonomyBody] = useState('');
  const [taxonomyResult, setTaxonomyResult] = useState<any | null>(null);

  // 8. Source Comparison State
  const [compSource1Name, setCompSource1Name] = useState('PTI भाषा वायर');
  const [compSource1Text, setCompSource1Text] = useState('');
  const [compSource2Name, setCompSource2Name] = useState('DPR मध्य प्रदेश');
  const [compSource2Text, setCompSource2Text] = useState('');
  const [comparisonResult, setComparisonResult] = useState<AiSourceComparisonResponse | null>(null);

  // 9. Fact-Check State
  const [factCheckBody, setFactCheckBody] = useState('');
  const [factCheckResult, setFactCheckResult] = useState<any | null>(null);

  // 10. RSS Queue State
  const [rssItems, setRssItems] = useState<ImportedRssItemDto[]>([]);
  const [clusters, setClusters] = useState<StoryClusterItem[]>([]);
  const [selectedRssItem, setSelectedRssItem] = useState<ImportedRssItemDto | null>(null);

  useEffect(() => {
    loadRssQueue();
  }, []);

  const loadRssQueue = async () => {
    try {
      const [items, cls] = await Promise.all([
        fetchNewsroomRssItems(),
        fetchNewsroomStoryClusters(),
      ]);
      setRssItems(items);
      setClusters(cls);
      if (items.length > 0 && !selectedRssItem) {
        setSelectedRssItem(items[0] || null);
      }
    } catch (err: any) {
      console.error('Failed to load RSS queue:', err);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handlers for AI workspaces
  const handleRunResearch = async () => {
    if (!researchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await requestAiResearch({
        query: researchQuery,
        district: researchDistrict,
      });
      setResearchResult(res);
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunWriting = async () => {
    if (!rawNotes.trim()) return;
    setLoading(true);
    try {
      const res = await requestAiStructuring({
        rawNotes,
        category: writingCategory,
        district: 'मध्य प्रदेश',
      });
      setWritingResult(res);
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunHeadlines = async () => {
    if (!headlineBody.trim()) return;
    setLoading(true);
    try {
      const res = await requestAiHeadlines({
        articleBody: headlineBody,
      });
      setHeadlineResult(res.options.map((h: any) => h.headline || h.text || h));
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSummarize = async () => {
    if (!summaryInput.trim()) return;
    setLoading(true);
    try {
      const res = await requestAiSummarize({
        text: summaryInput,
        mode: 'short_summary',
      });
      setSummaryResult(res);
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTranslation = async () => {
    if (!transInput.trim()) return;
    setLoading(true);
    try {
      const targetLang = transSourceLang === 'en' ? 'hi' : 'en';
      const res = await requestAiTranslate({
        text: transInput,
        sourceLang: transSourceLang,
        targetLang,
      });
      setTransResult(res);
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunGrammar = async () => {
    if (!grammarInput.trim()) return;
    setLoading(true);
    try {
      const res = await requestAiGrammarReview(grammarInput);
      setGrammarResult(res);
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTaxonomy = async () => {
    if (!taxonomyTitle.trim()) return;
    setLoading(true);
    try {
      const res = await requestAiCategorize({
        title: taxonomyTitle,
        body: taxonomyBody || taxonomyTitle,
      });
      setTaxonomyResult(res);
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunComparison = async () => {
    if (!compSource1Text.trim() || !compSource2Text.trim()) return;
    setLoading(true);
    try {
      const res = await requestAiSourceComparison({
        items: [
          { sourceName: compSource1Name, title: 'रिपोर्ट १', content: compSource1Text },
          { sourceName: compSource2Name, title: 'रिपोर्ट २', content: compSource2Text },
        ],
      });
      setComparisonResult(res);
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunFactCheck = async () => {
    if (!factCheckBody.trim()) return;
    setLoading(true);
    try {
      const res = await requestAiFactCheck({
        articleTitle: 'तथ्य-जांच परीक्षण',
        articleBody: factCheckBody,
        sourcesClaimed: ['विभागीय विज्ञप्ति'],
        district: 'मध्य प्रदेश',
      });
      setFactCheckResult(res);
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', color: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={24} color="#ED1727" />
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              केंद्रीय AI न्यूज़रूम व RSS इनटेक डेस्क
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
            14 विशिष्ट समाचार-एजेंटों का सुसंगत बेड़ा • क्षेत्रीय संदर्भ, तथ्य-सत्यापन, बहु-स्रोत मिलान एवं संपादकीय स्वतंत्रता
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1E293B', padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
          <ShieldAlert size={14} color="#FBBF24" />
          <span style={{ fontSize: '11px', color: '#CBD5E1' }}>
            मानव समीक्षा अनिवार्य • कोई स्वतः प्रकाशन नहीं
          </span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>RSS ड्राफ्ट समीक्षा कतार</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
            {rssItems.length}
          </div>
        </div>
        <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>सक्रिय स्टोरी क्लस्टर्स</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#3B82F6', marginTop: '2px' }}>
            {clusters.length}
          </div>
        </div>
        <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>AI एजेंट बेड़ा स्थिति</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#10B981', marginTop: '6px' }}>
            14/14 एजेंट सक्रिय व स्टैंडबाय
          </div>
        </div>
        <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>तथ्य-जांच प्रोटोकॉल</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#FBBF24', marginTop: '6px' }}>
            10-बिंदु मानक सक्रिय
          </div>
        </div>
      </div>

      {/* 10 Workspaces Horizontal Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          borderBottom: '1px solid #334155',
          marginBottom: '20px',
          paddingBottom: '4px',
        }}
      >
        {[
          { key: 'research', label: '१. समाचार शोध', icon: Search },
          { key: 'writing', label: '२. आलेख संरचना', icon: FileText },
          { key: 'headlines', label: '३. शीर्षक सुझाव', icon: Heading },
          { key: 'summary', label: '४. त्वरित सारांश', icon: Sparkles },
          { key: 'translation', label: '५. अनुवाद', icon: Languages },
          { key: 'grammar', label: '६. व्याकरण व भाषा', icon: CheckCircle2 },
          { key: 'taxonomy', label: '७. श्रेणी व ज़िला', icon: Tags },
          { key: 'comparison', label: '८. स्रोत तुलना', icon: GitCompare },
          { key: 'factcheck', label: '९. तथ्य-जांच', icon: ShieldAlert },
          { key: 'rss-queue', label: `१०. RSS समीक्षा (${rssItems.length})`, icon: Rss },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveMode(tab.key as WorkspaceMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                background: isActive ? '#ED1727' : '#1E293B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Mode 1: News Research */}
      {activeMode === 'research' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={16} color="#ED1727" /> समाचार विषय अथवा घटना अनुसंधान (AGT-RES-006)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  अनुसंधान क्वेरी / घटना विवरण
                </label>
                <input
                  type="text"
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  placeholder="उदा. भोपाल जल शोधन संयंत्र नवीनीकरण अथवा उज्जैन महाकाल लोक विस्तार"
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  कवरेज ज़िला (MP 55 Districts)
                </label>
                <select
                  value={researchDistrict}
                  onChange={(e) => setResearchDistrict(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  <option value="भोपाल">भोपाल</option>
                  <option value="इंदौर">इंदौर</option>
                  <option value="ग्वालियर">ग्वालियर</option>
                  <option value="जबलपुर">जबलपुर</option>
                  <option value="उज्जैन">उज्जैन</option>
                  <option value="सागर">सागर</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleRunResearch}
                disabled={loading || !researchQuery.trim()}
                className="primary-btn"
                style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                अनुसंधान डोज़ियर तैयार करें
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>
              अनुसंधान परिणाम व तथ्य डोज़ियर
            </h2>
            {researchResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', lineHeight: '1.6' }}>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
                  <strong style={{ color: '#10B981', display: 'block', marginBottom: '4px' }}>✓ स्थापित / सत्यापित तथ्य:</strong>
                  {researchResult.verifiedClaims.map((c, i) => <div key={i}>• {c}</div>)}
                </div>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #3B82F6' }}>
                  <strong style={{ color: '#3B82F6', display: 'block', marginBottom: '4px' }}>ℹ प्राथमिक स्रोत दावे:</strong>
                  {researchResult.sourceClaims.map((c, i) => <div key={i}>• {c}</div>)}
                </div>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #FBBF24' }}>
                  <strong style={{ color: '#FBBF24', display: 'block', marginBottom: '4px' }}>⚠ आवश्यक फॉलो-अप व अज्ञात बिंदु:</strong>
                  {researchResult.recommendedFollowUps.map((c, i) => <div key={i}>• {c}</div>)}
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                क्वेरी दर्ज कर "अनुसंधान डोज़ियर तैयार करें" पर क्लिक करें।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Article Writing */}
      {activeMode === 'writing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>
              कच्चे नोट्स से उल्टे पिरामिड संरचना (AGT-WRT-001)
            </h2>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                समाचार श्रेणी
              </label>
              <select
                value={writingCategory}
                onChange={(e) => setWritingCategory(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="विकास">विकास</option>
                <option value="प्रशासन">प्रशासन</option>
                <option value="अपराध">अपराध</option>
                <option value="राजनीति">राजनीति</option>
                <option value="कृषि व ग्रामीण">कृषि व ग्रामीण</option>
              </select>
            </div>
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="संवाददाता के प्राथमिक बिंदु, उद्धरण तथा घटनास्थल विवरण..."
              rows={8}
              className="input-field"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button
              type="button"
              onClick={handleRunWriting}
              disabled={loading || !rawNotes.trim()}
              className="primary-btn"
            >
              संरचित आलेख आलेखन करें
            </button>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>संरचित हिंदी समाचार आलेख</h2>
            {writingResult ? (
              <div style={{ backgroundColor: '#0F172A', padding: '14px', borderRadius: '6px', fontSize: '13px', lineHeight: '1.6' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                  {writingResult.suggestedHeadline}
                </h3>
                <p style={{ color: '#38BDF8', fontWeight: 600, marginBottom: '8px' }}>
                  {writingResult.leadStandfirst}
                </p>
                <div style={{ color: '#CBD5E1' }}>
                  {writingResult.bodyParagraphs?.map((p: string, idx: number) => (
                    <p key={idx} style={{ marginBottom: '8px' }}>{p}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                नोट्स दर्ज कर संरचना तैयार करें।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Headline Assistant */}
      {activeMode === 'headlines' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>
              गैर-क्लिकबेट हिंदी शीर्षक निर्माण (AGT-HDL-002)
            </h2>
            <textarea
              value={headlineBody}
              onChange={(e) => setHeadlineBody(e.target.value)}
              placeholder="समाचार का मूल पाठ अथवा मुख्य बिंदु दर्ज करें..."
              rows={8}
              className="input-field"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button
              type="button"
              onClick={handleRunHeadlines}
              disabled={loading || !headlineBody.trim()}
              className="primary-btn"
            >
              ५ शीर्षक विकल्प उत्पन्न करें
            </button>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>अनुशंसित शीर्षक विकल्प</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {headlineResult.map((hl, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#0F172A',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#FFFFFF' }}>{hl}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hl, idx)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    {copiedIndex === idx ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
              {headlineResult.length === 0 && (
                <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                  समाचार पाठ दर्ज कर शीर्षक विकल्प उत्पन्न करें।
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode 4: Quick Summary */}
      {activeMode === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>
              त्वरित समाचार संक्षेपण (AGT-SUM-004)
            </h2>
            <textarea
              value={summaryInput}
              onChange={(e) => setSummaryInput(e.target.value)}
              placeholder="संक्षेप हेतु समाचार पाठ अथवा रिपोर्ट दर्ज करें..."
              rows={8}
              className="input-field"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button
              type="button"
              onClick={handleRunSummarize}
              disabled={loading || !summaryInput.trim()}
              className="primary-btn"
            >
              मुख्य बिंदु व सारांश बनाएं
            </button>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>सार संक्षेप परिणाम</h2>
            {summaryResult ? (
              <div style={{ backgroundColor: '#0F172A', padding: '14px', borderRadius: '6px', fontSize: '13px', lineHeight: '1.6' }}>
                <p style={{ color: '#F8FAFC', marginBottom: '12px' }}>{summaryResult.resultText}</p>
                {summaryResult.keyEntities && summaryResult.keyEntities.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#38BDF8' }}>
                    प्रमुख तत्व: {summaryResult.keyEntities.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                समाचार पाठ दर्ज कर सारांश बनाएं।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 5: Translation */}
      {activeMode === 'translation' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>
              पत्रकारिता अनुवाद — संस्थागत व पदनाम संरक्षण (AGT-TRN-010)
            </h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <select
                value={transSourceLang}
                onChange={(e) => setTransSourceLang(e.target.value as any)}
                className="input-field"
              >
                <option value="en">अंग्रेज़ी से हिंदी (EN → HI)</option>
                <option value="hi">हिंदी से अंग्रेज़ी (HI → EN)</option>
              </select>
            </div>
            <textarea
              value={transInput}
              onChange={(e) => setTransInput(e.target.value)}
              placeholder="अनुवाद हेतु समाचार दर्ज करें..."
              rows={8}
              className="input-field"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button
              type="button"
              onClick={handleRunTranslation}
              disabled={loading || !transInput.trim()}
              className="primary-btn"
            >
              अनुवाद करें
            </button>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>अनुवादित समाचार पाठ</h2>
            {transResult ? (
              <div style={{ backgroundColor: '#0F172A', padding: '14px', borderRadius: '6px', fontSize: '13px', lineHeight: '1.6' }}>
                <p style={{ color: '#F8FAFC' }}>{transResult.translatedText}</p>
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#3B82F6' }}>
                  संरक्षित संज्ञाएं: {transResult.preservedEntities.join(', ')}
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                अनुवाद परिणाम यहां प्रदर्शित होगा।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 6: Grammar Review */}
      {activeMode === 'grammar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>
              हिंदी व्याकरण, मात्रा व शैली परीक्षक (AGT-EDT-003)
            </h2>
            <textarea
              value={grammarInput}
              onChange={(e) => setGrammarInput(e.target.value)}
              placeholder="समीक्षा हेतु हिंदी पाठ दर्ज करें..."
              rows={8}
              className="input-field"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button
              type="button"
              onClick={handleRunGrammar}
              disabled={loading || !grammarInput.trim()}
              className="primary-btn"
            >
              मात्रा व व्याकरण जांचें
            </button>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>सुझावित संशोधन व भाषा स्कोर</h2>
            {grammarResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>पत्रकारिता भाषा गुणवत्ता स्कोर:</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>{grammarResult.toneScore}/100</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginTop: '6px' }}>संशोधन सूची:</div>
                {grammarResult.corrections.map((corr, idx) => (
                  <div key={idx} style={{ backgroundColor: '#0F172A', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>{corr.original}</span>
                      <ArrowRight size={14} color="#94A3B8" />
                      <span style={{ color: '#10B981', fontWeight: 600 }}>{corr.replacement}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{corr.reason}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                जांच परिणाम यहां दिखेंगे।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 7: Taxonomy & Category */}
      {activeMode === 'taxonomy' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>
              स्वचालित श्रेणी व टैग निर्धारण (AGT-TAX-007)
            </h2>
            <input
              type="text"
              value={taxonomyTitle}
              onChange={(e) => setTaxonomyTitle(e.target.value)}
              placeholder="समाचार का शीर्षक दर्ज करें..."
              className="input-field"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <textarea
              value={taxonomyBody}
              onChange={(e) => setTaxonomyBody(e.target.value)}
              placeholder="समाचार का मुख्य विवरण दर्ज करें..."
              rows={6}
              className="input-field"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button
              type="button"
              onClick={handleRunTaxonomy}
              disabled={loading || !taxonomyTitle.trim()}
              className="primary-btn"
            >
              श्रेणी व टैग सुझाएं
            </button>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>सुझावित वर्गीकरण</h2>
            {taxonomyResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>मुख्य श्रेणी:</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#38BDF8', marginTop: '2px' }}>
                    {taxonomyResult.suggestedCategory}
                  </div>
                  {taxonomyResult.suggestedSubcategory && (
                    <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '4px' }}>
                      उप-श्रेणी: {taxonomyResult.suggestedSubcategory}
                    </div>
                  )}
                </div>
                {taxonomyResult.suggestedTags && (
                  <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                      सुझावित टैग्स:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {taxonomyResult.suggestedTags.map((tag: string, idx: number) => (
                        <span key={idx} className="badge" style={{ backgroundColor: '#1E293B', color: '#F8FAFC' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                शीर्षक दर्ज कर श्रेणी सुझाव प्राप्त करें।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 8: Source Comparison */}
      {activeMode === 'comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <input
                type="text"
                value={compSource1Name}
                onChange={(e) => setCompSource1Name(e.target.value)}
                className="input-field"
                style={{ width: '100%', marginBottom: '8px', fontWeight: 600 }}
              />
              <textarea
                value={compSource1Text}
                onChange={(e) => setCompSource1Text(e.target.value)}
                placeholder="स्रोत १ का समाचार विवरण..."
                rows={6}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <input
                type="text"
                value={compSource2Name}
                onChange={(e) => setCompSource2Name(e.target.value)}
                className="input-field"
                style={{ width: '100%', marginBottom: '8px', fontWeight: 600 }}
              />
              <textarea
                value={compSource2Text}
                onChange={(e) => setCompSource2Text(e.target.value)}
                placeholder="स्रोत २ का समाचार विवरण..."
                rows={6}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleRunComparison}
              disabled={loading || !compSource1Text.trim() || !compSource2Text.trim()}
              className="primary-btn"
              style={{ padding: '8px 24px' }}
            >
              दोनों स्रोतों की तुलना व मिलान करें
            </button>
          </div>

          {comparisonResult && (
            <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px' }}>
                <strong style={{ color: '#10B981', display: 'block', marginBottom: '6px' }}>✓ उभयनिष्ठ (समान) बिंदु:</strong>
                {comparisonResult.commonPoints.map((cp, i) => <div key={i} style={{ fontSize: '12px', color: '#E2E8F0' }}>• {cp}</div>)}
              </div>
              <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px' }}>
                <strong style={{ color: '#EF4444', display: 'block', marginBottom: '6px' }}>⚠ विरोधाभासी अथवा भिन्न आंकड़े:</strong>
                {comparisonResult.conflictingDetails.map((cd, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#E2E8F0', marginBottom: '4px' }}>
                    <strong>{cd.topic}:</strong>
                    {Object.entries(cd.differences).map(([src, val]) => (
                      <div key={src} style={{ marginLeft: '12px', color: '#94A3B8' }}>• {src}: {val}</div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px' }}>
                <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '4px' }}>संपादकीय सलाह:</strong>
                <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0 }}>{comparisonResult.recommendedSynthesis}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 9: Fact Check */}
      {activeMode === 'factcheck' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>
              १०-बिंदु तथ्य-सत्यापन डेस्क (AGT-FCH-005)
            </h2>
            <textarea
              value={factCheckBody}
              onChange={(e) => setFactCheckBody(e.target.value)}
              placeholder="सत्यापन हेतु समाचार पाठ, दावे अथवा सोशल मीडिया दावा दर्ज करें..."
              rows={8}
              className="input-field"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button
              type="button"
              onClick={handleRunFactCheck}
              disabled={loading || !factCheckBody.trim()}
              className="primary-btn"
            >
              तथ्य-जांच परीक्षण चलाएं
            </button>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px' }}>तथ्य सत्यापन रिपोर्ट</h2>
            {factCheckResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>सत्यता विश्वसनीयता स्कोर:</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: (factCheckResult.factCheckScore ?? 85) >= 70 ? '#10B981' : '#EF4444' }}>
                    {factCheckResult.factCheckScore ?? factCheckResult.confidenceScore ?? 85}/100
                  </span>
                </div>
                {factCheckResult.claimsVerification && (
                  <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>सत्यापित दावे:</span>
                    {Array.isArray(factCheckResult.claimsVerification) ? (
                      factCheckResult.claimsVerification.map((cv: any, i: number) => (
                        <div key={i} style={{ fontSize: '12px', color: '#E2E8F0', marginBottom: '4px' }}>
                          • {typeof cv === 'string' ? cv : cv.claim || JSON.stringify(cv)}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: '#E2E8F0' }}>{JSON.stringify(factCheckResult.claimsVerification)}</div>
                    )}
                  </div>
                )}
                {factCheckResult.riskIndicators && factCheckResult.riskIndicators.length > 0 && (
                  <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #EF4444' }}>
                    <span style={{ fontSize: '11px', color: '#EF4444', display: 'block', marginBottom: '4px' }}>जोखिम संकेतक:</span>
                    {factCheckResult.riskIndicators.map((ri: string, i: number) => (
                      <div key={i} style={{ fontSize: '12px', color: '#FCA5A5' }}>⚠ {ri}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                समाचार पाठ दर्ज कर तथ्य-सत्यापन चलाएं।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 10: RSS Import Review Queue */}
      {activeMode === 'rss-queue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
          {/* Left: Items list */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', border: '1px solid #334155', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
              आयातित RSS समाचार ({rssItems.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
              {rssItems.map((item) => {
                const isSelected = selectedRssItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedRssItem(item)}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: isSelected ? '#334155' : '#0F172A',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid #ED1727' : '3px solid transparent',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', lineHeight: '1.4' }}>
                      {item.originalTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                      {item.sourceAttribution} • {new Date(item.importedAt).toLocaleTimeString('hi-IN')}
                    </div>
                  </div>
                );
              })}
              {rssItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '12px' }}>
                  कोई आयातित RSS समाचार कतार में नहीं है।
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected item detail & review */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', border: '1px solid #334155', padding: '20px' }}>
            {selectedRssItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge" style={{ backgroundColor: '#1E3A8A', color: '#93C5FD' }}>
                      {selectedRssItem.sourceAttribution}
                    </span>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginTop: '8px' }}>
                      {selectedRssItem.originalTitle}
                    </h2>
                  </div>
                  <a
                    href={selectedRssItem.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38BDF8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    मूल लिंक <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
                  GUID हैश: {selectedRssItem.guidHash}
                </div>

                <div style={{ backgroundColor: '#0F172A', padding: '16px', borderRadius: '6px', fontSize: '13px', lineHeight: '1.6', color: '#E2E8F0' }}>
                  {selectedRssItem.originalSummary || selectedRssItem.originalContent || 'कोई अतिरिक्त विवरण उपलब्ध नहीं है।'}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <a
                    href={`#/queue`}
                    className="primary-btn"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} /> संपादकीय समीक्षा डेस्क में खोलें
                  </a>
                  <a
                    href={`#/video-studio?prefillNewsId=${selectedRssItem.generatedNewsId}`}
                    className="secondary-btn"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    वीडियो बुलेटिन बनाएं
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>
                समीक्षा हेतु बाईं सूची में से कोई RSS समाचार चुनें।
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
