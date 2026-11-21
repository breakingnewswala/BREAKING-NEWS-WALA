import type { EpaperPageDoc, EpaperPageElement, EpaperPageElementBounds } from '../../../types';
import type { ResizeHandleType, SnapGuideLine, GridColumnCount } from '../../../utils/epaperLayout';

export type { ResizeHandleType, SnapGuideLine, GridColumnCount };

export interface DragState {
  isDragging: boolean;
  elementId: string;
  startX: number;
  startY: number;
  initialBounds: EpaperPageElementBounds;
}

export interface ResizeState {
  isResizing: boolean;
  elementId: string;
  handle: ResizeHandleType;
  startX: number;
  startY: number;
  initialBounds: EpaperPageElementBounds;
}

export interface CanvasViewportState {
  zoom: number;            // 0.25 to 2.0
  panOffset: { x: number; y: number };
  isPanning: boolean;
  panStart: { x: number; y: number };
  activeTool: 'select' | 'hand' | 'brush';
  brushColor?: string;
  brushSize?: number;
  brushOpacity?: number;
  brushType?: 'pen' | 'highlighter';
  showGrid: boolean;
  magneticSnap: boolean;
  showMargins: boolean;
  previewMode: boolean;    // false = wireframe/handles, true = live broadsheet render
  designerMode?: 'AUTO' | 'ASSISTED' | 'MANUAL'; // 3 modes of Page Designer
  activeHeaderTemplateId?: string;
}

export interface HistoryFrame {
  elements: EpaperPageElement[];
  gridColumns: GridColumnCount;
  timestamp: number;
  description?: string;
}
