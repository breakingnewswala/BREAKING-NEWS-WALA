import React, { useState } from 'react';
import { X, Bookmark, Coins, Bell, Flame, Trash2, LogOut, LogIn } from 'lucide-react';
import { Article } from '../../types/index.ts';
import { useAuth } from '../../firebase/AuthContext.tsx';

interface UserProfileModalProps {
  onClose: () => void;
  savedArticles: Article[];
  onRemoveBookmark: (id: string) => void;
  onSelectArticle: (article: Article) => void;
  coinsCount: number;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onClose,
  savedArticles,
  onRemoveBookmark,
  onSelectArticle,
  coinsCount
}) => {
  const { user, signInWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'coins' | 'notifications'>('bookmarks');

  const demoNotifications = [
    { id: '1', title: 'ब्रेकिंग न्यूज़ अलर्ट', desc: 'निवाड़ी ओरछा रामराजा मंदिर में महाआरती संपन्न।', time: '1 घंटा पहले' },
    { id: '2', title: 'सिक्के रिवार्ड', desc: 'दैनिक समाचार पढ़ने के लिए आपको 10 सिक्के मिले!', time: '3 घंटे पहले' },
    { id: '3', title: 'मौसम चेतावनी', desc: 'मध्य प्रदेश में आज शाम हल्की बारिश का अलर्ट।', time: '5 घंटे पहले' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Profile Info */}
        <div className="p-5 bg-gradient-to-r from-red-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white text-red-600 font-black text-xl flex items-center justify-center shadow-md">
                {user ? (user.displayName || user.email || 'U')[0].toUpperCase() : 'BNW'}
              </div>
            )}
            <div>
              <h3 className="font-black text-base">{user ? (user.displayName || 'नागरिक पाठक') : 'अतिथि पाठक (Guest)'}</h3>
              <p className="text-xs text-yellow-200">{user ? user.email : 'Google से लॉगिन कर अपनी प्रोफाइल सिंक करें'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <button 
                onClick={logout}
                className="flex items-center gap-1 bg-black/30 hover:bg-black/50 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                title="लॉगआउट"
              >
                <LogOut className="w-3.5 h-3.5" />
                लॉगआउट
              </button>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-1 bg-white text-gray-900 hover:bg-yellow-100 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-red-600" />
                लॉगिन
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'bookmarks' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            सेव की गई खबरें ({savedArticles.length})
          </button>

          <button
            onClick={() => setActiveTab('coins')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'coins' ? 'border-amber-500 text-amber-700 bg-white' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            सिक्के व रिवार्ड्स ({coinsCount})
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'notifications' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            सूचनाएं
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'bookmarks' && (
            <div>
              {savedArticles.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  आपने अभी तक कोई खबर सेव नहीं की है।
                </div>
              ) : (
                <div className="space-y-3">
                  {savedArticles.map(art => (
                    <div
                      key={art.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 group"
                    >
                      <div 
                        onClick={() => {
                          onSelectArticle(art);
                          onClose();
                        }}
                        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                      >
                        <img src={art.thumbnail} alt={art.title} className="w-16 h-14 rounded object-cover shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-red-600 font-bold">{art.category} • {art.district}</span>
                          <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-red-600">{art.title}</h4>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveBookmark(art.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="हटाएं"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'coins' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-800">कुल उपलब्ध सिक्के</span>
                  <div className="text-3xl font-black text-amber-950 flex items-center gap-2">
                    <Coins className="w-7 h-7 text-amber-500 fill-amber-400" />
                    {coinsCount} सिक्के
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                    सक्रिय रीडिंग स्ट्रीक 🔥 4 दिन
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-2 border p-3 rounded-lg bg-gray-50">
                <h5 className="font-bold text-gray-900">सिक्के कमाने के तरीके:</h5>
                <p>• प्रतिदिन 5 खबरें पढ़ने पर: <strong>+10 सिक्के</strong></p>
                <p>• दोस्तों को WhatsApp पर शेयर करने पर: <strong>+5 सिक्के</strong></p>
                <p>• अपना रेफरल लिंक साझा करने पर: <strong>+50 सिक्के</strong></p>
              </div>

              <div className="p-3 bg-red-50 rounded-lg text-xs text-red-700 font-semibold border border-red-200">
                नोट: रिवार्ड सिक्के पाठकों की सहभागिता बढ़ाने के लिए हैं। भविष्य में इनके जरिए ई-गिफ्ट वाउचर एवं मर्चेंडाइज प्राप्त किए जा सकेंगे।
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-2">
              {demoNotifications.map(n => (
                <div key={n.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-start gap-3">
                  <Bell className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{n.title}</h5>
                    <p className="text-xs text-gray-600">{n.desc}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
