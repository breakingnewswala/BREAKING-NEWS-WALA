import React, { useState, useEffect } from 'react';
import { EpaperTemplateDoc, EpaperTemplateRegion, TemplateAnalysisResult } from '../../types';
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
} from 'lucide-react';

export interface EpaperTemplateManagerProps {
  onApplyTemplate?: (template: EpaperTemplateDoc) => void;
  currentPageElements?: any[];
  pageId?: string;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'सभी टेम्पलेट' },
  { id: 'FRONT_PAGE', label: 'मुख्य पृष्ठ' },
  { id: 'STATE', label: 'प्रादेशिक' },
  { id: 'NATIONAL', label: 'राष्ट्रीय' },
  { id: 'EDITORIAL', label: 'संपादकीय' },
  { id: 'DISTRICT_FOCUS', label: 'ज़िला विशेष' },
  { id: 'BUSINESS', label: 'व्यापार' },
  { id: 'SPORTS', label: 'खेल जगत' },
  { id: 'ENTERTAINMENT', label: 'मनोरंजन' },
  { id: 'CLASSIFIEDS', label: 'क्लासिफाइड' },
  { id: 'CUSTOM', label: 'कस्टम' },
];

export const EpaperTemplateManager: React.FC<EpaperTemplateManagerProps> = ({
  onApplyTemplate,
  currentPageElements,
  pageId,
}) => {
  const [templates, setTemplates] = useState<EpaperTemplateDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<EpaperTemplateDoc | null>(null);

  // AI Layout Analysis
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<TemplateAnalysisResult | null>(null);

  // Custom Template Creation Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateNameHi, setNewTemplateNameHi] = useState<string>('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<string>('CUSTOM');
  const [newTemplateColumns, setNewTemplateColumns] = useState<number>(8);
  const [savingCustom, setSavingCustom] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    const matchesSearch =
      !searchQuery ||
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.nameHi && tpl.nameHi.includes(searchQuery)) ||
      tpl.templateCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
      showToast('एआई लेआउट ज्यामितीय विश्लेषण सफलतापूर्वक पूर्ण हुआ!');
    } catch (err: any) {
      setErrorMessage(err.message || 'एआई विश्लेषण विफल रहा');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveCustomTemplate = async () => {
    if (!newTemplateName.trim() && !newTemplateNameHi.trim()) {
      setErrorMessage('टेम्पलेट का नाम अनिवार्य है');
      return;
    }
    setSavingCustom(true);
    setErrorMessage(null);
    try {
      const sampleRegions: EpaperTemplateRegion[] =
        currentPageElements && currentPageElements.length > 0
          ? currentPageElements.map((el, i) => ({
              id: `reg-${i + 1}-${String(el.elementType || 'story').toLowerCase()}`,
              name: `क्षेत्र ${i + 1}: ${el.elementType || 'STORY'}`,
              bounds: el.bounds || { x: 20, y: 50, width: 400, height: 200 },
              colSpan: el.colSpan || 4,
              defaultElementType: el.elementType || 'STORY',
            }))
          : [
              {
                id: 'reg-01-head',
                name: 'मुख्य हेडर',
                bounds: { x: 20, y: 20, width: 892, height: 60 },
                colSpan: 8,
                defaultElementType: 'HEADLINE',
              },
              {
                id: 'reg-02-lead',
                name: 'लीड स्टोरी',
                bounds: { x: 20, y: 90, width: 580, height: 400 },
                colSpan: 5,
                defaultElementType: 'STORY',
              },
              {
                id: 'reg-03-side',
                name: 'साइड विज्ञापन (ASCI प्रमाणित)',
                bounds: { x: 610, y: 90, width: 300, height: 400 },
                colSpan: 3,
                defaultElementType: 'AD',
              },
            ];

      await apiClient.epaper.saveTemplate({
        name: newTemplateName || newTemplateNameHi,
        nameHi: newTemplateNameHi || newTemplateName,
        category: newTemplateCategory,
        gridColumns: newTemplateColumns as any,
        isSystem: false,
        regions: sampleRegions,
      });

      setShowCreateModal(false);
      setNewTemplateName('');
      setNewTemplateNameHi('');
      showToast('कस्टम टेम्पलेट सफलतापूर्वक सहेजा गया!');
      await loadTemplates();
    } catch (err: any) {
      if (err.code === 'ERR_TEMPLATE_NAME_COLLISION' || err.statusCode === 409) {
        setErrorMessage('इस नाम का टेम्पलेट पहले से मौजूद है। कृपया कोई भिन्न नाम चुनें।');
      } else {
        setErrorMessage(err.message || 'टेम्पलेट सहेजना विफल रहा');
      }
    } finally {
      setSavingCustom(false);
    }
  };

  const handleDeleteTemplate = async (tpl: EpaperTemplateDoc) => {
    if (tpl.isSystem) return;
    if (!window.confirm(`क्या आप वाकई "${tpl.nameHi || tpl.name}" टेम्पलेट को हटाना चाहते हैं?`)) {
      return;
    }
    try {
      await apiClient.epaper.deleteTemplate(tpl.id);
      showToast('टेम्पलेट सफलतापूर्वक हटा दिया गया');
      if (selectedTemplate?.id === tpl.id) {
        setSelectedTemplate(null);
      }
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || 'टेम्पलेट हटाना विफल रहा');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ब्रॉडशीट ई-पेपर टेम्पलेट प्रबंधक (Template Manager)
              </h2>
              <p className="text-xs text-slate-500">
                12 प्रामाणिक भारतीय समाचार पत्र पृष्ठ लेआउट्स, एआई ज्यामितीय विश्लेषण एवं कस्टम टेम्पलेट कैटलॉग
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunAiAnalysis()}
            disabled={analyzing}
            className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{analyzing ? 'विश्लेषण जारी...' : 'एआई लेआउट विश्लेषण'}</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>कस्टम टेम्पलेट बनाएं</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Category Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="टेम्पलेट अथवा कोड खोजें..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* AI Analysis Result Banner */}
      {analysisResult && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-600 text-white rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-purple-900">
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
              className="text-purple-400 hover:text-purple-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            <div className="bg-white p-2.5 rounded-xl border border-purple-100 text-center">
              <span className="text-xs text-slate-500">कुल स्लॉट</span>
              <p className="text-lg font-bold text-purple-900">{analysisResult.totalSlots}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-100 text-center">
              <span className="text-xs text-slate-500">समाचार स्लॉट</span>
              <p className="text-lg font-bold text-blue-700">{analysisResult.storySlots}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-100 text-center">
              <span className="text-xs text-slate-500">विज्ञापन स्लॉट (ASCI)</span>
              <p className="text-lg font-bold text-amber-600">{analysisResult.adSlots}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-100 text-center">
              <span className="text-xs text-slate-500">फोटो/इमेज स्लॉट</span>
              <p className="text-lg font-bold text-emerald-600">{analysisResult.imageSlots || 0}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-100 text-center">
              <span className="text-xs text-slate-500">हेडलाइन/मास्टहेड</span>
              <p className="text-lg font-bold text-slate-700">{analysisResult.headlineSlots}</p>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">टेम्पलेट लोड हो रहे हैं...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Layout className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">कोई टेम्पलेट नहीं मिला</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-4 space-y-3">
                {/* Broadsheet SVG Thumbnail Preview */}
                <div
                  onClick={() => setSelectedTemplate(tpl)}
                  className="w-full h-44 bg-slate-50 rounded-xl border border-slate-200 p-2 cursor-pointer relative overflow-hidden flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <svg
                    viewBox="0 0 932.6 1474"
                    className="w-full h-full drop-shadow-xs"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Newspaper background */}
                    <rect x="0" y="0" width="932.6" height="1474" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                    {/* Grid Columns watermark */}
                    {Array.from({ length: tpl.gridColumns }).map((_, cIdx) => (
                      <line
                        key={cIdx}
                        x1={(932.6 / tpl.gridColumns) * cIdx}
                        y1="0"
                        x2={(932.6 / tpl.gridColumns) * cIdx}
                        y2="1474"
                        stroke="#F1F5F9"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    ))}
                    {/* Template Regions */}
                    {tpl.regions.map((reg) => {
                      let fill = '#F8FAFC';
                      let stroke = '#94A3B8';
                      if (reg.defaultElementType === 'MASTHEAD') {
                        fill = '#1E293B';
                        stroke = '#0F172A';
                      } else if (reg.defaultElementType === 'AD') {
                        fill = '#FEF3C7';
                        stroke = '#F59E0B';
                      } else if (reg.defaultElementType === 'IMAGE') {
                        fill = '#E2E8F0';
                        stroke = '#64748B';
                      } else if (reg.defaultElementType === 'HEADLINE') {
                        fill = '#334155';
                        stroke = '#1E293B';
                      } else if (reg.defaultElementType === 'COLUMN') {
                        fill = '#ECFDF5';
                        stroke = '#10B981';
                      }
                      return (
                        <g key={reg.id}>
                          <rect
                            x={reg.bounds.x}
                            y={reg.bounds.y}
                            width={reg.bounds.width}
                            height={reg.bounds.height}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth="2"
                            rx="4"
                          />
                          {reg.defaultElementType === 'AD' && (
                            <rect
                              x={reg.bounds.x + reg.bounds.width - 70}
                              y={reg.bounds.y + 6}
                              width={60}
                              height={20}
                              fill="#ED1727"
                              rx="3"
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] rounded-md font-mono">
                    {tpl.gridColumns} cols
                  </span>
                </div>

                {/* Meta details */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md">
                      {tpl.templateCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        tpl.isSystem ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {tpl.isSystem ? 'सिस्टम' : 'कस्टम'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{tpl.nameHi || tpl.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{tpl.description}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedTemplate(tpl)}
                  className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg hover:bg-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="विस्तृत पूर्वावलोकन"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>विवरण</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {!tpl.isSystem && (
                    <button
                      onClick={() => handleDeleteTemplate(tpl)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onApplyTemplate && (
                    <button
                      onClick={() => onApplyTemplate(tpl)}
                      className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      लागू करें
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Template Preview Drawer / Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                    {selectedTemplate.templateCode}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedTemplate.nameHi || selectedTemplate.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SVG Canvas Preview */}
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex items-center justify-center">
                  <svg
                    viewBox="0 0 932.6 1474"
                    className="w-full max-h-[460px] drop-shadow-md bg-white rounded-lg"
                  >
                    <rect x="0" y="0" width="932.6" height="1474" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
                    {selectedTemplate.regions.map((reg) => {
                      let fill = '#F8FAFC';
                      let stroke = '#94A3B8';
                      if (reg.defaultElementType === 'MASTHEAD') {
                        fill = '#1E293B';
                        stroke = '#0F172A';
                      } else if (reg.defaultElementType === 'AD') {
                        fill = '#FEF3C7';
                        stroke = '#F59E0B';
                      } else if (reg.defaultElementType === 'IMAGE') {
                        fill = '#E2E8F0';
                        stroke = '#64748B';
                      } else if (reg.defaultElementType === 'HEADLINE') {
                        fill = '#334155';
                        stroke = '#1E293B';
                      } else if (reg.defaultElementType === 'COLUMN') {
                        fill = '#ECFDF5';
                        stroke = '#10B981';
                      }
                      return (
                        <g key={reg.id}>
                          <rect
                            x={reg.bounds.x}
                            y={reg.bounds.y}
                            width={reg.bounds.width}
                            height={reg.bounds.height}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth="2"
                            rx="4"
                          />
                          {reg.defaultElementType === 'AD' && (
                            <rect
                              x={reg.bounds.x + reg.bounds.width - 70}
                              y={reg.bounds.y + 6}
                              width={60}
                              height={20}
                              fill="#ED1727"
                              rx="3"
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Region Inventory & Specs */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">तकनीकी विशिष्टता (Specs)</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">ग्रिड कॉलम:</span>{' '}
                        <span className="font-semibold">{selectedTemplate.gridColumns} Columns</span>
                      </div>
                      <div>
                        <span className="text-slate-400">क्षेत्र संख्या:</span>{' '}
                        <span className="font-semibold">{selectedTemplate.regions.length} Regions</span>
                      </div>
                      <div>
                        <span className="text-slate-400">श्रेणी:</span>{' '}
                        <span className="font-semibold">{selectedTemplate.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">संस्करण (OCC):</span>{' '}
                        <span className="font-semibold">v{selectedTemplate.version}</span>
                      </div>
                    </div>
                  </div>

                  {/* Regions list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2">लेआउट क्षेत्र सूची (Regions)</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedTemplate.regions.map((reg, idx) => (
                        <div
                          key={reg.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{reg.name}</span>
                            <div className="text-[11px] text-slate-400">
                              प्रकार: {reg.defaultElementType} | स्पैन: {reg.colSpan} cols
                            </div>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {Math.round(reg.bounds.width)}x{Math.round(reg.bounds.height)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleRunAiAnalysis(selectedTemplate)}
                      disabled={analyzing}
                      className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{analyzing ? 'विश्लेषण जारी...' : 'एआई विश्लेषण करें'}</span>
                    </button>
                    {onApplyTemplate && (
                      <button
                        onClick={() => {
                          onApplyTemplate(selectedTemplate);
                          setSelectedTemplate(null);
                        }}
                        className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>पृष्ठ पर लागू करें</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Custom Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">नया कस्टम टेम्पलेट सहेजें</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setErrorMessage(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  टेम्पलेट का नाम (अंग्रेजी / ID):
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="उदा. Weekly Youth Special"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  टेम्पलेट का हिंदी नाम:
                </label>
                <input
                  type="text"
                  value={newTemplateNameHi}
                  onChange={(e) => setNewTemplateNameHi(e.target.value)}
                  placeholder="उदा. युवा संसार व रोजगार विशेष"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">श्रेणी:</label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="CUSTOM">कस्टम (Custom)</option>
                    <option value="FRONT_PAGE">मुख्य पृष्ठ</option>
                    <option value="STATE">प्रादेशिक</option>
                    <option value="DISTRICT_FOCUS">ज़िला विशेष</option>
                    <option value="SPECIAL">विशेष रिपोर्ट</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ग्रिड कॉलम:</label>
                  <select
                    value={newTemplateColumns}
                    onChange={(e) => setNewTemplateColumns(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                    <option value={5}>5 Columns</option>
                    <option value={6}>6 Columns</option>
                    <option value={8}>8 Columns (मानक ब्रॉडशीट)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setErrorMessage(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleSaveCustomTemplate}
                disabled={savingCustom}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingCustom ? 'सहेजा जा रहा है...' : 'सहेजें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
