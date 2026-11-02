import React, { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';
import { loginReporter } from '../lib/api';
import { ReporterUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: ReporterUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('कृपया मोबाइल नंबर/ईमेल और पासवर्ड दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await loginReporter(identifier.trim(), password);
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'लॉगिन विफल रहा। कृपया अपनी क्रेडेंशियल्स की जांच करें।');
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
        backgroundColor: '#F8FAFC',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Brand Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/brand/logo.png"
            alt="BREAKING NEWS WALA"
            style={{ height: '48px', width: 'auto', margin: '0 auto 12px auto', display: 'block' }}
          />
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
            संवाददाता लॉगिन पोर्टल
          </h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            मध्य प्रदेश के 55 जिलों से डिजिटल ग्राउंड रिपोर्टिंग
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
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reporter-identifier">
              मोबाइल नंबर या पंजीकृत ईमेल ID
            </label>
            <input
              id="reporter-identifier"
              type="text"
              autoComplete="username"
              placeholder="उदा. 9826012345 या reporter@bnw.in"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reporter-password">
              गोपनीय पासवर्ड
            </label>
            <input
              id="reporter-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            <LogIn size={18} />
            <span>{isLoading ? 'सत्यापन हो रहा है...' : 'रिपोर्टर पोर्टल में प्रवेश करें'}</span>
          </button>
        </form>

        {/* Help & Accreditation Notice */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #F1F5F9',
            textAlign: 'center',
            fontSize: '11px',
            color: '#64748B',
          }}
        >
          <p>
            प्रेस अधिमान्यता व तकनीकी सहायता हेतु न्यूज़रूम डेस्क से संपर्क करें।
          </p>
          <p style={{ marginTop: '4px', fontWeight: 600 }}>
            संपादकीय संपर्क: desk@breakingnewswala.in
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

