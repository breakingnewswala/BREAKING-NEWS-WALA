import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  EpaperHeaderTemplateDoc,
  EpaperHeaderElement,
  AppRole,
} from '../../types';
import { DEFAULT_HEADER_TEMPLATES } from '../../data/defaultHeaderTemplates';
import { apiClient } from '../../services/apiClient';
import {
  Newspaper,
  Layout,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Edit3,
  Eye,
  Sliders,
  Type,
  Maximize2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  Shield,
  Layers,
  ArrowUp,
  ArrowDown,
  Palette,
  Settings,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

export interface EpaperHeaderTemplateManagerProps {
  currentRole?: AppRole | string;
  onSelectHeaderForPage?: (template: EpaperHeaderTemplateDoc) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const EpaperHeaderTemplateManager: React.FC<EpaperHeaderTemplateManagerProps> = ({
  currentRole = 'MASTER_ADMIN',
  onSelectHeaderForPage,
  isModal = false,
  onClose,
}) => {
  const isMasterOrAdmin =
    ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(String(currentRole).toUpperCase()) ||
    String(currentRole).toUpperCase().includes('ADMIN');

  const [templates, setTemplates] = useState<EpaperHeaderTemplateDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [activeTemplate, setActiveTemplate] = useState<EpaperHeaderTemplateDoc | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const dragRef = useRef<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);

  const handleElementPointerDown = (e: React.PointerEvent, el: EpaperHeaderElement) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    dragRef.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      elX: el.x,
      elY: el.y,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !activeTemplate) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.max(0, Math.min(848 - 20, Math.round(dragRef.current.elX + dx)));
    const newY = Math.max(0, Math.min((activeTemplate.heightPt || 100) - 10, Math.round(dragRef.current.elY + dy)));

    setActiveTemplate((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        elements: prev.elements.map((item) =>
          item.id === dragRef.current?.id ? { ...item, x: newX, y: newY } : item
        ),
      };
    });
  };

  const handleCanvasPointerUp = () => {
    dragRef.current = null;
  };

  // Duplicate / Rename State
  const [duplicateModalTarget, setDuplicateModalTarget] = useState<EpaperHeaderTemplateDoc | null>(null);
  const [duplicateName, setDuplicateName] = useState<string>('');

  // Load Templates from Database / Fallback to Defaults
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const fetched = await apiClient.epaper.getHeaderTemplates();
      if (fetched && fetched.length > 0) {
        setTemplates(fetched);
      } else {
        setTemplates(DEFAULT_HEADER_TEMPLATES);
      }
    } catch (_err) {
      setTemplates(DEFAULT_HEADER_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchType = typeFilter === 'all' || tpl.type === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        (tpl.nameHi && tpl.nameHi.toLowerCase().includes(q)) ||
        (tpl.description && tpl.description.toLowerCase().includes(q));
      return matchType && matchQuery;
    });
  }, [templates, typeFilter, searchQuery]);

  // Open Designer for New Template
  const handleCreateNew = () => {
    const newId = `hdr-custom-${Date.now()}`;
    const newTpl: EpaperHeaderTemplateDoc = {
      id: newId,
      name: 'Custom Newspaper Header',
      nameHi: 'नया कस्टम अखबार मास्टहेड',
      type: 'CUSTOM',
      description: 'मास्टर एडमिन द्वारा निर्मित विशेष कस्टम मास्टहेड',
      heightPt: 100,
      backgroundColor: '#FFFFFF',
      borderColor: '#0F172A',
      hasTricolorRibbon: true,
      isDefault: false,
      isActive: true,
      version: 1,
      createdBy: 'master-admin',
      createdByName: 'मास्टर एडमिन',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: [
        {
          id: `el-logo-${Date.now()}`,
          type: 'LOGO',
          label: 'लोगो प्रतीक (ब)',
          x: 16,
          y: 12,
          width: 52,
          height: 52,
          backgroundColor: '#ED1727',
          color: '#FFFFFF',
          text: 'ब',
          fontSize: 32,
          fontWeight: '900',
          textAlign: 'center',
          zIndex: 2,
        },
        {
          id: `el-title-${Date.now()}`,
          type: 'NEWSPAPER_NAME',
          label: 'अखबार नाम',
          text: 'ब्रेकिंग न्यूज़ वाला',
          x: 76,
          y: 12,
          width: 480,
          height: 44,
          fontSize: 38,
          fontFamily: '"Rozha One", "Noto Sans Devanagari", serif',
          fontWeight: '900',
          color: '#0F172A',
          textAlign: 'left',
          zIndex: 2,
        },
        {
          id: `el-tagline-${Date.now()}`,
          type: 'TAGLINE',
          label: 'टैगलाइन',
          text: 'मध्य प्रदेश का सबसे विश्वसनीय एवं निर्भीक डिजिटल दैनिक • 55 जिलों की धड़कन',
          x: 78,
          y: 56,
          width: 580,
          height: 18,
          fontSize: 11,
          fontFamily: '"Noto Sans Devanagari", sans-serif',
          fontWeight: '700',
          color: '#ED1727',
          textAlign: 'left',
          zIndex: 2,
        },
        {
          id: `el-date-${Date.now()}`,
          type: 'DATE',
          label: 'दिनांक व मूल्य',
          text: 'भोपाल | 22 नवम्बर 2026 | मूल्य: ₹4.00',
          x: 520,
          y: 16,
          width: 315,
          height: 22,
          fontSize: 11,
          fontWeight: '700',
          color: '#1E293B',
          textAlign: 'right',
          zIndex: 2,
        },
        {
          id: `el-div-${Date.now()}`,
          type: 'DIVIDER',
          label: 'विभाजक रेखा',
          x: 0,
          y: 96,
          width: 848,
          height: 2,
          backgroundColor: '#0F172A',
          zIndex: 1,
        },
      ],
    };
    setActiveTemplate(newTpl);
    setSelectedElementId(newTpl.elements[1].id);
    setIsEditorOpen(true);
  };

  // Open Designer for Existing Template
  const handleEditTemplate = (tpl: EpaperHeaderTemplateDoc) => {
    setActiveTemplate(JSON.parse(JSON.stringify(tpl)));
    setSelectedElementId(tpl.elements[0]?.id || null);
    setIsEditorOpen(true);
  };

  // Save Active Template to Database
  const handleSaveActiveTemplate = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    try {
      const saved = await apiClient.epaper.saveHeaderTemplate(activeTemplate);
      showToast(`हेडर टेम्पलेट "${saved.nameHi || saved.name}" डेटाबेस में स्थायी रूप से सहेजा गया!`, 'success');
      setIsEditorOpen(false);
      loadTemplates();
    } catch (err: any) {
      showToast(err.message || 'हेडर टेम्पलेट सहेजने में त्रुटि!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate Template
  const handleDuplicateConfirm = async () => {
    if (!duplicateModalTarget) return;
    try {
      const dup = await apiClient.epaper.duplicateHeaderTemplate(duplicateModalTarget.id, duplicateName.trim());
      showToast(`हेडर टेम्पलेट की प्रतिलिपि "${dup.nameHi || dup.name}" तैयार की गई!`, 'success');
      setDuplicateModalTarget(null);
      setDuplicateName('');
      loadTemplates();
    } catch (err: any) {
      showToast(err.message || 'प्रतिलिपि बनाने में त्रुटि!', 'error');
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (tpl: EpaperHeaderTemplateDoc) => {
    try {
      const updated = await apiClient.epaper.activateHeaderTemplate(tpl.id);
      showToast(`हेडर टेम्पलेट स्थिति: ${updated.isActive ? 'सक्रिय (Active)' : 'निष्क्रिय (Inactive)'}`, 'success');
      loadTemplates();
    } catch (err: any) {
      showToast(err.message || 'स्थिति बदलने में त्रुटि!', 'error');
    }
  };

  // Delete Template
  const handleDelete = async (tpl: EpaperHeaderTemplateDoc) => {
    if (['hdr-classic-01', 'hdr-modern-02', 'hdr-minimal-03'].includes(tpl.id)) {
      alert('यह मुख्य सिस्टम हेडर टेम्पलेट है। इसे निष्क्रिय किया जा सकता है, पूर्णतः विलोपित नहीं।');
      return;
    }
    if (!window.confirm(`क्या आप वाकई हेडर टेम्पलेट "${tpl.nameHi || tpl.name}" को विलोपित करना चाहते हैं?`)) {
      return;
    }
    try {
      await apiClient.epaper.deleteHeaderTemplate(tpl.id);
      showToast('हेडर टेम्पलेट सफलतापूर्वक विलोपित किया गया।', 'success');
      loadTemplates();
    } catch (err: any) {
      showToast(err.message || 'विलोपन में त्रुटि!', 'error');
    }
  };

  // Set as Default
  const handleSetDefault = async (tpl: EpaperHeaderTemplateDoc) => {
    try {
      const updated = await apiClient.epaper.saveHeaderTemplate({ ...tpl, isDefault: true });
      showToast(`"${updated.nameHi || updated.name}" को सभी संस्करणों का डिफ़ॉल्ट हेडर बनाया गया।`, 'success');
      loadTemplates();
    } catch (err: any) {
      showToast(err.message || 'डिफ़ॉल्ट सेट करने में त्रुटि!', 'error');
    }
  };

  // Selected element in active editor
  const selectedElement = useMemo(() => {
    if (!activeTemplate || !selectedElementId) return null;
    return activeTemplate.elements.find((el) => el.id === selectedElementId) || null;
  }, [activeTemplate, selectedElementId]);

  // Update selected element property
  const updateSelectedElement = (updates: Partial<EpaperHeaderElement>) => {
    if (!activeTemplate || !selectedElementId) return;
    setActiveTemplate({
      ...activeTemplate,
      elements: activeTemplate.elements.map((el) =>
        el.id === selectedElementId ? { ...el, ...updates } : el
      ),
    });
  };

  // Add new element to active header
  const handleAddHeaderElement = (type: EpaperHeaderElement['type']) => {
    if (!activeTemplate) return;
    const newId = `el-hdr-${Date.now()}`;
    const defaultLabels: Record<string, string> = {
      NEWSPAPER_NAME: 'समाचार पत्र का नाम',
      LOGO: 'लोगो प्रतीक',
      EDITION_NAME: 'संस्करण नाम',
      DATE: 'दिनांक व मूल्य',
      DAY: 'दिन व पंचांग',
      PAGE_NUMBER: 'पृष्ठ संख्या',
      TAGLINE: 'ध्येय वाक्य / टैगलाइन',
      REGISTRATION: 'पंजीकरण (RNI)',
      WEBSITE: 'वेबसाइट',
      CONTACT: 'संपर्क व ईमेल',
      DIVIDER: 'विभाजक रेखा',
      DECORATIVE: 'सजावटी पट्टी',
      CUSTOM_TEXT: 'कस्टम टेक्स्ट ब्लॉक',
    };

    const newEl: EpaperHeaderElement = {
      id: newId,
      type,
      label: defaultLabels[type] || 'हेडर तत्व',
      text: type === 'DIVIDER' ? undefined : defaultLabels[type],
      x: 20 + ((activeTemplate.elements.length * 15) % 200),
      y: 20 + ((activeTemplate.elements.length * 10) % 50),
      width: type === 'DIVIDER' ? 848 : type === 'LOGO' ? 48 : 240,
      height: type === 'DIVIDER' ? 2 : type === 'LOGO' ? 48 : 28,
      fontSize: type === 'NEWSPAPER_NAME' ? 36 : 11,
      fontFamily: type === 'NEWSPAPER_NAME' ? '"Rozha One", serif' : '"Noto Sans Devanagari", sans-serif',
      fontWeight: '700',
      color: type === 'TAGLINE' ? '#ED1727' : '#0F172A',
      backgroundColor: type === 'DIVIDER' ? '#0F172A' : type === 'LOGO' ? '#ED1727' : 'transparent',
      textAlign: 'left',
      zIndex: activeTemplate.elements.length + 1,
    };

    setActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, newEl],
    });
    setSelectedElementId(newId);
  };

  // Delete Element from active header
  const handleDeleteHeaderElement = (elId: string) => {
    if (!activeTemplate) return;
    setActiveTemplate({
      ...activeTemplate,
      elements: activeTemplate.elements.filter((el) => el.id !== elId),
    });
    if (selectedElementId === elId) {
      setSelectedElementId(activeTemplate.elements.find((el) => el.id !== elId)?.id || null);
    }
  };

  // Duplicate Element
  const handleDuplicateHeaderElement = (elId: string) => {
    if (!activeTemplate) return;
    const target = activeTemplate.elements.find((el) => el.id === elId);
    if (!target) return;
    const dup: EpaperHeaderElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: `el-hdr-${Date.now()}`,
      x: target.x + 10,
      y: target.y + 10,
      zIndex: activeTemplate.elements.length + 1,
    };
    setActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, dup],
    });
    setSelectedElementId(dup.id);
  };

  // Reorder Element Z-Index
  const handleReorderHeaderElement = (elId: string, direction: 'UP' | 'DOWN') => {
    if (!activeTemplate) return;
    const index = activeTemplate.elements.findIndex((el) => el.id === elId);
    if (index < 0) return;
    const targetIndex = direction === 'UP' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= activeTemplate.elements.length) return;

    const list = [...activeTemplate.elements];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setActiveTemplate({
      ...activeTemplate,
      elements: list.map((el, i) => ({ ...el, zIndex: i + 1 })),
    });
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 text-slate-800 ${isModal ? 'p-0' : 'p-6'}`}>
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold shadow-xl flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 border-emerald-600 text-emerald-100'
                : 'bg-red-900 border-red-600 text-red-100'
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

      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-xs">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  मास्टर एडमिन हेडर टेम्पलेट प्रबंधक (Header Template Manager)
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Master Admin Protected</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ई-पेपर के प्रथम पृष्ठ एवं अंदरूनी पेजों हेतु बहु-शैली मास्टहेड डिज़ाइन, स्थायी डेटाबेस संधारण व संस्करण विन्यास।
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTemplates}
            disabled={loading}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="रिफ्रेश करें"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isMasterOrAdmin && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ring-2 ring-red-500/20 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>नया हेडर टेम्पलेट बनाएं</span>
            </button>
          )}

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Role Restriction Banner if user is not Master Admin */}
      {!isMasterOrAdmin && (
        <div className="m-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-sm">केवल पठन अधिकार (Read-Only Mode)</span>
            <span>
              हेडर टेम्पलेट निर्माण एवं वैश्विक सेटिंग्स संशोधन का अधिकार केवल मास्टर एडमिन (Master Admin) को प्राप्त है। आप मौजूदा स्वीकृत टेम्पलेट्स का पूर्वावलोकन एवं अपने पृष्ठ पर चयन कर सकते हैं।
            </span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'सभी हेडर (All)' },
            { id: 'CLASSIC', label: 'पारंपरिक (Classic)' },
            { id: 'MODERN', label: 'आधुनिक (Modern)' },
            { id: 'MINIMAL', label: 'न्यूनतम (Minimal)' },
            { id: 'BOLD', label: 'बोल्ड न्यूज़ (Bold)' },
            { id: 'SPECIAL', label: 'विशेषांक (Special)' },
            { id: 'CUSTOM', label: 'कस्टम (Custom)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                typeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="हेडर टेम्पलेट खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
            <span className="text-xs font-bold">हेडर टेम्पलेट लाइब्रेरी लोड हो रही है...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
            <Layout className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold">कोई हेडर टेम्पलेट नहीं मिला।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Live Header Render Preview Box */}
                <div
                  style={{
                    backgroundColor: tpl.backgroundColor || '#FFFFFF',
                    borderColor: tpl.borderColor || '#0F172A',
                    minHeight: `${Math.max(60, tpl.heightPt * 0.9)}px`,
                  }}
                  className="relative p-4 border-b border-slate-200 flex flex-col justify-between overflow-hidden select-none"
                >
                  {/* Tricolor Ribbon if enabled */}
                  {tpl.hasTricolorRibbon && (
                    <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                      <div className="w-1/3 bg-[#ED1727]" />
                      <div className="w-1/3 bg-[#FDE900]" />
                      <div className="w-1/3 bg-[#344FD6]" />
                    </div>
                  )}

                  {/* Render Visual Preview Elements */}
                  <div className="relative w-full h-full min-h-[70px]">
                    {tpl.elements.map((el) => {
                      if (el.type === 'DIVIDER') {
                        return (
                          <div
                            key={el.id}
                            style={{
                              backgroundColor: el.backgroundColor || '#0F172A',
                              height: `${el.height || 2}px`,
                              top: `${el.y * 0.75}px`,
                              left: 0,
                              right: 0,
                            }}
                            className="absolute"
                          />
                        );
                      }

                      return (
                        <div
                          key={el.id}
                          style={{
                            left: `${(el.x / 848) * 100}%`,
                            top: `${el.y * 0.75}px`,
                            width: `${(el.width / 848) * 100}%`,
                            color: el.color || '#0F172A',
                            backgroundColor: el.backgroundColor || 'transparent',
                            fontSize: `${Math.max(8, (el.fontSize || 12) * 0.75)}px`,
                            fontFamily: el.fontFamily || 'sans-serif',
                            fontWeight: el.fontWeight || 'normal',
                            textAlign: el.textAlign || 'left',
                            zIndex: el.zIndex || 1,
                          }}
                          className={`absolute truncate px-1 rounded-sm ${
                            el.type === 'LOGO'
                              ? 'flex items-center justify-center font-black rounded-lg shadow-2xs'
                              : ''
                          }`}
                        >
                          {el.text || el.label}
                        </div>
                      );
                    })}
                  </div>

                  {/* Badges on Top Right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {tpl.isDefault && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-xs">
                        ★ ग्लोबल डिफ़ॉल्ट
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        tpl.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tpl.isActive ? 'सक्रिय' : 'निष्क्रिय'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-800/80 text-white text-[9px] font-mono rounded">
                      v{tpl.version || 1}
                    </span>
                  </div>
                </div>

                {/* Card Info & Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        {tpl.nameHi || tpl.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">
                        {tpl.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {tpl.description || 'विशेष ब्रॉडशीट मास्टहेड टेम्पलेट'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                      <span>ऊंचाई: {tpl.heightPt} pt</span>
                      <span>•</span>
                      <span>तत्व: {tpl.elements?.length || 0}</span>
                      <span>•</span>
                      <span>ID: {tpl.id}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      {onSelectHeaderForPage && (
                        <button
                          onClick={() => onSelectHeaderForPage(tpl)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>पेज पर लागू करें</span>
                        </button>
                      )}

                      {!tpl.isDefault && isMasterOrAdmin && (
                        <button
                          onClick={() => handleSetDefault(tpl)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          title="इस हेडर को सभी 12 पेजों के लिए डिफ़ॉल्ट बनाएं"
                        >
                          डिफ़ॉल्ट बनाएं
                        </button>
                      )}

                      {isMasterOrAdmin && (
                        <button
                          onClick={() => handleToggleActive(tpl)}
                          className="px-2 py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-medium"
                        >
                          {tpl.isActive ? 'निष्क्रिय करें' : 'सक्रिय करें'}
                        </button>
                      )}
                    </div>

                    {isMasterOrAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setDuplicateModalTarget(tpl);
                            setDuplicateName(`${tpl.name} (प्रतिलिपि)`);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="प्रतिलिपि बनाएं (Duplicate)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(tpl)}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="हेडर डिज़ाइनर में संपादित करें (Edit in Studio)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tpl)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="विलोपित करें (Delete)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duplicate Modal */}
      {duplicateModalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Copy className="w-4 h-4 text-blue-600" />
              <span>हेडर टेम्पलेट की प्रतिलिपि (Duplicate Header)</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                नई प्रतिलिपि का नाम दर्ज करें:
              </label>
              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="उदा. Election Special Header"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDuplicateModalTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleDuplicateConfirm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                प्रतिलिपि सहेजें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FULL-SCREEN VISUAL HEADER DESIGNER STUDIO MODAL (PART 4.3)
         ===================================================================== */}
      {isEditorOpen && activeTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col overflow-hidden">
          {/* Studio Top Control Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-red-600 rounded-lg">
                <Newspaper className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeTemplate.nameHi || activeTemplate.name}
                    onChange={(e) =>
                      setActiveTemplate({ ...activeTemplate, nameHi: e.target.value })
                    }
                    className="text-sm font-black text-white bg-transparent border-b border-dashed border-slate-600 hover:border-white focus:border-red-500 focus:outline-hidden px-1"
                  />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    ID: {activeTemplate.id}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  मास्टर एडमिन हेडर स्टूडियो • 848 pt मानक ब्रॉडशीट चौड़ाई
                </span>
              </div>
            </div>

            {/* Global Settings in Top Bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400 font-bold">हेडर ऊंचाई:</span>
                <input
                  type="number"
                  min="40"
                  max="160"
                  value={activeTemplate.heightPt}
                  onChange={(e) =>
                    setActiveTemplate({
                      ...activeTemplate,
                      heightPt: Math.max(40, Math.min(160, parseInt(e.target.value, 10) || 100)),
                    })
                  }
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-center font-bold text-white"
                />
                <span className="text-slate-500">pt</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-bold">पृष्ठभूमि:</span>
                <input
                  type="color"
                  value={activeTemplate.backgroundColor || '#FFFFFF'}
                  onChange={(e) =>
                    setActiveTemplate({ ...activeTemplate, backgroundColor: e.target.value })
                  }
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-300 font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeTemplate.hasTricolorRibbon}
                  onChange={(e) =>
                    setActiveTemplate({ ...activeTemplate, hasTricolorRibbon: e.target.checked })
                  }
                  className="rounded text-red-600 focus:ring-0"
                />
                <span>तिरंगा रिबन</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-300 font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeTemplate.isDefault || false}
                  onChange={(e) =>
                    setActiveTemplate({ ...activeTemplate, isDefault: e.target.checked })
                  }
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>ग्लोबल डिफ़ॉल्ट</span>
              </label>

              <button
                onClick={handleSaveActiveTemplate}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'सहेजा जा रहा है...' : 'डेटाबेस में सहेजें'}</span>
              </button>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Studio Body: Left Elements Adder, Center Canvas Stage, Right Inspector */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Elements Adder Palette */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col shrink-0 overflow-y-auto space-y-4">
              <span className="text-xs font-black text-slate-300 tracking-wider uppercase">
                तत्व जोड़ें (Add Element)
              </span>

              <div className="space-y-1.5 text-xs font-bold">
                {[
                  { type: 'NEWSPAPER_NAME', label: 'अखबार का नाम', icon: '📰' },
                  { type: 'LOGO', label: 'लोगो प्रतीक (ब)', icon: '🔴' },
                  { type: 'TAGLINE', label: 'ध्येय वाक्य / टैगलाइन', icon: '✍️' },
                  { type: 'EDITION_NAME', label: 'संस्करण नाम', icon: '📍' },
                  { type: 'DATE', label: 'दिनांक व मूल्य', icon: '📅' },
                  { type: 'PAGE_NUMBER', label: 'पृष्ठ संख्या', icon: '📄' },
                  { type: 'REGISTRATION', label: 'RNI / पंजीयन', icon: '📜' },
                  { type: 'WEBSITE', label: 'वेबसाइट URL', icon: '🌐' },
                  { type: 'CONTACT', label: 'संपर्क / ईमेल', icon: '📞' },
                  { type: 'DIVIDER', label: 'विभाजक रेखा', icon: '➖' },
                  { type: 'DECORATIVE', label: 'सजावटी बैज', icon: '⭐' },
                  { type: 'CUSTOM_TEXT', label: 'कस्टम टेक्स्ट', icon: '📝' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleAddHeaderElement(item.type as any)}
                    className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all flex items-center gap-2 border border-slate-700/60 cursor-pointer shadow-2xs hover:scale-[1.01]"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Elements Layer Stack */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-black text-slate-400 uppercase">
                  लेयर्स सूची ({activeTemplate.elements.length})
                </span>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {activeTemplate.elements.map((el, i) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                        el.id === selectedElementId
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="truncate max-w-[140px]">{el.label || el.type}</span>
                      <div className="flex items-center gap-1 opacity-80">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderHeaderElement(el.id, 'UP');
                          }}
                          className="hover:text-white"
                          title="ऊपर लाएं"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderHeaderElement(el.id, 'DOWN');
                          }}
                          className="hover:text-white"
                          title="नीचे भेजें"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Live Interactive Broadsheet Header Stage */}
            <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 overflow-auto relative">
              <div className="text-[11px] font-bold text-slate-400 mb-3 flex items-center gap-2">
                <span>लाइव हेडर विन्यास पूर्वावलोकन (चौड़ाई: 848 pt)</span>
                <span>•</span>
                <span className="text-blue-400">एलिमेंट पर क्लिक करके स्थिति व गुण बदलें</span>
              </div>

              {/* Scaled Header Canvas Box */}
              <div
                style={{
                  width: '848px',
                  height: `${activeTemplate.heightPt}px`,
                  backgroundColor: activeTemplate.backgroundColor || '#FFFFFF',
                  borderColor: activeTemplate.borderColor || '#0F172A',
                }}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerLeave={handleCanvasPointerUp}
                className="relative rounded-sm shadow-2xl border transition-all overflow-hidden select-none cursor-default"
              >
                {/* Tricolor Ribbon on Top */}
                {activeTemplate.hasTricolorRibbon && (
                  <div className="absolute top-0 left-0 right-0 h-1 flex z-10">
                    <div className="w-1/3 bg-[#ED1727]" />
                    <div className="w-1/3 bg-[#FDE900]" />
                    <div className="w-1/3 bg-[#344FD6]" />
                  </div>
                )}

                {/* Render Each Header Element as Interactive Draggable Block */}
                {activeTemplate.elements.map((el) => {
                  const isSelected = el.id === selectedElementId;

                  if (el.type === 'DIVIDER') {
                    return (
                      <div
                        key={el.id}
                        onPointerDown={(e) => handleElementPointerDown(e, el)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                        }}
                        style={{
                          top: `${el.y}px`,
                          left: `${el.x}px`,
                          width: `${el.width}px`,
                          height: `${el.height || 2}px`,
                          backgroundColor: el.backgroundColor || '#0F172A',
                          zIndex: isSelected ? 40 : el.zIndex || 1,
                        }}
                        className={`absolute cursor-move transition-shadow ${
                          isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:ring-1 hover:ring-blue-300'
                        }`}
                      />
                    );
                  }

                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => handleElementPointerDown(e, el)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(el.id);
                      }}
                      style={{
                        top: `${el.y}px`,
                        left: `${el.x}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        color: el.color || '#0F172A',
                        backgroundColor: el.backgroundColor || 'transparent',
                        fontSize: `${el.fontSize || 12}px`,
                        fontFamily: el.fontFamily || 'sans-serif',
                        fontWeight: el.fontWeight || 'normal',
                        textAlign: el.textAlign || 'left',
                        zIndex: isSelected ? 40 : el.zIndex || 1,
                      }}
                      className={`absolute cursor-move flex items-center px-1 rounded-sm transition-shadow ${
                        isSelected
                          ? 'ring-2 ring-blue-600 bg-blue-500/10 shadow-md'
                          : 'hover:ring-1 hover:ring-blue-400/80 hover:bg-blue-400/5'
                      }`}
                    >
                      <span className="truncate w-full">{el.text || el.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-[10px] text-slate-500 font-mono">
                अखबार मानक: 32.9 × 52 cm ब्रॉडशीट प्रिंट लेआउट • 100% शुद्ध देवनागरी रेंडरिंग
              </div>
            </div>

            {/* Right Column: Element Property Inspector */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col shrink-0 overflow-y-auto space-y-4 text-white">
              <span className="text-xs font-black text-slate-300 tracking-wider uppercase">
                तत्व गुण (Element Inspector)
              </span>

              {selectedElement ? (
                <div className="space-y-4">
                  {/* Element Header & Actions */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
                        {selectedElement.type}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">
                        {selectedElement.label || selectedElement.type}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateHeaderElement(selectedElement.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="प्रतिलिपि बनाएं"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHeaderElement(selectedElement.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/60 transition-colors"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Text Content Input */}
                  {selectedElement.type !== 'DIVIDER' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        टेक्स्ट सामग्री (Text):
                      </label>
                      <input
                        type="text"
                        value={selectedElement.text || ''}
                        onChange={(e) => updateSelectedElement({ text: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* 2-Column Coordinates: X / Y and Width / Height */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">X स्थिति (pt)</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.x)}
                        onChange={(e) => updateSelectedElement({ x: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white"
                      />
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Y स्थिति (pt)</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.y)}
                        onChange={(e) => updateSelectedElement({ y: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white"
                      />
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">चौड़ाई (Width)</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.width)}
                        onChange={(e) => updateSelectedElement({ width: parseFloat(e.target.value) || 10 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white"
                      />
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ऊंचाई (Height)</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.height)}
                        onChange={(e) => updateSelectedElement({ height: parseFloat(e.target.value) || 10 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white"
                      />
                    </div>
                  </div>

                  {/* Header Frame Positioning (Move Box Across 848pt Frame) */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-300">
                      हेडर फ्रेम में बॉक्स स्थिति (Frame Box Position):
                    </label>
                    <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ x: 16 })}
                        className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 hover:border-blue-500 transition-colors text-center cursor-pointer"
                        title="बॉक्स को बाएं किनारे पर सेट करें"
                      >
                        बाएं (Left)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({
                            x: Math.round(Math.max(16, (848 - selectedElement.width) / 2)),
                          })
                        }
                        className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 hover:border-blue-500 transition-colors text-center cursor-pointer"
                        title="बॉक्स को हेडर फ्रेम के बिल्कुल बीच में रखें"
                      >
                        मध्य (Center)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({
                            x: Math.round(Math.max(16, 848 - selectedElement.width - 16)),
                          })
                        }
                        className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 hover:border-blue-500 transition-colors text-center cursor-pointer"
                        title="बॉक्स को दाएं किनारे पर सेट करें"
                      >
                        दाएं (Right)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ x: 16, width: 816 })}
                        className="py-1.5 px-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 rounded border border-indigo-700 transition-colors text-center cursor-pointer"
                        title="बॉक्स को पूरे हेडर की चौड़ाई (Full Width) में फैलाएं"
                      >
                        पूर्ण चौड़ाई
                      </button>
                    </div>

                    {/* Nudge Controls */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <span className="text-[10px] font-bold text-slate-400">खिसकाव (Nudge):</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ x: Math.max(0, Math.round(selectedElement.x - 10)) })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-mono border border-slate-700 cursor-pointer"
                          title="10pt बाएं खिसकाएं"
                        >
                          ← 10
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ x: Math.min(848 - selectedElement.width, Math.round(selectedElement.x + 10)) })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-mono border border-slate-700 cursor-pointer"
                          title="10pt दाएं खिसकाएं"
                        >
                          → 10
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ y: Math.max(0, Math.round(selectedElement.y - 5)) })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-mono border border-slate-700 cursor-pointer"
                          title="5pt ऊपर खिसकाएं"
                        >
                          ↑ 5
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ y: Math.round(selectedElement.y + 5) })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-mono border border-slate-700 cursor-pointer"
                          title="5pt नीचे खिसकाएं"
                        >
                          ↓ 5
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Typography & Colors */}
                  {selectedElement.type !== 'DIVIDER' && (
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">फॉन्ट साइज़</label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={selectedElement.fontSize || 12}
                            onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value, 10) || 12 })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white"
                          />
                        </div>

                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">फॉन्ट भार</label>
                          <select
                            value={String(selectedElement.fontWeight || '700')}
                            onChange={(e) => updateSelectedElement({ fontWeight: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white"
                          >
                            <option value="400">Regular (400)</option>
                            <option value="600">Medium (600)</option>
                            <option value="700">Bold (700)</option>
                            <option value="900">Black (900)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">टेक्स्ट रंग:</span>
                          <input
                            type="color"
                            value={selectedElement.color || '#0F172A'}
                            onChange={(e) => updateSelectedElement({ color: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                          />
                        </div>

                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">पृष्ठभूमि:</span>
                          <input
                            type="color"
                            value={selectedElement.backgroundColor === 'transparent' ? '#FFFFFF' : selectedElement.backgroundColor || '#FFFFFF'}
                            onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                          />
                        </div>
                      </div>

                      {/* Alignment */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">संरेखण (Align):</label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                          {(['left', 'center', 'right'] as const).map((al) => (
                            <button
                              key={al}
                              onClick={() => updateSelectedElement({ textAlign: al })}
                              className={`py-1 rounded text-center font-bold capitalize transition-all ${
                                selectedElement.textAlign === al
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {al}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Divider specific options */}
                  {selectedElement.type === 'DIVIDER' && (
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-slate-400">लाइन रंग:</span>
                      <input
                        type="color"
                        value={selectedElement.backgroundColor || '#0F172A'}
                        onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs font-bold">
                  कैनवास पर किसी तत्व पर क्लिक करें
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
