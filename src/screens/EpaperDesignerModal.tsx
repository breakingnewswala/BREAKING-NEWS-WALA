import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  EpaperEditionDoc,
  EpaperPageDoc,
  EpaperPageElement,
  EpaperPageElementBounds,
  EpaperElementType,
  EpaperTemplateDoc,
  EpaperTemplateRegion,
  ArticleDetail,
} from '../types';
import {
  calculateColumnGrid,
  getColumnSpanWidth,
  BROADSHEET_CONSTANTS,
  GridColumnCount,
} from '../utils/epaperLayout';
import { apiClient } from '../services/apiClient';
import { EpaperDesignerHeader } from '../components/epaper/designer/EpaperDesignerHeader';
import { EpaperToolboxPanel } from '../components/epaper/designer/EpaperToolboxPanel';
import { EpaperCanvasPanel } from '../components/epaper/designer/EpaperCanvasPanel';
import { EpaperPropertiesPanel } from '../components/epaper/designer/EpaperPropertiesPanel';
import { OccConflictDialog } from '../components/epaper/designer/OccConflictDialog';
import {
  CanvasViewportState,
  HistoryFrame,
} from '../components/epaper/designer/types';
import { Loader2, CheckCircle2, AlertCircle, Layout, X } from 'lucide-react';

export interface EpaperDesignerModalProps {
  isOpen: boolean;
  editionId: string;
  initialPageNumber?: number;
  articles: ArticleDetail[];
  onClose: () => void;
  onPageSaved?: (savedPage: EpaperPageDoc) => void;
  currentRole?: string;
}

export const EpaperDesignerModal: React.FC<EpaperDesignerModalProps> = ({
  isOpen,
  editionId,
  initialPageNumber = 1,
  articles,
  onClose,
  onPageSaved,
  currentRole = 'ADMIN',
}) => {
  const [edition, setEdition] = useState<EpaperEditionDoc | null>(null);
  const [pages, setPages] = useState<EpaperPageDoc[]>([]);
  const [activePageNum, setActivePageNum] = useState<number>(initialPageNumber);
  const [activePage, setActivePage] = useState<EpaperPageDoc | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [hasCollision, setHasCollision] = useState<boolean>(false);

  // OCC Conflict State
  const [showOccConflict, setShowOccConflict] = useState<boolean>(false);
  const [remoteVersion, setRemoteVersion] = useState<number | undefined>(undefined);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Custom Template Modal State
  const [showSaveTplModal, setShowSaveTplModal] = useState<boolean>(false);
  const [customTplName, setCustomTplName] = useState<string>('');
  const [customTplNameHi, setCustomTplNameHi] = useState<string>('');
  const [isSavingCustomTpl, setIsSavingCustomTpl] = useState<boolean>(false);

  // 50-Frame History Stack
  const [historyStack, setHistoryStack] = useState<HistoryFrame[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Viewport State
  const [viewportState, setViewportState] = useState<CanvasViewportState>({
    zoom: 0.65,
    panOffset: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    activeTool: 'select',
    showGrid: true,
    magneticSnap: true,
    showMargins: true,
    previewMode: false,
    designerMode: 'ASSISTED',
  });

  // Local synced articles state (augmented with eligible articles)
  const [articlesState, setArticlesState] = useState<ArticleDetail[]>(articles || []);

  useEffect(() => {
    if (articles && articles.length > 0) {
      setArticlesState((prev) => {
        const merged = new Map<string, ArticleDetail>();
        for (const a of articles) merged.set(a.id, a);
        for (const a of prev) {
          if (!merged.has(a.id)) merged.set(a.id, a);
        }
        return Array.from(merged.values());
      });
    }
  }, [articles]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load Edition & Pages
  const loadData = useCallback(async () => {
    if (!editionId) return;
    setIsLoading(true);
    try {
      const [fetchedEdition, fetchedPages, eligibleRes] = await Promise.all([
        apiClient.epaper.getEditionById(editionId),
        apiClient.epaper.getEditionPages(editionId),
        apiClient.epaper.getEligibleArticles({ limit: 100 }).catch(() => null),
      ]);

      setEdition(fetchedEdition);

      if (eligibleRes && Array.isArray((eligibleRes as any).items) && (eligibleRes as any).items.length > 0) {
        setArticlesState((prev) => {
          const merged = new Map<string, ArticleDetail>();
          for (const a of prev) merged.set(a.id, a);
          for (const a of (eligibleRes as any).items) merged.set(a.id, a);
          return Array.from(merged.values());
        });
      }

      if (fetchedPages && fetchedPages.length > 0) {
        setPages(fetchedPages);
        const targetPage =
          fetchedPages.find((p) => p.pageNumber === activePageNum) || fetchedPages[0];
        setActivePage(targetPage);
        setActivePageNum(targetPage.pageNumber);

        // Initialize history with loaded state
        setHistoryStack([
          {
            elements: JSON.parse(JSON.stringify(targetPage.elements || [])),
            gridColumns: targetPage.gridColumns || 8,
            timestamp: Date.now(),
            description: 'प्रारंभिक लोड',
          },
        ]);
        setHistoryIndex(0);
      } else {
        // Fallback: create default Page 1
        const fallbackPage: EpaperPageDoc = {
          id: `page-${editionId}-1`,
          editionId,
          pageNumber: 1,
          pageTitle: 'मुख्य पृष्ठ (Lead & Breaking)',
          sectionType: 'FRONT_PAGE',
          gridColumns: 8,
          elements: [
            {
              id: 'el-default-masthead-1',
              elementType: 'MASTHEAD',
              bounds: { x: 42.52, y: 113.38, width: 847.56, height: 90 },
              colSpan: 8,
              zIndex: 1,
            },
          ],
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPages([fallbackPage]);
        setActivePage(fallbackPage);
        setActivePageNum(1);
        setHistoryStack([
          {
            elements: JSON.parse(JSON.stringify(fallbackPage.elements)),
            gridColumns: 8,
            timestamp: Date.now(),
          },
        ]);
        setHistoryIndex(0);
      }
    } catch (err: any) {
      console.error('[EpaperDesigner] Failed to load edition data:', err);
      showToast('संस्करण डेटा लोड करने में त्रुटि!', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [editionId, activePageNum]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Show Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Push History State (max 50 depth)
  const pushHistory = useCallback(() => {
    if (!activePage) return;

    const newFrame: HistoryFrame = {
      elements: JSON.parse(JSON.stringify(activePage.elements || [])),
      gridColumns: activePage.gridColumns || 8,
      timestamp: Date.now(),
    };

    setHistoryStack((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const nextStack = [...sliced, newFrame];
      if (nextStack.length > 50) nextStack.shift();
      return nextStack;
    });

    setHistoryIndex((prev) => Math.min(49, prev + 1));
    setIsDirty(true);
  }, [activePage, historyIndex]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetFrame = historyStack[targetIndex];
      if (targetFrame && activePage) {
        setActivePage((prev) =>
          prev
            ? {
                ...prev,
                elements: JSON.parse(JSON.stringify(targetFrame.elements)),
                gridColumns: targetFrame.gridColumns,
              }
            : null
        );
        setHistoryIndex(targetIndex);
        setIsDirty(true);
      }
    }
  }, [historyIndex, historyStack, activePage]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetFrame = historyStack[targetIndex];
      if (targetFrame && activePage) {
        setActivePage((prev) =>
          prev
            ? {
                ...prev,
                elements: JSON.parse(JSON.stringify(targetFrame.elements)),
                gridColumns: targetFrame.gridColumns,
              }
            : null
        );
        setHistoryIndex(targetIndex);
        setIsDirty(true);
      }
    }
  }, [historyIndex, historyStack, activePage]);

  // Auto Arrange Layout (Auto Mode)
  const [isAutoArranging, setIsAutoArranging] = useState<boolean>(false);

  const handleAutoArrange = async () => {
    if (!activePage) return;
    setIsAutoArranging(true);
    pushHistory();
    try {
      const res = await apiClient.epaper.ai.autoLayout({
        elements: activePage.elements || [],
        gridColumns: (activePage.gridColumns as any) || 8,
        pageType: activePage.sectionType || 'FRONT_PAGE',
        hasMasthead: activePage.pageNumber === 1,
      });

      if (res && res.elements) {
        setActivePage((prev) => (prev ? { ...prev, elements: res.elements } : null));
        setIsDirty(true);
        showToast(
          `ऑटो-लेआउट सफल! ${res.stats?.placedCount || res.elements.length} एलिमेंट्स सुव्यवस्थित।`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('[EpaperDesigner] Auto-layout failed:', err);
      showToast(err.message || 'ऑटो-लेआउट में त्रुटि!', 'error');
    } finally {
      setIsAutoArranging(false);
    }
  };

  // Mode Change Handler (AUTO, ASSISTED, MANUAL)
  const handleModeChange = (mode: 'AUTO' | 'ASSISTED' | 'MANUAL') => {
    setViewportState((prev) => {
      const updates: Partial<CanvasViewportState> = { designerMode: mode };
      if (mode === 'AUTO') {
        updates.showGrid = true;
        updates.magneticSnap = true;
      } else if (mode === 'ASSISTED') {
        updates.showGrid = true;
        updates.magneticSnap = true;
      } else if (mode === 'MANUAL') {
        updates.magneticSnap = false;
      }
      return { ...prev, ...updates };
    });

    if (mode === 'AUTO') {
      handleAutoArrange();
    } else {
      showToast(
        mode === 'ASSISTED'
          ? 'असिस्टेड मोड: चुंबकीय स्नैपिंग एवं टकराव चेतावनियां सक्रिय'
          : 'मैन्युअल मोड: मुक्त पोज़िशनिंग एवं संपादन सक्रिय',
        'info'
      );
    }
  };

  // Fit Canvas to Screen
  const handleFitToScreen = useCallback(() => {
    const stageWidth = window.innerWidth - 640; // Subtract left/right toolbars (320px each)
    const stageHeight = window.innerHeight - 80; // Subtract header (64px) + padding

    const scaleX = (stageWidth - 40) / BROADSHEET_CONSTANTS.PAGE_WIDTH_PT;
    const scaleY = (stageHeight - 40) / BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT;
    const fitScale = Math.max(0.25, Math.min(1.2, Math.min(scaleX, scaleY)));

    setViewportState((prev) => ({
      ...prev,
      zoom: Number(fitScale.toFixed(2)),
      panOffset: { x: 0, y: 0 },
    }));
  }, []);

  // Page Switcher
  const handlePageChange = (pageNum: number) => {
    if (pageNum === activePageNum) return;
    if (isDirty) {
      if (!window.confirm('आपके पास असुरक्षित बदलाव हैं। क्या आप सहेजे बिना दूसरा पृष्ठ खोलना चाहते हैं?')) {
        return;
      }
    }

    const target = pages.find((p) => p.pageNumber === pageNum);
    if (target) {
      setActivePage(target);
      setActivePageNum(pageNum);
      setSelectedElementId(null);
      setIsDirty(false);
      setHistoryStack([
        {
          elements: JSON.parse(JSON.stringify(target.elements || [])),
          gridColumns: target.gridColumns || 8,
          timestamp: Date.now(),
        },
      ]);
      setHistoryIndex(0);
    }
  };

  // Add Story from Approved Queue
  const handleAddStory = (article: ArticleDetail) => {
    if (!activePage) return;

    // Strict Approval Gate: Prevent unapproved articles from entering page composition
    const isApproved =
      ['APPROVED', 'PUBLISHED'].includes(String(article.status || '').toUpperCase()) ||
      ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'].includes(
        String((article as any).epaperWorkflow?.status || '').toUpperCase()
      );

    if (!isApproved) {
      showToast(
        `अस्वीकृत समाचार "${article.title.substring(0, 20)}..." पृष्ठ पर नहीं जोड़ा जा सकता! केवल स्वीकृत समाचार ही अनुमत हैं।`,
        'error'
      );
      return;
    }

    const grid = calculateColumnGrid(activePage.gridColumns || 8);
    const colSpan = Math.min(4, activePage.gridColumns || 8);
    const spanWidth = getColumnSpanWidth(colSpan, grid.columnWidth, grid.gutterWidth);

    // Position new element
    const existingCount = activePage.elements?.length || 0;
    const startY = 120 + ((existingCount * 40) % 600);

    const byline = (article as any).byline || article.authorName || '';
    const editorCredit = (article as any).editorCredit || (article as any).epaperWorkflow?.editorCredit || '';
    const photoCredit = (article as any).photographer || 'बीएनडब्ल्यू फोटो ब्यूरो';
    const missingReporterCredit = !byline.trim();
    const missingEditorCredit = !editorCredit.trim();

    // Determine editorial role based on priority
    let role: 'LEAD' | 'SECOND_LEAD' | 'ANCHOR' | 'BRIEF' = 'ANCHOR';
    const prio = String(article.priority || '').toUpperCase();
    if (prio === 'BREAKING' || existingCount === 0) {
      role = 'LEAD';
    } else if (prio === 'URGENT' || prio === 'HIGH') {
      role = 'SECOND_LEAD';
    } else if (prio === 'LOW') {
      role = 'BRIEF';
    }

    const newElement: EpaperPageElement = {
      id: `elem-story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      elementType: 'STORY',
      articleId: article.id,
      bounds: {
        x: grid.columnOffsets[0] || 42.52,
        y: startY,
        width: spanWidth,
        height: 240,
      },
      colSpan,
      customHeadline: article.title,
      customBodyText: article.summary || article.content,
      byline: byline || 'संवाददाता, बीएनडब्ल्यू',
      editorCredit,
      photoCredit,
      missingReporterCredit,
      missingEditorCredit,
      imageUrl: article.imageUrl || '',
      role,
      fontSize: 11,
      zIndex: existingCount + 1,
    };

    const updatedElements = [...(activePage.elements || []), newElement];
    setActivePage({ ...activePage, elements: updatedElements });
    setSelectedElementId(newElement.id);
    pushHistory();

    const warningText = !article.imageUrl
      ? ' (⚠️ फ़ोटो अनुपलब्ध)'
      : missingReporterCredit
      ? ' (⚠️ रिपोर्टर साभार रिक्त)'
      : '';
    showToast(`"${article.title.substring(0, 24)}..." पृष्ठ पर जोड़ा गया${warningText}`, 'success');
  };

  // Reassign story element to another page before publication
  const handleReassignElementToPage = (elementId: string, targetPageNum: number) => {
    if (!activePage || targetPageNum === activePage.pageNumber) return;
    const targetElement = activePage.elements?.find((el) => el.id === elementId);
    if (!targetElement) return;

    const targetPage = pages.find((p) => p.pageNumber === targetPageNum);
    if (!targetPage) {
      showToast(`लक्ष्य पृष्ठ ${targetPageNum} नहीं मिला!`, 'error');
      return;
    }

    // Remove element from active page
    const remainingElements = (activePage.elements || []).filter((el) => el.id !== elementId);
    setActivePage({ ...activePage, elements: remainingElements });
    setSelectedElementId(null);

    // Add element to target page
    const updatedTargetElements = [
      ...(targetPage.elements || []),
      {
        ...targetElement,
        id: `elem-reassigned-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        zIndex: (targetPage.elements?.length || 0) + 1,
      },
    ];

    setPages((prev) =>
      prev.map((p) => {
        if (p.id === activePage.id) return { ...p, elements: remainingElements };
        if (p.id === targetPage.id) return { ...p, elements: updatedTargetElements };
        return p;
      })
    );

    setIsDirty(true);
    pushHistory();
    showToast(
      `समाचार "${(targetElement.customHeadline || '').substring(0, 20)}..." पृष्ठ ${targetPageNum} पर स्थानांतरित किया गया।`,
      'success'
    );
  };

  // Add Primitive Element
  const handleAddPrimitive = (elementType: EpaperElementType) => {
    if (!activePage) return;

    const grid = calculateColumnGrid(activePage.gridColumns || 8);
    let colSpan = 2;
    let height = 180;
    let defaultHeadline = 'नया शीर्षक';
    let defaultBody = 'समाचार या विवरण यहां लिखें...';

    if (elementType === 'MASTHEAD') {
      colSpan = activePage.gridColumns || 8;
      height = 90;
      defaultHeadline = 'ब्रेकिंग न्यूज़ वाला';
    } else if (elementType === 'HEADLINE') {
      colSpan = Math.min(6, activePage.gridColumns || 8);
      height = 60;
      defaultHeadline = 'मुख्य समाचार का प्रमुख शीर्षक (बैनर हेड)';
    } else if (elementType === 'AD') {
      colSpan = 2;
      height = 140;
      defaultHeadline = 'व्यावसायिक विज्ञापन स्लॉट';
      defaultBody = 'संपर्क: 9876543210';
    } else if (elementType === 'IMAGE') {
      colSpan = 3;
      height = 200;
    } else if (elementType === 'COLUMN') {
      colSpan = 2;
      height = 300;
      defaultHeadline = 'संपादकीय विमर्श';
    }

    const spanWidth = getColumnSpanWidth(colSpan, grid.columnWidth, grid.gutterWidth);
    const existingCount = activePage.elements?.length || 0;
    const startY = elementType === 'MASTHEAD' ? 113.38 : 220 + ((existingCount * 30) % 500);

    const newElement: EpaperPageElement = {
      id: `elem-${elementType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      elementType,
      bounds: {
        x: grid.columnOffsets[0] || 42.52,
        y: startY,
        width: spanWidth,
        height,
      },
      colSpan,
      customHeadline: defaultHeadline,
      customBodyText: defaultBody,
      byline: 'संपादकीय मंडल',
      photoCredit: 'बीएनडब्ल्यू ब्यूरो',
      asciBadge: elementType === 'AD',
      zIndex: existingCount + 1,
    };

    const updatedElements = [...(activePage.elements || []), newElement];
    setActivePage({ ...activePage, elements: updatedElements });
    setSelectedElementId(newElement.id);
    pushHistory();
    showToast(`${elementType} तत्व पृष्ठ पर जोड़ा गया`, 'info');
  };

  // Apply Broadsheet Preset Template
  const handleApplyTemplate = (template: EpaperTemplateDoc) => {
    if (!activePage) return;

    const templateElements: EpaperPageElement[] = (template.regions || []).map((reg, idx) => ({
      id: `elem-tpl-${Date.now()}-${idx}`,
      elementType: reg.defaultElementType || 'STORY',
      bounds: { ...reg.bounds },
      colSpan: reg.colSpan || 4,
      customHeadline: reg.name,
      customBodyText: 'समाचार विवरण या विज्ञापन सामग्री यहां प्रदर्शित होगी...',
      byline: 'संवाददाता',
      asciBadge: reg.defaultElementType === 'AD',
      zIndex: idx + 1,
    }));

    const updatedPage: EpaperPageDoc = {
      ...activePage,
      pageTitle: template.nameHi || template.name,
      sectionType: template.category || activePage.sectionType,
      gridColumns: template.gridColumns || activePage.gridColumns || 8,
      templateId: template.id,
      elements: templateElements,
    };

    setActivePage(updatedPage);
    setSelectedElementId(null);
    pushHistory();
    showToast(`"${template.nameHi || template.name}" टेम्पलेट सफलतापूर्वक लागू किया गया`, 'success');
  };

  // Update Element Bounds (from drag/resize)
  const handleUpdateElementBounds = (id: string, bounds: EpaperPageElementBounds) => {
    if (!activePage) return;
    const updatedElements = (activePage.elements || []).map((el) =>
      el.id === id ? { ...el, bounds } : el
    );
    setActivePage({ ...activePage, elements: updatedElements });
    setIsDirty(true);
  };

  // Update Element Properties
  const handleUpdateElement = (updated: EpaperPageElement) => {
    if (!activePage) return;
    const updatedElements = (activePage.elements || []).map((el) =>
      el.id === updated.id ? updated : el
    );
    setActivePage({ ...activePage, elements: updatedElements });
    setIsDirty(true);
  };

  // Duplicate Element (Ctrl+D)
  const handleDuplicateElement = (id: string) => {
    if (!activePage) return;
    const target = activePage.elements?.find((el) => el.id === id);
    if (!target) return;

    const clone: EpaperPageElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: `elem-clone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bounds: {
        ...target.bounds,
        x: target.bounds.x + 20,
        y: target.bounds.y + 20,
      },
      zIndex: (activePage.elements?.length || 0) + 1,
    };

    const updatedElements = [...(activePage.elements || []), clone];
    setActivePage({ ...activePage, elements: updatedElements });
    setSelectedElementId(clone.id);
    pushHistory();
    showToast('तत्व की प्रतिलिपि बनाई गई', 'info');
  };

  // Delete Element (Del)
  const handleDeleteElement = (id: string) => {
    if (!activePage) return;
    const updatedElements = (activePage.elements || []).filter((el) => el.id !== id);
    setActivePage({ ...activePage, elements: updatedElements });
    if (selectedElementId === id) setSelectedElementId(null);
    pushHistory();
    showToast('तत्व हटा दिया गया', 'info');
  };

  // Reorder Element Z-Index
  const handleReorderZIndex = (id: string, direction: 'UP' | 'DOWN') => {
    if (!activePage || !activePage.elements) return;
    const index = activePage.elements.findIndex((el) => el.id === id);
    if (index === -1) return;

    const targetIdx = direction === 'UP' ? index + 1 : index - 1;
    if (targetIdx < 0 || targetIdx >= activePage.elements.length) return;

    const list = [...activePage.elements];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Normalize z-indexes
    list.forEach((el, i) => {
      el.zIndex = i + 1;
    });

    setActivePage({ ...activePage, elements: list });
    pushHistory();
  };

  // Save Page with OCC Versioning
  const handleSavePage = async () => {
    if (!activePage) return;
    setIsSaving(true);
    try {
      const savedPage = await apiClient.epaper.updatePage(activePage.id, {
        elements: activePage.elements,
        gridColumns: activePage.gridColumns,
        pageTitle: activePage.pageTitle,
        sectionType: activePage.sectionType,
        version: activePage.version, // Required OCC token
      });

      setActivePage(savedPage);
      setPages((prev) => prev.map((p) => (p.id === savedPage.id ? savedPage : p)));
      setIsDirty(false);
      showToast(`पृष्ठ ${savedPage.pageNumber} सफलतापूर्वक सहेजा गया (संस्करण v${savedPage.version})!`, 'success');

      if (onPageSaved) onPageSaved(savedPage);
    } catch (err: any) {
      console.error('[EpaperDesigner] Save error:', err);
      if (err.statusCode === 409 || err.code === 'ERR_CONCURRENCY_CONFLICT') {
        // Trigger OCC Conflict Dialog
        setRemoteVersion(err.details?.currentVersion || activePage.version + 1);
        setShowOccConflict(true);
      } else {
        showToast(err.message || 'पृष्ठ सहेजने में त्रुटि!', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save current page layout as reusable custom template
  const handleSavePageAsCustomTemplate = async () => {
    if (!activePage) return;
    if (!customTplName.trim() && !customTplNameHi.trim()) {
      showToast('टेम्पलेट का नाम दर्ज करना अनिवार्य है', 'error');
      return;
    }
    setIsSavingCustomTpl(true);
    try {
      const regions: EpaperTemplateRegion[] = (activePage.elements || []).map((el, idx) => ({
        id: `reg-${idx + 1}-${String(el.elementType || 'story').toLowerCase()}`,
        name: el.customHeadline || `क्षेत्र ${idx + 1}`,
        bounds: { ...el.bounds },
        colSpan: el.colSpan || 4,
        defaultElementType: el.elementType || 'STORY',
      }));

      await apiClient.epaper.saveTemplate({
        name: customTplName.trim() || customTplNameHi.trim(),
        nameHi: customTplNameHi.trim() || customTplName.trim(),
        category: typeof activePage.sectionType === 'string' ? activePage.sectionType : 'CUSTOM',
        gridColumns: activePage.gridColumns || 8,
        regions,
        isSystem: false,
      });

      showToast(`पेज लेआउट "${customTplNameHi || customTplName}" कस्टम टेम्पलेट के रूप में सहेजा गया!`, 'success');
      setShowSaveTplModal(false);
      setCustomTplName('');
      setCustomTplNameHi('');
    } catch (err: any) {
      if (err.code === 'ERR_TEMPLATE_NAME_COLLISION' || err.statusCode === 409) {
        showToast('इस नाम का टेम्पलेट पहले से मौजूद है। कृपया कोई भिन्न नाम चुनें।', 'error');
      } else {
        showToast(err.message || 'टेम्पलेट सहेजना विफल रहा', 'error');
      }
    } finally {
      setIsSavingCustomTpl(false);
    }
  };

  // Save Draft Edition (Section 6)
  const handleSaveDraft = async () => {
    if (!edition) return;
    setIsSaving(true);
    try {
      if (activePage && isDirty) {
        await handleSavePage();
      }
      const updated = await apiClient.epaper.updateEditionStatus(edition.id, 'DRAFT', edition.version);
      if (updated) setEdition(updated);
      showToast('ई-पेपर प्रारूप (Draft) सुरक्षित रूप से सहेजा गया!', 'success');
    } catch (err: any) {
      showToast(err.message || 'प्रारूप सहेजने में त्रुटि!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Entire Edition & All Modified Pages (Section 6)
  const handleSaveEntireEdition = async () => {
    if (!edition) return;
    setIsSaving(true);
    try {
      if (activePage && isDirty) {
        await handleSavePage();
      }
      const updated = await apiClient.epaper.updateEdition(edition.id, {
        version: edition.version,
      });
      if (updated) setEdition(updated);
      showToast(`संपूर्ण संस्करण "${edition.title}" एवं पृष्ठ विन्यास सहेजे गए!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'संस्करण सहेजने में त्रुटि!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Media Upload & Content Insertion Handler (Section 5)
  const handleUploadMedia = async (
    file: File,
    category: 'newspaper' | 'article' | 'photo',
    caption?: string
  ) => {
    if (!activePage) return;
    const res = await apiClient.articles.uploadMedia(file, caption || file.name);
    if (!res || !res.url) {
      throw new Error('अपलोड प्रतिक्रिया में मान्य URL प्राप्त नहीं हुआ।');
    }

    const grid = calculateColumnGrid(activePage.gridColumns || 8);
    const colSpan = Math.min(4, activePage.gridColumns || 8);
    const spanWidth = getColumnSpanWidth(colSpan, grid.columnWidth, grid.gutterWidth);
    const existingCount = activePage.elements?.length || 0;

    const newElem: EpaperPageElement = {
      id: `elem-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      elementType: 'IMAGE',
      bounds: {
        x: grid.columnOffsets[0] || 42.52,
        y: 200 + ((existingCount * 25) % 400),
        width: spanWidth,
        height: 220,
      },
      colSpan,
      imageUrl: res.url,
      customHeadline: caption || file.name.replace(/\.[^/.]+$/, ''),
      customBodyText: caption || '',
      photoCredit:
        category === 'newspaper'
          ? 'बीएनडब्ल्यू मुख्य फोटो डेस्क'
          : category === 'photo'
          ? 'बीएनडब्ल्यू फील्ड छायाकार'
          : 'बीएनडब्ल्यू विशेष साभार',
      zIndex: existingCount + 1,
    };

    const updated = [...(activePage.elements || []), newElem];
    setActivePage({ ...activePage, elements: updated });
    setSelectedElementId(newElem.id);
    setIsDirty(true);
    pushHistory();
    showToast(`चित्र पृष्ठ ${activePage.pageNumber} पर संलग्न कर दिया गया!`, 'success');
  };

  // OCC Reload Remote
  const handleOccReloadRemote = async () => {
    if (!activePage) return;
    setShowOccConflict(false);
    setIsLoading(true);
    try {
      const freshPage = await apiClient.epaper.getPageById(activePage.id);
      if (freshPage) {
        setActivePage(freshPage);
        setPages((prev) => prev.map((p) => (p.id === freshPage.id ? freshPage : p)));
        setIsDirty(false);
        setHistoryStack([
          {
            elements: JSON.parse(JSON.stringify(freshPage.elements || [])),
            gridColumns: freshPage.gridColumns || 8,
            timestamp: Date.now(),
          },
        ]);
        setHistoryIndex(0);
        showToast(`ताज़ा संस्करण v${freshPage.version} लोड हो गया`, 'info');
      }
    } catch {
      showToast('सर्वर से पृष्ठ लोड नहीं हो सका', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // OCC Force Overwrite
  const handleOccForceOverwrite = async () => {
    if (!activePage) return;
    setShowOccConflict(false);
    setIsSaving(true);
    try {
      const freshPage = await apiClient.epaper.getPageById(activePage.id);
      const targetVersion = freshPage?.version ?? activePage.version;

      const overwritten = await apiClient.epaper.updatePage(activePage.id, {
        elements: activePage.elements,
        gridColumns: activePage.gridColumns,
        pageTitle: activePage.pageTitle,
        sectionType: activePage.sectionType,
        version: targetVersion,
      });

      setActivePage(overwritten);
      setPages((prev) => prev.map((p) => (p.id === overwritten.id ? overwritten : p)));
      setIsDirty(false);
      showToast(`पृष्ठ जबरन अधिलेखित (Force Overwritten - v${overwritten.version})!`, 'success');
      if (onPageSaved) onPageSaved(overwritten);
    } catch (err: any) {
      showToast(err.message || 'अधिलेखन में विफलता!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      // Save shortcut: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSavePage();
        return;
      }

      // Undo shortcut: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
          return;
        }
      }

      // Redo shortcut: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Duplicate shortcut: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedElementId && !isInput) {
          e.preventDefault();
          handleDuplicateElement(selectedElementId);
          return;
        }
      }

      // Delete shortcut: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedElementId) {
          e.preventDefault();
          handleDeleteElement(selectedElementId);
          return;
        }
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        if (selectedElementId) {
          setSelectedElementId(null);
        } else {
          handleClose();
        }
        return;
      }

      // Arrow nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isInput) {
        if (selectedElementId && activePage) {
          e.preventDefault();
          const step = e.shiftKey ? 8 : 1;
          const target = activePage.elements?.find((el) => el.id === selectedElementId);
          if (target) {
            let { x, y } = target.bounds;
            if (e.key === 'ArrowUp') y -= step;
            if (e.key === 'ArrowDown') y += step;
            if (e.key === 'ArrowLeft') x -= step;
            if (e.key === 'ArrowRight') x += step;
            handleUpdateElementBounds(selectedElementId, { ...target.bounds, x, y });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    selectedElementId,
    activePage,
    handleSavePage,
    handleUndo,
    handleRedo,
    handleDuplicateElement,
    handleDeleteElement,
  ]);

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('असुरक्षित बदलाव हैं। क्या आप वाकई डिज़ाइनर बंद करना चाहते हैं?')) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const selectedElement = activePage?.elements?.find((el) => el.id === selectedElementId) || null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-20 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold shadow-xl flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 border-emerald-600 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-red-900 border-red-600 text-red-100'
                : 'bg-blue-900 border-blue-600 text-blue-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-sm font-bold text-slate-300">
            ई-पेपर ब्रॉडशीट डिज़ाइनर लोड हो रहा है...
          </p>
        </div>
      ) : activePage ? (
        <>
          {/* Top Header Bar */}
          <EpaperDesignerHeader
            editionCode={edition?.editionCode || 'EP-BROADSHEET'}
            editionTitle={edition?.title || 'दैनिक ब्रॉडशीट'}
            totalPages={edition?.totalPages || pages.length || 12}
            activePage={activePage}
            viewportState={viewportState}
            isDirty={isDirty}
            isSaving={isSaving}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < historyStack.length - 1}
            onPageChange={handlePageChange}
            onGridColumnsChange={(cols) => {
              setActivePage({ ...activePage, gridColumns: cols });
              pushHistory();
            }}
            onViewportChange={setViewportState}
            onFitToScreen={handleFitToScreen}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSave={handleSavePage}
            onSaveDraft={handleSaveDraft}
            onSaveEntireEdition={handleSaveEntireEdition}
            onSaveAsTemplate={() => setShowSaveTplModal(true)}
            onAutoArrange={handleAutoArrange}
            onPreviewEdition={() => setViewportState((prev) => ({ ...prev, previewMode: !prev.previewMode }))}
            isAutoArranging={isAutoArranging}
            designerMode={viewportState.designerMode || 'ASSISTED'}
            onModeChange={handleModeChange}
            onClose={handleClose}
          />

          {/* Main 3-Panel Editor Workspace */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Panel 1: Left Toolbox (Approved Stories, Primitives, Templates) */}
            <EpaperToolboxPanel
              articles={articlesState}
              editionPages={pages}
              activePageNumber={activePageNum}
              onAddStory={handleAddStory}
              onAddPrimitive={handleAddPrimitive}
              onApplyTemplate={handleApplyTemplate}
              onUploadMedia={handleUploadMedia}
            />

            {/* Panel 2: Center Stage (Broadsheet Canvas 932.6 x 1474 pt) */}
            <EpaperCanvasPanel
              page={activePage}
              selectedElementId={selectedElementId}
              viewportState={viewportState}
              onSelectElement={setSelectedElementId}
              onUpdateElementBounds={handleUpdateElementBounds}
              onViewportChange={setViewportState}
              onPushHistory={pushHistory}
              onCollisionsDetected={(colliding) => setHasCollision(colliding)}
            />

            {/* Panel 3: Right Inspector (Properties, Geometry, Typography, Immutability) */}
            <EpaperPropertiesPanel
              selectedElement={selectedElement}
              page={activePage}
              hasCollision={hasCollision}
              articles={articlesState}
              totalPages={edition?.totalPages || pages.length || 12}
              onReassignPage={handleReassignElementToPage}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onReorderZIndex={handleReorderZIndex}
              onUpdatePageTitle={(title) => {
                setActivePage({ ...activePage, pageTitle: title });
                setIsDirty(true);
              }}
              onUpdatePageSection={(section) => {
                setActivePage({ ...activePage, sectionType: section as any });
                setIsDirty(true);
              }}
              onUpdatePageGridColumns={(cols) => {
                setActivePage({ ...activePage, gridColumns: cols });
                pushHistory();
              }}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          कोई पृष्ठ उपलब्ध नहीं है।
        </div>
      )}

      {/* OCC Concurrency Conflict Modal */}
      <OccConflictDialog
        isOpen={showOccConflict}
        currentVersion={activePage?.version || 1}
        remoteVersion={remoteVersion}
        onReloadRemote={handleOccReloadRemote}
        onForceOverwrite={handleOccForceOverwrite}
        onCancel={() => setShowOccConflict(false)}
      />

      {/* Save Page as Custom Template Modal */}
      {showSaveTplModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">वर्तमान पेज लेआउट को कस्टम टेम्पलेट बनाएं</h3>
              </div>
              <button
                onClick={() => setShowSaveTplModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  टेम्पलेट का नाम (अंग्रेजी / कोड):
                </label>
                <input
                  type="text"
                  value={customTplName}
                  onChange={(e) => setCustomTplName(e.target.value)}
                  placeholder="उदा. Election Special Lead"
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  टेम्पलेट का हिंदी नाम:
                </label>
                <input
                  type="text"
                  value={customTplNameHi}
                  onChange={(e) => setCustomTplNameHi(e.target.value)}
                  placeholder="उदा. चुनाव विशेष मुख्य लेआउट"
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs text-purple-200">
                वर्तमान पेज के सभी {activePage?.elements?.length || 0} तत्व एवं {activePage?.gridColumns || 8}-कॉलम ग्रिड सेटिंग को एक स्थायी कस्टम टेम्पलेट में बदल दिया जाएगा।
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setShowSaveTplModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleSavePageAsCustomTemplate}
                disabled={isSavingCustomTpl}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingCustomTpl ? 'सहेजा जा रहा है...' : 'टेम्पलेट सहेजें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
