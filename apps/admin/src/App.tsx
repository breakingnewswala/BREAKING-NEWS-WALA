import React, { useState, useEffect } from 'react';
import { getCurrentAdminUser, logoutAdmin, isAdminRole } from './lib/api';
import { AdminUser } from './types';
import { AdminHeader } from './components/AdminHeader';
import { AdminSidebar, AdminTab } from './components/AdminSidebar';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { UserManagementView } from './views/UserManagementView';
import { RoleGovernanceView } from './views/RoleGovernanceView';
import { ReporterManagementView } from './views/ReporterManagementView';
import { TerritoryBeatsView } from './views/TerritoryBeatsView';
import { AuditLogsView } from './views/AuditLogsView';
import { SystemSettingsView } from './views/SystemSettingsView';
import { AiManagementView } from './views/AiManagementView';
import { DesignManagementView } from './views/DesignManagementView';
import { VideoManagementView } from './views/VideoManagementView';
import { RssAutomationView } from './views/RssAutomationView';
import { SocialIntegrationsView } from './views/SocialIntegrationsView';
import { MonetizationView } from './views/MonetizationView';
import { AudienceIntelligenceView } from './views/AudienceIntelligenceView';
import { SecurityProductionView } from './views/SecurityProductionView';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Synchronize location hash with activeTab
  const syncHashToTab = () => {
    const rawHash = window.location.hash || '#/dashboard';
    const tabName = rawHash.replace(/^#\/?/, '') as AdminTab;
    if (['dashboard', 'users', 'roles', 'reporters', 'territory', 'ai', 'design', 'video', 'automation', 'integrations', 'monetization', 'analytics', 'seo', 'epaper', 'security', 'audit', 'settings'].includes(tabName)) {
      setActiveTab(tabName);
    } else {
      setActiveTab('dashboard');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getCurrentAdminUser();
        if (user && isAdminRole(user.roles)) {
          setCurrentUser(user);
        } else if (user) {
          setAuthError('अनधिकृत भूमिका: केवल सिस्टम एडमिनिस्ट्रेटर ही इस पोर्टल तक पहुंच सकते हैं।');
          await logoutAdmin();
        }
      } catch (err: any) {
        console.warn('Session check failed:', err?.message);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    initAuth();
    syncHashToTab();

    const handleHashChange = () => {
      syncHashToTab();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (user: AdminUser) => {
    if (!isAdminRole(user.roles)) {
      setAuthError('अनधिकृत पहुंच: केवल एडमिनिस्ट्रेटर खाते ही लॉग इन कर सकते हैं।');
      logoutAdmin();
      return;
    }
    setAuthError(null);
    setCurrentUser(user);
    window.location.hash = '#/dashboard';
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setCurrentUser(null);
    window.location.hash = '#/dashboard';
  };

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  if (isCheckingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src="/brand/logo.png"
            alt="BREAKING NEWS WALA"
            style={{ height: '48px', width: 'auto', margin: '0 auto 16px auto', display: 'block' }}
          />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>
            एडमिन कंट्रोल पैनल लोड हो रहा है...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div>
        {authError && (
          <div
            style={{
              maxWidth: '440px',
              margin: '16px auto 0 auto',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              fontSize: '12.5px',
              textAlign: 'center',
            }}
          >
            {authError}
          </div>
        )}
        <AdminLoginView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Top Header */}
      <AdminHeader
        user={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)', position: 'relative' }}>
        {/* Navigation Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          isOpen={sidebarOpen}
          onSelectTab={handleSelectTab}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.6)',
              zIndex: 45,
            }}
          />
        )}

        {/* Main Content Workspace */}
        <main className="admin-main">
          {activeTab === 'dashboard' && <AdminDashboardView onNavigate={handleSelectTab} />}
          {activeTab === 'users' && <UserManagementView />}
          {activeTab === 'roles' && <RoleGovernanceView />}
          {activeTab === 'reporters' && <ReporterManagementView />}
          {activeTab === 'territory' && <TerritoryBeatsView />}
          {activeTab === 'ai' && <AiManagementView />}
          {activeTab === 'design' && <DesignManagementView />}
          {activeTab === 'video' && <VideoManagementView />}
          {activeTab === 'automation' && <RssAutomationView />}
          {activeTab === 'integrations' && <SocialIntegrationsView />}
          {activeTab === 'monetization' && <MonetizationView />}
          {activeTab === 'analytics' && <AudienceIntelligenceView initialSubtab="overview" />}
          {activeTab === 'seo' && <AudienceIntelligenceView initialSubtab="seo" />}
          {activeTab === 'epaper' && <AudienceIntelligenceView initialSubtab="epaper" />}
          {activeTab === 'security' && <SecurityProductionView />}
          {activeTab === 'audit' && <AuditLogsView />}
          {activeTab === 'settings' && <SystemSettingsView />}
        </main>
      </div>
    </div>
  );
};

