/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Broadsheet Geometry, Grid, Magnetic Snapping & AABB Collision Engine
 * 
 * Strict Invariant: Pure geometric and algorithmic calculations decoupled from UI runtimes.
 * Broadsheet Dimensions:
 * - Physical: 32.9 cm x 52.0 cm (329 mm x 520 mm)
 * - Printable Area: 29.9 cm x 44.0 cm (299 mm x 440 mm)
 * - Typographic Screen Points (72 pt/inch): 932.6 pt x 1474.0 pt
 * - Printable Points: 847.56 pt x 1247.24 pt
 * - Margins: Left/Right 42.52 pt (15 mm), Top/Bottom 113.38 pt (40 mm)
 * - Gutter: 5 mm = 14.1732 pt
 * - High-Res 300 DPI Raster: 3886 px x 6142 px
 * - Modular Column Grids: 3, 4, 5, 6, 8 columns
 * - Magnetic Snap Threshold: 8 px (8 pt)
 */

import type { EpaperPageElementBounds } from '../types/index.ts';

// ============================================================================
// 1. BROADSHEET GEOMETRY CONSTANTS
// ============================================================================

export const BROADSHEET_CONSTANTS = {
  // Physical Dimensions (mm)
  BROADSHEET_WIDTH_MM: 329,
  BROADSHEET_HEIGHT_MM: 520,
  PRINTABLE_WIDTH_MM: 299,
  PRINTABLE_HEIGHT_MM: 440,
  MARGIN_HORIZONTAL_MM: 15,
  MARGIN_VERTICAL_MM: 40,
  GUTTER_MM: 5,

  // Typographic Points (72 pt / inch; 1 mm = 72 / 25.4 pt = 2.83464567 pt)
  PT_PER_MM: 72 / 25.4,
  PAGE_WIDTH_PT: 932.6,
  PAGE_HEIGHT_PT: 1474.0,
  PRINTABLE_WIDTH_PT: 847.56,
  PRINTABLE_HEIGHT_PT: 1247.24,
  MARGIN_LEFT_PT: 42.52,
  MARGIN_RIGHT_PT: 42.52,
  MARGIN_TOP_PT: 113.38,
  MARGIN_BOTTOM_PT: 113.38,
  GUTTER_WIDTH_PT: 14.1732,

  // 300 DPI Print Export Raster Dimensions
  RASTER_300DPI_WIDTH: 3886,
  RASTER_300DPI_HEIGHT: 6142,

  // Interactive Behavior
  DEFAULT_SNAP_THRESHOLD_PT: 8.0,
  MIN_ELEMENT_WIDTH_PT: 50.0,
  MIN_ELEMENT_HEIGHT_PT: 30.0,
} as const;

export type GridColumnCount = 3 | 4 | 5 | 6 | 8;

export interface ColumnGridConfig {
  columns: GridColumnCount;
  columnWidth: number;
  gutterWidth: number;
  columnOffsets: number[];
  columnRights: number[];
  leftMargin: number;
  printableWidth: number;
}

export type SnapAxis = 'x' | 'y';

export type SnapGuideType =
  | 'MARGIN'
  | 'GRID_LEFT'
  | 'GRID_RIGHT'
  | 'GRID_CENTER'
  | 'ELEMENT_EDGE'
  | 'ELEMENT_CENTER'
  | 'PAGE_CENTER';

export interface SnapGuideLine {
  position: number;
  axis: SnapAxis;
  type: SnapGuideType;
  sourceId?: string;
  label?: string;
}

export interface SnapCoordResult {
  snapped: boolean;
  value: number;
  distance: number;
  guide?: SnapGuideLine;
}

export interface SnapBoundsResult {
  snappedBounds: EpaperPageElementBounds;
  snappedX: boolean;
  snappedY: boolean;
  activeSnapLines: SnapGuideLine[];
  deltaX: number;
  deltaY: number;
}

export interface CollisionItem {
  id: string;
  intersection: EpaperPageElementBounds;
  overlapArea: number;
}

export interface CollisionReport {
  hasCollision: boolean;
  collidingElementIds: string[];
  intersections: CollisionItem[];
  totalOverlapArea: number;
}

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

// ============================================================================
// 2. MODULAR COLUMN GRID CALCULATIONS
// ============================================================================

/**
 * Calculates modular column grid parameters for broadsheet layouts.
 * Supports 3, 4, 5, 6, and 8 column layouts with standard 5mm gutters.
 */
export function calculateColumnGrid(
  columns: GridColumnCount,
  printableWidth: number = BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_PT,
  gutterWidth: number = BROADSHEET_CONSTANTS.GUTTER_WIDTH_PT,
  leftMargin: number = BROADSHEET_CONSTANTS.MARGIN_LEFT_PT
): ColumnGridConfig {
  if (![3, 4, 5, 6, 8].includes(columns)) {
    throw new Error(`ERR_INVALID_GRID_COLS: Column count must be 3, 4, 5, 6, or 8 (received ${columns})`);
  }

  const totalGutters = (columns - 1) * gutterWidth;
  const availableWidth = printableWidth - totalGutters;
  const colWidth = availableWidth / columns;
  const roundedColWidth = Number(colWidth.toFixed(4));

  const columnOffsets: number[] = [];
  const columnRights: number[] = [];

  let curX = leftMargin;
  for (let i = 0; i < columns; i++) {
    const left = Number(curX.toFixed(4));
    const right = Number((left + roundedColWidth).toFixed(4));
    columnOffsets.push(left);
    columnRights.push(right);
    curX += roundedColWidth + gutterWidth;
  }

  return {
    columns,
    columnWidth: roundedColWidth,
    gutterWidth,
    columnOffsets,
    columnRights,
    leftMargin,
    printableWidth,
  };
}

/**
 * Calculates the width in points for an element spanning k columns.
 * Formula: spanWidth = k * colWidth + (k - 1) * gutterWidth
 */
export function getColumnSpanWidth(
  colSpan: number,
  columnWidth: number,
  gutterWidth: number = BROADSHEET_CONSTANTS.GUTTER_WIDTH_PT
): number {
  if (colSpan <= 1) return columnWidth;
  return Number((colSpan * columnWidth + (colSpan - 1) * gutterWidth).toFixed(4));
}

/**
 * Snaps a candidate bounding box to the nearest column span and column index.
 */
export function snapToNearestColumnSpan(
  bounds: EpaperPageElementBounds,
  grid: ColumnGridConfig
): { colIndex: number; colSpan: number; snappedBounds: EpaperPageElementBounds } {
  // Find nearest column left edge
  let bestColIndex = 0;
  let minLeftDist = Infinity;
  for (let i = 0; i < grid.columnOffsets.length; i++) {
    const dist = Math.abs(bounds.x - grid.columnOffsets[i]);
    if (dist < minLeftDist) {
      minLeftDist = dist;
      bestColIndex = i;
    }
  }

  // Find best colSpan
  let bestSpan = 1;
  let minWidthDist = Infinity;
  const maxPossibleSpan = grid.columns - bestColIndex;

  for (let span = 1; span <= maxPossibleSpan; span++) {
    const spanW = getColumnSpanWidth(span, grid.columnWidth, grid.gutterWidth);
    const dist = Math.abs(bounds.width - spanW);
    if (dist < minWidthDist) {
      minWidthDist = dist;
      bestSpan = span;
    }
  }

  const snappedWidth = getColumnSpanWidth(bestSpan, grid.columnWidth, grid.gutterWidth);
  const snappedX = grid.columnOffsets[bestColIndex];

  return {
    colIndex: bestColIndex,
    colSpan: bestSpan,
    snappedBounds: {
      ...bounds,
      x: snappedX,
      width: snappedWidth,
    },
  };
}

// ============================================================================
// 3. MAGNETIC SNAPPING ENGINE
// ============================================================================

/**
 * Generates an array of vertical (X) and horizontal (Y) snap guidelines.
 */
export function generateSnapGuideLines(
  grid: ColumnGridConfig,
  elements: Array<{ id: string; bounds: EpaperPageElementBounds }>,
  excludeId?: string
): { linesX: SnapGuideLine[]; linesY: SnapGuideLine[] } {
  const linesX: SnapGuideLine[] = [];
  const linesY: SnapGuideLine[] = [];

  // 1. Margins & Page Center
  linesX.push({
    position: BROADSHEET_CONSTANTS.MARGIN_LEFT_PT,
    axis: 'x',
    type: 'MARGIN',
    label: 'बायां हाशिया (Left Margin)',
  });
  linesX.push({
    position: BROADSHEET_CONSTANTS.PAGE_WIDTH_PT - BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT,
    axis: 'x',
    type: 'MARGIN',
    label: 'दायां हाशिया (Right Margin)',
  });
  linesX.push({
    position: BROADSHEET_CONSTANTS.PAGE_WIDTH_PT / 2,
    axis: 'x',
    type: 'PAGE_CENTER',
    label: 'पृष्ठ केंद्र (Page Center)',
  });

  linesY.push({
    position: BROADSHEET_CONSTANTS.MARGIN_TOP_PT,
    axis: 'y',
    type: 'MARGIN',
    label: 'शीर्ष हाशिया (Top Margin)',
  });
  linesY.push({
    position: BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT - BROADSHEET_CONSTANTS.MARGIN_BOTTOM_PT,
    axis: 'y',
    type: 'MARGIN',
    label: 'निचला हाशिया (Bottom Margin)',
  });
  linesY.push({
    position: BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT / 2,
    axis: 'y',
    type: 'PAGE_CENTER',
    label: 'पृष्ठ मध्य रेखा (Page Center Y)',
  });

  // 2. Active Grid Column Edges
  for (let i = 0; i < grid.columnOffsets.length; i++) {
    linesX.push({
      position: grid.columnOffsets[i],
      axis: 'x',
      type: 'GRID_LEFT',
      label: `कॉलम ${i + 1} बायां`,
    });
    linesX.push({
      position: grid.columnRights[i],
      axis: 'x',
      type: 'GRID_RIGHT',
      label: `कॉलम ${i + 1} दायां`,
    });
  }

  // 3. Neighboring Elements
  for (const el of elements) {
    if (el.id === excludeId) continue;
    const b = el.bounds;

    // X Guidelines from elements
    linesX.push({
      position: b.x,
      axis: 'x',
      type: 'ELEMENT_EDGE',
      sourceId: el.id,
      label: 'तत्व बायां किनारा',
    });
    linesX.push({
      position: b.x + b.width,
      axis: 'x',
      type: 'ELEMENT_EDGE',
      sourceId: el.id,
      label: 'तत्व दायां किनारा',
    });
    linesX.push({
      position: b.x + b.width / 2,
      axis: 'x',
      type: 'ELEMENT_CENTER',
      sourceId: el.id,
      label: 'तत्व केंद्र',
    });
    // Element gutter offsets
    linesX.push({
      position: b.x - grid.gutterWidth,
      axis: 'x',
      type: 'ELEMENT_EDGE',
      sourceId: el.id,
      label: 'गटर ऑफसेट',
    });
    linesX.push({
      position: b.x + b.width + grid.gutterWidth,
      axis: 'x',
      type: 'ELEMENT_EDGE',
      sourceId: el.id,
      label: 'गटर ऑफसेट',
    });

    // Y Guidelines from elements
    linesY.push({
      position: b.y,
      axis: 'y',
      type: 'ELEMENT_EDGE',
      sourceId: el.id,
      label: 'तत्व शीर्ष किनारा',
    });
    linesY.push({
      position: b.y + b.height,
      axis: 'y',
      type: 'ELEMENT_EDGE',
      sourceId: el.id,
      label: 'तत्व निचला किनारा',
    });
    linesY.push({
      position: b.y + b.height / 2,
      axis: 'y',
      type: 'ELEMENT_CENTER',
      sourceId: el.id,
      label: 'तत्व क्षैतिज केंद्र',
    });
    // Gutter offsets Y
    linesY.push({
      position: b.y - grid.gutterWidth,
      axis: 'y',
      type: 'ELEMENT_EDGE',
      sourceId: el.id,
      label: 'गटर ऑफसेट Y',
    });
    linesY.push({
      position: b.y + b.height + grid.gutterWidth,
      axis: 'y',
      type: 'ELEMENT_EDGE',
      sourceId: el.id,
      label: 'गटर ऑफसेट Y',
    });
  }

  return { linesX, linesY };
}

/**
 * Snaps a single coordinate to the closest guideline within the given threshold.
 */
export function snapCoordinate(
  coord: number,
  gridLines: number[] | SnapGuideLine[],
  threshold: number = BROADSHEET_CONSTANTS.DEFAULT_SNAP_THRESHOLD_PT
): SnapCoordResult {
  let closest = coord;
  let minDistance = Infinity;
  let matchedGuide: SnapGuideLine | undefined = undefined;

  for (const item of gridLines) {
    const pos = typeof item === 'number' ? item : item.position;
    const dist = Math.abs(coord - pos);
    if (dist < minDistance) {
      minDistance = dist;
      closest = pos;
      if (typeof item !== 'number') matchedGuide = item;
    }
  }

  if (minDistance <= threshold) {
    return {
      snapped: true,
      value: closest,
      distance: minDistance,
      guide: matchedGuide,
    };
  }

  return {
    snapped: false,
    value: coord,
    distance: minDistance,
  };
}

/**
 * Snaps candidate bounding box during DRAG or RESIZE operations.
 * Evaluates candidate edges (left, center, right, top, center, bottom) against snap guidelines.
 */
export function snapToBounds(
  target: EpaperPageElementBounds,
  guidelinesX: SnapGuideLine[],
  guidelinesY: SnapGuideLine[],
  snapThreshold: number = BROADSHEET_CONSTANTS.DEFAULT_SNAP_THRESHOLD_PT,
  operation: 'DRAG' | 'RESIZE' = 'DRAG',
  resizeHandle?: ResizeHandleType,
  minWidth: number = BROADSHEET_CONSTANTS.MIN_ELEMENT_WIDTH_PT,
  minHeight: number = BROADSHEET_CONSTANTS.MIN_ELEMENT_HEIGHT_PT
): SnapBoundsResult {
  let resultBounds = { ...target };
  let snappedX = false;
  let snappedY = false;
  let deltaX = 0;
  let deltaY = 0;
  const activeSnapLines: SnapGuideLine[] = [];

  if (operation === 'DRAG') {
    // 1. Evaluate X anchors: Left, Right, Center
    const leftSnap = snapCoordinate(target.x, guidelinesX, snapThreshold);
    const rightSnap = snapCoordinate(target.x + target.width, guidelinesX, snapThreshold);
    const centerSnap = snapCoordinate(target.x + target.width / 2, guidelinesX, snapThreshold);

    // Pick closest snap among X anchors
    let bestXDist = Infinity;
    let chosenXDelta = 0;
    let chosenXGuide: SnapGuideLine | undefined = undefined;

    if (leftSnap.snapped && leftSnap.distance < bestXDist) {
      bestXDist = leftSnap.distance;
      chosenXDelta = leftSnap.value - target.x;
      chosenXGuide = leftSnap.guide;
    }
    if (rightSnap.snapped && rightSnap.distance < bestXDist) {
      bestXDist = rightSnap.distance;
      chosenXDelta = rightSnap.value - (target.x + target.width);
      chosenXGuide = rightSnap.guide;
    }
    if (centerSnap.snapped && centerSnap.distance < bestXDist) {
      bestXDist = centerSnap.distance;
      chosenXDelta = centerSnap.value - (target.x + target.width / 2);
      chosenXGuide = centerSnap.guide;
    }

    if (bestXDist <= snapThreshold) {
      resultBounds.x = Number((target.x + chosenXDelta).toFixed(2));
      deltaX = chosenXDelta;
      snappedX = true;
      if (chosenXGuide) activeSnapLines.push(chosenXGuide);
    }

    // 2. Evaluate Y anchors: Top, Bottom, Center
    const topSnap = snapCoordinate(target.y, guidelinesY, snapThreshold);
    const bottomSnap = snapCoordinate(target.y + target.height, guidelinesY, snapThreshold);
    const centerYSnap = snapCoordinate(target.y + target.height / 2, guidelinesY, snapThreshold);

    let bestYDist = Infinity;
    let chosenYDelta = 0;
    let chosenYGuide: SnapGuideLine | undefined = undefined;

    if (topSnap.snapped && topSnap.distance < bestYDist) {
      bestYDist = topSnap.distance;
      chosenYDelta = topSnap.value - target.y;
      chosenYGuide = topSnap.guide;
    }
    if (bottomSnap.snapped && bottomSnap.distance < bestYDist) {
      bestYDist = bottomSnap.distance;
      chosenYDelta = bottomSnap.value - (target.y + target.height);
      chosenYGuide = bottomSnap.guide;
    }
    if (centerYSnap.snapped && centerYSnap.distance < bestYDist) {
      bestYDist = centerYSnap.distance;
      chosenYDelta = centerYSnap.value - (target.y + target.height / 2);
      chosenYGuide = centerYSnap.guide;
    }

    if (bestYDist <= snapThreshold) {
      resultBounds.y = Number((target.y + chosenYDelta).toFixed(2));
      deltaY = chosenYDelta;
      snappedY = true;
      if (chosenYGuide) activeSnapLines.push(chosenYGuide);
    }
  } else if (operation === 'RESIZE' && resizeHandle) {
    // RESIZE handles: only snap the active dragged edges
    const isNorth = resizeHandle.includes('n');
    const isSouth = resizeHandle.includes('s');
    const isWest = resizeHandle.includes('w');
    const isEast = resizeHandle.includes('e');

    // Snap West edge (X is moving, right edge is pinned)
    if (isWest) {
      const snap = snapCoordinate(target.x, guidelinesX, snapThreshold);
      if (snap.snapped) {
        const pinnedRight = target.x + target.width;
        const newWidth = pinnedRight - snap.value;
        if (newWidth >= minWidth) {
          resultBounds.x = snap.value;
          resultBounds.width = Number(newWidth.toFixed(2));
          snappedX = true;
          if (snap.guide) activeSnapLines.push(snap.guide);
        }
      }
    }

    // Snap East edge (X is pinned, width changes)
    if (isEast) {
      const snap = snapCoordinate(target.x + target.width, guidelinesX, snapThreshold);
      if (snap.snapped) {
        const newWidth = snap.value - target.x;
        if (newWidth >= minWidth) {
          resultBounds.width = Number(newWidth.toFixed(2));
          snappedX = true;
          if (snap.guide) activeSnapLines.push(snap.guide);
        }
      }
    }

    // Snap North edge (Y is moving, bottom edge is pinned)
    if (isNorth) {
      const snap = snapCoordinate(target.y, guidelinesY, snapThreshold);
      if (snap.snapped) {
        const pinnedBottom = target.y + target.height;
        const newHeight = pinnedBottom - snap.value;
        if (newHeight >= minHeight) {
          resultBounds.y = snap.value;
          resultBounds.height = Number(newHeight.toFixed(2));
          snappedY = true;
          if (snap.guide) activeSnapLines.push(snap.guide);
        }
      }
    }

    // Snap South edge (Y is pinned, height changes)
    if (isSouth) {
      const snap = snapCoordinate(target.y + target.height, guidelinesY, snapThreshold);
      if (snap.snapped) {
        const newHeight = snap.value - target.y;
        if (newHeight >= minHeight) {
          resultBounds.height = Number(newHeight.toFixed(2));
          snappedY = true;
          if (snap.guide) activeSnapLines.push(snap.guide);
        }
      }
    }
  }

  return {
    snappedBounds: resultBounds,
    snappedX,
    snappedY,
    activeSnapLines,
    deltaX,
    deltaY,
  };
}

// ============================================================================
// 4. 2D AABB COLLISION DETECTION ENGINE
// ============================================================================

/**
 * Checks 2D Axis-Aligned Bounding Box (AABB) collision between two boxes.
 * With tolerance (default 0.5pt):
 * Touching borders (sharing an edge, distance = 0) do NOT collide.
 */
export function checkAABBCollision(
  box1: EpaperPageElementBounds,
  box2: EpaperPageElementBounds,
  tolerance = 0.5
): boolean {
  const isSeparated =
    box1.x + box1.width <= box2.x + tolerance ||
    box2.x + box2.width <= box1.x + tolerance ||
    box1.y + box1.height <= box2.y + tolerance ||
    box2.y + box2.height <= box1.y + tolerance;
  return !isSeparated;
}

/**
 * Computes the intersection rectangle between two colliding bounding boxes.
 * Returns null if the boxes do not intersect.
 */
export function getAABBIntersection(
  box1: EpaperPageElementBounds,
  box2: EpaperPageElementBounds
): EpaperPageElementBounds | null {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  const width = x2 - x1;
  const height = y2 - y1;

  if (width > 0 && height > 0) {
    return {
      x: Number(x1.toFixed(2)),
      y: Number(y1.toFixed(2)),
      width: Number(width.toFixed(2)),
      height: Number(height.toFixed(2)),
    };
  }
  return null;
}

/**
 * Detects all collisions between a target element and an array of layout elements.
 */
export function detectCollisions(
  target: EpaperPageElementBounds,
  elements: Array<{ id: string; bounds: EpaperPageElementBounds }>,
  ignoreId?: string
): CollisionReport {
  const collidingElementIds: string[] = [];
  const intersections: CollisionItem[] = [];
  let totalOverlapArea = 0;

  for (const el of elements) {
    if (el.id === ignoreId) continue;
    if (checkAABBCollision(target, el.bounds)) {
      collidingElementIds.push(el.id);
      const intersection = getAABBIntersection(target, el.bounds);
      if (intersection) {
        const area = Number((intersection.width * intersection.height).toFixed(2));
        totalOverlapArea += area;
        intersections.push({
          id: el.id,
          intersection,
          overlapArea: area,
        });
      }
    }
  }

  return {
    hasCollision: collidingElementIds.length > 0,
    collidingElementIds,
    intersections,
    totalOverlapArea: Number(totalOverlapArea.toFixed(2)),
  };
}

/**
 * Evaluates all-pairs collision across a list of elements.
 */
export function detectAllCollisions(
  elements: Array<{ id: string; bounds: EpaperPageElementBounds }>
): CollisionReport {
  const collidingIds = new Set<string>();
  const intersections: CollisionItem[] = [];
  let totalOverlapArea = 0;

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];
      if (checkAABBCollision(a.bounds, b.bounds)) {
        collidingIds.add(a.id);
        collidingIds.add(b.id);
        const intersection = getAABBIntersection(a.bounds, b.bounds);
        if (intersection) {
          const area = Number((intersection.width * intersection.height).toFixed(2));
          totalOverlapArea += area;
          intersections.push({
            id: `${a.id}:${b.id}`,
            intersection,
            overlapArea: area,
          });
        }
      }
    }
  }

  return {
    hasCollision: collidingIds.size > 0,
    collidingElementIds: Array.from(collidingIds),
    intersections,
    totalOverlapArea: Number(totalOverlapArea.toFixed(2)),
  };
}

// ============================================================================
// 5. BOUNDARY VALIDATION & CLAMPING
// ============================================================================

/**
 * Clamps element bounds within the full canvas dimensions.
 */
export function clampToBounds(
  bounds: EpaperPageElementBounds,
  canvasWidth = BROADSHEET_CONSTANTS.PAGE_WIDTH_PT,
  canvasHeight = BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT
): EpaperPageElementBounds {
  let { x, y, width, height } = bounds;

  if (x < 0) x = 0;
  if (y < 0) y = 0;

  if (x + width > canvasWidth) {
    if (x >= canvasWidth) {
      x = Math.max(0, canvasWidth - 50);
      width = 50;
    } else {
      width = Math.max(10, canvasWidth - x);
    }
  }

  if (y + height > canvasHeight) {
    if (y >= canvasHeight) {
      y = Math.max(0, canvasHeight - 30);
      height = 30;
    } else {
      height = Math.max(10, canvasHeight - y);
    }
  }

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
  };
}

/**
 * Validates element bounds for numeric safety and non-zero dimensions.
 */
export function validateBounds(bounds: any): boolean {
  if (
    !bounds ||
    typeof bounds.width !== 'number' ||
    typeof bounds.height !== 'number' ||
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height)
  ) {
    throw new Error('ERR_INVALID_BOUNDS: Element width and height must be positive numbers.');
  }
  return true;
}

/**
 * Validates element bounds against printable margins and page boundaries.
 */
export function validateElementBounds(
  bounds: EpaperPageElementBounds,
  pageWidth = BROADSHEET_CONSTANTS.PAGE_WIDTH_PT,
  pageHeight = BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT,
  margins = {
    left: BROADSHEET_CONSTANTS.MARGIN_LEFT_PT,
    right: BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT,
    top: BROADSHEET_CONSTANTS.MARGIN_TOP_PT,
    bottom: BROADSHEET_CONSTANTS.MARGIN_BOTTOM_PT,
  }
) {
  validateBounds(bounds);

  const overflow = {
    left: Number(Math.max(0, margins.left - bounds.x).toFixed(2)),
    right: Number(Math.max(0, bounds.x + bounds.width - (pageWidth - margins.right)).toFixed(2)),
    top: Number(Math.max(0, margins.top - bounds.y).toFixed(2)),
    bottom: Number(Math.max(0, bounds.y + bounds.height - (pageHeight - margins.bottom)).toFixed(2)),
  };

  const isWithinPrintableArea =
    overflow.left === 0 && overflow.right === 0 && overflow.top === 0 && overflow.bottom === 0;

  const isWithinPage =
    bounds.x >= 0 &&
    bounds.y >= 0 &&
    bounds.x + bounds.width <= pageWidth &&
    bounds.y + bounds.height <= pageHeight;

  return {
    isWithinPrintableArea,
    isWithinPage,
    overflow,
  };
}

// ============================================================================
// 6. OBJECT-ORIENTED BROADSHEET GRID ENGINE
// ============================================================================

export class BroadsheetGridEngine {
  public static readonly BROADSHEET_WIDTH_MM = BROADSHEET_CONSTANTS.BROADSHEET_WIDTH_MM;
  public static readonly BROADSHEET_HEIGHT_MM = BROADSHEET_CONSTANTS.BROADSHEET_HEIGHT_MM;
  public static readonly PRINTABLE_WIDTH_MM = BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_MM;
  public static readonly PRINTABLE_HEIGHT_MM = BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_MM;
  public static readonly BROADSHEET_WIDTH_PT = BROADSHEET_CONSTANTS.PAGE_WIDTH_PT;
  public static readonly BROADSHEET_HEIGHT_PT = BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT;
  public static readonly PRINTABLE_WIDTH_PT = BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_PT;
  public static readonly PRINTABLE_HEIGHT_PT = BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_PT;
  public static readonly BROADSHEET_WIDTH_300DPI = BROADSHEET_CONSTANTS.RASTER_300DPI_WIDTH;
  public static readonly BROADSHEET_HEIGHT_300DPI = BROADSHEET_CONSTANTS.RASTER_300DPI_HEIGHT;
  public static readonly GUTTER_MM = BROADSHEET_CONSTANTS.GUTTER_MM;
  public static readonly GUTTER_PT = BROADSHEET_CONSTANTS.GUTTER_WIDTH_PT;
  public static readonly SNAP_THRESHOLD_PX = BROADSHEET_CONSTANTS.DEFAULT_SNAP_THRESHOLD_PT;
  public static readonly PT_PER_MM = BROADSHEET_CONSTANTS.PT_PER_MM;

  public static getDimensions() {
    return {
      broadsheetWidthMm: this.BROADSHEET_WIDTH_MM,
      broadsheetHeightMm: this.BROADSHEET_HEIGHT_MM,
      printableWidthMm: this.PRINTABLE_WIDTH_MM,
      printableHeightMm: this.PRINTABLE_HEIGHT_MM,
      broadsheetWidthPt: this.BROADSHEET_WIDTH_PT,
      broadsheetHeightPt: this.BROADSHEET_HEIGHT_PT,
      printableWidthPt: this.PRINTABLE_WIDTH_PT,
      printableHeightPt: this.PRINTABLE_HEIGHT_PT,
      marginLeftPt: BROADSHEET_CONSTANTS.MARGIN_LEFT_PT,
      marginRightPt: BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT,
      marginTopPt: BROADSHEET_CONSTANTS.MARGIN_TOP_PT,
      marginBottomPt: BROADSHEET_CONSTANTS.MARGIN_BOTTOM_PT,
      raster300DpiWidth: this.BROADSHEET_WIDTH_300DPI,
      raster300DpiHeight: this.BROADSHEET_HEIGHT_300DPI,
      gutterMm: this.GUTTER_MM,
      gutterPt: this.GUTTER_PT,
      snapThresholdPx: this.SNAP_THRESHOLD_PX,
    };
  }

  public static calculateColumnWidth(
    numCols: number,
    printableWidth = this.PRINTABLE_WIDTH_MM,
    gutter = this.GUTTER_MM
  ): number {
    if (![3, 4, 5, 6, 8].includes(numCols)) {
      throw new Error(`ERR_INVALID_GRID_COLS: Column count must be 3, 4, 5, 6, or 8 (received ${numCols})`);
    }
    const totalGutters = (numCols - 1) * gutter;
    const availableWidth = printableWidth - totalGutters;
    const colWidth = availableWidth / numCols;
    return Number(colWidth.toFixed(2));
  }

  public static getGridLinePositions(
    numCols: number,
    printableWidth = this.PRINTABLE_WIDTH_MM,
    gutter = this.GUTTER_MM,
    margin = 15
  ): number[] {
    const colWidth = this.calculateColumnWidth(numCols, printableWidth, gutter);
    const lines: number[] = [];
    let currentX = margin;
    for (let i = 0; i < numCols; i++) {
      lines.push(Number(currentX.toFixed(2))); // Left col boundary
      currentX += colWidth;
      lines.push(Number(currentX.toFixed(2))); // Right col boundary
      currentX += gutter;
    }
    return lines;
  }

  public static snapCoordinate(
    coord: number,
    gridLines: number[],
    threshold = this.SNAP_THRESHOLD_PX
  ): { snapped: boolean; value: number; distance: number } {
    return snapCoordinate(coord, gridLines, threshold);
  }

  public static detectAabbCollision(
    rectA: EpaperPageElementBounds,
    rectB: EpaperPageElementBounds
  ): boolean {
    // 2D AABB collision detection. Touching boundaries sharing an edge are NOT colliding.
    const isSeparated =
      rectA.x + rectA.width <= rectB.x ||
      rectB.x + rectB.width <= rectA.x ||
      rectA.y + rectA.height <= rectB.y ||
      rectB.y + rectB.height <= rectA.y;
    return !isSeparated;
  }

  public static clampToBounds(
    bounds: EpaperPageElementBounds,
    canvasWidth = this.BROADSHEET_WIDTH_PT,
    canvasHeight = this.BROADSHEET_HEIGHT_PT
  ): EpaperPageElementBounds {
    return clampToBounds(bounds, canvasWidth, canvasHeight);
  }

  public static validateBounds(bounds: any): boolean {
    return validateBounds(bounds);
  }

  public static calculateColumnGrid(
    columns: GridColumnCount,
    printableWidth?: number,
    gutterWidth?: number,
    leftMargin?: number
  ): ColumnGridConfig {
    return calculateColumnGrid(columns, printableWidth, gutterWidth, leftMargin);
  }

  public static getColumnSpanWidth(
    colSpan: number,
    columnWidth: number,
    gutterWidth?: number
  ): number {
    return getColumnSpanWidth(colSpan, columnWidth, gutterWidth);
  }

  public static snapToBounds(
    target: EpaperPageElementBounds,
    guidelinesX: SnapGuideLine[],
    guidelinesY: SnapGuideLine[],
    snapThreshold?: number,
    operation?: 'DRAG' | 'RESIZE',
    resizeHandle?: ResizeHandleType
  ): SnapBoundsResult {
    return snapToBounds(target, guidelinesX, guidelinesY, snapThreshold, operation, resizeHandle);
  }

  public static detectCollisions(
    target: EpaperPageElementBounds,
    elements: Array<{ id: string; bounds: EpaperPageElementBounds }>,
    ignoreId?: string
  ): CollisionReport {
    return detectCollisions(target, elements, ignoreId);
  }
}
