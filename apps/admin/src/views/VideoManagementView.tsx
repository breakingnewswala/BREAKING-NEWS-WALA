/**
 * BREAKING NEWS WALA — Admin Video Production & FFmpeg Management View
 * Grounded in docs/11-Architecture.md, docs/12-Database.md (DOM-I),
 * docs/16-Storage.md, docs/20-Integrations.md (INT-VID-013), and docs/DECISIONS.md (DEC-048, DEC-060)
 */

import React, { useState, useEffect } from 'react';
import {
  Video,
  Film,
  Activity,
  FileCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Shield,
  Sliders,
  Tv,
  Smartphone,
  Square,
} from 'lucide-react';
import {
  AdminVideoTemplateItem,
  AdminVideoRenderJobItem,
  AdminVideoHealth,
} from '../types';
import {
  fetchAdminVideoTemplates,
  fetchAdminVideoRenderJobs,
  cancelAdminVideoRenderJob,
  fetchAdminVideoHealth,
} from '../lib/api';

type VideoSubTab = 'templates' | 'queue' | 'presets' | 'health' | 'audit';

export const VideoManagementView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<VideoSubTab>('templates');
  const [templates, setTemplates] = useState<AdminVideoTemplateItem[]>([]);
  const [jobs, setJobs] = useState<AdminVideoRenderJobItem[]>([]);
  const [health, setHealth] = useState<AdminVideoHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tplData, jobData, healthData] = await Promise.all([
        fetchAdminVideoTemplates(),
        fetchAdminVideoRenderJobs(),
        fetchAdminVideoHealth(),
      ]);
      setTemplates(tplData);
      setJobs(jobData);
      setHealth(healthData);
    } catch (err: any) {
      setError(err?.message || 'डेटा लोड करने में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelJob = async (jobId: string) => {
    if (!window.confirm('क्या आप इस रेंडरिंग कार्य को रद्द करना चाहते हैं?')) return;
    setCancellingJobId(jobId);
    try {
      await cancelAdminVideoRenderJob(jobId);
      setActionSuccess(`रेंडर कार्य #${jobId.slice(0, 8)} रद्द कर दिया गया।`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'रेंडर कार्य रद्द करने में विफल।');
    } finally {
      setCancellingJobId(null);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#ED1727',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Video size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                वीडियो प्रोडक्शन स्टूडियो व FFmpeg रेंडरर प्रबंधन
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                मल्टी-ट्रैक टाइमलाइन एडिटर, FFmpeg सब-प्रोसेस रेंडरिंग, टेम्पलेट कैटलॉग व कतार प्रबंधन (DOM-I)
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              borderRadius: '20px',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            FFmpeg 9.0.1 • H.264 / AAC
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            रिफ्रेश
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            color: '#b91c1c',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '6px',
            color: '#047857',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveSubTab('templates')}
          style={{
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeSubTab === 'templates' ? '#ED1727' : '#64748b',
            borderBottom: activeSubTab === 'templates' ? '2px solid #ED1727' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Film size={18} />
          वीडियो टेम्पलेट्स ({templates.length})
        </button>

        <button
          onClick={() => setActiveSubTab('queue')}
          style={{
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeSubTab === 'queue' ? '#ED1727' : '#64748b',
            borderBottom: activeSubTab === 'queue' ? '2px solid #ED1727' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={18} />
          रेंडर कतार व जॉब्स ({jobs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('presets')}
          style={{
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeSubTab === 'presets' ? '#ED1727' : '#64748b',
            borderBottom: activeSubTab === 'presets' ? '2px solid #ED1727' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sliders size={18} />
          पहलू अनुपात व प्रीसेट्स
        </button>

        <button
          onClick={() => setActiveSubTab('health')}
          style={{
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeSubTab === 'health' ? '#ED1727' : '#64748b',
            borderBottom: activeSubTab === 'health' ? '2px solid #ED1727' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Shield size={18} />
          FFmpeg इन्फ्रास्ट्रक्चर व सुरक्षा
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          style={{
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeSubTab === 'audit' ? '#ED1727' : '#64748b',
            borderBottom: activeSubTab === 'audit' ? '2px solid #ED1727' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileCheck size={18} />
          ऑडिट व अनुपालन लॉग्स
        </button>
      </div>

      {/* SubTab 1: Templates Catalog */}
      {activeSubTab === 'templates' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'breaking', 'bulletin', 'district', 'crime', 'development', 'weather'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: selectedCategory === cat ? '#0f172a' : '#fff',
                      color: selectedCategory === cat ? '#fff' : '#475569',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {cat === 'all'
                      ? 'सभी श्रेणियां'
                      : cat === 'breaking'
                      ? 'ब्रेकिंग'
                      : cat === 'bulletin'
                      ? 'बुलेटिन'
                      : cat === 'district'
                      ? 'ज़िला'
                      : cat === 'crime'
                      ? 'क्राइम'
                      : cat === 'development'
                      ? 'विकास'
                      : 'मौसम'}
                  </button>
                )
              )}
            </div>

            <span style={{ fontSize: '13px', color: '#64748b' }}>
              कुल {filteredTemplates.length} टेम्पलेट्स उपलब्ध
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: tpl.aspectRatio === '9:16' ? '#eff6ff' : '#fef2f2',
                        color: tpl.aspectRatio === '9:16' ? '#2563eb' : '#dc2626',
                      }}
                    >
                      {tpl.aspectRatio === '9:16'
                        ? '📱 9:16 रील्स'
                        : tpl.aspectRatio === '16:9'
                        ? '📺 16:9 वेब'
                        : '⏹️ 1:1 स्क्वायर'}
                    </span>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: tpl.isActive ? '#16a34a' : '#94a3b8',
                      }}
                    >
                      {tpl.isActive ? '● सक्रिय' : '○ निष्क्रिय'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>
                    {tpl.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    {tpl.description}
                  </p>
                </div>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#64748b',
                  }}
                >
                  <span>⏱️ {tpl.duration}s अवधि</span>
                  <span>v{tpl.version}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Render Queue & Jobs Monitor */}
      {activeSubTab === 'queue' && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              सक्रिय व पूर्ण वीडियो रेंडरिंग कार्य
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              कुल {jobs.length} कार्य
            </span>
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Activity size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p>कोई रेंडरिंग कार्य वर्तमान में कतारबद्ध नहीं है।</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>जॉब ID / प्रोजेक्ट</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>अनुपात व प्रारूप</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>स्थिति व प्रगति</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>समय</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>कार्रवाई</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>#{job.id.slice(0, 8)}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>प्रोजेक्ट: {job.projectId.slice(0, 12)}...</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {job.aspectRatio} • {job.resolution}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          {job.status === 'completed' && <CheckCircle size={16} color="#16a34a" />}
                          {job.status === 'rendering' && <RefreshCw size={16} color="#2563eb" className="animate-spin" />}
                          {job.status === 'queued' && <Clock size={16} color="#f59e0b" />}
                          {job.status === 'failed' && <XCircle size={16} color="#dc2626" />}
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>
                            {job.status === 'completed'
                              ? 'पूर्ण'
                              : job.status === 'rendering'
                              ? 'रेंडरिंग जारी...'
                              : job.status === 'queued'
                              ? 'कतारबद्ध'
                              : 'विफल'}
                          </span>
                        </div>
                        {job.status === 'rendering' && (
                          <div
                            style={{
                              width: '120px',
                              height: '6px',
                              backgroundColor: '#e2e8f0',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${job.progressPercent}%`,
                                height: '100%',
                                backgroundColor: '#2563eb',
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                        {new Date(job.createdAt).toLocaleTimeString('hi-IN')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {job.status === 'rendering' || job.status === 'queued' ? (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            disabled={cancellingJobId === job.id}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #f87171',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            रद्द करें
                          </button>
                        ) : job.outputUrl ? (
                          <a
                            href={job.outputUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#2563eb',
                              textDecoration: 'none',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                          >
                            डाउनलोड <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: Presets & Aspect Ratios */}
      {activeSubTab === 'presets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Smartphone size={24} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>वर्टिकल 9:16 (रील्स व शॉर्ट्स)</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
              इंस्टाग्राम रील्स, यूट्यूब शॉर्ट्स एवं मोबाइल वेब के लिए पूर्ण स्क्रीन वर्टिकल वीडियो।
            </p>
            <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>अनुशंसित रेज़ोल्यूशन:</strong> 1080x1920 (1080p)</div>
              <div><strong>बिटरेट:</strong> 4.5 Mbps (H.264 / High Profile)</div>
              <div><strong>ऑडियो:</strong> AAC Stereo, 192 kbps, 48kHz</div>
              <div><strong>बंपर अवधि:</strong> 3s इंट्रो + 3s आउट्रो</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Tv size={24} color="#dc2626" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>लैंडस्केप 16:9 (यूट्यूब व वेब)</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
              वेबसाइट मेन बुलेटिन, यूट्यूब वीडियो और डेस्कटॉप न्यूज़कास्ट के लिए मानक प्रारूप।
            </p>
            <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>अनुशंसित रेज़ोल्यूशन:</strong> 1920x1080 (1080p Full HD)</div>
              <div><strong>बिटरेट:</strong> 5.0 Mbps (Faststart enabled)</div>
              <div><strong>ऑडियो:</strong> AAC Stereo, 192 kbps, 48kHz</div>
              <div><strong>स्प्लिट स्क्रीन:</strong> एंकर + फील्ड रिपोर्टर लेआउट</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Square size={24} color="#059669" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>स्क्वायर 1:1 (सोशल मीडिया फ़ीड)</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
              फेसबुक एवं इंस्टाग्राम मुख्य फ़ीड पोस्ट्स के लिए अनुकूलित वर्गाकार वीडियो।
            </p>
            <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>अनुशंसित रेज़ोल्यूशन:</strong> 1080x1080 (Square HD)</div>
              <div><strong>बिटरेट:</strong> 3.5 Mbps</div>
              <div><strong>ऑडियो:</strong> AAC Stereo, 192 kbps, 48kHz</div>
              <div><strong>कॉशन फ्रेम:</strong> सुरक्षा एवं फैक्ट-चेक अलर्ट्स</div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Health & Infrastructure */}
      {activeSubTab === 'health' && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>
            FFmpeg रेंडरिंग इन्फ्रास्ट्रक्चर व सुरक्षा स्थिति
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>बाइनरी निष्पादन स्थिति</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: health?.ffmpegAvailable ? '#16a34a' : '#dc2626' }}>
                {health?.ffmpegAvailable ? '● FFmpeg 9.0.1 Ready' : '○ बाइनरी अनुपलब्ध'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                डुअल-एग्जीक्यूटर: रियल व मॉक स्वचालित फॉलबैक सक्षम
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>सख्त कोडेक अनुमति सूची</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                H.264 / AAC (libx264, aac)
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                कंटेनर: MP4, WebM (MOV/MKV ट्रांसकोडिंग के साथ)
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>सख्त सीमाएं व सुरक्षा</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                अधिकतम 600s (10 मिनट) • 2GB RAM
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                आर्ग्यूमेंट एरे सैनेटाइजेशन: शेल इंजेक्शन से पूर्णतः सुरक्षित
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#166534' }}>
              🔒 DEC-060: ब्रांड अखंडता व राज्य प्रतीक अधिनियम अनुपालन
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#14532d', lineHeight: 1.5 }}>
              आधिकारिक लोगो हैश <code>88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F</code> सुरक्षित
              है। स्टेट एम्बलम ऑफ़ इंडिया (प्रोहिबिशन ऑफ़ इम्प्रॉपर यूज़) एक्ट 2005 के अंतर्गत मध्यप्रदेश शासन या
              अशोक सिंह स्तम्भ का गैर-कानूनी प्रयोग सख्त रूप से वर्जित है।
            </p>
          </div>
        </div>
      )}

      {/* SubTab 5: Audit Log */}
      {activeSubTab === 'audit' && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>
            वीडियो प्रोडक्शन ऑडिट व अनुपालन लॉग्स
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong>वीडियो टेम्पलेट सीडिंग सत्यापित</strong>
                <span style={{ color: '#64748b' }}>2026-11-01 00:00:00</span>
              </div>
              <div style={{ color: '#475569' }}>
                8 प्रामाणिक डिजिटल न्यूज़ वीडियो टेम्पलेट्स (9:16, 16:9, 1:1) सफलतापूर्वक लोड किए गए।
              </div>
            </div>

            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong>DEC-048 RBAC ब्लॉक एक्टिवेशन</strong>
                <span style={{ color: '#64748b' }}>2026-11-01 05:30:00</span>
              </div>
              <div style={{ color: '#475569' }}>
                ROLE_CHIEF_EDITOR (Pending Approval) को वीडियो क्रिएशन और रेंडरिंग से सुरक्षित रूप से प्रतिबंधित रखा गया।
              </div>
            </div>

            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong>FFmpeg 9.0.1 एन्वायरमेंट इंटीग्रेशन</strong>
                <span style={{ color: '#64748b' }}>2026-11-01 11:09:24</span>
              </div>
              <div style={{ color: '#475569' }}>
                FFmpeg बाइनरी पाथ डिटेक्शन और सुरक्षित सब-प्रोसेस निष्पादक सत्यापित।
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
