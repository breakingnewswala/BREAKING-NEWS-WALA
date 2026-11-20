import React, { useState, useEffect, useMemo } from 'react';
import {
  EpaperEditionDoc,
  EpaperPageDoc,
  EpaperPageElement,
  ArticleDetail,
} from '../../types';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Lock,
  Layers,
  FileText,
  User,
  Camera,
  BookOpen,
  Sparkles,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  X,
  Calendar,
  MapPin,
  Tag,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { DISTRICTS, CATEGORIES } from '../../data/mockNewsData';

export interface EpaperNewsSelectionDeskProps {
  edition: EpaperEditionDoc;
  articles: ArticleDetail[];
  onBack: () => void;
  onPageUpdated?: (updatedPage: EpaperPageDoc) => void;
  onOpenDesigner?: (editionId: string, pageNumber: number) => void;
}

export const WORKFLOW_STAGES = [
  { key: 'NEWS_RECEIVED', labelHi: 'समाचार प्राप्त', labelEn: 'NEWS RECEIVED', step: 1 },
  { key: 'EDITORIAL_REVIEW', labelHi: 'संपादकीय समीक्षा', labelEn: 'EDITORIAL REVIEW', step: 2 },
  { key: 'APPROVED_FOR_EPAPER', labelHi: 'ई-पेपर स्वीकृत', labelEn: 'APPROVED FOR E-PAPER', step: 3 },
  { key: 'ASSIGNED_TO_PAGE', labelHi: 'पृष्ठ पर असाइन', labelEn: 'ASSIGNED TO PAGE', step: 4 },
  { key: 'PAGE_DESIGNED', labelHi: 'डिज़ाइन पूर्ण', labelEn: 'PAGE DESIGNED', step: 5 },
  { key: 'QUALITY_CHECK', labelHi: 'गुणवत्ता जांच', labelEn: 'PROOFREADING / QC', step: 6 },
  { key: 'FINAL_APPROVED', labelHi: 'अंतिम अनुमोदन', labelEn: 'FINAL APPROVED', step: 7 },
  { key: 'PUBLISHED', labelHi: 'प्रकाशित', labelEn: 'PUBLISHED', step: 8 },
];

export const EpaperNewsSelectionDesk: React.FC<EpaperNewsSelectionDeskProps> = ({
  edition,
  articles: initialArticles,
  onBack,
  onPageUpdated,
  onOpenDesigner,
}) => {
  // Page state
  const [pages, setPages] = useState<EpaperPageDoc[]>([]);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(true);
  const [isSavingPage, setIsSavingPage] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Article state
  const [articleList, setArticleList] = useState<ArticleDetail[]>(initialArticles || []);
  const [isLoadingArticles, setIsLoadingArticles] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<string>('all');
  const [filterHasImageOnly, setFilterHasImageOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'latest' | 'priority' | 'relevance'>('latest');
  const [dashboardTab, setDashboardTab] = useState<
    | 'ALL'
    | 'PENDING_REVIEW'
    | 'APPROVED_EPAPER'
    | 'ASSIGNED_PAGES'
    | 'PENDING_PROOFREADING'
    | 'FINAL_APPROVED'
    | 'RECENTLY_UPDATED'
  >('ALL');
  const [isPageOverviewOpen, setIsPageOverviewOpen] = useState<boolean>(false);

  // Multi-selection & Bulk assign
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [bulkTargetPage, setBulkTargetPage] = useState<number>(1);
  const [isBulkAssigning, setIsBulkAssigning] = useState<boolean>(false);

  // Editorial Credits
  const [staffCredits, setStaffCredits] = useState<Array<{ id: string; fullName: string; role: string }>>([
    { id: 'usr-editor-1', fullName: 'दिनेश अग्निहोत्री (डेस्क संपादक)', role: 'EDITOR' },
    { id: 'usr-editor-2', fullName: 'समीक्षक संपादक (डेस्क 2)', role: 'EDITOR' },
    { id: 'usr-admin-1', fullName: 'प्रधान संपादक / सिस्टम एडमिन', role: 'CHIEF_EDITOR' },
    { id: 'usr-master-1', fullName: 'मास्टर एडमिन (BNW Live)', role: 'MASTER_ADMIN' },
  ]);
  const [selectedEditorCredit, setSelectedEditorCredit] = useState<string>('दिनेश अग्निहोत्री (डेस्क संपादक)');

  // Modals
  const [previewArticle, setPreviewArticle] = useState<ArticleDetail | null>(null);
  const [duplicateConfirm, setDuplicateConfirm] = useState<{
    isOpen: boolean;
    article: ArticleDetail | null;
    placedOnPage: number | null;
    targetPage: number;
    isBulk?: boolean;
    bulkIds?: string[];
  } | null>(null);

  // Load edition pages
  useEffect(() => {
    let isMounted = true;
    async function loadPages() {
      setIsLoadingPages(true);
      try {
        const { apiClient } = await import('../../services/apiClient');
        const fetchedPages = await apiClient.epaper.getEditionPages(edition.id);
        if (isMounted) {
          if (fetchedPages && fetchedPages.length > 0) {
            setPages(fetchedPages);
          } else {
            const total = edition.totalPages || 12;
            const fallback: EpaperPageDoc[] = Array.from({ length: total }).map((_, i) => ({
              id: `page-${edition.id}-${i + 1}`,
              editionId: edition.id,
              pageNumber: i + 1,
              pageTitle: i === 0 ? 'प्रथम पृष्ठ (मुख्य समाचार)' : `पृष्ठ ${i + 1}`,
              sectionType: i === 0 ? 'FRONT_PAGE' : 'STATE',
              gridColumns: i === 3 ? 6 : 8,
              elements: [],
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
            setPages(fallback);
          }
        }
      } catch {
        if (isMounted) {
          const total = edition.totalPages || 12;
          const fallback: EpaperPageDoc[] = Array.from({ length: total }).map((_, i) => ({
            id: `page-${edition.id}-${i + 1}`,
            editionId: edition.id,
            pageNumber: i + 1,
            pageTitle: i === 0 ? 'प्रथम पृष्ठ (मुख्य समाचार)' : `पृष्ठ ${i + 1}`,
            sectionType: i === 0 ? 'FRONT_PAGE' : 'STATE',
            gridColumns: i === 3 ? 6 : 8,
            elements: [],
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setPages(fallback);
        }
      } finally {
        if (isMounted) setIsLoadingPages(false);
      }
    }

    loadPages();
    return () => {
      isMounted = false;
    };
  }, [edition.id, edition.totalPages]);

  // Load staff credits & fresh eligible articles
  useEffect(() => {
    let isMounted = true;
    async function loadExtras() {
      try {
        const { apiClient } = await import('../../services/apiClient');
        if (apiClient.epaper?.getStaffCredits) {
          const staff = await apiClient.epaper.getStaffCredits();
          if (isMounted && staff && staff.length > 0) {
            setStaffCredits(staff);
            setSelectedEditorCredit(staff[0].fullName);
          }
        }

        if (apiClient.epaper?.getEligibleArticles) {
          const res = await apiClient.epaper.getEligibleArticles({ limit: 100 });
          if (isMounted && res.items && res.items.length > 0) {
            // Merge with initial articles without duplicates
            setArticleList((prev) => {
              const existingIds = new Set(prev.map((a) => a.id));
              const fresh = res.items.filter((a) => !existingIds.has(a.id));
              return [...prev, ...fresh];
            });
          }
        }
      } catch {
        // Fallbacks already in state
      }
    }
    loadExtras();
    return () => {
      isMounted = false;
    };
  }, []);

  const activePage = pages.find((p) => p.pageNumber === activePageNum) || pages[0] || null;

  // Build duplicate placement index: articleId -> pageNumber
  const placedArticleMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const page of pages) {
      for (const el of page.elements || []) {
        if (el.articleId) {
          map.set(el.articleId, page.pageNumber);
        }
      }
    }
    return map;
  }, [pages]);

  // Helper: word count & length category
  const getArticleLengthCategory = (text: string): 'SHORT' | 'MEDIUM' | 'LONG' => {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    if (words < 100) return 'SHORT';
    if (words <= 300) return 'MEDIUM';
    return 'LONG';
  };

  // Helper: word count number
  const getWordCount = (text: string): number => {
    return (text || '').trim().split(/\s+/).filter(Boolean).length;
  };

  // Compute Newsroom Dashboard Operational Counts
  const dashboardCounts = useMemo(() => {
    let pendingReview = 0;
    let approved = 0;
    let assigned = 0;
    let proofreading = 0;
    let finalApproved = 0;

    for (const a of articleList) {
      const artStatus = String(a.status || '').toUpperCase();
      const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
      if (
        artStatus === 'IN_REVIEW' ||
        artStatus === 'SUBMITTED' ||
        epStatus === 'EDITORIAL_REVIEW' ||
        epStatus === 'NEWS_RECEIVED'
      ) {
        pendingReview++;
      }
      if (
        epStatus === 'APPROVED_FOR_EPAPER' ||
        (artStatus === 'APPROVED' && !placedArticleMap.has(a.id))
      ) {
        approved++;
      }
      if (epStatus === 'ASSIGNED_TO_PAGE' || placedArticleMap.has(a.id)) {
        assigned++;
      }
      if (epStatus === 'PAGE_DESIGNED' || epStatus === 'QUALITY_CHECK') {
        proofreading++;
      }
      if (epStatus === 'FINAL_APPROVED') {
        finalApproved++;
      }
    }
    return {
      all: articleList.length,
      pendingReview,
      approved,
      assigned,
      proofreading,
      finalApproved,
    };
  }, [articleList, placedArticleMap]);

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    let list = [...articleList];

    // Dashboard View Tabs Filter (Section 5)
    if (dashboardTab === 'PENDING_REVIEW') {
      list = list.filter((a) => {
        const artStatus = String(a.status || '').toUpperCase();
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return (
          artStatus === 'IN_REVIEW' ||
          artStatus === 'SUBMITTED' ||
          epStatus === 'EDITORIAL_REVIEW' ||
          epStatus === 'NEWS_RECEIVED'
        );
      });
    } else if (dashboardTab === 'APPROVED_EPAPER') {
      list = list.filter((a) => {
        const artStatus = String(a.status || '').toUpperCase();
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return (
          epStatus === 'APPROVED_FOR_EPAPER' ||
          (artStatus === 'APPROVED' && !placedArticleMap.has(a.id))
        );
      });
    } else if (dashboardTab === 'ASSIGNED_PAGES') {
      list = list.filter((a) => {
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return epStatus === 'ASSIGNED_TO_PAGE' || placedArticleMap.has(a.id);
      });
    } else if (dashboardTab === 'PENDING_PROOFREADING') {
      list = list.filter((a) => {
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return epStatus === 'PAGE_DESIGNED' || epStatus === 'QUALITY_CHECK';
      });
    } else if (dashboardTab === 'FINAL_APPROVED') {
      list = list.filter((a) => {
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return epStatus === 'FINAL_APPROVED';
      });
    } else if (selectedApprovalStatus === 'all') {
      // Default: Only approved / published or epaper-stage articles
      list = list.filter((a) => {
        const artStatus = String(a.status || '').toUpperCase();
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return (
          artStatus === 'APPROVED' ||
          artStatus === 'PUBLISHED' ||
          [
            'APPROVED_FOR_EPAPER',
            'ASSIGNED_TO_PAGE',
            'PAGE_DESIGNED',
            'QUALITY_CHECK',
            'FINAL_APPROVED',
          ].includes(epStatus)
        );
      });
    } else {
      const target = selectedApprovalStatus.toUpperCase();
      list = list.filter((a) => {
        const artStatus = String(a.status || '').toUpperCase();
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return artStatus === target || epStatus === target;
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(
        (a) =>
          a.category === selectedCategory ||
          a.categoryId === selectedCategory ||
          a.categoryName === selectedCategory
      );
    }

    // District filter
    if (selectedDistrict !== 'all') {
      list = list.filter(
        (a) =>
          a.districtId === selectedDistrict ||
          a.districtName === selectedDistrict
      );
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      list = list.filter(
        (a) => String(a.priority || '').toUpperCase() === selectedPriority.toUpperCase()
      );
    }

    // Featured image filter
    if (filterHasImageOnly) {
      list = list.filter(
        (a) =>
          Boolean(a.featuredImage && a.featuredImage.trim()) ||
          Boolean(a.imageUrl && a.imageUrl.trim())
      );
    }

    // Length filter
    if (selectedLength !== 'all') {
      list = list.filter((a) => {
        const text = a.content || a.summary || '';
        return getArticleLengthCategory(text) === selectedLength;
      });
    }

    // Search query: headline, article ID, keywords, author, summary
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        const matchesId = a.id?.toLowerCase().includes(q);
        const matchesTitle = a.title?.toLowerCase().includes(q);
        const matchesSummary = a.summary?.toLowerCase().includes(q);
        const matchesContent = a.content?.toLowerCase().includes(q);
        const matchesAuthor =
          a.authorName?.toLowerCase().includes(q) ||
          (a as any).byline?.toLowerCase().includes(q);
        const matchesDistrict = a.districtName?.toLowerCase().includes(q);
        return (
          matchesId ||
          matchesTitle ||
          matchesSummary ||
          matchesContent ||
          matchesAuthor ||
          matchesDistrict
        );
      });
    }

    // Sorting
    const priorityWeight: Record<string, number> = {
      URGENT: 4,
      BREAKING: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    list.sort((a, b) => {
      if (sortBy === 'priority') {
        const pwA = priorityWeight[String(a.priority || '').toUpperCase()] || 0;
        const pwB = priorityWeight[String(b.priority || '').toUpperCase()] || 0;
        if (pwB !== pwA) return pwB - pwA;
      } else if (sortBy === 'relevance') {
        const scoreA =
          (priorityWeight[String(a.priority || '').toUpperCase()] || 0) * 10 +
          (a.featuredImage || a.imageUrl ? 5 : 0);
        const scoreB =
          (priorityWeight[String(b.priority || '').toUpperCase()] || 0) * 10 +
          (b.featuredImage || b.imageUrl ? 5 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      // Latest (default)
      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return list;
  }, [
    articleList,
    selectedApprovalStatus,
    selectedCategory,
    selectedDistrict,
    selectedPriority,
    filterHasImageOnly,
    selectedLength,
    searchQuery,
    sortBy,
  ]);

  // Multi-selection handlers
  const handleToggleSelectArticle = (articleId: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedArticleIds.length === filteredArticles.length) {
      setSelectedArticleIds([]);
    } else {
      setSelectedArticleIds(filteredArticles.map((a) => a.id));
    }
  };

  // Single Article Assignment
  const handleAssignArticle = async (article: ArticleDetail, force = false) => {
    if (!activePage) return;

    // Check duplicate placement
    const alreadyOnPage = placedArticleMap.get(article.id);
    if (alreadyOnPage && !force) {
      setDuplicateConfirm({
        isOpen: true,
        article,
        placedOnPage: alreadyOnPage,
        targetPage: activePageNum,
        isBulk: false,
      });
      return;
    }

    setIsSavingPage(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      if (apiClient.epaper?.assignArticlesToPage) {
        const res = await apiClient.epaper.assignArticlesToPage(edition.id, {
          pageNumber: activePageNum,
          articleIds: [article.id],
          editorCredit: selectedEditorCredit,
          forceDuplicate: force,
        });

        if (res && res.page) {
          setPages((prev) =>
            prev.map((p) => (p.pageNumber === activePageNum ? res.page : p))
          );
          if (onPageUpdated) onPageUpdated(res.page);
        }
      } else {
        // Fallback optimistic assign
        const reporterCredit = (article as any).byline || article.authorName || '';
        const newElement: EpaperPageElement = {
          id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          elementType: 'STORY',
          articleId: article.id,
          bounds: { x: 42.52, y: 141.73, width: 280, height: 180 },
          colSpan: 4,
          customHeadline: article.title,
          customBodyText: article.content || article.summary,
          byline: reporterCredit || 'संवाददाता',
          photoCredit: (article as any).photographer || (article as any).imageAttribution || 'बीएनडब्ल्यू फोटो ब्यूरो',
          editorCredit: selectedEditorCredit,
          missingReporterCredit: !reporterCredit,
          missingEditorCredit: !selectedEditorCredit,
          imageUrl: article.featuredImage || article.imageUrl,
          role: 'LEAD',
          zIndex: (activePage.elements?.length || 0) + 1,
        };

        const updatedElements = [...(activePage.elements || []), newElement];
        const updatedPage: EpaperPageDoc = {
          ...activePage,
          elements: updatedElements,
          version: activePage.version || 1,
        };

        setPages((prev) =>
          prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p))
        );
        const saved = await apiClient.epaper.updatePage(activePage.id, {
          elements: updatedElements,
          version: activePage.version || 1,
        });
        setPages((prev) =>
          prev.map((p) => (p.pageNumber === activePageNum ? saved : p))
        );
        if (onPageUpdated) onPageUpdated(saved);
      }

      setSaveToast(`समाचार पृष्ठ ${activePageNum} पर सफलतापूर्वक असाइन किया गया!`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setErrorToast(err.message || 'असाइनमेंट विफल रहा');
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setIsSavingPage(false);
      setDuplicateConfirm(null);
    }
  };

  // Bulk Assignment Handler
  const handleBulkAssign = async (force = false) => {
    if (selectedArticleIds.length === 0) return;

    // Check if any selected article is already placed
    const targetPage = bulkTargetPage || activePageNum;
    if (!force) {
      const duplicateIds = selectedArticleIds.filter((id) => placedArticleMap.has(id));
      if (duplicateIds.length > 0) {
        const firstDup = duplicateIds[0];
        const dupArt = articleList.find((a) => a.id === firstDup) || null;
        setDuplicateConfirm({
          isOpen: true,
          article: dupArt,
          placedOnPage: placedArticleMap.get(firstDup) || null,
          targetPage,
          isBulk: true,
          bulkIds: selectedArticleIds,
        });
        return;
      }
    }

    setIsBulkAssigning(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      if (apiClient.epaper?.assignArticlesToPage) {
        const res = await apiClient.epaper.assignArticlesToPage(edition.id, {
          pageNumber: targetPage,
          articleIds: selectedArticleIds,
          editorCredit: selectedEditorCredit,
          forceDuplicate: force,
        });

        if (res && res.page) {
          setPages((prev) =>
            prev.map((p) => (p.pageNumber === targetPage ? res.page : p))
          );
          if (onPageUpdated) onPageUpdated(res.page);
        }
      }

      setSaveToast(`${selectedArticleIds.length} समाचार पृष्ठ ${targetPage} पर सफलतापूर्वक जोड़े गए!`);
      setSelectedArticleIds([]);
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err: any) {
      setErrorToast(err.message || 'बल्क असाइनमेंट विफल रहा');
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setIsBulkAssigning(false);
      setDuplicateConfirm(null);
    }
  };

  // Remove Article from Page (Source Article Immutability Protected)
  const handleRemoveElement = async (elementId: string, articleId?: string) => {
    if (!activePage) return;
    const confirmRemove = window.confirm(
      'क्या आप इस समाचार को पृष्ठ से हटाना चाहते हैं? (ध्यान रहे: मूल वेब समाचार पूरी तरह सुरक्षित रहेगा)'
    );
    if (!confirmRemove) return;

    try {
      const { apiClient } = await import('../../services/apiClient');
      if (articleId && apiClient.epaper?.removeArticleFromPage) {
        const res = await apiClient.epaper.removeArticleFromPage(edition.id, activePageNum, articleId);
        if (res && res.page) {
          setPages((prev) =>
            prev.map((p) => (p.pageNumber === activePageNum ? res.page : p))
          );
          if (onPageUpdated) onPageUpdated(res.page);
        }
      } else {
        const updatedElements = (activePage.elements || []).filter((el) => el.id !== elementId);
        const updatedPage: EpaperPageDoc = {
          ...activePage,
          elements: updatedElements,
          version: activePage.version || 1,
        };
        setPages((prev) =>
          prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p))
        );
        const saved = await apiClient.epaper.updatePage(activePage.id, {
          elements: updatedElements,
          version: activePage.version || 1,
        });
        setPages((prev) =>
          prev.map((p) => (p.pageNumber === activePageNum ? saved : p))
        );
        if (onPageUpdated) onPageUpdated(saved);
      }
      setSaveToast('समाचार पृष्ठ से हटा दिया गया।');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setErrorToast(err.message || 'हटाना विफल रहा');
      setTimeout(() => setErrorToast(null), 4000);
    }
  };

  // Update Workflow Status of an Article
  const handleUpdateWorkflowStatus = async (articleId: string, targetStatus: string) => {
    try {
      const { apiClient } = await import('../../services/apiClient');
      if (apiClient.epaper?.updateArticleWorkflowStatus) {
        const res = await apiClient.epaper.updateArticleWorkflowStatus(articleId, {
          targetStatus,
          editionId: edition.id,
          pageNumber: activePageNum,
        });

        // Update local article state
        setArticleList((prev) =>
          prev.map((a) => (a.id === articleId ? { ...a, epaperWorkflow: res.workflow } : a))
        );
        setSaveToast(`कार्यप्रवाह स्थिति अद्यतन: ${targetStatus}`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    } catch (err: any) {
      setErrorToast(err.message || 'कार्यप्रवाह अद्यतन विफल रहा');
      setTimeout(() => setErrorToast(null), 4000);
    }
  };

  // Update element editorial role
  const handleUpdateElementRole = async (elementId: string, role: any) => {
    if (!activePage) return;
    const updatedElements = (activePage.elements || []).map((el) =>
      el.id === elementId ? { ...el, role } : el
    );
    const updatedPage = { ...activePage, elements: updatedElements };
    setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p)));

    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.epaper.updatePage(activePage.id, {
        elements: updatedElements,
        version: activePage.version || 1,
      });
    } catch {}
  };

  // Update element text overrides
  const handleUpdateElementText = async (
    elementId: string,
    field: 'customHeadline' | 'byline' | 'editorCredit' | 'customBodyText',
    val: string
  ) => {
    if (!activePage) return;
    const updatedElements = (activePage.elements || []).map((el) =>
      el.id === elementId ? { ...el, [field]: val } : el
    );
    const updatedPage = { ...activePage, elements: updatedElements };
    setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p)));

    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.epaper.updatePage(activePage.id, {
        elements: updatedElements,
        version: activePage.version || 1,
      });
    } catch {}
  };

  // Reorder elements
  const handleMoveElement = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!activePage || !activePage.elements) return;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activePage.elements.length) return;

    const list = [...activePage.elements];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updatedPage = { ...activePage, elements: list };
    setPages((prev) => prev.map((p) => (p.pageNumber === activePageNum ? updatedPage : p)));

    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.epaper.updatePage(activePage.id, {
        elements: list,
        version: activePage.version || 1,
      });
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="संस्करण सूची पर वापस जाएं"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                {edition.editionCode || 'EP-BROADSHEET'}
              </span>
              <h3 className="text-base font-bold text-slate-900">{edition.title}</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                कुल पृष्ठ: {edition.totalPages || 12}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>प्रकाशन तिथि: <strong className="text-slate-700">{edition.publicationDate}</strong></span>
              <span>•</span>
              <span>क्षेत्र: {edition.districtName || 'भोपाल'} ({edition.divisionName || 'भोपाल संभाग'})</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">न्यूज़ सिलेक्शन डेस्क (Step 3)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenDesigner && (
            <button
              onClick={() => onOpenDesigner(edition.id, activePageNum)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
              title="3-पैनल ब्रॉडशीट लेआउट डिज़ाइनर खोलें"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>लेआउट डिज़ाइनर खोलें</span>
            </button>
          )}

          {saveToast && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveToast}</span>
            </div>
          )}

          {errorToast && (
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-1.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* Newsroom Editorial Dashboard Operational Tabs (Section 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        {[
          { key: 'ALL', label: 'सभी समाचार', count: dashboardCounts.all },
          { key: 'PENDING_REVIEW', label: 'संपादकीय समीक्षाधीन', count: dashboardCounts.pendingReview },
          { key: 'APPROVED_EPAPER', label: 'ई-पेपर स्वीकृत', count: dashboardCounts.approved },
          { key: 'ASSIGNED_PAGES', label: 'पृष्ठों पर असाइन', count: dashboardCounts.assigned },
          { key: 'PENDING_PROOFREADING', label: 'प्रूफरीडिंग लंबित', count: dashboardCounts.proofreading },
          { key: 'FINAL_APPROVED', label: 'अंतिम अनुमोदित', count: dashboardCounts.finalApproved },
          { key: 'RECENTLY_UPDATED', label: 'हाल ही में अपडेट', count: null },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setDashboardTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
              dashboardTab === tab.key
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-100'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  dashboardTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Page Carousel Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="text-xs font-bold text-slate-500 mb-2 px-1 flex items-center justify-between">
          <span>लक्षित पृष्ठ चुनें (Select Target Broadsheet Page):</span>
          <span className="text-[11px] text-slate-400">
            दैनिक संस्करण: कुल 12 पृष्ठ अनिवार्य • विशेष संस्करण: स्वतंत्र पृष्ठ
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {pages.map((p) => {
            const isActive = p.pageNumber === activePageNum;
            const count = p.elements?.length || 0;

            return (
              <button
                key={p.pageNumber}
                onClick={() => setActivePageNum(p.pageNumber)}
                className={`py-2 px-3 rounded-xl border flex items-center gap-2 shrink-0 transition-all ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-100 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xs">पृष्ठ {p.pageNumber}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Row 1: Search + Sort + Clear */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="शीर्षक, आईडी, कीवर्ड, सारांश अथवा संवाददाता खोजें..."
              className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">क्रमबद्ध:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="latest">नवीनतम प्रथम (Latest)</option>
              <option value="priority">उच्च प्राथमिकता (Priority)</option>
              <option value="relevance">संपादकीय प्रासंगिकता (Relevance)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* District Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">जिला (District):</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">सभी 55 जिले</option>
              {DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameHi || d.name || d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">प्राथमिकता (Priority):</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">सभी प्राथमिकताएं</option>
              <option value="URGENT">अति महत्वपूर्ण (Urgent)</option>
              <option value="HIGH">उच्च (High)</option>
              <option value="MEDIUM">सामान्य (Medium)</option>
              <option value="LOW">कम (Low)</option>
            </select>
          </div>

          {/* Workflow Status Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">स्वीकृति स्थिति (Status):</label>
            <select
              value={selectedApprovalStatus}
              onChange={(e) => setSelectedApprovalStatus(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">ई-पेपर योग्य (Approved/Published)</option>
              <option value="APPROVED_FOR_EPAPER">ई-पेपर स्वीकृत (Approved for E-Paper)</option>
              <option value="ASSIGNED_TO_PAGE">पृष्ठ पर असाइन (Assigned)</option>
              <option value="PUBLISHED">प्रकाशित (Published)</option>
              <option value="EDITORIAL_REVIEW">संपादकीय समीक्षाधीन (Under Review)</option>
            </select>
          </div>

          {/* Article Length Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">लेख लंबाई (Length):</label>
            <select
              value={selectedLength}
              onChange={(e) => setSelectedLength(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">सभी आकार</option>
              <option value="SHORT">संक्षिप्त (&lt; 100 शब्द)</option>
              <option value="MEDIUM">मध्यम (100 - 300 शब्द)</option>
              <option value="LONG">विस्तृत (&gt; 300 शब्द)</option>
            </select>
          </div>

          {/* Featured Image Checkbox */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer pb-2 font-medium">
              <input
                type="checkbox"
                checked={filterHasImageOnly}
                onChange={(e) => setFilterHasImageOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>केवल फ़ोटो वाले समाचार</span>
              </span>
            </label>
          </div>
        </div>

        {/* Row 3: Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'border-blue-600 bg-blue-600 text-white font-bold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            सभी श्रेणियां
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'border-blue-600 bg-blue-600 text-white font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.nameHi || cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar (Visible when 1+ articles selected) */}
      {selectedArticleIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white">
              {selectedArticleIds.length} समाचार चयनित
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">लक्षित पृष्ठ:</span>
              <select
                value={bulkTargetPage}
                onChange={(e) => setBulkTargetPage(Number(e.target.value))}
                className="text-xs font-bold px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-blue-900"
              >
                {pages.map((p) => (
                  <option key={p.pageNumber} value={p.pageNumber}>
                    पृष्ठ {p.pageNumber}: {p.pageTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">संपादक क्रेडिट:</span>
              <select
                value={selectedEditorCredit}
                onChange={(e) => setSelectedEditorCredit(e.target.value)}
                className="text-xs font-bold px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-slate-800"
              >
                {staffCredits.map((sc) => (
                  <option key={sc.id} value={sc.fullName}>
                    {sc.fullName} ({sc.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAssign(false)}
              disabled={isBulkAssigning}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {isBulkAssigning
                  ? 'असाइन किया जा रहा है...'
                  : `पृष्ठ ${bulkTargetPage} पर ${selectedArticleIds.length} समाचार जोड़ें`}
              </span>
            </button>

            <button
              onClick={() => setSelectedArticleIds([])}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
            >
              चयन रद्द करें
            </button>
          </div>
        </div>
      )}

      {/* Split-Screen Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL (7 Cols): Approved News Stories Browser */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col h-[750px]">
          {/* Header & Select All */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllVisible}
                className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 font-semibold"
                title="सभी दृश्य समाचार चुनें"
              >
                {selectedArticleIds.length === filteredArticles.length && filteredArticles.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>सब चुनें ({filteredArticles.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              उपलब्ध: <strong className="text-slate-800">{filteredArticles.length}</strong> समाचार
            </div>
          </div>

          {/* Articles Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredArticles.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">कोई योग्य समाचार नहीं मिला।</p>
                <p className="text-[11px] text-slate-400">
                  कृपया खोज क्वेरी अथवा फ़िल्टर विकल्पों में परिवर्तन करें।
                </p>
              </div>
            ) : (
              filteredArticles.map((article) => {
                const placedOnPage = placedArticleMap.get(article.id);
                const isPlacedOnCurrent = placedOnPage === activePageNum;
                const isPlacedElsewhere = placedOnPage && placedOnPage !== activePageNum;
                const isSelected = selectedArticleIds.includes(article.id);
                const wordCount = getWordCount(article.content || article.summary || '');
                const lengthCat = getArticleLengthCategory(article.content || article.summary || '');
                const reporterCredit = (article as any).byline || article.authorName;
                const hasImage = Boolean(
                  (article.featuredImage && article.featuredImage.trim()) ||
                  (article.imageUrl && article.imageUrl.trim())
                );
                const currentStageKey = article.epaperWorkflow?.status ||
                  (article.status === 'PUBLISHED' || article.status === 'APPROVED' ? 'APPROVED_FOR_EPAPER' : 'NEWS_RECEIVED');
                const stageObj = WORKFLOW_STAGES.find((s) => s.key === currentStageKey) || WORKFLOW_STAGES[2];

                return (
                  <div
                    key={article.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-300'
                        : isPlacedOnCurrent
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : isPlacedElsewhere
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 hover:border-blue-200 bg-white'
                    }`}
                  >
                    {/* Top Row: Checkbox + Badges + Workflow Step */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectArticle(article.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                          {article.categoryName || article.category || 'NEWS'}
                        </span>
                        {article.districtName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            <span>{article.districtName}</span>
                          </span>
                        )}
                        {article.priority && String(article.priority).toUpperCase() !== 'NORMAL' && String(article.priority).toUpperCase() !== 'MEDIUM' && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${
                              String(article.priority).toUpperCase() === 'URGENT' ||
                              String(article.priority).toUpperCase() === 'CRITICAL' ||
                              String(article.priority).toUpperCase() === 'BREAKING'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {article.priority}
                          </span>
                        )}
                      </div>

                      {/* Workflow Stage Pill */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          <span>{stageObj.labelHi}</span>
                        </span>
                      </div>
                    </div>

                    {/* Middle: Thumbnail (if present) + Headline + Excerpt */}
                    <div className="flex gap-3">
                      {hasImage ? (
                        <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                          <img
                            src={article.featuredImage || article.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-16 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-[9px] text-slate-400 shrink-0 bg-slate-50">
                          <Camera className="w-4 h-4 text-slate-300 mb-0.5" />
                          <span>फोटो नहीं</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 leading-snug">
                          {article.title}
                        </h5>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {article.summary || article.content}
                        </p>
                      </div>
                    </div>

                    {/* Duplicate Warning Banner */}
                    {isPlacedElsewhere && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          <strong>चेतावनी:</strong> यह समाचार पहले से <strong>पृष्ठ {placedOnPage}</strong> पर असाइन है!
                        </span>
                      </div>
                    )}

                    {isPlacedOnCurrent && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>यह समाचार इस सक्रिय पृष्ठ (पृष्ठ {activePageNum}) पर सम्मिलित है।</span>
                      </div>
                    )}

                    {/* Missing Credit Warning */}
                    {!reporterCredit && (
                      <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>⚠️ रिपोर्टर क्रेडिट अनुपलब्ध (Missing Reporter Credit)</span>
                      </div>
                    )}

                    {/* Footer: Attribution, Length, and CTAs */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-slate-700">
                            {reporterCredit || 'संवाददाता अनुपलब्ध'}
                          </span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {wordCount} शब्द ({lengthCat === 'SHORT' ? 'संक्षिप्त' : lengthCat === 'MEDIUM' ? 'मध्यम' : 'विस्तृत'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Preview CTA */}
                        <button
                          onClick={() => setPreviewArticle(article)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="समाचार पूर्वावलोकन व कार्यप्रवाह देखें"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Assign to active page CTA */}
                        <button
                          onClick={() => handleAssignArticle(article, false)}
                          disabled={isSavingPage}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                            isPlacedOnCurrent
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>पृष्ठ {activePageNum} पर जोड़ें</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL (5 Cols): Active Page Story Queue & Print Copy Overrides */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col h-[750px]">
          {/* Header */}
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">सक्रिय पृष्ठ लेआउट सूची</div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>पृष्ठ {activePageNum}: {activePage?.pageTitle}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {activePage?.gridColumns || 8}-कॉलम
                </span>
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPageOverviewOpen(true)}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                title="समस्त 12 पृष्ठों का समाचार अवलोकन खोलें"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>समस्त पृष्ठ दृश्य</span>
              </button>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                {activePage?.elements?.length || 0} समाचार
              </span>
            </div>
          </div>

          {/* Assigned Stories Queue */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {!activePage?.elements || activePage.elements.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">इस पृष्ठ पर अभी कोई समाचार असाइन नहीं है।</p>
                <p className="text-[11px] text-slate-400">
                  बाईं ओर की सूची से समाचार का चयन कर "+ पृष्ठ {activePageNum} पर जोड़ें" दबाएं अथवा बल्क असाइनमेंट का उपयोग करें।
                </p>
              </div>
            ) : (
              activePage.elements.map((elem, idx) => (
                <div
                  key={elem.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group"
                >
                  {/* Top Bar: Order buttons & Role Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveElement(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                        title="ऊपर ले जाएं"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveElement(idx, 'DOWN')}
                        disabled={idx === (activePage.elements?.length || 0) - 1}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                        title="नीचे ले जाएं"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-500 ml-1">#{idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={elem.role || 'LEAD'}
                        onChange={(e) => handleUpdateElementRole(elem.id, e.target.value)}
                        className="text-[11px] font-bold px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="LEAD">मुख्य लीड (8 Col)</option>
                        <option value="SECOND_LEAD">द्वितीय लीड (4 Col)</option>
                        <option value="ANCHOR">एंकर स्टोरी (Bottom)</option>
                        <option value="BRIEF">संक्षिप्त समाचार (2 Col)</option>
                        <option value="OPINION">विचार / कॉलम</option>
                      </select>

                      <button
                        onClick={() => handleRemoveElement(elem.id, elem.articleId)}
                        className="p-1 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                        title="पृष्ठ से हटाएं (मूल समाचार सुरक्षित रहेगा)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Print Headline Override Input */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      प्रिंट शीर्षक संशोधन (Print Headline Override):
                    </label>
                    <input
                      type="text"
                      value={elem.customHeadline || ''}
                      onChange={(e) => handleUpdateElementText(elem.id, 'customHeadline', e.target.value)}
                      className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900"
                    />
                  </div>

                  {/* Credits & Overrides Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Reporter Byline */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        संवाददाता बायलाइन:
                      </label>
                      <input
                        type="text"
                        value={elem.byline || ''}
                        onChange={(e) => handleUpdateElementText(elem.id, 'byline', e.target.value)}
                        placeholder="उदा. विशेष प्रतिनिधि"
                        className="w-full text-[11px] px-2 py-1 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                      {!elem.byline && (
                        <span className="text-[9px] text-amber-600 block mt-0.5">
                          ⚠️ रिपोर्टर क्रेडिट खाली
                        </span>
                      )}
                    </div>

                    {/* Editor Credit */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        डेस्क संपादक क्रेडिट:
                      </label>
                      <input
                        type="text"
                        value={elem.editorCredit || selectedEditorCredit}
                        onChange={(e) => handleUpdateElementText(elem.id, 'editorCredit', e.target.value)}
                        placeholder="उदा. दिनेश अग्निहोत्री"
                        className="w-full text-[11px] px-2 py-1 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Photo credit & Col span indicators */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3 text-slate-400" />
                      <span>{elem.photoCredit || 'बीएनडब्ल्यू फोटो ब्यूरो'}</span>
                    </span>
                    <span className="font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                      {elem.colSpan || 4} Columns
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Immutability Guarantee Notice */}
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>स्रोत सुरक्षा गारंटी (Source Article Immutability)</span>
            </div>
            <p className="leading-tight">
              मूल वेब समाचार अपरिवर्तनीय है। यहां किए गए शीर्षक, बायलाइन अथवा संपादक संशोधन केवल ई-पेपर प्रिंट लेआउट
              में सुरक्षित होते हैं; मुख्य समाचार डेटाबेस (newsArticles) में कोई बदलाव या विलोपन नहीं होता।
            </p>
          </div>
        </div>
      </div>

      {/* ARTICLE PREVIEW MODAL */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {previewArticle.categoryName || previewArticle.category || 'समाचार'}
                </span>
                <span className="text-xs text-slate-500">ID: {previewArticle.id}</span>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-800">
              {/* Editorial Workflow State Stepper */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span>संपादकीय कार्यप्रवाह स्थिति (Editorial Workflow State):</span>
                  <span className="text-blue-700 font-bold">
                    {previewArticle.epaperWorkflow?.status || 'APPROVED_FOR_EPAPER'}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-[9px] text-center font-bold">
                  {WORKFLOW_STAGES.map((ws) => {
                    const currentStage = previewArticle.epaperWorkflow?.status || 'APPROVED_FOR_EPAPER';
                    const currentIdx = WORKFLOW_STAGES.findIndex((s) => s.key === currentStage);
                    const isDone = ws.step <= (currentIdx >= 0 ? currentIdx + 1 : 3);
                    const isCurrent = ws.key === currentStage;

                    return (
                      <div
                        key={ws.key}
                        className={`p-1 rounded-md border ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isDone
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {ws.step}. {ws.labelHi}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Headline */}
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {previewArticle.title}
              </h2>

              {/* Featured Image */}
              {previewArticle.featuredImage || previewArticle.imageUrl ? (
                <div className="space-y-1">
                  <div className="rounded-xl overflow-hidden max-h-72 bg-slate-100 border border-slate-200">
                    <img
                      src={previewArticle.featuredImage || previewArticle.imageUrl}
                      alt={previewArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between italic px-1">
                    <span>{previewArticle.imageCaption || 'चित्र: बीएनडब्ल्यू न्यूज़ ब्यूरो'}</span>
                    <span>फोटोग्राफर: {previewArticle.imageAttribution || (previewArticle as any).photographer || 'बीएनडब्ल्यू ब्यूरो'}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>⚠️ फ़ोटो अनुपलब्ध (Featured Image Missing): यह समाचार केवल टेक्स्ट स्टोरी के रूप में प्रकाशित होगा।</span>
                </div>
              )}

              {/* Metadata Pills */}
              <div className="flex flex-wrap gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <strong>संवाददाता:</strong> {previewArticle.authorName || (previewArticle as any).byline || 'अनुपलब्ध'}
                </span>
                {previewArticle.districtName && (
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <strong>जिला:</strong> {previewArticle.districtName}
                  </span>
                )}
                {previewArticle.publishedAt && (
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <strong>प्रकाशन:</strong> {previewArticle.publishedAt.slice(0, 10)}
                  </span>
                )}
              </div>

              {/* Full Article Content */}
              <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs">पूर्ण समाचार विवरण:</h4>
                <p className="whitespace-pre-line">{previewArticle.content || previewArticle.summary}</p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Workflow transition actions */}
                <button
                  onClick={() => handleUpdateWorkflowStatus(previewArticle.id, 'APPROVED_FOR_EPAPER')}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                >
                  ई-पेपर स्वीकृत करें
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleAssignArticle(previewArticle, false);
                    setPreviewArticle(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>पृष्ठ {activePageNum} पर जोड़ें</span>
                </button>
                <button
                  onClick={() => setPreviewArticle(null)}
                  className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE ASSIGNMENT CONFIRMATION MODAL */}
      {duplicateConfirm?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">डुप्लीकेट असाइनमेंट चेतावनी</h4>
                <p className="text-xs text-slate-500">Duplicate Article Placement Detected</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <p>
                {duplicateConfirm.isBulk ? (
                  <span>
                    चयनित समाचारों में से कुछ समाचार पहले से इस संस्करण के अन्य पृष्ठों पर असाइन हैं।
                  </span>
                ) : (
                  <span>
                    समाचार <strong>"{duplicateConfirm.article?.title}"</strong> पहले से <strong>पृष्ठ {duplicateConfirm.placedOnPage}</strong> पर असाइन है।
                  </span>
                )}
              </p>
              <p className="font-semibold text-amber-800">
                क्या आप इसे <strong>पृष्ठ {duplicateConfirm.targetPage}</strong> पर भी सम्मिलित करना चाहते हैं?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDuplicateConfirm(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                रद्द करें (Cancel)
              </button>
              <button
                onClick={() => {
                  if (duplicateConfirm.isBulk) {
                    handleBulkAssign(true);
                  } else if (duplicateConfirm.article) {
                    handleAssignArticle(duplicateConfirm.article, true);
                  }
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                पुष्टि करें एवं जोड़ें (Confirm & Add)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE-WISE 12-PAGE BROADSHEET OVERVIEW MODAL (Section 3) */}
      {isPageOverviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  समस्त पृष्ठ समाचार अवलोकन (Edition Page-wise Overview)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                  {edition.title} • कुल {edition.totalPages || 12} पृष्ठ
                </span>
              </div>
              <button
                onClick={() => setIsPageOverviewOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of All Pages */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages.map((p) => {
                const count = p.elements?.length || 0;
                const isCurrent = p.pageNumber === activePageNum;

                return (
                  <div
                    key={p.pageNumber}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-900">
                          पृष्ठ {p.pageNumber}: {p.pageTitle}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {count} समाचार
                        </span>
                      </div>

                      {/* Headlines list */}
                      <div className="space-y-1.5 text-xs text-slate-700 min-h-[60px]">
                        {count === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">
                            (कोई समाचार असाइन नहीं)
                          </span>
                        ) : (
                          p.elements?.slice(0, 3).map((el, idx) => (
                            <div key={el.id} className="line-clamp-1 text-[11px] font-medium flex items-center gap-1">
                              <span className="text-[10px] font-bold text-blue-600">#{idx + 1}</span>
                              <span className="truncate">{el.customHeadline}</span>
                            </div>
                          ))
                        )}
                        {count > 3 && (
                          <div className="text-[10px] text-slate-500 font-semibold">
                            +{count - 3} अन्य समाचार...
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActivePageNum(p.pageNumber);
                        setIsPageOverviewOpen(false);
                      }}
                      className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <span>पृष्ठ {p.pageNumber} पर जाएं</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>दैनिक संस्करण: कुल 12 पृष्ठ अनिवार्य • विशेष संस्करण: स्वतंत्र विन्यास</span>
              <button
                onClick={() => setIsPageOverviewOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
