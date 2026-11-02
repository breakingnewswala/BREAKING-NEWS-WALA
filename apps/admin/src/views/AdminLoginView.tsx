import React, { useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { loginAdmin } from '../lib/api';
import { AdminUser } from '../types';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('कृपया फ़ोन नंबर/ईमेल और पासवर्ड दोनों दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await loginAdmin(identifier.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'लॉगिन विफल रहा। कृपया अपने क्रेडेंशियल्स की जांच करें।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#020617',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '36px 30px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/brand/logo.png"
            alt="BREAKING NEWS WALA"
            style={{ height: '52px', width: 'auto', margin: '0 auto 16px auto', display: 'block' }}
          />
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            एडमिन कंट्रोल पैनल
          </h1>
          <p style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>
            प्लेटफ़ॉर्म प्रशासन, उपयोगकर्ता प्रबंधन एवं रिपोर्टर सत्यापन
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              fontSize: '12.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              फ़ोन नंबर अथवा ईमेल आईडी (Identifier)
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. admin@breakingnewswala.com"
              className="form-input"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              पासवर्ड (Security Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="form-input"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              justifyContent: 'center',
              padding: '11px',
              fontSize: '13.5px',
              marginTop: '8px',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? (
              <span>प्रमाणीकरण हो रहा है...</span>
            ) : (
              <>
                <span>सुरक्षित एडमिन लॉगिन करें</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #1E293B',
            textAlign: 'center',
            fontSize: '11px',
            color: '#64748B',
          }}
        >
          केवल अधिकृत सिस्टम सुपर-एडमिन व एडमिनिस्ट्रेटर्स हेतु अधिकृत (ROLE-ADM-001)
        </div>
      </div>
    </div>
  );
};
