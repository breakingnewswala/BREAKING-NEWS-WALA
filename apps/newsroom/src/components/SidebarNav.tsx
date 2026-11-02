import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Zap,
  FileCheck2,
  RotateCcw,
  Activity,
  Archive,
  Palette,
  Video,
  Bot,
  Share2,
  X,
  ExternalLink,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'queue'
  | 'breaking'
  | 'my-claims'
  | 'revisions'
  | 'activity'
  | 'published'
  | 'studio'
  | 'video-studio'
  | 'ai-newsroom'
  | 'social-publish';

export interface SidebarNavProps {
  currentRoute: string;
  isOpen: boolean;
  onNavigate: (route: string) => void;
  onCloseMobile: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentRoute,
  isOpen,
  onNavigate,
  onCloseMobile,
}) => {
  const menuItems = [
    { route: '#/dashboard', label: 'डैशबोर्ड ओवरव्यू', icon: LayoutDashboard },
    { route: '#/queue', label: 'समाचार समीक्षा कतार', icon: Inbox },
    { route: '#/breaking', label: 'ब्रेकिंग न्यूज़ डेस्क', icon: Zap },
    { route: '#/studio', label: 'ग्राफ़िक्स व थंबनेल स्टूडियो', icon: Palette },
    { route: '#/video-studio', label: 'वीडियो प्रोडक्शन स्टूडियो', icon: Video },
    { route: '#/ai-newsroom', label: 'AI न्यूज़रूम व RSS', icon: Bot },
    { route: '#/social-publish', label: 'सोशल मीडिया डेस्क', icon: Share2 },
    { route: '#/my-claims', label: 'मेरे समीक्षाधीन आलेख', icon: FileCheck2 },
    { route: '#/revisions', label: 'संशोधन अनुरोध सूची', icon: RotateCcw },
    { route: '#/activity', label: 'संपादकीय गतिविधि', icon: Activity },
    { route: '#/published', label: 'प्रकाशित अभिलेखागार', icon: Archive },
  ];

  const handleSelect = (route: string) => {
    onNavigate(route);
    onCloseMobile();
  };

  return (
    <aside className={`newsroom-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img src="/brand/logo.png" alt="BREAKING NEWS WALA" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="desk-title">सेंट्रल न्यूज़रूम</div>
          <div className="desk-subtitle">मध्यप्रदेश डिजिटल डेस्क</div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="mobile-toggle"
          style={{ color: '#94A3B8', marginLeft: 'auto' }}
          aria-label="मेन्यू बंद करें"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentRoute === item.route ||
            (item.route === '#/queue' && currentRoute.startsWith('#/queue'));
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleSelect(item.route)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#94A3B8',
            fontSize: '11px',
            textDecoration: 'none',
            padding: '8px 10px',
            borderRadius: '6px',
            backgroundColor: '#1E293B',
          }}
        >
          <span>पब्लिक न्यूज़ पोर्टल देखें</span>
          <ExternalLink size={12} />
        </a>
        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '10px', textAlign: 'center' }}>
          BREAKING NEWS WALA © 2026<br />संपादकीय सत्यनिष्ठा व प्रेस आचार संहिता
        </div>
      </div>
    </aside>
  );
};
