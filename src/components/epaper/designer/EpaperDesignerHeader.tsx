import React from 'react';
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
  EyeOff,
  Move,
  MousePointer,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  Layout,
  Sparkles,
} from 'lucide-react';
import { EpaperPageDoc } from '../../../types';
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
  onPageChange: (pageNum: number) => void;
  onGridColumnsChange: (cols: GridColumnCount) => void;
  onViewportChange: (updater: (prev: CanvasViewportState) => CanvasViewportState) => void;
  onFitToScreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onSaveAsTemplate?: () => void;
  onAutoArrange?: () => void;
  isAutoArranging?: boolean;
  designerMode?: 'AUTO' | 'ASSISTED' | 'MANUAL';
  onModeChange?: (mode: 'AUTO' | 'ASSISTED' | 'MANUAL') => void;
  onClose: () => void;
}

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
  onPageChange,
  onGridColumnsChange,
  onViewportChange,
  onFitToScreen,
  onUndo,
  onRedo,
  onSave,
  onSaveAsTemplate,
  onAutoArrange,
  isAutoArranging,
  designerMode = 'ASSISTED',
  onModeChange,
  onClose,
}) => {
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
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0 z-30 select-none">
      {/* Left: Edition Info & Page Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-sm text-white">
            ब
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-sm bg-slate-800 text-blue-400 border border-slate-700">
                {editionCode || 'EP-BROADSHEET'}
              </span>
              <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                {editionTitle}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-400 border border-slate-700">
                v{activePage.version || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Page Switcher Carousel */}
        <div className="h-6 w-px bg-slate-800 mx-1" />
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => onPageChange(Math.max(1, activePage.pageNumber - 1))}
            disabled={activePage.pageNumber <= 1}
            className="p-1 rounded-md text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="पिछला पृष्ठ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-2 text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span>पृष्ठ {activePage.pageNumber}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{totalPages || 12}</span>
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages || 12, activePage.pageNumber + 1))}
            disabled={activePage.pageNumber >= (totalPages || 12)}
            className="p-1 rounded-md text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="अगला पृष्ठ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Column Grid Selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 ml-1">
          <span className="text-[11px] font-bold text-slate-400 pl-1.5 pr-1">कॉलम:</span>
          {([3, 4, 5, 6, 8] as GridColumnCount[]).map((cols) => (
            <button
              key={cols}
              onClick={() => onGridColumnsChange(cols)}
              className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
                activePage.gridColumns === cols
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
              title={`${cols} कॉलम ग्रिड`}
            >
              {cols}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Modes, Tools, Toggles, Zoom & Viewport */}
      <div className="flex items-center gap-2">
        {/* 3 Page Designer Modes: AUTO, ASSISTED, MANUAL */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => onModeChange && onModeChange('AUTO')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              designerMode === 'AUTO'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="ऑटो मोड: प्राथमिकता व पदानुक्रम के आधार पर स्वचालित लेआउट संयोजन"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">ऑटो (Auto)</span>
          </button>

          <button
            onClick={() => onModeChange && onModeChange('ASSISTED')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              designerMode === 'ASSISTED'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="असिस्टेड मोड: चुंबकीय स्नैपिंग, ग्रिड गाइडलाइंस एवं वास्तविक समय टकराव चेतावनियां"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">असिस्टेड (Assisted)</span>
          </button>

          <button
            onClick={() => onModeChange && onModeChange('MANUAL')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              designerMode === 'MANUAL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="मैन्युअल मोड: स्वतंत्र पोज़िशनिंग, आकार परिवर्तन एवं फ्री-फॉर्म संपादन"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">मैन्युअल (Manual)</span>
          </button>
        </div>

        {/* Pointer vs Hand tool */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => onViewportChange((prev) => ({ ...prev, activeTool: 'select' }))}
            className={`p-1.5 rounded-lg transition-colors ${
              viewportState.activeTool === 'select'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="चयन टूल (Selection Tool - V)"
          >
            <MousePointer className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewportChange((prev) => ({ ...prev, activeTool: 'hand' }))}
            className={`p-1.5 rounded-lg transition-colors ${
              viewportState.activeTool === 'hand'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="पैन / हैंड टूल (Hand Pan Tool - H)"
          >
            <Move className="w-4 h-4" />
          </button>
        </div>

        {/* Grid & Magnet Snapping Toggles */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={toggleGrid}
            className={`p-1.5 rounded-lg transition-colors ${
              viewportState.showGrid
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
            title="कॉलम ग्रिड गाइडलाइंस चालू/बंद"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSnap}
            className={`p-1.5 rounded-lg transition-colors ${
              viewportState.magneticSnap
                ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
            title="मैग्नेटिक 8px स्नैपिंग चालू/बंद"
          >
            <Magnet className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMargins}
            className={`p-1.5 rounded-lg transition-colors ${
              viewportState.showMargins
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
            title="मुद्रण हाशिया (Margins) चालू/बंद"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
            title="ज़ूम कम करें (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-300 w-11 text-center">
            {zoomPercent}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
            title="ज़ूम बढ़ाएं (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onFitToScreen}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors ml-0.5"
            title="स्क्रीन में फ़िट करें (0)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Preview Toggle */}
        <button
          onClick={togglePreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            viewportState.previewMode
              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-white'
          }`}
          title="लाइव ब्रॉडशीट प्रीव्यू / वायरफ्रेम टॉगल"
        >
          {viewportState.previewMode ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>लाइव प्रीव्यू</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>एडिटर मोड</span>
            </>
          )}
        </button>
        {/* AI Auto-Arrange Button (Auto Mode) */}
        {onAutoArrange && (
          <button
            onClick={onAutoArrange}
            disabled={isAutoArranging}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/50 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="पेज एलिमेंट्स को ऑटोमैटिक 8-कॉलम ब्रॉडशीट ग्रिड में व्यवस्थित करें (Auto Mode)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden lg:inline">{isAutoArranging ? 'ऑटो-लेआउट...' : 'ऑटो लेआउट'}</span>
          </button>
        )}
      </div>

      {/* Right: Undo/Redo, Dirty Status, Save & Close */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="पूर्ववत करें (Undo - Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="पुनः करें (Redo - Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Dirty Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {isDirty ? (
            <div className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>असुरक्षित</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>सहेजा हुआ</span>
            </div>
          )}
        </div>

        {/* Save as Template Button */}
        {onSaveAsTemplate && (
          <button
            onClick={onSaveAsTemplate}
            className="px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="वर्तमान पेज लेआउट को कस्टम टेम्पलेट के रूप में सहेजें"
          >
            <Layout className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xl:inline">कस्टम टेम्पलेट</span>
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'सहेजा जा रहा है...' : 'सहेजें (Ctrl+S)'}</span>
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="डिज़ाइनर बंद करें"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
