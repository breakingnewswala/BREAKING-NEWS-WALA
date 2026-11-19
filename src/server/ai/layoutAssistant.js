/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * AI Broadsheet Layout Assistant & 2D Grid Bin-Packing Engine
 * Grounded in docs/11-Architecture.md, docs/17-Agents.md, and docs/07-Design.md
 */

// Broadsheet constants in standard typographic points (pt)
// 32.9 cm x 52.0 cm broadsheet, margins: 15mm (42.52 pt) sides, 40mm (113.38 pt) top/bottom
export const BROADSHEET_LAYOUT_CONSTANTS = {
  PAGE_WIDTH_PT: 932.6,
  PAGE_HEIGHT_PT: 1474.0,
  MARGIN_LEFT_PT: 42.52,
  MARGIN_RIGHT_PT: 42.52,
  MARGIN_TOP_PT: 113.38,
  MARGIN_BOTTOM_PT: 113.38,
  PRINTABLE_WIDTH_PT: 847.56,
  PRINTABLE_HEIGHT_PT: 1247.24,
  GUTTER_PT: 14.1732, // 5mm
};

/**
 * 2D Axis-Aligned Bounding Box (AABB) collision check
 */
export function checkAABBCollision(box1, box2, tolerance = 0.5) {
  if (!box1 || !box2) return false;
  return (
    box1.x < box2.x + box2.width - tolerance &&
    box1.x + box1.width > box2.x + tolerance &&
    box1.y < box2.y + box2.height - tolerance &&
    box1.y + box1.height > box2.y + tolerance
  );
}

/**
 * Calculates column grid metrics for a given number of columns
 */
export function calculateColumnGrid(columns = 8) {
  const safeCols = Math.max(3, Math.min(8, Math.round(columns)));
  const { PRINTABLE_WIDTH_PT, GUTTER_PT, MARGIN_LEFT_PT } = BROADSHEET_LAYOUT_CONSTANTS;
  const totalGutters = (safeCols - 1) * GUTTER_PT;
  const colWidth = (PRINTABLE_WIDTH_PT - totalGutters) / safeCols;

  const colOffsets = [];
  for (let i = 0; i < safeCols; i++) {
    colOffsets.push(MARGIN_LEFT_PT + i * (colWidth + GUTTER_PT));
  }

  return {
    columns: safeCols,
    colWidth,
    gutter: GUTTER_PT,
    colOffsets,
    getColX: (colIndex) => colOffsets[Math.max(0, Math.min(safeCols - 1, colIndex))],
    getSpanWidth: (span) => {
      const s = Math.max(1, Math.min(safeCols, span));
      return s * colWidth + (s - 1) * GUTTER_PT;
    },
  };
}

export class LayoutAssistantEngine {
  static getProviderInfo() {
    return {
      model: 'bnw-mock-v1',
      provider: 'bnw-local-layout-assistant',
      isFallback: true,
      offlineReady: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Automatically arranges elements on a broadsheet page using 2D grid bin-packing,
   * magnetic column snapping, and collision prevention.
   *
   * @param {object} params
   * @param {Array<object>} params.elements - Page elements to arrange
   * @param {number} [params.gridColumns=8] - Number of modular columns (3, 4, 5, 6, 8)
   * @param {string} [params.pageType='FRONT_PAGE'] - Page section/type
   * @param {boolean} [params.hasMasthead=false] - Whether page includes top masthead
   * @param {Array<object>} [params.reservedAdSlots=[]] - Pre-reserved ad slots
   * @returns {object} Layout result with placed elements and statistics
   */
  static autoArrangeLayout({
    elements = [],
    gridColumns = 8,
    pageType = 'FRONT_PAGE',
    hasMasthead = false,
    reservedAdSlots = [],
  } = {}) {
    const safeGridColumns = [3, 4, 5, 6, 8].includes(gridColumns) ? gridColumns : 8;
    const grid = calculateColumnGrid(safeGridColumns);
    const { MARGIN_TOP_PT, MARGIN_BOTTOM_PT, PAGE_HEIGHT_PT, PRINTABLE_WIDTH_PT, MARGIN_LEFT_PT } =
      BROADSHEET_LAYOUT_CONSTANTS;

    const printableBottomY = PAGE_HEIGHT_PT - MARGIN_BOTTOM_PT;

    if (!Array.isArray(elements) || elements.length === 0) {
      return {
        success: true,
        elements: [],
        unplacedElements: [],
        gridColumns: safeGridColumns,
        stats: {
          totalElements: 0,
          placedCount: 0,
          unplacedCount: 0,
          collisionFree: true,
          totalHeightUsedPt: 0,
        },
        metadata: this.getProviderInfo(),
      };
    }

    // Skyline tracker for each column index (0 to safeGridColumns - 1)
    const colY = new Array(safeGridColumns).fill(MARGIN_TOP_PT);
    const placedElements = [];

    // Clone element list to avoid mutating caller inputs
    const elementsToPlace = elements.map((el, idx) => ({
      ...el,
      id: el.id || `el-${Date.now()}-${idx}`,
      bounds: el.bounds ? { ...el.bounds } : { x: 0, y: 0, width: 200, height: 150 },
    }));

    // 1. Check for Masthead (or if pageType is FRONT_PAGE with hasMasthead)
    const mastheadIdx = elementsToPlace.findIndex(
      (el) => el.elementType === 'MASTHEAD' || el.type === 'MASTHEAD'
    );
    const needsMasthead = hasMasthead || pageType === 'FRONT_PAGE' || mastheadIdx !== -1;

    let mastheadEl = null;
    if (mastheadIdx !== -1) {
      mastheadEl = elementsToPlace.splice(mastheadIdx, 1)[0];
    } else if (hasMasthead) {
      mastheadEl = {
        id: `masthead-${Date.now()}`,
        elementType: 'MASTHEAD',
        colSpan: safeGridColumns,
        customHeadline: 'ब्रेकिंग न्यूज़ वाला',
      };
    }

    if (mastheadEl) {
      const mastheadH = 110;
      mastheadEl.bounds = {
        x: Math.round(MARGIN_LEFT_PT * 100) / 100,
        y: Math.round(MARGIN_TOP_PT * 100) / 100,
        width: Math.round(PRINTABLE_WIDTH_PT * 100) / 100,
        height: mastheadH,
      };
      mastheadEl.colSpan = safeGridColumns;
      placedElements.push(mastheadEl);

      const nextY = MARGIN_TOP_PT + mastheadH + grid.gutter;
      for (let c = 0; c < safeGridColumns; c++) {
        colY[c] = nextY;
      }
    }

    // 2. Identify and place Bottom/Footer Ads if present
    const footerAdIdx = elementsToPlace.findIndex((el) => {
      const type = el.elementType || el.type;
      const slot = el.adSlotType || el.slotType;
      return type === 'AD' && (slot === 'BOTTOM_STRIP' || slot === 'FOOTER');
    });

    let footerAdEl = null;
    let maxContentY = printableBottomY;
    if (footerAdIdx !== -1) {
      footerAdEl = elementsToPlace.splice(footerAdIdx, 1)[0];
      const footerH = Math.min(footerAdEl.bounds?.height || 140, 200);
      const footerY = printableBottomY - footerH;
      footerAdEl.bounds = {
        x: Math.round(MARGIN_LEFT_PT * 100) / 100,
        y: Math.round(footerY * 100) / 100,
        width: Math.round(PRINTABLE_WIDTH_PT * 100) / 100,
        height: footerH,
      };
      footerAdEl.colSpan = safeGridColumns;
      maxContentY = footerY - grid.gutter;
    }

    // Also check reservedAdSlots for footer ad if not already identified
    if (!footerAdEl && Array.isArray(reservedAdSlots) && reservedAdSlots.length > 0) {
      const resFooterIdx = reservedAdSlots.findIndex((el) => {
        const type = el.elementType || el.type;
        const slot = el.adSlotType || el.slotType;
        return (type === 'AD' || !type) && (slot === 'BOTTOM_STRIP' || slot === 'FOOTER');
      });
      if (resFooterIdx !== -1) {
        const ad = reservedAdSlots[resFooterIdx];
        const footerH = Math.min(ad.bounds?.height || 140, 200);
        const footerY = printableBottomY - footerH;
        footerAdEl = {
          ...ad,
          id: ad.id || `ad-footer-reserved-${Date.now()}`,
          elementType: 'AD',
          adSlotType: ad.adSlotType || ad.slotType || 'BOTTOM_STRIP',
          bounds: {
            x: Math.round(MARGIN_LEFT_PT * 100) / 100,
            y: Math.round(footerY * 100) / 100,
            width: Math.round(PRINTABLE_WIDTH_PT * 100) / 100,
            height: footerH,
          },
          colSpan: safeGridColumns,
        };
        maxContentY = footerY - grid.gutter;
      }
    }

    // 3. Sort remaining elements by visual newspaper hierarchy
    const priorityWeight = (el) => {
      const type = el.elementType || el.type;
      const role = el.role || '';
      if (role === 'LEAD') return 1;
      if (type === 'HEADLINE') return 2;
      if (type === 'IMAGE' && role === 'LEAD') return 3;
      if (role === 'SECOND_LEAD') return 4;
      if (type === 'STORY') return 5;
      if (type === 'IMAGE') return 6;
      if (type === 'COLUMN') return 7;
      if (type === 'AD') return 8;
      return 9;
    };

    elementsToPlace.sort((a, b) => priorityWeight(a) - priorityWeight(b));

    // 4. Place remaining elements using skyline packing
    const unplacedElements = [];
    const MIN_ALLOWABLE_HEIGHT = 60;

    for (const el of elementsToPlace) {
      const type = el.elementType || el.type || 'STORY';
      const role = el.role || '';

      // Determine appropriate column span
      let colSpan = el.colSpan;
      if (!colSpan || colSpan > safeGridColumns) {
        if (role === 'LEAD' || type === 'HEADLINE') {
          colSpan = safeGridColumns >= 6 ? 6 : safeGridColumns;
        } else if (type === 'IMAGE') {
          colSpan = Math.min(4, safeGridColumns);
        } else if (type === 'COLUMN') {
          colSpan = Math.min(3, safeGridColumns);
        } else if (type === 'AD') {
          colSpan = Math.min(2, safeGridColumns);
        } else {
          colSpan = safeGridColumns >= 6 ? 3 : 2;
        }
      }
      colSpan = Math.max(1, Math.min(safeGridColumns, colSpan));

      // Determine appropriate element height
      let height = el.bounds?.height;
      if (!height || height <= 20) {
        if (type === 'HEADLINE') height = 110;
        else if (type === 'IMAGE') height = 220;
        else if (type === 'COLUMN') height = 340;
        else if (type === 'AD') height = 180;
        else height = 260;
      }
      // Clamp element height so it doesn't exceed available printable height
      height = Math.min(height, Math.max(MIN_ALLOWABLE_HEIGHT, maxContentY - MARGIN_TOP_PT));

      // Find best start column (minimized maximum Y across the span)
      let bestStartCol = -1;
      let minSpanY = Infinity;

      for (let c = 0; c <= safeGridColumns - colSpan; c++) {
        let maxSpanY = 0;
        for (let s = 0; s < colSpan; s++) {
          if (colY[c + s] > maxSpanY) maxSpanY = colY[c + s];
        }

        if (maxSpanY < minSpanY) {
          minSpanY = maxSpanY;
          bestStartCol = c;
        }
      }

      // Check if element fits vertically; do NOT place if minSpanY >= maxContentY or remaining space < min height
      const availableSpace = maxContentY - minSpanY;
      if (bestStartCol === -1 || minSpanY >= maxContentY || availableSpace < MIN_ALLOWABLE_HEIGHT) {
        unplacedElements.push(el);
        continue;
      }

      const placedY = Math.round(minSpanY * 100) / 100;
      const remainingHeight = Math.max(0, Math.round((maxContentY - placedY) * 100) / 100);
      if (remainingHeight < MIN_ALLOWABLE_HEIGHT) {
        unplacedElements.push(el);
        continue;
      }

      const clampedHeight = Math.round(Math.min(height, remainingHeight) * 100) / 100;
      if (clampedHeight < MIN_ALLOWABLE_HEIGHT || placedY + clampedHeight > maxContentY + 0.01) {
        unplacedElements.push(el);
        continue;
      }

      const placedX = Math.round(grid.getColX(bestStartCol) * 100) / 100;
      const placedWidth = Math.round(grid.getSpanWidth(colSpan) * 100) / 100;

      const candidateBounds = {
        x: placedX,
        y: placedY,
        width: placedWidth,
        height: clampedHeight,
      };

      // Strict collision avoidance against all placed elements and footer ad
      let collidesWithPlaced = false;
      for (const placed of placedElements) {
        if (checkAABBCollision(candidateBounds, placed.bounds, 0.5)) {
          collidesWithPlaced = true;
          break;
        }
      }
      if (!collidesWithPlaced && footerAdEl && checkAABBCollision(candidateBounds, footerAdEl.bounds, 0.5)) {
        collidesWithPlaced = true;
      }
      if (!collidesWithPlaced && Array.isArray(reservedAdSlots)) {
        for (const resAd of reservedAdSlots) {
          if (resAd.bounds && checkAABBCollision(candidateBounds, resAd.bounds, 0.5)) {
            collidesWithPlaced = true;
            break;
          }
        }
      }

      if (collidesWithPlaced) {
        unplacedElements.push(el);
        continue;
      }

      el.bounds = candidateBounds;
      el.colSpan = colSpan;
      placedElements.push(el);

      // Update skyline for affected columns
      const updatedY = placedY + clampedHeight + grid.gutter;
      for (let s = 0; s < colSpan; s++) {
        colY[bestStartCol + s] = updatedY;
      }
    }

    // 5. Append footer ad if placed earlier
    if (footerAdEl) {
      placedElements.push(footerAdEl);
    }

    // 6. Verify collision-free guarantee
    let collisionFree = true;
    for (let i = 0; i < placedElements.length; i++) {
      for (let j = i + 1; j < placedElements.length; j++) {
        if (checkAABBCollision(placedElements[i].bounds, placedElements[j].bounds, 0.5)) {
          collisionFree = false;
          break;
        }
      }
      if (!collisionFree) break;
    }

    const maxColY = Math.max(...colY);
    const totalHeightUsedPt = Math.max(0, Math.round(maxColY - MARGIN_TOP_PT));
    const initialTotalCount = elements.length + (mastheadEl && mastheadIdx === -1 ? 1 : 0);

    return {
      success: true,
      elements: placedElements,
      unplacedElements,
      gridColumns: safeGridColumns,
      stats: {
        totalElements: initialTotalCount,
        placedCount: placedElements.length,
        unplacedCount: unplacedElements.length,
        collisionFree,
        totalHeightUsedPt,
      },
      metadata: this.getProviderInfo(),
    };
  }
}
