import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  EpaperPageDoc,
  EpaperPageElement,
  EpaperPageElementBounds,
} from '../../../types';
import {
  BROADSHEET_CONSTANTS,
  calculateColumnGrid,
  generateSnapGuideLines,
  snapToBounds,
  clampToBounds,
  detectAllCollisions,
  ResizeHandleType,
  SnapGuideLine,
} from '../../../utils/epaperLayout';
import { GraphicRenderer } from '../../../services/graphicRenderer';
import { CanvasViewportState, DragState, ResizeState } from './types';
import { AlertTriangle } from 'lucide-react';

export interface EpaperCanvasPanelProps {
  page: EpaperPageDoc;
  selectedElementId: string | null;
  viewportState: CanvasViewportState;
  onSelectElement: (id: string | null) => void;
  onUpdateElementBounds: (id: string, bounds: EpaperPageElementBounds) => void;
  onViewportChange: (updater: (prev: CanvasViewportState) => CanvasViewportState) => void;
  onPushHistory: () => void;
  onCollisionsDetected?: (hasCollision: boolean, collidingIds: string[]) => void;
}

export const EpaperCanvasPanel: React.FC<EpaperCanvasPanelProps> = ({
  page,
  selectedElementId,
  viewportState,
  onSelectElement,
  onUpdateElementBounds,
  onViewportChange,
  onPushHistory,
  onCollisionsDetected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [panState, setPanState] = useState<{ isPanning: boolean; startX: number; startY: number } | null>(null);
  const [draggedBounds, setDraggedBounds] = useState<EpaperPageElementBounds | null>(null);
  const [activeSnapLines, setActiveSnapLines] = useState<SnapGuideLine[]>([]);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Modular grid configuration for snapping
  const grid = useMemo(() => {
    return calculateColumnGrid(page.gridColumns || 8);
  }, [page.gridColumns]);

  // Guidelines pool
  const guidelines = useMemo(() => {
    return generateSnapGuideLines(grid, page.elements || [], selectedElementId || undefined);
  }, [grid, page.elements, selectedElementId]);

  // All collisions on page
  const collisionReport = useMemo(() => {
    const list = (page.elements || []).map((el) => {
      const b = el.id === selectedElementId && draggedBounds ? draggedBounds : el.bounds;
      return { id: el.id, bounds: b };
    });
    return detectAllCollisions(list);
  }, [page.elements, selectedElementId, draggedBounds]);

  useEffect(() => {
    if (onCollisionsDetected) {
      onCollisionsDetected(collisionReport.hasCollision, collisionReport.collidingElementIds);
    }
  }, [collisionReport, onCollisionsDetected]);

  // Spacebar hotkey for Hand pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Render broadsheet canvas on change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    GraphicRenderer.renderBroadsheetPage(canvas, page, {
      scale: 1.0,
      showGrid: viewportState.showGrid,
      showMargins: viewportState.showMargins,
      selectedElementId,
      draggedBounds,
      activeSnapLines,
      collidingElementIds: collisionReport.collidingElementIds,
      renderTarget: viewportState.previewMode ? 'export_print' : 'screen',
    });
  }, [
    page,
    selectedElementId,
    draggedBounds,
    activeSnapLines,
    collisionReport,
    viewportState.showGrid,
    viewportState.showMargins,
    viewportState.previewMode,
  ]);

  // --------------------------------------------------------------------------
  // POINTER INTERACTIONS (Drag, Resize, Pan)
  // --------------------------------------------------------------------------

  const handlePointerDownElement = (
    e: React.PointerEvent,
    element: EpaperPageElement
  ) => {
    onSelectElement(element.id);
    if (viewportState.activeTool === 'hand' || isSpacePressed || element.isLocked) return;
    e.stopPropagation();

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDragState({
      isDragging: true,
      elementId: element.id,
      startX: e.clientX,
      startY: e.clientY,
      initialBounds: { ...element.bounds },
    });
    setDraggedBounds({ ...element.bounds });
    setActiveSnapLines([]);
  };

  const handlePointerDownResize = (
    e: React.PointerEvent,
    handle: ResizeHandleType,
    element: EpaperPageElement
  ) => {
    if (element.isLocked) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setResizeState({
      isResizing: true,
      elementId: element.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialBounds: { ...element.bounds },
    });
    setDraggedBounds({ ...element.bounds });
    setActiveSnapLines([]);
  };

  const handlePointerDownStage = (e: React.PointerEvent) => {
    if (viewportState.activeTool === 'hand' || isSpacePressed) {
      setPanState({
        isPanning: true,
        startX: e.clientX - viewportState.panOffset.x,
        startY: e.clientY - viewportState.panOffset.y,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      onSelectElement(null);
    }
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // 1. Pan interaction
      if (panState?.isPanning) {
        onViewportChange((prev) => ({
          ...prev,
          panOffset: {
            x: e.clientX - panState.startX,
            y: e.clientY - panState.startY,
          },
        }));
        return;
      }

      // 2. Drag translation
      if (dragState?.isDragging) {
        const dx = (e.clientX - dragState.startX) / viewportState.zoom;
        const dy = (e.clientY - dragState.startY) / viewportState.zoom;

        const candidateBounds: EpaperPageElementBounds = {
          ...dragState.initialBounds,
          x: dragState.initialBounds.x + dx,
          y: dragState.initialBounds.y + dy,
        };

        let resolvedBounds = candidateBounds;
        let snapLines: SnapGuideLine[] = [];

        if (viewportState.magneticSnap) {
          const snapRes = snapToBounds(
            candidateBounds,
            guidelines.linesX,
            guidelines.linesY,
            8.0 / viewportState.zoom,
            'DRAG'
          );
          resolvedBounds = snapRes.snappedBounds;
          snapLines = snapRes.activeSnapLines;
        }

        const clamped = clampToBounds(resolvedBounds);
        setDraggedBounds(clamped);
        setActiveSnapLines(snapLines);
        return;
      }

      // 3. Resize interaction
      if (resizeState?.isResizing) {
        const dx = (e.clientX - resizeState.startX) / viewportState.zoom;
        const dy = (e.clientY - resizeState.startY) / viewportState.zoom;
        const init = resizeState.initialBounds;

        let newX = init.x;
        let newY = init.y;
        let newWidth = init.width;
        let newHeight = init.height;

        const isNorth = resizeState.handle.includes('n');
        const isSouth = resizeState.handle.includes('s');
        const isWest = resizeState.handle.includes('w');
        const isEast = resizeState.handle.includes('e');

        if (isEast) newWidth = Math.max(50, init.width + dx);
        if (isSouth) newHeight = Math.max(30, init.height + dy);
        if (isWest) {
          const w = init.width - dx;
          if (w >= 50) {
            newX = init.x + dx;
            newWidth = w;
          }
        }
        if (isNorth) {
          const h = init.height - dy;
          if (h >= 30) {
            newY = init.y + dy;
            newHeight = h;
          }
        }

        const candidateBounds: EpaperPageElementBounds = {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };

        let resolvedBounds = candidateBounds;
        let snapLines: SnapGuideLine[] = [];

        if (viewportState.magneticSnap) {
          const snapRes = snapToBounds(
            candidateBounds,
            guidelines.linesX,
            guidelines.linesY,
            8.0 / viewportState.zoom,
            'RESIZE',
            resizeState.handle
          );
          resolvedBounds = snapRes.snappedBounds;
          snapLines = snapRes.activeSnapLines;
        }

        const clamped = clampToBounds(resolvedBounds);
        setDraggedBounds(clamped);
        setActiveSnapLines(snapLines);
      }
    },
    [
      panState,
      dragState,
      resizeState,
      viewportState.zoom,
      viewportState.magneticSnap,
      guidelines,
      onViewportChange,
    ]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (panState?.isPanning) {
        setPanState(null);
      }

      if (dragState?.isDragging) {
        if (draggedBounds) {
          onUpdateElementBounds(dragState.elementId, draggedBounds);
          onPushHistory();
        }
        setDragState(null);
        setDraggedBounds(null);
        setActiveSnapLines([]);
      }

      if (resizeState?.isResizing) {
        if (draggedBounds) {
          onUpdateElementBounds(resizeState.elementId, draggedBounds);
          onPushHistory();
        }
        setResizeState(null);
        setDraggedBounds(null);
        setActiveSnapLines([]);
      }
    },
    [panState, dragState, resizeState, draggedBounds, onUpdateElementBounds, onPushHistory]
  );

  const resizeHandles: Array<{ handle: ResizeHandleType; cursor: string; style: string }> = [
    { handle: 'nw', cursor: 'nw-resize', style: '-top-1.5 -left-1.5' },
    { handle: 'n', cursor: 'n-resize', style: '-top-1.5 left-1/2 -translate-x-1/2' },
    { handle: 'ne', cursor: 'ne-resize', style: '-top-1.5 -right-1.5' },
    { handle: 'e', cursor: 'e-resize', style: 'top-1/2 -right-1.5 -translate-y-1/2' },
    { handle: 'se', cursor: 'se-resize', style: '-bottom-1.5 -right-1.5' },
    { handle: 's', cursor: 's-resize', style: '-bottom-1.5 left-1/2 -translate-x-1/2' },
    { handle: 'sw', cursor: 'sw-resize', style: '-bottom-1.5 -left-1.5' },
    { handle: 'w', cursor: 'w-resize', style: 'top-1/2 -left-1.5 -translate-y-1/2' },
  ];

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDownStage}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`flex-1 h-full bg-slate-950/90 relative overflow-hidden flex items-center justify-center select-none ${
        viewportState.activeTool === 'hand' || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Zoom / Pan Stage Container */}
      <div
        style={{
          transform: `translate(${viewportState.panOffset.x}px, ${viewportState.panOffset.y}px) scale(${viewportState.zoom})`,
          transformOrigin: 'center center',
          width: `${BROADSHEET_CONSTANTS.PAGE_WIDTH_PT}px`,
          height: `${BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT}px`,
        }}
        className="relative bg-white shadow-2xl transition-transform duration-75 shrink-0"
      >
        {/* Native HTML5 Canvas Renderer */}
        <canvas
          ref={canvasRef}
          width={BROADSHEET_CONSTANTS.PAGE_WIDTH_PT}
          height={BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT}
          className="absolute inset-0 block pointer-events-none"
        />

        {/* Interactive Overlay Layer (Selection boxes & Resize Handles) */}
        {!viewportState.previewMode && (
          <div className="absolute inset-0 pointer-events-auto">
            {(page.elements || []).map((el) => {
              const isSelected = el.id === selectedElementId;
              const isColliding = collisionReport.collidingElementIds.includes(el.id);
              const b = isSelected && draggedBounds ? draggedBounds : el.bounds;

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDownElement(e, el)}
                  style={{
                    left: `${b.x}px`,
                    top: `${b.y}px`,
                    width: `${b.width}px`,
                    height: `${b.height}px`,
                    zIndex: isSelected ? 40 : el.zIndex || 1,
                  }}
                  className={`absolute group ${el.isLocked ? 'cursor-default' : 'cursor-move'} transition-shadow ${
                    isSelected
                      ? el.isLocked
                        ? 'ring-2 ring-amber-500 bg-amber-500/5 shadow-md'
                        : 'ring-2 ring-blue-600 bg-blue-600/5 shadow-md'
                      : isColliding
                      ? 'ring-2 ring-red-500 bg-red-500/10'
                      : 'hover:ring-1 hover:ring-blue-400/80 hover:bg-blue-400/5'
                  }`}
                >
                  {/* Tag Pill */}
                  <div
                    className={`absolute left-0 -top-5 px-1.5 py-0.5 rounded-t text-[9px] font-bold tracking-tight uppercase flex items-center gap-1 ${
                      isSelected
                        ? el.isLocked ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                        : isColliding
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-800 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity'
                    }`}
                  >
                    <span>{el.elementType}</span>
                    <span>• {el.colSpan || 1} Col</span>
                    {el.isLocked && <span title="तत्व लॉक है (Locked)">🔒</span>}
                    {isColliding && <AlertTriangle className="w-2.5 h-2.5 text-white animate-pulse" />}
                  </div>

                  {/* 8 Resize Handles (only on selected element if not locked) */}
                  {isSelected && !el.isLocked &&
                    resizeHandles.map(({ handle, cursor, style }) => (
                      <div
                        key={handle}
                        onPointerDown={(e) => handlePointerDownResize(e, handle, el)}
                        style={{ cursor }}
                        className={`absolute w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow-xs z-50 hover:scale-125 transition-transform ${style}`}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Viewport Status Pill */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none select-none">
        <span>
          आकार: <strong className="text-white">32.9 × 52.0 cm</strong>
        </span>
        <span className="text-slate-600">•</span>
        <span>
          ग्रिड: <strong className="text-blue-400">{page.gridColumns || 8} कॉलम</strong>
        </span>
        <span className="text-slate-600">•</span>
        <span>
          ज़ूम: <strong className="font-mono text-white">{Math.round(viewportState.zoom * 100)}%</strong>
        </span>
        {collisionReport.hasCollision && (
          <>
            <span className="text-slate-600">•</span>
            <span className="text-red-400 font-bold flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{collisionReport.collidingElementIds.length} ओवरलैप</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};
