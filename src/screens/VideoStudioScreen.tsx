/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Video Production Studio Screen
 * 
 * Provides an integrated, newsroom-grade video authoring dashboard:
 * 1. Video Studio Dashboard (Stats, Quick actions, Recent projects)
 * 2. Quick Video Mode (Fast mobile news video authoring with single-row aspect ratio pills)
 * 3. Studio Mode (Multi-scene timeline editor, WYSIWYG live canvas, scrubbing, transitions, audio)
 * 4. News to Video Engine (Factual extraction & 4-scene auto-assembly)
 * 5. Master Video Template Manager (11 categories, 5 aspect ratios)
 * 6. Video Render Queue & High-Definition MP4 Exporter (Real browser captureStream & server FFmpeg)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Video,
  Play,
  Pause,
  Film,
  Sparkles,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Clock,
  Layers,
  Sliders,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Filter,
  Undo2,
  Redo2,
  FileVideo,
  ChevronRight,
  MoveLeft,
  MoveRight,
  Tv,
} from 'lucide-react';
import {
  ArticleItem,
  VideoAspectRatio,
  VideoProject,
  VideoRenderJob,
  VideoScene,
  VideoTemplate,
  VideoTemplateCategory,
  VideoTransition,
} from '../types';
import { DEFAULT_VIDEO_TEMPLATES } from '../data/defaultVideoTemplates';
import { VideoTimelineEngine } from '../services/videoTimelineEngine';
import { VideoRenderer } from '../services/videoRenderer';
import { apiClient } from '../services/apiClient';

export interface VideoStudioScreenProps {
  currentUser?: { id: string; name: string; role?: string; roles?: string[] };
  articles?: ArticleItem[];
  districts?: Array<string | { nameHi?: string; nameEn?: string; slug?: string }>;
  categories?: Array<string | { nameHi?: string; nameEn?: string; slug?: string }>;
  initialArticle?: ArticleItem | null;
  onNavigateHome?: () => void;
  onNavigateDesk?: () => void;
}

type VideoStudioTab = 'dashboard' | 'quick' | 'studio' | 'news-to-video' | 'templates' | 'queue' | 'projects';

const ASPECT_RATIO_OPTIONS: Array<{ ratio: VideoAspectRatio; label: string; icon: string }> = [
  { ratio: '9:16', label: '9:16 स्टोरी / रील्स', icon: '📲' },
  { ratio: '16:9', label: '16:9 टीवी / यूट्यूब', icon: '🖥️' },
  { ratio: '1:1', label: '1:1 स्क्वायर फ़ीड', icon: '⏹️' },
  { ratio: '4:5', label: '4:5 सोशल फ़ीड', icon: '📱' },
  { ratio: '3:4', label: '3:4 पोर्ट्रेट', icon: '📄' },
];

const TEMPLATE_CATEGORIES: Array<{ key: VideoTemplateCategory; labelHi: string }> = [
  { key: 'BREAKING', labelHi: 'ब्रेकिंग न्यूज़' },
  { key: 'POLITICS', labelHi: 'राजनीति' },
  { key: 'CRIME', labelHi: 'अपराध' },
  { key: 'GOVERNMENT', labelHi: 'सरकारी योजनाएं' },
  { key: 'DISTRICT', labelHi: 'जिला हलचल' },
  { key: 'SPORTS', labelHi: 'खेल जगत' },
  { key: 'BUSINESS', labelHi: 'व्यापार व मंडी' },
  { key: 'EDUCATION', labelHi: 'शिक्षा व करियर' },
  { key: 'WEATHER', labelHi: 'मौसम समाचार' },
  { key: 'SPECIAL', labelHi: 'विशेष रिपोर्ट' },
  { key: 'FESTIVAL', labelHi: 'त्यौहार व बधाई' },
];

export const VideoStudioScreen: React.FC<VideoStudioScreenProps> = ({
  currentUser = { id: 'usr-desk-chief', name: 'मुख्य संपादक (Desk Editor)', role: 'EDITOR' },
  articles = [],
  initialArticle = null,
  onNavigateHome,
  onNavigateDesk,
}) => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<VideoStudioTab>(initialArticle ? 'news-to-video' : 'dashboard');

  // Master Data State
  const [templates, setTemplates] = useState<VideoTemplate[]>(DEFAULT_VIDEO_TEMPLATES);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [renderJobs, setRenderJobs] = useState<VideoRenderJob[]>([]);
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('ALL');
  const [selectedAspectRatioFilter, setSelectedAspectRatioFilter] = useState<string>('ALL');
  const [searchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Active Project for Studio & Quick Mode
  const [currentProject, setCurrentProject] = useState<VideoProject>(() => {
    return VideoTimelineEngine.createDefaultProject({
      title: 'नया ब्रेकिंग न्यूज़ वीडियो',
      aspectRatio: '9:16',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByRole: currentUser.role,
    });
  });

  // History stack for Undo / Redo in Studio Mode
  const [history, setHistory] = useState<VideoProject[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Studio Player & Playhead State
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const quickCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Rendering State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStatusText, setRenderStatusText] = useState<string>('');

  // Quick Mode Form State
  const [quickHeadline, setQuickHeadline] = useState<string>('भोपाल: मंत्रालय में आपात बैठक, अहम निर्णय संभव');
  const [quickSubtext, setQuickSubtext] = useState<string>('मुख्यमंत्री ने वरिष्ठ अधिकारियों के साथ की समीक्षा बैठक।');
  const [quickDistrict, setQuickDistrict] = useState<string>('भोपाल');
  const [quickImageUrl, setQuickImageUrl] = useState<string>('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80');
  const [quickAspectRatio, setQuickAspectRatio] = useState<VideoAspectRatio>('9:16');
  const [quickShowTicker, setQuickShowTicker] = useState<boolean>(true);
  const [quickShowLogo, setQuickShowLogo] = useState<boolean>(true);

  // Helper notification dispatcher
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Fetch initial templates, projects, and render queue
  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [tplRes, projRes, jobsRes] = await Promise.allSettled([
          apiClient.videos.fetchTemplates(),
          apiClient.videos.fetchProjects({ limit: 50 }),
          apiClient.videos.fetchRenderQueue(),
        ]);

        if (mounted) {
          if (tplRes.status === 'fulfilled' && tplRes.value.length > 0) {
            setTemplates(tplRes.value);
          }
          if (projRes.status === 'fulfilled' && projRes.value?.items) {
            setProjects(projRes.value.items);
          }
          if (jobsRes.status === 'fulfilled') {
            setRenderJobs(jobsRes.value);
          }
        }
      } catch (err) {
        console.warn('Initial video data fetch failed, using fallback memory state:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  // Push project state to Undo/Redo history
  const updateProjectWithHistory = useCallback((newProject: VideoProject) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newProject];
    });
    setHistoryIndex((prev) => prev + 1);
    setCurrentProject(newProject);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setCurrentProject(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setCurrentProject(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Total Duration of current project
  const totalDuration = useMemo(() => {
    return VideoTimelineEngine.getTotalDuration(currentProject);
  }, [currentProject]);

  // Synchronize playhead & active scene index
  useEffect(() => {
    if (currentProject.scenes.length === 0) return;
    const targetIndex = VideoTimelineEngine.getSceneIndexAtTime(currentProject.scenes, currentTimeSeconds);
    if (targetIndex !== activeSceneIndex && targetIndex >= 0) {
      setActiveSceneIndex(targetIndex);
    }
  }, [currentTimeSeconds, currentProject.scenes, activeSceneIndex]);

  // Studio Live Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentScene = currentProject.scenes[activeSceneIndex] || currentProject.scenes[0];
    if (!currentScene) return;

    VideoRenderer.drawSceneToCanvas(canvas, currentScene, currentProject, currentTimeSeconds);
  }, [currentProject, activeSceneIndex, currentTimeSeconds, activeTab]);

  // Quick Mode Live Canvas Drawing
  useEffect(() => {
    const canvas = quickCanvasRef.current;
    if (!canvas || activeTab !== 'quick') return;

    const quickScene: VideoScene = {
      id: 'scn-quick-preview',
      order: 0,
      title: 'त्वरित पूर्वावलोकन',
      durationSec: 5,
      transition: 'cut',
      backgroundStyle: 'gradient-red',
      headline: quickHeadline,
      subtext: quickSubtext,
      lowerThird: `${quickHeadline} • निष्पक्ष पत्रकारिता • ब्रेकिंग न्यूज़ वाला`,
      district: quickDistrict,
      category: 'BREAKING',
      imageUrl: quickImageUrl || undefined,
      showLogo: quickShowLogo,
      showTicker: quickShowTicker,
      kenBurnsEffect: true,
    };

    const tempProject = VideoTimelineEngine.createDefaultProject({
      title: quickHeadline,
      aspectRatio: quickAspectRatio,
      scenes: [quickScene],
    });

    VideoRenderer.drawSceneToCanvas(canvas, quickScene, tempProject, 0);
  }, [quickHeadline, quickSubtext, quickDistrict, quickImageUrl, quickAspectRatio, quickShowTicker, quickShowLogo, activeTab]);

  // Playhead loop for playback preview
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();
    const tick = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setCurrentTimeSeconds((prev) => {
        const next = prev + deltaSec;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  // Toggle Play / Pause
  const togglePlayPause = () => {
    if (currentTimeSeconds >= totalDuration) {
      setCurrentTimeSeconds(0);
    }
    setIsPlaying((prev) => !prev);
  };

  // Add a new scene to current project
  const handleAddScene = () => {
    const newScene: VideoScene = {
      id: `scn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order: currentProject.scenes.length,
      title: `दृश्य ${currentProject.scenes.length + 1}`,
      durationSec: 4,
      transition: 'fade',
      backgroundStyle: 'navy-blue',
      headline: 'ताज़ा ख़बर का विवरण',
      subtext: 'घटनास्थल से ग्राउंड रिपोर्ट एवं विस्तृत ब्यौरा।',
      lowerThird: 'सत्य निष्पक्ष एवं सटीक रिपोर्टिंग • ब्रेकिंग न्यूज़ वाला',
      district: currentProject.districtName || 'मध्य प्रदेश',
      category: 'BREAKING',
      showLogo: true,
      showTicker: true,
      kenBurnsEffect: false,
    };

    const updated = {
      ...currentProject,
      scenes: [...currentProject.scenes, newScene],
      totalDurationSec: VideoTimelineEngine.calculateTotalDuration([...currentProject.scenes, newScene]),
      updatedAt: new Date().toISOString(),
    };
    updateProjectWithHistory(updated);
    showToast('नया दृश्य टाइमलाइन में जोड़ा गया।', 'success');
  };

  // Duplicate an existing scene
  const handleDuplicateScene = (index: number) => {
    const targetScene = currentProject.scenes[index];
    if (!targetScene) return;
    const updatedScenes = VideoTimelineEngine.duplicateScene(currentProject.scenes, targetScene.id);
    const updated = {
      ...currentProject,
      scenes: updatedScenes,
      totalDurationSec: VideoTimelineEngine.calculateTotalDuration(updatedScenes),
      updatedAt: new Date().toISOString(),
    };
    updateProjectWithHistory(updated);
    showToast('दृश्य की प्रतिलिपि बनाई गई।', 'success');
  };

  // Remove a scene
  const handleRemoveScene = (index: number) => {
    if (currentProject.scenes.length <= 1) {
      showToast('कम से कम एक दृश्य अनिवार्य है।', 'error');
      return;
    }
    const targetScene = currentProject.scenes[index];
    if (!targetScene) return;
    const updatedScenes = VideoTimelineEngine.removeScene(currentProject.scenes, targetScene.id);
    const updated = {
      ...currentProject,
      scenes: updatedScenes,
      totalDurationSec: VideoTimelineEngine.calculateTotalDuration(updatedScenes),
      updatedAt: new Date().toISOString(),
    };
    updateProjectWithHistory(updated);
    if (activeSceneIndex >= updated.scenes.length) {
      setActiveSceneIndex(updated.scenes.length - 1);
    }
    showToast('दृश्य हटा दिया गया।', 'info');
  };

  // Move scene left/right
  const handleMoveScene = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= currentProject.scenes.length) return;
    const updatedScenes = VideoTimelineEngine.moveScene(currentProject.scenes, fromIndex, toIndex);
    const updated = {
      ...currentProject,
      scenes: updatedScenes,
      updatedAt: new Date().toISOString(),
    };
    updateProjectWithHistory(updated);
    setActiveSceneIndex(toIndex);
  };

  // Update properties of active scene
  const handleUpdateActiveScene = (patch: Partial<VideoScene>) => {
    const scenes = [...currentProject.scenes];
    if (!scenes[activeSceneIndex]) return;
    scenes[activeSceneIndex] = {
      ...scenes[activeSceneIndex],
      ...patch,
    };
    const updated = {
      ...currentProject,
      scenes,
      totalDurationSec: VideoTimelineEngine.calculateTotalDuration(scenes),
      updatedAt: new Date().toISOString(),
    };
    updateProjectWithHistory(updated);
  };

  // Save current project to backend
  const handleSaveProject = async () => {
    try {
      setIsLoading(true);
      const saved = await apiClient.videos.createProject({
        ...currentProject,
        status: 'DRAFT',
      });
      setCurrentProject(saved);
      setProjects((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      showToast(`प्रोजेक्ट "${saved.title}" सुरक्षित किया गया।`, 'success');
    } catch (err: any) {
      showToast(err.message || 'प्रोजेक्ट सुरक्षित करने में त्रुटि हुई।', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load a template into the editor
  const handleUseTemplate = (template: VideoTemplate) => {
    const instantiated = VideoTimelineEngine.instantiateFromTemplate(template, {
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByRole: currentUser.role,
    });
    updateProjectWithHistory(instantiated);
    setActiveSceneIndex(0);
    setCurrentTimeSeconds(0);
    setActiveTab('studio');
    showToast(`टेम्पलेट "${template.title}" एडिटर में लोड किया गया।`, 'success');
  };

  // Duplicate a template
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      setIsLoading(true);
      const duplicated = await apiClient.videos.duplicateTemplate(templateId);
      setTemplates((prev) => [...prev, duplicated]);
      showToast(`टेम्पलेट की प्रतिलिपि बनाई गई: "${duplicated.title}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'प्रतिलिपि बनाने में त्रुटि हुई।', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Browser Recording & Download (WebM / MP4)
  const handleBrowserRenderAndDownload = async () => {
    if (isRendering) return;
    try {
      setIsRendering(true);
      setRenderProgress(0);
      setRenderStatusText('प्रोजेक्ट दृश्यों की तैयारी...');

      const renderCanvas = document.createElement('canvas');
      const blob = await VideoRenderer.renderProjectToVideoBlob(
        renderCanvas,
        currentProject,
        (progress) => {
          setRenderProgress(progress);
          setRenderStatusText(`रेंडरिंग प्रगति: ${progress}%`);
        }
      );

      const filename = `${currentProject.title.replace(/[^a-zA-Z0-9\u0900-\u097F]+/g, '_').slice(0, 40)}_${Date.now()}.mp4`;
      VideoRenderer.downloadVideo(blob, filename);
      showToast('वीडियो सफलतापूर्वक डाउनलोड हो गया!', 'success');
    } catch (err: any) {
      showToast(err.message || 'ब्राउज़र रेंडरिंग विफल रही।', 'error');
    } finally {
      setIsRendering(false);
      setRenderProgress(0);
    }
  };

  // Quick Mode Render & Download
  const handleQuickRenderAndDownload = async () => {
    const quickScene: VideoScene = {
      id: `scn-quick-${Date.now()}`,
      order: 0,
      title: 'त्वरित समाचार',
      durationSec: 5,
      transition: 'cut',
      backgroundStyle: 'gradient-red',
      headline: quickHeadline,
      subtext: quickSubtext,
      lowerThird: `${quickHeadline} • निष्पक्ष पत्रकारिता • ब्रेकिंग न्यूज़ वाला`,
      district: quickDistrict,
      category: 'BREAKING',
      imageUrl: quickImageUrl || undefined,
      showLogo: quickShowLogo,
      showTicker: quickShowTicker,
      kenBurnsEffect: true,
    };

    const tempProject = VideoTimelineEngine.createDefaultProject({
      title: quickHeadline,
      aspectRatio: quickAspectRatio,
      scenes: [quickScene],
    });

    try {
      setIsRendering(true);
      setRenderProgress(0);
      setRenderStatusText('त्वरित वीडियो तैयार किया जा रहा है...');

      const renderCanvas = document.createElement('canvas');
      const blob = await VideoRenderer.renderProjectToVideoBlob(
        renderCanvas,
        tempProject,
        (progress) => {
          setRenderProgress(progress);
          setRenderStatusText(`रेंडरिंग प्रगति: ${progress}%`);
        }
      );

      const filename = `QuickNews_${Date.now()}.mp4`;
      VideoRenderer.downloadVideo(blob, filename);
      showToast('त्वरित वीडियो डाउनलोड हो गया!', 'success');
    } catch (err: any) {
      showToast(err.message || 'त्वरित वीडियो निर्माण विफल रहा।', 'error');
    } finally {
      setIsRendering(false);
      setRenderProgress(0);
    }
  };

  // Submit to Server FFmpeg Render Queue
  const handleServerRenderSubmit = async () => {
    try {
      setIsRendering(true);
      setRenderProgress(10);
      setRenderStatusText('सर्वर FFmpeg रेंडरर को सबमिट किया जा रहा है...');

      const job = await apiClient.videos.submitRender({
        project: currentProject,
        resolution: currentProject.resolution || '720p',
        fps: 30,
        format: 'mp4',
      });

      setRenderJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
      showToast('रेंडर जॉब सर्वर कतार में सबमिट कर दिया गया है।', 'success');
      setActiveTab('queue');
    } catch (err: any) {
      showToast(err.message || 'सर्वर रेंडर सबमिट करने में विफल।', 'error');
    } finally {
      setIsRendering(false);
      setRenderProgress(0);
    }
  };

  // News to Video Engine trigger
  const handleNewsToVideoConvert = async (article: ArticleItem) => {
    try {
      setIsLoading(true);
      const generated = await apiClient.videos.newsToVideo({
        article,
        aspectRatio: '9:16',
      });

      const convertedScenes: VideoScene[] = (generated.scenes || []).map((s: any, idx: number) => ({
        id: s.id || `scn-${Date.now()}-${idx + 1}`,
        title: s.title || `दृश्य ${idx + 1}`,
        order: idx,
        durationSec: s.durationSeconds || s.durationSec || 4,
        backgroundStyle: idx === 0 ? 'gradient-red' : idx === 1 ? 'dark-charcoal' : 'navy-blue',
        headline: s.headline || article.title,
        subtext: s.subtext || article.summary || '',
        lowerThird: typeof s.lowerThird === 'string' ? s.lowerThird : (s.lowerThird?.tickerText || s.headline || article.title),
        district: generated.district || article.districtName || 'मध्य प्रदेश',
        category: (generated.category as any) || 'BREAKING',
        imageUrl: s.mediaUrl || article.imageUrl || article.featuredImage || undefined,
        showLogo: true,
        showTicker: true,
        transition: s.transition || 'fade',
        kenBurnsEffect: Boolean(s.kenBurnsEffect),
      }));

      const newProj = VideoTimelineEngine.createDefaultProject({
        title: generated.headline || article.title,
        aspectRatio: generated.aspectRatio || '9:16',
        districtName: generated.district || article.districtName,
        scenes: convertedScenes,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
      });

      updateProjectWithHistory(newProj);
      setActiveSceneIndex(0);
      setCurrentTimeSeconds(0);
      setActiveTab('studio');
      showToast(`समाचार "${article.title.slice(0, 30)}..." से 4 दृश्य निर्मित किए गए!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'समाचार से वीडियो रूपांतरण विफल रहा।', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchCat = selectedTemplateFilter === 'ALL' || tpl.category === selectedTemplateFilter;
      const matchRatio = selectedAspectRatioFilter === 'ALL' || tpl.aspectRatio === selectedAspectRatioFilter;
      const matchSearch =
        !searchQuery ||
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchRatio && matchSearch;
    });
  }, [templates, selectedTemplateFilter, selectedAspectRatioFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-16">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all duration-300 animate-in slide-in-from-top ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header & Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateDesk || onNavigateHome}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="वापस जाएं"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ED1727] via-rose-600 to-[#FDE900] p-0.5 flex items-center justify-center shadow-lg shadow-rose-900/30">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Film className="w-5 h-5 text-[#ED1727]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-wide font-serif">
                    वीडियो प्रोडक्शन स्टूडियो Pro
                  </h1>
                  <span className="text-[10px] bg-red-600/30 border border-red-500/40 text-red-400 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    v2.2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  मल्टी-सीन टाइमलाइन • FFmpeg MP4 रेंडरिंग • 11 श्रेणियां
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tab Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>डैशबोर्ड</span>
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'quick'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>त्वरित वीडियो (Quick)</span>
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'studio'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>स्टूडियो एडिटर</span>
            </button>
            <button
              onClick={() => setActiveTab('news-to-video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'news-to-video'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>समाचार से वीडियो</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>टेम्पलेट्स</span>
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>रेंडर कतार {renderJobs.filter((j) => j.status === 'RENDERING').length > 0 && `(${renderJobs.filter((j) => j.status === 'RENDERING').length})`}</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'projects'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileVideo className="w-3.5 h-3.5" />
              <span>मेरी परियोजनाएं</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: STUDIO DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900/60 via-slate-900 to-slate-950 p-6 sm:p-8 border border-red-800/40 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>अति-उच्च गति न्यूज़ वीडियो इंजन</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wide">
                  मध्य प्रदेश का आधुनिक डिजिटल वीडियो स्टूडियो
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  ज़मीनी संवाददाताओं और न्यूज़रूम संपादकों के लिए 1-क्लिक वीडियो निर्माण। बिना किसी भारी सॉफ्टवेयर के सीधे ब्राउज़र और FFmpeg से वास्तविक HD MP4 वीडियो एक्सपोर्ट करें।
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('quick')}
                    className="px-4 py-2.5 rounded-xl bg-[#ED1727] hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-900/40 transition-transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>त्वरित वीडियो बनाएं (Quick Video)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('studio')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 border border-slate-700 transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>मल्टी-सीन स्टूडियो खोलें</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">उपलब्ध टेम्पलेट्स</span>
                  <Film className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-white">{templates.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">11 श्रेणियां • 5 आकार</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">मेरी परियोजनाएं</span>
                  <FileVideo className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{projects.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">सुरक्षित ड्राफ्ट्स</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">सक्रिय रेंडर कतार</span>
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {renderJobs.filter((j) => j.status === 'RENDERING' || j.status === 'PENDING').length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">प्रक्रियाधीन जॉब्स</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">पूर्ण रेंडर्स</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {renderJobs.filter((j) => j.status === 'COMPLETED').length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">डाउनलोड हेतु तैयार</div>
              </div>
            </div>

            {/* Quick Action Category Tiles */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>त्वरित निर्माण श्रेणियां</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {TEMPLATE_CATEGORIES.slice(0, 8).map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      const matched = templates.find((t) => t.category === cat.key);
                      if (matched) handleUseTemplate(matched);
                      else setActiveTab('templates');
                    }}
                    className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-red-500/40 text-left transition-all group"
                  >
                    <div className="text-xs font-extrabold text-red-400 group-hover:text-red-300">
                      {cat.labelHi}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>टेम्पलेट लोड करें</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUICK VIDEO MODE */}
        {activeTab === 'quick' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      त्वरित न्यूज़ वीडियो (Quick Video)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">फ़ास्ट पब्लिशिंग</span>
                </div>

                {/* Aspect Ratio Selector - Single row horizontal pills */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    पहलू अनुपात (Aspect Ratio)
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {ASPECT_RATIO_OPTIONS.map((opt) => (
                      <button
                        key={opt.ratio}
                        type="button"
                        onClick={() => setQuickAspectRatio(opt.ratio)}
                        className={`flex-1 min-w-[72px] py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all whitespace-nowrap flex flex-col items-center justify-center gap-0.5 ${
                          quickAspectRatio === opt.ratio
                            ? 'bg-[#ED1727] text-white shadow-md shadow-red-900/40 ring-1 ring-red-400'
                            : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-sm">{opt.icon}</span>
                        <span className="text-[10px]">{opt.ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* News Headline Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    मुख्य शीर्षक (Headline - Devnagari)
                  </label>
                  <input
                    type="text"
                    value={quickHeadline}
                    onChange={(e) => setQuickHeadline(e.target.value)}
                    placeholder="उदा. भोपाल: मंत्रालय में आपात बैठक, अहम निर्णय संभव"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                {/* News Subtext / Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    उप-विवरण (Subtext / Bullet Point)
                  </label>
                  <textarea
                    rows={2}
                    value={quickSubtext}
                    onChange={(e) => setQuickSubtext(e.target.value)}
                    placeholder="उदा. किसानों के हित में बड़े फैसलों पर लग सकती है मुहर।"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                {/* District & Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    जिला / क्षेत्र (District)
                  </label>
                  <input
                    type="text"
                    value={quickDistrict}
                    onChange={(e) => setQuickDistrict(e.target.value)}
                    placeholder="उदा. इंदौर / ग्वालियर / भोपाल"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                {/* Image URL / Media */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    मीडिया / फ़ोटो URL (Image Media)
                  </label>
                  <input
                    type="text"
                    value={quickImageUrl}
                    onChange={(e) => setQuickImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                {/* Branding Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quickShowLogo}
                      onChange={(e) => setQuickShowLogo(e.target.checked)}
                      className="rounded text-red-600 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                    <span>चैनल लोगो व रिबन</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quickShowTicker}
                      onChange={(e) => setQuickShowTicker(e.target.checked)}
                      className="rounded text-red-600 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                    <span>ब्रेकिंग न्यूज़ टिकर</span>
                  </label>
                </div>

                {/* Progress bar if rendering */}
                {isRendering && (
                  <div className="space-y-1.5 p-3 rounded-lg bg-red-950/40 border border-red-800/50">
                    <div className="flex justify-between text-xs font-bold text-red-300">
                      <span>{renderStatusText || 'वीडियो तैयार हो रहा है...'}</span>
                      <span>{renderProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-200"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isRendering}
                    onClick={handleQuickRenderAndDownload}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ED1727] to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 disabled:opacity-50 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>तुरंत वीडियो डाउनलोड करें (MP4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const quickScene: VideoScene = {
                        id: `scn-quick-${Date.now()}`,
                        order: 0,
                        title: 'त्वरित समाचार',
                        durationSec: 5,
                        transition: 'cut',
                        backgroundStyle: 'gradient-red',
                        headline: quickHeadline,
                        subtext: quickSubtext,
                        lowerThird: `${quickHeadline} • निष्पक्ष पत्रकारिता • ब्रेकिंग न्यूज़ वाला`,
                        district: quickDistrict,
                        category: 'BREAKING',
                        imageUrl: quickImageUrl || undefined,
                        showLogo: quickShowLogo,
                        showTicker: quickShowTicker,
                        kenBurnsEffect: true,
                      };
                      const proj = VideoTimelineEngine.createDefaultProject({
                        title: quickHeadline,
                        aspectRatio: quickAspectRatio,
                        scenes: [quickScene],
                      });
                      updateProjectWithHistory(proj);
                      setActiveTab('studio');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>स्टूडियो में संपादित करें</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live WYSIWYG Canvas Preview */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-slate-950 p-4 border border-slate-800 shadow-2xl flex flex-col items-center space-y-3">
                <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    लाइव टीवी पूर्वावलोकन ({quickAspectRatio})
                  </span>
                  <span>1080p HD</span>
                </div>

                <div className="w-full aspect-[9/16] max-h-[500px] flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-inner border border-slate-800">
                  <canvas
                    ref={quickCanvasRef}
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  वास्तविक समय का रेंडर पूर्वावलोकन। डाउनलोड पर यह बिल्कुल इसी रूप में MP4 में एक्सपोर्ट होगा।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDIO MODE */}
        {activeTab === 'studio' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={currentProject.title}
                  onChange={(e) => {
                    updateProjectWithHistory({
                      ...currentProject,
                      title: e.target.value,
                    });
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-hidden focus:border-red-500 min-w-[240px]"
                />
                <span className="text-xs px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-700">
                  {currentProject.aspectRatio}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                  title="पूर्ववत करें (Undo)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                  title="पुनः करें (Redo)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <div className="h-5 w-px bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={handleSaveProject}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors"
                >
                  सुरक्षित करें (Save)
                </button>

                <button
                  type="button"
                  disabled={isRendering}
                  onClick={handleBrowserRenderAndDownload}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-900/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>MP4 डाउनलोड</span>
                </button>

                <button
                  type="button"
                  disabled={isRendering}
                  onClick={handleServerRenderSubmit}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>सर्वर FFmpeg रेंडर</span>
                </button>
              </div>
            </div>

            {/* Middle Section: Player Canvas & Scene Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Studio Canvas Preview & Controls */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="w-full rounded-2xl bg-slate-950 p-4 border border-slate-800 shadow-2xl flex flex-col items-center space-y-3">
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="font-bold">
                      दृश्य {activeSceneIndex + 1} / {currentProject.scenes.length}: {currentProject.scenes[activeSceneIndex]?.title}
                    </span>
                    <span className="font-mono text-amber-400">
                      {VideoTimelineEngine.formatTimecode(currentTimeSeconds)} / {VideoTimelineEngine.formatTimecode(totalDuration)}
                    </span>
                  </div>

                  {/* Canvas Viewport */}
                  <div
                    className="w-full flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-inner border border-slate-800"
                    style={{
                      maxHeight: '440px',
                      aspectRatio:
                        currentProject.aspectRatio === '16:9'
                          ? '16/9'
                          : currentProject.aspectRatio === '1:1'
                          ? '1/1'
                          : currentProject.aspectRatio === '4:5'
                          ? '4/5'
                          : currentProject.aspectRatio === '3:4'
                          ? '3/4'
                          : '9/16',
                    }}
                  >
                    <canvas ref={canvasRef} className="w-full h-full object-contain" />
                  </div>

                  {/* Playback Controls & Scrubber */}
                  <div className="w-full space-y-2 pt-1">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, totalDuration)}
                      step={0.1}
                      value={currentTimeSeconds}
                      onChange={(e) => {
                        setIsPlaying(false);
                        setCurrentTimeSeconds(parseFloat(e.target.value));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={togglePlayPause}
                          className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-md"
                          title={isPlaying ? 'रोकें (Pause)' : 'चलाएं (Play)'}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <span className="font-mono text-slate-300">
                          {VideoTimelineEngine.formatTimecode(currentTimeSeconds)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          कुल अवधि: {totalDuration}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scene Properties Inspector */}
              <div className="lg:col-span-5 space-y-4">
                {currentProject.scenes[activeSceneIndex] && (
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <span>दृश्य गुणधर्म (Scene Properties)</span>
                      </h4>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateScene(activeSceneIndex)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="प्रतिलिपि बनाएं"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveScene(activeSceneIndex)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900 text-rose-300 transition-colors"
                          title="दृश्य हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scene Title */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">दृश्य शीर्षक</label>
                      <input
                        type="text"
                        value={currentProject.scenes[activeSceneIndex].title}
                        onChange={(e) => handleUpdateActiveScene({ title: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    {/* Duration & Transition */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          अवधि (Duration Sec)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={currentProject.scenes[activeSceneIndex].durationSec}
                          onChange={(e) => handleUpdateActiveScene({ durationSec: parseInt(e.target.value, 10) || 3 })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          संक्रमण (Transition)
                        </label>
                        <select
                          value={currentProject.scenes[activeSceneIndex].transition || 'fade'}
                          onChange={(e) => handleUpdateActiveScene({ transition: e.target.value as VideoTransition })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                        >
                          <option value="cut">कट (Cut)</option>
                          <option value="fade">फ़ेड (Fade)</option>
                          <option value="slide-left">स्लाइड बाएँ (Slide Left)</option>
                          <option value="zoom-in">ज़ूम इन (Zoom In)</option>
                        </select>
                      </div>
                    </div>

                    {/* Background Style */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">पृष्ठभूमि शैली (Background)</label>
                      <select
                        value={currentProject.scenes[activeSceneIndex].backgroundStyle}
                        onChange={(e) => handleUpdateActiveScene({ backgroundStyle: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                      >
                        <option value="gradient-red">लाल ग्रैडिएंट (Breaking Red)</option>
                        <option value="navy-blue">नेवी ब्लू (Navy Blue)</option>
                        <option value="dark-charcoal">डार्क चारकोल (Dark Charcoal)</option>
                        <option value="breaking-yellow">येलो अलर्ट (Breaking Yellow)</option>
                      </select>
                    </div>

                    {/* Headline & Subtext */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">दृश्य मुख्य हेडिंग</label>
                      <input
                        type="text"
                        value={currentProject.scenes[activeSceneIndex].headline}
                        onChange={(e) => handleUpdateActiveScene({ headline: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">उप-विवरण (Subtext)</label>
                      <textarea
                        rows={2}
                        value={currentProject.scenes[activeSceneIndex].subtext || ''}
                        onChange={(e) => handleUpdateActiveScene({ subtext: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    {/* Media Layer & Ken Burns */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">फ़ोटो / वीडियो मीडिया URL</label>
                      <input
                        type="text"
                        value={currentProject.scenes[activeSceneIndex].imageUrl || ''}
                        onChange={(e) =>
                          handleUpdateActiveScene({
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="kenburns-check"
                        checked={Boolean(currentProject.scenes[activeSceneIndex].kenBurnsEffect)}
                        onChange={(e) => handleUpdateActiveScene({ kenBurnsEffect: e.target.checked })}
                        className="rounded text-red-600 focus:ring-0 bg-slate-900 border-slate-700"
                      />
                      <label htmlFor="kenburns-check" className="text-xs text-slate-300 cursor-pointer">
                        केन बर्न्स स्मूथ पैन/ज़ूम प्रभाव सक्रिय करें
                      </label>
                    </div>

                    {/* Lower Third Ticker */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">एंकर लोअर-थर्ड टिकर टेक्स्ट</label>
                      <input
                        type="text"
                        value={currentProject.scenes[activeSceneIndex].lowerThird || ''}
                        onChange={(e) => handleUpdateActiveScene({ lowerThird: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Timeline Scene Sequence Bar */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-400" />
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    मल्टी-सीन टाइमलाइन ट्रैक ({currentProject.scenes.length} दृश्य • कुल {totalDuration}s)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddScene}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>नया दृश्य जोड़ें</span>
                </button>
              </div>

              {/* Sequential Scene Blocks */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
                {currentProject.scenes.map((scene, idx) => (
                  <div
                    key={scene.id || idx}
                    onClick={() => {
                      setActiveSceneIndex(idx);
                      const startTime = currentProject.scenes
                        .slice(0, idx)
                        .reduce((acc, s) => acc + (s.durationSec || 3), 0);
                      setCurrentTimeSeconds(startTime);
                    }}
                    className={`shrink-0 w-44 p-2.5 rounded-xl border text-left cursor-pointer transition-all relative group ${
                      activeSceneIndex === idx
                        ? 'bg-slate-900 border-red-500 ring-2 ring-red-500/30 shadow-lg'
                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span className="text-white">दृश्य {idx + 1}</span>
                      <span className="font-mono text-amber-400">{scene.durationSec}s</span>
                    </div>

                    <div className="text-xs font-bold text-slate-200 line-clamp-1">
                      {scene.headline || scene.title}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {scene.transition || 'cut'}
                      </span>

                      {/* Reorder buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveScene(idx, 'left');
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                        >
                          <MoveLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === currentProject.scenes.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveScene(idx, 'right');
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                        >
                          <MoveRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NEWS TO VIDEO ENGINE */}
        {activeTab === 'news-to-video' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-amber-400" />
                  <span>समाचार से वीडियो निर्माण (News to Video Engine)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  प्रकाशित अथवा स्वीकृत समाचार लेख चुनें — इंजन तथ्यों को बदले बिना 4 दृश्य स्वतः तैयार करेगा।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-red-500/50 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-red-400">
                        {art.districtName || 'मध्य प्रदेश'}
                      </span>
                      {art.priority === 'BREAKING' && (
                        <span className="px-1.5 py-0.5 rounded bg-red-600/30 border border-red-500/40 text-red-400 font-extrabold text-[10px]">
                          ब्रेकिंग
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-2">{art.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {art.summary || art.content?.slice(0, 100)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {art.categoryName || 'ताज़ा ख़बर'}
                    </span>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleNewsToVideoConvert(art)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-900/40"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>वीडियो बनाएं</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: TEMPLATE LIBRARY */}
        {activeTab === 'templates' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedTemplateFilter === 'ALL'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  सभी श्रेणियां ({templates.length})
                </button>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedTemplateFilter(cat.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      selectedTemplateFilter === cat.key
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat.labelHi}
                  </button>
                ))}
              </div>

              {/* Aspect Ratio Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedAspectRatioFilter}
                  onChange={(e) => setSelectedAspectRatioFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-red-500"
                >
                  <option value="ALL">सभी अनुपात</option>
                  <option value="9:16">9:16 (रील्स)</option>
                  <option value="16:9">16:9 (टीवी/यूट्यूब)</option>
                  <option value="1:1">1:1 (स्क्वायर)</option>
                  <option value="4:5">4:5 (सोशल फ़ीड)</option>
                  <option value="3:4">3:4 (पोर्ट्रेट)</option>
                </select>
              </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-xl bg-slate-800/60 border border-slate-700 hover:border-red-500/50 p-4 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-red-400">{tpl.category}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-[10px]">
                        {tpl.aspectRatio}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{tpl.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2">{tpl.description}</p>
                    <div className="text-[11px] text-slate-400">
                      कुल दृश्य: {tpl.scenes.length} • {tpl.scenes.reduce((a, s) => a + s.durationSec, 0)}s
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicateTemplate(tpl.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="प्रतिलिपि बनाएं"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseTemplate(tpl)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center transition-colors"
                    >
                      उपयोग करें
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: RENDER QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>वीडियो रेंडर कतार (Render Queue & Status)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  बैकग्राउंड FFmpeg एन्कोडिंग व डाउनलोड स्थिति।
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const jobs = await apiClient.videos.fetchRenderQueue();
                  setRenderJobs(jobs);
                  showToast('कतार ताज़ा की गई।', 'info');
                }}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 transition-colors"
                title="ताज़ा करें"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {renderJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  कोई रेंडर जॉब उपलब्ध नहीं है।
                </div>
              ) : (
                renderJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300">#{job.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                              : job.status === 'RENDERING'
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-700 animate-pulse'
                              : job.status === 'FAILED'
                              ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        रिज़ॉल्यूशन: {job.resolution || '720p'} • प्रारूप: {job.format || 'mp4'} • प्रगति: {job.progressPercent}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(job.outputUrl || job.outputVideoUrl) && job.status === 'COMPLETED' && (
                        <a
                          href={job.outputUrl || job.outputVideoUrl}
                          download
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>MP4 डाउनलोड</span>
                        </a>
                      )}

                      {job.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await apiClient.videos.retryRenderJob(job.id);
                            const updated = await apiClient.videos.fetchRenderQueue();
                            setRenderJobs(updated);
                            showToast('रेंडर पुनः प्रारंभ किया गया।', 'info');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold"
                        >
                          पुनः प्रयास
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: MY PROJECTS LIBRARY */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-amber-400" />
                  <span>मेरी वीडियो परियोजनाएं (Saved Projects)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  आपके द्वारा सुरक्षित किए गए वीडियो ड्राफ्ट्स एवं तैयार प्रोजेक्ट्स।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 text-sm">
                  कोई सुरक्षित वीडियो प्रोजेक्ट नहीं मिला।
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-slate-500 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-bold text-red-400">{proj.aspectRatio}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-[10px]">
                          {proj.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{proj.title}</h4>
                      <p className="text-xs text-slate-300">
                        दृश्य संख्या: {proj.scenes?.length || 0}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('क्या आप वाकई इस प्रोजेक्ट को हटाना चाहते हैं?')) {
                            await apiClient.videos.deleteProject(proj.id);
                            setProjects((prev) => prev.filter((p) => p.id !== proj.id));
                            showToast('प्रोजेक्ट हटा दिया गया।', 'info');
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900 text-rose-300 transition-colors"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateProjectWithHistory(proj);
                          setActiveSceneIndex(0);
                          setCurrentTimeSeconds(0);
                          setActiveTab('studio');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                      >
                        संपादित करें
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
