import React from 'react';
import { Home, PlusCircle, FileText, History, User } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  draftCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onNavigate,
  draftCount = 0,
}) => {
  const navItems = [
    { label: 'डैशबोर्ड', route: '#/dashboard', icon: Home },
    { label: 'नई खबर', route: '#/news/create', icon: PlusCircle, highlight: true },
    { label: 'ड्राफ्ट', route: '#/news/drafts', icon: FileText, badge: draftCount },
    { label: 'इतिहास', route: '#/news/history', icon: History },
    { label: 'प्रोफ़ाइल', route: '#/profile', icon: User },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="मुख्य मोबाइल नेविगेशन">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          currentRoute === item.route ||
          (item.route === '#/news/history' && currentRoute.startsWith('#/news/view')) ||
          (item.route === '#/news/create' && currentRoute.startsWith('#/news/edit'));

        return (
          <button
            key={item.route}
            type="button"
            onClick={() => onNavigate(item.route)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            style={
              item.highlight
                ? {
                    color: isActive ? '#ED1727' : '#1F2937',
                    fontWeight: 700,
                  }
                : undefined
            }
          >
            <div style={{ position: 'relative' }}>
              <Icon
                size={item.highlight ? 22 : 20}
                color={isActive ? '#ED1727' : item.highlight ? '#111827' : '#64748B'}
              />
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    backgroundColor: '#ED1727',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    fontWeight: 700,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;

