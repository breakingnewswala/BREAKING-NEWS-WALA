import React, { useState } from 'react';
import {
  Grid,
  Magnet,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Save,
  X,
  Eye,
  Move,
  MousePointer,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  Layout,
  Sparkles,
  Paintbrush,
  Image as ImageIcon,
  Type,
  Square,
  Globe,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { EpaperPageDoc, EpaperElementType } from '../../../types';
import { CanvasViewportState, GridColumnCount } from './types';

export interface EpaperDesignerHeaderProps {
  editionCode: string;
  editionTitle: string;
  totalPages: number;
  activePage: EpaperPageDoc;
  viewportState: CanvasViewportState;
  isDirty: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentRole?: string;
  onPageChange: (pageNum: number) => void;
  onGridColumnsChange: (cols: GridColumnCount) => void;
  onViewportChange: (updater: (prev: CanvasViewportState) => CanvasViewportState) => void;
  onFitToScreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onSaveDraft?: () => void;
  onSaveEntireEdition?: () => void;
  onSaveAsTemplate?: () => void;
  onAutoArrange?: () => void;
  onPreviewEdition?: () => void;
  isAutoArranging?: boolean;
  designerMode?: 'AUTO' | 'ASSISTED' | 'MANUAL';
  onModeChange?: (mode: 'AUTO' | 'ASSISTED' | 'MANUAL') => void;
  onSectionChange?: (section: string) => void;
  onOpenHeaderTemplates?: () => void;
  onOpenCoverImport?: () => void;
  onOpenAiAssistant?: () => void;
  onAddPrimitive?: (type: EpaperElementType) => void;
  onClose: () => void;
}

const SECTION_OPTIONS = [
  { key: 'FRONT_PAGE', label: 'प्रथम पृष्ठ (Front Page)' },
  { key: 'STATE', label: 'मध्य प्रदेश राज्य (State)' },
  { key: 'NATIONAL', label: 'राष्ट्रीय / देश (National)' },
  { key: 'EDITORIAL', label: 'संपादकीय विमर्श (Editorial)' },
  { key: 'DISTRICT_FOCUS', label: 'जिला समाचार (District)' },
  { key: 'BUSINESS', label: 'व्यापार व मंडी (Business)' },
  { key: 'SPORTS', label: 'खेल हलचल (Sports)' },
  { key: 'ENTERTAINMENT', label: 'मनोरंजन (Culture)' },
  { key: 'SPECIAL', label: 'विशेष परिशिष्ट (Special)' },
];

export const EpaperDesignerHeader: React.FC<EpaperDesignerHeaderProps> = ({
  editionCode,
  editionTitle,
  totalPages,
  activePage,
  viewportState,
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  currentRole = 'ADMIN',
  onPageChange,
  onGridColumnsChange,
  onViewportChange,
  onFitToScreen,
  onUndo,
  onRedo,
  onSave,
  onSaveDraft,
  onSaveEntireEdition,
  onSaveAsTemplate,
  onAutoArrange,
  onPreviewEdition,
  isAutoArranging,
  designerMode = 'ASSISTED',
  onModeChange,
  onSectionChange,
  onOpenHeaderTemplates,
  onOpenCoverImport,
  onOpenAiAssistant,
  onAddPrimitive,
  onClose,
}) => {
  const [showBrushSettings, setShowBrushSettings] = useState<boolean>(false);
  const [showShapeMenu, setShowShapeMenu] = useState<boolean>(false);
  const zoomPercent = Math.round(viewportState.zoom * 100);

  const handleZoomIn = () => {
    onViewportChange((prev) => ({
      ...prev,
      zoom: Math.min(2.0, Number((prev.zoom + 0.1).toFixed(2))),
    }));
  };

  const handleZoomOut = () => {
    onViewportChange((prev) => ({
      ...prev,
      zoom: Math.max(0.25, Number((prev.zoom - 0.1).toFixed(2))),
    }));
  };

  const toggleGrid = () => {
    onViewportChange((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  };

  const toggleSnap = () => {
    onViewportChange((prev) => ({ ...prev, magneticSnap: !prev.magneticSnap }));
  };

  const toggleMargins = () => {
    onViewportChange((prev) => ({ ...prev, showMargins: !prev.showMargins }));
  };

  const togglePreview = () => {
    onViewportChange((prev) => ({ ...prev, previewMode: !prev.previewMode }));
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shrink-0 z-30 select-none flex flex-col shadow-lg">
      {/* =================================================================== */}
      {/* ROW 1: Publication & Page Controls                                  */}
      {/* =================================================================== */}
      <div className="h-11 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 overflow-x-auto scrollbar-none gap-2">
        {/* Left: 1. Selected Newspaper / Publication Name & 2. Version */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              ब
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 max-w-[200px] truncate" title={editionTitle || editionCode}>
                {editionTitle || editionCode || 'दैनिक ब्रेकिंग न्यूज़ वाला'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-800 text-blue-400 border border-slate-700/80">
                {editionCode || 'MP-BHOPAL'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700/80">
                v{activePage.version || 1}
              </span>
              {/* Single Publication Status Badge */}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 hidden sm:inline-block">
                सक्रिय संस्करण
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden md:block" />

          {/* 3. Page Number and Total Pages Carousel */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onPageChange(Math.max(1, activePage.pageNumber - 1))}
              disabled={activePage.pageNumber <= 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              title="पिछला पृष्ठ (Previous Page)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="px-2 text-xs font-bold text-slate-200 flex items-center gap-1">
              <span>पृष्ठ {activePage.pageNumber}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{totalPages || 12}</span>
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages || 12, activePage.pageNumber + 1))}
              disabled={activePage.pageNumber >= (totalPages || 12)}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              title="अगला पृष्ठ (Next Page)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4. Section Selector */}
          <div className="hidden lg:flex items-center">
            <select
              value={activePage.sectionType || 'FRONT_PAGE'}
              onChange={(e) => onSectionChange?.(e.target.value)}
              className="bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-lg text-xs font-bold px-2.5 py-1 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              title="पृष्ठ का अनुभाग चुनें (Section Selector)"
            >
              {SECTION_OPTIONS.map((sec) => (
                <option key={sec.key} value={sec.key}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center / Right: 5. Zoom Controls, 6. Undo/Redo & 7. Save Status & Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 5. Zoom Controls */}
          <div className="flex items-center gap-0.5 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              title="ज़ूम कम करें (Zoom Out -)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-300 w-10 text-center">
              {zoomPercent}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              title="ज़ूम बढ़ाएं (Zoom In +)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onFitToScreen}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors ml-0.5"
              title="स्क्रीन में फ़िट करें (Fit to Screen - 0)"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* 6. Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              title="पूर्ववत करें (Undo - Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              title="पुनः करें (Redo - Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 7. Save Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs px-1">
            {isDirty ? (
              <div className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="hidden xl:inline text-[11px]">असुरक्षित</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px]">सहेजा हुआ</span>
              </div>
            )}
          </div>

          {/* Save Draft Action */}
          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              disabled={isSaving}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="ई-पेपर को प्रारूप (Draft) के रूप में सुरक्षित करें"
            >
              <Save className="w-3 h-3 text-slate-300" />
              <span className="hidden md:inline">प्रारूप</span>
            </button>
          )}

          {/* Save Entire Edition Action */}
          {onSaveEntireEdition && (
            <button
              onClick={onSaveEntireEdition}
              disabled={isSaving}
              className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="समस्त 12 पृष्ठों सहित संपूर्ण संस्करण एक साथ सहेजें"
            >
              <Layers className="w-3 h-3 text-indigo-300" />
              <span className="hidden md:inline">संपूर्ण संस्करण</span>
            </button>
          )}

          {/* Save Current Page Button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="वर्तमान सक्रिय पृष्ठ सहेजें (Ctrl+S)"
          >
            <Save className="w-3 h-3" />
            <span>{isSaving ? 'सहेजा जा रहा है...' : 'पृष्ठ सहेजें'}</span>
          </button>

          {/* Close Designer Modal Button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="डिज़ाइनर बंद करें (Close Designer)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* ROW 2: Design & Editing Controls                                    */}
      {/* =================================================================== */}
      <div className="h-12 px-4 flex items-center justify-between bg-slate-900 overflow-x-auto scrollbar-none gap-2">
        {/* Left: Design Modes (Auto, Assisted, Manual) & Primary Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Selector Group */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onModeChange && onModeChange('AUTO')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                designerMode === 'AUTO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ऑटो लेआउट मोड: प्राथमिकताओं के आधार पर स्वतः 8-कॉलम विन्यास"
            >
              <Sparkles className="w-3 h-3" />
              <span>ऑटो (Auto)</span>
            </button>

            <button
              onClick={() => onModeChange && onModeChange('ASSISTED')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                designerMode === 'ASSISTED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="असिस्टेड मोड: चुंबकीय स्नैपिंग, 8px ग्रिड एवं ओवरलैप संरक्षण"
            >
              <Magnet className="w-3 h-3" />
              <span>असिस्टेड (Assisted)</span>
            </button>

            <button
              onClick={() => onModeChange && onModeChange('MANUAL')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                designerMode === 'MANUAL'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="मैनुअल मोड: पूर्ण स्वतंत्रता से ड्रैग-ड्रॉप एवं रिसाइज़"
            >
              <MousePointer className="w-3 h-3" />
              <span>मैनुअल (Manual)</span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-0.5" />

          {/* Interactive Tools: Selection, Hand, Brush */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 relative">
            <button
              onClick={() => onViewportChange((prev) => ({ ...prev, activeTool: 'select' }))}
              className={`p-1.5 rounded-md transition-colors ${
                viewportState.activeTool === 'select'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="चयन टूल (Selection Tool - V)"
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onViewportChange((prev) => ({ ...prev, activeTool: 'hand' }))}
              className={`p-1.5 rounded-md transition-colors ${
                viewportState.activeTool === 'hand'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="पैन / हैंड टूल (Hand Pan Tool - H)"
            >
              <Move className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onViewportChange((prev) => ({ ...prev, activeTool: 'brush' }));
                setShowBrushSettings(!showBrushSettings);
              }}
              className={`p-1.5 rounded-md transition-colors relative ${
                viewportState.activeTool === 'brush'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ब्रश / फ्रीहैंड रेखांकन टूल (Brush / Drawing Tool - B)"
            >
              <Paintbrush className="w-3.5 h-3.5" />
            </button>

            {/* Brush Tool Quick Settings Popup */}
            {showBrushSettings && viewportState.activeTool === 'brush' && (
              <div className="absolute top-10 left-0 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 w-56 text-xs space-y-2.5">
                <div className="flex items-center justify-between font-bold text-slate-200 pb-1 border-b border-slate-800">
                  <span>ब्रश सेटिंग्स (Brush Settings)</span>
                  <button onClick={() => setShowBrushSettings(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">प्रकार (Type):</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => onViewportChange((prev) => ({ ...prev, brushType: 'pen', brushOpacity: 1.0 }))}
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        (viewportState.brushType || 'pen') === 'pen' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      पेन (Pen)
                    </button>
                    <button
                      onClick={() => onViewportChange((prev) => ({ ...prev, brushType: 'highlighter', brushOpacity: 0.35 }))}
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        viewportState.brushType === 'highlighter' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      हाइलाइटर
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>मोटाई (Size):</span>
                    <span>{viewportState.brushSize || 3}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="18"
                    value={viewportState.brushSize || 3}
                    onChange={(e) =>
                      onViewportChange((prev) => ({
                        ...prev,
                        brushSize: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">रंग (Color):</label>
                  <div className="flex items-center gap-1.5">
                    {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#000000'].map((c) => (
                      <button
                        key={c}
                        onClick={() => onViewportChange((prev) => ({ ...prev, brushColor: c }))}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border ${
                          (viewportState.brushColor || '#EF4444') === c ? 'ring-2 ring-white scale-110' : 'border-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800 mx-0.5" />

          {/* Grid Columns: 1, 2, 3, 4, 5, 6, 8 columns */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 pl-1.5 pr-0.5">कॉलम:</span>
            {([1, 2, 3, 4, 5, 6, 8] as GridColumnCount[]).map((cols) => (
              <button
                key={cols}
                onClick={() => onGridColumnsChange(cols)}
                className={`w-6 h-6 rounded-md text-xs font-bold transition-all flex items-center justify-center ${
                  activePage.gridColumns === cols
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
                title={`${cols} कॉलम ग्रिड लागू करें`}
              >
                {cols}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-800 mx-0.5 hidden xl:block" />

          {/* Quick Element Adders */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onAddPrimitive?.('IMAGE')}
              className="px-2 py-1 rounded-md text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center gap-1"
              title="फोटो / चित्र तत्व जोड़ें (+ Photo)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ फोटो</span>
            </button>

            <button
              onClick={() => onAddPrimitive?.('STORY')}
              className="px-2 py-1 rounded-md text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center gap-1"
              title="समाचार विवरण तत्व जोड़ें (+ Story)"
            >
              <Type className="w-3.5 h-3.5 text-blue-400" />
              <span>+ स्टोरी</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShapeMenu(!showShapeMenu)}
                className="px-2 py-1 rounded-md text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center gap-1"
                title="आकृतियाँ व विभाजक रेखाएं (+ Shapes)"
              >
                <Square className="w-3.5 h-3.5 text-purple-400" />
                <span>+ आकृतियाँ</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showShapeMenu && (
                <div className="absolute top-8 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl z-50 w-44 text-xs space-y-0.5">
                  <button
                    onClick={() => {
                      onAddPrimitive?.('SHAPE');
                      setShowShapeMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-bold flex items-center gap-2"
                  >
                    <Square className="w-3.5 h-3.5 text-purple-400" />
                    <span>आकृति बॉक्स (Shape)</span>
                  </button>
                  <button
                    onClick={() => {
                      onAddPrimitive?.('DIVIDER');
                      setShowShapeMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-bold flex items-center gap-2"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>विभाजक रेखा (Divider)</span>
                  </button>
                  <button
                    onClick={() => {
                      onAddPrimitive?.('AD');
                      setShowShapeMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-bold flex items-center gap-2"
                  >
                    <Layout className="w-3.5 h-3.5 text-emerald-400" />
                    <span>विज्ञापन बॉक्स (ASCI Ad)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Viewport Toggles, Header Template Picker & AI Assistant Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Viewport Toggles (Grid, Snap, Margins, Live Preview) */}
          <div className="flex items-center gap-0.5 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={toggleGrid}
              className={`p-1.5 rounded-md transition-colors ${
                viewportState.showGrid
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="कॉलम ग्रिड गाइडलाइंस (Grid Lines)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleSnap}
              className={`p-1.5 rounded-md transition-colors ${
                viewportState.magneticSnap
                  ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="8px मैग्नेटिक स्नैपिंग (Magnetic Snap)"
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleMargins}
              className={`p-1.5 rounded-md transition-colors ${
                viewportState.showMargins
                  ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="मुद्रण हाशिया (Margins)"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onPreviewEdition || togglePreview}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all ${
                viewportState.previewMode
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="लाइव ब्रॉडशीट पूर्वावलोकन (Live Broadsheet Preview)"
            >
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden lg:inline">{viewportState.previewMode ? 'पूर्वावलोकन ON' : 'पूर्वावलोकन'}</span>
            </button>
          </div>

          {/* Master Admin Header Template Manager Action (Part 4) */}
          {onOpenHeaderTemplates && (
            <button
              onClick={onOpenHeaderTemplates}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 border border-purple-800/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="मास्टर एडमिन हेडर डिज़ाइनर व टेम्पलेट प्रबंधक (Header Templates)"
            >
              <Layout className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">हेडर डिज़ाइनर</span>
            </button>
          )}

          {/* Cover URL Import Action (Part 5) */}
          {onOpenCoverImport && (
            <button
              onClick={onOpenCoverImport}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-800/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="कवर URL इंपोर्ट व समाचार निष्कर्षण (Cover URL Import)"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">URL इंपोर्ट</span>
            </button>
          )}

          {/* AI Editorial Assistant Action (Part 6 & 7) */}
          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="22 AI न्यूज़रूम टूल्स एवं रीयल-टाइम वॉइस टाइपिंग (AI Assistant)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>AI सहायक</span>
            </button>
          )}

          {/* Auto Arrange Button (Auto Mode) */}
          {designerMode === 'AUTO' && onAutoArrange && (
            <button
              onClick={onAutoArrange}
              disabled={isAutoArranging}
              className="px-3 py-1.5 rounded-lg border border-amber-500/50 bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
              title="एलिमेंट्स को 8-कॉलम ब्रॉडशीट ग्रिड में व्यवस्थित करें"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAutoArranging ? 'लेआउट...' : 'ऑटो लेआउट'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
