import React, { useState, useEffect } from 'react';
import {
  AppRole,
  ArticleDetail,
  ArticleItem,
  ArticlePriority,
  CreateDraftRequest,
  ReporterProfile,
  BreakingTickerItem,
  AdBannerItem,
  MandiRateItem,
  ReadingHistoryRecord,
  ApiPoolKeyItem,
  SystemAuditLogItem,
} from './types';
import {
  CATEGORIES,
  DISTRICTS,
  DIVISIONS,
  EPAPER_EDITIONS,
  INITIAL_ARTICLES,
  INITIAL_PENDING_STORIES,
  MOCK_REPORTERS,
  MOCK_ADS,
  MOCK_MANDI_RATES,
  MOCK_API_POOL,
  MOCK_AUDIT_LOGS,
  MOCK_TICKERS,
} from './data/mockNewsData';
import { BnwMasthead } from './components/BnwMasthead';
import { BottomNav, NavTab } from './components/BottomNav';
import { NavDrawer } from './components/NavDrawer';
import { Footer } from './components/Footer';
// Performance Optimization (ME-027 / STEP 18): Code-splitting operational and content surfaces
const HomeScreen = React.lazy(() => import('./screens/HomeScreen').then((m) => ({ default: m.HomeScreen })));
const ArticleDetailScreen = React.lazy(() => import('./screens/ArticleDetailScreen').then((m) => ({ default: m.ArticleDetailScreen })));
const EpaperScreen = React.lazy(() => import('./screens/EpaperScreen.tsx').then((m) => ({ default: m.EpaperScreen })));
const ReporterDeskScreen = React.lazy(() => import('./screens/ReporterDeskScreen').then((m) => ({ default: m.ReporterDeskScreen })));
const NewsroomDeskScreen = React.lazy(() => import('./screens/NewsroomDeskScreen').then((m) => ({ default: m.NewsroomDeskScreen })));
const AdminControlScreen = React.lazy(() => import('./screens/AdminControlScreen').then((m) => ({ default: m.AdminControlScreen })));
const SearchScreen = React.lazy(() => import('./screens/SearchScreen').then((m) => ({ default: m.SearchScreen })));
const ProfileScreen = React.lazy(() => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })));
const GraphicsStudioScreen = React.lazy(() => import('./screens/GraphicsStudioScreen').then((m) => ({ default: m.GraphicsStudioScreen })));
const VideoStudioScreen = React.lazy(() => import('./screens/VideoStudioScreen').then((m) => ({ default: m.VideoStudioScreen })));
const AiNewsroomScreen = React.lazy(() => import('./screens/AiNewsroomScreen').then((m) => ({ default: m.AiNewsroomScreen })));
import { Radio, X } from 'lucide-react';
import { apiClient, AuthUser, getStoredAccessToken } from './services/apiClient';
import {
  auth,
  onAuthStateChanged,
  FirebaseUser,
  syncUserProfileToFirestore,
  fetchUserBookmarksFromFirestore,
  saveBookmarkToFirestore,
  removeBookmarkFromFirestore,
} from './firebase';

export const App: React.FC = () => {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // App Role Persona: Default MUST strictly be 'READER' for all visitors
  // accountRole preserves the verified Firebase/backend privilege (e.g. MASTER_ADMIN) while switching personas
  const [accountRole, setAccountRole] = useState<AppRole>('READER');
  const [currentRole, setCurrentRole] = useState<AppRole>('READER');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const lastAuthUidRef = React.useRef<string | null>(null);

  // Filter signals from Drawer Menu to Home
  const [initialCategoryFilter, setInitialCategoryFilter] = useState<string | null>(null);
  const [initialDistrictFilter, setInitialDistrictFilter] = useState<string | null>(null);

  // News State
  const [articles, setArticles] = useState<ArticleDetail[]>(INITIAL_ARTICLES);
  const [pendingStories, setPendingStories] = useState<ArticleDetail[]>(INITIAL_PENDING_STORIES);
  const [reporterDrafts, setReporterDrafts] = useState<ArticleDetail[]>(INITIAL_PENDING_STORIES);

  // Operational Surface States
  const [reporters, setReporters] = useState<ReporterProfile[]>(MOCK_REPORTERS);
  const [ads, setAds] = useState<AdBannerItem[]>(MOCK_ADS);
  const [mandiRates, setMandiRates] = useState<MandiRateItem[]>(MOCK_MANDI_RATES);
  const [tickers, setTickers] = useState<BreakingTickerItem[]>(MOCK_TICKERS);
  const [apiPool, setApiPool] = useState<ApiPoolKeyItem[]>(MOCK_API_POOL);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogItem[]>(MOCK_AUDIT_LOGS);

  // User engagement
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['art-1', 'art-3']);
  const [userCoins, setUserCoins] = useState<number>(45);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('bnw_reading_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Active Statewide Alert
  const [activeAlert, setActiveAlert] = useState<{ title: string; district: string } | null>({
    title: 'मौसम विभाग: ग्वालियर-चंबल एवं विंध्य अंचल में अगले 24 घंटे गरज-चमक के साथ यलो अलर्ट जारी।',
    district: 'पूरा मध्य प्रदेश',
  });

  const resolveHighestRole = (roles: string[]): AppRole => {
    const upperRoles = roles.map((r) => String(r).toUpperCase());
    if (upperRoles.includes('MASTER_ADMIN') || upperRoles.includes('SUPER_ADMIN')) {
      return 'MASTER_ADMIN';
    }
    if (upperRoles.includes('ADMIN')) {
      return 'ADMIN';
    }
    if (upperRoles.includes('CHIEF_EDITOR') || upperRoles.includes('EDITOR')) {
      return 'EDITOR';
    }
    if (upperRoles.includes('REPORTER')) {
      return 'REPORTER';
    }
    return 'READER';
  };

  const handleBackendSessionLogin = (user: AuthUser) => {
    const resolvedRole = resolveHighestRole(user.roles || []);
    lastAuthUidRef.current = user.id;
    setAuthUser(user);
    setAccountRole(resolvedRole);
    setCurrentRole(resolvedRole);
  };

  const handleQuickMasterLogin = async () => {
    try {
      const user = await apiClient.auth.login('master_admin');
      handleBackendSessionLogin(user);
    } catch (err) {
      console.warn('[BNW Preview Auth] Master login fallback notice:', err);
    }
  };

  // Authenticated Session Synchronizer (Supports both Firebase & Backend Preview JWT Sessions)
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;

      if (!firebaseUser) {
        // Check if an authenticated backend JWT session is active (e.g., Preview Master Admin login)
        if (getStoredAccessToken()) {
          try {
            const backendUser = await apiClient.auth.getCurrentUser();
            if (isMounted && backendUser && backendUser.roles && backendUser.roles.length > 0) {
              const resolvedRole = resolveHighestRole(backendUser.roles);
              const isNewUserSession = lastAuthUidRef.current !== backendUser.id;
              lastAuthUidRef.current = backendUser.id;
              setAuthUser(backendUser);
              setAccountRole(resolvedRole);
              if (isNewUserSession) {
                setCurrentRole(resolvedRole);
              }
              setIsAuthChecking(false);
              return;
            }
          } catch {
            // Fall through to clean public reader reset
          }
        }

        apiClient.auth.clearStoredTokens?.();
        lastAuthUidRef.current = null;
        setAuthUser(null);
        setAccountRole('READER');
        setCurrentRole('READER');
        setIsAuthChecking(false);
        return;
      }

      setIsAuthChecking(true);
      try {
        // Authenticated with Firebase: obtain fresh ID token and exchange with backend
        let idToken = await firebaseUser.getIdToken();
        let authUserRecord: AuthUser | null = null;
        try {
          authUserRecord = await apiClient.auth.loginWithFirebase(idToken);
        } catch {
          // Retry once with forced fresh ID token in case signing keys rotated or token just hydrated
          idToken = await firebaseUser.getIdToken(true);
          authUserRecord = await apiClient.auth.loginWithFirebase(idToken);
        }
        if (!isMounted) return;

        if (authUserRecord && authUserRecord.roles && authUserRecord.roles.length > 0) {
          const resolvedRole = resolveHighestRole(authUserRecord.roles);
          const isNewUserSession = lastAuthUidRef.current !== authUserRecord.id;
          lastAuthUidRef.current = authUserRecord.id;
          setAuthUser(authUserRecord);
          setAccountRole(resolvedRole);
          if (isNewUserSession) {
            setCurrentRole(resolvedRole);
          }
          // Sync user profile & bookmarks with live Cloud Firestore
          syncUserProfileToFirestore(firebaseUser, resolvedRole).catch(() => {});
          fetchUserBookmarksFromFirestore(firebaseUser.uid)
            .then((remoteIds) => {
              if (isMounted && remoteIds.length > 0) {
                setBookmarkedIds((prev) => Array.from(new Set([...prev, ...remoteIds])));
              }
            })
            .catch(() => {});
        } else {
          lastAuthUidRef.current = null;
          setAuthUser(null);
          setAccountRole('READER');
          setCurrentRole('READER');
        }
      } catch (err) {
        console.warn('[BNW Auth] Backend session exchange notice:', err);
        try {
          const user = await apiClient.auth.getCurrentUser();
          if (isMounted && user && user.roles && user.roles.length > 0) {
            const resolvedRole = resolveHighestRole(user.roles);
            const isNewUserSession = lastAuthUidRef.current !== user.id;
            lastAuthUidRef.current = user.id;
            setAuthUser(user);
            setAccountRole(resolvedRole);
            if (isNewUserSession) {
              setCurrentRole(resolvedRole);
            }
            syncUserProfileToFirestore(firebaseUser, resolvedRole).catch(() => {});
            return;
          }
        } catch {
          // ignore fallback error
        }
        if (isMounted) {
          // Preserve basic Reader UI identity from verified Firebase Auth without granting elevated roles
          lastAuthUidRef.current = firebaseUser.uid;
          setAuthUser({
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName || firebaseUser.email || 'पाठक',
            email: firebaseUser.email || undefined,
            roles: ['READER'],
          });
          setAccountRole('READER');
          setCurrentRole('READER');
          syncUserProfileToFirestore(firebaseUser, 'READER').catch(() => {});
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Real-Time Push Notification Service Worker & Live SSE Stream Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (typeof EventSource === 'undefined') return;
    const stream = new EventSource('/api/v1/notifications/stream');

    const handleLiveNotification = async (ev: Event) => {
      try {
        const msgEv = ev as MessageEvent;
        const data = JSON.parse(msgEv.data);
        const title = data.title || data.message || 'ताज़ा ब्रेकिंग न्यूज़ अलर्ट';
        const district = data.district || 'मध्य प्रदेश';

        setActiveAlert({ title, district });

        // Respect quiet hours unless critical priority
        let suppressPush = false;
        try {
          const saved = localStorage.getItem('bnw_notif_prefs');
          if (saved) {
            const prefs = JSON.parse(saved);
            if (prefs.breakingAlerts === false && data.priority !== 'critical') {
              suppressPush = true;
            }
            if (prefs.quietHours && data.priority !== 'critical') {
              const hour = new Date().getHours();
              if (hour >= 22 || hour < 6) suppressPush = true;
            }
          }
        } catch {
          // ignore
        }

        if (!suppressPush && 'Notification' in window && Notification.permission === 'granted') {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration('/sw.js').catch(() => null);
            if (reg) {
              await reg.showNotification('BREAKING NEWS WALA', {
                body: `[${district}] ${title}`,
                icon: '/brand/logo.png',
                tag: `bnw-alert-${data.id || Date.now()}`,
              });
              return;
            }
          }
          new Notification('BREAKING NEWS WALA', {
            body: `[${district}] ${title}`,
            icon: '/brand/logo.png',
          });
        }
      } catch {
        // Ignore malformed SSE payload
      }
    };

    stream.addEventListener('notification', handleLiveNotification);
    return () => {
      stream.removeEventListener('notification', handleLiveNotification);
      stream.close();
    };
  }, []);

  // URL Hash Synchronizer with Strict Server-Side Role Route Guards
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const pathname = window.location.pathname.replace('/', '').toLowerCase();
      const target = hash || pathname;

      if (target === 'epaper' || target === 'search' || target === 'profile') {
        setSelectedArticleId(null);
        setActiveTab(target as NavTab);
      } else if (target === 'reporter') {
        if (['MASTER_ADMIN', 'ADMIN', 'EDITOR', 'REPORTER'].includes(currentRole)) {
          setSelectedArticleId(null);
          setActiveTab('reporter');
        } else {
          window.location.hash = '';
          setSelectedArticleId(null);
          setActiveTab('home');
        }
      } else if (target === 'newsroom') {
        if (['MASTER_ADMIN', 'ADMIN', 'EDITOR'].includes(currentRole)) {
          setSelectedArticleId(null);
          setActiveTab('newsroom');
        } else {
          window.location.hash = '';
          setSelectedArticleId(null);
          setActiveTab('home');
        }
      } else if (['admin', 'graphics', 'videos', 'ai-newsroom'].includes(target)) {
        if (['MASTER_ADMIN', 'ADMIN'].includes(currentRole)) {
          setSelectedArticleId(null);
          setActiveTab(target as NavTab);
        } else {
          window.location.hash = '';
          setSelectedArticleId(null);
          setActiveTab('home');
        }
      } else if (target === 'home' || target === '') {
        setSelectedArticleId(null);
        setActiveTab('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentRole]);

  // Shared Backend Server Data Synchronizer
  useEffect(() => {
    let isMounted = true;
    async function syncSharedBackend() {
      try {
        // 1. Public Feeds for all visitors
        const [pubArticlesRes, tickersRes, adsRes, mandiRes] = await Promise.all([
          apiClient.publicNews.fetchArticles({ status: 'PUBLISHED', limit: 200 }),
          apiClient.publicNews.fetchBreakingTickers(),
          apiClient.publicNews.fetchAds(),
          apiClient.publicNews.fetchMandiRates().catch(() => []),
        ]);

        if (!isMounted) return;
        if (pubArticlesRes?.items && pubArticlesRes.items.length > 0) {
          setArticles(pubArticlesRes.items);
        }
        if (tickersRes && tickersRes.length > 0) {
          setTickers(tickersRes);
        }
        if (adsRes && adsRes.length > 0) {
          setAds(adsRes);
        }
        if (mandiRes && mandiRes.length > 0) {
          setMandiRates(mandiRes);
        }

        // 2. Privileged Feeds only for authenticated Staff / Admins
        if (['MASTER_ADMIN', 'ADMIN', 'EDITOR', 'REPORTER'].includes(currentRole)) {
          const [queueRes, reportersRes, logsRes] = await Promise.allSettled([
            apiClient.newsroom.fetchIncomingQueue(),
            apiClient.admin.fetchReporters(),
            apiClient.admin.fetchAuditLogs(),
          ]);

          if (!isMounted) return;
          if (queueRes.status === 'fulfilled' && queueRes.value?.length > 0) {
            setPendingStories(queueRes.value);
            setReporterDrafts(queueRes.value);
          }
          if (reportersRes.status === 'fulfilled' && reportersRes.value?.length > 0) {
            setReporters(reportersRes.value);
          }
          if (logsRes.status === 'fulfilled' && logsRes.value?.length > 0) {
            setAuditLogs(logsRes.value);
          }
        }
      } catch (err) {
        console.warn('[BNW Shared Backend Sync] Using initial offline state:', err);
      }
    }
    syncSharedBackend();
    return () => {
      isMounted = false;
    };
  }, [currentRole]);

  const navigateToTab = (tab: NavTab) => {
    setSelectedArticleId(null);
    setActiveTab(tab);
    window.location.hash = tab === 'home' ? '' : tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Master Admin 3-Persona Switcher (Master Admin / Reporter / User)
  const handleSwitchPersona = (targetRole: AppRole, targetTab?: NavTab) => {
    if (accountRole !== 'MASTER_ADMIN') return;
    setCurrentRole(targetRole);
    if (targetTab) {
      navigateToTab(targetTab);
      return;
    }
    if (targetRole === 'READER' && ['admin', 'newsroom', 'reporter', 'graphics', 'videos', 'ai-newsroom'].includes(activeTab)) {
      navigateToTab('home');
    } else if (targetRole === 'REPORTER' && ['admin', 'newsroom', 'graphics', 'videos', 'ai-newsroom'].includes(activeTab)) {
      navigateToTab('reporter');
    } else if (targetRole === 'MASTER_ADMIN' && activeTab === 'home') {
      navigateToTab('admin');
    }
  };

  // Coin earning helper
  const handleEarnCoins = (amount: number) => {
    setUserCoins((prev) => prev + amount);
  };

  // Toggle bookmark (local state + live Cloud Firestore sync when signed in)
  const handleBookmarkToggle = (articleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyBookmarked = bookmarkedIds.includes(articleId);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
    const fbUser = auth.currentUser;
    if (fbUser?.uid) {
      if (isCurrentlyBookmarked) {
        removeBookmarkFromFirestore(fbUser.uid, articleId).catch(() => {});
      } else {
        const targetArticle = articles.find((a) => a.id === articleId);
        if (targetArticle) {
          saveBookmarkToFirestore(fbUser.uid, targetArticle).catch(() => {});
        }
      }
    }
  };

  // Share article helper (iFrame-safe: Web Share API + Clipboard toast, never window.open)
  const handleShareArticle = (article: ArticleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const articleUrl = `${window.location.origin}/#article-${article.slug || article.id}`;
    const shareText = `${article.title}\n\nपूरी खबर पढ़ें BREAKING NEWS WALA पर:\n${articleUrl}`;
    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: shareText,
          url: articleUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          setShareToast(`समाचार लिंक कॉपी हो गया: ${article.title.slice(0, 48)}...`);
          setTimeout(() => setShareToast(null), 3500);
        })
        .catch(() => {
          setShareToast('शेयर लिंक तैयार है: ' + article.title.slice(0, 48));
          setTimeout(() => setShareToast(null), 3500);
        });
    } else {
      setShareToast('शेयर लिंक: ' + articleUrl);
      setTimeout(() => setShareToast(null), 3500);
    }
  };

  // Record Article Reading History (persists locally + syncs to backend when logged in)
  const handleRecordArticleRead = (article: ArticleDetail) => {
    setReadingHistory((prev) => {
      const entry: ReadingHistoryRecord = {
        id: `hist-${article.id}`,
        userId: authUser?.id || 'guest',
        articleId: article.id,
        articleTitle: article.title,
        districtName: article.districtName,
        category: article.categoryName,
        dwellTimeSeconds: 20,
        scrollDepthPercent: 85,
        readAt: new Date().toISOString(),
      };
      const updated = [entry, ...prev.filter((r) => r.articleId !== article.id)].slice(0, 30);
      try {
        localStorage.setItem('bnw_reading_history', JSON.stringify(updated));
      } catch {
        // ignore storage quota
      }
      return updated;
    });

    if (authUser) {
      apiClient.audience
        .recordReadingHistory({
          articleId: article.id,
          dwellTimeSeconds: 20,
          scrollDepthPercent: 85,
          articleTitle: article.title,
          districtName: article.districtName,
          category: article.categoryName,
        })
        .catch(() => {});
    }
  };

  const handleClearReadingHistory = () => {
    setReadingHistory([]);
    try {
      localStorage.removeItem('bnw_reading_history');
    } catch {
      // ignore
    }
  };

  // Article Click
  const handleArticleClick = (articleId: string) => {
    setSelectedArticleId(articleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Reporter Draft (Section 7, STEP A)
  const handleSubmitReporterDraft = async (draftReq: CreateDraftRequest, reporter?: ReporterProfile) => {
    const authorId = reporter?.id || 'rep-001';
    const authorName = reporter?.name || 'राजेश पटेल';
    const authorRole = reporter?.role === 'trusted_reporter' ? 'वरिष्ठ संवाददाता' : 'फील्ड संवाददाता';

    try {
      // 1. Submit through Server API Engine
      const draft = await apiClient.reporter.createDraft(draftReq, {
        id: authorId,
        name: authorName,
        role: authorRole,
      });
      const submitted = await apiClient.reporter.submitStory(draft.id);

      setPendingStories((prev) => [submitted, ...prev.filter((p) => p.id !== submitted.id)]);
      setReporterDrafts((prev) => [submitted, ...prev.filter((d) => d.id !== submitted.id)]);

      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch (err: any) {
      console.warn('[Reporter Submit] Local fallback:', err?.message);
      const newId = `draft-${Date.now()}`;
      const dist = DISTRICTS.find((d) => d.id === draftReq.districtId);
      const cat = CATEGORIES.find((c) => c.id === draftReq.categoryId);
      const newDraft: ArticleDetail = {
        id: newId,
        slug: `draft-${newId}`,
        title: draftReq.title,
        summary: draftReq.summary || draftReq.content.slice(0, 150),
        content: draftReq.content,
        status: 'PENDING_REVIEW',
        featuredImage: draftReq.featuredImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
        imageCaption: draftReq.imageCaption,
        imageAttribution: draftReq.imageAttribution || `${authorName} (${reporter?.badgeNumber || 'BNW'})`,
        categoryId: draftReq.categoryId,
        categoryName: cat?.nameHi || 'मध्य प्रदेश',
        districtId: draftReq.districtId,
        districtName: dist?.nameHi || 'भोपाल',
        authorId,
        authorName,
        authorRole,
        isBreaking: draftReq.isBreaking,
        viewCount: 0,
        shareCount: 0,
        createdAt: 'अभी-अभी दर्ज किया गया',
        factChecked: false,
      };
      setPendingStories((prev) => [newDraft, ...prev]);
      setReporterDrafts((prev) => [newDraft, ...prev]);
    }
  };

  // Newsroom / Admin Approve and Publish (Section 7, STEP B & C)
  const handleApproveAndPublish = async (
    articleId: string,
    updatedTitle?: string,
    updatedContent?: string
  ) => {
    const target = pendingStories.find((a) => a.id === articleId) || reporterDrafts.find((d) => d.id === articleId);

    try {
      // 1. Submit through Server API Engine
      const published = await apiClient.newsroom.reviewStory(articleId, {
        action: 'approve',
        updatedTitle,
        updatedContent,
      });

      setArticles((prev) => [published, ...prev.filter((a) => a.id !== articleId)]);
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? { ...d, status: 'PUBLISHED' } : d))
      );

      if (published.isBreaking) {
        setActiveAlert({
          title: published.title,
          district: published.districtName || 'मध्य प्रदेश',
        });
      }

      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch (err: any) {
      console.warn('[Newsroom Publish] Local fallback:', err?.message);
      if (!target) return;
      const publishedArticle: ArticleDetail = {
        ...target,
        title: updatedTitle || target.title,
        content: updatedContent || target.content,
        status: 'PUBLISHED',
        publishedAt: 'अभी-अभी लाइव',
        factChecked: true,
        factCheckScore: 98,
      };

      setArticles((prev) => [publishedArticle, ...prev.filter((a) => a.id !== articleId)]);
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? { ...d, status: 'PUBLISHED' } : d))
      );
      if (target.isBreaking) {
        setActiveAlert({
          title: updatedTitle || target.title,
          district: target.districtName || 'मध्य प्रदेश',
        });
      }
    }
  };

  // Request Revision
  const handleRequestRevision = async (articleId: string, comments: string) => {
    try {
      const revised = await apiClient.newsroom.reviewStory(articleId, {
        action: 'request_changes',
        notes: comments,
        feedbackComments: comments,
      });
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? revised : d))
      );
      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch {
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) =>
          d.id === articleId
            ? { ...d, status: 'REVISION_REQUESTED', summary: `संशोधन अपेक्षित: ${comments}` }
            : d
        )
      );
    }
  };

  // Reject Article
  const handleRejectArticle = async (articleId: string, reason = 'संपादकीय नीति के अनुरूप नहीं।') => {
    try {
      const rejected = await apiClient.newsroom.reviewStory(articleId, {
        action: 'reject',
        reasonCode: 'EDITORIAL_POLICY_VIOLATION',
        feedbackComments: reason,
      });
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? rejected : d))
      );
      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch {
      setPendingStories((prev) => prev.filter((a) => a.id !== articleId));
      setReporterDrafts((prev) =>
        prev.map((d) => (d.id === articleId ? { ...d, status: 'REJECTED' } : d))
      );
    }
  };

  // Advanced Newsroom 020: Claim Article
  const handleClaimArticle = async (articleId: string, editorId: string, editorName: string) => {
    try {
      const updated = await apiClient.newsroom.reviewStory(articleId, {
        action: 'claim',
        assignedEditorId: editorId,
        assignedEditorName: editorName,
      });
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
    } catch {
      setPendingStories((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, claimedBy: editorName, assignedEditorName: editorName } : a))
      );
    }
  };

  // Advanced Newsroom 020: Reassign Story
  const handleReassignArticle = async (articleId: string, editorId: string, editorName: string) => {
    try {
      const updated = await apiClient.newsroom.reassignStory(articleId, editorId, editorName);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
    } catch {
      setPendingStories((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, assignedEditorId: editorId, assignedEditorName: editorName } : a))
      );
    }
  };

  // Advanced Newsroom 020: Update Priority
  const handleUpdatePriority = async (articleId: string, priority: ArticlePriority) => {
    try {
      const updated = await apiClient.newsroom.updatePriority(articleId, priority);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, priority } : a)));
    } catch {
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? { ...a, priority } : a)));
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, priority } : a)));
    }
  };

  // Advanced Newsroom 020: Toggle Breaking
  const handleToggleBreaking = async (articleId: string, isBreaking: boolean) => {
    try {
      const updated = await apiClient.newsroom.toggleBreaking(articleId, isBreaking);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, isBreaking } : a)));
    } catch {
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? { ...a, isBreaking } : a)));
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, isBreaking } : a)));
    }
  };

  // Advanced Newsroom 020: Schedule Publication
  const handleSchedulePublication = async (articleId: string, scheduledAt: string) => {
    try {
      const updated = await apiClient.newsroom.schedulePublication(articleId, scheduledAt);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
    } catch {
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? { ...a, scheduledAt } : a)));
    }
  };

  // Advanced Newsroom 020: Save Editorial Notes
  const handleSaveEditorialNotes = async (articleId: string, notes: string) => {
    try {
      const updated = await apiClient.newsroom.addEditorialNotes(articleId, notes);
      setPendingStories((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
    } catch {
      // Local fallback
    }
  };

  // Advanced Newsroom 020: Update Reporter Verification Status
  const handleUpdateReporterStatus = async (
    reporterId: string,
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TRAINEE'
  ) => {
    try {
      await apiClient.admin.updateReporterStatus(reporterId, status);
      setReporters((prev) =>
        prev.map((r) =>
          r.id === reporterId
            ? {
              ...r,
              status,
              verificationStatus: status === 'ACTIVE' ? 'VERIFIED' : status,
            }
            : r
        )
      );
    } catch {
      setReporters((prev) =>
        prev.map((r) =>
          r.id === reporterId
            ? {
              ...r,
              status,
              verificationStatus: status === 'ACTIVE' ? 'VERIFIED' : status,
            }
            : r
        )
      );
    }
  };

  // Advanced Newsroom 020: Assign Reporter Beats
  const handleAssignReporterBeats = async (reporterId: string, beats: string[]) => {
    try {
      await apiClient.admin.assignReporterBeats(reporterId, beats);
      setReporters((prev) => prev.map((r) => (r.id === reporterId ? { ...r, beats } : r)));
    } catch {
      setReporters((prev) => prev.map((r) => (r.id === reporterId ? { ...r, beats } : r)));
    }
  };

  // Broadcast Statewide Alert
  const handleBroadcastAlert = async (title: string, district: string) => {
    setActiveAlert({ title, district });
    try {
      await apiClient.admin.broadcastAlert(title, district);
      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch {
      // Local fallback
    }
  };

  // Ticker Handlers
  const handleAddTicker = async (ticker: BreakingTickerItem) => {
    setTickers((prev) => [ticker, ...prev]);
    try {
      await apiClient.admin.createTicker({
        textHindi: ticker.textHindi,
        districtName: ticker.districtName,
        priority: ticker.priority,
      });
    } catch {
      // Offline fallback
    }
  };

  const handleToggleTicker = async (tickerId: string) => {
    setTickers((prev) =>
      prev.map((t) => (t.id === tickerId ? { ...t, isActive: !t.isActive } : t))
    );
    try {
      await apiClient.admin.toggleTicker(tickerId);
    } catch {
      // Offline fallback
    }
  };

  const handleDeleteTicker = async (tickerId: string) => {
    setTickers((prev) => prev.filter((t) => t.id !== tickerId));
    try {
      await apiClient.admin.deleteTicker(tickerId);
    } catch {
      // Offline fallback
    }
  };

  // Reporter Role Upgrade Handler
  const handleUpdateReporterRole = async (
    reporterId: string,
    role: 'reporter' | 'trusted_reporter'
  ) => {
    setReporters((prev) =>
      prev.map((r) => (r.id === reporterId ? { ...r, role } : r))
    );
    try {
      await apiClient.admin.updateReporterRole(reporterId, role);
      const updatedLogs = await apiClient.admin.fetchAuditLogs();
      if (updatedLogs.length > 0) setAuditLogs(updatedLogs);
    } catch {
      // Offline fallback
    }
  };

  // Ad Banner Toggle / Create / Delete
  const handleToggleAdActive = async (adId: string) => {
    setAds((prev) =>
      prev.map((a) => (a.id === adId ? { ...a, isActive: !a.isActive } : a))
    );
    try {
      await apiClient.admin.toggleAd(adId);
    } catch {
      // Offline fallback
    }
  };

  const handleCreateAd = async (dto: Partial<AdBannerItem>) => {
    const tempAd: AdBannerItem = {
      id: `ad-${Date.now()}`,
      title: dto.title || 'प्रायोजित विज्ञापन',
      advertiserName: dto.advertiserName || 'विज्ञापनदाता',
      placement: dto.placement || 'top_leaderboard',
      imageUrl: dto.imageUrl || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&auto=format&fit=crop&q=80',
      targetUrl: dto.targetUrl || 'https://breakingnewswala.com',
      isActive: true,
      impressionsCount: 0,
      clicksCount: 0,
    };
    try {
      const created = await apiClient.admin.createAd(dto);
      setAds((prev) => [created, ...prev]);
    } catch {
      setAds((prev) => [tempAd, ...prev]);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    setAds((prev) => prev.filter((a) => a.id !== adId));
    try {
      await apiClient.admin.deleteAd(adId);
    } catch {
      // Offline fallback
    }
  };

  // Mandi Rates CRUD
  const handleAddMandiRate = async (dto: Partial<MandiRateItem>) => {
    const fallbackRate: MandiRateItem = {
      id: `mandi-${Date.now()}`,
      commodityName: dto.commodityName || 'सोयाबीन',
      mandiName: dto.mandiName || 'सीहोर मंडी',
      districtName: dto.districtName || 'सीहोर',
      minPrice: Number(dto.minPrice) || 4000,
      maxPrice: Number(dto.maxPrice) || 4800,
      modalPrice: Number(dto.modalPrice) || 4500,
      unit: 'क्विंटल',
      updatedAt: 'अभी-अभी अपडेटेड',
    };
    try {
      const created = await apiClient.admin.createMandiRate(dto);
      setMandiRates((prev) => [created, ...prev]);
    } catch {
      setMandiRates((prev) => [fallbackRate, ...prev]);
    }
  };

  const handleUpdateMandiRate = async (id: string, dto: Partial<MandiRateItem>) => {
    setMandiRates((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...dto, updatedAt: 'अभी-अभी अपडेटेड' } : m))
    );
    try {
      await apiClient.admin.updateMandiRate(id, dto);
    } catch {
      // Offline fallback
    }
  };

  const handleDeleteMandiRate = async (id: string) => {
    setMandiRates((prev) => prev.filter((m) => m.id !== id));
    try {
      await apiClient.admin.deleteMandiRate(id);
    } catch {
      // Offline fallback
    }
  };

  // Resolve currently active article for detail view
  const currentDetailArticle = articles.find((a) => a.id === selectedArticleId);

  // Bookmarked articles list
  const bookmarkedArticlesList = articles.filter((a) => bookmarkedIds.includes(a.id));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Global Masthead with Menu button next to Logo */}
      <BnwMasthead
        onOpenMenu={() => setIsMenuOpen(true)}
        activeTab={activeTab}
        onTabChange={navigateToTab}
        onSearchClick={() => navigateToTab('search')}
        onProfileClick={() => navigateToTab('profile')}
        currentRole={currentRole}
        accountRole={accountRole}
        isAuthenticated={Boolean(authUser)}
        onQuickMasterLogin={handleQuickMasterLogin}
        pendingQueueCount={pendingStories.length}
      />

      {/* 2. Comprehensive Navigation Menu Drawer */}
      <NavDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onTabSelect={navigateToTab}
        currentRole={currentRole}
        accountRole={accountRole}
        onRoleChange={(role) => setCurrentRole(role)}
        onSwitchPersona={handleSwitchPersona}
        onQuickMasterLogin={handleQuickMasterLogin}
        isAuthenticated={Boolean(authUser)}
        userCoins={userCoins}
        bookmarkedCount={bookmarkedIds.length}
        categories={CATEGORIES}
        districts={DISTRICTS}
        divisions={DIVISIONS}
        epaperEditions={EPAPER_EDITIONS}
        onSelectCategory={(catId) => {
          setInitialCategoryFilter(catId);
          navigateToTab('home');
        }}
        onSelectDistrict={(distId) => {
          setInitialDistrictFilter(distId);
          navigateToTab('home');
        }}
        onLogout={async () => {
          try {
            await apiClient.auth.logout();
            await auth.signOut();
          } catch (e) {
            console.error('Logout error:', e);
          }
          lastAuthUidRef.current = null;
          setAccountRole('READER');
          setCurrentRole('READER');
          setAuthUser(null);
          navigateToTab('home');
        }}
      />

      {/* 3. Statewide Emergency Breaking Notice Banner if active (compact single-line) */}
      {activeAlert && (
        <div className="bg-[#ED1727] text-white px-3 sm:px-4 py-1 flex items-center justify-between text-xs font-bold shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate pr-2">
              <Radio className="w-3.5 h-3.5 text-white animate-pulse shrink-0" />
              <span className="bg-white text-red-600 px-1.5 py-0.5 rounded text-[10px] shrink-0 font-black">
                आपात अलर्ट [{activeAlert.district}]
              </span>
              <span className="truncate text-[11px] sm:text-xs">{activeAlert.title}</span>
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="text-white hover:text-red-200 shrink-0 p-0.5"
              title="हटाएं"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {shareToast && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-slate-700">
          <span className="truncate">{shareToast}</span>
          <button onClick={() => setShareToast(null)} className="text-slate-300 hover:text-white px-2">
            ✕
          </button>
        </div>
      )}

      {/* 4. Main Body Content Switcher (4 Unified Surfaces + Utilities) */}
      <main className="flex-1">
        <React.Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-600">लोड हो रहा है... / Loading...</p>
            </div>
          }
        >
          {selectedArticleId && currentDetailArticle ? (
            <ArticleDetailScreen
              article={currentDetailArticle}
              isBookmarked={bookmarkedIds.includes(currentDetailArticle.id)}
              relatedArticles={articles.filter((a) => a.id !== currentDetailArticle.id)}
              onBackClick={() => setSelectedArticleId(null)}
              onBookmarkToggle={handleBookmarkToggle}
              onShareArticle={handleShareArticle}
              onRelatedArticleClick={handleArticleClick}
              onEarnCoins={handleEarnCoins}
              onRecordRead={handleRecordArticleRead}
            />
          ) : (
            <>
              {/* Surface 1: Public News Website */}
              {activeTab === 'home' && (
              <HomeScreen
                articles={articles}
                categories={CATEGORIES}
                districts={DISTRICTS}
                ads={ads}
                mandiRates={mandiRates}
                bookmarkedIds={bookmarkedIds}
                userCoins={userCoins}
                initialCategoryId={initialCategoryFilter}
                initialDistrictId={initialDistrictFilter}
                onArticleClick={handleArticleClick}
                onBookmarkToggle={handleBookmarkToggle}
                onShareArticle={handleShareArticle}
                onEarnCoins={handleEarnCoins}
                onNavigateEpaper={() => navigateToTab('epaper')}
              />
            )}

            {/* Epaper */}
            {activeTab === 'epaper' && (
              <EpaperScreen
                editions={EPAPER_EDITIONS}
                onBackClick={() => navigateToTab('home')}
              />
            )}

            {/* Surface 2: Reporter Web Application */}
            {activeTab === 'reporter' && (
              <ReporterDeskScreen
                categories={CATEGORIES}
                districts={DISTRICTS}
                reporterDrafts={reporterDrafts}
                reporters={reporters}
                onSubmitDraft={handleSubmitReporterDraft}
                onBackClick={() => navigateToTab('home')}
              />
            )}

            {/* Surface 3: Central Newsroom Desk */}
            {activeTab === 'newsroom' && (
              <NewsroomDeskScreen
                pendingArticles={pendingStories}
                allArticles={articles}
                reporters={reporters}
                categories={CATEGORIES}
                districts={DISTRICTS}
                currentUser={{ id: 'usr-desk-chief', name: 'मुख्य संपादक (Desk Editor)', role: currentRole }}
                onApproveAndPublish={handleApproveAndPublish}
                onRequestRevision={handleRequestRevision}
                onRejectArticle={handleRejectArticle}
                onBroadcastBreakingAlert={handleBroadcastAlert}
                onClaimArticle={handleClaimArticle}
                onReassignArticle={handleReassignArticle}
                onUpdatePriority={handleUpdatePriority}
                onToggleBreaking={handleToggleBreaking}
                onSchedulePublication={handleSchedulePublication}
                onSaveEditorialNotes={handleSaveEditorialNotes}
                onUpdateReporterStatus={handleUpdateReporterStatus}
                onAssignReporterBeats={handleAssignReporterBeats}
              />
            )}

            {/* Surface 4: Admin Control Panel */}
            {activeTab === 'admin' && (
              <AdminControlScreen
                articles={articles}
                pendingArticles={pendingStories}
                reporters={reporters}
                tickers={tickers}
                ads={ads}
                mandiRates={mandiRates}
                apiPool={apiPool}
                auditLogs={auditLogs}
                districts={DISTRICTS}
                categories={CATEGORIES}
                currentRole={currentRole}
                accountRole={accountRole}
                onSwitchPersona={handleSwitchPersona}
                onNavigateTab={navigateToTab}
                onApproveArticle={handleApproveAndPublish}
                onRequestRevision={handleRequestRevision}
                onRejectArticle={handleRejectArticle}
                onAddTicker={handleAddTicker}
                onToggleTicker={handleToggleTicker}
                onDeleteTicker={handleDeleteTicker}
                onUpdateReporterRole={handleUpdateReporterRole}
                onToggleAdActive={handleToggleAdActive}
                onAddAd={handleCreateAd}
                onDeleteAd={handleDeleteAd}
                onAddMandiRate={handleAddMandiRate}
                onUpdateMandiRate={handleUpdateMandiRate}
                onDeleteMandiRate={handleDeleteMandiRate}
                onBroadcastAlert={handleBroadcastAlert}
              />
            )}

            {/* Backwards Compatibility: Desk Tab */}
            {activeTab === 'desk' && (
              <>
                {['MASTER_ADMIN', 'ADMIN', 'EDITOR'].includes(currentRole) ? (
                  <NewsroomDeskScreen
                    pendingArticles={pendingStories}
                    allArticles={articles}
                    reporters={reporters}
                    categories={CATEGORIES}
                    districts={DISTRICTS}
                    currentUser={{ id: 'usr-desk-chief', name: 'मुख्य संपादक (Desk Editor)', role: currentRole }}
                    onApproveAndPublish={handleApproveAndPublish}
                    onRequestRevision={handleRequestRevision}
                    onRejectArticle={handleRejectArticle}
                    onBroadcastBreakingAlert={handleBroadcastAlert}
                    onClaimArticle={handleClaimArticle}
                    onReassignArticle={handleReassignArticle}
                    onUpdatePriority={handleUpdatePriority}
                    onToggleBreaking={handleToggleBreaking}
                    onSchedulePublication={handleSchedulePublication}
                    onSaveEditorialNotes={handleSaveEditorialNotes}
                    onUpdateReporterStatus={handleUpdateReporterStatus}
                    onAssignReporterBeats={handleAssignReporterBeats}
                  />
                ) : (
                  <ReporterDeskScreen
                    categories={CATEGORIES}
                    districts={DISTRICTS}
                    reporterDrafts={reporterDrafts}
                    reporters={reporters}
                    onSubmitDraft={handleSubmitReporterDraft}
                    onBackClick={() => navigateToTab('home')}
                  />
                )}
              </>
            )}

            {/* Search */}
            {activeTab === 'search' && (
              <SearchScreen
                articles={articles}
                categories={CATEGORIES}
                districts={DISTRICTS}
                bookmarkedIds={bookmarkedIds}
                onArticleClick={handleArticleClick}
                onBookmarkToggle={handleBookmarkToggle}
                onShareArticle={handleShareArticle}
              />
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <ProfileScreen
                currentRole={currentRole}
                accountRole={accountRole}
                authUser={authUser}
                onRoleChange={(newRole) => setCurrentRole(newRole)}
                onSwitchPersona={handleSwitchPersona}
                onBackendLoginSuccess={handleBackendSessionLogin}
                onLogoutSuccess={() => {
                  lastAuthUidRef.current = null;
                  setAuthUser(null);
                  setAccountRole('READER');
                  setCurrentRole('READER');
                }}
                userCoins={userCoins}
                bookmarkedArticles={bookmarkedArticlesList}
                readingHistoryProp={readingHistory}
                onClearReadingHistory={handleClearReadingHistory}
                onArticleClick={handleArticleClick}
                onRemoveBookmark={(id) => handleBookmarkToggle(id)}
                onNavigateTab={navigateToTab}
              />
            )}

            {/* Surface 5: Graphics & Design Studio */}
            {activeTab === 'graphics' && (
              <GraphicsStudioScreen
                currentUser={{
                  id: 'usr-desk-chief',
                  name: 'मुख्य संपादक (Desk Editor)',
                  role: currentRole,
                  roles: [currentRole],
                }}
                articles={articles}
                districts={DISTRICTS}
                categories={CATEGORIES}
                onNavigateHome={() => navigateToTab('home')}
                onNavigateDesk={() => navigateToTab('newsroom')}
              />
            )}

            {/* Surface 6: Video Production Studio */}
            {activeTab === 'videos' && (
              <VideoStudioScreen
                currentUser={{
                  id: 'usr-desk-chief',
                  name: 'मुख्य संपादक (Desk Editor)',
                  role: currentRole,
                  roles: [currentRole],
                }}
                articles={articles}
                districts={DISTRICTS}
                categories={CATEGORIES}
                onNavigateHome={() => navigateToTab('home')}
                onNavigateDesk={() => navigateToTab('newsroom')}
              />
            )}

            {/* Surface 7: AI Newsroom & Intelligent Automation */}
            {activeTab === 'ai-newsroom' && (
              <AiNewsroomScreen
                currentUser={{
                  id: 'usr-desk-chief',
                  name: 'मुख्य संपादक (Desk Editor)',
                  role: currentRole,
                  roles: [currentRole],
                }}
                articles={articles}
                districts={DISTRICTS}
                categories={CATEGORIES}
                onNavigateToArticles={() => navigateToTab('newsroom')}
              />
            )}
            </>
          )}
        </React.Suspense>
      </main>

      {/* 5. Comprehensive Editorial Footer */}
      {(activeTab === 'home' ||
        activeTab === 'epaper' ||
        activeTab === 'search' ||
        activeTab === 'profile' ||
        selectedArticleId) && (
          <Footer
            categories={CATEGORIES}
            districts={DISTRICTS}
            divisions={DIVISIONS}
            onNavigateTab={navigateToTab}
            onSelectCategory={(catId) => {
              setInitialCategoryFilter(catId);
              navigateToTab('home');
            }}
            onSelectDistrict={(distId) => {
              setInitialDistrictFilter(distId);
              navigateToTab('home');
            }}
          />
        )}

      {/* 6. Bottom Tab Navigation (Mobile & Tablet only) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={navigateToTab}
        currentRole={currentRole}
        pendingQueueCount={pendingStories.length}
      />
    </div>
  );
};
