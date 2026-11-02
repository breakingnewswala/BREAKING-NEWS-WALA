import React, { useState, useEffect } from 'react';
import { 
  getCurrentNewsroomUser, 
  newsroomLogout, 
  isElevatedEditor 
} from './lib/api';
import { EditorialUser } from './types';
import { BrandHeader } from './components/BrandHeader';
import { SidebarNav, NavTab } from './components/SidebarNav';
import { EditorialActivityPanel } from './components/EditorialActivityPanel';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { QueueView } from './views/QueueView';
import { BreakingDeskView } from './views/BreakingDeskView';
import { ArticleWorkspaceView } from './views/ArticleWorkspaceView';
import { DesignStudioView } from './views/DesignStudioView';
import { VideoStudioView } from './views/VideoStudioView';
import { AiNewsroomView } from './views/AiNewsroomView';
import { SocialPublishView } from './views/SocialPublishView';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<EditorialUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Parse location hash on load and popstate
  const syncHashToState = () => {
    const rawHash = window.location.hash || '#/dashboard';
    const cleanHash = rawHash.replace(/^#\/?/, '');

    if (cleanHash.startsWith('article/')) {
      const artId = cleanHash.replace('article/', '');
      setSelectedArticleId(artId);
    } else {
      setSelectedArticleId(null);
      if (cleanHash.startsWith('studio')) {
        setActiveTab('studio');
      } else if (cleanHash.startsWith('video-studio')) {
        setActiveTab('video-studio');
      } else if (cleanHash.startsWith('ai-newsroom')) {
        setActiveTab('ai-newsroom');
      } else if (cleanHash.startsWith('social-publish')) {
        setActiveTab('social-publish');
      } else if (['dashboard', 'queue', 'breaking', 'studio', 'video-studio', 'ai-newsroom', 'social-publish', 'my-claims', 'revisions', 'activity', 'published'].includes(cleanHash)) {
        setActiveTab(cleanHash as NavTab);
      } else {
        setActiveTab('dashboard');
      }
    }
  };

  // Restore authenticated session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getCurrentNewsroomUser();
        if (user && isElevatedEditor(user.roles as string[])) {
          setCurrentUser(user);
        } else if (user) {
          setAuthError('अनधिकृत भूमिका: केवल अधिकृत संपादकीय डेस्क कार्मिक ही इस पोर्टल तक पहुंच सकते हैं।');
          await newsroomLogout();
        }
      } catch (err: any) {
        console.warn('Session check failed or expired:', err?.message);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    initAuth();
    syncHashToState();

    const handleHashChange = () => {
      syncHashToState();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (user: EditorialUser) => {
    if (!isElevatedEditor(user.roles as string[])) {
      setAuthError('अनधिकृत पहुंच: केवल संपादक या प्रशासक स्तर के उपयोगकर्ता लॉग इन कर सकते हैं।');
      newsroomLogout();
      return;
    }
    setAuthError(null);
    setCurrentUser(user);
    window.location.hash = '#/dashboard';
  };

  const handleLogout = async () => {
    await newsroomLogout();
    setCurrentUser(null);
    setSelectedArticleId(null);
    window.location.hash = '#/dashboard';
  };

  const handleNavigate = (route: string) => {
    window.location.hash = route;
  };

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    window.location.hash = `#/article/${articleId}`;
  };

  const handleBackToDesk = () => {
    setSelectedArticleId(null);
    window.location.hash = `#/${activeTab}`;
  };

  if (isCheckingAuth) {
    return (
      <div className="newsroom-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/brand/logo.png" 
            alt="ब्रेकिंग न्यूज़ वाला" 
            style={{ height: '48px', width: 'auto', margin: '0 auto 16px auto', display: 'block' }} 
          />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
            संपादकीय डेस्क लोड हो रहा है...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div>
        {authError && (
          <div style={{ maxWidth: '420px', margin: '16px auto 0 auto', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', fontSize: '13px', textAlign: 'center' }}>
            {authError}
          </div>
        )}
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const currentRoute = selectedArticleId ? `#/article/${selectedArticleId}` : `#/${activeTab}`;

  return (
    <div className="newsroom-layout">
      {/* Universal Newsroom Header */}
      <BrandHeader 
        user={currentUser} 
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)', position: 'relative' }}>
        {/* Navigation Sidebar */}
        <SidebarNav
          currentRoute={currentRoute}
          isOpen={sidebarOpen}
          onNavigate={handleNavigate}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              zIndex: 35,
            }}
          />
        )}

        {/* Main Content Workspace */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          {selectedArticleId ? (
            <ArticleWorkspaceView
              articleId={selectedArticleId}
              user={currentUser}
              onBack={handleBackToDesk}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  user={currentUser}
                  onNavigate={handleNavigate}
                  onOpenArticle={handleSelectArticle}
                />
              )}

              {activeTab === 'queue' && (
                <QueueView
                  initialStatus="pending_review"
                  onOpenArticle={handleSelectArticle}
                />
              )}

              {activeTab === 'breaking' && (
                <div className="newsroom-content">
                  <BreakingDeskView onOpenArticle={handleSelectArticle} />
                </div>
              )}

              {activeTab === 'studio' && (
                <DesignStudioView />
              )}

              {activeTab === 'video-studio' && (
                <VideoStudioView />
              )}

              {activeTab === 'ai-newsroom' && (
                <AiNewsroomView />
              )}

              {activeTab === 'social-publish' && (
                <SocialPublishView />
              )}

              {activeTab === 'my-claims' && (
                <QueueView
                  initialStatus="under_review"
                  onOpenArticle={handleSelectArticle}
                />
              )}

              {activeTab === 'revisions' && (
                <QueueView
                  initialStatus="revision_requested"
                  onOpenArticle={handleSelectArticle}
                />
              )}

              {activeTab === 'published' && (
                <QueueView
                  initialStatus="published"
                  onOpenArticle={handleSelectArticle}
                />
              )}

              {activeTab === 'activity' && (
                <div className="newsroom-content">
                  <div className="page-header" style={{ marginBottom: '20px' }}>
                    <h1 className="page-title">संपादकीय ऑडिट लॉग एवं गतिविधि स्ट्रीम</h1>
                    <p className="page-subtitle">
                      संपादकों, सब-एडिटर्स और डेस्क प्रभारियों द्वारा किए गए समस्त क्रियाकलापों का रीयल-टाइम ऑडिट।
                    </p>
                  </div>
                  <EditorialActivityPanel />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
