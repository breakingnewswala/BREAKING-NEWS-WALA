/**
 * BREAKING NEWS WALA — Admin Control Panel: Graphics & Design Studio Management Suite
 * Grounded in docs/07-Design.md, docs/12-Database.md (DOM-H), and docs/DECISIONS.md (DEC-048, DEC-060)
 */

import React, { useState, useEffect } from 'react';
import {
  fetchDesignTemplates,
  publishDesignTemplate,
  archiveDesignTemplate,
  fetchAdminBrandProfile,
  fetchRecentAdminDesigns,
  fetchDesignStats,
} from '../lib/api';
import {
  AdminDesignTemplateItem,
  AdminBrandProfile,
  AdminRecentDesignItem,
  AdminDesignStats,
} from '../types';
import {
  Palette,
  Layers,
  ShieldCheck,
  LayoutGrid,
  Clock,
  Eye,
  CheckCircle,
  Archive,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const DesignManagementView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'brand' | 'presets' | 'permissions' | 'exports'>('templates');
  const [stats, setStats] = useState<AdminDesignStats | null>(null);
  const [templates, setTemplates] = useState<AdminDesignTemplateItem[]>([]);
  const [brandProfile, setBrandProfile] = useState<AdminBrandProfile | null>(null);
  const [recentDesigns, setRecentDesigns] = useState<AdminRecentDesignItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<AdminDesignTemplateItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tplData, brandData, designsData, statsData] = await Promise.all([
        fetchDesignTemplates(selectedCategory !== 'all' ? selectedCategory : undefined),
        fetchAdminBrandProfile(),
        fetchRecentAdminDesigns(),
        fetchDesignStats(),
      ]);
      setTemplates(tplData);
      setBrandProfile(brandData);
      setRecentDesigns(designsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load design management data:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleToggleTemplateStatus = async (tpl: AdminDesignTemplateItem) => {
    try {
      if (tpl.isActive) {
        await archiveDesignTemplate(tpl.id);
        setActionMessage(`टेम्पलेट "${tpl.name}" को सफलतापूर्वक संग्रहीत (अक्रिय) कर दिया गया।`);
      } else {
        await publishDesignTemplate(tpl.id);
        setActionMessage(`टेम्पलेट "${tpl.name}" को सफलतापूर्वक प्रकाशित व सक्रिय कर दिया गया।`);
      }
      await loadData();
    } catch (err: any) {
      alert(`स्थिति परिवर्तन विफल: ${err?.message}`);
    }
  };

  const categories = [
    { id: 'all', label: 'सभी श्रेणियां' },
    { id: 'breaking', label: 'ब्रेकिंग अलर्ट्स (16:9)' },
    { id: 'youtube_thumb', label: 'यूट्यूब थंबनेल (16:9)' },
    { id: 'social_story', label: 'शॉर्ट्स व स्टोरीज़ (9:16)' },
    { id: 'district', label: 'ज़िला रिपोर्ट (4:5)' },
    { id: 'quote', label: 'कोट व बयान (1:1)' },
    { id: 'data_stat', label: 'आंकड़े व इंफ़ोग्राफ़िक्स' },
  ];

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette size={26} color="#ED1727" />
            ग्राफ़िक्स, थंबनेल व टेम्पलेट प्रबंधन
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            मास्टर टेम्पलेट लाइब्रेरी, ब्रांड संपत्तियां, पहलू अनुपात प्रीसेट एवं निर्यात शासन (DOM-H, DEC-060)
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            color: '#334155',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          ताज़ा करें
        </button>
      </div>

      {actionMessage && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', color: '#065F46', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', fontWeight: 800 }}>×</button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', borderLeft: '4px solid #344FD6' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>कुल टेम्पलेट्स</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{stats?.totalTemplates || templates.length}</div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>{stats?.activeTemplates || templates.filter(t => t.isActive).length} सक्रिय</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', borderLeft: '4px solid #ED1727' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>सक्रिय मास्टर फ्रेम्स</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{templates.filter(t => t.isActive).length}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>न्यूज़रूम व रिपोर्टर हेतु लाइव</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>निर्मित डिज़ाइन प्रोजेक्ट्स</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{stats?.totalDesignsCreated || recentDesigns.length}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>डेस्क व फील्ड संपादन</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>ब्रांड सुरक्षा स्थिति</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#10B981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={18} /> सुरक्षित (DEC-060)
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>प्रतीक अधिनियम 2005 मान्य</div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', marginBottom: '24px' }}>
        {[
          { key: 'templates', label: 'टेम्पलेट प्रबंधक', icon: Layers },
          { key: 'brand', label: 'ब्रांड संपत्तियां व नियम', icon: ShieldCheck },
          { key: 'presets', label: 'पहलू अनुपात प्रीसेट', icon: LayoutGrid },
          { key: 'permissions', label: 'भूमिका व अधिकार', icon: Lock },
          { key: 'exports', label: 'हाल के डिज़ाइन व निर्यात', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: isActive ? '#ED1727' : '#64748B',
                borderBottom: isActive ? '3px solid #ED1727' : '3px solid transparent',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab 1: Template Manager */}
      {activeSubTab === 'templates' && (
        <div>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedCategory === c.id ? '1px solid #ED1727' : '1px solid #CBD5E1',
                  backgroundColor: selectedCategory === c.id ? '#FEE2E2' : '#FFFFFF',
                  color: selectedCategory === c.id ? '#991B1B' : '#475569',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header Card */}
                <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#334155', textTransform: 'uppercase' }}>
                      {tpl.dimensions.aspectRatio}
                    </span>
                    <h3 style={{ margin: '8px 0 0', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{tpl.name}</h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: tpl.isActive ? '#DCFCE7' : '#F1F5F9',
                      color: tpl.isActive ? '#166534' : '#64748B',
                    }}
                  >
                    {tpl.isActive ? 'सक्रिय' : 'संग्रहीत'}
                  </span>
                </div>

                {/* Body info */}
                <div style={{ padding: '16px', flex: 1 }}>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
                    {tpl.description}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748B' }}>
                    <span>रिज़ॉल्यूशन: <strong>{tpl.dimensions.width}×{tpl.dimensions.height}</strong></span>
                    <span>•</span>
                    <span>संस्करण: <strong>v{tpl.version}</strong></span>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setPreviewTemplate(tpl)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#344FD6', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Eye size={14} /> पूर्वावलोकन
                  </button>
                  <button
                    onClick={() => handleToggleTemplateStatus(tpl)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: tpl.isActive ? '#FEF2F2' : '#EFF6FF',
                      color: tpl.isActive ? '#991B1B' : '#1E40AF',
                    }}
                  >
                    {tpl.isActive ? <><Archive size={12} /> संग्रहीत करें</> : <><CheckCircle size={12} /> प्रकाशित करें</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Brand Assets & Rules */}
      {activeSubTab === 'brand' && brandProfile && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          {/* Statutory Emblem Warning Banner */}
          <div style={{ padding: '14px 18px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', color: '#92400E', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>सांविधिक दिशा-निर्देश (State Emblem of India Act 2005 / DEC-060):</strong>
              <div style={{ marginTop: '4px' }}>
                किसी भी ग्राफिक्स, थंबनेल अथवा सोशल मीडिया कार्ड में मध्यप्रदेश शासन का आधिकारिक राज्य प्रतीक (अशोक सिंह शीर्ष मुहर) जोड़ना पूर्णतः प्रतिबंधित है। केवल ब्रेकिंग न्यूज़ वाला का अधिकृत चैनल लोगो ही मान्य है।
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>अधिकृत चैनल लोगो व पहचान</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#F8FAFC' }}>
              <img src={brandProfile.logoUrl} alt="Official Logo" style={{ height: '60px', objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{brandProfile.channelNameHi}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', marginTop: '4px' }}>
                  SHA-256: {brandProfile.logoHash.slice(0, 16)}...
                </div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>✓ अधिकृत एवं सत्यापित</div>
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>कैनोनिकल ट्राई-कलर पैलेट (DEC-057)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'प्राइमरी येलो (Ticker/Badge)', hex: brandProfile.primaryYellow, textDark: true },
              { label: 'प्राइमरी रेड (Breaking Ribbon)', hex: brandProfile.primaryRed, textDark: false },
              { label: 'प्राइमरी ब्लू (Interactive/Link)', hex: brandProfile.primaryBlue, textDark: false },
              { label: 'चारकोल (Headline/Body)', hex: brandProfile.charcoal, textDark: false },
              { label: 'मिडनाइट (Masthead)', hex: brandProfile.midnight, textDark: false },
              { label: 'प्योर व्हाइट (Canvas)', hex: brandProfile.pureWhite, textDark: true },
            ].map((c) => (
              <div key={c.hex} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ height: '70px', backgroundColor: c.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textDark ? '#000000' : '#FFFFFF', fontWeight: 900, fontSize: '13px' }}>
                  {c.hex}
                </div>
                <div style={{ padding: '8px 10px', backgroundColor: '#FFFFFF', fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>अनुमोदित फ़ॉन्ट पदानुक्रम (DEC-059)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>मुख्य शीर्षक (HEADLINE DISPLAY)</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', fontFamily: 'Rozha One, serif', marginTop: '6px' }}>
                Rozha One (रोज़ा वन)
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>उच्च प्रभावयुक्त हिंदी देवनागरी हेडलाइंस</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>मूल पाठ व उप-शीर्षक (BODY VERNACULAR)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', fontFamily: 'Noto Sans Devanagari, sans-serif', marginTop: '6px' }}>
                Noto Sans Devanagari
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>सुगम पठन, मात्रों का सुरक्षित 1.75 अनुपात</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>संख्या व अंग्रेजी (NUMBERS & METRICS)</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', fontFamily: 'Inter, sans-serif', marginTop: '6px' }}>
                Inter Sans-Serif
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>स्पष्ट सांख्यिकी एवं दिनांक प्रदर्शन</div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Presets */}
      {activeSubTab === 'presets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            { name: 'यूट्यूब थंबनेल', ratio: '16:9', res: '1280×720', desc: 'यूट्यूब लैंडस्केप वीडियो कवर्स हेतु मानक आकार।' },
            { name: 'यूट्यूब शॉर्ट्स / रील्स', ratio: '9:16', res: '1080×1920', desc: 'फुल-स्क्रीन मोबाइल वीडियो कवर्स एवं स्टोरीज़।' },
            { name: 'इंस्टाग्राम पोर्ट्रेट', ratio: '4:5', res: '1080×1350', desc: 'इंस्टाग्राम फ़ीड में अधिकतम दृश्य स्थान प्राप्त करने हेतु।' },
            { name: 'इंस्टाग्राम स्क्वायर', ratio: '1:1', res: '1080×1080', desc: 'क्लासिक 1:1 स्क्वायर पोस्ट, कोट कार्ड एवं इंफ़ोग्राफ़िक्स।' },
            { name: 'फ़ेसबुक पोस्ट', ratio: '16:9', res: '1200×630', desc: 'फ़ेसबुक फ़ीड में लिंक शेयरिंग व समाचार फ़ोटो।' },
            { name: 'एक्स / ट्विटर पोस्ट', ratio: '16:9', res: '1200×675', desc: 'एक्स प्लेटफॉर्म पर ब्रेकिंग अलर्ट्स एवं न्यूज़ कार्ड।' },
            { name: 'एक्स / ट्विटर हेडर', ratio: 'custom', res: '1500×500', desc: 'चैनल प्रोफाइल हेडर बैनर।' },
          ].map((preset) => (
            <div key={preset.name} style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{preset.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1E40AF' }}>
                  {preset.ratio}
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#ED1727', margin: '6px 0' }}>{preset.res}</div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>{preset.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab 4: Permissions */}
      {activeSubTab === 'permissions' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>सिस्टम भूमिका (Role)</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>डिज़ाइन निर्माण</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>टेम्पलेट निर्माण / संपादन</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>टेम्पलेट प्रकाशन / संग्रह</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>हाई-रिज़ॉल्यूशन निर्यात</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: 'सुपर व्यवस्थापक (super_admin)', create: true, tplEdit: true, tplPub: true, hiRes: true },
                { role: 'प्लेटफ़ॉर्म व्यवस्थापक (admin)', create: true, tplEdit: true, tplPub: true, hiRes: true },
                { role: 'डेस्क संपादक (editor / desk_editor)', create: true, tplEdit: true, tplPub: true, hiRes: true },
                { role: 'फ़ील्ड रिपोर्टर (reporter / stringer)', create: true, tplEdit: false, tplPub: false, hiRes: false },
                { role: 'मुख्य संपादक (ROLE_CHIEF_EDITOR)', pending: true },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: row.pending ? '#FEF2F2' : '#FFFFFF' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: row.pending ? '#991B1B' : '#0F172A' }}>
                    {row.role}
                  </td>
                  {row.pending ? (
                    <td colSpan={4} style={{ padding: '12px 16px', color: '#991B1B', fontWeight: 700, fontSize: '12px' }}>
                      DEC-048: भूमिका लंबित अनुमोदन (Pending Approval) — समस्त अधिकार अवरुद्ध हैं।
                    </td>
                  ) : (
                    <>
                      <td style={{ padding: '12px 16px', color: row.create ? '#10B981' : '#EF4444', fontWeight: 800 }}>
                        {row.create ? '✓ मान्य' : '✗ वर्जित'}
                      </td>
                      <td style={{ padding: '12px 16px', color: row.tplEdit ? '#10B981' : '#EF4444', fontWeight: 800 }}>
                        {row.tplEdit ? '✓ मान्य' : '✗ वर्जित'}
                      </td>
                      <td style={{ padding: '12px 16px', color: row.tplPub ? '#10B981' : '#EF4444', fontWeight: 800 }}>
                        {row.tplPub ? '✓ मान्य' : '✗ वर्जित'}
                      </td>
                      <td style={{ padding: '12px 16px', color: row.hiRes ? '#10B981' : '#64748B', fontWeight: 800 }}>
                        {row.hiRes ? '✓ 3x तक' : '1x मानक'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-tab 5: Recent Exports */}
      {activeSubTab === 'exports' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>डिज़ाइन शीर्षक</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>स्टूडियो प्रकार</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>पहलू अनुपात</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>स्थिति</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>अद्यतन समय</th>
              </tr>
            </thead>
            <tbody>
              {recentDesigns.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                    कोई हालिया डिज़ाइन गतिविधि उपलब्ध नहीं है।
                  </td>
                </tr>
              ) : (
                recentDesigns.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>{d.title}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textTransform: 'capitalize' }}>{d.studioType}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{d.aspectRatio}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: d.status === 'published' ? '#DCFCE7' : '#F1F5F9', color: d.status === 'published' ? '#166534' : '#64748B' }}>
                        {d.status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '12px' }}>
                      {new Date(d.updatedAt).toLocaleString('hi-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', maxWidth: '700px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{previewTemplate.name} — लेआउट संरचना</div>
              <button onClick={() => setPreviewTemplate(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '20px', color: '#FFFFFF', marginBottom: '16px', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ padding: '4px 10px', backgroundColor: '#ED1727', borderRadius: '4px', fontSize: '11px', fontWeight: 800, marginBottom: '12px' }}>
                  {previewTemplate.dimensions.aspectRatio} PREVIEW
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'Rozha One, serif', color: '#FDE900', maxWidth: '480px' }}>
                  {previewTemplate.description}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                <div>पहलू अनुपात: <strong>{previewTemplate.dimensions.aspectRatio} ({previewTemplate.dimensions.width}×{previewTemplate.dimensions.height}px)</strong></div>
                <div style={{ marginTop: '4px' }}>श्रेणी: <strong>{previewTemplate.category}</strong></div>
                <div style={{ marginTop: '4px' }}>स्थिति: <strong>{previewTemplate.isActive ? 'सक्रिय' : 'अक्रिय'}</strong></div>
              </div>
            </div>
            <div style={{ padding: '12px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setPreviewTemplate(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
