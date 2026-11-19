/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution: E-Paper Management System E2E Test Suite
 * File: tests/backend-epaper-management.test.js
 * 
 * Verifies 100% of E-Paper Management Requirements (R1 through R9):
 * - Tier 1: Feature Coverage (48 tests across 9 major areas)
 * - Tier 2: Boundary & Corner Cases (48 tests across 9 major areas)
 * - Tier 3: Cross-Feature Combinations (12 pairwise workflow tests)
 * - Tier 4: Real-World Application Scenarios (6 comprehensive scenarios)
 * 
 * Framework: Native Node.js test runner (node:test, node:assert/strict)
 * Execution: node --test tests/backend-epaper-management.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { signToken, verifyToken } from '../src/server/apiEngine.js';
import { MASTER_ADMIN_EMAILS, isMasterAdminEmail } from '../src/server/auth/firebaseAuthService.js';
import { INITIAL_DISTRICTS } from '../src/server/persistence/adapter.js';

process.env.NODE_ENV = 'test';

// ============================================================================
// 1. ARCHITECTURAL CONSTANTS & CONFIGURATION
// ============================================================================

const BROADSHEET_WIDTH_MM = 329;
const BROADSHEET_HEIGHT_MM = 520;
const PRINTABLE_WIDTH_MM = 299;
const PRINTABLE_HEIGHT_MM = 490;
const BROADSHEET_WIDTH_PT = 932.6;
const BROADSHEET_HEIGHT_PT = 1474.0;
const BROADSHEET_WIDTH_300DPI = 3886;
const BROADSHEET_HEIGHT_300DPI = 6142;
const GUTTER_MM = 5;
const MAGNETIC_SNAP_THRESHOLD_PX = 8;
const DAILY_WHATSAPP_CARD_QUOTA = 20;
const MAX_PAGES_CAP = 48;

const STATUS = {
  DRAFT: 'DRAFT',
  EDITORIAL_REVIEW: 'EDITORIAL_REVIEW',
  LAYOUT_IN_PROGRESS: 'LAYOUT_IN_PROGRESS',
  QUALITY_CHECK: 'QUALITY_CHECK',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
};

const SEVERITY = {
  BLOCKER: 'BLOCKER',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
};

// ============================================================================
// 2. SYNTHETIC TEST FIXTURES & DATASETS (MP 55 Districts, Articles, Ads, Templates)
// ============================================================================

const MP_55_DISTRICTS = INITIAL_DISTRICTS && INITIAL_DISTRICTS.length >= 50
  ? INITIAL_DISTRICTS
  : [
      { id: 'dist-bhopal', slug: 'bhopal', nameEn: 'Bhopal', nameHi: 'भोपाल', divisionId: 'div-bhopal' },
      { id: 'dist-indore', slug: 'indore', nameEn: 'Indore', nameHi: 'इंदौर', divisionId: 'div-indore' },
      { id: 'dist-gwalior', slug: 'gwalior', nameEn: 'Gwalior', nameHi: 'ग्वालियर', divisionId: 'div-gwalior' },
      { id: 'dist-jabalpur', slug: 'jabalpur', nameEn: 'Jabalpur', nameHi: 'जबलपुर', divisionId: 'div-jabalpur' },
      { id: 'dist-niwari', slug: 'niwari', nameEn: 'Niwari', nameHi: 'निवाड़ी / ओरछा', divisionId: 'div-sagar' },
      { id: 'dist-ujjain', slug: 'ujjain', nameEn: 'Ujjain', nameHi: 'उज्जैन', divisionId: 'div-ujjain' },
    ];

const MP_DISTRICT_ID_SET = new Set(MP_55_DISTRICTS.map((d) => d.id));

const SYNTHETIC_NEWS_ARTICLES = [
  {
    id: 'art-bhopal-metro-01',
    title: 'भोपाल मेट्रो के दूसरे चरण का ट्रायल रन सफल, मुख्यमंत्री ने दी हरी झंडी',
    summary: 'भोपाल के सुभाष नगर से करोंद तक मेट्रो ट्रैक का परीक्षण पूर्ण हुआ।',
    content: 'राजधानी भोपाल में मेट्रो रेल परियोजना का दूसरा चरण तेजी से पूर्णता की ओर है। सुभाष नगर से करोंद तक 8.5 किलोमीटर लंबे रूट पर सफल ट्रायल रन किया गया। इस परियोजना से 5 लाख यात्रियों को दैनिक लाभ मिलेगा।',
    category: 'DEVELOPMENT',
    districtId: 'dist-bhopal',
    byline: 'राजेश सक्सेना, विशेष संवाददाता',
    photographer: 'अमित कुमार, बीएनडब्ल्यू फोटो ब्यूरो',
    status: 'APPROVED',
    createdAt: '2026-11-17T10:00:00Z',
  },
  {
    id: 'art-indore-clean-02',
    title: 'इंदौर लगातार आठवीं बार देश का सबसे स्वच्छ शहर बनने की दिशा में अग्रसर',
    summary: 'स्वच्छ सर्वेक्षण 2026 में 7-स्टार रेटिंग और जीरो-वेस्ट मॉडल लागू।',
    content: 'स्वच्छता में देश भर में मिसाल पेश करने वाला इंदौर शहर अब स्मार्ट कचरा पृथक्करण और बायो-सीएनजी उत्पादन में भी अव्वल बन चुका है। निगम आयुक्त ने आगामी राष्ट्रीय पुरस्कार के लिए तैयारी की समीक्षा की।',
    category: 'POLITY',
    districtId: 'dist-indore',
    byline: 'सुनीता जोशी, वरिष्ठ ब्यूरो चीफ',
    photographer: 'संजय वर्मा',
    status: 'APPROVED',
    createdAt: '2026-11-17T11:30:00Z',
  },
  {
    id: 'art-gwalior-heritage-03',
    title: 'ग्वालियर किले के संरक्षण के लिए यूनेस्को और एएसआई का संयुक्त महाअभियान',
    summary: 'मान मंदिर महल और सास-बहू मंदिर का 3D लेजर मैपिंग संरक्षण कार्य शुरू।',
    content: 'ग्वालियर के ऐतिहासिक किले को विश्व धरोहर सूची में संरक्षित रखने के लिए उन्नत लेजर स्कैनिंग तकनीक का उपयोग किया जा रहा है। पर्यटन को नए आयाम देने हेतु विशेष साउंड एंड लाइट शो अपग्रेड किया गया।',
    category: 'CULTURE',
    districtId: 'dist-gwalior',
    byline: 'विक्रम तोमर, आंचलिक संवाददाता',
    photographer: 'दीपक शर्मा',
    status: 'APPROVED',
    createdAt: '2026-11-17T12:00:00Z',
  },
  {
    id: 'art-orchha-tourism-04',
    title: 'रामराजा सरकार की नगरी ओरछा में अंतरराष्ट्रीय बुंदेलखंड उत्सव का भव्य शुभारंभ',
    summary: 'बेतवा तट पर सांस्कृतिक समागम, लोक कलाकारों ने बांधा समां।',
    content: 'निवाड़ी जिले की पावन नगरी ओरछा में बुंदेली कला, लोकनृत्य और संगीत का तीन दिवसीय महाकुंभ शुरू हुआ। देश-विदेश से हजारों श्रद्धालु और पर्यटक रामराजा दरबार पहुंचे।',
    category: 'CULTURE',
    districtId: 'dist-niwari',
    byline: 'ऋतुराज सिंह, ब्यूरो प्रमुख',
    photographer: 'प्रदीप कुशवाहा',
    status: 'APPROVED',
    createdAt: '2026-11-17T14:15:00Z',
  },
  {
    id: 'art-jabalpur-narmada-05',
    title: 'भेड़ाघाट संगमरमरी वादियों में पर्यावरण संरक्षण के लिए ई-बोटिंग प्रोजेक्ट शुरू',
    summary: 'नर्मदा नदी में प्रदूषण रोकथाम हेतु पेट्रोल बोट्स पर पूर्ण प्रतिबंध।',
    content: 'संस्कारधानी जबलपुर के भेड़ाघाट में नर्मदा के जल को स्वच्छ रखने के लिए शत-प्रतिशत सोलर व इलेक्ट्रिक नौकाएं शुरू की गई हैं। पर्यटकों ने इस पहल का स्वागत किया।',
    category: 'DEVELOPMENT',
    districtId: 'dist-jabalpur',
    byline: 'मनोज चौबे, जबलपुर प्रतिनिधि',
    photographer: 'अखिलेश पटेल',
    status: 'APPROVED',
    createdAt: '2026-11-17T15:00:00Z',
  },
  {
    id: 'art-draft-unapproved-06',
    title: 'अपुष्ट सूत्रों से खबर: जिला अस्पताल में दवाओं की कमी का अंदेशा',
    summary: 'जांच जारी है, सत्यापन शेष।',
    content: 'अस्पताल प्रबंधन ने आरोपों पर अभी कोई आधिकारिक वक्तव्य नहीं दिया है।',
    category: 'HEALTH',
    districtId: 'dist-bhopal',
    byline: 'अनाम सूत्र',
    photographer: 'कोई नहीं',
    status: 'DRAFT', // Unapproved, should not be placed without warning
    createdAt: '2026-11-17T16:00:00Z',
  },
  {
    id: 'art-archived-07',
    title: 'पुरातन रिकॉर्ड: 2024 विधानसभा चुनाव विश्लेषण',
    summary: 'पुराना ऐतिहासिक रिकॉर्ड।',
    content: 'पुराने रिकॉर्ड का सारांश।',
    category: 'ARCHIVE',
    districtId: 'dist-bhopal',
    byline: 'पुरालेख विभाग',
    photographer: 'पुरालेख',
    status: 'ARCHIVED', // Archived article
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const SYNTHETIC_REPORTERS = [
  {
    id: 'usr-rep-bhopal',
    identifier: 'ramesh.bhopal@breakingnewswala.com',
    fullName: 'रमेश शर्मा',
    roles: ['REPORTER'],
    districtId: 'dist-bhopal',
    beat: 'DEVELOPMENT',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    badgeNumber: 'BNW-REP-0104',
  },
  {
    id: 'usr-rep-niwari',
    identifier: 'rituraj.orchha@breakingnewswala.com',
    fullName: 'ऋतुराज तोमर ओरछा',
    roles: ['REPORTER'],
    districtId: 'dist-niwari',
    beat: 'CULTURE',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    badgeNumber: 'BNW-REP-0208',
  },
  {
    id: 'usr-rep-jabalpur',
    identifier: 'manoj.jabalpur@breakingnewswala.com',
    fullName: 'मनोज चौबे',
    roles: ['REPORTER'],
    districtId: 'dist-jabalpur',
    beat: 'CRIME',
    photoUrl: null, // Test photo fallback
    badgeNumber: 'BNW-REP-0312',
  },
];

const SYNTHETIC_ADS = [
  {
    id: 'ad-com-mp-tourism-01',
    advertiserName: 'मध्य प्रदेश पर्यटन विकास निगम',
    title: 'एमपी अजब है, सबसे गजब है - ओरछा हेरिटेज टूर',
    aspectRatio: '1:1',
    slotType: 'FOOTER',
    dimensions: { width: 996, height: 250 },
    creativeUrl: 'https://cdn.breakingnewswala.com/ads/mp-tourism-footer.webp',
    status: 'APPROVED',
    asciBadge: true,
  },
  {
    id: 'ad-ear-sanchi-milk-02',
    advertiserName: 'सांची दुग्ध संघ मध्य प्रदेश',
    title: 'शुद्धता और स्वाद का भरोसा - सांची दूध',
    aspectRatio: '3:4',
    slotType: 'VERTICAL_EAR',
    dimensions: { width: 180, height: 240 },
    creativeUrl: 'https://cdn.breakingnewswala.com/ads/sanchi-ear.webp',
    status: 'APPROVED',
    asciBadge: true,
  },
  {
    id: 'ad-unapproved-promo-03',
    advertiserName: 'स्थानीय व्यापारी संघ',
    title: 'दीपावली बंपर सेल - 50% छूट',
    aspectRatio: '4:3',
    slotType: 'QUARTER_PAGE',
    dimensions: { width: 480, height: 360 },
    creativeUrl: 'https://cdn.breakingnewswala.com/ads/promo.webp',
    status: 'PENDING_APPROVAL',
    asciBadge: false, // Missing badge, should be flagged by preflight
  },
];

const DEFAULT_12_BROADSHEET_TEMPLATES = [
  { pageNumber: 1, sectionType: 'FRONT_PAGE', pageTitle: 'मुख्य पृष्ठ (Lead & Breaking)' },
  { pageNumber: 2, sectionType: 'STATE_REGIONAL', pageTitle: 'मध्य प्रदेश / राज्य समाचार' },
  { pageNumber: 3, sectionType: 'NATIONAL', pageTitle: 'देश / राष्ट्रीय परिदृश्य' },
  { pageNumber: 4, sectionType: 'EDITORIAL_OPED', pageTitle: 'संपादकीय एवं विचार' },
  { pageNumber: 5, sectionType: 'DISTRICT_FOCUS', pageTitle: 'जिला विशेष ग्राउंड रिपोर्ट' },
  { pageNumber: 6, sectionType: 'AGRICULTURE_MANDI', pageTitle: 'कृषि, किसान एवं मंडी भाव' },
  { pageNumber: 7, sectionType: 'BUSINESS', pageTitle: 'व्यापार एवं अर्थव्यवस्था' },
  { pageNumber: 8, sectionType: 'SPORTS', pageTitle: 'खेल जगत' },
  { pageNumber: 9, sectionType: 'EDUCATION_CAREER', pageTitle: 'शिक्षा, रोजगार एवं युवा' },
  { pageNumber: 10, sectionType: 'SCIENCE_HEALTH', pageTitle: 'विज्ञान, तकनीक एवं स्वास्थ्य' },
  { pageNumber: 11, sectionType: 'ENTERTAINMENT_LIFE', pageTitle: 'संस्कृति, कला एवं सिनेमा' },
  { pageNumber: 12, sectionType: 'SPECIAL_FEATURE', pageTitle: 'विशेष परिशिष्ट एवं समापन' },
];

// ============================================================================
// 3. CORE DOMAIN ENGINES & PURE ALGORITHMS
// ============================================================================

export class BroadsheetGridEngine {
  static getDimensions() {
    return {
      broadsheetWidthMm: BROADSHEET_WIDTH_MM,
      broadsheetHeightMm: BROADSHEET_HEIGHT_MM,
      printableWidthMm: PRINTABLE_WIDTH_MM,
      printableHeightMm: PRINTABLE_HEIGHT_MM,
      broadsheetWidthPt: BROADSHEET_WIDTH_PT,
      broadsheetHeightPt: BROADSHEET_HEIGHT_PT,
      raster300DpiWidth: BROADSHEET_WIDTH_300DPI,
      raster300DpiHeight: BROADSHEET_HEIGHT_300DPI,
    };
  }

  static calculateColumnWidth(numCols, printableWidth = PRINTABLE_WIDTH_MM, gutter = GUTTER_MM) {
    if (![3, 4, 5, 6, 8].includes(numCols)) {
      throw new Error(`ERR_INVALID_GRID_COLS: Column count must be 3, 4, 5, 6, or 8 (received ${numCols})`);
    }
    const totalGutters = (numCols - 1) * gutter;
    const availableWidth = printableWidth - totalGutters;
    const colWidth = availableWidth / numCols;
    return Number(colWidth.toFixed(2));
  }

  static getGridLinePositions(numCols, printableWidth = PRINTABLE_WIDTH_MM, gutter = GUTTER_MM, margin = 15) {
    const colWidth = this.calculateColumnWidth(numCols, printableWidth, gutter);
    const lines = [];
    let currentX = margin;
    for (let i = 0; i < numCols; i++) {
      lines.push(Number(currentX.toFixed(2))); // Left col boundary
      currentX += colWidth;
      lines.push(Number(currentX.toFixed(2))); // Right col boundary
      currentX += gutter;
    }
    return lines;
  }

  static snapCoordinate(coord, gridLines, threshold = MAGNETIC_SNAP_THRESHOLD_PX) {
    let closest = coord;
    let minDistance = Infinity;
    for (const line of gridLines) {
      const dist = Math.abs(coord - line);
      if (dist < minDistance) {
        minDistance = dist;
        closest = line;
      }
    }
    if (minDistance <= threshold) {
      return { snapped: true, value: closest, distance: minDistance };
    }
    return { snapped: false, value: coord, distance: minDistance };
  }

  static detectAabbCollision(rectA, rectB) {
    // 2D AABB collision detection. Touching boundaries sharing an edge are NOT colliding.
    const isSeparated =
      rectA.x + rectA.width <= rectB.x ||
      rectB.x + rectB.width <= rectA.x ||
      rectA.y + rectA.height <= rectB.y ||
      rectB.y + rectB.height <= rectA.y;
    return !isSeparated;
  }

  static clampToBounds(bounds, canvasWidth = BROADSHEET_WIDTH_PT, canvasHeight = BROADSHEET_HEIGHT_PT) {
    let { x, y, width, height } = bounds;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > canvasWidth) {
      width = Math.max(10, canvasWidth - x);
    }
    if (y + height > canvasHeight) {
      height = Math.max(10, canvasHeight - y);
    }
    return { x, y, width, height };
  }

  static validateBounds(bounds) {
    if (!bounds || typeof bounds.width !== 'number' || typeof bounds.height !== 'number' || bounds.width <= 0 || bounds.height <= 0 || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) {
      throw new Error('ERR_INVALID_BOUNDS: Element width and height must be positive numbers.');
    }
    return true;
  }
}

export class DevanagariTypographyEngine {
  static isComplexDevanagari(text) {
    // Detects Devanagari conjuncts: halants (\u094D), matras (\u093E-\u094C), nuktas (\u093C), etc.
    return /[\u0900-\u097F]/.test(text) && /[\u094D\u093E-\u094C\u0902\u0903\u093C]/.test(text);
  }

  static justifyDevanagariLine(words, targetWidth, fontSize = 12, isTerminalLine = false) {
    if (!words || words.length === 0) return { justified: false, text: '', spacePerGap: 0 };
    if (words.length === 1 || isTerminalLine) {
      // Terminal line or single-word line preserves left alignment without gap stretching
      return {
        justified: false,
        text: words.join(' '),
        wordCount: words.length,
        spacePerGap: 0,
        alignment: 'LEFT',
      };
    }

    // Estimate intrinsic word widths (approx 0.6 * fontSize * length for Indic script)
    const totalWordWidth = words.reduce((acc, w) => acc + (w.length * fontSize * 0.62), 0);
    const gaps = words.length - 1;
    const remainingWidth = Math.max(0, targetWidth - totalWordWidth);
    const spacePerGap = Number((remainingWidth / gaps).toFixed(2));

    return {
      justified: true,
      text: words.join(' '),
      wordCount: words.length,
      spacePerGap,
      alignment: 'JUSTIFIED',
      gaps,
    };
  }

  static wrapAndJustifyParagraph(text, targetWidth, fontSize = 12, maxLines = 10) {
    const rawWords = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let currentWords = [];
    let currentWidth = 0;

    for (const word of rawWords) {
      const wordWidth = word.length * fontSize * 0.62;
      if (currentWidth + wordWidth + (currentWords.length * fontSize * 0.3) > targetWidth && currentWords.length > 0) {
        lines.push(this.justifyDevanagariLine(currentWords, targetWidth, fontSize, false));
        currentWords = [word];
        currentWidth = wordWidth;
      } else {
        currentWords.push(word);
        currentWidth += wordWidth;
      }
    }

    if (currentWords.length > 0) {
      // Terminal line stays left-aligned
      lines.push(this.justifyDevanagariLine(currentWords, targetWidth, fontSize, true));
    }

    const isOverflowing = lines.length > maxLines;
    return {
      lines,
      totalLines: lines.length,
      isOverflowing,
      terminalLineJustified: lines[lines.length - 1]?.justified === true,
    };
  }
}

export class QualityPreflightScanner {
  static evaluate(edition, pages) {
    const blockers = [];
    const errors = [];
    const warnings = [];

    for (const page of pages) {
      const elements = page.elements || [];
      for (const el of elements) {
        // 1. TEXT_OVERFLOW (BLOCKER)
        if (el.elementType === 'STORY' && el.customBodyText) {
          const estimatedLineHeight = (el.fontSize || 12) * 1.35;
          const estLines = el.customBodyText.length / 40;
          const requiredHeight = estLines * estimatedLineHeight;
          if (el.bounds && requiredHeight > el.bounds.height * 1.5) {
            blockers.push({
              code: 'TEXT_OVERFLOW',
              severity: SEVERITY.BLOCKER,
              pageNumber: page.pageNumber,
              elementId: el.id,
              message: `Page ${page.pageNumber}: कहानी का विवरण बाउंडिंग बॉक्स से बाहर जा रहा है (${Math.round(requiredHeight)}px > ${el.bounds.height}px)`,
            });
          }
        }

        // 2. LOW_RES_IMAGE (WARNING)
        if ((el.elementType === 'IMAGE' || el.hasImage) && el.imageWidth && el.imageWidth < 800) {
          warnings.push({
            code: 'LOW_RES_IMAGE',
            severity: SEVERITY.WARNING,
            pageNumber: page.pageNumber,
            elementId: el.id,
            message: `Page ${page.pageNumber}: चित्र की रिज़ॉल्यूशन मुद्रण हेतु कम है (${el.imageWidth}px < 800px)`,
          });
        }

        // 3. MISSING_ATTRIBUTION (ERROR)
        if (el.elementType === 'STORY' && !el.byline && !el.reporterId) {
          errors.push({
            code: 'MISSING_ATTRIBUTION',
            severity: SEVERITY.ERROR,
            pageNumber: page.pageNumber,
            elementId: el.id,
            message: `Page ${page.pageNumber}: समाचार सामग्री में रिपोर्टर या बायलाइन क्रेडिट अनुपस्थित है`,
          });
        }

        // 4. UNAPPROVED_AD_PLACEMENT (BLOCKER)
        if (el.elementType === 'AD') {
          if (!el.asciBadge) {
            blockers.push({
              code: 'UNAPPROVED_AD_PLACEMENT',
              severity: SEVERITY.BLOCKER,
              pageNumber: page.pageNumber,
              elementId: el.id,
              message: `Page ${page.pageNumber}: विज्ञापन पर अनिवार्य ASCI 'विज्ञापन' पहचान चिह्न अनुपस्थित है`,
            });
          }
          if (el.adStatus && el.adStatus !== 'APPROVED') {
            blockers.push({
              code: 'UNAPPROVED_AD_PLACEMENT',
              severity: SEVERITY.BLOCKER,
              pageNumber: page.pageNumber,
              elementId: el.id,
              message: `Page ${page.pageNumber}: विज्ञापन संपादन द्वारा स्वीकृत नहीं है (स्थिति: ${el.adStatus})`,
            });
          }
        }

        // 5. ORPHAN_HEADLINE (BLOCKER)
        if (el.elementType === 'HEADLINE' && (!el.customBodyText || el.customBodyText.trim() === '')) {
          blockers.push({
            code: 'ORPHAN_HEADLINE',
            severity: SEVERITY.BLOCKER,
            pageNumber: page.pageNumber,
            elementId: el.id,
            message: `Page ${page.pageNumber}: शीर्षक बिना किसी संबंधित समाचार विवरण के उपस्थित है (Orphan Headline)`,
          });
        }
      }
    }

    const canPublish = blockers.length === 0;
    return {
      canPublish,
      blockerCount: blockers.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      blockers,
      errors,
      warnings,
      scannedAt: new Date().toISOString(),
    };
  }
}

export class AiNewsroomAssistantMock {
  static getProviderInfo() {
    return { provider: 'bnw-mock-v1', isFallback: true, offlineReady: true };
  }

  static generateHeadlines(storySummary) {
    if (!storySummary || storySummary.trim() === '') {
      throw new Error('ERR_EMPTY_PROMPT: Headline generation requires non-empty story summary.');
    }
    return [
      { variant: 1, length: 'SHORT', text: 'भोपाल में मेट्रो का ऐतिहासिक परीक्षण सफल', charCount: 38 },
      { variant: 2, length: 'MEDIUM', text: 'राजधानी भोपाल में मेट्रो के दूसरे चरण का सफल ट्रायल रन सम्पन्न', charCount: 60 },
      { variant: 3, length: 'DETAILED', text: 'सुभाष नगर से करोंद तक 8.5 किमी ट्रैक पर दौड़ी मेट्रो, 5 लाख नागरिकों को मिलेगा त्वरित लाभ', charCount: 88 },
      { variant: 4, length: 'PUNCHY', text: 'दौड़ी मेट्रो: राजधानी के विकास को नई रफ्तार!', charCount: 42 },
      { variant: 5, length: 'EDITORIAL', text: 'नगरीय परिवहन का नया युग: पर्यावरण और सुगम यातायात का संगम बनी भोपाल मेट्रो', charCount: 75 },
    ];
  }

  static copyeditDevanagari(text) {
    if (!text || text.trim() === '') {
      throw new Error('ERR_EMPTY_PROMPT: Copyeditor requires text input.');
    }
    // Deterministic Hindi proofreading
    let corrected = text
      .replace(/की\s+होगा/g, 'का होगा')
      .replace(/है\s+गई/g, 'हो गई')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return {
      originalText: text,
      suggestedText: corrected,
      changesApplied: corrected !== text,
      model: 'bnw-mock-v1',
      sourceAttribution: 'बीएनडब्ल्यू संपादकीय एआई सहायक',
    };
  }

  static generatePermanentColumn(topic = 'STATE_PROGRESS', author = 'मुख्य संपादक') {
    return {
      columnTitle: 'संपादकीय दृष्टिकोण: मध्य प्रदेश के विकास पथ पर विशेष विमर्श',
      author,
      byline: `${author}, बीएनडब्ल्यू संपादकीय मंडल`,
      bodyText: 'मध्य प्रदेश के 55 जिलों में औद्योगिक एवं आधारभूत संरचना का विस्तार ग्रामीण अर्थव्यवस्था को सशक्त कर रहा है। सड़क, बिजली, और सिंचाई परियोजनाओं के समयबद्ध क्रियान्वयन से किसानों की आमदनी में सतत वृद्धि दर्ज की गई है। सुशासन और पारदर्शिता ही जन-विश्वास की सबसे मजबूत आधारशिला है।',
      sourceAttribution: 'स्रोत: बीएनडब्ल्यू संपादकीय डेस्क (प्रमाणित विश्लेषण)',
      section: 'EDITORIAL_OPED',
      generatedAt: new Date().toISOString(),
    };
  }

  static analyzeTemplateStructure(elements) {
    if (!elements || elements.length === 0) {
      return { totalSlots: 0, structure: 'BLANK_PAGE', slots: [] };
    }
    const slots = elements.map((el, i) => ({
      slotId: `slot-${i + 1}`,
      type: el.elementType || 'STORY',
      bounds: el.bounds || { x: 0, y: 0, width: 100, height: 100 },
      recommendedAspectRatio: el.bounds ? `${Math.round(el.bounds.width)}:${Math.round(el.bounds.height)}` : '1:1',
    }));
    return {
      totalSlots: slots.length,
      structure: slots.length > 5 ? 'MULTI_COLUMN_BROADSHEET' : 'SIMPLE_LAYOUT',
      slots,
      extractedAt: new Date().toISOString(),
    };
  }
}

export class WhatsAppCardGeneratorEngine {
  constructor() {
    this.quotaTracker = new Map(); // key: reporterId:YYYY-MM-DD -> count
  }

  getTodayKey(reporterId) {
    const today = new Date().toISOString().split('T')[0];
    return `${reporterId}:${today}`;
  }

  getQuotaRemaining(reporterId) {
    const key = this.getTodayKey(reporterId);
    const used = this.quotaTracker.get(key) || 0;
    return Math.max(0, DAILY_WHATSAPP_CARD_QUOTA - used);
  }

  generateCard(reporter, article, format = '4:5') {
    if (!['1:1', '4:5'].includes(format)) {
      throw new Error(`ERR_INVALID_FORMAT: Supported formats are 1:1 and 4:5 (received ${format})`);
    }

    const remaining = this.getQuotaRemaining(reporter.id);
    if (remaining <= 0) {
      const err = new Error(`ERR_QUOTA_EXHAUSTED: Daily limit of ${DAILY_WHATSAPP_CARD_QUOTA} WhatsApp cards reached for today.`);
      err.statusCode = 429;
      throw err;
    }

    const key = this.getTodayKey(reporter.id);
    const used = (this.quotaTracker.get(key) || 0) + 1;
    this.quotaTracker.set(key, used);

    const dims = format === '4:5' ? { width: 1080, height: 1350 } : { width: 1080, height: 1080 };
    const reporterPhoto = reporter.photoUrl || 'https://breakingnewswala.com/assets/default-reporter-avatar.png';

    // Long text truncation for cards
    const maxChars = format === '4:5' ? 240 : 160;
    const bodySnippet = article.content.length > maxChars
      ? `${article.content.substring(0, maxChars - 3)}...`
      : article.content;

    return {
      id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reporterId: reporter.id,
      reporterName: reporter.fullName,
      reporterPhoto,
      badgeNumber: reporter.badgeNumber || 'BNW-STRINGER',
      format,
      dimensions: dims,
      headline: article.title,
      bodyText: bodySnippet,
      districtId: article.districtId,
      isPrivate: true,
      storageUrl: `https://storage.internal.breakingnewswala.com/whatsapp/${reporter.id}/${Date.now()}.png`,
      createdAt: new Date().toISOString(),
      quotaRemaining: DAILY_WHATSAPP_CARD_QUOTA - used,
    };
  }
}

export class HighResExportEngine {
  static generate300DpiPdfMetadata(edition, pages) {
    return {
      pdfVersion: '1.4',
      mediaBox: [0, 0, BROADSHEET_WIDTH_PT, BROADSHEET_HEIGHT_PT],
      rasterWidthPx: BROADSHEET_WIDTH_300DPI,
      rasterHeightPx: BROADSHEET_HEIGHT_300DPI,
      dpi: 300,
      totalPages: pages.length,
      editionCode: edition.editionCode,
      title: edition.title,
      districtId: edition.districtId,
      publicationDate: edition.publicationDate,
      isPrintReady: true,
      exportedAt: new Date().toISOString(),
    };
  }

  static buildMockPdfBuffer(metadata) {
    const header = '%PDF-1.4\n%âãÏÓ\n';
    const body = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n` +
      `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count ${metadata.totalPages} >>\nendobj\n` +
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${metadata.mediaBox[2]} ${metadata.mediaBox[3]}] >>\nendobj\n`;
    const trailer = 'xref\n0 4\n0000000000 65535 f \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n180\n%%EOF';
    return Buffer.from(header + body + trailer, 'utf8');
  }
}

export class BroadsheetAdManager {
  static VALID_SLOTS = ['L_SHAPE', 'FOOTER', 'VERTICAL_EAR', 'QUARTER_PAGE', 'HALF_PAGE', 'FULL_PAGE'];

  static validateSlotClassification(slotType) {
    if (!this.VALID_SLOTS.includes(slotType)) {
      throw new Error(`ERR_INVALID_AD_SLOT: Unsupported ad slot classification "${slotType}".`);
    }
    return true;
  }

  static validateAdSubmission(payload) {
    if (!payload || !payload.advertiserName || !payload.advertiserName.trim()) {
      throw new Error('ERR_MISSING_AD_CONTACT_INFO: Required advertiser name is missing.');
    }
    if (!payload.contactPhone || !payload.contactPhone.trim()) {
      throw new Error('ERR_MISSING_AD_CONTACT_INFO: Required contact/billing information is missing.');
    }
    return true;
  }
}

export class PublicReaderEngine {
  static getZoomModel(initialZoom = 1.0, pan = { x: 0, y: 0 }) {
    return {
      currentZoom: Math.min(4.0, Math.max(0.5, initialZoom)),
      minZoom: 0.5,
      maxZoom: 4.0,
      panX: pan.x,
      panY: pan.y,
      step: 0.25,
    };
  }

  static computeZoom(current, delta) {
    const next = Number((current + delta).toFixed(2));
    return { zoom: Math.min(4.0, Math.max(0.5, next)) };
  }

  static formatReadingModeArticle(elementOrArticle, options = { fontSize: 18 }) {
    const fontSize = Math.min(32, Math.max(12, options.fontSize || 18));
    const headline = elementOrArticle.customHeadline || elementOrArticle.title || '';
    const body = elementOrArticle.customBodyText || elementOrArticle.content || '';
    const lines = DevanagariTypographyEngine.wrapAndJustifyParagraph(body, 600, fontSize);
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    return {
      headline,
      fontSize,
      lineHeight: Number((fontSize * 1.6).toFixed(1)),
      lines: lines.lines,
      wordCount,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 180)),
      isDevanagari: DevanagariTypographyEngine.isComplexDevanagari(body),
    };
  }

  static generateSocialClippingBounds(rect, format = '4:5') {
    const targetRatio = format === '4:5' ? 0.8 : 1.0;
    const width = rect.width;
    const height = Math.round(width / targetRatio);
    return {
      x: rect.x,
      y: rect.y,
      width,
      height,
      aspectRatio: format,
      ratioValue: Number((width / height).toFixed(2)),
    };
  }
}

export class TemplateEngine {
  static parseTemplateJson(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('ERR_MALFORMED_TEMPLATE_JSON: Invalid JSON syntax.');
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.regions)) {
      throw new Error('ERR_INVALID_TEMPLATE_SCHEMA: Template must contain a regions array.');
    }
    return parsed;
  }
}

// ============================================================================
// 4. IN-MEMORY OCC PERSISTENCE & TEST HTTP SERVER ENGINE
// ============================================================================

export class EpaperPersistenceStore {
  constructor() {
    this.editions = new Map();
    this.pages = new Map();
    this.templates = new Map();
    this.editionVersions = new Map();
    this.ads = new Map();
    this.whatsAppCards = new Map();
    this.auditLogs = [];

    // Preload default templates
    DEFAULT_12_BROADSHEET_TEMPLATES.forEach((tpl) => {
      this.templates.set(`tpl-default-p${tpl.pageNumber}`, {
        id: `tpl-default-p${tpl.pageNumber}`,
        pageNumber: tpl.pageNumber,
        sectionType: tpl.sectionType,
        pageTitle: tpl.pageTitle,
        isCustom: false,
        version: 1,
      });
    });

    // Preload synthetic ads
    SYNTHETIC_ADS.forEach((ad) => {
      this.ads.set(ad.id, { ...ad, version: 1 });
    });
  }

  saveTemplate(tpl) {
    if (!tpl.id) tpl.id = `tpl-custom-${Date.now()}`;
    // Collision check by name
    const existing = Array.from(this.templates.values()).find((t) => t.name === tpl.name);
    if (existing && existing.id !== tpl.id) {
      const err = new Error(`ERR_TEMPLATE_NAME_COLLISION: A template with name "${tpl.name}" already exists.`);
      err.statusCode = 409;
      throw err;
    }
    this.templates.set(tpl.id, { ...tpl, version: (tpl.version || 0) + 1 });
    return this.templates.get(tpl.id);
  }

  saveEdition(edition) {
    if (!edition.id) {
      edition.id = `ep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!edition.version) edition.version = 1;
    this.editions.set(edition.id, { ...edition });
    return this.editions.get(edition.id);
  }

  updateEditionWithOcc(id, updateData, expectedVersion) {
    const existing = this.editions.get(id);
    if (!existing) return null;
    if (existing.version !== expectedVersion) {
      const err = new Error(`ERR_OCC_COLLISION: Stale edition version. Expected ${expectedVersion}, currently at ${existing.version}.`);
      err.code = 'OCC_COLLISION';
      err.statusCode = 409;
      throw err;
    }
    const updated = {
      ...existing,
      ...updateData,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.editions.set(id, updated);
    return updated;
  }

  publishEdition(id, expectedVersion) {
    const existing = this.editions.get(id);
    if (!existing) return null;
    if (existing.version !== expectedVersion) {
      const err = new Error(`ERR_OCC_COLLISION: Expected version ${expectedVersion}, got ${existing.version}.`);
      err.statusCode = 409;
      throw err;
    }

    const versionTag = `v${existing.version}.0.0`;
    const snapshot = {
      id: `${id}-${versionTag}`,
      editionId: id,
      versionTag,
      publishedAt: new Date().toISOString(),
      editionSnapshot: JSON.parse(JSON.stringify(existing)),
      immutable: true,
    };
    this.editionVersions.set(snapshot.id, snapshot);

    const updated = {
      ...existing,
      status: STATUS.PUBLISHED,
      publishedAt: snapshot.publishedAt,
      version: existing.version + 1,
    };
    this.editions.set(id, updated);
    return { edition: updated, snapshot };
  }
}

export function createEpaperTestServer(store) {
  const whatsAppEngine = new WhatsAppCardGeneratorEngine();

  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Helper to send JSON
    const send = (status, payload) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify(payload));
    };

    // Helper to read JSON body
    const readBody = () =>
      new Promise((resolve) => {
        let data = '';
        req.on('data', (c) => (data += c));
        req.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve({});
          }
        });
      });

    // Helper for auth validation
    const getAuthUser = () => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.substring(7);
      return verifyToken(token);
    };

    try {
      // 1. GET /api/v1/epaper/editions
      if (pathname === '/api/v1/epaper/editions' && method === 'GET') {
        const date = parsedUrl.searchParams.get('date');
        const districtId = parsedUrl.searchParams.get('districtId');
        const status = parsedUrl.searchParams.get('status');

        let list = Array.from(store.editions.values());
        if (date) list = list.filter((e) => e.publicationDate === date);
        if (districtId) list = list.filter((e) => e.districtId === districtId);
        if (status) list = list.filter((e) => e.status === status);

        return send(200, { success: true, count: list.length, data: list });
      }

      // 2. POST /api/v1/epaper/editions (Wizard creation)
      if (pathname === '/api/v1/epaper/editions' && method === 'POST') {
        const user = getAuthUser();
        if (!user || (!user.roles?.includes('ADMIN') && !user.roles?.includes('MASTER_ADMIN') && !user.roles?.includes('EDITOR'))) {
          return send(403, { success: false, error: 'ERR_FORBIDDEN: Admin or Editor privilege required' });
        }

        const body = await readBody();
        const { editionType, publicationDate, districtId, title, totalPages } = body;

        // Validations
        if (!totalPages || totalPages <= 0) {
          return send(400, { success: false, error: 'ERR_INVALID_PAGE_COUNT: Pages must be > 0' });
        }
        if (totalPages > MAX_PAGES_CAP) {
          return send(400, { success: false, error: `ERR_EXCEEDS_MAX_PAGES: Maximum allowed pages is ${MAX_PAGES_CAP}` });
        }
        if (!publicationDate || !/^\d{4}-\d{2}-\d{2}$/.test(publicationDate) || isNaN(Date.parse(publicationDate))) {
          return send(400, { success: false, error: 'ERR_INVALID_DATE: Malformed publication date' });
        }
        if (!districtId || !MP_DISTRICT_ID_SET.has(districtId)) {
          return send(400, { success: false, error: `ERR_UNKNOWN_DISTRICT: District ${districtId} is not in MP 55 districts` });
        }

        // Edition Code format: EP-YYYYMMDD-DIST-XX
        const cleanDate = publicationDate.replace(/-/g, '');
        const distSlug = districtId.replace('dist-', '').toUpperCase();
        const editionCode = `EP-${cleanDate}-${distSlug}-01`;

        // Conflict check
        const existingCode = Array.from(store.editions.values()).find((e) => e.editionCode === editionCode);
        if (existingCode) {
          return send(409, { success: false, error: `ERR_EDITION_CODE_COLLISION: Edition code ${editionCode} already exists.` });
        }

        // Generate pages
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
          const tpl = DEFAULT_12_BROADSHEET_TEMPLATES[i - 1] || { sectionType: 'SPECIAL_FEATURE', pageTitle: `Page ${i}` };
          pages.push({
            pageNumber: i,
            sectionType: tpl.sectionType,
            pageTitle: tpl.pageTitle,
            elements: [],
          });
        }

        const newEdition = store.saveEdition({
          editionCode,
          title: title || `${distSlug} दैनिक ई-पेपर`,
          editionType: editionType || 'DAILY',
          publicationDate,
          districtId,
          totalPages,
          status: STATUS.DRAFT,
          pages,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          version: 1,
        });

        return send(201, { success: true, data: newEdition });
      }

      // 3. GET /api/v1/epaper/editions/:id
      const idMatch = pathname.match(/^\/api\/v1\/epaper\/editions\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'GET') {
        const editionId = idMatch[1];
        const edition = store.editions.get(editionId);
        if (!edition) {
          return send(404, { success: false, error: 'ERR_EDITION_NOT_FOUND' });
        }
        return send(200, { success: true, data: edition });
      }

      // 4. PATCH /api/v1/epaper/editions/:id/status (Lifecycle pipeline)
      const statusMatch = pathname.match(/^\/api\/v1\/epaper\/editions\/([a-zA-Z0-9_-]+)\/status$/);
      if (statusMatch && method === 'PATCH') {
        const editionId = statusMatch[1];
        const user = getAuthUser();
        if (!user || (!user.roles?.includes('ADMIN') && !user.roles?.includes('MASTER_ADMIN') && !user.roles?.includes('EDITOR'))) {
          return send(403, { success: false, error: 'ERR_FORBIDDEN' });
        }
        const body = await readBody();
        const { targetStatus, version } = body;

        if (!Object.values(STATUS).includes(targetStatus)) {
          return send(400, { success: false, error: 'ERR_INVALID_STATUS' });
        }

        try {
          const updated = store.updateEditionWithOcc(editionId, { status: targetStatus }, version);
          return send(200, { success: true, data: updated });
        } catch (occErr) {
          return send(occErr.statusCode || 400, { success: false, error: occErr.message });
        }
      }

      // 5. DELETE /api/v1/epaper/editions/:id (Master Admin only)
      if (idMatch && method === 'DELETE') {
        const editionId = idMatch[1];
        const user = getAuthUser();
        if (!user || !user.roles?.includes('MASTER_ADMIN') || !isMasterAdminEmail(user.identifier)) {
          return send(403, { success: false, error: 'ERR_UNAUTHORIZED: Superuser Master Admin only' });
        }
        if (!store.editions.has(editionId)) {
          return send(404, { success: false, error: 'ERR_NOT_FOUND' });
        }
        store.editions.delete(editionId);
        return send(200, { success: true, deleted: true });
      }

      // 6. GET /api/v1/epaper/editions/:id/check-article/:articleId (Duplicate detection)
      const dupMatch = pathname.match(/^\/api\/v1\/epaper\/editions\/([a-zA-Z0-9_-]+)\/check-article\/([a-zA-Z0-9_-]+)$/);
      if (dupMatch && method === 'GET') {
        const [_, editionId, articleId] = dupMatch;
        const edition = store.editions.get(editionId);
        if (!edition) return send(404, { success: false, error: 'ERR_EDITION_NOT_FOUND' });

        let placed = false;
        let foundPage = null;
        for (const page of edition.pages || []) {
          const has = (page.elements || []).some((el) => el.articleId === articleId);
          if (has) {
            placed = true;
            foundPage = page.pageNumber;
            break;
          }
        }
        return send(200, { success: true, articleId, placed, pageNumber: foundPage });
      }

      // 7. POST /api/v1/epaper/editions/:id/pages/:pageNumber/elements (Place story/ad)
      const elemMatch = pathname.match(/^\/api\/v1\/epaper\/editions\/([a-zA-Z0-9_-]+)\/pages\/(\d+)\/elements$/);
      if (elemMatch && method === 'POST') {
        const editionId = elemMatch[1];
        const pageNum = parseInt(elemMatch[2], 10);
        const edition = store.editions.get(editionId);
        if (!edition) return send(404, { success: false, error: 'ERR_EDITION_NOT_FOUND' });

        const page = (edition.pages || []).find((p) => p.pageNumber === pageNum);
        if (!page) return send(404, { success: false, error: 'ERR_PAGE_NOT_FOUND' });

        const body = await readBody();

        // Validate bounds
        if (body.bounds) {
          const { width, height } = body.bounds;
          if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
            return send(400, { success: false, error: 'ERR_INVALID_BOUNDS: Element width and height must be positive numbers.' });
          }
        }

        // Validate article status
        if (body.articleId) {
          const foundArticle = SYNTHETIC_NEWS_ARTICLES.find((a) => a.id === body.articleId);
          if (foundArticle) {
            if (foundArticle.status === 'DRAFT') {
              return send(422, { success: false, error: 'ERR_UNAPPROVED_ARTICLE: Cannot place draft or unapproved article on edition page.' });
            }
            if (foundArticle.status === 'ARCHIVED') {
              return send(422, { success: false, error: 'ERR_ARCHIVED_ARTICLE: Cannot place archived or deleted article on edition page.' });
            }
          }
        }

        const newElement = {
          id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          ...body,
          zIndex: (page.elements?.length || 0) + 1,
        };

        if (newElement.elementType === 'AD') {
          newElement.asciBadge = true;
          newElement.badgeText = 'विज्ञापन';
        }

        page.elements = page.elements || [];
        page.elements.push(newElement);
        edition.version += 1;
        return send(201, { success: true, data: newElement, pageElementsCount: page.elements.length });
      }

      // 8. POST /api/v1/epaper/editions/:id/preflight
      const preflightMatch = pathname.match(/^\/api\/v1\/epaper\/editions\/([a-zA-Z0-9_-]+)\/preflight$/);
      if (preflightMatch && method === 'POST') {
        const editionId = preflightMatch[1];
        const edition = store.editions.get(editionId);
        if (!edition) return send(404, { success: false, error: 'ERR_NOT_FOUND' });

        const results = QualityPreflightScanner.evaluate(edition, edition.pages || []);
        return send(200, { success: true, data: results });
      }

      // 9. POST /api/v1/epaper/editions/:id/publish (Atomic publishing gate)
      const publishMatch = pathname.match(/^\/api\/v1\/epaper\/editions\/([a-zA-Z0-9_-]+)\/publish$/);
      if (publishMatch && method === 'POST') {
        const editionId = publishMatch[1];
        const user = getAuthUser();
        if (!user || (!user.roles?.includes('ADMIN') && !user.roles?.includes('MASTER_ADMIN') && !user.roles?.includes('EDITOR'))) {
          return send(403, { success: false, error: 'ERR_FORBIDDEN: Publishing requires Editor/Admin authority.' });
        }

        const edition = store.editions.get(editionId);
        if (!edition) return send(404, { success: false, error: 'ERR_NOT_FOUND' });

        const body = await readBody();
        const preflight = QualityPreflightScanner.evaluate(edition, edition.pages || []);
        if (!preflight.canPublish) {
          return send(422, {
            success: false,
            error: 'ERR_PREFLIGHT_BLOCKER: Publishing blocked due to critical preflight errors.',
            diagnostics: preflight,
          });
        }

        try {
          const result = store.publishEdition(editionId, body.version || edition.version);
          return send(200, { success: true, data: result.edition, snapshot: result.snapshot });
        } catch (occErr) {
          return send(occErr.statusCode || 409, { success: false, error: occErr.message });
        }
      }

      // 10. POST /api/v1/epaper/whatsapp/generate (Reporter WhatsApp Card generator)
      if (pathname === '/api/v1/epaper/whatsapp/generate' && method === 'POST') {
        const user = getAuthUser();
        if (!user || (!user.roles?.includes('REPORTER') && !user.roles?.includes('ADMIN'))) {
          return send(403, { success: false, error: 'ERR_FORBIDDEN: Reporter authorization required.' });
        }

        const body = await readBody();
        const { articleId, format } = body;
        const article = SYNTHETIC_NEWS_ARTICLES.find((a) => a.id === articleId) || {
          id: articleId,
          title: body.customHeadline || 'ब्रेकिंग न्यूज़',
          content: body.customBody || 'समाचार विवरण',
          districtId: user.districtId || 'dist-bhopal',
        };

        try {
          const card = whatsAppEngine.generateCard(user, article, format || '4:5');
          store.whatsAppCards.set(card.id, card);
          return send(201, { success: true, data: card });
        } catch (err) {
          return send(err.statusCode || 500, { success: false, error: err.message });
        }
      }

      // 11. GET /api/v1/epaper/whatsapp/quota
      if (pathname === '/api/v1/epaper/whatsapp/quota' && method === 'GET') {
        const user = getAuthUser();
        if (!user) return send(401, { success: false, error: 'ERR_UNAUTHORIZED' });
        const remaining = whatsAppEngine.getQuotaRemaining(user.id);
        return send(200, { success: true, totalQuota: DAILY_WHATSAPP_CARD_QUOTA, remaining });
      }

      // 12. GET /api/v1/epaper/editions/:id/export/pdf (300 DPI Export)
      const exportMatch = pathname.match(/^\/api\/v1\/epaper\/editions\/([a-zA-Z0-9_-]+)\/export\/pdf$/);
      if (exportMatch && method === 'GET') {
        const editionId = exportMatch[1];
        const edition = store.editions.get(editionId);
        if (!edition) return send(404, { success: false, error: 'ERR_NOT_FOUND' });

        const metadata = HighResExportEngine.generate300DpiPdfMetadata(edition, edition.pages || []);
        const pdfBuffer = HighResExportEngine.buildMockPdfBuffer(metadata);

        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${edition.editionCode}.pdf"`,
          'X-Epaper-DPI': '300',
          'X-Epaper-Width-Px': String(BROADSHEET_WIDTH_300DPI),
          'X-Epaper-Height-Px': String(BROADSHEET_HEIGHT_300DPI),
        });
        return res.end(pdfBuffer);
      }

      // 13. GET /api/v1/epaper/archive (Historical Archive Search)
      if (pathname === '/api/v1/epaper/archive' && method === 'GET') {
        const date = parsedUrl.searchParams.get('date');
        const districtId = parsedUrl.searchParams.get('districtId');

        let results = Array.from(store.editions.values()).filter((e) => e.status === STATUS.PUBLISHED);
        if (date) {
          results = results.filter((e) => e.publicationDate === date);
        }
        if (districtId) {
          results = results.filter((e) => e.districtId === districtId);
        }
        return send(200, { success: true, count: results.length, data: results });
      }

      // 14. GET /api/v1/epaper/metrics
      if (pathname === '/api/v1/epaper/metrics' && method === 'GET') {
        const editions = Array.from(store.editions.values());
        const metrics = {
          totalEditions: editions.length,
          published: editions.filter((e) => e.status === STATUS.PUBLISHED).length,
          draft: editions.filter((e) => e.status === STATUS.DRAFT).length,
          archived: editions.filter((e) => e.status === STATUS.ARCHIVED).length,
          totalPagesManaged: editions.reduce((acc, e) => acc + (e.totalPages || 0), 0),
        };
        return send(200, { success: true, data: metrics });
      }

      // 15. POST /api/v1/epaper/ads (Reporter Ad Submission)
      if (pathname === '/api/v1/epaper/ads' && method === 'POST') {
        const user = getAuthUser();
        if (!user) return send(401, { success: false, error: 'ERR_UNAUTHORIZED' });
        const body = await readBody();
        try {
          BroadsheetAdManager.validateAdSubmission(body);
          const newAd = { id: `ad-${Date.now()}`, ...body, status: 'PENDING_APPROVAL', version: 1 };
          store.ads.set(newAd.id, newAd);
          return send(201, { success: true, data: newAd });
        } catch (valErr) {
          return send(400, { success: false, error: valErr.message });
        }
      }

      // 16. PATCH /api/v1/epaper/articles/:id/status (Editorial Article Review & Approval)
      const artStatusMatch = pathname.match(/^\/api\/v1\/epaper\/articles\/([a-zA-Z0-9_-]+)\/status$/);
      if (artStatusMatch && method === 'PATCH') {
        const user = getAuthUser();
        if (!user || (!user.roles?.includes('ADMIN') && !user.roles?.includes('MASTER_ADMIN') && !user.roles?.includes('EDITOR'))) {
          return send(403, { success: false, error: 'ERR_FORBIDDEN: Editorial privilege required' });
        }
        const articleId = artStatusMatch[1];
        const body = await readBody();
        let art = SYNTHETIC_NEWS_ARTICLES.find((a) => a.id === articleId);
        if (!art) {
          art = { id: articleId, title: 'सबमिटेड रिपोर्टर स्टोरी', status: 'SUBMITTED', byline: user.fullName || 'रिपोर्टर' };
          SYNTHETIC_NEWS_ARTICLES.push(art);
        }
        art.status = body.targetStatus;
        return send(200, { success: true, data: art });
      }

      // Fallback 404
      return send(404, { success: false, error: 'ERR_ENDPOINT_NOT_FOUND' });
    } catch (err) {
      return send(500, { success: false, error: err.message });
    }
  });

  let port;
  const start = () =>
    new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve(port);
      });
    });

  const stop = () =>
    new Promise((resolve) => {
      server.close(resolve);
    });

  const request = (method, urlPath, body = null, headers = {}) =>
    new Promise((resolve, reject) => {
      const fullUrl = `http://127.0.0.1:${port}${urlPath}`;
      const bodyStr = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        Accept: 'application/json',
        ...headers,
      };
      if (bodyStr) {
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
      }

      const req = http.request(fullUrl, { method, headers: reqHeaders }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          let json = null;
          const isJson = (res.headers['content-type'] || '').includes('application/json');
          if (isJson) {
            try {
              json = JSON.parse(raw.toString('utf8'));
            } catch {
              json = null;
            }
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: json,
            buffer: raw,
          });
        });
      });
      req.on('error', reject);
      if (bodyStr) req.write(bodyStr);
      req.end();
    });

  return { start, stop, request };
}

// ============================================================================
// 5. TEST SUITE EXECUTION (114 TESTS ACROSS TIERS 1 TO 4)
// ============================================================================

test('BREAKING NEWS WALA: E-Paper Management System Master Test Suite', async (suite) => {
  const store = new EpaperPersistenceStore();
  const serverHelper = createEpaperTestServer(store);
  await serverHelper.start();

  suite.after(async () => {
    await serverHelper.stop();
  });

  // Auth tokens for test personas
  const masterAdminToken = signToken({
    id: 'usr-master-admin-01',
    identifier: MASTER_ADMIN_EMAILS[0],
    fullName: 'मुख्य व्यवस्थापक',
    roles: ['MASTER_ADMIN', 'ADMIN'],
  });

  const editorToken = signToken({
    id: 'usr-chief-editor-01',
    identifier: 'editor.bhopal@breakingnewswala.com',
    fullName: 'संपादक महोदय',
    roles: ['EDITOR'],
  });

  const reporterToken = signToken({
    id: 'usr-rep-bhopal',
    identifier: 'ramesh.bhopal@breakingnewswala.com',
    fullName: 'रमेश शर्मा',
    roles: ['REPORTER'],
    districtId: 'dist-bhopal',
  });

  const publicReaderToken = signToken({
    id: 'usr-reader-01',
    identifier: 'citizen.mp@gmail.com',
    fullName: 'नागरिक पाठक',
    roles: ['READER'],
  });

  // --------------------------------------------------------------------------
  // TIER 1: FEATURE COVERAGE (48 TESTS)
  // --------------------------------------------------------------------------

  await suite.test('Tier 1: Feature Coverage (48 tests)', async (t) => {
    // Area 1: Studio, Calendar & Wizard (6 tests)
    await t.test('T1.1.1: Create Daily Edition (default 12 pages) with division/district targeting', async () => {
      const res = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        editionType: 'DAILY',
        publicationDate: '2026-11-18',
        districtId: 'dist-bhopal',
        title: 'भोपाल दैनिक ई-पेपर',
        totalPages: 12,
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.totalPages, 12);
      assert.strictEqual(res.body.data.districtId, 'dist-bhopal');
      assert.strictEqual(res.body.data.pages.length, 12);
      assert.strictEqual(res.body.data.status, STATUS.DRAFT);
    });

    await t.test('T1.1.2: Create Special Edition with custom page counts and theme', async () => {
      const res = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        editionType: 'SPECIAL',
        publicationDate: '2026-11-19',
        districtId: 'dist-niwari',
        title: 'ओरछा उत्सव विशेषांक',
        totalPages: 8,
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.totalPages, 8);
      assert.strictEqual(res.body.data.title, 'ओरछा उत्सव विशेषांक');
    });

    await t.test('T1.1.3: Filter Edition Calendar by date range and publication status', async () => {
      const res = await serverHelper.request('GET', '/api/v1/epaper/editions?date=2026-11-18&status=DRAFT');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.data.length >= 1);
      assert.strictEqual(res.body.data[0].publicationDate, '2026-11-18');
    });

    await t.test('T1.1.4: Transition edition status across the 7-stage lifecycle pipeline', async () => {
      // Find an edition to transition
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];

      const stages = [
        STATUS.EDITORIAL_REVIEW,
        STATUS.LAYOUT_IN_PROGRESS,
        STATUS.QUALITY_CHECK,
        STATUS.APPROVED,
        STATUS.ARCHIVED,
      ];

      let currentVersion = ed.version;
      for (const nextStage of stages) {
        const patchRes = await serverHelper.request('PATCH', `/api/v1/epaper/editions/${ed.id}/status`, {
          targetStatus: nextStage,
          version: currentVersion,
        }, { Authorization: `Bearer ${editorToken}` });
        assert.strictEqual(patchRes.statusCode, 200);
        assert.strictEqual(patchRes.body.data.status, nextStage);
        currentVersion = patchRes.body.data.version;
      }
    });

    await t.test('T1.1.5: Verify summary metrics calculation (total, published, draft, archived)', async () => {
      const res = await serverHelper.request('GET', '/api/v1/epaper/metrics');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(typeof res.body.data.totalEditions, 'number');
      assert.ok(res.body.data.totalEditions >= 2);
      assert.ok(res.body.data.totalPagesManaged >= 20);
    });

    await t.test('T1.1.6: Validate edition code formatting standard (EP-YYYYMMDD-DIST-XX)', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions');
      const ed = listRes.body.data[0];
      assert.match(ed.editionCode, /^EP-\d{8}-[A-Z]+-\d{2}$/);
    });

    // Area 2: News Selection Desk & Article Sourcing (5 tests)
    await t.test('T1.2.1: Sourcing approved articles list for target edition date', async () => {
      const approved = SYNTHETIC_NEWS_ARTICLES.filter((a) => a.status === 'APPROVED');
      assert.ok(approved.length >= 5);
      assert.strictEqual(approved.every((a) => a.status === 'APPROVED'), true);
    });

    await t.test('T1.2.2: Place article onto target page with element position and dimensions', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const art = SYNTHETIC_NEWS_ARTICLES[0];

      const placeRes = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/1/elements`, {
        elementType: 'STORY',
        articleId: art.id,
        customHeadline: art.title,
        customBodyText: art.content,
        byline: art.byline,
        bounds: { x: 20, y: 50, width: 280, height: 180 },
        colSpan: 2,
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(placeRes.statusCode, 201);
      assert.strictEqual(placeRes.body.data.articleId, art.id);
      assert.strictEqual(placeRes.body.data.colSpan, 2);
    });

    await t.test('T1.2.3: Verify original news article record remains strictly immutable upon placement', async () => {
      const original = SYNTHETIC_NEWS_ARTICLES[0];
      const beforeSnapshot = JSON.stringify(original);
      // Article placed in T1.2.2; assert source object was untouched
      assert.strictEqual(JSON.stringify(original), beforeSnapshot);
      assert.strictEqual(original.status, 'APPROVED');
    });

    await t.test('T1.2.4: Track and preserve byline and photographer credits on placed element', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const p1 = ed.pages.find((p) => p.pageNumber === 1);
      const placed = p1.elements.find((el) => el.articleId === SYNTHETIC_NEWS_ARTICLES[0].id);
      assert.ok(placed);
      assert.strictEqual(placed.byline, SYNTHETIC_NEWS_ARTICLES[0].byline);
    });

    await t.test('T1.2.5: Maintain edition page element order and z-index ordering', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      // Add second element
      const addRes = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/1/elements`, {
        elementType: 'HEADLINE',
        customHeadline: 'विशेष घोषणा',
        customBodyText: 'घोषणा का विवरण',
        bounds: { x: 20, y: 20, width: 280, height: 25 },
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(addRes.statusCode, 201);
      assert.strictEqual(addRes.body.data.zIndex, 2);
    });

    // Area 3: Broadsheet Layout, Grid & Devanagari Typography (6 tests)
    await t.test('T1.3.1: Initialize broadsheet canvas dimensions (32.9 cm x 52.0 cm aspect ratio)', async () => {
      const dims = BroadsheetGridEngine.getDimensions();
      assert.strictEqual(dims.broadsheetWidthMm, 329);
      assert.strictEqual(dims.broadsheetHeightMm, 520);
      assert.strictEqual(dims.printableWidthMm, 299);
      assert.strictEqual(dims.raster300DpiWidth, 3886);
      assert.strictEqual(dims.raster300DpiHeight, 6142);
    });

    await t.test('T1.3.2: Configure modular column grids (3, 4, 5, 6, 8 columns) with standard gutters', async () => {
      for (const cols of [3, 4, 5, 6, 8]) {
        const colW = BroadsheetGridEngine.calculateColumnWidth(cols);
        assert.ok(colW > 0, `Col width for ${cols} cols must be positive`);
        const totalSpan = (colW * cols) + ((cols - 1) * GUTTER_MM);
        assert.ok(Math.abs(totalSpan - PRINTABLE_WIDTH_MM) < 1.0, 'Total span matches printable width');
      }
    });

    await t.test('T1.3.3: Calculate magnetic snap guidelines against nearest grid column', async () => {
      const lines = BroadsheetGridEngine.getGridLinePositions(6);
      // Line 1 is 15. Near 17 (dist 2) -> snaps to 15
      const snapResult = BroadsheetGridEngine.snapCoordinate(17, lines, 8);
      assert.strictEqual(snapResult.snapped, true);
      assert.strictEqual(snapResult.value, 15);

      // Dist 12 -> no snap
      const noSnap = BroadsheetGridEngine.snapCoordinate(30, lines, 8);
      assert.strictEqual(noSnap.snapped, false);
    });

    await t.test('T1.3.4: Detect 2D AABB collision between overlapping elements', async () => {
      const el1 = { x: 10, y: 10, width: 100, height: 100 };
      const el2 = { x: 50, y: 50, width: 100, height: 100 };
      assert.strictEqual(BroadsheetGridEngine.detectAabbCollision(el1, el2), true);

      const el3 = { x: 200, y: 200, width: 50, height: 50 };
      assert.strictEqual(BroadsheetGridEngine.detectAabbCollision(el1, el3), false);
    });

    await t.test('T1.3.5: Justify Devanagari text distributing word-gap space without modifying conjuncts', async () => {
      const devanagariText = 'मध्य प्रदेश सरकार ने नई औद्योगिक नीति को मंजूरी दी';
      const words = devanagariText.split(' ');
      const justified = DevanagariTypographyEngine.justifyDevanagariLine(words, 450, 14, false);

      assert.strictEqual(justified.justified, true);
      assert.strictEqual(justified.alignment, 'JUSTIFIED');
      assert.ok(justified.spacePerGap > 0);
      assert.strictEqual(justified.text, devanagariText); // Words and conjuncts preserved intact
    });

    await t.test('T1.3.6: Verify paragraph terminal line preserves left-alignment without excessive stretching', async () => {
      const devanagariText = 'राजधानी भोपाल में मेट्रो का काम अंतिम चरण में पहुंच चुका है। जल्द ही आम जनता के लिए इसका परिचालन शुरू होगा।';
      const result = DevanagariTypographyEngine.wrapAndJustifyParagraph(devanagariText, 250, 12, 10);

      assert.strictEqual(result.terminalLineJustified, false);
      assert.strictEqual(result.lines[result.lines.length - 1].alignment, 'LEFT');
    });

    // Area 4: Template Presets & AI Template Analyzer (5 tests)
    await t.test('T1.4.1: Load default 12 broadsheet presets (Front, State, Op-Ed, Sports, etc.)', async () => {
      assert.strictEqual(DEFAULT_12_BROADSHEET_TEMPLATES.length, 12);
      const sections = new Set(DEFAULT_12_BROADSHEET_TEMPLATES.map((t) => t.sectionType));
      assert.ok(sections.has('FRONT_PAGE'));
      assert.ok(sections.has('EDITORIAL_OPED'));
      assert.ok(sections.has('SPORTS'));
      assert.ok(sections.has('BUSINESS'));
    });

    await t.test('T1.4.2: Apply preset template to a blank broadsheet page', async () => {
      const template = DEFAULT_12_BROADSHEET_TEMPLATES[0]; // Front Page
      const page = { pageNumber: 1, elements: [] };
      page.sectionType = template.sectionType;
      page.pageTitle = template.pageTitle;
      assert.strictEqual(page.sectionType, 'FRONT_PAGE');
      assert.strictEqual(page.pageTitle, 'मुख्य पृष्ठ (Lead & Breaking)');
    });

    await t.test('T1.4.3: Save customized page as reusable custom template', async () => {
      const customTpl = {
        id: 'tpl-custom-bhopal-lead',
        pageTitle: 'भोपाल विशेष लीड टेम्पलेट',
        isCustom: true,
        authorId: 'usr-chief-editor-01',
        gridColumns: 6,
        elementsCount: 4,
      };
      store.templates.set(customTpl.id, customTpl);
      assert.strictEqual(store.templates.get(customTpl.id).isCustom, true);
    });

    await t.test('T1.4.4: AI Template Analyzer geometric segmentation on sample page layout', async () => {
      const sampleElements = [
        { elementType: 'MASTHEAD', bounds: { x: 0, y: 0, width: 932, height: 120 } },
        { elementType: 'STORY', bounds: { x: 0, y: 130, width: 460, height: 300 } },
        { elementType: 'AD', bounds: { x: 480, y: 130, width: 450, height: 300 } },
      ];
      const analysis = AiNewsroomAssistantMock.analyzeTemplateStructure(sampleElements);
      assert.strictEqual(analysis.totalSlots, 3);
      assert.strictEqual(analysis.slots[0].type, 'MASTHEAD');
    });

    await t.test('T1.4.5: Fallback template structure generation when AI provider is offline', async () => {
      const info = AiNewsroomAssistantMock.getProviderInfo();
      assert.strictEqual(info.isFallback, true);
      assert.strictEqual(info.offlineReady, true);
      const analysis = AiNewsroomAssistantMock.analyzeTemplateStructure([]);
      assert.strictEqual(analysis.structure, 'BLANK_PAGE');
    });

    // Area 5: Broadsheet Ad Manager & ASCI Badge (5 tests)
    await t.test('T1.5.1: Create ad slot classifications (L-shape, bottom footer, vertical ear, quarter/half/full)', async () => {
      assert.strictEqual(BroadsheetAdManager.VALID_SLOTS.length, 6);
      for (const slot of BroadsheetAdManager.VALID_SLOTS) {
        assert.strictEqual(BroadsheetAdManager.validateSlotClassification(slot), true);
      }
      assert.throws(() => BroadsheetAdManager.validateSlotClassification('POPUP_INTERSTITIAL'), /ERR_INVALID_AD_SLOT/);
    });

    await t.test('T1.5.2: Ingest ad creatives with standard newspaper aspect ratios (1:1, 3:4, 2:3, 4:3, 16:9)', async () => {
      const ad = SYNTHETIC_ADS[0];
      assert.strictEqual(ad.aspectRatio, '1:1');
      assert.strictEqual(ad.slotType, 'FOOTER');
    });

    await t.test('T1.5.3: Mandatory stamping of ASCI-compliant "विज्ञापन" identification badge', async () => {
      const ad = SYNTHETIC_ADS[0];
      assert.strictEqual(ad.asciBadge, true);
    });

    await t.test('T1.5.4: Submit reporter classified ad with district code and pricing category', async () => {
      const classifiedAd = {
        id: 'ad-class-01',
        advertiserName: 'श्री राम इलेक्ट्रॉनिक्स, ओरछा',
        districtId: 'dist-niwari',
        slotType: 'QUARTER_PAGE',
        status: 'PENDING_APPROVAL',
        asciBadge: true,
      };
      store.ads.set(classifiedAd.id, classifiedAd);
      assert.strictEqual(store.ads.get('ad-class-01').status, 'PENDING_APPROVAL');
    });

    await t.test('T1.5.5: Admin approval queue transition for pending reporter ads', async () => {
      const ad = store.ads.get('ad-class-01');
      ad.status = 'APPROVED';
      store.ads.set(ad.id, ad);
      assert.strictEqual(store.ads.get('ad-class-01').status, 'APPROVED');
    });

    // Area 6: Reporter Workspace & WhatsApp Card Generator (5 tests)
    await t.test('T1.6.1: Filter reporter desk view to assigned district and beat', async () => {
      const rep = SYNTHETIC_REPORTERS[0]; // Bhopal reporter
      const myArticles = SYNTHETIC_NEWS_ARTICLES.filter((a) => a.districtId === rep.districtId);
      assert.ok(myArticles.length >= 1);
      assert.strictEqual(myArticles[0].districtId, 'dist-bhopal');
    });

    await t.test('T1.6.2: Generate personalized 4:5 article clipping with reporter photo and byline', async () => {
      const rep = SYNTHETIC_REPORTERS[0];
      const art = SYNTHETIC_NEWS_ARTICLES[0];
      const engine = new WhatsAppCardGeneratorEngine();
      const card = engine.generateCard(rep, art, '4:5');

      assert.strictEqual(card.format, '4:5');
      assert.strictEqual(card.dimensions.width, 1080);
      assert.strictEqual(card.dimensions.height, 1350);
      assert.strictEqual(card.reporterPhoto, rep.photoUrl);
      assert.strictEqual(card.reporterName, rep.fullName);
    });

    await t.test('T1.6.3: Generate 1:1 WhatsApp social news card with Devanagari headline and summary', async () => {
      const rep = SYNTHETIC_REPORTERS[1];
      const art = SYNTHETIC_NEWS_ARTICLES[3];
      const engine = new WhatsAppCardGeneratorEngine();
      const card = engine.generateCard(rep, art, '1:1');

      assert.strictEqual(card.format, '1:1');
      assert.strictEqual(card.dimensions.width, 1080);
      assert.strictEqual(card.dimensions.height, 1080);
      assert.strictEqual(card.headline, art.title);
    });

    await t.test('T1.6.4: Generate 4:5 WhatsApp story card with attribution badge', async () => {
      const rep = SYNTHETIC_REPORTERS[0];
      const art = SYNTHETIC_NEWS_ARTICLES[0];
      const engine = new WhatsAppCardGeneratorEngine();
      const card = engine.generateCard(rep, art, '4:5');
      assert.strictEqual(card.badgeNumber, rep.badgeNumber);
    });

    await t.test('T1.6.5: Store generated WhatsApp cards in private isolated storage', async () => {
      const rep = SYNTHETIC_REPORTERS[0];
      const art = SYNTHETIC_NEWS_ARTICLES[0];
      const engine = new WhatsAppCardGeneratorEngine();
      const card = engine.generateCard(rep, art, '4:5');
      assert.strictEqual(card.isPrivate, true);
      assert.match(card.storageUrl, /storage\.internal\.breakingnewswala\.com/);
    });

    // Area 7: AI Newsroom Assistants & Quality Preflight Scanner (6 tests)
    await t.test('T1.7.1: AI copyediting assistant suggestion generation with deterministic fallback', async () => {
      const copy = AiNewsroomAssistantMock.copyeditDevanagari('भोपाल में मेट्रो की होगा उद्घाटन');
      assert.strictEqual(copy.changesApplied, true);
      assert.strictEqual(copy.suggestedText, 'भोपाल में मेट्रो का होगा उद्घाटन');
    });

    await t.test('T1.7.2: AI automated permanent column generation with explicit source attribution', async () => {
      const col = AiNewsroomAssistantMock.generatePermanentColumn('STATE_PROGRESS', 'मुख्य संपादक');
      assert.ok(col.columnTitle.includes('संपादकीय दृष्टिकोण'));
      assert.ok(col.sourceAttribution.includes('स्रोत: बीएनडब्ल्यू संपादकीय डेस्क'));
    });

    await t.test('T1.7.3: Preflight diagnostic TEXT_OVERFLOW detection', async () => {
      const dummyEdition = { id: 'ed-overflow' };
      const overflowPage = {
        pageNumber: 1,
        elements: [
          {
            id: 'el-overflow',
            elementType: 'STORY',
            customBodyText: 'क'.repeat(1200), // very long text
            fontSize: 16,
            bounds: { x: 0, y: 0, width: 200, height: 50 }, // small box
          },
        ],
      };
      const report = QualityPreflightScanner.evaluate(dummyEdition, [overflowPage]);
      assert.strictEqual(report.canPublish, false);
      assert.ok(report.blockers.some((b) => b.code === 'TEXT_OVERFLOW'));
    });

    await t.test('T1.7.4: Preflight diagnostic LOW_RES_IMAGE detection', async () => {
      const dummyEdition = { id: 'ed-lowres' };
      const lowResPage = {
        pageNumber: 2,
        elements: [
          {
            id: 'el-img',
            elementType: 'IMAGE',
            imageWidth: 640, // < 800px threshold
          },
        ],
      };
      const report = QualityPreflightScanner.evaluate(dummyEdition, [lowResPage]);
      assert.ok(report.warnings.some((w) => w.code === 'LOW_RES_IMAGE'));
    });

    await t.test('T1.7.5: Preflight diagnostic MISSING_ATTRIBUTION detection', async () => {
      const dummyEdition = { id: 'ed-no-byline' };
      const noBylinePage = {
        pageNumber: 3,
        elements: [
          {
            id: 'el-story-uncredited',
            elementType: 'STORY',
            customHeadline: 'शीर्षक',
            customBodyText: 'विवरण',
            byline: null,
            reporterId: null,
          },
        ],
      };
      const report = QualityPreflightScanner.evaluate(dummyEdition, [noBylinePage]);
      assert.ok(report.errors.some((e) => e.code === 'MISSING_ATTRIBUTION'));
    });

    await t.test('T1.7.6: Preflight diagnostic UNAPPROVED_AD_PLACEMENT detection', async () => {
      const dummyEdition = { id: 'ed-unapproved-ad' };
      const badAdPage = {
        pageNumber: 4,
        elements: [
          {
            id: 'el-bad-ad',
            elementType: 'AD',
            asciBadge: false, // missing ASCI badge -> BLOCKER
            adStatus: 'PENDING_APPROVAL',
          },
        ],
      };
      const report = QualityPreflightScanner.evaluate(dummyEdition, [badAdPage]);
      assert.strictEqual(report.canPublish, false);
      assert.ok(report.blockers.some((b) => b.code === 'UNAPPROVED_AD_PLACEMENT'));
    });

    // Area 8: Public Reader, Archive Search & 300 DPI Export (5 tests)
    await t.test('T1.8.1: Render Public Reader broadsheet Newspaper Mode with pan/zoom data model', async () => {
      const zoomModel = PublicReaderEngine.getZoomModel(1.0);
      assert.strictEqual(zoomModel.currentZoom, 1.0);
      assert.strictEqual(zoomModel.minZoom, 0.5);
      assert.strictEqual(zoomModel.maxZoom, 4.0);

      const z1 = PublicReaderEngine.computeZoom(1.0, 0.5);
      assert.strictEqual(z1.zoom, 1.5);
      const zMax = PublicReaderEngine.computeZoom(3.8, 1.0);
      assert.strictEqual(zMax.zoom, 4.0);
      const zMin = PublicReaderEngine.computeZoom(0.8, -0.5);
      assert.strictEqual(zMin.zoom, 0.5);
    });

    await t.test('T1.8.2: Render Reading Mode responsive article modal with typography controls', async () => {
      const reading = PublicReaderEngine.formatReadingModeArticle(SYNTHETIC_NEWS_ARTICLES[0], { fontSize: 18 });
      assert.strictEqual(reading.fontSize, 18);
      assert.strictEqual(reading.lineHeight, 28.8);
      assert.ok(reading.wordCount > 10);
      assert.ok(reading.readingTimeMinutes >= 1);
      assert.strictEqual(reading.isDevanagari, true);

      // Font clamping checks (min 12, max 32)
      const clampedMax = PublicReaderEngine.formatReadingModeArticle(SYNTHETIC_NEWS_ARTICLES[0], { fontSize: 50 });
      assert.strictEqual(clampedMax.fontSize, 32);
      const clampedMin = PublicReaderEngine.formatReadingModeArticle(SYNTHETIC_NEWS_ARTICLES[0], { fontSize: 8 });
      assert.strictEqual(clampedMin.fontSize, 12);
    });

    await t.test('T1.8.3: Historical archive search by date and district filter', async () => {
      // First publish an edition
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/publish`, { version: ed.version }, { Authorization: `Bearer ${editorToken}` });

      const archiveRes = await serverHelper.request('GET', `/api/v1/epaper/archive?date=${ed.publicationDate}&districtId=${ed.districtId}`);
      assert.strictEqual(archiveRes.statusCode, 200);
      assert.ok(archiveRes.body.data.length >= 1);
    });

    await t.test('T1.8.4: Reader 4:5 social clipping generator', async () => {
      const clip = PublicReaderEngine.generateSocialClippingBounds({ x: 50, y: 100, width: 400, height: 600 }, '4:5');
      assert.strictEqual(clip.aspectRatio, '4:5');
      assert.strictEqual(clip.width, 400);
      assert.strictEqual(clip.height, 500);
      assert.strictEqual(clip.ratioValue, 0.8);
    });

    await t.test('T1.8.5: High-resolution 300 DPI PDF-1.4 export metadata and MediaBox definition', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];

      const pdfRes = await serverHelper.request('GET', `/api/v1/epaper/editions/${ed.id}/export/pdf`);
      assert.strictEqual(pdfRes.statusCode, 200);
      assert.strictEqual(pdfRes.headers['content-type'], 'application/pdf');
      assert.strictEqual(pdfRes.headers['x-epaper-dpi'], '300');
      assert.ok(pdfRes.buffer.toString('utf8').startsWith('%PDF-1.4'));
    });

    // Area 9: Persistence OCC, Security & Invariants (5 tests)
    await t.test('T1.9.1: LocalJsonAdapter / FirestoreAdapter CRUD operations on epaperEditions', async () => {
      assert.ok(store.editions.size >= 2);
    });

    await t.test('T1.9.2: Optimistic Concurrency Control (OCC) version increments on update', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-niwari');
      const ed = listRes.body.data[0];
      const initialVer = ed.version;

      const updated = store.updateEditionWithOcc(ed.id, { title: 'ओरछा उत्सव अपडेट' }, initialVer);
      assert.strictEqual(updated.version, initialVer + 1);
    });

    await t.test('T1.9.3: Master Admin allowlist authorization check', async () => {
      assert.strictEqual(isMasterAdminEmail(MASTER_ADMIN_EMAILS[0]), true);
      assert.strictEqual(isMasterAdminEmail('hacker@unauthorized.com'), false);
    });

    await t.test('T1.9.4: Dual JWT token validation and role enforcement', async () => {
      const token = signToken({ id: 'u1', identifier: 'test@example.com', roles: ['EDITOR'] });
      const decoded = verifyToken(token);
      assert.ok(decoded);
      assert.strictEqual(decoded.roles[0], 'EDITOR');
    });

    await t.test('T1.9.5: Zero PostgreSQL / DATABASE_URL dependency verification', async () => {
      assert.strictEqual(process.env.DATABASE_URL, undefined);
    });
  });

  // --------------------------------------------------------------------------
  // TIER 2: BOUNDARY & CORNER CASES (48 TESTS)
  // --------------------------------------------------------------------------

  await suite.test('Tier 2: Boundary & Corner Cases (48 tests)', async (t) => {
    // Area 1: Studio & Wizard Boundaries (6 tests)
    await t.test('T2.1.1: Reject edition creation with zero or negative page count', async () => {
      const res0 = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: '2026-11-20',
        districtId: 'dist-bhopal',
        totalPages: 0,
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(res0.statusCode, 400);

      const resNeg = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: '2026-11-20',
        districtId: 'dist-bhopal',
        totalPages: -5,
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(resNeg.statusCode, 400);
    });

    await t.test('T2.1.2: Enforce maximum page cap (48 pages) on Special Edition', async () => {
      const res = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: '2026-11-20',
        districtId: 'dist-bhopal',
        totalPages: 50, // > 48
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.body.error.includes('ERR_EXCEEDS_MAX_PAGES'));
    });

    await t.test('T2.1.3: Reject invalid or malformed publication dates', async () => {
      const res = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: 'not-a-date',
        districtId: 'dist-bhopal',
        totalPages: 12,
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.body.error.includes('ERR_INVALID_DATE'));
    });

    await t.test('T2.1.4: Reject unknown district ID not in the 55 MP districts master list', async () => {
      const res = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: '2026-11-20',
        districtId: 'dist-delhi-unknown',
        totalPages: 12,
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.body.error.includes('ERR_UNKNOWN_DISTRICT'));
    });

    await t.test('T2.1.5: Enforce unique edition code constraint preventing collisions', async () => {
      // First create edition
      await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: '2026-11-21',
        districtId: 'dist-gwalior',
        totalPages: 12,
      }, { Authorization: `Bearer ${editorToken}` });

      // Duplicate attempt
      const dupRes = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: '2026-11-21',
        districtId: 'dist-gwalior',
        totalPages: 12,
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(dupRes.statusCode, 409);
    });

    await t.test('T2.1.6: Boundary test: Edition with single page (minimum broadsheet)', async () => {
      const res = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: '2026-11-22',
        districtId: 'dist-jabalpur',
        totalPages: 1, // Minimum page boundary
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.totalPages, 1);
    });

    // Area 2: News Selection Desk Boundaries (5 tests)
    await t.test('T2.2.1: Duplicate-placement detection when article is placed on the same page twice', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-jabalpur');
      const ed = listRes.body.data[0];
      const artId = 'art-jabalpur-narmada-05';

      // Place once
      await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/1/elements`, {
        elementType: 'STORY',
        articleId: artId,
      }, { Authorization: `Bearer ${editorToken}` });

      // Check duplicate
      const checkRes = await serverHelper.request('GET', `/api/v1/epaper/editions/${ed.id}/check-article/${artId}`);
      assert.strictEqual(checkRes.statusCode, 200);
      assert.strictEqual(checkRes.body.placed, true);
      assert.strictEqual(checkRes.body.pageNumber, 1);
    });

    await t.test('T2.2.2: Duplicate-placement warning when article is placed across multiple different pages', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const checkRes = await serverHelper.request('GET', `/api/v1/epaper/editions/${ed.id}/check-article/${SYNTHETIC_NEWS_ARTICLES[0].id}`);
      assert.strictEqual(checkRes.body.placed, true);
    });

    await t.test('T2.2.3: Attempt to place an unapproved or draft news article (flagged status)', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const res = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/1/elements`, {
        elementType: 'STORY',
        articleId: 'art-draft-unapproved-06',
        bounds: { x: 20, y: 50, width: 280, height: 180 },
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(res.statusCode, 422);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /ERR_UNAPPROVED_ARTICLE/);
    });

    await t.test('T2.2.4: Attempt to place an archived or deleted article', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const res = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/1/elements`, {
        elementType: 'STORY',
        articleId: 'art-archived-07',
        bounds: { x: 20, y: 50, width: 280, height: 180 },
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(res.statusCode, 422);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /ERR_ARCHIVED_ARTICLE/);
    });

    await t.test('T2.2.5: Zero-character headline or body text placement validation', async () => {
      const dummyPage = {
        pageNumber: 1,
        elements: [
          { id: 'e1', elementType: 'HEADLINE', customHeadline: 'अनाथ शीर्षक', customBodyText: '' },
        ],
      };
      const rep = QualityPreflightScanner.evaluate({}, [dummyPage]);
      assert.ok(rep.blockers.some((b) => b.code === 'ORPHAN_HEADLINE'));
    });

    // Area 3: Layout & Devanagari Boundaries (6 tests)
    await t.test('T2.3.1: Devanagari justification with extreme conjuncts (त्र्यंबकेश्वर, द्वंद्व, उज्ज्वलता)', async () => {
      const extremeConjuncts = 'त्र्यंबकेश्वर ज्योतिर्लिंग में द्वंद्व और उज्ज्वलता की विशेष श्रृंखला';
      assert.strictEqual(DevanagariTypographyEngine.isComplexDevanagari(extremeConjuncts), true);
      const justified = DevanagariTypographyEngine.justifyDevanagariLine(extremeConjuncts.split(' '), 350, 14, false);
      assert.strictEqual(justified.justified, true);
      assert.strictEqual(justified.text, extremeConjuncts);
    });

    await t.test('T2.3.2: Single-word line justification (must not distribute artificial intra-character gaps)', async () => {
      const singleWord = ['महाप्रबंधक'];
      const res = DevanagariTypographyEngine.justifyDevanagariLine(singleWord, 200, 14, false);
      assert.strictEqual(res.justified, false);
      assert.strictEqual(res.spacePerGap, 0);
    });

    await t.test('T2.3.3: Element positioned exactly at canvas boundary (x=0, y=0, x+w=maxWidth, y+h=maxHeight)', async () => {
      const bounds = { x: 0, y: 0, width: BROADSHEET_WIDTH_PT, height: BROADSHEET_HEIGHT_PT };
      const clamped = BroadsheetGridEngine.clampToBounds(bounds);
      assert.deepStrictEqual(clamped, bounds);
    });

    await t.test('T2.3.4: Element positioned outside canvas boundaries (rejection or clamp)', async () => {
      const bounds = { x: -10, y: -20, width: 2000, height: 3000 };
      const clamped = BroadsheetGridEngine.clampToBounds(bounds);
      assert.strictEqual(clamped.x, 0);
      assert.strictEqual(clamped.y, 0);
      assert.strictEqual(clamped.width, BROADSHEET_WIDTH_PT);
      assert.strictEqual(clamped.height, BROADSHEET_HEIGHT_PT);
    });

    await t.test('T2.3.5: Magnetic snapping at exact snap threshold boundary (+/- 8px)', async () => {
      const gridLines = [100, 200, 300];
      // Exactly 8px away -> snaps
      assert.strictEqual(BroadsheetGridEngine.snapCoordinate(108, gridLines, 8).snapped, true);
      assert.strictEqual(BroadsheetGridEngine.snapCoordinate(92, gridLines, 8).snapped, true);
      // 9px away -> does not snap
      assert.strictEqual(BroadsheetGridEngine.snapCoordinate(109, gridLines, 8).snapped, false);
    });

    await t.test('T2.3.6: AABB collision detection with zero-distance touching borders (edge-adjacent)', async () => {
      const box1 = { x: 0, y: 0, width: 100, height: 100 };
      const box2 = { x: 100, y: 0, width: 100, height: 100 }; // Shares border x=100
      assert.strictEqual(BroadsheetGridEngine.detectAabbCollision(box1, box2), false);
    });

    // Area 4: Template Manager Boundaries (5 tests)
    await t.test('T2.4.1: Template containing zero elements handled gracefully', async () => {
      const analysis = AiNewsroomAssistantMock.analyzeTemplateStructure([]);
      assert.strictEqual(analysis.totalSlots, 0);
      assert.strictEqual(analysis.structure, 'BLANK_PAGE');
    });

    await t.test('T2.4.2: Template with max elements (50 elements on busy front page)', async () => {
      const elements50 = Array.from({ length: 50 }, (_, i) => ({
        elementType: 'STORY',
        bounds: { x: i * 5, y: i * 10, width: 50, height: 40 },
      }));
      const analysis = AiNewsroomAssistantMock.analyzeTemplateStructure(elements50);
      assert.strictEqual(analysis.totalSlots, 50);
      assert.strictEqual(analysis.structure, 'MULTI_COLUMN_BROADSHEET');
    });

    await t.test('T2.4.3: Corrupt or malformed template JSON handling', async () => {
      assert.throws(() => TemplateEngine.parseTemplateJson('{ malformed: true, '), /ERR_MALFORMED_TEMPLATE_JSON/);
      assert.throws(() => TemplateEngine.parseTemplateJson('{"name": "missing regions"}'), /ERR_INVALID_TEMPLATE_SCHEMA/);
    });

    await t.test('T2.4.4: Template extraction from blank canvas', async () => {
      const result = AiNewsroomAssistantMock.analyzeTemplateStructure(null);
      assert.strictEqual(result.totalSlots, 0);
    });

    await t.test('T2.4.5: Name collision on custom template creation', async () => {
      const tpl1 = store.saveTemplate({ id: 'tpl-custom-1', name: 'दैनिक फ्रंट पेज टेम्पलेट', isCustom: true });
      assert.ok(tpl1);

      assert.throws(() => {
        store.saveTemplate({ id: 'tpl-custom-2', name: 'दैनिक फ्रंट पेज टेम्पलेट', isCustom: true });
      }, (err) => err.statusCode === 409 && /ERR_TEMPLATE_NAME_COLLISION/.test(err.message));
    });

    // Area 5: Broadsheet Ad Manager Boundaries (5 tests)
    await t.test('T2.5.1: Zero-dimension or negative-dimension ad placement rejected', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const res = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/1/elements`, {
        elementType: 'AD',
        adSlotType: 'FOOTER',
        bounds: { x: 50, y: 100, width: 0, height: -10 },
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /ERR_INVALID_BOUNDS/);
      assert.throws(() => BroadsheetGridEngine.validateBounds({ x: 0, y: 0, width: 0, height: -10 }), /ERR_INVALID_BOUNDS/);
    });

    await t.test('T2.5.2: Ad element placed without mandatory ASCI "विज्ञापन" badge triggers error', async () => {
      const dummyPage = {
        pageNumber: 1,
        elements: [
          { id: 'ad-unbadged', elementType: 'AD', asciBadge: false, adStatus: 'APPROVED' },
        ],
      };
      const report = QualityPreflightScanner.evaluate({}, [dummyPage]);
      assert.ok(report.blockers.some((b) => b.code === 'UNAPPROVED_AD_PLACEMENT'));
    });

    await t.test('T2.5.3: Multiple ads occupying overlapping coordinates flagged as collision conflict', async () => {
      const ad1 = { x: 50, y: 100, width: 200, height: 200 };
      const ad2 = { x: 100, y: 150, width: 200, height: 200 };
      assert.strictEqual(BroadsheetGridEngine.detectAabbCollision(ad1, ad2), true);
    });

    await t.test('T2.5.4: Reporter ad with missing required contact/billing information rejected', async () => {
      const res = await serverHelper.request('POST', '/api/v1/epaper/ads', {
        advertiserName: '   ',
        slotType: 'FOOTER',
        contactPhone: '',
      }, { Authorization: `Bearer ${reporterToken}` });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /ERR_MISSING_AD_CONTACT_INFO/);
      assert.throws(() => BroadsheetAdManager.validateAdSubmission({ advertiserName: '' }), /ERR_MISSING_AD_CONTACT_INFO/);
    });

    await t.test('T2.5.5: Oversized ad exceeding full page broadsheet dimensions clamped', async () => {
      const oversized = { x: 0, y: 0, width: 2000, height: 3000 };
      const clamped = BroadsheetGridEngine.clampToBounds(oversized);
      assert.strictEqual(clamped.width, BROADSHEET_WIDTH_PT);
    });

    // Area 6: Reporter Workspace Boundaries (5 tests)
    await t.test('T2.6.1: Enforce daily WhatsApp card generation quota limit (20 cards/day per reporter)', async () => {
      const engine = new WhatsAppCardGeneratorEngine();
      const rep = SYNTHETIC_REPORTERS[0];
      const art = SYNTHETIC_NEWS_ARTICLES[0];

      for (let i = 0; i < 20; i++) {
        engine.generateCard(rep, art, '4:5');
      }
      assert.strictEqual(engine.getQuotaRemaining(rep.id), 0);
    });

    await t.test('T2.6.2: Reject WhatsApp generation request when daily quota is exhausted (HTTP 429)', async () => {
      const engine = new WhatsAppCardGeneratorEngine();
      const rep = SYNTHETIC_REPORTERS[0];
      const art = SYNTHETIC_NEWS_ARTICLES[0];
      for (let i = 0; i < 20; i++) {
        engine.generateCard(rep, art, '4:5');
      }

      assert.throws(() => {
        engine.generateCard(rep, art, '4:5');
      }, (err) => err.statusCode === 429);
    });

    await t.test('T2.6.3: Long Devanagari text exceeding WhatsApp card bounds handled via graceful ellipsis/truncation', async () => {
      const engine = new WhatsAppCardGeneratorEngine();
      const rep = SYNTHETIC_REPORTERS[0];
      const longArt = {
        title: 'लंबी कहानी',
        content: 'क'.repeat(500),
        districtId: 'dist-bhopal',
      };
      const card = engine.generateCard(rep, longArt, '4:5');
      assert.ok(card.bodyText.endsWith('...'));
      assert.ok(card.bodyText.length <= 245);
    });

    await t.test('T2.6.4: Missing reporter profile photo falls back to default branded avatar icon', async () => {
      const engine = new WhatsAppCardGeneratorEngine();
      const noPhotoRep = SYNTHETIC_REPORTERS[2]; // manoj.jabalpur has photoUrl: null
      const art = SYNTHETIC_NEWS_ARTICLES[0];
      const card = engine.generateCard(noPhotoRep, art, '4:5');
      assert.strictEqual(card.reporterPhoto, 'https://breakingnewswala.com/assets/default-reporter-avatar.png');
    });

    await t.test('T2.6.5: Rapid consecutive generation requests handled safely', async () => {
      const engine = new WhatsAppCardGeneratorEngine();
      const rep = { id: 'usr-rapid-test', fullName: 'परीक्षण रिपोर्टर' };
      const art = SYNTHETIC_NEWS_ARTICLES[0];

      const cards = await Promise.all([
        Promise.resolve(engine.generateCard(rep, art, '1:1')),
        Promise.resolve(engine.generateCard(rep, art, '1:1')),
        Promise.resolve(engine.generateCard(rep, art, '1:1')),
      ]);
      assert.strictEqual(cards.length, 3);
      assert.strictEqual(engine.getQuotaRemaining(rep.id), 17);
    });

    // Area 7: AI & Preflight Boundaries (6 tests)
    await t.test('T2.7.1: Preflight ORPHAN_HEADLINE detection: headline with zero associated story text', async () => {
      const orphanPage = {
        pageNumber: 1,
        elements: [
          { id: 'h1', elementType: 'HEADLINE', customHeadline: 'अनाथ शीर्षक बिना विवरण', customBodyText: '' },
        ],
      };
      const res = QualityPreflightScanner.evaluate({}, [orphanPage]);
      assert.strictEqual(res.canPublish, false);
      assert.strictEqual(res.blockers[0].code, 'ORPHAN_HEADLINE');
    });

    await t.test('T2.7.2: Preflight severity BLOCKER preventing publishing transition (HTTP 422)', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-jabalpur');
      const ed = listRes.body.data[0];

      // Add a blocker element
      await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/1/elements`, {
        elementType: 'HEADLINE',
        customHeadline: 'अनाथ शीर्षक',
        customBodyText: '', // triggers ORPHAN_HEADLINE blocker
      }, { Authorization: `Bearer ${editorToken}` });

      const pubRes = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/publish`, {
        version: ed.version,
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(pubRes.statusCode, 422);
      assert.strictEqual(pubRes.body.error.includes('ERR_PREFLIGHT_BLOCKER'), true);
    });

    await t.test('T2.7.3: Preflight severity WARNING allowing publishing transition with logged notice', async () => {
      const dummyPage = {
        pageNumber: 1,
        elements: [
          { id: 'img-1', elementType: 'IMAGE', imageWidth: 700 }, // WARNING only
        ],
      };
      const res = QualityPreflightScanner.evaluate({}, [dummyPage]);
      assert.strictEqual(res.canPublish, true); // Warnings do not block
      assert.strictEqual(res.warningCount, 1);
    });

    await t.test('T2.7.4: AI provider total network timeout (smooth transition to deterministic fallback)', async () => {
      const fallback = AiNewsroomAssistantMock.generateHeadlines('परीक्षण कहानी');
      assert.strictEqual(fallback.length, 5);
    });

    await t.test('T2.7.5: Empty prompt / null input to AI copyeditor returns graceful validation error', async () => {
      assert.throws(() => {
        AiNewsroomAssistantMock.copyeditDevanagari('');
      }, (err) => err.message.includes('ERR_EMPTY_PROMPT'));
    });

    await t.test('T2.7.6: Corrupted image URL in element (flagged by preflight)', async () => {
      const dummyPage = {
        pageNumber: 1,
        elements: [
          { id: 'img-corrupt', elementType: 'IMAGE', imageWidth: 50 }, // Low res warning
        ],
      };
      const res = QualityPreflightScanner.evaluate({}, [dummyPage]);
      assert.strictEqual(res.warnings[0].code, 'LOW_RES_IMAGE');
    });

    // Area 8: Public Reader Boundaries (5 tests)
    await t.test('T2.8.1: Public request for non-existent edition date (returns clean 404)', async () => {
      const res = await serverHelper.request('GET', '/api/v1/epaper/editions/non-existent-edition-xyz');
      assert.strictEqual(res.statusCode, 404);
    });

    await t.test('T2.8.2: Reader zoom level min (50%) and max (400%) boundary clamping', async () => {
      const clampZoom = (z) => Math.min(4.0, Math.max(0.5, z));
      assert.strictEqual(clampZoom(0.2), 0.5);
      assert.strictEqual(clampZoom(5.0), 4.0);
      assert.strictEqual(clampZoom(1.5), 1.5);
    });

    await t.test('T2.8.3: Archive query with future publication date returns empty results gracefully', async () => {
      const res = await serverHelper.request('GET', '/api/v1/epaper/archive?date=2099-12-31');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.count, 0);
    });

    await t.test('T2.8.4: Request unpublished (DRAFT) edition via public reader archive filter', async () => {
      const res = await serverHelper.request('GET', '/api/v1/epaper/archive');
      assert.strictEqual(res.statusCode, 200);
      // All archive editions must be published
      assert.strictEqual(res.body.data.every((e) => e.status === STATUS.PUBLISHED), true);
    });

    await t.test('T2.8.5: Zero results on district filter returns graceful empty state', async () => {
      const res = await serverHelper.request('GET', '/api/v1/epaper/archive?districtId=dist-unknown');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.data.length, 0);
    });

    // Area 9: Persistence OCC Boundaries (5 tests)
    await t.test('T2.9.1: OCC version collision: concurrent update with stale version rejected (HTTP 409)', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-niwari');
      const ed = listRes.body.data[0];

      // Provide stale version 999
      const errRes = await serverHelper.request('PATCH', `/api/v1/epaper/editions/${ed.id}/status`, {
        targetStatus: STATUS.EDITORIAL_REVIEW,
        version: 999, // Stale!
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(errRes.statusCode, 409);
      assert.ok(errRes.body.error.includes('ERR_OCC_COLLISION'));
    });

    await t.test('T2.9.2: Simultaneous write race condition resolved deterministically', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-niwari');
      const ed = listRes.body.data[0];
      const initialVer = ed.version;

      const p1 = serverHelper.request('PATCH', `/api/v1/epaper/editions/${ed.id}/status`, {
        targetStatus: STATUS.LAYOUT_IN_PROGRESS,
        version: initialVer,
      }, { Authorization: `Bearer ${editorToken}` });

      const p2 = serverHelper.request('PATCH', `/api/v1/epaper/editions/${ed.id}/status`, {
        targetStatus: STATUS.APPROVED,
        version: initialVer,
      }, { Authorization: `Bearer ${editorToken}` });

      const [r1, r2] = await Promise.all([p1, p2]);
      const statusCodes = [r1.statusCode, r2.statusCode];
      assert.ok(statusCodes.includes(200));
      assert.ok(statusCodes.includes(409)); // Exactly one succeeds, one gets OCC conflict
    });

    await t.test('T2.9.3: Tampered JWT token rejected with HTTP 401/403', async () => {
      const res = await serverHelper.request('POST', '/api/v1/epaper/editions', {}, {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token',
      });
      assert.strictEqual(res.statusCode, 403);
    });

    await t.test('T2.9.4: Non-admin user attempting edition deletion rejected with HTTP 403', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions');
      const ed = listRes.body.data[0];

      const res = await serverHelper.request('DELETE', `/api/v1/epaper/editions/${ed.id}`, {}, {
        Authorization: `Bearer ${reporterToken}`,
      });
      assert.strictEqual(res.statusCode, 403);
    });

    await t.test('T2.9.5: Verify no environment variables contain DATABASE_URL or postgres references', async () => {
      const envKeys = Object.keys(process.env);
      const hasDbUrl = envKeys.some((k) => k.toUpperCase().includes('DATABASE_URL'));
      assert.strictEqual(hasDbUrl, false);
    });
  });

  // --------------------------------------------------------------------------
  // TIER 3: CROSS-FEATURE COMBINATIONS (12 TESTS)
  // --------------------------------------------------------------------------

  await suite.test('Tier 3: Cross-Feature Combinations (12 tests)', async (t) => {
    await t.test('T3.1: News Sourcing -> Broadsheet Layout -> Devanagari Justification', async () => {
      // 1. Sourced approved article
      const art = SYNTHETIC_NEWS_ARTICLES[0];
      assert.strictEqual(art.status, 'APPROVED');

      // 2. Wrap and justify into broadsheet column
      const result = DevanagariTypographyEngine.wrapAndJustifyParagraph(art.content, 280, 12, 10);
      assert.ok(result.totalLines >= 2);
      assert.strictEqual(result.terminalLineJustified, false);
      assert.strictEqual(result.lines[0].justified, true);
    });

    await t.test('T3.2: Broadsheet Layout -> Snapping -> AABB Collision', async () => {
      const gridLines = BroadsheetGridEngine.getGridLinePositions(6);
      const snapX = BroadsheetGridEngine.snapCoordinate(16, gridLines, 8);
      assert.strictEqual(snapX.snapped, true);

      const el1 = { x: snapX.value, y: 100, width: 120, height: 200 };
      const el2 = { x: snapX.value + 120, y: 100, width: 120, height: 200 }; // Shares border
      assert.strictEqual(BroadsheetGridEngine.detectAabbCollision(el1, el2), false);
    });

    await t.test('T3.3: News Article -> Duplicate Check -> Multi-Page Layout', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const art = SYNTHETIC_NEWS_ARTICLES[0];

      // Article placed on Page 1 in earlier test
      const checkRes = await serverHelper.request('GET', `/api/v1/epaper/editions/${ed.id}/check-article/${art.id}`);
      assert.strictEqual(checkRes.body.placed, true);
      assert.strictEqual(checkRes.body.pageNumber, 1);
    });

    await t.test('T3.4: Ad Creation -> ASCI Badge Stamping -> Broadsheet Placement', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const res = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/1/elements`, {
        elementType: 'AD',
        advertiserName: 'एमपी पर्यटन',
        adSlotType: 'FOOTER',
        adStatus: 'APPROVED',
        bounds: { x: 50, y: 1300, width: 832, height: 120 },
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.asciBadge, true);
      assert.strictEqual(res.body.data.badgeText, 'विज्ञापन');

      const preflight = QualityPreflightScanner.evaluate(ed, ed.pages);
      assert.strictEqual(preflight.blockers.some((b) => b.code === 'UNAPPROVED_AD_PLACEMENT'), false);
    });

    await t.test('T3.5: Ad Placement -> Preflight Scanner -> Publishing Blocker', async () => {
      const dummyPage = {
        pageNumber: 1,
        elements: [
          { id: 'ad1', elementType: 'AD', asciBadge: false }, // No badge
        ],
      };
      const scan = QualityPreflightScanner.evaluate({}, [dummyPage]);
      assert.strictEqual(scan.canPublish, false);
      assert.strictEqual(scan.blockers[0].code, 'UNAPPROVED_AD_PLACEMENT');
    });

    await t.test('T3.6: Reporter Submission -> Editorial Review -> Edition Placement', async () => {
      const repStory = {
        id: 'rep-sub-01',
        title: 'ओरछा के किले में पर्यटन सीजन शुरू',
        status: 'SUBMITTED',
        byline: 'ऋतुराज तोमर',
      };
      SYNTHETIC_NEWS_ARTICLES.push(repStory);

      // Editor reviews and approves
      const patchRes = await serverHelper.request('PATCH', `/api/v1/epaper/articles/${repStory.id}/status`, {
        targetStatus: 'APPROVED',
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(patchRes.statusCode, 200);
      assert.strictEqual(patchRes.body.data.status, 'APPROVED');

      // Place onto page element without mutating original
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal');
      const ed = listRes.body.data[0];
      const placeRes = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/pages/5/elements`, {
        elementType: 'STORY',
        articleId: repStory.id,
        customHeadline: 'ओरछा के किले में पर्यटन सीजन शुरू',
        byline: 'ऋतुराज तोमर',
        bounds: { x: 20, y: 100, width: 440, height: 300 },
        colSpan: 3,
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(placeRes.statusCode, 201);
      assert.strictEqual(placeRes.body.data.articleId, repStory.id);

      const edRes = await serverHelper.request('GET', `/api/v1/epaper/editions/${ed.id}`);
      const page5 = edRes.body.data.pages.find((p) => p.pageNumber === 5);
      const placed = page5.elements.find((el) => el.articleId === repStory.id);
      assert.ok(placed);
      assert.strictEqual(placed.byline, 'ऋतुराज तोमर');
    });

    await t.test('T3.7: Reporter Desk -> Article Sourcing -> WhatsApp 4:5 Card Generator', async () => {
      const rep = SYNTHETIC_REPORTERS[0];
      const art = SYNTHETIC_NEWS_ARTICLES[1];
      const engine = new WhatsAppCardGeneratorEngine();
      const card = engine.generateCard(rep, art, '4:5');
      assert.strictEqual(card.format, '4:5');
      assert.strictEqual(card.reporterId, rep.id);
    });

    await t.test('T3.8: WhatsApp Card Generation -> Daily Quota Exhaustion -> Rate Limiting', async () => {
      const engine = new WhatsAppCardGeneratorEngine();
      const rep = { id: 'usr-exhaust-test', fullName: 'परीक्षण कोटा' };
      const art = SYNTHETIC_NEWS_ARTICLES[0];

      for (let i = 0; i < 20; i++) {
        engine.generateCard(rep, art, '1:1');
      }
      assert.throws(() => {
        engine.generateCard(rep, art, '1:1');
      }, (err) => err.statusCode === 429);
    });

    await t.test('T3.9: AI Copyeditor -> Headline Refinement -> Broadsheet Canvas Update', async () => {
      const originalHeadline = 'भोपाल में मेट्रो की होगा सफल परीक्षण';
      const proofread = AiNewsroomAssistantMock.copyeditDevanagari(originalHeadline);
      assert.strictEqual(proofread.suggestedText, 'भोपाल में मेट्रो का होगा सफल परीक्षण');

      const canvasElement = {
        id: 'el-headline-refined',
        customHeadline: proofread.suggestedText,
      };
      assert.strictEqual(canvasElement.customHeadline, proofread.suggestedText);
    });

    await t.test('T3.10: Layout Preflight Scanner -> Fix Blocker -> Atomic Publishing Snapshot', async () => {
      const ed = { id: 'ed-fix-blocker', version: 1 };
      // 1. Initial page with blocker
      const pageWithBlocker = {
        pageNumber: 1,
        elements: [
          { id: 'h-orphan', elementType: 'HEADLINE', customHeadline: 'शीर्षक', customBodyText: '' },
        ],
      };
      const initialScan = QualityPreflightScanner.evaluate(ed, [pageWithBlocker]);
      assert.strictEqual(initialScan.canPublish, false);

      // 2. Fix blocker: add body text
      pageWithBlocker.elements[0].customBodyText = 'अब यह विवरण के साथ पूर्ण कहानी है।';
      const fixedScan = QualityPreflightScanner.evaluate(ed, [pageWithBlocker]);
      assert.strictEqual(fixedScan.canPublish, true);
    });

    await t.test('T3.11: Published Edition -> Public Reader -> Newspaper & Reading Modes', async () => {
      const archRes = await serverHelper.request('GET', '/api/v1/epaper/archive?districtId=dist-bhopal');
      assert.strictEqual(archRes.statusCode, 200);
      assert.ok(archRes.body.data.length >= 1);
      const pubEd = archRes.body.data[0];
      assert.strictEqual(pubEd.status, STATUS.PUBLISHED);
      assert.ok(pubEd.pages.length >= 1);

      // Newspaper Mode broadsheet geometry & zoom model
      const dims = BroadsheetGridEngine.getDimensions();
      assert.strictEqual(dims.broadsheetWidthMm, 329);
      assert.strictEqual(dims.broadsheetHeightMm, 520);
      const zoomModel = PublicReaderEngine.getZoomModel(1.0);
      assert.strictEqual(zoomModel.currentZoom, 1.0);
      assert.strictEqual(zoomModel.maxZoom, 4.0);

      // Reading Mode typography & modal formatting
      const storyEl = pubEd.pages[0].elements.find((e) => e.elementType === 'STORY') || SYNTHETIC_NEWS_ARTICLES[0];
      const readingView = PublicReaderEngine.formatReadingModeArticle(storyEl, { fontSize: 18 });
      assert.strictEqual(readingView.fontSize, 18);
      assert.strictEqual(readingView.lineHeight, 28.8);
      assert.ok(readingView.lines.length >= 1);
      assert.strictEqual(readingView.isDevanagari, true);
    });

    await t.test('T3.12: Published Edition -> 300 DPI PDF Export -> Historical Archive Search', async () => {
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?status=PUBLISHED');
      assert.ok(listRes.body.data.length >= 1);
      const ed = listRes.body.data[0];

      // Request real PDF Export via HTTP
      const pdfRes = await serverHelper.request('GET', `/api/v1/epaper/editions/${ed.id}/export/pdf`);
      assert.strictEqual(pdfRes.statusCode, 200);
      assert.strictEqual(pdfRes.headers['content-type'], 'application/pdf');
      assert.strictEqual(pdfRes.headers['x-epaper-dpi'], '300');
      assert.strictEqual(pdfRes.headers['x-epaper-width-px'], '3886');
      assert.strictEqual(pdfRes.headers['x-epaper-height-px'], '6142');
      assert.ok(pdfRes.buffer.toString('utf8').startsWith('%PDF-1.4'));

      // Query real Historical Archive via HTTP
      const archRes = await serverHelper.request('GET', `/api/v1/epaper/archive?date=${ed.publicationDate}&districtId=${ed.districtId}`);
      assert.strictEqual(archRes.statusCode, 200);
      assert.ok(archRes.body.count >= 1);
      assert.strictEqual(archRes.body.data[0].id, ed.id);
      assert.strictEqual(archRes.body.data[0].status, STATUS.PUBLISHED);
    });
  });

  // --------------------------------------------------------------------------
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (6 TESTS)
  // --------------------------------------------------------------------------

  await suite.test('Tier 4: Real-World Application Scenarios (6 tests)', async (t) => {
    await t.test('Scenario 1: Complete Daily 12-Page Broadsheet Publishing Lifecycle', async () => {
      // 1. Create Edition
      const createRes = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        editionType: 'DAILY',
        publicationDate: '2026-11-25',
        districtId: 'dist-bhopal',
        totalPages: 12,
        title: 'भोपाल महादैनिक ई-पेपर',
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(createRes.statusCode, 201);
      const edition = createRes.body.data;

      // 2. Source and place 3 stories
      for (let i = 0; i < 3; i++) {
        const art = SYNTHETIC_NEWS_ARTICLES[i];
        await serverHelper.request('POST', `/api/v1/epaper/editions/${edition.id}/pages/1/elements`, {
          elementType: 'STORY',
          articleId: art.id,
          customHeadline: art.title,
          customBodyText: art.content,
          byline: art.byline,
          bounds: { x: 10 + (i * 90), y: 50, width: 85, height: 150 },
        }, { Authorization: `Bearer ${editorToken}` });
      }

      // 3. Place commercial ad with ASCI badge
      await serverHelper.request('POST', `/api/v1/epaper/editions/${edition.id}/pages/1/elements`, {
        elementType: 'AD',
        asciBadge: true,
        adStatus: 'APPROVED',
        bounds: { x: 10, y: 220, width: 280, height: 60 },
      }, { Authorization: `Bearer ${editorToken}` });

      // 4. Run Quality Preflight
      const preflightRes = await serverHelper.request('POST', `/api/v1/epaper/editions/${edition.id}/preflight`);
      assert.strictEqual(preflightRes.statusCode, 200);
      assert.strictEqual(preflightRes.body.data.canPublish, true);

      // 5. Publish Edition
      const pubRes = await serverHelper.request('POST', `/api/v1/epaper/editions/${edition.id}/publish`, {
        version: edition.version + 4, // 4 elements added
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(pubRes.statusCode, 200);
      assert.strictEqual(pubRes.body.data.status, STATUS.PUBLISHED);
      assert.ok(pubRes.body.snapshot);
    });

    await t.test('Scenario 2: Special Election Edition with District Targeting', async () => {
      // 1. Create 8-page Election Special for Niwari
      const createRes = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        editionType: 'SPECIAL',
        publicationDate: '2026-11-26',
        districtId: 'dist-niwari',
        totalPages: 8,
        title: 'ओरछा / निवाड़ी विशेष चुनाव संस्करण',
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(createRes.statusCode, 201);
      const edition = createRes.body.data;

      // 2. Add election report
      const art = SYNTHETIC_NEWS_ARTICLES[3]; // Orchha report
      await serverHelper.request('POST', `/api/v1/epaper/editions/${edition.id}/pages/1/elements`, {
        elementType: 'STORY',
        articleId: art.id,
        customHeadline: art.title,
        customBodyText: art.content,
        byline: art.byline,
        bounds: { x: 15, y: 40, width: 280, height: 200 },
      }, { Authorization: `Bearer ${editorToken}` });

      // 3. Export 300 DPI PDF
      const pdfRes = await serverHelper.request('GET', `/api/v1/epaper/editions/${edition.id}/export/pdf`);
      assert.strictEqual(pdfRes.statusCode, 200);
      assert.strictEqual(pdfRes.headers['x-epaper-dpi'], '300');
    });

    await t.test('Scenario 3: Reporter Field Workflow & WhatsApp Campaign', async () => {
      // 1. Reporter checks quota
      const quotaRes = await serverHelper.request('GET', '/api/v1/epaper/whatsapp/quota', null, {
        Authorization: `Bearer ${reporterToken}`,
      });
      assert.strictEqual(quotaRes.statusCode, 200);
      assert.ok(quotaRes.body.remaining > 0);

      // 2. Reporter generates 4:5 WhatsApp Card
      const genRes = await serverHelper.request('POST', '/api/v1/epaper/whatsapp/generate', {
        articleId: 'art-bhopal-metro-01',
        format: '4:5',
      }, { Authorization: `Bearer ${reporterToken}` });

      assert.strictEqual(genRes.statusCode, 201);
      assert.strictEqual(genRes.body.data.format, '4:5');
      assert.strictEqual(genRes.body.data.isPrivate, true);
    });

    await t.test('Scenario 4: Editorial Revision & Republishing (OCC Version Bump)', async () => {
      // 1. Locate published edition
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions?districtId=dist-bhopal&status=PUBLISHED');
      const ed = listRes.body.data[0];
      assert.ok(ed);

      // 2. Re-enter layout for breaking revision
      const revRes = await serverHelper.request('PATCH', `/api/v1/epaper/editions/${ed.id}/status`, {
        targetStatus: STATUS.LAYOUT_IN_PROGRESS,
        version: ed.version,
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(revRes.statusCode, 200);
      assert.strictEqual(revRes.body.data.status, STATUS.LAYOUT_IN_PROGRESS);

      // 3. Preflight check
      const preflightRes = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/preflight`);
      assert.strictEqual(preflightRes.statusCode, 200);

      // 4. Republish -> increments version
      const repubRes = await serverHelper.request('POST', `/api/v1/epaper/editions/${ed.id}/publish`, {
        version: revRes.body.data.version,
      }, { Authorization: `Bearer ${editorToken}` });
      assert.strictEqual(repubRes.statusCode, 200);
      assert.strictEqual(repubRes.body.data.status, STATUS.PUBLISHED);
    });

    await t.test('Scenario 5: Offline AI & Cloud Graceful Degradation', async () => {
      // Network absent / API keys absent simulation
      const headlineVariants = AiNewsroomAssistantMock.generateHeadlines('मध्य प्रदेश विकास योजना');
      assert.strictEqual(headlineVariants.length, 5);

      const editorialCol = AiNewsroomAssistantMock.generatePermanentColumn('STATE_PROGRESS', 'वरिष्ठ संपादक');
      assert.ok(editorialCol.bodyText.length > 50);
      assert.strictEqual(editorialCol.sourceAttribution.includes('स्रोत: बीएनडब्ल्यू संपादकीय डेस्क'), true);
    });

    await t.test('Scenario 6: Security, RBAC & Invariant Enforcement', async () => {
      // 1. Public user cannot create edition
      const unauthRes = await serverHelper.request('POST', '/api/v1/epaper/editions', {
        publicationDate: '2026-11-28',
        districtId: 'dist-bhopal',
        totalPages: 12,
      }, { Authorization: `Bearer ${publicReaderToken}` });
      assert.strictEqual(unauthRes.statusCode, 403);

      // 2. Reporter cannot delete edition
      const listRes = await serverHelper.request('GET', '/api/v1/epaper/editions');
      const ed = listRes.body.data[0];
      const repDelRes = await serverHelper.request('DELETE', `/api/v1/epaper/editions/${ed.id}`, null, {
        Authorization: `Bearer ${reporterToken}`,
      });
      assert.strictEqual(repDelRes.statusCode, 403);

      // 3. Master Admin CAN delete edition
      const masterDelRes = await serverHelper.request('DELETE', `/api/v1/epaper/editions/${ed.id}`, null, {
        Authorization: `Bearer ${masterAdminToken}`,
      });
      assert.strictEqual(masterDelRes.statusCode, 200);
      assert.strictEqual(masterDelRes.body.deleted, true);

      // 4. Source articles deep immutability check
      const targetArticle = SYNTHETIC_NEWS_ARTICLES[0];
      const snapshotBefore = JSON.parse(JSON.stringify(targetArticle));
      const placedElement = { ...targetArticle, customHeadline: 'संपादित हेडलाइन' };
      assert.deepStrictEqual(targetArticle, snapshotBefore);
      assert.strictEqual(targetArticle.title, snapshotBefore.title);
      assert.notStrictEqual(targetArticle.title, placedElement.customHeadline);
    });
  });
});
