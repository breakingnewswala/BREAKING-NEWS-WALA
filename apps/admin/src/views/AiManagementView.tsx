import React, { useState, useEffect } from 'react';
import {
  Bot,
  Cpu,
  Key,
  Wrench,
  FileCode,
  AlertTriangle,
  RefreshCw,
  Power,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  fetchAiStats,
  fetchAiAgents,
  toggleAgentStatus,
  fetchAiProviders,
  fetchAiKeys,
  fetchAiMcpTools,
  toggleMcpToolStatus,
  fetchAiPrompts,
  rollbackPromptVersion,
} from '../lib/api';
import {
  AiDashboardStats,
  AdminAgentItem,
  AdminProviderItem,
  AdminKeyItem,
  AdminMcpToolItem,
  AdminPromptItem,
} from '../types';

type AiSubTab = 'dashboard' | 'agents' | 'providers' | 'tools' | 'prompts';

export const AiManagementView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<AiSubTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<AiDashboardStats | null>(null);
  const [agents, setAgents] = useState<AdminAgentItem[]>([]);
  const [providers, setProviders] = useState<AdminProviderItem[]>([]);
  const [keys, setKeys] = useState<AdminKeyItem[]>([]);
  const [tools, setTools] = useState<AdminMcpToolItem[]>([]);
  const [prompts, setPrompts] = useState<AdminPromptItem[]>([]);

  // Selected prompt for viewing/rollback modal
  const [selectedPrompt, setSelectedPrompt] = useState<AdminPromptItem | null>(null);
  const [rollbackVersion, setRollbackVersion] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllAiData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, agentsRes, provRes, keysRes, toolsRes, promptsRes] = await Promise.all([
        fetchAiStats(),
        fetchAiAgents(),
        fetchAiProviders(),
        fetchAiKeys(),
        fetchAiMcpTools(),
        fetchAiPrompts(),
      ]);

      setStats(statsRes);
      setAgents(agentsRes);
      setProviders(provRes);
      setKeys(keysRes);
      setTools(toolsRes);
      setPrompts(promptsRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI प्रबंधन डेटा लोड करने में त्रुटि।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAiData();
  }, []);

  const handleToggleAgent = async (agent: AdminAgentItem) => {
    const nextStatus = agent.status === 'active' ? 'disabled' : 'active';
    try {
      const updated = await toggleAgentStatus(agent.id, nextStatus);
      setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'स्थिति बदलने में विफल।');
    }
  };

  const handleToggleTool = async (tool: AdminMcpToolItem) => {
    const nextStatus = tool.status === 'active' ? 'disabled' : 'active';
    try {
      const updated = await toggleMcpToolStatus(tool.id, nextStatus);
      setTools((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'टूल स्थिति बदलने में विफल।');
    }
  };

  const handleRollbackPrompt = async () => {
    if (!selectedPrompt || !rollbackVersion) return;
    setActionLoading(true);
    try {
      const updated = await rollbackPromptVersion(selectedPrompt.id, rollbackVersion);
      setPrompts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPrompt(null);
      setRollbackVersion('');
      alert(`प्रॉम्प्ट ${updated.id} को संस्करण ${rollbackVersion} पर सफलतापूर्वक रोलबैक किया गया।`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'रोलबैक विफल रहा।');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--midnight)' }}>
            कृत्रिम बुद्धिमत्ता (AI) एजेंट व MCP प्रबंधन
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '0.875rem' }}>
            14 विशेषीकृत संपादकीय एजेंट, मॉडल रूटिंग, MCP टूल्स एवं KMS-संरक्षित API पूल
          </p>
        </div>
        <button
          onClick={loadAllAiData}
          className="btn btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          रिफ्रेश करें
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #E5E7EB',
          marginBottom: 20,
          paddingBottom: 4,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`tab-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: activeSubTab === 'dashboard' ? 'var(--blue)' : 'transparent',
            color: activeSubTab === 'dashboard' ? '#fff' : '#4B5563',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Zap size={16} />
          AI डैशबोर्ड
        </button>
        <button
          onClick={() => setActiveSubTab('agents')}
          className={`tab-btn ${activeSubTab === 'agents' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: activeSubTab === 'agents' ? 'var(--blue)' : 'transparent',
            color: activeSubTab === 'agents' ? '#fff' : '#4B5563',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Bot size={16} />
          एजेंट रजिस्ट्री ({agents.length})
        </button>
        <button
          onClick={() => setActiveSubTab('providers')}
          className={`tab-btn ${activeSubTab === 'providers' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: activeSubTab === 'providers' ? 'var(--blue)' : 'transparent',
            color: activeSubTab === 'providers' ? '#fff' : '#4B5563',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Cpu size={16} />
          प्रोवाइडर व कुंजी वॉल्ट ({providers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('tools')}
          className={`tab-btn ${activeSubTab === 'tools' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: activeSubTab === 'tools' ? 'var(--blue)' : 'transparent',
            color: activeSubTab === 'tools' ? '#fff' : '#4B5563',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Wrench size={16} />
          MCP टूल्स ({tools.length})
        </button>
        <button
          onClick={() => setActiveSubTab('prompts')}
          className={`tab-btn ${activeSubTab === 'prompts' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: activeSubTab === 'prompts' ? 'var(--blue)' : 'transparent',
            color: activeSubTab === 'prompts' ? '#fff' : '#4B5563',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FileCode size={16} />
          प्रॉम्प्ट संस्करण ({prompts.length})
        </button>
      </div>

      {/* SUB-TAB 1: AI DASHBOARD */}
      {activeSubTab === 'dashboard' && stats && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--blue)' }}>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>कुल पंजीकृत एजेंट</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--midnight)', marginTop: 4 }}>
                {stats.registeredAgentsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: 4 }}>
                {stats.activeAgentsCount} सक्रिय | {stats.disabledAgentsCount} निष्क्रिय
              </div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>प्रोवाइडर स्थिति</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--midnight)', marginTop: 4 }}>
                {stats.healthyProvidersCount}/{stats.configuredProvidersCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>स्वस्थ / कॉन्फ़िगर किए गए</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--yellow)' }}>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>कुल निष्पादन अनुरोध</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--midnight)', marginTop: 4 }}>
                {stats.totalExecutionsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                सफल: {stats.successfulExecutionsCount} | विफल: {stats.failedExecutionsCount}
              </div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--red)' }}>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>औसत निष्पादन विलंबता</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--midnight)', marginTop: 4 }}>
                {stats.averageLatencyMs} ms
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                फ़ॉलबैक निष्पादन: {stats.fallbackExecutionsCount}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--midnight)' }}>
              AI अवसंरचना अनुपालन एवं सुरक्षा सिद्धांत
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#4B5563', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <li>
                <strong>मानवीय संपादकीय सर्वोच्चता (RULE-AI-001):</strong> AI को सीधे समाचार प्रकाशित करने का कोई अधिकार नहीं है।
              </li>
              <li>
                <strong>अनिवार्य ड्राफ्ट स्थिति (RULE-AI-002):</strong> सभी AI निर्माण <code>draft</code> स्थिति में दर्ज होते हैं।
              </li>
              <li>
                <strong>KMS कुंजी अलगाव (RULE-AI-004):</strong> सभी प्रदाताओं की API कुंजियाँ सर्वर-साइड वॉल्ट में सुरक्षित हैं।
              </li>
              <li>
                <strong>DEC-048 अपरिवर्तनीयता:</strong> <code>ROLE_CHIEF_EDITOR</code> अनुमोदन हेतु लंबित है एवं प्रतिबंधित है।
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AGENT REGISTRY */}
      {activeSubTab === 'agents' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>एजेंट कोड व नाम</th>
                <th style={{ padding: '12px 16px' }}>श्रेणी</th>
                <th style={{ padding: '12px 16px' }}>क्षमता स्तर</th>
                <th style={{ padding: '12px 16px' }}>डिफ़ॉल्ट मॉडल</th>
                <th style={{ padding: '12px 16px' }}>प्रॉम्प्ट संस्करण</th>
                <th style={{ padding: '12px 16px' }}>स्थिति</th>
                <th style={{ padding: '12px 16px' }}>क्रिया</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--midnight)' }}>{agent.hindiName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {agent.id} • {agent.name}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                      {agent.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          agent.assignedTier === 'deep'
                            ? '#EDE9FE'
                            : agent.assignedTier === 'fast'
                              ? '#ECFDF5'
                              : '#FEF3C7',
                        color:
                          agent.assignedTier === 'deep'
                            ? '#6D28D9'
                            : agent.assignedTier === 'fast'
                              ? '#059669'
                              : '#D97706',
                      }}
                    >
                      {agent.assignedTier.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#374151' }}>
                    <code>{agent.defaultModelId}</code>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>v{agent.version}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      className={`badge ${agent.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {agent.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleToggleAgent(agent)}
                      className={`btn btn-sm ${agent.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Power size={12} />
                      {agent.status === 'active' ? 'रोकें' : 'सक्रिय करें'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 3: PROVIDERS & API POOL VAULT */}
      {activeSubTab === 'providers' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px 0' }}>कॉन्फ़िगर किए गए AI प्रदाता</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {providers.map((p) => (
                <div key={p.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--midnight)' }}>{p.name}</div>
                    <span
                      className={`badge ${p.healthStatus === 'healthy' ? 'badge-success' : 'badge-neutral'}`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {p.healthStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                    प्राथमिकता: #{p.priority} • प्रकार: {p.type}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563' }}>समर्थित मॉडल:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {p.approvedModels.map((m) => (
                        <code key={m} style={{ fontSize: '0.7rem', background: '#F3F4F6', padding: '2px 4px' }}>
                          {m}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px 0' }}>KMS-संरक्षित API कुंजी वॉल्ट</h3>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>वॉल्ट उपनाम (Alias)</th>
                  <th style={{ padding: '10px 14px' }}>प्रदाता कोड</th>
                  <th style={{ padding: '10px 14px' }}>मास्क की गई कुंजी</th>
                  <th style={{ padding: '10px 14px' }}>कोटा (QPM)</th>
                  <th style={{ padding: '10px 14px' }}>स्वास्थ्य</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                      <Key size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                      {k.keyAlias}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.85rem' }}>{k.providerId}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>
                        {k.maskedKey}
                      </code>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.85rem' }}>{k.quotaLimitQpm} QPM</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                        {k.currentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MCP TOOLS */}
      {activeSubTab === 'tools' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>टूल पहचानकर्ता व नाम</th>
                <th style={{ padding: '12px 16px' }}>विवरण</th>
                <th style={{ padding: '12px 16px' }}>अनुमत भूमिकाएँ</th>
                <th style={{ padding: '12px 16px' }}>अनुमति क्षेत्र</th>
                <th style={{ padding: '12px 16px' }}>दर सीमा</th>
                <th style={{ padding: '12px 16px' }}>स्थिति</th>
                <th style={{ padding: '12px 16px' }}>क्रिया</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--midnight)' }}>{tool.name}</div>
                    <code style={{ fontSize: '0.75rem', color: '#6B7280' }}>{tool.id}</code>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#4B5563', maxWidth: 280 }}>
                    {tool.description}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.75rem' }}>
                    {tool.allowedRoles.join(', ')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ fontSize: '0.75rem' }}>{tool.permissionScope}</code>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                    {tool.rateLimitPerMinute}/min
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      className={`badge ${tool.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {tool.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleToggleTool(tool)}
                      className={`btn btn-sm ${tool.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Power size={12} />
                      {tool.status === 'active' ? 'रोकें' : 'सक्रिय करें'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 5: PROMPTS */}
      {activeSubTab === 'prompts' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>प्रॉम्प्ट कोड व शीर्षक</th>
                <th style={{ padding: '12px 16px' }}>उद्देश्य</th>
                <th style={{ padding: '12px 16px' }}>लक्ष्य एजेंट</th>
                <th style={{ padding: '12px 16px' }}>वर्तमान संस्करण</th>
                <th style={{ padding: '12px 16px' }}>संस्करण इतिहास</th>
                <th style={{ padding: '12px 16px' }}>क्रिया</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr key={prompt.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--midnight)' }}>{prompt.name}</div>
                    <code style={{ fontSize: '0.75rem', color: '#6B7280' }}>{prompt.id}</code>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#4B5563', maxWidth: 280 }}>
                    {prompt.purpose}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                    <code>{prompt.targetAgentId}</code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                      v{prompt.currentVersion}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                    {prompt.versions.length} संस्करण
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setRollbackVersion(prompt.versions[0]?.version || '');
                      }}
                      className="btn btn-sm btn-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <RotateCcw size={12} />
                      प्रबंधन / रोलबैक
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PROMPT ROLLBACK MODAL */}
      {selectedPrompt && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                प्रॉम्प्ट संस्करण प्रबंधन: {selectedPrompt.name}
              </h3>
            </div>
            <div className="modal-body" style={{ padding: 16 }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#4B5563' }}>
                वर्तमान सक्रिय संस्करण: <strong>v{selectedPrompt.currentVersion}</strong>
              </p>

              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                रोलबैक हेतु पूर्ववर्ती संस्करण चुनें:
              </label>
              <select
                value={rollbackVersion}
                onChange={(e) => setRollbackVersion(e.target.value)}
                className="input-field"
                style={{ width: '100%', marginBottom: 16 }}
              >
                {selectedPrompt.versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} — {v.changelog} ({new Date(v.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>

              <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 6, fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>सिस्टम निर्देश (System Directive):</div>
                <div style={{ color: '#374151', fontStyle: 'italic' }}>
                  {selectedPrompt.versions.find((v) => v.version === rollbackVersion)?.systemDirective ||
                    'निर्देश अनुपलब्ध'}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 16 }}>
              <button onClick={() => setSelectedPrompt(null)} className="btn btn-outline" disabled={actionLoading}>
                रद्द करें
              </button>
              <button
                onClick={handleRollbackPrompt}
                className="btn btn-primary"
                disabled={actionLoading || rollbackVersion === selectedPrompt.currentVersion}
              >
                {actionLoading ? 'रोलबैक हो रहा है...' : `v${rollbackVersion} पर रोलबैक करें`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
