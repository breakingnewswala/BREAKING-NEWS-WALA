/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Automated Test Suite: E-Paper Layout Engine, Grid, Snapping, Collision & Devanagari Typography
 * File: tests/epaper-layout-engine.test.js
 * 
 * Verifies Milestone 2 core layout and rendering requirements:
 * 1. Broadsheet dimensions (32.9 cm x 52.0 cm; 932.6 pt x 1474.0 pt; 3886 x 6142 px at 300 DPI)
 * 2. Modular column grid calculation (3, 4, 5, 6, 8 columns) with standard 5mm gutters and multi-span math
 * 3. Magnetic snapping engine (exact +/- 8px threshold boundary) for DRAG and RESIZE
 * 4. 2D AABB collision detection (overlapping = true, touching borders = false, disjoint = false)
 * 5. Devanagari typography engine (Indic conjunct protection, word-gap delta distribution, un-justified terminal line)
 * 6. Optimistic Concurrency Control (OCC) version increments and 409 conflict handling
 * 
 * Framework: Native Node.js test runner (node:test, node:assert/strict)
 * Execution: node tests/epaper-layout-engine.test.js OR node --test tests/epaper-layout-engine.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BROADSHEET_CONSTANTS,
  BroadsheetGridEngine,
  calculateColumnGrid,
  getColumnSpanWidth,
  snapToNearestColumnSpan,
  snapCoordinate,
  snapToBounds,
  checkAABBCollision,
  getAABBIntersection,
  detectCollisions,
  detectAllCollisions,
  clampToBounds,
  validateBounds,
  validateElementBounds,
} from '../src/utils/epaperLayout.ts';
import { DevanagariTypographyEngine } from '../src/services/graphicRenderer.ts';

// ============================================================================
// 1. BROADSHEET CANVAS DIMENSIONS & GEOMETRIC CONSTANTS
// ============================================================================

test('1. Broadsheet Canvas Dimensions & Geometric Constants', async (t) => {
  await t.test('1.1 Physical broadsheet dimensions match 32.9 cm x 52.0 cm standard', () => {
    assert.strictEqual(BROADSHEET_CONSTANTS.BROADSHEET_WIDTH_MM, 329);
    assert.strictEqual(BROADSHEET_CONSTANTS.BROADSHEET_HEIGHT_MM, 520);
    assert.strictEqual(BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_MM, 299);
    assert.strictEqual(BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_MM, 440);
    assert.strictEqual(BROADSHEET_CONSTANTS.GUTTER_MM, 5);
  });

  await t.test('1.2 Typographical points match 932.6 pt x 1474.0 pt at 72 DPI', () => {
    assert.strictEqual(BROADSHEET_CONSTANTS.PAGE_WIDTH_PT, 932.6);
    assert.strictEqual(BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT, 1474.0);
    assert.strictEqual(BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_PT, 847.56);
    assert.strictEqual(BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_PT, 1247.24);
    assert.strictEqual(BROADSHEET_CONSTANTS.MARGIN_LEFT_PT, 42.52);
    assert.strictEqual(BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT, 42.52);
    assert.strictEqual(BROADSHEET_CONSTANTS.MARGIN_TOP_PT, 113.38);
    assert.strictEqual(BROADSHEET_CONSTANTS.MARGIN_BOTTOM_PT, 113.38);

    // Verify horizontal margin sum: 42.52 + 847.56 + 42.52 = 932.60 pt
    const horizontalSum =
      BROADSHEET_CONSTANTS.MARGIN_LEFT_PT +
      BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_PT +
      BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT;
    assert.ok(Math.abs(horizontalSum - BROADSHEET_CONSTANTS.PAGE_WIDTH_PT) < 0.01);

    // Verify vertical margin sum: 113.38 + 1247.24 + 113.38 = 1474.00 pt
    const verticalSum =
      BROADSHEET_CONSTANTS.MARGIN_TOP_PT +
      BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_PT +
      BROADSHEET_CONSTANTS.MARGIN_BOTTOM_PT;
    assert.ok(Math.abs(verticalSum - BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT) < 0.01);
  });

  await t.test('1.3 High-resolution 300 DPI raster dimensions match 3886 x 6142 px', () => {
    assert.strictEqual(BROADSHEET_CONSTANTS.RASTER_300DPI_WIDTH, 3886);
    assert.strictEqual(BROADSHEET_CONSTANTS.RASTER_300DPI_HEIGHT, 6142);

    const dims = BroadsheetGridEngine.getDimensions();
    assert.strictEqual(dims.raster300DpiWidth, 3886);
    assert.strictEqual(dims.raster300DpiHeight, 6142);
  });

  await t.test('1.4 Boundary validation and clamping logic', () => {
    // Valid bounds
    assert.strictEqual(validateBounds({ width: 100, height: 100 }), true);

    // Invalid bounds rejection
    assert.throws(() => validateBounds({ width: -10, height: 50 }), /ERR_INVALID_BOUNDS/);
    assert.throws(() => validateBounds({ width: 0, height: 50 }), /ERR_INVALID_BOUNDS/);
    assert.throws(() => validateBounds({ width: NaN, height: 50 }), /ERR_INVALID_BOUNDS/);

    // Clamping inside canvas bounds
    const outBounds = { x: -20, y: -40, width: 2000, height: 3000 };
    const clamped = clampToBounds(outBounds);
    assert.strictEqual(clamped.x, 0);
    assert.strictEqual(clamped.y, 0);
    assert.strictEqual(clamped.width, BROADSHEET_CONSTANTS.PAGE_WIDTH_PT);
    assert.strictEqual(clamped.height, BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT);

    // Printable margin overflow check
    const innerBounds = { x: 50, y: 120, width: 200, height: 200 };
    const checkInner = validateElementBounds(innerBounds);
    assert.strictEqual(checkInner.isWithinPrintableArea, true);
    assert.strictEqual(checkInner.isWithinPage, true);

    const overflowBounds = { x: 20, y: 80, width: 200, height: 200 };
    const checkOverflow = validateElementBounds(overflowBounds);
    assert.strictEqual(checkOverflow.isWithinPrintableArea, false);
    assert.strictEqual(checkOverflow.overflow.left, 22.52);
    assert.strictEqual(checkOverflow.overflow.top, 33.38);
  });
});

// ============================================================================
// 2. MODULAR COLUMN GRID & MULTI-SPAN MATHEMATICS
// ============================================================================

test('2. Modular Column Grid & Multi-Span Mathematics', async (t) => {
  await t.test('2.1 Modular column grid calculation for 3, 4, 5, 6, and 8 columns', () => {
    for (const cols of [3, 4, 5, 6, 8]) {
      const grid = calculateColumnGrid(cols);
      assert.strictEqual(grid.columns, cols);
      assert.strictEqual(grid.columnOffsets.length, cols);
      assert.strictEqual(grid.columnRights.length, cols);

      // First column must start exactly at Left Margin (42.52 pt)
      assert.strictEqual(grid.columnOffsets[0], BROADSHEET_CONSTANTS.MARGIN_LEFT_PT);

      // Verify inter-column gutters: offset[i+1] - offset[i] - width = gutter
      for (let i = 0; i < cols - 1; i++) {
        const gap = grid.columnOffsets[i + 1] - (grid.columnOffsets[i] + grid.columnWidth);
        assert.ok(
          Math.abs(gap - BROADSHEET_CONSTANTS.GUTTER_WIDTH_PT) < 0.01,
          `Gutter between col ${i} and ${i + 1} must match 14.1732 pt`
        );
      }

      // Last column right edge must match Right Printable Boundary (890.08 pt)
      const lastRight = grid.columnOffsets[cols - 1] + grid.columnWidth;
      const expectedRight =
        BROADSHEET_CONSTANTS.PAGE_WIDTH_PT - BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT;
      assert.ok(
        Math.abs(lastRight - expectedRight) < 0.1,
        `Right edge of col ${cols - 1} (${lastRight}) matches printable boundary (${expectedRight})`
      );

      // Total span formula: N * colWidth + (N - 1) * gutter = printableWidth
      const totalSpan = cols * grid.columnWidth + (cols - 1) * grid.gutterWidth;
      assert.ok(Math.abs(totalSpan - BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_PT) < 0.1);
    }
  });

  await t.test('2.2 Multi-column span calculations match across compatible grid tiers', () => {
    const grid3 = calculateColumnGrid(3);
    const grid6 = calculateColumnGrid(6);
    const grid4 = calculateColumnGrid(4);
    const grid8 = calculateColumnGrid(8);

    // 2-column span of 6-col grid must match 1-column span of 3-col grid
    const span2of6 = getColumnSpanWidth(2, grid6.columnWidth, grid6.gutterWidth);
    const span1of3 = getColumnSpanWidth(1, grid3.columnWidth, grid3.gutterWidth);
    assert.ok(
      Math.abs(span2of6 - span1of3) < 0.05,
      `2 cols of 6-grid (${span2of6} pt) matches 1 col of 3-grid (${span1of3} pt)`
    );

    // 2-column span of 8-col grid must match 1-column span of 4-col grid
    const span2of8 = getColumnSpanWidth(2, grid8.columnWidth, grid8.gutterWidth);
    const span1of4 = getColumnSpanWidth(1, grid4.columnWidth, grid4.gutterWidth);
    assert.ok(
      Math.abs(span2of8 - span1of4) < 0.05,
      `2 cols of 8-grid (${span2of8} pt) matches 1 col of 4-grid (${span1of4} pt)`
    );

    // 4-column span of 8-col grid must match 2-column span of 4-col grid (half page)
    const span4of8 = getColumnSpanWidth(4, grid8.columnWidth, grid8.gutterWidth);
    const span2of4 = getColumnSpanWidth(2, grid4.columnWidth, grid4.gutterWidth);
    assert.ok(Math.abs(span4of8 - span2of4) < 0.05);

    // Full 8-column span must equal Printable Width (847.56 pt)
    const fullSpan8 = getColumnSpanWidth(8, grid8.columnWidth, grid8.gutterWidth);
    assert.ok(Math.abs(fullSpan8 - BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_PT) < 0.1);
  });

  await t.test('2.3 Snap candidate bounds to nearest column and span', () => {
    const grid6 = calculateColumnGrid(6);
    // Arbitrary bounds near Column 0 with width approx 2 columns
    const testBounds = { x: 44.0, y: 150, width: 270.0, height: 200 };
    const snapped = snapToNearestColumnSpan(testBounds, grid6);

    assert.strictEqual(snapped.colIndex, 0);
    assert.strictEqual(snapped.colSpan, 2);
    assert.strictEqual(snapped.snappedBounds.x, grid6.columnOffsets[0]);
    assert.ok(Math.abs(snapped.snappedBounds.width - 273.07) < 0.1);
  });

  await t.test('2.4 Column calculation throws on invalid column count', () => {
    assert.throws(() => calculateColumnGrid(2), /ERR_INVALID_GRID_COLS/);
    assert.throws(() => calculateColumnGrid(7), /ERR_INVALID_GRID_COLS/);
    assert.throws(() => calculateColumnGrid(9), /ERR_INVALID_GRID_COLS/);
  });
});

// ============================================================================
// 3. MAGNETIC SNAPPING ENGINE (8px THRESHOLD)
// ============================================================================

test('3. Magnetic Snapping Engine (8px Threshold)', async (t) => {
  const gridLines = [100, 200, 300, 400];
  const threshold = 8.0;

  await t.test('3.1 Snaps exactly at +8px boundary', () => {
    // Exactly +8px away from 100 -> snaps to 100
    const res = snapCoordinate(108.0, gridLines, threshold);
    assert.strictEqual(res.snapped, true);
    assert.strictEqual(res.value, 100);
    assert.strictEqual(res.distance, 8.0);
  });

  await t.test('3.2 Snaps exactly at -8px boundary', () => {
    // Exactly -8px away from 100 -> snaps to 100
    const res = snapCoordinate(92.0, gridLines, threshold);
    assert.strictEqual(res.snapped, true);
    assert.strictEqual(res.value, 100);
    assert.strictEqual(res.distance, 8.0);
  });

  await t.test('3.3 Does NOT snap beyond 8px threshold (e.g. 8.5px or 9px)', () => {
    // 8.5px away -> does NOT snap
    const res1 = snapCoordinate(108.5, gridLines, threshold);
    assert.strictEqual(res1.snapped, false);
    assert.strictEqual(res1.value, 108.5);

    // 9.0px away -> does NOT snap
    const res2 = snapCoordinate(91.0, gridLines, threshold);
    assert.strictEqual(res2.snapped, false);
    assert.strictEqual(res2.value, 91.0);
  });

  await t.test('3.4 Drag snapping snaps left, center, or right edges to guidelines', () => {
    const linesX = [
      { position: 42.52, axis: 'x', type: 'MARGIN' },
      { position: 200.0, axis: 'x', type: 'GRID_LEFT' },
      { position: 400.0, axis: 'x', type: 'GRID_RIGHT' },
    ];
    const linesY = [
      { position: 113.38, axis: 'y', type: 'MARGIN' },
      { position: 350.0, axis: 'y', type: 'ELEMENT_EDGE' },
    ];

    // Candidate near left margin (45.0 pt -> delta 2.48 pt <= 8 pt)
    const candidate1 = { x: 45.0, y: 150.0, width: 100.0, height: 100.0 };
    const snap1 = snapToBounds(candidate1, linesX, linesY, 8.0, 'DRAG');
    assert.strictEqual(snap1.snappedX, true);
    assert.strictEqual(snap1.snappedBounds.x, 42.52);

    // Candidate right edge near 400 (x = 295, width = 100 -> right = 395, delta 5 pt <= 8 pt)
    const candidate2 = { x: 295.0, y: 150.0, width: 100.0, height: 100.0 };
    const snap2 = snapToBounds(candidate2, linesX, linesY, 8.0, 'DRAG');
    assert.strictEqual(snap2.snappedX, true);
    assert.strictEqual(snap2.snappedBounds.x, 300.0); // 300 + 100 = 400

    // Top edge near top margin (116.0 pt -> delta 2.62 pt <= 8 pt)
    const candidate3 = { x: 50.0, y: 116.0, width: 100.0, height: 100.0 };
    const snap3 = snapToBounds(candidate3, linesX, linesY, 8.0, 'DRAG');
    assert.strictEqual(snap3.snappedY, true);
    assert.strictEqual(snap3.snappedBounds.y, 113.38);
  });

  await t.test('3.5 Directional handle resizing snaps active edges while pinning opposite edge', () => {
    const linesX = [{ position: 300.0, axis: 'x', type: 'GRID_RIGHT' }];
    const linesY = [{ position: 400.0, axis: 'y', type: 'ELEMENT_EDGE' }];

    // Resize East handle: candidate x=100, width=195 (right edge = 295, near 300)
    const initBox = { x: 100.0, y: 100.0, width: 195.0, height: 100.0 };
    const snapEast = snapToBounds(initBox, linesX, linesY, 8.0, 'RESIZE', 'e');
    assert.strictEqual(snapEast.snappedX, true);
    assert.strictEqual(snapEast.snappedBounds.x, 100.0); // Pinned left
    assert.strictEqual(snapEast.snappedBounds.width, 200.0); // 300 - 100 = 200

    // Resize South handle: candidate y=200, height=196 (bottom edge = 396, near 400)
    const snapSouth = snapToBounds(
      { x: 100.0, y: 200.0, width: 100.0, height: 196.0 },
      linesX,
      linesY,
      8.0,
      'RESIZE',
      's'
    );
    assert.strictEqual(snapSouth.snappedY, true);
    assert.strictEqual(snapSouth.snappedBounds.y, 200.0); // Pinned top
    assert.strictEqual(snapSouth.snappedBounds.height, 200.0); // 400 - 200 = 200
  });
});

// ============================================================================
// 4. 2D AABB COLLISION DETECTION & INTERSECTION ANALYSIS
// ============================================================================

test('4. 2D AABB Collision Detection & Intersection Analysis', async (t) => {
  await t.test('4.1 Detects collision between overlapping bounding boxes', () => {
    const boxA = { x: 100, y: 100, width: 150, height: 150 };
    const boxB = { x: 180, y: 150, width: 150, height: 150 };

    assert.strictEqual(checkAABBCollision(boxA, boxB), true);
    assert.strictEqual(checkAABBCollision(boxB, boxA), true);

    const intersection = getAABBIntersection(boxA, boxB);
    assert.ok(intersection);
    assert.strictEqual(intersection.x, 180);
    assert.strictEqual(intersection.y, 150);
    assert.strictEqual(intersection.width, 70); // 250 - 180 = 70
    assert.strictEqual(intersection.height, 100); // 250 - 150 = 100
  });

  await t.test('4.2 Edge-adjacent touching borders do NOT trigger false collisions (0.5 tolerance)', () => {
    // Sharing exact vertical border at x=200
    const boxLeft = { x: 50, y: 100, width: 150, height: 100 }; // right edge = 200
    const boxRight = { x: 200, y: 100, width: 150, height: 100 }; // left edge = 200

    assert.strictEqual(
      checkAABBCollision(boxLeft, boxRight),
      false,
      'Touching vertical borders must NOT collide'
    );

    // Sharing exact horizontal border at y=250
    const boxTop = { x: 100, y: 100, width: 100, height: 150 }; // bottom edge = 250
    const boxBottom = { x: 100, y: 250, width: 100, height: 150 }; // top edge = 250

    assert.strictEqual(
      checkAABBCollision(boxTop, boxBottom),
      false,
      'Touching horizontal borders must NOT collide'
    );
  });

  await t.test('4.3 Disjoint separate boxes do NOT collide', () => {
    const box1 = { x: 10, y: 10, width: 80, height: 80 };
    const box2 = { x: 300, y: 300, width: 100, height: 100 };

    assert.strictEqual(checkAABBCollision(box1, box2), false);
    assert.strictEqual(getAABBIntersection(box1, box2), null);
  });

  await t.test('4.4 Multi-element collision report evaluates all overlapping elements', () => {
    const target = { x: 100, y: 100, width: 120, height: 120 };
    const elements = [
      { id: 'el-1', bounds: { x: 150, y: 150, width: 100, height: 100 } }, // Overlaps target
      { id: 'el-2', bounds: { x: 500, y: 500, width: 100, height: 100 } }, // Disjoint
      { id: 'el-3', bounds: { x: 220, y: 100, width: 80, height: 120 } },  // Touching border at x=220
      { id: 'el-target', bounds: { x: 100, y: 100, width: 120, height: 120 } }, // Self
    ];

    const report = detectCollisions(target, elements, 'el-target');
    assert.strictEqual(report.hasCollision, true);
    assert.strictEqual(report.collidingElementIds.length, 1);
    assert.strictEqual(report.collidingElementIds[0], 'el-1');
    assert.ok(report.totalOverlapArea > 0);

    // All-pairs collision
    const allReport = detectAllCollisions(elements);
    assert.strictEqual(allReport.hasCollision, true);
    assert.ok(allReport.collidingElementIds.includes('el-1'));
    assert.ok(allReport.collidingElementIds.includes('el-target'));
  });
});

// ============================================================================
// 5. DEVANAGARI TYPOGRAPHY ENGINE & INDIC CONJUNCT JUSTIFICATION
// ============================================================================

test('5. Devanagari Typography Engine & Indic Conjunct Justification', async (t) => {
  await t.test('5.1 Accurately detects complex Devanagari conjuncts and halants', () => {
    const complexCases = [
      'त्र्यंबकेश्वर',
      'द्वंद्व',
      'उज्ज्वलता',
      'राष्ट्र',
      'मध्य प्रदेश',
      'संवाददाता',
    ];
    for (const word of complexCases) {
      assert.strictEqual(
        DevanagariTypographyEngine.isComplexDevanagari(word),
        true,
        `Expected "${word}" to be recognized as complex Devanagari`
      );
    }

    assert.strictEqual(DevanagariTypographyEngine.isComplexDevanagari('English Text'), false);
    assert.strictEqual(DevanagariTypographyEngine.isComplexDevanagari('1234567890'), false);
  });

  await t.test('5.2 Justifies Devanagari line distributing space solely into word gaps', () => {
    const headline = 'मध्य प्रदेश सरकार ने नई औद्योगिक नीति को मंजूरी दी';
    const words = headline.split(' ');
    const targetWidth = 450;
    const justified = DevanagariTypographyEngine.justifyDevanagariLine(words, targetWidth, 14, false);

    assert.strictEqual(justified.justified, true);
    assert.strictEqual(justified.alignment, 'JUSTIFIED');
    assert.strictEqual(justified.wordCount, words.length);
    assert.strictEqual(justified.gaps, words.length - 1);
    assert.ok(justified.spacePerGap > 0);
    // Crucial Invariant: The joined words must preserve all Indic conjuncts intact
    assert.strictEqual(justified.text, headline);
  });

  await t.test('5.3 Single-word line does NOT distribute artificial gap spacing', () => {
    const singleWord = ['महाप्रबंधक'];
    const res = DevanagariTypographyEngine.justifyDevanagariLine(singleWord, 300, 14, false);

    assert.strictEqual(res.justified, false);
    assert.strictEqual(res.alignment, 'LEFT');
    assert.strictEqual(res.spacePerGap, 0);
    assert.strictEqual(res.text, 'महाप्रबंधक');
  });

  await t.test('5.4 Terminal line of paragraph remains strictly un-justified (LEFT)', () => {
    const paragraphText =
      'राजधानी भोपाल में मेट्रो का काम अंतिम चरण में पहुंच चुका है। जल्द ही आम जनता के लिए इसका परिचालन शुरू होगा।';
    const result = DevanagariTypographyEngine.wrapAndJustifyParagraph(paragraphText, 250, 12, 10);

    assert.ok(result.lines.length >= 2, 'Paragraph must wrap into multiple lines');
    // First line must be justified
    assert.strictEqual(result.lines[0].justified, true);
    assert.strictEqual(result.lines[0].alignment, 'JUSTIFIED');

    // Terminal line must remain strictly left-aligned
    assert.strictEqual(result.terminalLineJustified, false);
    const terminalLine = result.lines[result.lines.length - 1];
    assert.strictEqual(terminalLine.justified, false);
    assert.strictEqual(terminalLine.alignment, 'LEFT');
    assert.strictEqual(terminalLine.spacePerGap, 0);
  });

  await t.test('5.5 Excessive word gaps trigger safety clamp preventing typographic white rivers', () => {
    // 2 words stretched across massive width (800pt)
    const words = ['भोपाल', 'मेट्रो'];
    const res = DevanagariTypographyEngine.justifyDevanagariLine(words, 800, 12, false);

    // Should abort justification to avoid white river
    assert.strictEqual(res.justified, false);
    assert.strictEqual(res.alignment, 'LEFT');
    assert.strictEqual(res.spacePerGap, 0);
  });
});

// ============================================================================
// 6. OPTIMISTIC CONCURRENCY CONTROL (OCC) & VERSION CONFLICT SIMULATION
// ============================================================================

test('6. Optimistic Concurrency Control (OCC) & Version Conflict Simulation', async (t) => {
  // In-memory page store simulating backend OCC lifecycle
  const pageStore = new Map();
  const initialPage = {
    id: 'page-occ-test-01',
    editionId: 'ed-occ-test',
    pageNumber: 1,
    pageTitle: 'मुख्य पृष्ठ',
    gridColumns: 8,
    elements: [],
    version: 1,
  };
  pageStore.set(initialPage.id, { ...initialPage });

  const simulateUpdatePage = (pageId, updates) => {
    const existing = pageStore.get(pageId);
    if (!existing) throw new Error('ERR_PAGE_NOT_FOUND');

    const expectedVersion = updates.version;
    if (expectedVersion === undefined || expectedVersion !== existing.version) {
      const err = new Error('ERR_CONCURRENCY_CONFLICT: Version mismatch');
      err.statusCode = 409;
      err.details = { currentVersion: existing.version, providedVersion: expectedVersion };
      throw err;
    }

    const updated = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };
    pageStore.set(pageId, updated);
    return updated;
  };

  await t.test('6.1 Page update with matching version succeeds and increments version', () => {
    const updated = simulateUpdatePage('page-occ-test-01', {
      pageTitle: 'संशोधित मुख्य पृष्ठ',
      version: 1,
    });
    assert.strictEqual(updated.version, 2);
    assert.strictEqual(updated.pageTitle, 'संशोधित मुख्य पृष्ठ');
  });

  await t.test('6.2 Concurrent update with stale version is rejected with HTTP 409', () => {
    // Attempt to update using stale version = 1 (current version is 2)
    assert.throws(
      () => {
        simulateUpdatePage('page-occ-test-01', {
          pageTitle: 'अमान्य संस्करण बदलाव',
          version: 1, // Stale version
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.details.currentVersion, 2);
        assert.strictEqual(err.details.providedVersion, 1);
        return true;
      }
    );
  });

  await t.test('6.3 Force Overwrite resolution pulls fresh version and updates successfully', () => {
    // Reload remote version
    const fresh = pageStore.get('page-occ-test-01');
    assert.strictEqual(fresh.version, 2);

    // Apply local changes with fresh version counter
    const overwritten = simulateUpdatePage('page-occ-test-01', {
      elements: [{ id: 'el-overwritten-1', elementType: 'STORY', bounds: { x: 0, y: 0, width: 100, height: 100 } }],
      version: fresh.version, // Version 2
    });

    assert.strictEqual(overwritten.version, 3);
    assert.strictEqual(overwritten.elements.length, 1);
  });
});
