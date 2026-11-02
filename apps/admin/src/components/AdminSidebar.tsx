import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  UserCheck,
  MapPin,
  FileSpreadsheet,
  Settings,
  Bot,
  Palette,
  Video,
  Rss,
  Share2,
  BadgeIndianRupee,
  TrendingUp,
  Globe,
  Newspaper,
  ShieldCheck,
  X,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'reporters'
  | 'territory'
  | 'ai'
  | 'design'
  | 'video'
  | 'automation'
  | 'integrations'
  | 'monetization'
  | 'analytics'
  | 'seo'
  | 'epaper'
  | 'security'
  | 'audit'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  isOpen: boolean;
  onSelectTab: (tab: AdminTab) => void;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  isOpen,
  onSelectTab,
  onCloseMobile,
}) => {
  const menuItems: Array<{ tab: AdminTab; label: string; icon: React.ElementType }> = [
    { tab: 'dashboard', label: 'डैशबोर्ड ओवरव्यू', icon: LayoutDashboard },
    { tab: 'users', label: 'उपयोगकर्ता प्रबंधन', icon: Users },
    { tab: 'roles', label: 'भूमिका व RBAC नियम', icon: Shield },
    { tab: 'reporters', label: 'रिपोर्टर सत्यापन व सूची', icon: UserCheck },
    { tab: 'territory', label: 'क्षेत्राधिकार व बीट आवंटन', icon: MapPin },
    { tab: 'ai', label: 'AI एजेंट व MCP प्रबंधन', icon: Bot },
    { tab: 'design', label: 'डिज़ाइन व टेम्पलेट प्रबंधन', icon: Palette },
    { tab: 'video', label: 'वीडियो व FFmpeg रेंडरर', icon: Video },
    { tab: 'automation', label: 'RSS व न्यूज़ ऑटोमेशन', icon: Rss },
    { tab: 'integrations', label: 'API पूल व सोशल मीडिया', icon: Share2 },
    { tab: 'monetization', label: 'व्यावसायिक व मुद्रीकरण', icon: BadgeIndianRupee },
    { tab: 'analytics', label: 'ऑडियंस व एनालिटिक्स', icon: TrendingUp },
    { tab: 'seo', label: 'SEO व सर्च कंसोल', icon: Globe },
    { tab: 'epaper', label: 'ई-पेपर प्रबंधन', icon: Newspaper },
    { tab: 'security', label: 'सुरक्षा व बैकअप डेस्क', icon: ShieldCheck },
    { tab: 'audit', label: 'प्रशासकीय ऑडिट लॉग', icon: FileSpreadsheet },
    { tab: 'settings', label: 'सिस्टम व प्लेटफ़ॉर्म सेटिंग्स', icon: Settings },
  ];

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>प्लेटफ़ॉर्म प्रशासन</div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>म.प्र. डिजिटल न्यूज़ डेस्क</div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
          }}
          className="lg-hidden"
          aria-label="मेन्यू बंद करें"
        >
          <X size={18} />
        </button>
      </div>

      <nav style={{ padding: '12px 0', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => handleSelect(item.tab)}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} color={isActive ? '#ED1727' : '#94A3B8'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #334155',
          fontSize: '11px',
          color: '#64748B',
        }}
      >
        BREAKING NEWS WALA v1.0
        <div style={{ fontSize: '10px', marginTop: '2px' }}>सिंगल शेयर्ड बैकएंड इंजन (DEC-011)</div>
      </div>
    </aside>
  );
};

