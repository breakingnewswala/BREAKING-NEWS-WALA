import React from 'react';
import { Menu, LogOut, ShieldCheck, Clock } from 'lucide-react';
import { AdminUser } from '../types';

interface AdminHeaderProps {
  user: AdminUser;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
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

  return (
    <header className="admin-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="मेन्यू खोलें"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/brand/logo.png"
            alt="BREAKING NEWS WALA"
            style={{ height: '32px', width: 'auto', display: 'block' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>
            एडमिन कंट्रोल पैनल
          </span>
        </div>

        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#94A3B8',
            marginLeft: '12px',
          }}
          className="md-flex"
        >
          <Clock size={13} />
          <span>{currentDate}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#344FD6" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
              {user.fullName || 'सिस्टम एडमिनिस्ट्रेटर'}
            </span>
            <span style={{ fontSize: '10.5px', color: '#4ADE80', fontWeight: 600 }}>
              प्रशासकीय सत्र सक्रिय
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: '#475569' }}
        >
          <LogOut size={13} />
          <span>लॉगआउट</span>
        </button>
      </div>
    </header>
  );
};
