import React, { useState, useEffect } from 'react';
import './styles.css';
import { ReporterArticle, ReporterUser } from './types';
import {
  getCurrentReporter,
  getStoredUserCache,
  logoutReporter,
} from './lib/api';
import { BrandHeader } from './components/BrandHeader';
import { BottomNav } from './components/BottomNav';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { NewsComposerView } from './views/NewsComposerView';
import { DraftsView } from './views/DraftsView';
import { HistoryView } from './views/HistoryView';
import { ArticleDetailView } from './views/ArticleDetailView';
import { PerformanceView } from './views/PerformanceView';
import { ProfileView } from './views/ProfileView';

export const App: React.FC = () => {
  const [user, setUser] = useState<ReporterUser | null>(getStoredUserCache());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentRoute, setCurrentRoute] = useState<string>(
    typeof window !== 'undefined' && window.location.hash ? window.location.hash : '#/dashboard'
  );

  const [selectedArticle, setSelectedArticle] = useState<ReporterArticle | null>(null);

  // 1. Listen for network changes (Online / Offline PWA capability)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Hash-based routing listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/dashboard';
      setCurrentRoute(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Check and restore authenticated session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const currentUser = await getCurrentReporter();
        if (currentUser) {
          setUser(currentUser);
        } else if (!getStoredUserCache()) {
          setUser(null);
        }
      } catch {
        // Retain cached session if offline
      } finally {
        setIsInitializing(false);
      }
    }
    restoreSession();
  }, []);

  const navigateTo = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  const handleLogout = async () => {
    await logoutReporter();
    setUser(null);
    navigateTo('#/login');
  };

  if (isInitializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/brand/logo.png" alt="BREAKING NEWS WALA" style={{ height: '40px', margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>रिपोर्टर पोर्टल लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  // Route Guard: If not authenticated, force Login View
  if (!user) {
    return (
      <LoginView
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          navigateTo('#/dashboard');
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* 1. Global Header */}
      <BrandHeader
        user={user}
        isOnline={isOnline}
        onLogout={handleLogout}
        onNavigate={navigateTo}
      />

      {/* 2. Offline Notice Banner */}
      {!isOnline && (
        <div className="network-banner offline" role="alert">
          <span>⚠️</span>
          <span>इंटरनेट डिस्कनेक्ट है — आप ऑफ़लाइन मोड में हैं। स्थानीय ड्राफ्ट सुरक्षित रहेंगे।</span>
        </div>
      )}

      {/* 3. Main Route Container */}
      <main id="main-content" style={{ flex: 1 }}>
        {/* Dashboard */}
        {currentRoute === '#/dashboard' && (
          <DashboardView
            user={user}
            onNavigate={navigateTo}
            onEditArticle={(art) => {
              setSelectedArticle(art);
              navigateTo('#/news/edit');
            }}
            onViewArticle={(art) => {
              setSelectedArticle(art);
              navigateTo('#/news/view');
            }}
          />
        )}

        {/* Create News Story */}
        {currentRoute === '#/news/create' && (
          <NewsComposerView
            user={user}
            editingArticle={null}
            onNavigate={navigateTo}
            onSuccess={() => navigateTo('#/news/history')}
          />
        )}

        {/* Edit Draft / Revisions */}
        {currentRoute === '#/news/edit' && (
          <NewsComposerView
            user={user}
            editingArticle={selectedArticle}
            onNavigate={navigateTo}
            onSuccess={() => navigateTo('#/news/history')}
          />
        )}

        {/* Saved Drafts */}
        {currentRoute === '#/news/drafts' && (
          <DraftsView
            onNavigate={navigateTo}
            onEditArticle={(art) => {
              setSelectedArticle(art);
              navigateTo('#/news/edit');
            }}
          />
        )}

        {/* Article History */}
        {currentRoute === '#/news/history' && (
          <HistoryView
            onEditArticle={(art) => {
              setSelectedArticle(art);
              navigateTo('#/news/edit');
            }}
            onViewArticle={(art) => {
              setSelectedArticle(art);
              navigateTo('#/news/view');
            }}
          />
        )}

        {/* Article Detail & Reviews */}
        {currentRoute === '#/news/view' && selectedArticle && (
          <ArticleDetailView
            article={selectedArticle}
            onBack={() => navigateTo('#/news/history')}
            onEdit={(art) => {
              setSelectedArticle(art);
              navigateTo('#/news/edit');
            }}
          />
        )}

        {/* Reporter Performance & Readership */}
        {currentRoute === '#/performance' && (
          <PerformanceView onBack={() => navigateTo('#/dashboard')} />
        )}

        {/* Reporter Profile & Press Card */}
        {currentRoute === '#/profile' && (
          <ProfileView user={user} onLogout={handleLogout} />
        )}
      </main>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav currentRoute={currentRoute} onNavigate={navigateTo} />
    </div>
  );
};

export default App;

