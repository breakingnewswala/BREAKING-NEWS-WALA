import React from 'react';
import { Wifi, WifiOff, LogOut, User as UserIcon } from 'lucide-react';
import { ReporterUser } from '../types';

interface BrandHeaderProps {
  user: ReporterUser | null;
  isOnline: boolean;
  onLogout: () => void;
  onNavigate: (route: string) => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  user,
  isOnline,
  onLogout,
  onNavigate,
}) => {
  return (
    <header className="reporter-header" role="banner">
      <div className="reporter-header-inner">
        {/* Left: Brand Logo */}
        <div
          onClick={() => onNavigate('#/dashboard')}
          className="flex items-center gap-2 cursor-pointer"
          title="डैशबोर्ड पर जाएं"
        >
          <img
            src="/brand/logo.png"
            alt="BREAKING NEWS WALA"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#ED1727',
              color: '#FFFFFF',
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.5px',
            }}
          >
            रिपोर्टर
          </span>
        </div>

        {/* Right: Network Status & User Dock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Online/Offline Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: isOnline ? '#DCFCE7' : '#FEE2E2',
              color: isOnline ? '#15803D' : '#B91C1C',
            }}
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOnline ? 'ऑनलाइन' : 'ऑफ़लाइन'}</span>
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => onNavigate('#/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <UserIcon size={14} color="#ED1727" />
                <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.fullName || 'संवाददाता'}
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                title="लॉगआउट करें"
                aria-label="लॉगआउट"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default BrandHeader;

