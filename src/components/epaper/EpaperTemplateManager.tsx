import React, { useState, useEffect } from 'react';
import {
  EpaperTemplateDoc,
  EpaperTemplateRegion,
  EpaperTemplateVersionHistory,
  EpaperTemplateValidationResult,
  TemplateAnalysisResult,
  EpaperElementType,
} from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Layout,
  Layers,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  X,
  FileText,
  Sliders,
  Grid,
  Copy,
  History,
  RotateCcw,
  Archive,
  ArchiveRestore,
  Send,
  ShieldCheck,
  Newspaper,
  ArrowLeftRight,
  Check,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export interface EpaperTemplateManagerProps {
  onApplyTemplate?: (template: EpaperTemplateDoc) => void;
  currentPageElements?: any[];
  pageId?: string;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'सभी टेम्पलेट' },
  { id: 'FRONT_PAGE', label: 'प्रथम पृष्ठ' },
  { id: 'DISTRICT_FOCUS', label: 'ज़िला विशेष' },
  { id: 'STATE', label: 'मध्य प्रदेश प्रादेशिक' },
  { id: 'POLITICAL', label: 'राजनीति' },
  { id: 'BUSINESS', label: 'व्यापार व कृषि' },
  { id: 'EDUCATION', label: 'शिक्षा व करियर' },
  { id: 'SPORTS', label: 'खेल जगत' },
  { id: 'EDITORIAL', label: 'संपादकीय व विचार' },
  { id: 'SPECIAL', label: 'विशेषांक परिशिष्ट' },
  { id: 'CUSTOM', label: 'कस्टम लेआउट्स' },
];

const STATUS_TABS = [
  { id: 'all', label: 'सभी स्थितियां' },
  { id: 'ACTIVE', label: 'सक्रिय (Active)' },
  { id: 'DRAFT', label: 'प्रारूप (Draft)' },
  { id: 'ARCHIVED', label: 'अभिलेखागार (Archived)' },
];

export const EpaperTemplateManager: React.FC<EpaperTemplateManagerProps> = ({
  onApplyTemplate,
  currentPageElements,
  pageId,
}) => {
  const [templates, setTemplates] = useState<EpaperTemplateDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [previewTemplate, setPreviewTemplate] = useState<EpaperTemplateDoc | null>(null);
  const [showDummyText, setShowDummyText] = useState<boolean>(true);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Edit / Create Modal state
  const [editingTemplate, setEditingTemplate] = useState<Partial<EpaperTemplateDoc> | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<EpaperTemplateValidationResult | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // History & Diff Modal state
  const [historyTemplate, setHistoryTemplate] = useState<EpaperTemplateDoc | null>(null);
  const [versionHistory, setVersionHistory] = useState<EpaperTemplateVersionHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Duplicate Modal state
  const [duplicateTarget, setDuplicateTarget] = useState<EpaperTemplateDoc | null>(null);
  const [duplicateName, setDuplicateName] = useState<string>('');
  const [duplicating, setDuplicating] = useState<boolean>(false);

  // AI Layout Analysis state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<TemplateAnalysisResult | null>(null);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await apiClient.epaper.getTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCat =
      activeCategory === 'all' ||
      tpl.category === activeCategory ||
      (activeCategory === 'CUSTOM' && !tpl.isSystem);

    const matchesStatus =
      activeStatus === 'all' ||
      String(tpl.status || 'ACTIVE').toUpperCase() === activeStatus;

    const matchesSearch =
      !searchQuery ||
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.nameHi && tpl.nameHi.includes(searchQuery)) ||
      (tpl.templateCode && tpl.templateCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tpl.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesStatus && matchesSearch;
  });

  // --------------------------------------------------------------------------
  // TEMPLATE LIFECYCLE HANDLERS
  // --------------------------------------------------------------------------

  const handleDuplicate = async () => {
    if (!duplicateTarget) return;
    setDuplicating(true);
    try {
      const cloned = await apiClient.epaper.duplicateTemplate(duplicateTarget.id, duplicateName);
      showToast(`टेम्पलेट की प्रतिलिपि बनाई गई: "${cloned.nameHi || cloned.name}"`);
      setDuplicateTarget(null);
      setDuplicateName('');
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || 'क्लोन विफल रहा');
    } finally {
      setDuplicating(false);
    }
  };

  const handlePublish = async (tpl: EpaperTemplateDoc) => {
    if (!window.confirm(`क्या आप वाकई "${tpl.nameHi || tpl.name}" को प्रकाशित (Publish) करना चाहते हैं? इससे यह संस्करण सक्रिय हो जाएगा।`)) {
      return;
    }
    try {
      const pub = await apiClient.epaper.publishTemplate(tpl.id);
      showToast(`टेम्पलेट v${pub.version} सफलतापूर्वक प्रकाशित किया गया!`);
      if (editingTemplate?.id === tpl.id) {
        setEditingTemplate(null);
      }
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || 'प्रकाशन विफल रहा');
    }
  };

  const handleArchive = async (tpl: EpaperTemplateDoc) => {
    if (!window.confirm(`क्या आप वाकई "${tpl.nameHi || tpl.name}" को अभिलेखागार (Archive) में भेजना चाहते हैं?`)) {
      return;
    }
    try {
      await apiClient.epaper.archiveTemplate(tpl.id);
      showToast('टेम्पलेट को अभिलेखागार में भेजा गया।');
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || 'अभिलेखागार कार्रवाई विफल रही');
    }
  };

  const handleRestore = async (tpl: EpaperTemplateDoc) => {
    try {
      await apiClient.epaper.restoreTemplate(tpl.id);
      showToast('टेम्पलेट को सफलतापूर्वक पुनर्स्थापित (Restore) किया गया।');
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || 'पुनर्स्थापन विफल रहा');
    }
  };

  const handleOpenHistory = async (tpl: EpaperTemplateDoc) => {
    setHistoryTemplate(tpl);
    setLoadingHistory(true);
    try {
      const hist = await apiClient.epaper.getTemplateVersions(tpl.id);
      setVersionHistory(hist);
    } catch (err: any) {
      console.error('Failed to load version history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRollback = async (targetVer: number) => {
    if (!historyTemplate) return;
    if (!window.confirm(`क्या आप वाकई टेम्पलेट को संस्करण v${targetVer} पर रोलबैक करना चाहते हैं? इससे एक नया सक्रिय संस्करण निर्मित होगा।`)) {
      return;
    }
    try {
      const rolled = await apiClient.epaper.rollbackTemplate(historyTemplate.id, targetVer);
      showToast(`टेम्पलेट सफलतापूर्वक v${targetVer} पर रोलबैक हुआ (वर्तमान संस्करण: v${rolled.version})!`);
      setHistoryTemplate(null);
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || 'रोलबैक विफल रहा');
    }
  };

  // --------------------------------------------------------------------------
  // TEMPLATE EDITOR & VALIDATION
  // --------------------------------------------------------------------------

  const handleOpenEditor = (tpl?: EpaperTemplateDoc) => {
    if (tpl) {
      setEditingTemplate(JSON.parse(JSON.stringify(tpl)));
      setIsNewTemplate(false);
    } else {
      setEditingTemplate({
        name: '',
        nameHi: '',
        category: 'CUSTOM',
        gridColumns: 8,
        isSystem: false,
        status: 'DRAFT',
        pageDimensions: { widthPt: 932.6, heightPt: 1474.0 },
        margins: { left: 42.52, right: 42.52, top: 56.69, bottom: 85.04 },
        gutter: 14.17,
        regions: currentPageElements && currentPageElements.length > 0
          ? currentPageElements.map((el, i) => ({
              id: `reg-${i + 1}-${String(el.elementType || 'story').toLowerCase()}`,
              name: `क्षेत्र ${i + 1}: ${el.elementType || 'STORY'}`,
              bounds: el.bounds || { x: 42.52, y: 120, width: 400, height: 200 },
              colSpan: el.colSpan || 4,
              defaultElementType: el.elementType || 'STORY',
            }))
          : [
              {
                id: 'reg-01-head',
                name: 'मुख्य हेडर',
                bounds: { x: 42.52, y: 56.69, width: 847, height: 90 },
                colSpan: 8,
                defaultElementType: 'HEADLINE',
              },
              {
                id: 'reg-02-lead',
                name: 'लीड स्टोरी (मुख्य समाचार)',
                bounds: { x: 42.52, y: 160, width: 550, height: 350 },
                colSpan: 5,
                defaultElementType: 'STORY',
              },
              {
                id: 'reg-03-side',
                name: 'साइड विज्ञापन (ASCI प्रमाणित)',
                bounds: { x: 605, y: 160, width: 285, height: 350 },
                colSpan: 3,
                defaultElementType: 'AD',
              },
            ],
      });
      setIsNewTemplate(true);
    }
    setValidationResult(null);
  };

  const handleValidateConfig = async () => {
    if (!editingTemplate) return;
    setValidating(true);
    try {
      const res = await apiClient.epaper.validateTemplate(editingTemplate);
      setValidationResult(res);
      if (res.valid) {
        showToast('टेम्पलेट सभी ज्यामितीय व संपादकीय मानकों पर खरा उतरा है!');
      }
    } catch (err: any) {
      alert(err.message || 'सत्यापन विफल रहा');
    } finally {
      setValidating(false);
    }
  };

  const handleSaveEditor = async (asActive: boolean = false) => {
    if (!editingTemplate) return;
    if (!editingTemplate.name?.trim() && !editingTemplate.nameHi?.trim()) {
      alert('टेम्पलेट का नाम (name) अनिवार्य है।');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<EpaperTemplateDoc> = {
        ...editingTemplate,
        status: asActive ? 'ACTIVE' : 'DRAFT',
      };

      await apiClient.epaper.saveTemplate(payload);
      showToast(asActive ? 'टेम्पलेट प्रकाशित किया गया!' : 'टेम्पलेट प्रारूप (Draft) सहेजा गया!');
      setEditingTemplate(null);
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || 'सहेजना विफल रहा');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRegion = () => {
    if (!editingTemplate) return;
    const currentRegions = editingTemplate.regions || [];
    const newIdx = currentRegions.length + 1;
    const newReg: EpaperTemplateRegion = {
      id: `reg-${Date.now().toString().slice(-4)}-story`,
      name: `नया क्षेत्र #${newIdx}`,
      bounds: { x: 42.52, y: 200, width: 300, height: 200 },
      colSpan: 4,
      defaultElementType: 'STORY',
    };
    setEditingTemplate({
      ...editingTemplate,
      regions: [...currentRegions, newReg],
    });
  };

  const handleRemoveRegion = (regId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      regions: (editingTemplate.regions || []).filter((r) => r.id !== regId),
    });
  };

  const handleUpdateRegion = (regId: string, updates: Partial<EpaperTemplateRegion>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      regions: (editingTemplate.regions || []).map((r) => (r.id === regId ? { ...r, ...updates } : r)),
    });
  };

  // --------------------------------------------------------------------------
  // AI ANALYSIS
  // --------------------------------------------------------------------------

  const handleRunAiAnalysis = async (tpl?: EpaperTemplateDoc) => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const targetElements = tpl
        ? tpl.regions.map((r) => ({
            id: r.id,
            elementType: r.defaultElementType,
            bounds: r.bounds,
            colSpan: r.colSpan,
          }))
        : currentPageElements || [];

      const result = await apiClient.epaper.analyzeTemplateLayout({
        elements: targetElements as any,
        pageId: tpl ? undefined : pageId,
      });
      setAnalysisResult(result);
      showToast('एआई लेआउट ज्यामितीय विश्लेषण पूर्ण हुआ!');
    } catch (err: any) {
      alert(err.message || 'एआई विश्लेषण विफल रहा');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* TRADITIONAL NEWSPAPER MASTHEAD BANNER */}
      <div className="bg-[#FAF8F5] border-2 border-slate-900 rounded-2xl p-6 shadow-sm">
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-700 text-white text-[11px] font-black uppercase tracking-widest rounded">
                Editorial Admin
              </span>
              <span className="text-xs text-slate-500 font-serif italic">
                Broadsheet Design System • 32.9 cm × 52 cm
              </span>
            </div>
            <h1 className="text-2xl font-serif font-black text-slate-950 tracking-tight">
              अखबार लेआउट व टेम्पलेट प्रबंधक (Template Manager)
            </h1>
            <p className="text-xs text-slate-700 font-medium">
              9 प्रामाणिक ब्रॉडशीट टेम्पलेट्स (32.9 cm × 52 cm), अपरिवर्तनीय संस्करण (OCC v1.0+), लाइफसाइकिल एवं ज्यामितीय पूर्वसत्यापन
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleRunAiAnalysis()}
              disabled={analyzing}
              className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>{analyzing ? 'विश्लेषण जारी...' : 'एआई ज्यामिति विश्लेषण'}</span>
            </button>

            <button
              onClick={() => handleOpenEditor()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>नया टेम्पलेट तैयार करें</span>
            </button>
          </div>
        </div>

        {/* Filters and Status Controls */}
        <div className="space-y-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 font-serif">स्थिति फ़िल्टर:</span>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatus(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeStatus === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="शीर्षक, आईडी अथवा कोड खोजें..."
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-red-700 text-white'
                    : 'bg-slate-200/70 text-slate-800 hover:bg-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AI Analysis Result Banner */}
      {analysisResult && (
        <div className="bg-purple-50/80 border border-purple-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-700 text-white rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-purple-950 font-serif">
                  एआई ज्यामितीय लेआउट विश्लेषण परिणाम
                </h3>
                <p className="text-xs text-purple-700">
                  संरचना: <span className="font-semibold">{analysisResult.structure}</span> | घनत्व:{' '}
                  <span className="font-semibold">{analysisResult.layoutDensity}</span> | मॉडल:{' '}
                  <span className="font-mono text-xs">{analysisResult.metadata?.model || 'bnw-mock-v1'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-purple-400 hover:text-purple-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-center">
              <span className="text-[11px] text-slate-500">कुल स्लॉट</span>
              <p className="text-base font-bold text-purple-900">{analysisResult.totalSlots}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-center">
              <span className="text-[11px] text-slate-500">समाचार स्लॉट</span>
              <p className="text-base font-bold text-blue-700">{analysisResult.storySlots}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-center">
              <span className="text-[11px] text-slate-500">विज्ञापन स्लॉट (ASCI)</span>
              <p className="text-base font-bold text-amber-600">{analysisResult.adSlots}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-center">
              <span className="text-[11px] text-slate-500">फोटो/इमेज स्लॉट</span>
              <p className="text-base font-bold text-emerald-600">{analysisResult.imageSlots || 0}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-center">
              <span className="text-[11px] text-slate-500">हेडलाइन/मास्टहेड</span>
              <p className="text-base font-bold text-slate-800">{analysisResult.headlineSlots}</p>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES BROADSHEET GALLERY */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-xs font-serif">
          ब्रॉडशीट टेम्पलेट्स लोड हो रहे हैं...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-300">
          <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 font-serif">कोई टेम्पलेट उपलब्ध नहीं है</p>
          <p className="text-xs text-slate-400 mt-1">फ़िल्टर बदलें अथवा नया टेम्पलेट तैयार करें</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => {
            const isArchived = tpl.status === 'ARCHIVED';
            const isDraft = tpl.status === 'DRAFT';

            return (
              <div
                key={tpl.id}
                className={`bg-white rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isArchived
                    ? 'border-slate-300 opacity-70 bg-slate-50'
                    : isDraft
                    ? 'border-amber-300'
                    : 'border-slate-800'
                }`}
              >
                {/* Broadsheet Card Header */}
                <div className="p-4 bg-[#FAF8F5] border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-mono font-bold rounded">
                        {tpl.templateCode || tpl.id}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded">
                        v{tpl.version || 1}.0
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isArchived ? (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <Archive className="w-3 h-3" /> अभिलेखागार
                      </span>
                    ) : isDraft ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <FileText className="w-3 h-3" /> प्रारूप (Draft)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" /> सक्रिय (Active)
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Broadsheet SVG Ratio Preview */}
                  <div
                    onClick={() => setPreviewTemplate(tpl)}
                    className="w-full h-56 bg-white rounded-xl border border-slate-300 p-2 cursor-pointer relative overflow-hidden flex items-center justify-center hover:border-slate-900 transition-colors shadow-inner"
                  >
                    <svg
                      viewBox="0 0 932.6 1474"
                      className="w-full h-full drop-shadow-sm"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Background page sheet */}
                      <rect x="0" y="0" width="932.6" height="1474" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
                      {/* Column grid lines */}
                      {Array.from({ length: tpl.gridColumns || 8 }).map((_, cIdx) => (
                        <line
                          key={cIdx}
                          x1={(932.6 / (tpl.gridColumns || 8)) * cIdx}
                          y1="0"
                          x2={(932.6 / (tpl.gridColumns || 8)) * cIdx}
                          y2="1474"
                          stroke="#E2E8F0"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      ))}
                      {/* Regions rendering */}
                      {(tpl.regions || []).map((reg) => {
                        let fill = '#F8FAFC';
                        let stroke = '#94A3B8';
                        if (reg.defaultElementType === 'MASTHEAD') {
                          fill = '#0F172A';
                          stroke = '#020617';
                        } else if (reg.defaultElementType === 'AD') {
                          fill = '#FEF3C7';
                          stroke = '#D97706';
                        } else if (reg.defaultElementType === 'IMAGE') {
                          fill = '#E0F2FE';
                          stroke = '#0284C7';
                        } else if (reg.defaultElementType === 'HEADLINE') {
                          fill = '#334155';
                          stroke = '#0F172A';
                        }
                        return (
                          <rect
                            key={reg.id}
                            x={reg.bounds.x}
                            y={reg.bounds.y}
                            width={reg.bounds.width}
                            height={reg.bounds.height}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth="2"
                            rx="3"
                          />
                        );
                      })}
                    </svg>

                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      <span className="px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-mono rounded">
                        {tpl.gridColumns || 8} Cols
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-mono rounded">
                        {tpl.regions?.length || 0} Regs
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <span className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> बड़ा पूर्वावलोकन
                      </span>
                    </div>
                  </div>

                  {/* Title and Descriptions */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-serif font-black text-slate-950 line-clamp-1">
                      {tpl.nameHi || tpl.name}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {tpl.description || 'प्रामाणिक ब्रॉडशीट टेम्पलेट'}
                    </p>
                  </div>

                  {/* Edition Usage & Tech Meta */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold flex items-center gap-1 text-slate-700">
                      <Newspaper className="w-3.5 h-3.5 text-blue-700" />
                      {tpl.usedByEditionsCount || 0} संस्करणों में प्रयुक्त
                    </span>
                    <span className="font-mono text-[10px]">
                      {tpl.isSystem ? 'सिस्टम' : 'कस्टम'}
                    </span>
                  </div>
                </div>

                {/* Broadsheet Action Buttons */}
                <div className="p-3 bg-[#FAF8F5] border-t border-slate-200 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-white rounded-lg text-xs font-bold cursor-pointer"
                      title="पूर्वावलोकन देखें"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditor(tpl)}
                      className="p-1.5 text-slate-700 hover:text-blue-800 hover:bg-white rounded-lg text-xs font-bold cursor-pointer"
                      title="कॉन्फ़िगरेशन संपादित करें"
                    >
                      <Sliders className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setDuplicateTarget(tpl);
                        setDuplicateName(`${tpl.name} (प्रतिलिपि)`);
                      }}
                      className="p-1.5 text-slate-700 hover:text-purple-800 hover:bg-white rounded-lg text-xs font-bold cursor-pointer"
                      title="टेम्पलेट की प्रतिलिपि (Duplicate) बनाएं"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenHistory(tpl)}
                      className="p-1.5 text-slate-700 hover:text-emerald-800 hover:bg-white rounded-lg text-xs font-bold cursor-pointer"
                      title="संस्करण इतिहास व रोलबैक"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isArchived ? (
                      <button
                        onClick={() => handleRestore(tpl)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" /> पुनर्स्थापित
                      </button>
                    ) : (
                      <>
                        {isDraft && (
                          <button
                            onClick={() => handlePublish(tpl)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Send className="w-3 h-3" /> प्रकाशित
                          </button>
                        )}
                        {!tpl.isSystem && (
                          <button
                            onClick={() => handleArchive(tpl)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded cursor-pointer"
                            title="अभिलेखागार में भेजें"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}

                    {onApplyTemplate && (
                      <button
                        onClick={() => onApplyTemplate(tpl)}
                        className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        लागू करें
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 1. BROADSCALE PHYSICAL NEWSPAPER PREVIEW MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border-2 border-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 bg-white border-b-2 border-slate-900 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-900 text-white text-xs font-mono font-bold rounded">
                    {previewTemplate.templateCode}
                  </span>
                  <h3 className="text-lg font-serif font-black text-slate-950">
                    {previewTemplate.nameHi || previewTemplate.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    (32.9 cm × 52 cm | {previewTemplate.gridColumns} Columns)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDummyText}
                    onChange={(e) => setShowDummyText(e.target.checked)}
                    className="rounded text-slate-900"
                  />
                  <span>देवनागरी डमी टेक्स्ट दिखाएं</span>
                </label>

                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-950 rounded-lg cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#F3F0EB]">
              {/* Scaled Newspaper SVG Viewport */}
              <div className="md:col-span-8 bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-lg flex items-center justify-center">
                <svg
                  viewBox="0 0 932.6 1474"
                  className="w-full max-h-[640px] drop-shadow-md select-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Paper sheet */}
                  <rect x="0" y="0" width="932.6" height="1474" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />

                  {/* Margins indicator */}
                  <rect
                    x="42.52"
                    y="56.69"
                    width={932.6 - 85.04}
                    height={1474 - 141.73}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />

                  {/* Columns */}
                  {Array.from({ length: previewTemplate.gridColumns || 8 }).map((_, cIdx) => (
                    <line
                      key={cIdx}
                      x1={42.52 + ((932.6 - 85.04) / (previewTemplate.gridColumns || 8)) * cIdx}
                      y1="56.69"
                      x2={42.52 + ((932.6 - 85.04) / (previewTemplate.gridColumns || 8)) * cIdx}
                      y2={1474 - 85.04}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Regions */}
                  {(previewTemplate.regions || []).map((reg) => {
                    const isSelected = selectedRegionId === reg.id;
                    let fill = '#FFFFFF';
                    let stroke = '#475569';
                    let labelColor = '#0F172A';

                    if (reg.defaultElementType === 'MASTHEAD') {
                      fill = '#0F172A';
                      stroke = '#020617';
                      labelColor = '#FFFFFF';
                    } else if (reg.defaultElementType === 'AD') {
                      fill = '#FEF3C7';
                      stroke = '#D97706';
                    } else if (reg.defaultElementType === 'IMAGE') {
                      fill = '#E0F2FE';
                      stroke = '#0284C7';
                    }

                    return (
                      <g
                        key={reg.id}
                        onClick={() => setSelectedRegionId(reg.id)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={reg.bounds.x}
                          y={reg.bounds.y}
                          width={reg.bounds.width}
                          height={reg.bounds.height}
                          fill={fill}
                          stroke={isSelected ? '#ED1727' : stroke}
                          strokeWidth={isSelected ? 4 : 2}
                          rx="3"
                        />
                        <text
                          x={reg.bounds.x + 8}
                          y={reg.bounds.y + 16}
                          fill={labelColor}
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {reg.name} ({reg.defaultElementType})
                        </text>

                        {showDummyText && reg.defaultElementType === 'STORY' && (
                          <text
                            x={reg.bounds.x + 8}
                            y={reg.bounds.y + 36}
                            fill="#64748B"
                            fontSize="9"
                            fontFamily="serif"
                          >
                            भोपाल। प्रदेश के विकास कार्यों को तीव्र गति से आगे बढ़ाया जा रहा है...
                          </text>
                        )}

                        {reg.defaultElementType === 'AD' && (
                          <rect
                            x={reg.bounds.x + reg.bounds.width - 75}
                            y={reg.bounds.y + 6}
                            width={65}
                            height={18}
                            fill="#ED1727"
                            rx="3"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Technical Region Inspector Panel */}
              <div className="md:col-span-4 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-2">
                  <h4 className="text-xs font-serif font-black text-slate-900 border-b border-slate-200 pb-1">
                    तकनीकी मापदंड (Broadsheet Specs)
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">भौतिक आकार:</span>
                      <span className="font-semibold">32.9 cm × 52.0 cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">कैनवास निर्देशांक:</span>
                      <span className="font-mono">932.6 pt × 1474.0 pt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">हाशिया (Margins):</span>
                      <span className="font-mono">L:15 R:15 T:20 B:30 mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">गटर (Gutter):</span>
                      <span className="font-mono">5 mm (14.17 pt)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">प्रिंट रिज़ॉल्यूशन:</span>
                      <span className="font-semibold text-emerald-700">300 DPI Prepress</span>
                    </div>
                  </div>
                </div>

                {/* Regions List */}
                <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h4 className="text-xs font-serif font-black text-slate-900">
                      क्षेत्र विवरण ({previewTemplate.regions?.length || 0})
                    </h4>
                    <span className="text-[10px] text-slate-400">क्लिक कर हाइलाइट करें</span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {(previewTemplate.regions || []).map((reg) => (
                      <div
                        key={reg.id}
                        onClick={() => setSelectedRegionId(reg.id)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          selectedRegionId === reg.id
                            ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{reg.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {reg.colSpan} cols
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          X:{Math.round(reg.bounds.x)} Y:{Math.round(reg.bounds.y)} W:{Math.round(reg.bounds.width)} H:{Math.round(reg.bounds.height)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. TEMPLATE CONFIGURATION EDITOR MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border-2 border-slate-900 shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-[#FAF8F5] border-b-2 border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-black text-slate-950">
                  {isNewTemplate ? 'नया ब्रॉडशीट टेम्पलेट कॉन्फ़िगर करें' : `टेम्पलेट संपादन: ${editingTemplate.nameHi || editingTemplate.name}`}
                </h3>
                <p className="text-xs text-slate-500">
                  पृष्ठ आयाम, कॉलम संरचना, मार्जिन एवं सामग्री क्षेत्रों का प्रबंधन
                </p>
              </div>

              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1.5 text-slate-500 hover:text-slate-950 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editor Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    टेम्पलेट का नाम (Name in English):
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="e.g. Front Page Lead & Anchor"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    टेम्पलेट का हिंदी नाम:
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.nameHi || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, nameHi: e.target.value })}
                    placeholder="उदा. प्रथम पृष्ठ — मुख्य समाचार व एंकर"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">श्रेणी (Category):</label>
                  <select
                    value={editingTemplate.category || 'CUSTOM'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="FRONT_PAGE">प्रथम पृष्ठ (FRONT_PAGE)</option>
                    <option value="DISTRICT_FOCUS">ज़िला विशेष (DISTRICT_FOCUS)</option>
                    <option value="STATE">मध्य प्रदेश प्रादेशिक (STATE)</option>
                    <option value="POLITICAL">राजनीति (POLITICAL)</option>
                    <option value="BUSINESS">व्यापार व कृषि (BUSINESS)</option>
                    <option value="EDUCATION">शिक्षा व करियर (EDUCATION)</option>
                    <option value="SPORTS">खेल जगत (SPORTS)</option>
                    <option value="EDITORIAL">संपादकीय व विचार (EDITORIAL)</option>
                    <option value="SPECIAL">विशेषांक परिशिष्ट (SPECIAL)</option>
                    <option value="CUSTOM">कस्टम (CUSTOM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">ग्रिड कॉलम संख्या:</label>
                  <select
                    value={editingTemplate.gridColumns || 8}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, gridColumns: Number(e.target.value) as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                    <option value={5}>5 Columns</option>
                    <option value={6}>6 Columns (संपादकीय मानक)</option>
                    <option value={8}>8 Columns (मानक ब्रॉडशीट)</option>
                  </select>
                </div>
              </div>

              {/* Margins & Gutters */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-serif font-black text-slate-900">
                  हाशिया व गटर सेटिंग्स (Margins & Gutter)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">बायां (Left pt):</label>
                    <input
                      type="number"
                      value={editingTemplate.margins?.left || 42.52}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          margins: { ...(editingTemplate.margins || { left: 42.52, right: 42.52, top: 56.69, bottom: 85.04 }), left: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">दायां (Right pt):</label>
                    <input
                      type="number"
                      value={editingTemplate.margins?.right || 42.52}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          margins: { ...(editingTemplate.margins || { left: 42.52, right: 42.52, top: 56.69, bottom: 85.04 }), right: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">शीर्ष (Top pt):</label>
                    <input
                      type="number"
                      value={editingTemplate.margins?.top || 56.69}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          margins: { ...(editingTemplate.margins || { left: 42.52, right: 42.52, top: 56.69, bottom: 85.04 }), top: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">निचला (Bottom pt):</label>
                    <input
                      type="number"
                      value={editingTemplate.margins?.bottom || 85.04}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          margins: { ...(editingTemplate.margins || { left: 42.52, right: 42.52, top: 56.69, bottom: 85.04 }), bottom: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">गटर (Gutter pt):</label>
                    <input
                      type="number"
                      value={editingTemplate.gutter || 14.17}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, gutter: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Pre-configured Regions Manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-serif font-black text-slate-900">
                    सामग्री क्षेत्र विन्यास (Regions: {editingTemplate.regions?.length || 0})
                  </h4>
                  <button
                    onClick={handleAddRegion}
                    className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> नया क्षेत्र जोड़ें
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(editingTemplate.regions || []).map((reg) => (
                    <div
                      key={reg.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={reg.name}
                          onChange={(e) => handleUpdateRegion(reg.id, { name: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs font-semibold"
                          placeholder="क्षेत्र का नाम"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <select
                          value={reg.defaultElementType}
                          onChange={(e) => handleUpdateRegion(reg.id, { defaultElementType: e.target.value as EpaperElementType })}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                        >
                          <option value="STORY">STORY (समाचार)</option>
                          <option value="HEADLINE">HEADLINE (हेडलाइन)</option>
                          <option value="IMAGE">IMAGE (फोटो)</option>
                          <option value="AD">AD (विज्ञापन)</option>
                          <option value="MASTHEAD">MASTHEAD (मास्टहेड)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-4 flex items-center gap-1">
                        <input
                          type="number"
                          value={Math.round(reg.bounds.x)}
                          onChange={(e) => handleUpdateRegion(reg.id, { bounds: { ...reg.bounds, x: Number(e.target.value) } })}
                          className="w-12 px-1 py-1 border border-slate-300 rounded text-[11px] font-mono"
                          title="X coordinate"
                        />
                        <input
                          type="number"
                          value={Math.round(reg.bounds.y)}
                          onChange={(e) => handleUpdateRegion(reg.id, { bounds: { ...reg.bounds, y: Number(e.target.value) } })}
                          className="w-12 px-1 py-1 border border-slate-300 rounded text-[11px] font-mono"
                          title="Y coordinate"
                        />
                        <input
                          type="number"
                          value={Math.round(reg.bounds.width)}
                          onChange={(e) => handleUpdateRegion(reg.id, { bounds: { ...reg.bounds, width: Number(e.target.value) } })}
                          className="w-12 px-1 py-1 border border-slate-300 rounded text-[11px] font-mono"
                          title="Width"
                        />
                        <input
                          type="number"
                          value={Math.round(reg.bounds.height)}
                          onChange={(e) => handleUpdateRegion(reg.id, { bounds: { ...reg.bounds, height: Number(e.target.value) } })}
                          className="w-12 px-1 py-1 border border-slate-300 rounded text-[11px] font-mono"
                          title="Height"
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button
                          onClick={() => handleRemoveRegion(reg.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          title="क्षेत्र हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Results Display */}
              {validationResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    validationResult.valid
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold font-serif">
                    {validationResult.valid ? (
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-700" />
                    )}
                    <span>
                      {validationResult.valid
                        ? 'टेम्पलेट मान्य (Validation Succeeded)'
                        : 'सत्यापन त्रुटियां पाई गईं (Validation Errors)'}
                    </span>
                  </div>

                  {validationResult.errors.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 text-rose-800 text-[11px]">
                      {validationResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 text-amber-800 text-[11px]">
                      {validationResult.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Editor Footer */}
            <div className="p-4 bg-[#FAF8F5] border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={handleValidateConfig}
                disabled={validating}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <span>{validating ? 'सत्यापन जारी...' : 'पूर्वसत्यापन (Validate)'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  रद्द करें
                </button>

                <button
                  onClick={() => handleSaveEditor(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>प्रारूप (Draft) सहेजें</span>
                </button>

                <button
                  onClick={() => handleSaveEditor(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>सत्यापित कर प्रकाशित करें</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. VERSION HISTORY, DIFF & ROLLBACK MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {historyTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-slate-900 shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-[#FAF8F5] border-b-2 border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-black text-slate-950">
                  संस्करण इतिहास व अपरिवर्तनीय स्नैपशॉट (v1.0+)
                </h3>
                <p className="text-xs text-slate-500">
                  टेम्पलेट: <span className="font-bold">{historyTemplate.nameHi || historyTemplate.name}</span> (वर्तमान v{historyTemplate.version})
                </p>
              </div>

              <button
                onClick={() => setHistoryTemplate(null)}
                className="p-1.5 text-slate-500 hover:text-slate-950 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {loadingHistory ? (
                <div className="p-12 text-center text-xs text-slate-500">इतिहास लोड हो रहा है...</div>
              ) : versionHistory.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 font-serif">कोई पूर्व संस्करण उपलब्ध नहीं है</p>
                  <p className="text-[11px] text-slate-500 mt-1">यह टेम्पलेट अपने मूल प्रकाशित संस्करण (v1.0) पर स्थित है।</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versionHistory.map((h, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-bold rounded">
                            v{h.version}.0
                          </span>
                          <span className="font-semibold text-slate-800">{h.changeSummary}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          संपादक: <span className="font-medium text-slate-700">{h.changedBy?.name || 'प्रशासक'}</span> | दिनांक: {new Date(h.changedAt).toLocaleString('hi-IN')}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRollback(h.version)}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> इस संस्करण पर रोलबैक करें
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. DUPLICATE TEMPLATE MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {duplicateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border-2 border-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-serif font-black text-slate-950">
                टेम्पलेट की प्रतिलिपि (Clone) बनाएं
              </h3>
              <button
                onClick={() => setDuplicateTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  नए टेम्पलेट का नाम:
                </label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="उदा. Front Page Alternate"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                नया टेम्पलेट एक अद्वितीय ID के साथ "DRAFT" स्थिति में तैयार होगा जिसे आप स्वतंत्र रूप से संपादित कर सकते हैं।
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setDuplicateTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {duplicating ? 'क्लोन हो रहा है...' : 'प्रतिलिपि बनाएं'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
