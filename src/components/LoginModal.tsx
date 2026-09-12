import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle, Sparkles, LogIn, CheckCircle2 } from 'lucide-react';

export interface ReporterUser {
  username: string;
  name: string;
  role: 'reporter' | 'admin' | 'bureau';
  district?: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: ReporterUser) => void;
}

// Default pre-configured accounts
const DEFAULT_ACCOUNTS: Record<string, { pass: string; user: ReporterUser }> = {
  reporter: {
    pass: 'news2026',
    user: {
      username: 'reporter',
      name: 'फील्ड रिपोर्टर (Field Reporter)',
      role: 'reporter',
      district: 'मध्य प्रदेश',
    },
  },
  admin: {
    pass: 'news123',
    user: {
      username: 'admin',
      name: 'मुख्य संपादक (Chief Editor)',
      role: 'admin',
      district: 'सेंट्रल डेस्क',
    },
  },
  bhopal: {
    pass: 'news2026',
    user: {
      username: 'bhopal',
      name: 'भोपाल ब्यूरो डेस्क',
      role: 'bureau',
      district: 'भोपाल',
    },
  },
  rewa: {
    pass: 'news2026',
    user: {
      username: 'rewa',
      name: 'रीवा ब्यूरो डेस्क',
      role: 'bureau',
      district: 'रीवा',
    },
  },
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Focus on mount
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('कृपया यूज़रनेम और पासवर्ड दोनों दर्ज करें।');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Check stored custom accounts
      let customAccounts: Record<string, { pass: string; user: ReporterUser }> = {};
      try {
        const stored = localStorage.getItem('reporter_custom_accounts');
        if (stored) {
          customAccounts = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Failed to parse custom accounts:', err);
      }

      const allAccounts = { ...DEFAULT_ACCOUNTS, ...customAccounts };
      const matched = allAccounts[cleanUser];

      if (matched && matched.pass === cleanPass) {
        // Successful login
        localStorage.setItem('reporter_auth_session', JSON.stringify(matched.user));
        setLoading(false);
        onLoginSuccess(matched.user);
      } else {
        setLoading(false);
        setErrorMessage('गलत यूज़रनेम या पासवर्ड! कृपया अपने अधिकृत क्रेडेंशियल्स दर्ज करें।');
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-red-700 via-red-600 to-amber-600 p-6 text-white text-center">
          <div className="w-16 h-16 mx-auto mb-2.5 rounded-2xl overflow-hidden bg-neutral-950/60 border border-yellow-400/40 p-1 flex items-center justify-center shadow-xl">
            <img src="/pwa-192x192.png" alt="ब्रेकिंग न्यूजवाला लोगो" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-['Baloo_2'] tracking-wide">
            ब्रेकिंग न्यूज़ वाला
          </h2>
          <p className="text-xs text-yellow-200 font-semibold mt-0.5">
            (भारत के जिलों से आपके दिलों तक)
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/40 border border-yellow-400/40 text-[11px] font-bold text-yellow-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>अधिकृत रिपोर्टर लॉगिन पोर्टल</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-300 text-center">
            न्यूज़ कार्ड और जैकेट ग्राफिक स्टूडियो का उपयोग करने के लिए अपना यूज़रनेम व पासवर्ड दर्ज करें:
          </p>

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-yellow-400" />
                <span>यूज़रनेम / रिपोर्टर आईडी:</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="उदा. reporter या admin"
                autoComplete="username"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
                <span>पासवर्ड:</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="अपना पासवर्ड दर्ज करें"
                  autoComplete="current-password"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-neutral-500 focus:border-yellow-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                  title={showPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'सत्यापन हो रहा है...' : 'लॉगिन करें (Sign In)'}</span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-neutral-950 px-6 py-3 border-t border-neutral-800 text-center">
          <p className="text-[11px] text-neutral-500">
            सुरक्षित न्यूज़ जैकेट कार्ड जेनरेटर • गैर-ओटीपी मैनुअल एक्सेस
          </p>
        </div>
      </div>
    </div>
  );
};
