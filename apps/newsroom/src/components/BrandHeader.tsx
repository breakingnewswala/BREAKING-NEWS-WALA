import React from 'react';
import { Menu, LogOut, ShieldCheck, Clock } from 'lucide-react';
import { EditorialUser } from '../types';

interface BrandHeaderProps {
  user: EditorialUser;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  user,
  onLogout,
  onToggleSidebar,
}) => {
  const currentDate = new Date().toLocaleDateString('hi-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Display highest elevated role
  const primaryRole = (user.roles || [])[0] || 'ROLE_EDITOR';
  const roleDisplay = primaryRole.replace(/^ROLE_/, '').replace(/_/g, ' ');

  return (
    <header className="newsroom-header">
      <div className="header-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="mobile-toggle"
          aria-label="नेविगेशन मेन्यू खोलें"
        >
          <Menu size={20} />
        </button>

        <div className="live-indicator">
          <span className="live-pulse" />
          <span>लाइव संपादकीय डेस्क</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
          <Clock size={13} />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="user-badge">
          <ShieldCheck size={16} color="#344FD6" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              {user.fullName || 'संपादक'}
            </span>
            <span className="role-pill" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
              {roleDisplay}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="btn btn-secondary btn-sm"
          title="लॉगआउट"
        >
          <LogOut size={14} />
          <span>लॉगआउट</span>
        </button>
      </div>
    </header>
  );
};

