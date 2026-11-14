import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  Bookmark,
  Bell,
  Shield,
  Layers,
  HelpCircle,
  ExternalLink,
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
  AlertCircle,
  Check,
} from 'lucide-react';
import { AppRole, ArticleDetail, ReadingHistoryRecord, UserPreferences } from '../types';
import { NavTab } from '../components/BottomNav';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { apiClient } from '../services/apiClient';

interface ProfileScreenProps {
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  userCoins: number;
  bookmarkedArticles: ArticleDetail[];
  onArticleClick: (articleId: string) => void;
  onRemoveBookmark: (articleId: string) => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentRole,
  onRoleChange,
  userCoins,
  bookmarkedArticles,
  onArticleClick,
  onRemoveBookmark,
  onNavigateTab,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [breakingAlerts, setBreakingAlerts] = useState(true);
  const [districtAlerts, setDistrictAlerts] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [selectedHomeDistrict, setSelectedHomeDistrict] = useState('भोपाल (Bhopal)');

  // Master Execution 026: Audience Intelligence & Engagement States
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryRecord[]>([]);
  const [dpdpaMessage, setDpdpaMessage] = useState<string | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<'fact_error' | 'typo_grammar' | 'offensive_content' | 'app_bug' | 'general_feedback'>('general_feedback');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackCorrection, setFeedbackCorrection] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setCurrentUser(user);
      if (user) {
        apiClient.audience.getReadingHistory(20).then(setReadingHistory).catch(() => {});
        apiClient.audience.getUserPreferences().then((p) => {
          if (p.breakingAlertsEnabled !== undefined) setBreakingAlerts(p.breakingAlertsEnabled);
        }).catch(() => {});
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
        } catch (err) {
          console.warn('[ProfileScreen] Session sync notice:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleClearHistory = async () => {
    try {
      await apiClient.audience.clearReadingHistory();
      setReadingHistory([]);
      setDpdpaMessage('आपका पठन इतिहास सफलतापूर्वक साफ़ कर दिया गया है।');
    } catch {
      setDpdpaMessage('पठन इतिहास साफ़ करने में त्रुटि।');
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
    } catch (error) {
      console.error('Firebase Auth Sign In Failed:', error);
      alert('Google साइन-इन में समस्या आई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      await apiClient.auth.logout();
      onRoleChange('READER');
    } catch (error) {
      console.error('Sign Out Failed:', error);
    }
  };

  const roleDefinitions: { role: AppRole; title: string; desc: string; color: string }[] = [
    {
      role: 'READER',
      title: '🟢 पाठक मोड (Reader Mode)',
      desc: 'समाचार पढ़ना, वीडियो देखना, ज़िला फ़िल्टर, ई-पेपर और सिक्के कमाना।',
      color: 'border-emerald-300 bg-emerald-50/50',
    },
    {
      role: 'REPORTER',
      title: '🔵 संवाददाता डेस्क (Field Reporter)',
      desc: 'ग्रामीण व ज़िला फील्ड से स्टोरी सबमिशन, वॉइस नोट्स व स्थिति ट्रैकिंग।',
      color: 'border-blue-300 bg-blue-50/50',
    },
    {
      role: 'ADMIN',
      title: '🔴 मुख्य संपादक व एडमिन (Chief Editor)',
      desc: '10-बिंदु तथ्य जांच, स्टोरी अप्रूवल, संशोधन अनुरोध व राज्यव्यापी अलर्ट।',
      color: 'border-red-300 bg-red-50/50',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-24 md:pb-12">
      {/* Header Profile Identity */}
      <div className="bg-slate-900 text-white px-4 py-5 border-b border-slate-800">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-14 h-14 rounded-full border-2 border-white/20 object-cover shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-red-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md border-2 border-white/20 shrink-0">
                {currentUser?.displayName ? currentUser.displayName[0] : 'अ'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold truncate">
                  {currentUser?.displayName || 'अमित कुमार शर्मा'}
                </h2>
                <span className="text-[10px] font-bold bg-red-700 text-white px-2 py-0.5 rounded-full">
                  {currentUser ? 'Firebase अधिकृत' : 'अतिथि पाठक'}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                {currentUser?.email ? `${currentUser.email} • ` : ''}गृह ज़िला: {selectedHomeDistrict}
              </p>
            </div>
          </div>

          {/* Firebase Google Auth Action */}
          <div>
            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लॉग आउट</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <LogIn className="w-4 h-4 text-red-600" />
                <span>{isAuthLoading ? 'साइन-इन हो रहा है...' : 'Google से साइन-इन'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* 1. Reader Coins Wallet Card */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              बीएनडब्ल्यू पाठक रिवार्ड कॉइन्स (Coin Wallet)
            </span>
            <div className="text-2xl font-black mt-1 flex items-baseline gap-1">
              <span>{userCoins}</span>
              <span className="text-xs font-semibold text-amber-200">सिक्के</span>
            </div>
            <p className="text-[11px] text-amber-100 mt-1">
              प्रति समाचार पढ़ने पर +5 सिक्के अर्जित होते हैं।
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-xs p-3 rounded-lg border border-white/30 text-center">
            <Award className="w-7 h-7 mx-auto mb-1 text-yellow-200" />
            <span className="text-[10px] font-bold block">सिल्वर पाठक स्तर</span>
          </div>
        </div>

        {/* 2. Role Status & Master Admin Access */}
        {['MASTER_ADMIN', 'ADMIN'].includes(currentRole) ? (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-200" />
                <div>
                  <h3 className="text-sm font-black">⭐ अधिकृत मास्टर एडमिनिस्ट्रेटर (Master Admin)</h3>
                  <p className="text-xs text-amber-100 font-medium">संपूर्ण प्रशासनिक एवं संपादकीय नियंत्रण सक्रिय</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-900 text-amber-300 font-black px-2 py-0.5 rounded-full">सत्यापित</span>
            </div>
            <p className="text-xs text-amber-50">
              आप अधिकृत गूगल खाते ({currentUser?.email || 'प्रशासक'}) से सफलतापूर्वक प्रमाणीकृत हैं।
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('admin')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>मास्टर एडमिन डैशबोर्ड खोलें (Enter Dashboard)</span>
              </button>
            )}
          </div>
        ) : ['EDITOR', 'REPORTER'].includes(currentRole) ? (
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                अधिकृत संपादकीय खाता
              </h3>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                {currentRole === 'EDITOR' ? 'संपादक' : 'संवाददाता'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {currentRole === 'EDITOR'
                ? 'आपके पास केंद्रीय संपादकीय डेस्क (Newsroom) की समीक्षा एवं अनुमोदन अधिकार हैं।'
                : 'आपके पास संवाददाता फील्ड डेस्क (Reporter Portal) में ड्राफ्ट तैयार करने के अधिकार हैं।'}
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                खाता स्थिति: पाठक मोड (Reader Mode)
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">सक्रिय</span>
            </div>
            <p className="text-xs text-slate-600">
              समाचार पढ़ना, टिप्पणियां, ई-पेपर, ज़िला फ़िल्टर और पाठक समीक्षा सिक्के आपके खाते में सक्रिय हैं।
            </p>
          </div>
        )}

        {/* 3. Bookmarks Collection */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-red-600" />
              सहेजे गए समाचार (Saved Bookmarks)
            </h3>
            <span className="text-xs font-bold text-slate-600">
              {bookmarkedArticles.length} समाचार
            </span>
          </div>

          {bookmarkedArticles.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              अभी आपने कोई समाचार बुकमार्क नहीं किया है।
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bookmarkedArticles.map((art) => (
                <div
                  key={art.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors"
                >
                  <div
                    onClick={() => onArticleClick(art.id)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-[#344FD6] uppercase">
                      {art.districtName}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {art.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => onRemoveBookmark(art.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold shrink-0 p-1"
                  >
                    हटाएं
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Notification Preferences */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Bell className="w-4 h-4 text-amber-600" />
            सूचनाएं एवं पुश अलर्ट प्राथमिकताएं:
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-bold text-slate-800">राज्यव्यापी ब्रेकिंग अलर्ट्स</p>
                <p className="text-[11px] text-slate-500">मध्य प्रदेश की अति-महत्वपूर्ण खबरों के तत्काल अलर्ट्स (FCM Topics)</p>
              </div>
              <input
                type="checkbox"
                checked={breakingAlerts}
                onChange={(e) => setBreakingAlerts(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-bold text-slate-800">गृह ज़िला बुलेटिन अलर्ट्स</p>
                <p className="text-[11px] text-slate-500">आपके गृह ज़िले ({selectedHomeDistrict}) की दैनिक खबरें</p>
              </div>
              <input
                type="checkbox"
                checked={districtAlerts}
                onChange={(e) => setDistrictAlerts(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-bold text-slate-800">शांत समय (Quiet Hours)</p>
                <p className="text-[11px] text-slate-500">रात्रि 10:00 बजे से प्रातः 06:00 बजे तक केवल आपात अलर्ट्स</p>
              </div>
              <input
                type="checkbox"
                checked={quietHours}
                onChange={(e) => setQuietHours(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* 4b. Reading History (Master Execution 026) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              पठन इतिहास (Reading History)
            </h3>
            {readingHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>इतिहास साफ़ करें</span>
              </button>
            )}
          </div>

          {readingHistory.length === 0 ? (
            <p className="text-xs text-slate-500 py-2 text-center">
              हाल ही में पढ़ा गया कोई समाचार उपलब्ध नहीं है।
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {readingHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onArticleClick(item.articleId)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-indigo-600">{item.districtName || 'मध्य प्रदेश'}</span>
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

        {/* 4c. DPDPA 2023 Privacy Rights & Data Governance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            डिजिटल व्यक्तिगत डेटा संरक्षण (DPDPA 2023) अधिकार:
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

        {/* 4d. Reader Feedback & Article Corrections Form */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            पाठक फीडबैक एवं तथ्य संशोधन (Correction Request):
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

            {feedbackSuccess && (
              <p className="text-emerald-700 font-bold text-xs">{feedbackSuccess}</p>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
            >
              फीडबैक प्रेषित करें
            </button>
          </form>
        </div>

        {/* 5. Legal, Grievance Redressal & Editorial Policy (Indian IT Rules 2021) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-xs text-slate-600">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            संपादकीय संहिता एवं शिकायत निवारण (Grievance Redressal)
          </h3>

          <p className="leading-relaxed">
            <strong>डिजिटल मीडिया आचार संहिता (IT Rules 2021) व DPDPA 2023 के अंतर्गत:</strong>
          </p>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
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

          <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between border-t border-slate-100">
            <span>संस्करण: v1.6.0 (Firebase Enabled)</span>
            <span>© 2026 BREAKING NEWS WALA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
