import React, { useEffect, useState } from 'react';
import { LogOut, MapPin, ShieldCheck, QrCode, Phone, Mail } from 'lucide-react';
import { ReporterUser, TerritoryAssignment } from '../types';
import { fetchMyTerritories } from '../lib/api';

interface ProfileViewProps {
  user: ReporterUser;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout }) => {
  const [territories, setTerritories] = useState<TerritoryAssignment[]>([]);

  useEffect(() => {
    async function loadTerritories() {
      try {
        const data = await fetchMyTerritories();
        setTerritories(data);
      } catch {
        // Fallback
      }
    }
    loadTerritories();
  }, []);

  return (
    <div className="reporter-container">
      {/* 1. Digital Press Accreditation ID Card */}
      <div
        className="reporter-card"
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: '#FFFFFF',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', backgroundColor: 'rgba(253, 233, 0, 0.2)', color: '#FDE900', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              डिजिटल प्रेस पहचान पत्र (Digital Press ID)
            </span>
            <h1 style={{ fontSize: '20px', fontWeight: 800, marginTop: '6px' }}>
              {user.fullName || 'अधिकृत संवाददाता'}
            </h1>
            <p style={{ fontSize: '12px', color: '#C7D2FE' }}>
              BREAKING NEWS WALA मीडिया नेटवर्क
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QrCode size={48} color="#1E1B4B" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '11px', color: '#E0E7FF', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div>
            <span style={{ color: '#A5B4FC', display: 'block' }}>प्रेस आईडी:</span>
            <span style={{ fontWeight: 700, fontFamily: 'Inter, monospace' }}>
              BNW-REP-{user.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div>
            <span style={{ color: '#A5B4FC', display: 'block' }}>सत्यापन स्थिति:</span>
            <span style={{ fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ShieldCheck size={13} />
              सक्रिय एवं अधिकृत
            </span>
          </div>
        </div>
      </div>

      {/* 2. Contact & Roles */}
      <div className="reporter-card">
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>
          व्यक्तिगत एवं खाता विवरण
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          {user.phoneNumber && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
              <Phone size={16} color="#ED1727" />
              <span>{user.phoneNumber}</span>
            </div>
          )}

          {user.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
              <Mail size={16} color="#ED1727" />
              <span>{user.email}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
            <span style={{ fontWeight: 600 }}>भूमिका (Roles):</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {user.roles.map((r, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: '#F1F5F9',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#334155',
                  }}
                >
                  {String(r).replace('ROLE_', '')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Assigned Territory Breakdown */}
      <div className="reporter-card">
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={16} color="#ED1727" />
          <span>अधिकृत कार्यक्षेत्र (Assigned Coverage Territory)</span>
        </h2>
        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
          संपादकीय नियमों के अनुसार आप केवल अपने अधिकृत जिले में ही समाचार दर्ज करने हेतु अधिकृत हैं।
        </p>

        {territories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {territories.map((t) => (
              <div
                key={t.districtId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>
                    📍 {t.districtNameHi}
                  </span>
                  {t.divisionNameHi && (
                    <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>
                      ({t.divisionNameHi} संभाग)
                    </span>
                  )}
                </div>

                {t.isPrimary && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                    प्राथमिक जिला
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', fontSize: '12px', color: '#64748B' }}>
            मुख्यालय स्तर: {user.homeDistrictId || 'समस्त मध्य प्रदेश'}
          </div>
        )}
      </div>

      {/* 4. Logout Action */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ width: '100%', borderColor: '#FCA5A5', color: '#DC2626' }}
        >
          <LogOut size={16} />
          <span>पोर्टल से लॉगआउट करें</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileView;

