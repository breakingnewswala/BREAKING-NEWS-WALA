import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Radio,
  AlertTriangle,
  Check,
  Edit3,
  Lock,
  Unlock,
  Clock,
  Calendar,
  UserCheck,
  Search,
  Flame,
  Users,
  ChevronRight,
  History,
  MessageSquare,
  RefreshCw,
  PlusCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
  Bold,
  Heading2,
  Heading3,
  List,
  Quote,
  FileText,
  Layers,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  ArticleItem,
  ArticleDetail,
  ArticlePriority,
  ArticleStatus,
  EditorialFactCheckResult,
  ReporterProfile,
} from '../types';
import { BnwAiService } from '../services/aiService';

export interface NewsroomDeskScreenProps {
  pendingArticles: ArticleItem[];
  allArticles?: ArticleItem[];
  reporters?: ReporterProfile[];
  categories?: Array<string | { nameHi?: string; nameEn?: string; slug?: string }>;
  districts?: Array<string | { nameHi?: string; nameEn?: string; slug?: string }>;
  currentUser?: { id: string; name: string; role: string };
  onApproveAndPublish: (
    articleId: string,
    updatedTitle?: string,
    updatedContent?: string,
    district?: string,
    category?: string
  ) => void;
  onRequestRevision: (articleId: string, comments: string) => void;
  onRejectArticle: (articleId: string, reason?: string, reasonCode?: string) => void;
  onBroadcastBreakingAlert?: (title: string, district: string) => void;
  onClaimArticle?: (articleId: string, editorId: string, editorName: string) => void;
  onReassignArticle?: (articleId: string, editorId: string, editorName: string) => void;
  onUpdatePriority?: (articleId: string, priority: ArticlePriority) => void;
  onToggleBreaking?: (articleId: string, isBreaking: boolean) => void;
  onSchedulePublication?: (articleId: string, scheduledAt: string) => void;
  onSaveEditorialNotes?: (articleId: string, notes: string) => void;
  onUpdateReporterStatus?: (reporterId: string, status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TRAINEE') => void;
  onAssignReporterBeats?: (reporterId: string, beats: string[]) => void;
  onPublishArticle?: (article: Partial<ArticleDetail>) => Promise<void> | void;
  onAddPendingArticle?: (article: Partial<ArticleDetail>) => Promise<void> | void;
}

type QueueTab =
  | 'ALL'
  | 'PENDING_REVIEW'
  | 'ASSIGNED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED';


export const MP_PHOTO_PRESETS = [
  { label: 'राजधानी भोपाल (मंत्रालय/सचिवालय)', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80', credit: 'बीएनडब्ल्यू विशेष ब्यूरो' },
  { label: 'इंदौर बीआरटीएस व शहरी विकास', url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200&auto=format&fit=crop&q=80', credit: 'इंदौर प्रतिनिधि' },
  { label: 'उज्जैन महाकाल लोक व संस्कृति', url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=1200&auto=format&fit=crop&q=80', credit: 'उज्जैन ब्यूरो' },
  { label: 'किसान, फसल व अनाज मंडी', url: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=1200&auto=format&fit=crop&q=80', credit: 'कृषि संवाददाता' },
  { label: 'पुलिस, कानून व्यवस्था व जांच', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80', credit: 'क्राइम डेस्क' },
  { label: 'सड़क, दुर्घटना व हाईवे एंबुलेंस', url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&auto=format&fit=crop&q=80', credit: 'आपातकालीन संवाद' },
  { label: 'सड़क, फ्लाईओवर व निर्माण', url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80', credit: 'इंफ्रास्ट्रक्चर डेस्क' },
  { label: 'अस्पताल व स्वास्थ्य सेवाएं', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80', credit: 'स्वास्थ्य संवाददाता' },
];

const REJECTION_REASONS = [
  { code: 'UNVERIFIED_SOURCE', labelHindi: 'अपुष्ट स्रोत / आधारहीन दावा' },
  { code: 'FACTUAL_ERROR', labelHindi: 'गंभीर तथ्यात्मक त्रुटि' },
  { code: 'POLICY_VIOLATION', labelHindi: 'संपादकीय आचार संहिता उल्लंघन' },
  { code: 'DEFAMATORY', labelHindi: 'मानहानिकारक / गैर-कानूनी सामग्री' },
  { code: 'DUPLICATE_STORY', labelHindi: 'दोहरी / पूर्व-प्रकाशित खबर' },
  { code: 'POOR_QUALITY', labelHindi: 'अस्पष्ट भाषा / अपूर्ण विवरण' },
  { code: 'OTHER', labelHindi: 'अन्य विशिष्ट संपादकीय कारण' },
];

export const NewsroomDeskScreen: React.FC<NewsroomDeskScreenProps> = ({
  pendingArticles = [],
  allArticles = [],
  reporters = [],
  categories = ['मध्य प्रदेश', 'राजनीति', 'प्रशासन', 'अपराध', 'किसान व कृषि', 'शिक्षा व रोजगार', 'विकास', 'जनसमस्या'],
  districts = ['भोपाल', 'इंदौर', 'ग्वालियर', 'जबलपुर', 'उज्जैन', 'सागर', 'रीवा', 'सतना', 'छिंदवाड़ा', 'विदिशा', 'सीहोर', 'धार'],
  currentUser = { id: 'usr-desk-chief', name: 'मुख्य संपादक (Desk Editor)', role: 'CHIEF_EDITOR' },
  onApproveAndPublish,
  onRequestRevision,
  onRejectArticle,
  onBroadcastBreakingAlert,
  onClaimArticle,
  onReassignArticle,
  onUpdatePriority,
  onToggleBreaking,
  onSchedulePublication,
  onSaveEditorialNotes,
  onUpdateReporterStatus,
  onAssignReporterBeats,
  onPublishArticle,
  onAddPendingArticle,
}) => {
  // Normalize string lists
  const normalizedCategories = useMemo(() => {
    return (categories || []).map((c) => (typeof c === 'string' ? c : c.nameHi || c.nameEn || c.slug || ''));
  }, [categories]);

  const normalizedDistricts = useMemo(() => {
    return (districts || []).map((d) => (typeof d === 'string' ? d : d.nameHi || d.nameEn || d.slug || ''));
  }, [districts]);

  // Combine pendingArticles and allArticles with unique IDs
  const combinedArticles = useMemo(() => {
    const map = new Map<string, ArticleItem>();
    pendingArticles.forEach((a) => map.set(a.id, a));
    allArticles.forEach((a) => {
      if (!map.has(a.id)) {
        map.set(a.id, a);
      }
    });
    return Array.from(map.values());
  }, [pendingArticles, allArticles]);

  // Tab & Filters
  const [activeQueueTab, setActiveQueueTab] = useState<QueueTab>('ALL');
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Article
  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    combinedArticles[0]?.id || ''
  );

  
  // New Story Creation & Advanced Photo States
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editedFeaturedImage, setEditedFeaturedImage] = useState('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80');
  const [editedImageCaption, setEditedImageCaption] = useState('');
  const [editedImageCredit, setEditedImageCredit] = useState('');
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; url: string; caption: string; credit?: string }>>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newGalleryCredit, setNewGalleryCredit] = useState('');
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [editedOfficialStatement, setEditedOfficialStatement] = useState('');
  const [editedAuthorName, setEditedAuthorName] = useState(currentUser?.name || 'मुख्य संपादक');
  const [editedTags, setEditedTags] = useState('मध्य प्रदेश, ताज़ा खबर');
  const featuredFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Sub-editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubheadline, setEditedSubheadline] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedDistrict, setEditedDistrict] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedSeoTitle, setEditedSeoTitle] = useState('');
  const [editedSeoDesc, setEditedSeoDesc] = useState('');
  const [editedPriority, setEditedPriority] = useState<ArticlePriority>('NORMAL');
  const [isBreakingTag, setIsBreakingTag] = useState<boolean>(false);

  // AI Fact check
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<EditorialFactCheckResult | null>(null);

  // Modals & Panels
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionComments, setRevisionComments] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonCode, setRejectReasonCode] = useState(REJECTION_REASONS[0].code);
  const [rejectExplanation, setRejectExplanation] = useState('');

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetEditorId, setTargetEditorId] = useState('');

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [internalNoteText, setInternalNoteText] = useState('');

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastHeadline, setBroadcastHeadline] = useState('');
  const [broadcastDistrict, setBroadcastDistrict] = useState('पूरा मध्य प्रदेश');
  const [broadcastToast, setBroadcastToast] = useState<string | null>(null);
  const [deskNotice, setDeskNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [showReporterDrawer, setShowReporterDrawer] = useState(false);
  const [selectedReporter, setSelectedReporter] = useState<ReporterProfile | null>(null);
  const [newBeatInput, setNewBeatInput] = useState('');

  // Realtime simulation ticker / listener cleanup
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter articles based on tab and criteria
  const filteredArticles = useMemo(() => {
    return combinedArticles.filter((art) => {
      // Tab filter
      if (activeQueueTab === 'PENDING_REVIEW' && art.status !== 'PENDING_REVIEW') return false;
      if (activeQueueTab === 'ASSIGNED' && art.status !== 'ASSIGNED') return false;
      if (activeQueueTab === 'UNDER_REVIEW' && art.status !== 'UNDER_REVIEW') return false;
      if (activeQueueTab === 'REVISION_REQUESTED' && art.status !== 'REVISION_REQUESTED') return false;
      if (activeQueueTab === 'APPROVED' && art.status !== 'APPROVED') return false;
      if (activeQueueTab === 'PUBLISHED' && art.status !== 'PUBLISHED') return false;
      if (activeQueueTab === 'REJECTED' && art.status !== 'REJECTED') return false;

      // Dropdown filters
      if (filterDistrict !== 'ALL' && art.districtName !== filterDistrict) return false;
      if (filterCategory !== 'ALL' && art.categoryName !== filterCategory) return false;
      if (filterPriority !== 'ALL' && (art.priority || 'NORMAL') !== filterPriority) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (art.title || '').toLowerCase().includes(q);
        const contentMatch = (art.content || '').toLowerCase().includes(q);
        const authorMatch = (art.authorName || '').toLowerCase().includes(q);
        const districtMatch = (art.districtName || '').toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !authorMatch && !districtMatch) return false;
      }

      return true;
    });
  }, [combinedArticles, activeQueueTab, filterDistrict, filterCategory, filterPriority, searchQuery]);

  // Tab count badges
  const queueCounts = useMemo(() => {
    const counts: Record<QueueTab, number> = {
      ALL: combinedArticles.length,
      PENDING_REVIEW: 0,
      ASSIGNED: 0,
      UNDER_REVIEW: 0,
      REVISION_REQUESTED: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      REJECTED: 0,
    };
    combinedArticles.forEach((a) => {
      if (a.status in counts) {
        counts[a.status as QueueTab] = (counts[a.status as QueueTab] || 0) + 1;
      }
    });
    return counts;
  }, [combinedArticles]);

  const selectedArticle = useMemo(() => {
    return (
      filteredArticles.find((a) => a.id === selectedArticleId) ||
      combinedArticles.find((a) => a.id === selectedArticleId) ||
      filteredArticles[0] ||
      combinedArticles[0] ||
      null
    );
  }, [filteredArticles, combinedArticles, selectedArticleId]);

  // Sync edit form on selection change
  useEffect(() => {
    if (selectedArticle) {
      setEditedTitle(selectedArticle.title || '');
      setEditedSubheadline(selectedArticle.subheadline || '');
      setEditedContent(selectedArticle.content || '');
      setEditedDistrict(selectedArticle.districtName || normalizedDistricts[0] || 'भोपाल');
      setEditedCategory(selectedArticle.categoryName || normalizedCategories[0] || 'मध्य प्रदेश');
      setEditedSeoTitle(selectedArticle.seoTitle || selectedArticle.title || '');
      setEditedSeoDesc(selectedArticle.seoDescription || '');
      setEditedPriority(selectedArticle.priority || 'NORMAL');
      setIsBreakingTag(Boolean(selectedArticle.isBreaking));
      setIsEditing(false);
      setFactCheckResult(null);
    }
  }, [selectedArticle?.id, selectedArticle, normalizedDistricts, normalizedCategories]);

  // Handlers
  const handleStartNewArticle = () => {
    setIsCreatingNew(true);
    setSelectedArticleId('');
    setEditedTitle('');
    setEditedSubheadline('');
    setEditedContent('');
    setEditedDistrict(normalizedDistricts[0] || 'भोपाल');
    setEditedCategory(normalizedCategories[0] || 'मध्य प्रदेश');
    setEditedSeoTitle('');
    setEditedSeoDesc('');
    setEditedPriority('NORMAL');
    setIsBreakingTag(false);
    setEditedFeaturedImage(MP_PHOTO_PRESETS[0].url);
    setEditedImageCaption('मंत्रालय व प्रशासनिक भवन, भोपाल');
    setEditedImageCredit('बीएनडब्ल्यू विशेष ब्यूरो');
    setGalleryImages([]);
    setEditedOfficialStatement('');
    setEditedAuthorName(currentUser?.name || 'मुख्य संपादक');
    setEditedTags('मध्य प्रदेश, ताज़ा खबर');
    setIsEditing(true);
    setFactCheckResult(null);
  };

  const handleCancelNewArticle = () => {
    setIsCreatingNew(false);
    setIsEditing(false);
    if (combinedArticles[0]) {
      setSelectedArticleId(combinedArticles[0].id);
    }
  };

  const handleSaveOrPublishNew = async (targetStatus: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED') => {
    if (!editedTitle.trim()) {
      setDeskNotice({ type: 'error', text: 'कृपया समाचार का शीर्षक दर्ज करें।' });
      return;
    }
    if (!editedContent.trim()) {
      setDeskNotice({ type: 'error', text: 'कृपया समाचार का विवरण/सामग्री दर्ज करें।' });
      return;
    }

    const newId = `desk-${Date.now()}`;
    const newArticlePayload: Partial<ArticleDetail> = {
      id: newId,
      title: editedTitle.trim(),
      subheadline: editedSubheadline.trim(),
      content: editedContent.trim(),
      summary: editedSubheadline.trim() || editedContent.trim().substring(0, 160),
      districtName: editedDistrict,
      categoryName: editedCategory,
      priority: editedPriority,
      isBreaking: isBreakingTag,
      featuredImage: editedFeaturedImage || MP_PHOTO_PRESETS[0].url,
      imageUrl: editedFeaturedImage || MP_PHOTO_PRESETS[0].url,
      imageCaption: editedImageCaption,
      imageCredit: editedImageCredit,
      galleryImages: galleryImages,
      officialStatement: editedOfficialStatement,
      authorName: editedAuthorName || currentUser?.name || 'मुख्य संपादक',
      authorRole: 'DESK_CHIEF',
      tags: editedTags.split(',').map((t) => t.trim()).filter(Boolean),
      seoTitle: editedSeoTitle || editedTitle,
      seoDescription: editedSeoDesc || editedSubheadline || editedContent.substring(0, 150),
      status: targetStatus as any,
      publishedAt: targetStatus === 'PUBLISHED' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (targetStatus === 'PUBLISHED') {
        if (onPublishArticle) {
          await onPublishArticle(newArticlePayload);
        } else {
          onApproveAndPublish(newId, editedTitle, editedContent, editedDistrict, editedCategory);
        }
        setDeskNotice({ type: 'success', text: '✨ नया समाचार सीधे लाइव प्रकाशित कर दिया गया है!' });
      } else {
        if (onAddPendingArticle) {
          await onAddPendingArticle(newArticlePayload);
        }
        setDeskNotice({
          type: 'success',
          text: targetStatus === 'DRAFT' ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'समाचार समीक्षा कतार में जोड़ दिया गया है।'
        });
      }
      setIsCreatingNew(false);
      setIsEditing(false);
    } catch (err: any) {
      setDeskNotice({ type: 'error', text: `समाचार सहेजने में विफल: ${err?.message || 'त्रुटि'}` });
    }
  };

  const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditedFeaturedImage(reader.result);
          setDeskNotice({ type: 'success', text: `फोटो अपलोड सफल: ${file.name}` });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const newPhoto = {
            id: `gal-${Date.now()}`,
            url: reader.result,
            caption: newGalleryCaption || file.name,
            credit: newGalleryCredit || 'बीएनडब्ल्यू न्यूज़ डेस्क',
          };
          setGalleryImages((prev) => [...prev, newPhoto]);
          setShowAddGalleryModal(false);
          setNewGalleryUrl('');
          setNewGalleryCaption('');
          setNewGalleryCredit('');
          setDeskNotice({ type: 'success', text: 'अतिरिक्त फोटो गैलरी में जोड़ी गई।' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    const newPhoto = {
      id: `gal-${Date.now()}`,
      url: newGalleryUrl.trim(),
      caption: newGalleryCaption.trim() || 'ग्राउंड फोटो',
      credit: newGalleryCredit.trim() || 'बीएनडब्ल्यू न्यूज़ डेस्क',
    };
    setGalleryImages((prev) => [...prev, newPhoto]);
    setShowAddGalleryModal(false);
    setNewGalleryUrl('');
    setNewGalleryCaption('');
    setNewGalleryCredit('');
    setDeskNotice({ type: 'success', text: 'अतिरिक्त फोटो गैलरी में जोड़ी गई।' });
  };

  const handleRemoveGalleryPhoto = (id: string) => {
    setGalleryImages((prev) => prev.filter((p) => p.id !== id));
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('newsroom-content-editor') as HTMLTextAreaElement | null;
    if (!textarea) {
      setEditedContent((prev) => `${prev}\n${prefix}${suffix}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editedContent.substring(start, end);
    const replacement = `${prefix}${selected || 'यहां लिखें'}${suffix}`;
    const nextContent = editedContent.substring(0, start) + replacement + editedContent.substring(end);
    setEditedContent(nextContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 9));
    }, 50);
  };

  const handleRunAiAudit = async () => {
    if (!selectedArticle) return;
    setIsAiAuditing(true);
    try {
      const result = await BnwAiService.evaluateEditorialFactCheck(
        editedTitle || selectedArticle.title,
        editedContent || selectedArticle.content || '',
        editedDistrict || selectedArticle.districtName || 'मध्य प्रदेश'
      );
      setFactCheckResult(result);
      if (result.refinedHeadline) {
        setEditedTitle(result.refinedHeadline);
      }
    } catch {
      setDeskNotice({ type: 'error', text: 'AI तथ्य-जांच विश्लेषण में त्रुटि हुई।' });
    } finally {
      setIsAiAuditing(false);
    }
  };

  const handleClaim = () => {
    if (!selectedArticle) return;
    if (onClaimArticle) {
      onClaimArticle(selectedArticle.id, currentUser.id, currentUser.name);
    }
  };

  const handleReassignSubmit = () => {
    if (!selectedArticle || !targetEditorId) return;
    const targetEditor = reporters.find((r) => r.id === targetEditorId);
    const editorName = targetEditor ? targetEditor.name : 'डेस्क उप-संपादक';
    if (onReassignArticle) {
      onReassignArticle(selectedArticle.id, targetEditorId, editorName);
    }
    setShowReassignModal(false);
    setTargetEditorId('');
  };

  const handlePriorityChange = (newPriority: ArticlePriority) => {
    setEditedPriority(newPriority);
    if (selectedArticle && onUpdatePriority) {
      onUpdatePriority(selectedArticle.id, newPriority);
    }
  };

  const handleBreakingToggle = () => {
    const nextVal = !isBreakingTag;
    setIsBreakingTag(nextVal);
    if (selectedArticle && onToggleBreaking) {
      onToggleBreaking(selectedArticle.id, nextVal);
    }
  };

  const handleScheduleSubmit = () => {
    if (!selectedArticle || !scheduledDateTime) return;
    if (onSchedulePublication) {
      onSchedulePublication(selectedArticle.id, scheduledDateTime);
    }
    setShowScheduleModal(false);
  };

  const handleSaveNotesSubmit = () => {
    if (!selectedArticle || !internalNoteText.trim()) return;
    if (onSaveEditorialNotes) {
      onSaveEditorialNotes(selectedArticle.id, internalNoteText.trim());
    }
    setShowNotesModal(false);
    setInternalNoteText('');
  };

  const handleRejectSubmit = () => {
    if (!selectedArticle) return;
    const reasonObj = REJECTION_REASONS.find((r) => r.code === rejectReasonCode);
    const combinedReason = `[${reasonObj?.labelHindi || rejectReasonCode}] ${rejectExplanation}`.trim();
    onRejectArticle(selectedArticle.id, combinedReason, rejectReasonCode);
    setShowRejectModal(false);
    setRejectExplanation('');
  };

  const handleRevisionSubmit = () => {
    if (!selectedArticle || !revisionComments.trim()) {
      setDeskNotice({ type: 'error', text: 'कृपया आवश्यक संशोधन टिप्पणी दर्ज करें।' });
      return;
    }
    onRequestRevision(selectedArticle.id, revisionComments.trim());
    setShowRevisionModal(false);
    setRevisionComments('');
    setDeskNotice({ type: 'success', text: 'संशोधन निर्देश संवाददाता को भेज दिए गए हैं।' });
  };

  const handlePublishClick = () => {
    if (!selectedArticle) return;
    onApproveAndPublish(
      selectedArticle.id,
      editedTitle,
      editedContent,
      editedDistrict,
      editedCategory
    );
    if (selectedArticle) {
      (selectedArticle as any).featuredImage = editedFeaturedImage;
      (selectedArticle as any).imageUrl = editedFeaturedImage;
      (selectedArticle as any).imageCaption = editedImageCaption;
      (selectedArticle as any).imageCredit = editedImageCredit;
      (selectedArticle as any).galleryImages = galleryImages;
      (selectedArticle as any).officialStatement = editedOfficialStatement;
      (selectedArticle as any).authorName = editedAuthorName;
    }
    setDeskNotice({ type: 'success', text: 'स्टोरी सफलतापूर्वक लाइव प्रकाशित की गई।' });
    setIsEditing(false);
  };

  const handleTriggerBroadcast = () => {
    if (!broadcastHeadline.trim()) {
      setDeskNotice({ type: 'error', text: 'कृपया ब्रेकिंग अलर्ट का शीर्षक दर्ज करें।' });
      return;
    }
    if (onBroadcastBreakingAlert) {
      onBroadcastBreakingAlert(broadcastHeadline, broadcastDistrict);
    }
    setShowBroadcastModal(false);
    setBroadcastToast(`🚨 राज्यव्यापी ब्रेकिंग अलर्ट जारी किया गया: ${broadcastHeadline}`);
    setBroadcastHeadline('');
    setTimeout(() => setBroadcastToast(null), 5000);
  };

  // Helper for priority badges
  const renderPriorityBadge = (p?: ArticlePriority) => {
    const val = p || 'NORMAL';
    switch (val) {
      case 'BREAKING':
        return (
          <span className="inline-flex items-center gap-1 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-xs">
            <Flame className="w-3 h-3" />
            ब्रेकिंग
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
            अति-महत्वपूर्ण
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
            उच्च प्राथमिकता
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 font-medium text-[10px] px-2 py-0.5 rounded-full">
            सामान्य से कम
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-semibold text-[10px] px-2 py-0.5 rounded-full">
            सामान्य
          </span>
        );
    }
  };

  // Helper for status badge
  const renderStatusBadge = (s: ArticleStatus) => {
    switch (s) {
      case 'PENDING_REVIEW':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">समीक्षाधीन</span>;
      case 'ASSIGNED':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">असाइंड</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded">जांच प्रक्रिया</span>;
      case 'REVISION_REQUESTED':
        return <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded">संशोधन अपेक्षित</span>;
      case 'APPROVED':
        return <span className="bg-teal-100 text-teal-800 border border-teal-300 text-[10px] font-bold px-2 py-0.5 rounded">स्वीकृत</span>;
      case 'PUBLISHED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">लाइव प्रकाशित</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded">अस्वीकृत</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">{s}</span>;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-24 font-sans">
      {/* Top Bar / Header */}
      <div className="bg-slate-900 text-white px-4 py-4 border-b border-slate-800 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-xl font-black tracking-tight font-serif text-white">
                  केंद्रीय संपादकीय डेस्क (Chief Newsroom Desk)
                </h1>
                <span className="hidden sm:inline-block bg-red-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Live Newsroom
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                मप्र के 55 जिलों का 12-चरणीय संपादकीय सत्यापन, सब-एडिटिंग, प्रायोरिटी एस्केलेशन व ब्रॉडकास्ट
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowReporterDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>संवाददाता डायरेक्टरी ({reporters.length})</span>
            </button>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>राज्यव्यापी ब्रेकिंग अलर्ट</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400">
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>सिंक: {lastSyncTime.toLocaleTimeString('hi-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Toast Feedback */}
      {broadcastToast && (
        <div className="max-w-7xl mx-auto mt-3 px-4">
          <div className="bg-red-600 text-white p-3 rounded-xl shadow-lg text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              {broadcastToast}
            </span>
            <button onClick={() => setBroadcastToast(null)} className="text-white hover:text-slate-200 font-bold px-2">
              ✕
            </button>
          </div>
        </div>
      )}

      {deskNotice && (
        <div className="max-w-7xl mx-auto mt-3 px-4">
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
              deskNotice.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            <span>{deskNotice.text}</span>
            <button onClick={() => setDeskNotice(null)} className="px-2 font-bold">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Multi-Queue Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex items-center gap-1 py-2 min-w-max text-xs font-bold">
            {(
              [
                { tab: 'ALL', label: 'समस्त खबरें' },
                { tab: 'PENDING_REVIEW', label: 'लंबित समीक्षा' },
                { tab: 'ASSIGNED', label: 'असाइंड' },
                { tab: 'UNDER_REVIEW', label: 'जांच जारी' },
                { tab: 'REVISION_REQUESTED', label: 'संशोधन अपेक्षित' },
                { tab: 'APPROVED', label: 'स्वीकृत' },
                { tab: 'PUBLISHED', label: 'प्रकाशित' },
                { tab: 'REJECTED', label: 'अस्वीकृत' },
              ] as const
            ).map(({ tab, label }) => {
              const isActive = activeQueueTab === tab;
              const count = queueCounts[tab] || 0;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveQueueTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2.5 text-xs">
          <button
            type="button"
            onClick={handleStartNewArticle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ नया समाचार जोड़ें</span>
          </button>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="शीर्षक, विवरण, जिला या संवाददाता खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">जिला:</span>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="py-1.5 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium"
            >
              <option value="ALL">सभी जिले</option>
              {normalizedDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">श्रेणी:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-1.5 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium"
            >
              <option value="ALL">सभी श्रेणियां</option>
              {normalizedCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">प्राथमिकता:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="py-1.5 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium"
            >
              <option value="ALL">सभी प्राथमिकताएं</option>
              <option value="BREAKING">🚨 ब्रेकिंग</option>
              <option value="CRITICAL">अति-महत्वपूर्ण</option>
              <option value="HIGH">उच्च</option>
              <option value="NORMAL">सामान्य</option>
              <option value="LOW">कम</option>
            </select>
          </div>

          {(searchQuery || filterDistrict !== 'ALL' || filterCategory !== 'ALL' || filterPriority !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDistrict('ALL');
                setFilterCategory('ALL');
                setFilterPriority('ALL');
              }}
              className="text-[11px] font-bold text-red-600 hover:underline px-1.5"
            >
              फ़िल्टर हटाएं
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        {filteredArticles.length === 0 && !isCreatingNew ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">
              इस कतार में कोई स्टोरी उपलब्ध नहीं है!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              वर्तमान फ़िल्टर या कतार के अनुसार कोई रिकॉर्ड नहीं मिला। आप अन्य टैब चुन सकते हैं या फ़िल्टर रीसेट कर सकते हैं।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Queue List (4 cols) */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span>कतार सूची ({filteredArticles.length})</span>
                <span className="text-[11px] text-slate-500">
                  {activeQueueTab === 'ALL' ? 'समस्त' : activeQueueTab}
                </span>
              </div>

              <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
                {filteredArticles.map((art) => {
                  const isSelected = art.id === selectedArticle?.id;
                  return (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticleId(art.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-red-500 shadow-md ring-1 ring-red-400/30'
                          : 'bg-white/95 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px] mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {art.districtName || 'मध्य प्रदेश'}
                          </span>
                          {renderPriorityBadge(art.priority)}
                        </div>
                        {renderStatusBadge(art.status)}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {art.title}
                      </h4>

                      <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100">
                        <span className="truncate max-w-[140px]">
                          संवाददाता: <strong className="text-slate-700">{art.authorName || 'अज्ञात'}</strong>
                        </span>
                        {art.assignedEditorName && (
                          <span className="text-indigo-700 font-semibold truncate max-w-[120px]">
                            डेस्क: {art.assignedEditorName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Editorial & Sub-Editing Workspace (8 cols) */}
            {(selectedArticle || isCreatingNew) ? (
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  {/* Top Metadata Header & Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isCreatingNew ? (
                        <>
                          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                            <PlusCircle className="w-3.5 h-3.5" />
                            नया समाचार निर्माण (New Story Desk)
                          </span>
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                            संपादकीय डेस्क ड्राफ्ट
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">
                            {selectedArticle?.districtName}
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded">
                            {selectedArticle?.categoryName}
                          </span>
                          {renderPriorityBadge(editedPriority || selectedArticle?.priority)}
                          {renderStatusBadge(selectedArticle?.status || 'PENDING_REVIEW')}
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isCreatingNew ? (
                        <button
                          type="button"
                          onClick={handleCancelNewArticle}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>रद्द करें</span>
                        </button>
                      ) : (
                        <>
                          {/* Claim Button */}
                          <button
                            type="button"
                            onClick={handleClaim}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                              selectedArticle?.claimedBy || selectedArticle?.assignedEditorName
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {selectedArticle?.claimedBy || selectedArticle?.assignedEditorName ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {selectedArticle?.claimedBy || selectedArticle?.assignedEditorName
                                ? `डेस्क: ${selectedArticle?.claimedBy || selectedArticle?.assignedEditorName}`
                                : 'स्टोरी क्लेम करें'}
                            </span>
                          </button>

                          {/* Reassign Button */}
                          <button
                            type="button"
                            onClick={() => setShowReassignModal(true)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>रीअसाइन</span>
                          </button>

                          {/* Sub-editing Toggle */}
                          <button
                            type="button"
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                              isEditing
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEditing ? 'संपादन मोड सक्रिय' : 'सब-एडिट करें'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Priority & Breaking Quick Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">प्राथमिकता:</span>
                      {(['NORMAL', 'HIGH', 'CRITICAL', 'BREAKING'] as ArticlePriority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePriorityChange(p)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            editedPriority === p
                              ? 'bg-red-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p === 'BREAKING' ? '🚨 ब्रेकिंग' : p}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleBreakingToggle}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold text-xs transition-colors ${
                          isBreakingTag
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isBreakingTag ? 'ब्रेकिंग सक्रिय है' : 'ब्रेकिंग टैग लगाएं'}</span>
                      </button>

                      {!isCreatingNew && selectedArticle && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowScheduleModal(true)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded font-bold text-xs"
                          >
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{selectedArticle.scheduledAt ? 'पुनः शेड्यूल करें' : 'शेड्यूल करें'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowNotesModal(true)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded font-bold text-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>आंतरिक टिप्पणी</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Headline & Subheadline (Display or Edit) */}
                  {(isEditing || isCreatingNew) ? (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            संपादित मुख्य शीर्षक (Headline) *
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {editedTitle.length} अक्षर
                          </span>
                        </div>
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          placeholder="उदा. भोपाल: नर्मदा परिक्रमा कर लौट रहे श्रद्धालुओं से भरी ट्रैक्टर-ट्रॉली पलटी, 3 की मौत"
                          className="w-full text-sm font-bold p-2.5 border border-blue-400 rounded-lg bg-blue-50/20 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          उप-शीर्षक (Subheadline / Standfirst):
                        </label>
                        <input
                          type="text"
                          value={editedSubheadline}
                          onChange={(e) => setEditedSubheadline(e.target.value)}
                          placeholder="उदा. घायल 30 श्रद्धालुओं को तत्काल जिला अस्पताल में भर्ती कराया गया, प्रशासन अलर्ट मोड पर..."
                          className="w-full text-xs p-2 border border-blue-300 rounded-lg bg-blue-50/10"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">जिला (District):</label>
                          <select
                            value={editedDistrict}
                            onChange={(e) => setEditedDistrict(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                          >
                            {normalizedDistricts.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">श्रेणी (Category):</label>
                          <select
                            value={editedCategory}
                            onChange={(e) => setEditedCategory(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                          >
                            {normalizedCategories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">लेखक / संवाददाता (Byline):</label>
                          <input
                            type="text"
                            value={editedAuthorName}
                            onChange={(e) => setEditedAuthorName(e.target.value)}
                            placeholder="मुख्य संपादक / संवाददाता नाम"
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-base md:text-xl font-bold text-slate-900 leading-snug">
                        {editedTitle || selectedArticle?.title}
                      </h2>
                      {(editedSubheadline || selectedArticle?.subheadline) && (
                        <p className="text-xs md:text-sm text-slate-600 mt-1 font-medium">
                          {editedSubheadline || selectedArticle?.subheadline}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Photo Management Section (Featured Image + Multiple Photo Gallery) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-red-600" />
                        <h4 className="text-xs font-bold text-slate-800">
                          फोटो प्रबंधन (Featured Photo & Gallery)
                        </h4>
                      </div>
                      {(isEditing || isCreatingNew) && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPresetPicker(!showPresetPicker)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-md"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>म.प्र. प्रेस लाइब्रेरी</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => featuredFileInputRef.current?.click()}
                            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-md shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-blue-600" />
                            <span>फ़ोटो अपलोड</span>
                          </button>
                          <input
                            type="file"
                            ref={featuredFileInputRef}
                            accept="image/*"
                            onChange={handleFeaturedImageUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>

                    {/* MP Photo Presets Drawer if toggled */}
                    {showPresetPicker && (isEditing || isCreatingNew) && (
                      <div className="p-3 bg-white border border-indigo-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                          <span>मध्य प्रदेश प्रेस फोटो लाइब्रेरी (8 थीम्स)</span>
                          <button
                            type="button"
                            onClick={() => setShowPresetPicker(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {MP_PHOTO_PRESETS.map((preset, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setEditedFeaturedImage(preset.url);
                                setEditedImageCaption(preset.label);
                                setEditedImageCredit(preset.credit);
                                setShowPresetPicker(false);
                                setDeskNotice({ type: 'success', text: `फोटो चुनी गई: ${preset.label}` });
                              }}
                              className="group border border-slate-200 hover:border-indigo-500 rounded-lg overflow-hidden cursor-pointer transition-all bg-slate-50 hover:bg-indigo-50/30"
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-full h-16 object-cover group-hover:scale-105 transition-transform"
                              />
                              <p className="text-[10px] font-bold text-slate-700 p-1.5 truncate">
                                {preset.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Image Display or Edit */}
                    {(isEditing || isCreatingNew) ? (
                      <div className="space-y-2.5">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={editedFeaturedImage}
                            onChange={(e) => setEditedFeaturedImage(e.target.value)}
                            placeholder="मुख्य फोटो का वेब URL दर्ज करें (https://...)"
                            className="flex-1 text-xs p-2 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>

                        {editedFeaturedImage && (
                          <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-900 flex items-center justify-center">
                            <img
                              src={editedFeaturedImage}
                              alt="मुख्य फोटो पूर्वावलोकन"
                              className="w-full h-48 sm:h-56 object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                              मुख्य फोटो
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600">फोटो कैप्शन (Caption):</label>
                            <input
                              type="text"
                              value={editedImageCaption}
                              onChange={(e) => setEditedImageCaption(e.target.value)}
                              placeholder="उदा. घटनास्थल पर राहत एवं बचाव कार्य में जुटी प्रशासन की टीम"
                              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600">फोटो साभार (Credit):</label>
                            <input
                              type="text"
                              value={editedImageCredit}
                              onChange={(e) => setEditedImageCredit(e.target.value)}
                              placeholder="उदा. बीएनडब्ल्यू विशेष संवाददाता / पीटीआई"
                              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      (editedFeaturedImage || selectedArticle?.featuredImage) && (
                        <div className="rounded-xl overflow-hidden border border-slate-200">
                          <img
                            src={editedFeaturedImage || selectedArticle?.featuredImage}
                            alt="ग्राउंड फोटो"
                            className="w-full h-48 sm:h-56 object-cover"
                          />
                          {(editedImageCaption || selectedArticle?.imageCaption || editedImageCredit || selectedArticle?.imageCredit) && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 border-t border-slate-200 flex items-center justify-between">
                              <span>{editedImageCaption || selectedArticle?.imageCaption}</span>
                              {(editedImageCredit || selectedArticle?.imageCredit) && (
                                <span className="text-slate-400">
                                  फोटो साभार: {editedImageCredit || selectedArticle?.imageCredit}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {/* Multiple Photo Gallery Section */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>अतिरिक्त फोटो गैलरी ({galleryImages.length})</span>
                        </span>
                        {(isEditing || isCreatingNew) && (
                          <button
                            type="button"
                            onClick={() => setShowAddGalleryModal(true)}
                            className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ फोटो जोड़ें</span>
                          </button>
                        )}
                      </div>

                      {galleryImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {galleryImages.map((img) => (
                            <div
                              key={img.id}
                              className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white"
                            >
                              <img
                                src={img.url}
                                alt={img.caption || 'गैलरी फोटो'}
                                className="w-full h-20 object-cover"
                              />
                              {(isEditing || isCreatingNew) && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGalleryPhoto(img.id)}
                                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                              {img.caption && (
                                <p className="text-[10px] text-slate-600 p-1 truncate bg-slate-50 border-t border-slate-100">
                                  {img.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          कोई अतिरिक्त फोटो नहीं जोड़ी गई है। खबर में कई तस्वीरें शामिल करने हेतु '+ फोटो जोड़ें' पर क्लिक करें।
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Article Body Content (Display or Edit) */}
                  {(isEditing || isCreatingNew) ? (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>संपादित खबर विवरण (Content Body) *</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {editedContent.length} अक्षर | ~{editedContent.split(/\s+/).filter(Boolean).length} शब्द
                          </span>
                        </div>

                        {/* Rich Formatting Toolbar */}
                        <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 border border-slate-300 rounded-t-lg text-slate-700 text-xs">
                          <button
                            type="button"
                            onClick={() => insertFormatting('**', '**')}
                            className="p-1.5 hover:bg-white rounded font-bold hover:text-slate-900"
                            title="बोल्ड करें"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('## ', '')}
                            className="px-2 py-1 hover:bg-white rounded font-bold text-xs"
                            title="मुख्य उप-शीर्षक (H2)"
                          >
                            <Heading2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('### ', '')}
                            className="px-2 py-1 hover:bg-white rounded font-bold text-xs"
                            title="खंड शीर्षक (H3)"
                          >
                            <Heading3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('\n- ', '')}
                            className="p-1.5 hover:bg-white rounded hover:text-slate-900"
                            title="बुलेट सूची"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('\n> ', '')}
                            className="p-1.5 hover:bg-white rounded hover:text-slate-900"
                            title="उद्धरण (Quote)"
                          >
                            <Quote className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('\n> **प्रशासनिक पक्ष:** ', '')}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-[11px] text-indigo-700 hover:bg-indigo-50"
                            title="प्रशासनिक बयान बॉक्स"
                          >
                            + प्रशासनिक बयान
                          </button>
                        </div>

                        <textarea
                          id="newsroom-content-editor"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          rows={10}
                          placeholder="खबर का विस्तृत विवरण यहां लिखें... (पैराग्राफ, प्रत्यक्षदर्शियों के बयान, प्रशासनिक प्रतिक्रिया आदि)"
                          className="w-full text-xs md:text-sm p-3 border border-t-0 border-blue-400 rounded-b-lg bg-blue-50/15 leading-relaxed font-sans focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>

                      {/* Official Statement Field */}
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                        <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <span>प्रशासनिक / अधिकृत पक्ष (Official Administrative Statement):</span>
                        </label>
                        <input
                          type="text"
                          value={editedOfficialStatement}
                          onChange={(e) => setEditedOfficialStatement(e.target.value)}
                          placeholder="उदा. कलेक्टर: 'मामले की मजिस्ट्रियल जांच के आदेश दे दिए गए हैं और पीड़ितों को मुआवजा वितरित किया जा रहा है...'"
                          className="w-full text-xs p-2 border border-amber-300 rounded-lg bg-white"
                        />
                      </div>

                      {/* SEO Tags & Metadata */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-700 block">एसईओ मेटाडेटा (SEO Tags & Search Keywords):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[11px] text-slate-500">एसईओ टाइटल:</label>
                            <input
                              type="text"
                              value={editedSeoTitle}
                              onChange={(e) => setEditedSeoTitle(e.target.value)}
                              placeholder="गूगल सर्च के लिए अनुकूलित शीर्षक"
                              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500">सर्च कीवर्ड्स / टैग्स (कॉमा से अलग):</label>
                            <input
                              type="text"
                              value={editedTags}
                              onChange={(e) => setEditedTags(e.target.value)}
                              placeholder="उदा. भोपाल, सड़क हादसा, राहत कार्य"
                              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500">मेटा विवरण (Meta Description):</label>
                          <input
                            type="text"
                            value={editedSeoDesc}
                            onChange={(e) => setEditedSeoDesc(e.target.value)}
                            placeholder="सोशल मीडिया शेयरिंग व गूगल सर्च परिणाम हेतु 150 अक्षरों का विवरण"
                            className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto">
                      {editedContent || selectedArticle?.content}
                    </div>
                  )}

                  {/* Scheduled Alert Notice if set */}
                  {selectedArticle?.scheduledAt && (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs flex items-center gap-2 text-indigo-900 font-medium">
                      <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        प्रकाशन हेतु निर्धारित समय: <strong>{new Date(selectedArticle.scheduledAt).toLocaleString('hi-IN')}</strong>
                      </span>
                    </div>
                  )}

                  {/* AI 10-Point Fact Check Audit Action */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>एआई 10-बिंदु संपादकीय फैक्ट-चेक ऑडिटर (Heuristic Verification)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunAiAudit}
                        disabled={isAiAuditing}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                      >
                        {isAiAuditing ? 'विश्लेषण चल रहा है...' : 'जांच शुरू करें'}
                      </button>
                    </div>

                    {factCheckResult && (
                      <div className="mt-2 pt-2 border-t border-indigo-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900">
                            सत्यापन स्कोर: {factCheckResult.score}/100
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {factCheckResult.credibilityRating}
                          </span>
                        </div>

                        <p className="text-slate-700 italic bg-white/90 p-2.5 rounded border border-indigo-100">
                          "{factCheckResult.editorialRemarksHindi}"
                        </p>

                        <div className="space-y-1">
                          {factCheckResult.checklist.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                              {item.status === 'PASSED' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold text-slate-800">{item.pointName}:</span>{' '}
                                <span className="text-slate-600">{item.commentHindi}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Revision History Display */}
                  {selectedArticle?.revisionHistory && selectedArticle.revisionHistory.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>संशोधन इतिहास (Revision Audit Trail - v{selectedArticle.version || 1}):</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto text-[11px]">
                        {selectedArticle.revisionHistory.map((rev, idx) => (
                          <div key={idx} className="p-2 bg-white rounded border border-slate-100 text-slate-600 flex flex-col gap-0.5">
                            <div className="flex items-center justify-between font-semibold text-slate-700">
                              <span>कार्रवाई: {rev.action}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rev.timestamp).toLocaleString('hi-IN')}
                              </span>
                            </div>
                            {rev.editorName && <span>संपादक: {rev.editorName}</span>}
                            {rev.comments && <span className="italic text-slate-500">"{rev.comments}"</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Editorial Actions Footer Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {isCreatingNew ? (
                      <>
                        <button
                          type="button"
                          onClick={handleCancelNewArticle}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          रद्द करें
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveOrPublishNew('DRAFT')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            ड्राफ्ट सहेजें
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveOrPublishNew('PENDING_REVIEW')}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            समीक्षा कतार में भेजें
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveOrPublishNew('PUBLISHED')}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>स्वीकृत कर तुरंत लाइव प्रकाशित करें</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRevisionModal(true)}
                            className="flex items-center gap-1 px-3 py-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>संशोधन मांगें</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowRejectModal(true)}
                            className="flex items-center gap-1 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>अस्वीकृत करें</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            >
                              संपादन रद्द
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handlePublishClick}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {isEditing ? 'परिवर्तन सहेजें व लाइव प्रकाशित करें' : 'स्वीकृत करें व लाइव प्रकाशित करें'}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-8 bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">कोई स्टोरी चयनित नहीं है</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  समीक्षा या संपादन हेतु बाईं कतार से किसी खबर का चयन करें या ऊपर '+ नया समाचार जोड़ें' पर क्लिक करें।
                </p>
                <button
                  type="button"
                  onClick={handleStartNewArticle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ नया समाचार जोड़ें</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Revision Request */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>संवाददाता से संशोधन मांगें</span>
              </h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                संशोधन निर्देश / अपेक्षित सुधार:
              </label>
              <textarea
                value={revisionComments}
                onChange={(e) => setRevisionComments(e.target.value)}
                rows={3}
                placeholder="उदा. कृपया तहसीलदार का पक्ष शामिल करें या बयान की पुष्टि करें..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleRevisionSubmit}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                संशोधन हेतु भेजें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reject with Mandatory Reason Code */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>स्टोरी अस्वीकृत करें (अनिवार्य कारण)</span>
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                अस्वीकृति का प्राथमिक कारण (Reason Code):
              </label>
              <select
                value={rejectReasonCode}
                onChange={(e) => setRejectReasonCode(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.labelHindi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                विस्तृत संपादकीय टिप्पणी:
              </label>
              <textarea
                value={rejectExplanation}
                onChange={(e) => setRejectExplanation(e.target.value)}
                rows={3}
                placeholder="उदा. रिपोर्ट में दूसरे पक्ष का कोई संदर्भ नहीं है तथा दावा अपुष्ट है..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                अस्वीकृत करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Schedule Publication */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>प्रकाशन शेड्यूल करें</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                प्रकाशन का दिनांक व समय:
              </label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleScheduleSubmit}
                disabled={!scheduledDateTime}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
              >
                शेड्यूल सुरक्षित करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Reassign Article */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>स्टोरी अन्य डेस्क संपादक को सौंपें</span>
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                डेस्क संपादक चुनें:
              </label>
              <select
                value={targetEditorId}
                onChange={(e) => setTargetEditorId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- संपादक का चयन करें --</option>
                <option value="usr-desk-chief">मुख्य संपादक (Chief Desk)</option>
                <option value="usr-desk-bhopal">भोपाल डेस्क इंचार्ज</option>
                <option value="usr-desk-indore">इंदौर डेस्क इंचार्ज</option>
                <option value="usr-desk-crime">अपराध डेस्क सब-एडिटर</option>
                {reporters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.assignedDistricts?.join(', ') || 'स्टाफ'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleReassignSubmit}
                disabled={!targetEditorId}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
              >
                असाइन करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Internal Editorial Note */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>आंतरिक संपादकीय टिप्पणी जोड़ें (Internal Desk Note)</span>
              </h3>
              <button onClick={() => setShowNotesModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                गोपनीय डेस्क टिप्पणी (यह जनता या पाठक को नहीं दिखेगी):
              </label>
              <textarea
                value={internalNoteText}
                onChange={(e) => setInternalNoteText(e.target.value)}
                rows={3}
                placeholder="उदा. रिपोर्टर ने फोन पर पुष्टि की है कि फुटेज शाम 5 बजे तक उपलब्ध हो जाएगी..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleSaveNotesSubmit}
                disabled={!internalNoteText.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
              >
                टिप्पणी सहेजें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Broadcast Breaking Alert */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <Radio className="w-5 h-5 animate-spin" />
                <span>राज्यव्यापी ब्रेकिंग अलर्ट जारी करें</span>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                प्रसारण क्षेत्र (Target Coverage):
              </label>
              <select
                value={broadcastDistrict}
                onChange={(e) => setBroadcastDistrict(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="पूरा मध्य प्रदेश">पूरा मध्य प्रदेश (समस्त 55 जिले)</option>
                <option value="भोपाल संभाग">भोपाल संभाग</option>
                <option value="इंदौर संभाग">इंदौर संभाग</option>
                <option value="ग्वालियर-चंबल">ग्वालियर-चंबल संभाग</option>
                <option value="महाकोशल व विंध्य">महाकोशल व विंध्य संभाग</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ब्रेकिंग अलर्ट का शीर्षक (Short Push Headline) *
              </label>
              <input
                type="text"
                value={broadcastHeadline}
                onChange={(e) => setBroadcastHeadline(e.target.value)}
                placeholder="उदा. बड़ी खबर: मध्य प्रदेश में मौसम विभाग का भारी बारिश का रेड अलर्ट..."
                className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleTriggerBroadcast}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                🚨 अलर्ट प्रसारित करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: Reporter Directory & Performance */}
      {showReporterDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-5 space-y-4 shadow-2xl border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  संवाददाता डायरेक्टरी एवं प्रदर्शन
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowReporterDrawer(false);
                  setSelectedReporter(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {selectedReporter ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedReporter(null)}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  ← समस्त संवाददाताओं की सूची पर लौटें
                </button>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{selectedReporter.name}</h4>
                      <p className="text-xs text-slate-500">
                        {selectedReporter.assignedDistricts?.join(', ') || selectedReporter.assignedDivision || 'मध्य प्रदेश'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedReporter.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedReporter.status === 'SUSPENDED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedReporter.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="font-bold text-slate-900">{selectedReporter.totalStoriesFiled || 0}</div>
                      <div className="text-[10px] text-slate-500">कुल सबमिट</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="font-bold text-emerald-600">{selectedReporter.totalStoriesPublished || 0}</div>
                      <div className="text-[10px] text-slate-500">प्रकाशित</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="font-bold text-blue-600">
                        {selectedReporter.approvalRate ||
                          (selectedReporter.totalStoriesFiled
                            ? Math.round(
                                ((selectedReporter.totalStoriesPublished || 0) /
                                  selectedReporter.totalStoriesFiled) *
                                  100
                              )
                            : 0)}
                        %
                      </div>
                      <div className="text-[10px] text-slate-500">स्वीकृति दर</div>
                    </div>
                  </div>

                  {/* Change Status Buttons */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block">सत्यापन स्थिति बदलें:</span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {(['ACTIVE', 'TRAINEE', 'PENDING', 'SUSPENDED'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            if (onUpdateReporterStatus) {
                              onUpdateReporterStatus(selectedReporter.id, st);
                            }
                            setSelectedReporter({ ...selectedReporter, status: st });
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                            selectedReporter.status === st
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Beats Management */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block">संबद्ध बीट्स / विषय:</span>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {(selectedReporter.beats || ['स्थानीय प्रशासन', 'अपराध']).map((b, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                          #{b}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="नया बीट जोड़ें (उदा. खेल, विकास)..."
                        value={newBeatInput}
                        onChange={(e) => setNewBeatInput(e.target.value)}
                        className="text-xs p-1.5 border border-slate-300 rounded bg-white flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newBeatInput.trim()) return;
                          const updated = [...(selectedReporter.beats || []), newBeatInput.trim()];
                          if (onAssignReporterBeats) {
                            onAssignReporterBeats(selectedReporter.id, updated);
                          }
                          setSelectedReporter({ ...selectedReporter, beats: updated });
                          setNewBeatInput('');
                        }}
                        className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded"
                      >
                        जोड़ें
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {reporters.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">कोई संवाददाता रिकॉर्ड नहीं मिला।</p>
                ) : (
                  reporters.map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReporter(rep)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{rep.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              rep.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {rep.status || 'ACTIVE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {rep.assignedDistricts?.join(', ') || 'मध्य प्रदेश'} • {rep.phone}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL 7: Add Gallery Photo */}
      {showAddGalleryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-red-600" />
                <span>अतिरिक्त फोटो गैलरी में जोड़ें</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddGalleryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  फोटो URL दर्ज करें:
                </label>
                <input
                  type="text"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="text-center text-xs font-semibold text-slate-400">या</div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  कंप्यूटर / डिवाइस से फोटो फ़ाइल अपलोड करें:
                </label>
                <button
                  type="button"
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="w-full py-2 px-3 border border-dashed border-blue-400 bg-blue-50/40 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>फ़ोटो चुनें</span>
                </button>
                <input
                  type="file"
                  ref={galleryFileInputRef}
                  accept="image/*"
                  onChange={handleGalleryImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  फोटो कैप्शन (वैकल्पिक):
                </label>
                <input
                  type="text"
                  value={newGalleryCaption}
                  onChange={(e) => setNewGalleryCaption(e.target.value)}
                  placeholder="उदा. राहत कार्य की अन्य तस्वीर"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  फोटो साभार / क्रेडिट (वैकल्पिक):
                </label>
                <input
                  type="text"
                  value={newGalleryCredit}
                  onChange={(e) => setNewGalleryCredit(e.target.value)}
                  placeholder="उदा. बीएनडब्ल्यू ब्यूरो"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddGalleryModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleAddGalleryUrl}
                disabled={!newGalleryUrl.trim()}
                className="px-4 py-1.5 bg-[#ED1727] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
              >
                गैलरी में जोड़ें
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
