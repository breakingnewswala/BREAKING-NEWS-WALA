import React, { useState } from 'react';
import { LogIn, AlertCircle, Shield } from 'lucide-react';
import { loginNewsroom } from '../lib/api';
import { EditorialUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: EditorialUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('कृपया अधिकृत ईमेल/मोबाइल और गोपनीय पासवर्ड दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await loginNewsroom(identifier.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'लॉगिन विफल रहा। कृपया अपने संपादकीय क्रेडेंशियल्स की जांच करें।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#0F172A',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px 28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Brand Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <img
            src="/brand/logo.png"
            alt="BREAKING NEWS WALA"
            style={{ height: '48px', width: 'auto', margin: '0 auto 14px auto', display: 'block' }}
          />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: '20px', color: '#1E40AF', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Shield size={13} />
            <span>सेंट्रल संपादकीय नियंत्रण डेस्क</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            न्यूज़रूम एडिटर लॉगिन
          </h1>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            मध्य प्रदेश के 55 जिलों से आने वाली खबरों की तथ्य-जांच व प्रकाशन डेस्क
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#991B1B',
              fontSize: '12px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
              पंजीकृत संपादकीय ईमेल अथवा मोबाइल नंबर
            </label>
            <input
              type="text"
              autoComplete="username"
              placeholder="उदा. editor@breakingnewswala.in"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="filter-input"
              style={{ width: '100%', padding: '10px 14px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
              गोपनीय पासवर्ड
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="filter-input"
              style={{ width: '100%', padding: '10px 14px' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', backgroundColor: '#344FD6' }}
          >
            <LogIn size={16} />
            <span>{isLoading ? 'संपादकीय क्रेडेंशियल्स सत्यापित हो रहे हैं...' : 'सेंट्रल न्यूज़रूम में प्रवेश करें'}</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', textAlign: 'center', fontSize: '11px', color: '#64748B' }}>
          <p>यह केवल अधिकृत डेस्क संपादकों व प्रकाशकों के लिए सुरक्षित क्षेत्र है।</p>
          <p style={{ marginTop: '4px', fontWeight: 600 }}>
            तकनीकी सहायता: desk@breakingnewswala.in
          </p>
        </div>
      </div>
    </div>
  );
};

