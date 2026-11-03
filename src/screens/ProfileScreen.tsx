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
  Phone,
  Mail,
  Award,
  LogIn,
  LogOut,
} from 'lucide-react';
import { AppRole, ArticleDetail } from '../types';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

interface ProfileScreenProps {
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  userCoins: number;
  bookmarkedArticles: ArticleDetail[];
  onArticleClick: (articleId: string) => void;
  onRemoveBookmark: (articleId: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentRole,
  onRoleChange,
  userCoins,
  bookmarkedArticles,
  onArticleClick,
  onRemoveBookmark,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [breakingAlerts, setBreakingAlerts] = useState(true);
  const [districtAlerts, setDistrictAlerts] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [selectedHomeDistrict, setSelectedHomeDistrict] = useState('भोपाल (Bhopal)');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
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
                {currentUser?.email || 'breakingnewswala.com@gmail.com'} • गृह ज़िला: {selectedHomeDistrict}
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

        {/* 2. Multi-Role Switcher Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              कार्यक्षेत्र व रोल स्विचर (Active Persona):
            </h3>
            <p className="text-xs text-slate-500">
              एप्लिकेशन में विभिन्न भूमिकाओं (Role-Based Access) का परीक्षण करने हेतु चयन करें:
            </p>
          </div>

          <div className="space-y-2">
            {roleDefinitions.map((item) => {
              const isSelected = currentRole === item.role;
              return (
                <div
                  key={item.role}
                  onClick={() => onRoleChange(item.role)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? `${item.color} shadow-xs ring-1 ring-slate-400`
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">
                      {item.title}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

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
