import React from 'react';
import { ShieldAlert, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../firebase/AuthContext.tsx';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  sectionTitle?: string;
  fallbackDescription?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAdmin = false,
  sectionTitle = 'सुरक्षित न्यूज़रूम क्षेत्र',
  fallbackDescription
}) => {
  const { currentUser, loading, login, isAdmin } = useAuth();

  // 1. Loading State
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-xs text-center space-y-4">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-base font-bold text-gray-800">प्रमाणीकरण की जांच हो रही है...</h3>
        <p className="text-xs text-gray-500">कृपया प्रतीक्षा करें, आपकी क्रेडेंशियल्स सत्यापित की जा रही हैं</p>
      </div>
    );
  }

  // 2. Unauthenticated State (No currentUser)
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-white rounded-2xl border-2 border-red-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="bg-red-100 text-red-800 text-[11px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
            सुरक्षित अनुभाग • Restricted Access
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-950 mt-2">
            {sectionTitle} में प्रवेश हेतु लॉगिन अनिवार्य
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
            {fallbackDescription || 'यह कार्यक्षेत्र केवल अधिकृत जिला संवाददाताओं एवं केंद्रीय संपादकीय टीम के लिए सुरक्षित है। कृपया जारी रखने के लिए अपने अधिकृत Google खाते से लॉगिन करें।'}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={login}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 mx-auto shadow-md transition"
          >
            <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google से लॉगिन करें (Authenticate with Google)
          </button>
        </div>

        <div className="border-t border-gray-100 pt-3 text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>सत्र सुरक्षा एवं आईपी पते का स्वचालित ऑडिट रिकॉर्ड संधारित होता है</span>
        </div>
      </div>
    );
  }

  // 3. Admin-Only Guard
  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-white rounded-2xl border-2 border-amber-300 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-gray-900">एडमिनिस्ट्रेटर अधिकार आवश्यक</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          वर्तमान लॉगिन खाता (<strong>{currentUser.email}</strong>) केंद्रीय एडमिन न्यूज़रूम एक्सेस करने के लिए अधिकृत नहीं है। कृपया अधिकृत एडमिन ईमेल से साइन-इन करें।
        </p>
      </div>
    );
  }

  // 4. Authenticated & Authorized: Render Protected Children
  return <>{children}</>;
};
