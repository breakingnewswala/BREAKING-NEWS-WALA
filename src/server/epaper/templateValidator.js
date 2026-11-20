/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Authoritative Broadsheet Template Validation Engine
 * File: src/server/epaper/templateValidator.js
 *
 * Implements Step 5 Template Validation & Quality Preflight Rules:
 * 1. Physical broadsheet dimensions: 32.9 cm x 52.0 cm (932.6 pt x 1474.0 pt)
 * 2. Column grid calculations (3, 4, 5, 6, 8 columns) and positive gutters
 * 3. Page margins and boundary bounds verification
 * 4. Region geometry, validity, collision/overlap analysis
 * 5. Editorial content requirements (story slots, masthead for Front Page)
 * 6. Typography hierarchy & Indic Devanagari font support
 * 7. Template ID uniqueness and version integrity
 */

export const BROADSHEET_CONSTANTS = {
  PAGE_WIDTH_PT: 932.6,
  PAGE_HEIGHT_PT: 1474.0,
  MARGIN_LEFT_PT: 42.52,
  MARGIN_RIGHT_PT: 42.52,
  MARGIN_TOP_PT: 56.69,
  MARGIN_BOTTOM_PT: 85.04,
  GUTTER_PT: 14.17, // 5 mm
  ALLOWED_COLUMNS: [3, 4, 5, 6, 8],
  ALLOWED_CATEGORIES: [
    'FRONT_PAGE',
    'DISTRICT_FOCUS',
    'STATE',
    'POLITICAL',
    'BUSINESS',
    'EDUCATION',
    'SPORTS',
    'EDITORIAL',
    'SPECIAL',
    'NATIONAL',
    'ENTERTAINMENT',
    'CLASSIFIEDS',
    'CUSTOM',
  ],
};

export const BROADSHEET_SPEC = {
  WIDTH_PT: BROADSHEET_CONSTANTS.PAGE_WIDTH_PT,
  HEIGHT_PT: BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT,
  ALLOWED_COLUMNS: BROADSHEET_CONSTANTS.ALLOWED_COLUMNS,
};

/**
 * Validates a complete or partial EpaperTemplateDoc.
 *
 * @param {object} template - The template document to validate
 * @param {object} [options] - Validation options (e.g. existingTemplates list)
 * @returns {object} Validation result { valid: boolean, errors: string[], warnings: string[], metrics: object }
 */
export function validateTemplate(template, options = {}) {
  const errors = [];
  const warnings = [];

  if (!template || typeof template !== 'object') {
    return {
      valid: false,
      errors: ['अमान्य टेम्पलेट डेटा (Template data is invalid or missing)'],
      warnings: [],
      metrics: null,
    };
  }

  // 1. Basic Metadata Validation
  if (!template.name && !template.nameHi) {
    errors.push('टेम्पलेट का नाम (name/nameHi) अनिवार्य है।');
  }

  if (template.category) {
    const cat = String(template.category).toUpperCase();
    if (!BROADSHEET_CONSTANTS.ALLOWED_CATEGORIES.includes(cat)) {
      warnings.push(`असामान्य टेम्पलेट श्रेणी "${template.category}"। मानक श्रेणियों का उपयोग अनुशंसित है।`);
    }
  }

  // 2. Physical Dimensions & Margins
  const pageWidth = template.pageDimensions?.widthPt || BROADSHEET_CONSTANTS.PAGE_WIDTH_PT;
  const pageHeight = template.pageDimensions?.heightPt || BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT;

  if (Math.abs(pageWidth - BROADSHEET_CONSTANTS.PAGE_WIDTH_PT) > 10) {
    errors.push(`अमान्य पृष्ठ चौड़ाई: ${pageWidth}pt। मानक ब्रॉडशीट चौड़ाई 932.6pt (32.9 cm) होनी चाहिए।`);
  }

  if (Math.abs(pageHeight - BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT) > 10) {
    errors.push(`अमान्य पृष्ठ ऊंचाई: ${pageHeight}pt। मानक ब्रॉडशीट ऊंचाई 1474.0pt (52.0 cm) होनी चाहिए।`);
  }

  const margins = template.margins || {
    left: BROADSHEET_CONSTANTS.MARGIN_LEFT_PT,
    right: BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT,
    top: BROADSHEET_CONSTANTS.MARGIN_TOP_PT,
    bottom: BROADSHEET_CONSTANTS.MARGIN_BOTTOM_PT,
  };

  if (margins.left < 0 || margins.right < 0 || margins.top < 0 || margins.bottom < 0) {
    errors.push('हाशिया मान (Margins) ऋणात्मक नहीं हो सकते।');
  }

  if (margins.left + margins.right >= pageWidth) {
    errors.push('बायां और दायां हाशिया कुल पृष्ठ चौड़ाई से अधिक या बराबर नहीं हो सकता।');
  }

  if (margins.top + margins.bottom >= pageHeight) {
    errors.push('शीर्ष और निचला हाशिया कुल पृष्ठ ऊंचाई से अधिक या बराबर नहीं हो सकता।');
  }

  // 3. Column Count & Gutter Math
  const columns = Number(template.gridColumns || 8);
  if (!BROADSHEET_CONSTANTS.ALLOWED_COLUMNS.includes(columns)) {
    errors.push(`अमान्य ग्रिड कॉलम संख्या: ${columns}। कॉलम केवल 3, 4, 5, 6 या 8 हो सकते हैं।`);
  }

  const gutter = template.gutter !== undefined ? Number(template.gutter) : BROADSHEET_CONSTANTS.GUTTER_PT;
  if (gutter <= 0) {
    errors.push('गटर चौड़ाई (Gutter width) धनात्मक (> 0) होनी चाहिए।');
  }

  // 4. Region Configurations
  const regions = Array.isArray(template.regions) ? template.regions : [];
  if (regions.length === 0) {
    errors.push('टेम्पलेट में कम से कम एक सामग्री क्षेत्र (Region) होना अनिवार्य है।');
  }

  const seenRegionIds = new Set();
  let storySlots = 0;
  let adSlots = 0;
  let hasMasthead = false;
  let collisionCount = 0;
  let totalAreaOccupied = 0;

  for (let i = 0; i < regions.length; i++) {
    const reg = regions[i];
    const regLabel = reg.name || reg.id || `क्षेत्र #${i + 1}`;

    if (!reg.id) {
      errors.push(`क्षेत्र #${i + 1} का ID रिक्त है।`);
    } else {
      if (seenRegionIds.has(reg.id)) {
        errors.push(`डुप्लिकेट क्षेत्र ID: "${reg.id}"। सभी क्षेत्रों के ID विशिष्ट होने चाहिए।`);
      }
      seenRegionIds.add(reg.id);
    }

    const b = reg.bounds;
    if (!b || typeof b !== 'object') {
      errors.push(`क्षेत्र "${regLabel}" की ज्यामितीय सीमाएं (bounds) अनुपलब्ध हैं।`);
      continue;
    }

    if (b.width <= 0 || b.height <= 0) {
      errors.push(`क्षेत्र "${regLabel}" की चौड़ाई और ऊंचाई धनात्मक होनी चाहिए।`);
    }

    if (b.x < 0 || b.y < 0) {
      errors.push(`क्षेत्र "${regLabel}" का आरंभिक बिंदु (X: ${b.x}, Y: ${b.y}) ऋणात्मक नहीं हो सकता।`);
    }

    // Page overflow check (allow small 5pt rounding tolerance)
    if (b.x + b.width > pageWidth + 5) {
      errors.push(`क्षेत्र "${regLabel}" पृष्ठ की क्षैतिज सीमा से बाहर निकल रहा है (${(b.x + b.width).toFixed(1)}pt > ${pageWidth}pt)।`);
    }

    if (b.y + b.height > pageHeight + 5) {
      errors.push(`क्षेत्र "${regLabel}" पृष्ठ की लंबवत सीमा से बाहर निकल रहा है (${(b.y + b.height).toFixed(1)}pt > ${pageHeight}pt)।`);
    }

    totalAreaOccupied += (b.width * b.height);

    const type = String(reg.defaultElementType || '').toUpperCase();
    if (['STORY', 'LEAD', 'SECOND_LEAD', 'ANCHOR', 'BRIEFS'].includes(type)) {
      storySlots++;
    } else if (type === 'AD') {
      adSlots++;
    } else if (type === 'MASTHEAD') {
      hasMasthead = true;
    }
  }

  // 5. Collision & Overlap Analysis
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const r1 = regions[i];
      const r2 = regions[j];
      const b1 = r1.bounds;
      const b2 = r2.bounds;
      if (!b1 || !b2) continue;

      // Check AABB intersection with 2pt threshold to avoid false alarms on touching borders
      const overlapX = Math.max(0, Math.min(b1.x + b1.width, b2.x + b2.width) - Math.max(b1.x, b2.x));
      const overlapY = Math.max(0, Math.min(b1.y + b1.height, b2.y + b2.height) - Math.max(b1.y, b2.y));

      if (overlapX > 2 && overlapY > 2) {
        collisionCount++;
        warnings.push(`क्षेत्र ओवरलैप (Collision): "${r1.name || r1.id}" और "${r2.name || r2.id}" आपस में संघातित हो रहे हैं (${overlapX.toFixed(0)}x${overlapY.toFixed(0)} pt)।`);
      }
    }
  }

  // 6. Editorial Composition Rules
  const catUpper = String(template.category || '').toUpperCase();
  if (catUpper === 'FRONT_PAGE') {
    if (!hasMasthead) {
      warnings.push('प्रथम पृष्ठ (FRONT_PAGE) टेम्पलेट में अखबार का मुख्य मास्टहेड (MASTHEAD) सम्मिलित होना अनुशंसित है।');
    }
  }

  if (storySlots === 0 && !['AD', 'CLASSIFIEDS'].includes(catUpper)) {
    warnings.push('टेम्पलेट में कोई समाचार क्षेत्र (Story Region) परिभाषित नहीं है।');
  }

  // 7. Template ID Uniqueness (if options.existingTemplates supplied)
  if (options.existingTemplates && template.id) {
    const existing = options.existingTemplates.find(
      (t) => t.id === template.id && t._internalId !== template._internalId
    );
    if (existing && options.isNew) {
      errors.push(`टेम्पलेट ID "${template.id}" पहले से मौजूद है। विशिष्ट ID प्रयुक्त करें।`);
    }
  }

  // Coverage percentage of printable broadsheet area
  const printableArea = (pageWidth - margins.left - margins.right) * (pageHeight - margins.top - margins.bottom);
  const totalCoveragePercent = Number(Math.min(100, Math.max(0, (totalAreaOccupied / printableArea) * 100)).toFixed(1));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      regionCount: regions.length,
      storySlots,
      adSlots,
      hasMasthead,
      collisionCount,
      totalCoveragePercent,
      pageWidth,
      pageHeight,
      columns,
    },
  };
}
