import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  Bookmark,
  Bell,
  Shield,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  Award,
  LogIn,
  LogOut,
  History,
  Download,
  Trash2,
  RefreshCw,
  MessageSquare,
  Check,
  Crown,
  PenTool,
  Building2,
  Newspaper,
  Palette,
  Video,
  Bot,
} from 'lucide-react';
import { AppRole, ArticleDetail, ReadingHistoryRecord } from '../types';
import { NavTab } from '../components/BottomNav';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { apiClient, AuthUser } from '../services/apiClient';

interface ProfileScreenProps {
  currentRole: AppRole;
  accountRole?: AppRole;
  authUser?: AuthUser | null;
  onRoleChange: (role: AppRole) => void;
  onSwitchPersona?: (role: AppRole, targetTab?: NavTab) => void;
  onBackendLoginSuccess?: (user: AuthUser) => void;
  onLogoutSuccess?: () => void;
  userCoins: number;
  bookmarkedArticles: ArticleDetail[];
  readingHistoryProp?: ReadingHistoryRecord[];
  onClearReadingHistory?: () => void;
  onArticleClick: (articleId: string) => void;
  onRemoveBookmark: (articleId: string) => void;
  onNavigateTab?: (tab: NavTab) => void;
}

type ProfileSectionTab = 'overview' | 'saved' | 'notifications' | 'privacy' | 'support';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentRole,
  accountRole = currentRole,
  authUser = null,
  onRoleChange,
  onSwitchPersona,
  onBackendLoginSuccess,
  onLogoutSuccess,
  userCoins,
  bookmarkedArticles,
  readingHistoryProp = [],
  onClearReadingHistory,
  onArticleClick,
  onRemoveBookmark,
  onNavigateTab,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileSectionTab>('overview');

  const [breakingAlerts, setBreakingAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bnw_notif_prefs');
      if (saved) return JSON.parse(saved).breakingAlerts !== false;
    } catch {
      // ignore
    }
    return true;
  });
  const [districtAlerts, setDistrictAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bnw_notif_prefs');
      if (saved) return JSON.parse(saved).districtAlerts !== false;
    } catch {
      // ignore
    }
    return true;
  });
  const [quietHours, setQuietHours] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bnw_notif_prefs');
      if (saved) return Boolean(JSON.parse(saved).quietHours);
    } catch {
      // ignore
    }
    return false;
  });
  const [pushPermission, setPushPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);
  const [selectedHomeDistrict] = useState('भोपाल (Bhopal)');

  // Master Execution 026: Audience Intelligence & Engagement States
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryRecord[]>([]);
  const [dpdpaMessage, setDpdpaMessage] = useState<string | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<
    'fact_error' | 'typo_grammar' | 'offensive_content' | 'app_bug' | 'general_feedback'
  >('general_feedback');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackCorrection, setFeedbackCorrection] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const isMasterAccount = accountRole === 'MASTER_ADMIN';
  const isLoggedIn = Boolean(currentUser || authUser);
  const displayName = currentUser?.displayName || authUser?.fullName || 'अतिथि पाठक';
  const displayEmail = currentUser?.email || authUser?.email || '';

  useEffect(() => {
    if (authUser) {
      apiClient.audience.getReadingHistory(20).then(setReadingHistory).catch(() => {});
      apiClient.audience
        .getUserPreferences()
        .then((p) => {
          if (p.breakingAlertsEnabled !== undefined) setBreakingAlerts(p.breakingAlertsEnabled);
          if (p.districtAlertsEnabled !== undefined) setDistrictAlerts(p.districtAlertsEnabled);
          if (p.quietHoursEnabled !== undefined) setQuietHours(p.quietHoursEnabled);
        })
        .catch(() => {});
    }
  }, [authUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setCurrentUser(user);
      if (user) {
        apiClient.audience.getReadingHistory(20).then(setReadingHistory).catch(() => {});
        apiClient.audience
          .getUserPreferences()
          .then((p) => {
            if (p.breakingAlertsEnabled !== undefined) setBreakingAlerts(p.breakingAlertsEnabled);
            if (p.districtAlertsEnabled !== undefined) setDistrictAlerts(p.districtAlertsEnabled);
            if (p.quietHoursEnabled !== undefined) setQuietHours(p.quietHoursEnabled);
          })
          .catch(() => {});
        try {
          const idToken = await user.getIdToken();
          const authRes = await apiClient.auth.loginWithFirebase(idToken);
          if (authRes && authRes.roles) {
            onBackendLoginSuccess?.(authRes);
          }
        } catch (err) {
          console.warn('[ProfileScreen] Session sync notice:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const mergedReadingHistory = React.useMemo(() => {
    const map = new Map<string, ReadingHistoryRecord>();
    readingHistoryProp.forEach((r) => map.set(r.articleId, r));
    readingHistory.forEach((r) => {
      if (!map.has(r.articleId)) map.set(r.articleId, r);
    });
    return Array.from(map.values());
  }, [readingHistoryProp, readingHistory]);

  const handleClearHistory = async () => {
    try {
      await apiClient.audience.clearReadingHistory().catch(() => {});
      setReadingHistory([]);
      onClearReadingHistory?.();
      setDpdpaMessage('आपका पठन इतिहास सफलतापूर्वक साफ़ कर दिया गया है।');
    } catch {
      setReadingHistory([]);
      onClearReadingHistory?.();
      setDpdpaMessage('आपका पठन इतिहास साफ़ कर दिया गया है।');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await apiClient.audience.exportPrivacyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bnw-dpdpa-data-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDpdpaMessage('DPDPA 2023 डेटा एक्सपोर्ट पैकेज सफलतापूर्वक डाउनलोड हो गया।');
    } catch {
      setDpdpaMessage('डेटा एक्सपोर्ट पैकेज जनरेट करने में त्रुटि।');
    }
  };

  const handleResetPersonalization = async () => {
    try {
      await apiClient.audience.resetPersonalization();
      setDpdpaMessage('आपकी वैयक्तिकरण प्राथमिकताएं तटस्थ डिफ़ॉल्ट पर रीसेट कर दी गई हैं।');
    } catch {
      setDpdpaMessage('वैयक्तिकरण रीसेट करने में त्रुटि।');
    }
  };

  const handleDeleteAccountRequest = async () => {
    if (!window.confirm('क्या आप 30 दिनों की अनुग्रह अवधि के साथ खाता विलोपन अनुरोध दर्ज करना चाहते हैं?')) return;
    try {
      const res = await apiClient.audience.requestAccountDeletion('पाठक द्वारा अनुरोध');
      setDpdpaMessage(res.messageHi || 'खाता विलोपन अनुरोध दर्ज कर लिया गया है।');
    } catch {
      setDpdpaMessage('खाता विलोपन अनुरोध में त्रुटि।');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComments.trim()) return;
    try {
      await apiClient.audience.submitFeedback({
        category: feedbackCategory,
        comments: feedbackComments,
        suggestedCorrection: feedbackCorrection || undefined,
      });
      setFeedbackSuccess('आपकी प्रतिक्रिया/तथ्य संशोधन संपादकीय डेस्क को प्रेषित कर दिया गया है।');
      setFeedbackComments('');
      setFeedbackCorrection('');
    } catch (err: any) {
      setFeedbackSuccess(err.message || 'फीडबैक प्रेषण विफल।');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const authRes = await apiClient.auth.loginWithFirebase(idToken);
          if (authRes && authRes.roles) {
            const upperRoles = authRes.roles.map((r) => String(r).toUpperCase());
            if (upperRoles.includes('MASTER_ADMIN') || upperRoles.includes('SUPER_ADMIN')) {
              onRoleChange('MASTER_ADMIN');
            } else if (upperRoles.includes('ADMIN')) {
              onRoleChange('ADMIN');
            } else if (upperRoles.includes('CHIEF_EDITOR') || upperRoles.includes('EDITOR')) {
              onRoleChange('EDITOR');
            } else if (upperRoles.includes('REPORTER')) {
              onRoleChange('REPORTER');
            } else {
              onRoleChange('READER');
            }
          }
        } catch (apiErr) {
          console.warn('Backend session exchange notice:', apiErr);
        }
      }
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        setAuthError(
          `डोमेन अधिकृत नहीं है (auth/unauthorized-domain): Firebase Console → Authentication → Settings → Authorized domains में "${host}" जोड़ें।`
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google साइन-इन पॉपअप बंद कर दिया गया। कृपया पुनः प्रयास करें।');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('ब्राउज़र ने साइन-इन पॉपअप ब्लॉक कर दिया है। कृपया पॉपअप अनुमति दें।');
      } else {
        console.warn('Firebase Auth Sign In notice:', error);
        setAuthError('Google साइन-इन में समस्या आई। कृपया पुनः प्रयास करें।');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handlePreviewMasterLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await apiClient.auth.login('master_admin');
      onBackendLoginSuccess?.(user);
    } catch (err: any) {
      setAuthError(err?.message || 'प्रीव्यू मास्टर एडमिन लॉगिन विफल रहा।');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleNotificationPreferenceChange = async (
    nextBreaking: boolean,
    nextDistrict: boolean,
    nextQuiet: boolean
  ) => {
    setBreakingAlerts(nextBreaking);
    setDistrictAlerts(nextDistrict);
    setQuietHours(nextQuiet);
    try {
      localStorage.setItem(
        'bnw_notif_prefs',
        JSON.stringify({
          breakingAlerts: nextBreaking,
          districtAlerts: nextDistrict,
          quietHours: nextQuiet,
        })
      );
    } catch {
      // ignore storage quota errors
    }
    try {
      await apiClient.audience.updateUserPreferences({
        breakingAlertsEnabled: nextBreaking,
        districtAlertsEnabled: nextDistrict,
        quietHoursEnabled: nextQuiet,
      });
      setNotifFeedback('सूचना प्राथमिकताएं सर्वर पर सहेजी गईं।');
    } catch {
      setNotifFeedback('सूचना प्राथमिकताएं ब्राउज़र में सहेजी गईं।');
    }
  };

  const handleEnableBrowserPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifFeedback('यह ब्राउज़र वेब पुश नोटिफिकेशन का समर्थन नहीं करता।');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        await fetch('/api/v1/notifications/register-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'web',
            deviceModel: navigator.userAgent.slice(0, 60),
          }),
        }).catch(() => {});

        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready.catch(() => null);
          if (reg) {
            await reg.showNotification('BREAKING NEWS WALA अलर्ट सक्रिय', {
              body: 'अब आपको मध्य प्रदेश की हर ब्रेकिंग न्यूज़ तत्काल प्राप्त होगी।',
              icon: '/brand/logo.png',
            });
          }
        }
        setNotifFeedback('ब्राउज़र पुश नोटिफिकेशन सफलतापूर्वक सक्रिय हो गए हैं।');
      } else {
        setNotifFeedback('ब्राउज़र सेटिंग्स से नोटिफिकेशन अनुमति दें।');
      }
    } catch {
      setNotifFeedback('पुश नोटिफिकेशन सक्रिय करने में त्रुटि हुई।');
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut().catch(() => {});
      await apiClient.auth.logout();
      onRoleChange('READER');
      onLogoutSuccess?.();
    } catch (error) {
      console.error('Sign Out Failed:', error);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 md:pb-12">
      {/* Compact Header Profile Identity */}
      <div className="bg-slate-900 text-white px-4 py-3.5 border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={displayName}
                className="w-11 h-11 rounded-full border-2 border-white/20 object-cover shadow-md shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-red-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md border-2 border-white/20 shrink-0">
                {displayName ? displayName[0] : 'पा'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm md:text-base font-bold truncate">
                  {displayName}
                </h2>
                <span className="text-[10px] font-bold bg-red-700 text-white px-2 py-0.5 rounded-full">
                  {currentUser ? 'Firebase अधिकृत' : authUser ? 'मास्टर एडमिन (Preview JWT)' : 'सामान्य पाठक'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {displayEmail ? `${displayEmail} • ` : ''}गृह ज़िला: {selectedHomeDistrict}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 flex-wrap justify-center">
            {isLoggedIn ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लॉग आउट</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handlePreviewMasterLogin}
                  disabled={isAuthLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>{isAuthLoading ? 'लॉगिन हो रहा है...' : 'मास्टर एडमिन लॉगिन (Preview)'}</span>
                </button>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-red-600" />
                  <span>Google</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Inline Auth Feedback Banner (No window.alert) */}
      {authError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs text-rose-800 font-semibold">
            <span>{authError}</span>
            <button
              onClick={() => setAuthError(null)}
              className="text-rose-600 hover:text-rose-900 font-bold shrink-0 px-1.5"
              aria-label="त्रुटि संदेश बंद करें"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Clean Profile Sub-Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[56px] z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => setActiveProfileTab('overview')}
            className={`py-2.5 px-3 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeProfileTab === 'overview'
                ? 'border-[#ED1727] text-[#ED1727]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>अवलोकन व डेस्क</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('saved')}
            className={`py-2.5 px-3 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeProfileTab === 'saved'
                ? 'border-[#ED1727] text-[#ED1727]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>सेव्ड समाचार ({bookmarkedArticles.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('notifications')}
            className={`py-2.5 px-3 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeProfileTab === 'notifications'
                ? 'border-[#ED1727] text-[#ED1727]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>सूचना प्राथमिकताएं</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('privacy')}
            className={`py-2.5 px-3 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeProfileTab === 'privacy'
                ? 'border-[#ED1727] text-[#ED1727]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>इतिहास व DPDPA</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('support')}
            className={`py-2.5 px-3 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeProfileTab === 'support'
                ? 'border-[#ED1727] text-[#ED1727]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>सहायता व शिकायत</span>
          </button>
        </div>
      </div>

      {/* Tab Body Container */}
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* TAB 1: OVERVIEW & WORKSPACES */}
        {activeProfileTab === 'overview' && (
          <div className="space-y-4">
            {/* Compact 2-Column Top Grid: Coin Wallet + Active Role Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coin Wallet Card */}
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-100 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    पाठक रिवार्ड कॉइन्स (Wallet)
                  </span>
                  <div className="text-2xl font-black mt-1 flex items-baseline gap-1">
                    <span>{userCoins}</span>
                    <span className="text-xs font-semibold text-amber-100">सिक्के</span>
                  </div>
                  <p className="text-[11px] text-amber-100 mt-1">
                    प्रति समाचार पढ़ने पर +5 सिक्के अर्जित होते हैं।
                  </p>
                </div>

                <div className="bg-white/20 backdrop-blur-xs p-2.5 rounded-lg border border-white/30 text-center shrink-0">
                  <Award className="w-6 h-6 mx-auto mb-0.5 text-yellow-200" />
                  <span className="text-[10px] font-bold block">सिल्वर स्तर</span>
                </div>
              </div>

              {/* Active Mode Summary Card */}
              {['MASTER_ADMIN', 'ADMIN'].includes(currentRole) ? (
                <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm flex flex-col justify-between space-y-2.5 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-black text-amber-300">
                        मास्टर एडमिन नियंत्रण सक्रिय
                      </h3>
                    </div>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                      सत्यापित
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    सभी संपादकीय डेस्क, ई-पेपर और स्टूडियो टूल्स नीचे टैब में उपलब्ध हैं।
                  </p>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('admin')}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>मास्टर एडमिन डैशबोर्ड खोलें</span>
                    </button>
                  )}
                </div>
              ) : ['EDITOR', 'REPORTER'].includes(currentRole) ? (
                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      अधिकृत संपादकीय कार्यक्षेत्र
                    </h3>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      {currentRole === 'EDITOR' ? 'संपादक' : 'संवाददाता'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {currentRole === 'EDITOR'
                      ? 'केंद्रीय संपादकीय डेस्क (Newsroom) से स्टोरी समीक्षा एवं अनुमोदन करें।'
                      : 'संवाददाता फील्ड डेस्क (Reporter Portal) से समाचार व मीडिया भेजें।'}
                  </p>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab(currentRole === 'EDITOR' ? 'newsroom' : 'reporter')}
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      {currentRole === 'EDITOR' ? 'न्यूज़रूम डेस्क खोलें' : 'रिपोर्टर डेस्क खोलें'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      खाता स्थिति: पाठक मोड (Reader Mode)
                    </h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      सक्रिय
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    ताज़ा समाचार, ज़िला फ़िल्टर, सहेजे गए बुकमार्क और कॉइन रिवार्ड्स सक्रिय हैं।
                  </p>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('home')}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      ताज़ा खबरें पढ़ें (होम पेज)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Remaining Operational Options Organized Cleanly Inside Profile Tab */}
            {['MASTER_ADMIN', 'ADMIN'].includes(currentRole) && onNavigateTab && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    सभी संपादकीय व स्टूडियो मॉड्यूल्स (Quick Launch)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-semibold">मास्टर एडमिन एक्सेस</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
                  <button
                    onClick={() => onNavigateTab('newsroom')}
                    className="p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex flex-col items-center gap-1 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>न्यूज़रूम डेस्क</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('reporter')}
                    className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex flex-col items-center gap-1 transition-colors"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>रिपोर्टर डेस्क</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('epaper')}
                    className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex flex-col items-center gap-1 transition-colors"
                  >
                    <Newspaper className="w-4 h-4" />
                    <span>ई-पेपर (Admin)</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('graphics')}
                    className="p-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 flex flex-col items-center gap-1 transition-colors"
                  >
                    <Palette className="w-4 h-4" />
                    <span>ग्राफ़िक्स स्टूडियो</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('videos')}
                    className="p-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex flex-col items-center gap-1 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>वीडियो स्टूडियो</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('ai-newsroom')}
                    className="p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex flex-col items-center gap-1 transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    <span>AI न्यूज़ रूम</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED BOOKMARKS */}
        {activeProfileTab === 'saved' && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-red-600" />
                सहेजे गए समाचार (Saved Bookmarks)
              </h3>
              <span className="text-xs font-bold text-slate-600">{bookmarkedArticles.length} समाचार</span>
            </div>

            {bookmarkedArticles.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                अभी आपने कोई समाचार बुकमार्क नहीं किया है।
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bookmarkedArticles.map((art) => (
                  <div
                    key={art.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors"
                  >
                    <div onClick={() => onArticleClick(art.id)} className="flex-1 min-w-0 cursor-pointer">
                      <span className="text-[10px] font-bold text-[#344FD6] uppercase">
                        {art.districtName}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{art.title}</h4>
                    </div>
                    <button
                      onClick={() => onRemoveBookmark(art.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold shrink-0 px-2 py-1"
                    >
                      हटाएं
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS & PREFERENCES */}
        {activeProfileTab === 'notifications' && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                सूचनाएं एवं लाइव पुश अलर्ट प्राथमिकताएं
              </h3>
              <button
                type="button"
                onClick={handleEnableBrowserPush}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  pushPermission === 'granted'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[#ED1727] hover:bg-red-700 text-white'
                }`}
              >
                {pushPermission === 'granted'
                  ? '✓ ब्राउज़र पुश अलर्ट सक्रिय'
                  : 'पुश अलर्ट सक्षम करें (Enable Push)'}
              </button>
            </div>

            {notifFeedback && (
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-semibold text-amber-900">
                {notifFeedback}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <p className="font-bold text-slate-800">राज्यव्यापी ब्रेकिंग अलर्ट्स</p>
                  <p className="text-[11px] text-slate-500">
                    मध्य प्रदेश की अति-महत्वपूर्ण खबरों के तत्काल लाइव SSE / पुश अलर्ट्स
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={breakingAlerts}
                  onChange={(e) => handleNotificationPreferenceChange(e.target.checked, districtAlerts, quietHours)}
                  className="w-4 h-4 text-red-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <p className="font-bold text-slate-800">गृह ज़िला बुलेटिन अलर्ट्स</p>
                  <p className="text-[11px] text-slate-500">
                    आपके गृह ज़िले ({selectedHomeDistrict}) की दैनिक खबरें
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={districtAlerts}
                  onChange={(e) => handleNotificationPreferenceChange(breakingAlerts, e.target.checked, quietHours)}
                  className="w-4 h-4 text-red-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <p className="font-bold text-slate-800">शांत समय (Quiet Hours)</p>
                  <p className="text-[11px] text-slate-500">
                    रात्रि 10:00 बजे से प्रातः 06:00 बजे तक केवल आपात अलर्ट्स
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={quietHours}
                  onChange={(e) => handleNotificationPreferenceChange(breakingAlerts, districtAlerts, e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: READING HISTORY & DPDPA */}
        {activeProfileTab === 'privacy' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-600" />
                  पठन इतिहास (Reading History)
                </h3>
                {mergedReadingHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>इतिहास साफ़ करें</span>
                  </button>
                )}
              </div>

              {mergedReadingHistory.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  हाल ही में पढ़ा गया कोई समाचार उपलब्ध नहीं है।
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {mergedReadingHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onArticleClick(item.articleId)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-indigo-600">
                          {item.districtName || 'मध्य प्रदेश'}
                        </span>
                        <h5 className="font-bold text-slate-900 truncate">{item.articleTitle}</h5>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {item.dwellTimeSeconds ? `${item.dwellTimeSeconds}s पढ़ा` : 'अवलोकन'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                डिजिटल व्यक्तिगत डेटा संरक्षण (DPDPA 2023) अधिकार
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDPA 2023) के अंतर्गत आपको अपने डेटा पोर्टेबिलिटी, विलोपन एवं तटस्थ वैयक्तिकरण का पूर्ण अधिकार प्राप्त है।
              </p>

              {dpdpaMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{dpdpaMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>डेटा एक्सपोर्ट</span>
                </button>
                <button
                  onClick={handleResetPersonalization}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>वैयक्तिकरण रीसेट</span>
                </button>
                <button
                  onClick={handleDeleteAccountRequest}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>खाता विलोपन</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SUPPORT & GRIEVANCE */}
        {activeProfileTab === 'support' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                पाठक फीडबैक एवं तथ्य संशोधन (Correction Request)
              </h3>

              <form onSubmit={handleSubmitFeedback} className="space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">फीडबैक श्रेणी *</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e: any) => setFeedbackCategory(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="fact_error">तथ्य त्रुटि / संशोधन (Fact Error)</option>
                      <option value="typo_grammar">वर्तनी / व्याकरण (Typo / Grammar)</option>
                      <option value="offensive_content">आपत्तिजनक सामग्री (Offensive)</option>
                      <option value="app_bug">ऐप / तकनीकी त्रुटि (App Bug)</option>
                      <option value="general_feedback">सामान्य सुझाव (General Feedback)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">प्रस्तावित संशोधन (वैकल्पिक)</label>
                    <input
                      type="text"
                      value={feedbackCorrection}
                      onChange={(e) => setFeedbackCorrection(e.target.value)}
                      placeholder="सही तथ्य अथवा लिंक..."
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">विस्तृत विवरण / टिप्पणी *</label>
                  <textarea
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    rows={2}
                    placeholder="कृपया विस्तृत विवरण लिखें..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                {feedbackSuccess && <p className="text-emerald-700 font-bold text-xs">{feedbackSuccess}</p>}

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                >
                  फीडबैक प्रेषित करें
                </button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-xs text-slate-600">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                संपादकीय संहिता एवं शिकायत निवारण (IT Rules 2021)
              </h3>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <p>
                  <strong>शिकायत निवारण अधिकारी:</strong> सुश्री वंदना शर्मा (विधिक सलाहकार)
                </p>
                <p className="flex items-center gap-1 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-red-600" />
                  ईमेल: grievance@breakingnewswala.com
                </p>
                <p className="flex items-center gap-1 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  हेल्पलाइन: +91 755 4920000 (भोपाल ब्यूरो)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
