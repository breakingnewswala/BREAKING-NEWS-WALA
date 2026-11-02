/**
 * BREAKING NEWS WALA — Admin RSS & Newsroom Automation Management View
 * Grounded in docs/11-Architecture.md (DOM-F, DOM-K) and docs/02-Features.md
 */

import React, { useState, useEffect } from 'react';
import {
  Rss,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Archive,
  Trash2,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react';
import {
  fetchAdminRssSources,
  createAdminRssSource,
  approveAdminRssSource,
  pauseAdminRssSource,
  disableAdminRssSource,
  archiveAdminRssSource,
  reEnableAdminRssSource,
  deleteAdminRssSource,
  syncAdminRssSource,
  validateAdminFeed,
  fetchAdminImportedItems,
  fetchAdminStoryClusters,
  fetchAdminRssHealth,
  fetchAdminAutomationRules,
  toggleAdminAutomationRule,
  fetchAdminAutomationLogs,
} from '../lib/api';
import type {
  RssSourceItem,
  ImportedRssItemDto,
  StoryClusterItem,
  AutomationRule,
  AutomationExecutionLog,
  FeedValidationResult,
  CreateRssSourceDto,
} from '../types';

type SubTab = 'sources' | 'validator' | 'queue' | 'rules' | 'health';

export const RssAutomationView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('sources');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<RssSourceItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Validator State
  const [testUrl, setTestUrl] = useState('');
  const [validationResult, setValidationResult] = useState<FeedValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  // Queue & Clusters State
  const [importedItems, setImportedItems] = useState<ImportedRssItemDto[]>([]);
  const [clusters, setClusters] = useState<StoryClusterItem[]>([]);

  // Automation Rules & Logs State
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationExecutionLog[]>([]);
  const [health, setHealth] = useState<any>(null);

  // Add Source Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState<CreateRssSourceDto>({
    name: '',
    feedUrl: '',
    publisherName: '',
    publisherWebsite: '',
    sourceCategory: 'governance',
    geographicCoverage: 'Madhya Pradesh',
    pollingIntervalMinutes: 30,
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srcs, items, cls, rls, lg, hl] = await Promise.all([
        fetchAdminRssSources(filterStatus),
        fetchAdminImportedItems(),
        fetchAdminStoryClusters(),
        fetchAdminAutomationRules(),
        fetchAdminAutomationLogs(),
        fetchAdminRssHealth(),
      ]);
      setSources(srcs);
      setImportedItems(items);
      setClusters(cls);
      setRules(rls);
      setLogs(lg);
      setHealth(hl);
    } catch (err: any) {
      console.error('Failed to load RSS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name || !newSource.feedUrl || !newSource.publisherName) return;

    try {
      await createAdminRssSource(newSource);
      setShowAddModal(false);
      setNewSource({
        name: '',
        feedUrl: '',
        publisherName: '',
        publisherWebsite: '',
        sourceCategory: 'governance',
        geographicCoverage: 'Madhya Pradesh',
        pollingIntervalMinutes: 30,
      });
      setActionMessage('RSS स्रोत सफलतापूर्वक जोड़ा गया (अनुमोदन लंबित)');
      await loadData();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const handleValidateFeed = async () => {
    if (!testUrl.trim()) return;
    setValidating(true);
    try {
      const res = await validateAdminFeed(testUrl.trim());
      setValidationResult(res);
    } catch (err: any) {
      alert(`फ़ीड सत्यापन विफल: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleSyncSource = async (id: string) => {
    try {
      const res = await syncAdminRssSource(id);
      setActionMessage(`सिंक पूर्ण: ${res.newDraftsCreated} नए समाचार ड्राफ्ट बने, ${res.duplicatesSkipped} डुप्लिकेट छोड़े गए`);
      await loadData();
    } catch (err: any) {
      alert(`सिंक त्रुटि: ${err.message}`);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveAdminRssSource(id);
      setActionMessage('RSS स्रोत अनुमोदित एवं सक्रिय किया गया');
      await loadData();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseAdminRssSource(id);
      setActionMessage('RSS स्रोत आयात रोका गया (Paused)');
      await loadData();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const handleDisable = async (id: string) => {
    if (!confirm('क्या आप सुनिश्चित हैं कि इस स्रोत को निष्क्रिय करना चाहते हैं? इससे तत्काल नए आयात रुक जाएंगे।')) return;
    try {
      await disableAdminRssSource(id);
      setActionMessage('RSS स्रोत निष्क्रिय व अनधिकृत किया गया (Disabled)');
      await loadData();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveAdminRssSource(id);
      setActionMessage('RSS स्रोत संग्रहीत किया गया (Archived)');
      await loadData();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const handleReEnable = async (id: string) => {
    try {
      await reEnableAdminRssSource(id);
      setActionMessage('RSS स्रोत पुनः सक्रिय किया गया');
      await loadData();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('क्या आप निश्चित रूप से इस RSS स्रोत को हटाना चाहते हैं?')) return;
    try {
      await deleteAdminRssSource(id);
      setActionMessage('RSS स्रोत हटाया गया');
      await loadData();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await toggleAdminAutomationRule(id);
      await loadData();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const filteredSources = sources.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.publisherName.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rss size={24} color="#ED1727" />
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              RSS स्रोत प्रबंधन व न्यूज़रूम ऑटोमेशन
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
            मध्य प्रदेश व राष्ट्रीय वायर समाचारों का प्राधिकृत अंतर्ग्रहण, SSRF सुरक्षा जांच एवं स्वचालित कार्यप्रवाह
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => loadData()}
            className="secondary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            ताज़ा करें
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            नया RSS स्रोत जोड़ें
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#1E293B',
            borderLeft: '4px solid #10B981',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#10B981',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Subtabs Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #334155', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('sources')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeSubTab === 'sources' ? '#FFFFFF' : '#94A3B8',
            borderBottom: activeSubTab === 'sources' ? '2px solid #ED1727' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          RSS स्रोत ({sources.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('validator')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeSubTab === 'validator' ? '#FFFFFF' : '#94A3B8',
            borderBottom: activeSubTab === 'validator' ? '2px solid #ED1727' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          फ़ीड सत्यापन व SSRF सुरक्षा
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('queue')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeSubTab === 'queue' ? '#FFFFFF' : '#94A3B8',
            borderBottom: activeSubTab === 'queue' ? '2px solid #ED1727' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          आयात कतार व क्लस्टर्स ({importedItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('rules')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeSubTab === 'rules' ? '#FFFFFF' : '#94A3B8',
            borderBottom: activeSubTab === 'rules' ? '2px solid #ED1727' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          ऑटोमेशन नियम ({rules.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('health')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeSubTab === 'health' ? '#FFFFFF' : '#94A3B8',
            borderBottom: activeSubTab === 'health' ? '2px solid #ED1727' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          सिस्टम स्वास्थ्य व लॉग्स
        </button>
      </div>

      {/* Subtab 1: RSS Sources Manager */}
      {activeSubTab === 'sources' && (
        <div>
          {/* Controls bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="स्रोत अथवा प्रकाशक का नाम खोजें..."
                className="input-field"
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
              style={{ width: '180px' }}
            >
              <option value="all">सभी स्थितियां</option>
              <option value="active">सक्रिय (Active)</option>
              <option value="pending_approval">समीक्षाधीन (Pending)</option>
              <option value="paused">रुका हुआ (Paused)</option>
              <option value="disabled">निष्क्रिय (Disabled)</option>
              <option value="archived">संग्रहीत (Archived)</option>
            </select>
          </div>

          {/* Sources List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredSources.map((s) => (
              <div
                key={s.id}
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>{s.name}</h3>
                    {s.status === 'active' && (
                      <span className="badge" style={{ backgroundColor: '#064E3B', color: '#10B981' }}>
                        सक्रिय
                      </span>
                    )}
                    {s.status === 'pending_approval' && (
                      <span className="badge" style={{ backgroundColor: '#78350F', color: '#FBBF24' }}>
                        अनुमोदन लंबित
                      </span>
                    )}
                    {s.status === 'paused' && (
                      <span className="badge" style={{ backgroundColor: '#334155', color: '#94A3B8' }}>
                        रुका हुआ
                      </span>
                    )}
                    {s.status === 'disabled' && (
                      <span className="badge" style={{ backgroundColor: '#7F1D1D', color: '#EF4444' }}>
                        निष्क्रिय
                      </span>
                    )}
                    {s.status === 'archived' && (
                      <span className="badge" style={{ backgroundColor: '#4C1D95', color: '#A78BFA' }}>
                        संग्रहीत
                      </span>
                    )}
                    {s.isAuthorized && (
                      <span style={{ fontSize: '11px', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ShieldCheck size={12} /> अधिकृत
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                    प्रकाशक: <strong style={{ color: '#E2E8F0' }}>{s.publisherName}</strong> • श्रेणी: {s.sourceCategory} • कवरेज: {s.geographicCoverage} • आवृत्ति: {s.pollingIntervalMinutes} मिनट
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', wordBreak: 'break-all' }}>
                    फ़ीड URL: {s.feedUrl}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {s.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleSyncSource(s.id)}
                      className="secondary-btn"
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="तत्काल फ़ीड फेच व ड्राफ्ट बनाएं"
                    >
                      <RefreshCw size={12} /> सिंक करें
                    </button>
                  )}
                  {s.status === 'pending_approval' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(s.id)}
                      className="primary-btn"
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#10B981' }}
                    >
                      <CheckCircle size={12} /> अनुमोदन करें
                    </button>
                  )}
                  {s.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handlePause(s.id)}
                      className="secondary-btn"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      रोकें
                    </button>
                  )}
                  {(s.status === 'active' || s.status === 'paused') && (
                    <button
                      type="button"
                      onClick={() => handleDisable(s.id)}
                      className="danger-btn"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      निष्क्रिय करें
                    </button>
                  )}
                  {(s.status === 'paused' || s.status === 'disabled') && (
                    <button
                      type="button"
                      onClick={() => handleReEnable(s.id)}
                      className="primary-btn"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      सक्रिय करें
                    </button>
                  )}
                  {s.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(s.id)}
                      className="secondary-btn"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      title="संग्रह में भेजें"
                    >
                      <Archive size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px' }}
                    title="हटाएं"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filteredSources.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                कोई RSS स्रोत नहीं मिला।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 2: Feed Validator */}
      {activeSubTab === 'validator' && (
        <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#10B981" />
            फ़ीड URL सत्यापन एवं SSRF सुरक्षा परीक्षण
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>
            किसी भी बाहरी RSS/Atom फ़ीड को जोड़ने से पूर्व उसकी प्रामाणिकता, प्रारूप (RSS 2.0 / Atom) एवं SSRF सुरक्षा सीमाओं की स्वचालित जांच करें।
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://news.mpinfo.org/feed/rss2.xml"
              className="input-field"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleValidateFeed}
              disabled={validating || !testUrl.trim()}
              className="primary-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {validating ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              जांच करें
            </button>
          </div>

          {validationResult && (
            <div
              style={{
                border: `1px solid ${validationResult.isValid ? '#10B981' : '#EF4444'}`,
                backgroundColor: '#0F172A',
                borderRadius: '6px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {validationResult.isValid ? (
                  <CheckCircle size={18} color="#10B981" />
                ) : (
                  <XCircle size={18} color="#EF4444" />
                )}
                <strong style={{ color: validationResult.isValid ? '#10B981' : '#EF4444', fontSize: '14px' }}>
                  {validationResult.isValid ? 'सत्यापन सफल — फ़ीड सुरक्षित एवं मान्य है' : 'सत्यापन विफल'}
                </strong>
              </div>

              {validationResult.error && (
                <div style={{ color: '#EF4444', fontSize: '13px', marginBottom: '10px' }}>
                  कारण: {validationResult.error}
                </div>
              )}

              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.6' }}>
                <div><strong>सुरक्षा स्थिति:</strong> {validationResult.securityCheck.isSsrfSafe ? 'SSRF सुरक्षित (Loopback/Private IP अवरुद्ध)' : 'असुरक्षित'}</div>
                <div><strong>प्रोटोकॉल:</strong> {validationResult.securityCheck.protocol}</div>
                {validationResult.title && <div><strong>फ़ीड शीर्षक:</strong> {validationResult.title}</div>}
                {validationResult.itemCount !== undefined && <div><strong>उपलब्ध समाचार:</strong> {validationResult.itemCount}</div>}
              </div>

              {validationResult.sampleItems && validationResult.sampleItems.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '8px' }}>
                    प्रारंभिक समाचार नमूना ({validationResult.sampleItems.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {validationResult.sampleItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#1E293B',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#F8FAFC',
                        }}
                      >
                        • {item.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Ingestion Queue & Clusters */}
      {activeSubTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>कुल आयातित समाचार</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>
                {importedItems.length}
              </div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>सक्रिय स्टोरी क्लस्टर्स</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6', marginTop: '4px' }}>
                {clusters.length}
              </div>
            </div>
          </div>

          {/* Story Clusters Section */}
          {clusters.length > 0 && (
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} color="#3B82F6" />
                सक्रिय क्रॉस-सोर्स स्टोरी क्लस्टर्स
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {clusters.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#0F172A',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#F8FAFC', fontSize: '13px' }}>{c.title}</strong>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                        श्रेणी: {c.primaryCategory} • {c.itemCount} संबंधित रिपोर्ट्स • {c.sourceIds.length} विभिन्न स्रोत
                      </div>
                    </div>
                    <span className="badge" style={{ backgroundColor: '#1E3A8A', color: '#93C5FD' }}>
                      क्लस्टर ID: {c.id.slice(0, 12)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imported Items Table */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #334155' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                आयातित समाचार ड्राफ्ट लॉग
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '10px 16px' }}>शीर्षक</th>
                    <th style={{ padding: '10px 16px' }}>स्रोत श्रेय</th>
                    <th style={{ padding: '10px 16px' }}>GUID हैश</th>
                    <th style={{ padding: '10px 16px' }}>आयात समय</th>
                    <th style={{ padding: '10px 16px' }}>ड्राफ्ट ID</th>
                  </tr>
                </thead>
                <tbody>
                  {importedItems.slice(0, 20).map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #334155', color: '#E2E8F0' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500 }}>{i.originalTitle}</td>
                      <td style={{ padding: '10px 16px', color: '#94A3B8' }}>{i.sourceAttribution}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                        {i.guidHash.slice(0, 12)}...
                      </td>
                      <td style={{ padding: '10px 16px', color: '#94A3B8' }}>
                        {new Date(i.importedAt).toLocaleTimeString('hi-IN')}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: '#10B981', fontFamily: 'monospace' }}>
                          {i.generatedNewsId?.slice(0, 12)}...
                        </span>
                      </td>
                    </tr>
                  ))}
                  {importedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                        अभी तक कोई RSS समाचार आयात नहीं हुआ है।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: Automation Rules */}
      {activeSubTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rules.map((r) => (
            <div
              key={r.id}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '8px',
                border: '1px solid #334155',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="#FBBF24" />
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>{r.name}</h3>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: r.status === 'active' ? '#064E3B' : '#334155',
                      color: r.status === 'active' ? '#10B981' : '#94A3B8',
                    }}
                  >
                    {r.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                  {r.description}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#38BDF8', backgroundColor: '#0C4A6E', padding: '2px 8px', borderRadius: '4px' }}>
                    ट्रिगर: {r.trigger}
                  </span>
                  {r.actions.map((act, idx) => (
                    <span
                      key={idx}
                      style={{ fontSize: '11px', color: '#A78BFA', backgroundColor: '#4C1D95', padding: '2px 8px', borderRadius: '4px' }}
                    >
                      एक्शन: {act.actionType}
                    </span>
                  ))}
                  <span style={{ fontSize: '11px', color: '#64748B', padding: '2px 8px' }}>
                    अधिकतम सीमा: {r.executionPolicy.maxHops} hops
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleToggleRule(r.id)}
                  className="secondary-btn"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  {r.status === 'active' ? 'निष्क्रिय करें' : 'सक्रिय करें'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 5: System Health & Execution Logs */}
      {activeSubTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {health && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>सक्रिय RSS स्रोत</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                  {health.activeSources} / {health.totalSources}
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>समीक्षाधीन स्रोत</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#FBBF24', marginTop: '2px' }}>
                  {health.pendingSources}
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>कुल तैयार ड्राफ्ट्स</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#3B82F6', marginTop: '2px' }}>
                  {health.totalDraftsGenerated}
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>लूप रोकथाम स्थिति</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#10B981', marginTop: '6px' }}>
                  सख्त सीमा (Max 3 Hops)
                </div>
              </div>
            </div>
          )}

          {/* Execution Logs */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #334155' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                हालिया ऑटोमेशन निष्पादन ऑडिट लॉग्स
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '10px 16px' }}>नियम का नाम</th>
                    <th style={{ padding: '10px 16px' }}>ट्रिगर</th>
                    <th style={{ padding: '10px 16px' }}>स्थिति</th>
                    <th style={{ padding: '10px 16px' }}>अवधि</th>
                    <th style={{ padding: '10px 16px' }}>निष्पादित एक्शन</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #334155', color: '#E2E8F0' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500 }}>{log.automationName}</td>
                      <td style={{ padding: '10px 16px', color: '#94A3B8' }}>{log.triggerType}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: log.status === 'success' ? '#064E3B' : '#7F1D1D',
                            color: log.status === 'success' ? '#10B981' : '#EF4444',
                          }}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#94A3B8' }}>{log.durationMs}ms</td>
                      <td style={{ padding: '10px 16px', color: '#A78BFA' }}>
                        {log.actionsExecuted.map((a) => a.actionType).join(', ') || 'None'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                        कोई ऑटोमेशन लॉग उपलब्ध नहीं है।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              border: '1px solid #334155',
              padding: '24px',
              maxWidth: '540px',
              width: '100%',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px 0' }}>
              नया RSS फ़ीड स्रोत जोड़ें
            </h2>
            <form onSubmit={handleCreateSource} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  स्रोत का नाम *
                </label>
                <input
                  type="text"
                  required
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="उदा. एमपी जनसंपर्क समाचार"
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  फ़ीड URL * (SSRF सुरक्षित सार्वजनिक URL)
                </label>
                <input
                  type="url"
                  required
                  value={newSource.feedUrl}
                  onChange={(e) => setNewSource({ ...newSource, feedUrl: e.target.value })}
                  placeholder="https://news.mpinfo.org/feed/rss2.xml"
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  प्रकाशक का नाम *
                </label>
                <input
                  type="text"
                  required
                  value={newSource.publisherName}
                  onChange={(e) => setNewSource({ ...newSource, publisherName: e.target.value })}
                  placeholder="Government of Madhya Pradesh"
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                    डिफ़ॉल्ट श्रेणी
                  </label>
                  <select
                    value={newSource.sourceCategory}
                    onChange={(e) => setNewSource({ ...newSource, sourceCategory: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="governance">शासन-प्रशासन</option>
                    <option value="politics">राजनीति</option>
                    <option value="local">स्थानीय समाचार</option>
                    <option value="crime">अपराध</option>
                    <option value="education">शिक्षा व रोजगार</option>
                    <option value="sports">खेल जगत</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                    पोलिंग अंतराल (मिनट)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={newSource.pollingIntervalMinutes}
                    onChange={(e) => setNewSource({ ...newSource, pollingIntervalMinutes: parseInt(e.target.value, 10) })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="secondary-btn"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                >
                  सुरक्षित जोड़ें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
