/**
 * BREAKING NEWS WALA — Admin Social Integrations & Central API Pool Management View
 * Grounded in docs/11-Architecture.md (DOM-Q), docs/20-Integrations.md, docs/DECISIONS.md
 */

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Server,
  Activity,
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Send,
  RotateCcw,
  Lock,
} from 'lucide-react';
import {
  fetchAdminProviders,
  createAdminProvider,
  testAdminProviderHealth,
  fetchAdminSocialAccounts,
  connectAdminSocialAccount,
  toggleAdminSocialAccount,
  disconnectAdminSocialAccount,
  fetchAdminSocialPublishingJobs,
  retryAdminSocialDelivery,
  fetchAdminWebhookLogs,
} from '../lib/api';
import type {
  IntegrationCategory,
  IntegrationProviderItem,
  CreateIntegrationProviderDto,
  SocialPlatform,
  SocialAccountItem,
  CreateSocialAccountDto,
  SocialPublishingStatus,
  SocialPublishingJobItem,
  WebhookLogItem,
} from '../types';

type SubTab = 'providers' | 'accounts' | 'publishing' | 'webhooks';

export const SocialIntegrationsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('providers');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Providers State
  const [providers, setProviders] = useState<IntegrationProviderItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [healthResults, setHealthResults] = useState<Record<string, { success: boolean; latencyMs?: number; message: string }>>({});
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [newProvider, setNewProvider] = useState<CreateIntegrationProviderDto>({
    providerId: '',
    name: '',
    category: 'social_media',
    baseUrl: 'https://api.example.com',
    authMethod: 'api_key',
    supportedCapabilities: ['publish_post', 'read_analytics'],
    rateLimitInfo: '60 req/min',
    apiKey: 'demo-key-12345',
    isEnabled: true,
  });

  // Accounts State
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState<CreateSocialAccountDto>({
    platform: 'x',
    accountName: '',
    accountIdentifier: '',
    accountType: 'profile',
    botToken: 'demo-token-xyz',
    grantedScopes: ['read', 'write'],
  });

  // Publishing Jobs State
  const [jobs, setJobs] = useState<SocialPublishingJobItem[]>([]);
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('all');
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);

  // Webhooks State
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);

  useEffect(() => {
    loadData();
  }, [categoryFilter, platformFilter, jobStatusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [provs, accs, jbs, whs] = await Promise.all([
        fetchAdminProviders(categoryFilter !== 'all' ? (categoryFilter as IntegrationCategory) : undefined),
        fetchAdminSocialAccounts(platformFilter !== 'all' ? (platformFilter as SocialPlatform) : undefined),
        fetchAdminSocialPublishingJobs(jobStatusFilter !== 'all' ? (jobStatusFilter as SocialPublishingStatus) : undefined),
        fetchAdminWebhookLogs(),
      ]);
      setProviders(provs);
      setAccounts(accs);
      setJobs(jbs);
      setWebhookLogs(whs);
    } catch (err: any) {
      console.warn('Failed to load social integrations data:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // 1. Provider Actions
  const handleTestHealth = async (providerId: string) => {
    setTestingProviderId(providerId);
    try {
      const result = await testAdminProviderHealth(providerId);
      setHealthResults((prev) => ({
        ...prev,
        [providerId]: {
          success: result.success,
          latencyMs: result.latencyMs,
          message: result.message,
        },
      }));
      showNotification(`स्वास्थ्य परीक्षण पूर्ण: ${result.message}`);
    } catch (err: any) {
      setHealthResults((prev) => ({
        ...prev,
        [providerId]: {
          success: false,
          message: err?.message || 'कनेक्शन विफल',
        },
      }));
      showNotification(`परीक्षण विफल: ${err?.message}`);
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvider.name || !newProvider.providerId || !newProvider.baseUrl) {
      showNotification('कृपया सभी आवश्यक फ़ील्ड भरें');
      return;
    }
    try {
      await createAdminProvider(newProvider);
      showNotification(`प्रदाता "${newProvider.name}" सफलतापूर्वक जोड़ा गया`);
      setShowAddProviderModal(false);
      setNewProvider({
        providerId: '',
        name: '',
        category: 'social_media',
        baseUrl: 'https://api.example.com',
        authMethod: 'api_key',
        supportedCapabilities: ['publish_post', 'read_analytics'],
        rateLimitInfo: '60 req/min',
        apiKey: 'demo-key-12345',
        isEnabled: true,
      });
      loadData();
    } catch (err: any) {
      showNotification(`त्रुटि: ${err?.message}`);
    }
  };

  // 2. Account Actions
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.accountName || !newAccount.accountIdentifier) {
      showNotification('कृपया सभी खाता विवरण भरें');
      return;
    }
    try {
      await connectAdminSocialAccount(newAccount);
      showNotification(`खाता @${newAccount.accountIdentifier} सफलतापूर्वक कनेक्ट किया गया`);
      setShowAddAccountModal(false);
      setNewAccount({
        platform: 'x',
        accountName: '',
        accountIdentifier: '',
        accountType: 'profile',
        botToken: 'demo-token-xyz',
        grantedScopes: ['read', 'write'],
      });
      loadData();
    } catch (err: any) {
      showNotification(`त्रुटि: ${err?.message}`);
    }
  };

  const handleToggleAccount = async (accountId: string) => {
    try {
      const updated = await toggleAdminSocialAccount(accountId);
      showNotification(`खाता @${updated.accountIdentifier} स्थिति: ${updated.isActive ? 'सक्रिय' : 'निष्क्रिय'}`);
      loadData();
    } catch (err: any) {
      showNotification(`त्रुटि: ${err?.message}`);
    }
  };

  const handleDisconnectAccount = async (accountId: string, identifier: string) => {
    if (!window.confirm(`क्या आप वाकई @${identifier} को डिस्कनेक्ट करना चाहते हैं?`)) return;
    try {
      await disconnectAdminSocialAccount(accountId);
      showNotification(`खाता @${identifier} डिस्कनेक्ट किया गया`);
      loadData();
    } catch (err: any) {
      showNotification(`त्रुटि: ${err?.message}`);
    }
  };

  // 3. Publishing Actions
  const handleRetryDelivery = async (deliveryId: string) => {
    setRetryingDeliveryId(deliveryId);
    try {
      const updatedJob = await retryAdminSocialDelivery(deliveryId);
      showNotification(`पुनः प्रयास पूर्ण: जॉब स्थिति "${updatedJob.status}"`);
      loadData();
    } catch (err: any) {
      showNotification(`पुनः प्रयास विफल: ${err?.message}`);
    } finally {
      setRetryingDeliveryId(null);
    }
  };

  // Filtered providers
  const filteredProviders = providers.filter((p) => {
    const url = p.baseUrl || '';
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.providerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', color: '#E2E8F0' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Share2 size={24} style={{ color: '#E11D48' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              सेंट्रल API पूल व सोशल मीडिया वितरण प्रणाली
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
            बाहरी सेवा प्रदाताओं का प्रबंधन, सोशल मीडिया खाते (Meta, X, YouTube, LinkedIn, Telegram), सुरक्षित वेबहुक एवं कतार
          </p>
        </div>

        <button
          onClick={loadData}
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

      {/* Action Notification Alert */}
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

      {/* Primary Sub-Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '24px', gap: '8px' }}>
        <button
          onClick={() => setActiveSubTab('providers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'providers' ? '2px solid #E11D48' : '2px solid transparent',
            color: activeSubTab === 'providers' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeSubTab === 'providers' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          <Server size={16} />
          1. सेंट्रल API पूल व प्रदाता ({providers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('accounts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'accounts' ? '2px solid #E11D48' : '2px solid transparent',
            color: activeSubTab === 'accounts' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeSubTab === 'accounts' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          <Share2 size={16} />
          2. सोशल मीडिया खाते ({accounts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('publishing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'publishing' ? '2px solid #E11D48' : '2px solid transparent',
            color: activeSubTab === 'publishing' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeSubTab === 'publishing' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          <Send size={16} />
          3. प्रकाशन कतार व डिलीवरी ({jobs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('webhooks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'webhooks' ? '2px solid #E11D48' : '2px solid transparent',
            color: activeSubTab === 'webhooks' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeSubTab === 'webhooks' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          <Activity size={16} />
          4. स्वास्थ्य निगरानी व वेबहुक लॉग्स
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SUBTAB 1: Central API Pool & Provider Registry */}
      {/* ==================================================================== */}
      {activeSubTab === 'providers' && (
        <div>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'सभी श्रेणियां' },
                { id: 'social_media', label: 'सोशल मीडिया' },
                { id: 'notifications', label: 'नोटिफिकेशन (SMS/FCM)' },
                { id: 'ai_services', label: 'AI सेवाएं' },
                { id: 'storage', label: 'क्लाउड स्टोरेज' },
                { id: 'media_processing', label: 'मीडिया प्रोसेसिंग' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  style={{
                    backgroundColor: categoryFilter === cat.id ? '#E11D48' : '#1E293B',
                    color: '#FFFFFF',
                    border: '1px solid #334155',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="प्रदाता नाम या कोड खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px 8px 32px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    width: '220px',
                  }}
                />
              </div>

              <button
                onClick={() => setShowAddProviderModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#E11D48',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                नया प्रदाता जोड़ें
              </button>
            </div>
          </div>

          {/* Providers Table */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                  <th style={{ padding: '12px 16px' }}>प्रदाता नाम व ID</th>
                  <th style={{ padding: '12px 16px' }}>श्रेणी</th>
                  <th style={{ padding: '12px 16px' }}>बेस URL व प्रमाणीकरण</th>
                  <th style={{ padding: '12px 16px' }}>दर सीमा / सूचना</th>
                  <th style={{ padding: '12px 16px' }}>सक्षम स्थिति</th>
                  <th style={{ padding: '12px 16px' }}>स्वास्थ्य स्थिति</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>कार्यवाही</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                      कोई प्रदाता उपलब्ध नहीं है
                    </td>
                  </tr>
                ) : (
                  filteredProviders.map((p) => {
                    const healthTest = healthResults[p.id];
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1E293B' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>{p.providerId}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              backgroundColor: '#1E293B',
                              color: '#38BDF8',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 500,
                            }}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ color: '#E2E8F0', fontSize: '12px' }}>{p.baseUrl || '—'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94A3B8', fontSize: '11px' }}>
                            <Lock size={10} />
                            <span>{p.authMethod}</span>
                            <span style={{ color: '#475569' }}>•</span>
                            <span style={{ color: '#10B981' }}>{p.maskedCredential || 'KMS Secret Encrypted'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#E2E8F0' }}>
                          {p.rateLimitInfo || '60 req/min'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              backgroundColor:
                                p.isEnabled
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : 'rgba(239, 68, 68, 0.2)',
                              color: p.isEnabled ? '#10B981' : '#F87171',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            {p.isEnabled ? 'सक्रिय' : 'अक्षम'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {healthTest ? (
                            <div style={{ fontSize: '11.5px' }}>
                              <span style={{ color: healthTest.success ? '#10B981' : '#F87171', fontWeight: 600 }}>
                                {healthTest.success ? 'सफल' : 'विफल'}
                              </span>
                              {healthTest.latencyMs !== undefined && (
                                <span style={{ color: '#94A3B8', marginLeft: '6px' }}>({healthTest.latencyMs}ms)</span>
                              )}
                            </div>
                          ) : (
                            <span
                              style={{
                                color:
                                  p.healthStatus === 'healthy'
                                    ? '#10B981'
                                    : p.healthStatus === 'degraded'
                                    ? '#F59E0B'
                                    : '#94A3B8',
                                fontSize: '11.5px',
                              }}
                            >
                              {p.healthStatus || 'unknown'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleTestHealth(p.id)}
                            disabled={testingProviderId === p.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#1E293B',
                              color: '#38BDF8',
                              border: '1px solid #334155',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            <Activity size={12} className={testingProviderId === p.id ? 'spin' : ''} />
                            स्वास्थ्य जांचें
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Add Provider Modal */}
          {showAddProviderModal && (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#FFFFFF', fontWeight: 600 }}>
                    नया सेवा प्रदाता पंजीकृत करें
                  </h3>
                  <button
                    onClick={() => setShowAddProviderModal(false)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '16px' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateProvider} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                      प्रदाता नाम (उदा. Meta Graph API)
                    </label>
                    <input
                      type="text"
                      required
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                        प्रदाता ID
                      </label>
                      <input
                        type="text"
                        required
                        value={newProvider.providerId}
                        onChange={(e) => setNewProvider({ ...newProvider, providerId: e.target.value.toLowerCase() })}
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

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                        श्रेणी
                      </label>
                      <select
                        value={newProvider.category}
                        onChange={(e) => setNewProvider({ ...newProvider, category: e.target.value as IntegrationCategory })}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                        }}
                      >
                        <option value="social_media">सोशल मीडिया</option>
                        <option value="notifications">नोटिफिकेशन</option>
                        <option value="ai_services">AI सेवाएं</option>
                        <option value="storage">क्लाउड स्टोरेज</option>
                        <option value="media_processing">मीडिया प्रोसेसिंग</option>
                        <option value="analytics">एनालिटिक्स</option>
                        <option value="external_integrations">अन्य इंटीग्रेशन</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                      बेस API URL
                    </label>
                    <input
                      type="url"
                      required
                      value={newProvider.baseUrl || ''}
                      onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                        प्रमाणीकरण विधि
                      </label>
                      <select
                        value={newProvider.authMethod}
                        onChange={(e) => setNewProvider({ ...newProvider, authMethod: e.target.value as any })}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                        }}
                      >
                        <option value="api_key">API Key</option>
                        <option value="oauth2">OAuth 2.0</option>
                        <option value="service_account">Service Account</option>
                        <option value="bot_token">Bot Token</option>
                        <option value="none">कोई नहीं</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                        दर सीमा सूचना
                      </label>
                      <input
                        type="text"
                        value={newProvider.rateLimitInfo || ''}
                        onChange={(e) => setNewProvider({ ...newProvider, rateLimitInfo: e.target.value })}
                        placeholder="60 req/min"
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
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddProviderModal(false)}
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
                      type="submit"
                      style={{
                        backgroundColor: '#E11D48',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 18px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      सुरक्षित सहेजें
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 2: Social Media Accounts */}
      {/* ==================================================================== */}
      {activeSubTab === 'accounts' && (
        <div>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'सभी प्लेटफ़ॉर्म' },
                { id: 'facebook', label: 'Facebook' },
                { id: 'instagram', label: 'Instagram' },
                { id: 'youtube', label: 'YouTube' },
                { id: 'x', label: 'X (Twitter)' },
                { id: 'linkedin', label: 'LinkedIn' },
                { id: 'telegram', label: 'Telegram' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatformFilter(p.id)}
                  style={{
                    backgroundColor: platformFilter === p.id ? '#E11D48' : '#1E293B',
                    color: '#FFFFFF',
                    border: '1px solid #334155',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddAccountModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#E11D48',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              नया सोशल खाता कनेक्ट करें
            </button>
          </div>

          {/* Accounts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {accounts.map((acc) => {
              const isActive = acc.isActive;
              return (
                <div
                  key={acc.id}
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span
                        style={{
                          backgroundColor: '#1E293B',
                          color: '#38BDF8',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {acc.platform}
                      </span>
                      <span
                        style={{
                          backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: isActive ? '#10B981' : '#F87171',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {acc.connectionStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>{acc.accountName}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '12px' }}>@{acc.accountIdentifier}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: '#64748B' }}>
                      <div>खाता प्रकार: {acc.accountType}</div>
                      <div>
                        अनुमतियां: {acc.grantedScopes && acc.grantedScopes.length > 0 ? acc.grantedScopes.join(', ') : 'standard'}
                      </div>
                      {acc.tokenExpiresAt && (
                        <div>टोकन समाप्ति: {new Date(acc.tokenExpiresAt).toLocaleDateString('hi-IN')}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #1E293B', paddingTop: '12px' }}>
                    <button
                      onClick={() => handleToggleAccount(acc.id)}
                      style={{
                        flex: 1,
                        backgroundColor: '#1E293B',
                        color: isActive ? '#F59E0B' : '#10B981',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        padding: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {isActive ? 'निष्क्रिय करें' : 'सक्रिय करें'}
                    </button>

                    <button
                      onClick={() => handleDisconnectAccount(acc.id, acc.accountIdentifier)}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#F87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      डिस्कनेक्ट
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connect Account Modal */}
          {showAddAccountModal && (
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
                  width: '500px',
                  maxWidth: '90%',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#FFFFFF', fontWeight: 600 }}>
                    सोशल मीडिया खाता कनेक्ट करें
                  </h3>
                  <button
                    onClick={() => setShowAddAccountModal(false)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '16px' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                      प्लेटफ़ॉर्म चुनें
                    </label>
                    <select
                      value={newAccount.platform}
                      onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value as SocialPlatform })}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                      }}
                    >
                      <option value="x">X (Twitter)</option>
                      <option value="facebook">Facebook Page</option>
                      <option value="instagram">Instagram Professional</option>
                      <option value="youtube">YouTube Channel</option>
                      <option value="linkedin">LinkedIn Page</option>
                      <option value="telegram">Telegram Channel</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                      खाते का नाम (उदा. Breaking News MP Official)
                    </label>
                    <input
                      type="text"
                      required
                      value={newAccount.accountName}
                      onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                        खाता हैंडल / ID (बिना @)
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccount.accountIdentifier}
                        onChange={(e) => setNewAccount({ ...newAccount, accountIdentifier: e.target.value })}
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

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                        खाता प्रकार
                      </label>
                      <select
                        value={newAccount.accountType}
                        onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value as any })}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                        }}
                      >
                        <option value="profile">प्रोफ़ाइल (Profile)</option>
                        <option value="page">पेज (Page)</option>
                        <option value="business">व्यवसाय (Business)</option>
                        <option value="channel">चैनल (Channel)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                      बॉट टोकन / ऑथ कोड
                    </label>
                    <input
                      type="password"
                      required
                      value={newAccount.botToken || ''}
                      onChange={(e) =>
                        setNewAccount({
                          ...newAccount,
                          botToken: e.target.value,
                        })
                      }
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddAccountModal(false)}
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
                      type="submit"
                      style={{
                        backgroundColor: '#E11D48',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 18px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      खाता कनेक्ट करें
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 3: Publishing Queue & Deliveries */}
      {/* ==================================================================== */}
      {activeSubTab === 'publishing' && (
        <div>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'सभी जॉब्स' },
              { id: 'PENDING_APPROVAL', label: 'स्वीकृति लंबित' },
              { id: 'APPROVED', label: 'स्वीकृत' },
              { id: 'SCHEDULED', label: 'अनुसूचित' },
              { id: 'PUBLISHED', label: 'प्रकाशित' },
              { id: 'PARTIALLY_PUBLISHED', label: 'आंशिक प्रकाशित' },
              { id: 'FAILED', label: 'विफल' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setJobStatusFilter(st.id)}
                style={{
                  backgroundColor: jobStatusFilter === st.id ? '#E11D48' : '#1E293B',
                  color: '#FFFFFF',
                  border: '1px solid #334155',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Jobs List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {jobs.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  color: '#64748B',
                }}
              >
                कोई सोशल प्रकाशन कार्य उपलब्ध नहीं है
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>
                          {job.title || 'सोशल पोस्ट'}
                        </span>
                        <span
                          style={{
                            backgroundColor:
                              job.status === 'PUBLISHED'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : job.status === 'PARTIALLY_PUBLISHED'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : job.status === 'FAILED'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(56, 189, 248, 0.2)',
                            color:
                              job.status === 'PUBLISHED'
                                ? '#10B981'
                                : job.status === 'PARTIALLY_PUBLISHED'
                                ? '#F59E0B'
                                : job.status === 'FAILED'
                                ? '#F87171'
                                : '#38BDF8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        ID: {job.id} • बनाया गया: {new Date(job.createdAt).toLocaleString('hi-IN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {job.deliveries &&
                        job.deliveries.map((del) => (
                          <span
                            key={del.id}
                            style={{
                              backgroundColor: '#1E293B',
                              color: '#94A3B8',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                            }}
                          >
                            {del.platform}
                          </span>
                        ))}
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
                    {job.masterContent}
                  </p>

                  {/* Deliveries Progress */}
                  {job.deliveries && job.deliveries.length > 0 && (
                    <div style={{ backgroundColor: '#1E293B', borderRadius: '6px', padding: '10px 14px', marginTop: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>
                        प्लेटफ़ॉर्म डिलीवरी स्थिति:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {job.deliveries.map((del) => (
                          <div
                            key={del.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '12px',
                              borderBottom: '1px solid #334155',
                              paddingBottom: '4px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600, color: '#E2E8F0', textTransform: 'capitalize' }}>
                                {del.platform}
                              </span>
                              <span
                                style={{
                                  color: del.status === 'PUBLISHED' ? '#10B981' : del.status === 'FAILED' ? '#F87171' : '#94A3B8',
                                }}
                              >
                                {del.status === 'PUBLISHED' ? '✓ प्रकाशित किया गया' : del.status === 'FAILED' ? `✗ विफल (${del.errorMessage || 'Unknown Error'})` : 'लंबित'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {del.externalPostUrl && (
                                <a
                                  href={del.externalPostUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '2px' }}
                                >
                                  देखें <ExternalLink size={10} />
                                </a>
                              )}

                              {del.status === 'FAILED' && (
                                <button
                                  onClick={() => handleRetryDelivery(del.id)}
                                  disabled={retryingDeliveryId === del.id}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #F87171',
                                    color: '#F87171',
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <RotateCcw size={10} className={retryingDeliveryId === del.id ? 'spin' : ''} />
                                  पुनः प्रयास
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 4: Integration Health & Webhooks */}
      {/* ==================================================================== */}
      {activeSubTab === 'webhooks' && (
        <div>
          {/* Metric Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>कुल पंजीकृत प्रदाता</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>{providers.length}</div>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>सक्रिय सोशल खाते</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
                {accounts.filter((a) => a.isActive).length}
              </div>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>कुल प्रकाशन कार्य</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>{jobs.length}</div>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>वेबहुक घटनाएं</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#E11D48', marginTop: '4px' }}>{webhookLogs.length}</div>
            </div>
          </div>

          {/* Webhook Ingress Event Logs */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #334155', fontWeight: 600, color: '#FFFFFF', fontSize: '14px' }}>
              सुरक्षित वेबहुक इनग्रेस लॉग्स (HMAC-SHA256 सत्यापित)
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                  <th style={{ padding: '10px 14px' }}>समय</th>
                  <th style={{ padding: '10px 14px' }}>प्रदाता ID</th>
                  <th style={{ padding: '10px 14px' }}>इवेंट प्रकार</th>
                  <th style={{ padding: '10px 14px' }}>सत्यापन स्थिति</th>
                  <th style={{ padding: '10px 14px' }}>त्रुटि विवरण</th>
                </tr>
              </thead>
              <tbody>
                {webhookLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '28px', textAlign: 'center', color: '#64748B' }}>
                      कोई वेबहुक घटना प्राप्त नहीं हुई है
                    </td>
                  </tr>
                ) : (
                  webhookLogs.map((wh) => (
                    <tr key={wh.id} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '10px 14px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {new Date(wh.receivedAt).toLocaleTimeString('hi-IN')}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#FFFFFF' }}>{wh.providerId}</td>
                      <td style={{ padding: '10px 14px', color: '#38BDF8' }}>{wh.eventType}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            color: wh.status === 'verified' || wh.status === 'processed' ? '#10B981' : '#F87171',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                          }}
                        >
                          <ShieldCheck size={12} />
                          {wh.status === 'verified' || wh.status === 'processed' ? 'प्रमाणित (Verified)' : wh.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {wh.errorDetails || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
