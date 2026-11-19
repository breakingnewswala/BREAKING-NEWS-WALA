/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Automated Test Suite — Milestone 4 (Steps 7, 8, 9)
 * File: tests/backend-ai-epaper-step9.test.js
 * 
 * Verifies:
 * 1. Step 7: 4:5 Portrait Article Clipping Rendering Contract
 * 2. Step 8: WhatsApp Card Generator API, Article Sourcing & Quota Enforcement
 * 3. Step 9: AI Newsroom Assistant Engines (Layout Assistant, Category Analyzer, Permanent Columns)
 * 4. Step 9: AI HTTP Endpoints under /api/v1/epaper/ai/*
 * 
 * Framework: Native Node.js test runner (node:test, node:assert/strict)
 * Execution: node --test tests/backend-ai-epaper-step9.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import {
  LayoutAssistantEngine,
  calculateColumnGrid,
  checkAABBCollision,
  BROADSHEET_LAYOUT_CONSTANTS,
} from '../src/server/ai/layoutAssistant.js';
import {
  CategoryClassifierEngine,
  CANONICAL_SECTIONS,
  SECTION_PAGE_MAPPING,
  MP_55_DISTRICTS,
} from '../src/server/ai/categoryAnalyzer.js';
import {
  PermanentColumnsEngine,
  PERMANENT_COLUMN_TYPES,
  PERMANENT_COLUMN_METADATA,
} from '../src/server/ai/permanentColumns.js';

process.env.NODE_ENV = 'test';

// Test HTTP Server Helper
function createMockHttpServer() {
  let server;
  let baseUrl;

  const start = () =>
    new Promise((resolve) => {
      server = http.createServer(async (req, res) => {
        try {
          await handleApiRequest(req, res);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: { message: err.message } }));
        }
      });
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve(baseUrl);
      });
    });

  const stop = () =>
    new Promise((resolve) => {
      if (server) server.close(resolve);
      else resolve();
    });

  const request = (path, options = {}) =>
    new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(
        url,
        {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let parsed = null;
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = data;
            }
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          });
        }
      );
      req.on('error', reject);
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });

  return { start, stop, request };
}

test('Step 9: Layout Assistant Engine (layoutAssistant.js)', async (t) => {
  await t.test('9.1.1: Handles empty elements array gracefully', () => {
    const result = LayoutAssistantEngine.autoArrangeLayout({ elements: [] });
    assert.equal(result.success, true);
    assert.equal(result.elements.length, 0);
    assert.equal(result.stats.totalElements, 0);
    assert.equal(result.stats.collisionFree, true);
    assert.equal(result.metadata.model, 'bnw-mock-v1');
    assert.equal(result.metadata.offlineReady, true);
  });

  await t.test('9.1.2: Broadsheet modular column calculation is exact for 3, 4, 5, 6, 8 columns', () => {
    for (const cols of [3, 4, 5, 6, 8]) {
      const grid = calculateColumnGrid(cols);
      assert.equal(grid.columns, cols);
      assert.equal(grid.colOffsets.length, cols);
      assert.ok(grid.colWidth > 80, `colWidth should be substantial for ${cols} cols`);

      const totalSpanW = grid.getSpanWidth(cols);
      assert.ok(
        Math.abs(totalSpanW - BROADSHEET_LAYOUT_CONSTANTS.PRINTABLE_WIDTH_PT) < 0.001,
        `Full span across ${cols} columns must equal PRINTABLE_WIDTH_PT`
      );
    }
  });

  await t.test('9.1.3: Auto-arranges full front page with masthead, lead headline, lead image, stories, column, and footer ad without collision', () => {
    const elements = [
      { id: 'el-lead-head', elementType: 'HEADLINE', role: 'LEAD', customHeadline: 'मध्य प्रदेश में औद्योगिक विकास की नई उड़ान' },
      { id: 'el-lead-img', elementType: 'IMAGE', role: 'LEAD', bounds: { width: 400, height: 220 } },
      { id: 'el-story-1', elementType: 'STORY', customHeadline: 'भोपाल मेट्रो करोंद रूट का सफल परीक्षण', bounds: { width: 300, height: 260 } },
      { id: 'el-story-2', elementType: 'STORY', customHeadline: 'इंदौर में 7-स्टार स्वच्छता मॉडल लागू', bounds: { width: 300, height: 260 } },
      { id: 'el-col-1', elementType: 'COLUMN', customHeadline: 'दैनिक पंचांग व राशिफल', bounds: { width: 280, height: 320 } },
      { id: 'el-ad-footer', elementType: 'AD', adSlotType: 'BOTTOM_STRIP', bounds: { width: 847, height: 140 } },
    ];

    const result = LayoutAssistantEngine.autoArrangeLayout({
      elements,
      gridColumns: 8,
      pageType: 'FRONT_PAGE',
      hasMasthead: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.stats.collisionFree, true, 'Layout must be 100% collision free');
    assert.equal(result.gridColumns, 8);
    assert.ok(result.stats.placedCount >= elements.length);

    // Verify masthead placed at top
    const masthead = result.elements.find((el) => el.elementType === 'MASTHEAD');
    assert.ok(masthead, 'Masthead must be present on front page');
    assert.equal(masthead.bounds.y, BROADSHEET_LAYOUT_CONSTANTS.MARGIN_TOP_PT);
    assert.equal(masthead.colSpan, 8);

    // Verify footer ad placed at bottom
    const footerAd = result.elements.find((el) => el.elementType === 'AD' && el.adSlotType === 'BOTTOM_STRIP');
    assert.ok(footerAd, 'Footer ad must be placed');
    assert.ok(footerAd.bounds.y > 1000, 'Footer ad must be anchored near printable bottom');
    assert.equal(footerAd.colSpan, 8);

    // Verify all element pairs pass 2D AABB collision check
    for (let i = 0; i < result.elements.length; i++) {
      for (let j = i + 1; j < result.elements.length; j++) {
        const collides = checkAABBCollision(result.elements[i].bounds, result.elements[j].bounds, 0.5);
        assert.equal(
          collides,
          false,
          `Elements ${result.elements[i].id} and ${result.elements[j].id} must not collide`
        );
      }
    }
  });

  await t.test('9.1.4: Auto-arranges 4-column layout cleanly', () => {
    const elements = [
      { id: 'el-s1', elementType: 'STORY', bounds: { width: 200, height: 200 } },
      { id: 'el-s2', elementType: 'STORY', bounds: { width: 200, height: 200 } },
      { id: 'el-s3', elementType: 'STORY', bounds: { width: 200, height: 200 } },
      { id: 'el-s4', elementType: 'STORY', bounds: { width: 200, height: 200 } },
    ];

    const result = LayoutAssistantEngine.autoArrangeLayout({
      elements,
      gridColumns: 4,
      pageType: 'DISTRICT_FOCUS',
      hasMasthead: false,
    });

    assert.equal(result.success, true);
    assert.equal(result.stats.collisionFree, true);
    assert.equal(result.gridColumns, 4);
    assert.equal(result.elements.length, 4);
  });

  await t.test('9.1.5: 25+ elements stress test with footer ad guarantees zero collision and printable bounds compliance', () => {
    for (const cols of [3, 4, 5, 6, 8]) {
      const elements = Array.from({ length: 25 }, (_, i) => ({
        id: `story-${i}`,
        elementType: 'STORY',
        bounds: { width: 250, height: 260 },
      }));
      elements.push({
        id: 'footer-ad',
        elementType: 'AD',
        adSlotType: 'BOTTOM_STRIP',
        bounds: { width: 847, height: 140 },
      });

      const result = LayoutAssistantEngine.autoArrangeLayout({
        elements,
        gridColumns: cols,
      });

      assert.equal(result.success, true);
      assert.equal(result.stats.collisionFree, true, `Grid cols ${cols} must be collision free`);
      assert.ok(result.stats.placedCount > 0);
      assert.ok(result.unplacedElements.length > 0, 'Excess elements must be held in unplacedElements');

      // Verify every pair of placed elements does not collide
      for (let i = 0; i < result.elements.length; i++) {
        for (let j = i + 1; j < result.elements.length; j++) {
          const collides = checkAABBCollision(result.elements[i].bounds, result.elements[j].bounds, 0.5);
          assert.equal(
            collides,
            false,
            `Collision detected between ${result.elements[i].id} and ${result.elements[j].id} on cols ${cols}`
          );
        }
      }

      // Verify all placed elements stay within printable broadsheet margins
      const maxAllowedX = BROADSHEET_LAYOUT_CONSTANTS.PAGE_WIDTH_PT - BROADSHEET_LAYOUT_CONSTANTS.MARGIN_RIGHT_PT;
      const maxAllowedY = BROADSHEET_LAYOUT_CONSTANTS.PAGE_HEIGHT_PT - BROADSHEET_LAYOUT_CONSTANTS.MARGIN_BOTTOM_PT;
      for (const el of result.elements) {
        assert.ok(
          el.bounds.x + el.bounds.width <= maxAllowedX + 0.1,
          `Element ${el.id} exceeds right margin: ${el.bounds.x + el.bounds.width} > ${maxAllowedX}`
        );
        assert.ok(
          el.bounds.y + el.bounds.height <= maxAllowedY + 0.1,
          `Element ${el.id} exceeds printable bottom margin: ${el.bounds.y + el.bounds.height} > ${maxAllowedY}`
        );
      }
    }
  });
});

test('Step 9: Category Classifier Engine (categoryAnalyzer.js)', async (t) => {
  await t.test('9.2.1: Correctly classifies sports news to SPORTS (Page 8)', () => {
    const result = CategoryClassifierEngine.classifyArticle({
      title: 'मध्य प्रदेश ने रणजी ट्रॉफी के सेमीफाइनल में बनाई जगह, होलकर स्टेडियम में मुकाबला',
      content: 'कप्तान ने शानदार शतक जड़कर टीम को ऐतिहासिक जीत दिलाई। क्रिकेट प्रेमियों में उत्साह।',
      district: 'इंदौर',
    });

    assert.equal(result.canonicalSection, CANONICAL_SECTIONS.SPORTS);
    assert.equal(result.suggestedPage, 8);
    assert.ok(result.confidence >= 0.85);
    assert.ok(result.reasoning.includes('खेल जगत'));
    assert.equal(result.metadata.model, 'bnw-mock-v1');
  });

  await t.test('9.2.2: Correctly classifies mandi business news to BUSINESS (Page 7)', () => {
    const result = CategoryClassifierEngine.classifyArticle({
      title: 'उज्जैन व इंदौर कृषि उपज मंडी में शरबती गेहूं और सोयाबीन के भाव में तेजी',
      content: 'चना और सरसों के रिकॉर्ड दाम। सर्राफा बाजार में सोना 78 हजार के पार, सेंसेक्स में उछाल।',
      district: 'उज्जैन',
    });

    assert.equal(result.canonicalSection, CANONICAL_SECTIONS.BUSINESS);
    assert.equal(result.suggestedPage, 7);
    assert.ok(result.confidence >= 0.85);
    assert.ok(result.reasoning.includes('व्यापार'));
  });

  await t.test('9.2.3: Correctly classifies state governance to STATE (Page 2)', () => {
    const result = CategoryClassifierEngine.classifyArticle({
      title: 'मुख्यमंत्री मोहन यादव की अध्यक्षता में मप्र कैबिनेट की अहम बैठक, लाडली बहना योजना पर बड़ा फैसला',
      content: 'मंत्रालय वल्लभ भवन में आयोजित कैबिनेट बैठक में नई औद्योगिक नीतियों को स्वीकृति दी गई।',
      district: 'भोपाल',
    });

    assert.equal(result.canonicalSection, CANONICAL_SECTIONS.STATE);
    assert.equal(result.suggestedPage, 2);
    assert.ok(result.confidence >= 0.85);
  });

  await t.test('9.2.4: Correctly classifies local administrative story to DISTRICT_FOCUS (Page 5)', () => {
    const result = CategoryClassifierEngine.classifyArticle({
      title: 'सीहोर जिला अस्पताल में नई सोनोग्राफी मशीन स्थापित, कलेक्टर ने किया औचक निरीक्षण',
      content: 'एसडीएम एवं सीएमएचओ को स्वास्थ्य सेवाओं में सुधार और जनसुनवाई के प्रकरणों के त्वरित निराकरण के निर्देश।',
      district: 'सीहोर',
    });

    assert.equal(result.canonicalSection, CANONICAL_SECTIONS.DISTRICT_FOCUS);
    assert.equal(result.suggestedPage, 5);
    assert.ok(result.confidence >= 0.85);
  });

  await t.test('9.2.5: Correctly classifies culture/entertainment to ENTERTAINMENT (Page 9)', () => {
    const result = CategoryClassifierEngine.classifyArticle({
      title: 'खजुराहो नृत्य समारोह का भव्य आगाज, शास्त्रीय कलाकारों ने बांधा समां',
      content: 'विश्व धरोहर नगरी में सात दिवसीय अंतरराष्ट्रीय सांस्कृतिक महोत्सव का शुभारंभ, प्रसिद्ध कलाकारों की प्रस्तुति।',
      district: 'छतरपुर',
    });

    assert.equal(result.canonicalSection, CANONICAL_SECTIONS.ENTERTAINMENT);
    assert.equal(result.suggestedPage, 9);
    assert.ok(result.confidence >= 0.85);
  });

  await t.test('9.2.6: Correctly classifies editorial commentary to EDITORIAL (Page 4)', () => {
    const result = CategoryClassifierEngine.classifyArticle({
      title: 'संपादकीय विमर्श: बुंदेलखंड के जल संरक्षण मॉडल पर एक गंभीर दृष्टिकोण',
      content: 'जल संकट के स्थायी समाधान हेतु पारंपरिक तालाबों और आधुनिक तकनीकों के समन्वय की आवश्यकता।',
    });

    assert.equal(result.canonicalSection, CANONICAL_SECTIONS.EDITORIAL);
    assert.equal(result.suggestedPage, 4);
    assert.ok(result.confidence >= 0.85);
  });

  await t.test('9.2.7: Correctly classifies national news to NATIONAL (Page 10)', () => {
    const result = CategoryClassifierEngine.classifyArticle({
      title: 'संसद के बजट सत्र में प्रधानमंत्री नरेंद्र मोदी का विशेष संबोधन, केंद्र सरकार की प्राथमिकताओं पर चर्चा',
      content: 'लोकसभा में विभिन्न मंत्रालयों की अनुदान मांगों पर गहन परिचर्चा, विपक्षी सदस्यों ने रखे अपने विचार।',
    });

    assert.equal(result.canonicalSection, CANONICAL_SECTIONS.NATIONAL);
    assert.equal(result.suggestedPage, 10);
    assert.ok(result.confidence >= 0.85);
  });

  await t.test('9.2.8: Correctly classifies breaking emergency to FRONT_PAGE (Page 1)', () => {
    const result = CategoryClassifierEngine.classifyArticle({
      title: '🚨 ब्रेकिंग न्यूज: नर्मदापुरम में भारी बारिश के बाद तवा बांध के 13 गेट खोले गए, हाई अलर्ट',
      content: 'प्रशासन ने निचले इलाकों में आपदा प्रबंधन दल तैनात किए, राहत एवं बचाव कार्य युद्धस्तर पर जारी।',
      district: 'नर्मदापुरम',
    });

    assert.equal(result.canonicalSection, CANONICAL_SECTIONS.FRONT_PAGE);
    assert.equal(result.suggestedPage, 1);
    assert.ok(result.confidence >= 0.85);
  });

  await t.test('9.2.9: Safely handles null, undefined, and missing fields without throwing', () => {
    const testCases = [
      { title: null, content: null },
      { title: null, content: 'भोपाल में विकास कार्य' },
      { title: 'क्रिकेट मैच', content: null, summary: null, district: null, category: null },
      {},
      { title: undefined, content: undefined },
    ];

    for (const tc of testCases) {
      assert.doesNotThrow(() => {
        const result = CategoryClassifierEngine.classifyArticle(tc);
        assert.ok(result);
        assert.ok(result.canonicalSection);
        assert.ok(result.suggestedPage >= 1 && result.suggestedPage <= 12);
        assert.ok(result.confidence >= 0.8 && result.confidence <= 1.0);
        assert.ok(result.reasoning);
      });
    }
  });
});

test('Step 9: Permanent Columns Engine (permanentColumns.js)', async (t) => {
  await t.test('9.3.1: getAvailableTypes returns all 5 permanent column types with Hindi/English titles', () => {
    const types = PermanentColumnsEngine.getAvailableTypes();
    assert.equal(types.length, 5);
    const expected = [
      PERMANENT_COLUMN_TYPES.PANCHANG,
      PERMANENT_COLUMN_TYPES.EDITORIAL_OPED,
      PERMANENT_COLUMN_TYPES.MARKET_TICKER,
      PERMANENT_COLUMN_TYPES.WEATHER,
      PERMANENT_COLUMN_TYPES.DISTRICT_ROUNDUP,
    ];
    for (const exp of expected) {
      assert.ok(types.some((t) => t.type === exp), `Missing column type ${exp}`);
    }
  });

  await t.test('9.3.2: Generates PANCHANG with Tithi, Nakshatra, Rahukaal, 12 Rashis and source attribution', () => {
    const res = PermanentColumnsEngine.generatePermanentColumn({
      type: PERMANENT_COLUMN_TYPES.PANCHANG,
      district: 'उज्जैन',
    });

    assert.equal(res.type, PERMANENT_COLUMN_TYPES.PANCHANG);
    assert.ok(res.columnTitle.includes('पंचांग'));
    assert.equal(res.sourceAttribution, 'पंचांग गणना डेस्क / उज्जैन पंचांग संदर्भ');
    assert.ok(res.bodyText.includes('तिथि'));
    assert.ok(res.bodyText.includes('नक्षत्र'));
    assert.ok(res.bodyText.includes('राहुकाल'));
    assert.ok(res.bodyText.includes('मेष'));
    assert.ok(res.bodyText.includes('मीन'));

    // Check page element helper output
    assert.ok(res.element);
    assert.equal(res.element.elementType, 'COLUMN');
    assert.equal(res.element.sourceAttribution, 'पंचांग गणना डेस्क / उज्जैन पंचांग संदर्भ');
  });

  await t.test('9.3.3: Generates EDITORIAL_OPED with Devanagari commentary and source attribution', () => {
    const res = PermanentColumnsEngine.generatePermanentColumn({
      type: PERMANENT_COLUMN_TYPES.EDITORIAL_OPED,
    });

    assert.equal(res.type, PERMANENT_COLUMN_TYPES.EDITORIAL_OPED);
    assert.ok(res.columnTitle.includes('संपादकीय'));
    assert.equal(res.sourceAttribution, 'बीएनडब्ल्यू संपादकीय मंडल (AI Newsroom Desk)');
    assert.ok(res.bodyText.length > 200, 'Editorial body should be substantial');
    assert.equal(res.section, 'EDITORIAL');
  });

  await t.test('9.3.4: Generates MARKET_TICKER with mandi rates, bullion, Sensex, and source attribution', () => {
    const res = PermanentColumnsEngine.generatePermanentColumn({
      type: PERMANENT_COLUMN_TYPES.MARKET_TICKER,
    });

    assert.equal(res.type, PERMANENT_COLUMN_TYPES.MARKET_TICKER);
    assert.equal(res.sourceAttribution, 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड एवं बाजार डेस्क');
    assert.ok(res.bodyText.includes('गेहूं'));
    assert.ok(res.bodyText.includes('सोयाबीन'));
    assert.ok(res.bodyText.includes('सोना'));
    assert.ok(res.bodyText.includes('सेंसेक्स'));
    assert.equal(res.section, 'BUSINESS');
  });

  await t.test('9.3.5: Generates WEATHER with 10 MP divisions forecast and source attribution', () => {
    const res = PermanentColumnsEngine.generatePermanentColumn({
      type: PERMANENT_COLUMN_TYPES.WEATHER,
    });

    assert.equal(res.type, PERMANENT_COLUMN_TYPES.WEATHER);
    assert.equal(res.sourceAttribution, 'OpenWeather / IMD (भारतीय मौसम विज्ञान विभाग)');
    assert.ok(res.bodyText.includes('भोपाल'));
    assert.ok(res.bodyText.includes('इंदौर'));
    assert.ok(res.bodyText.includes('ग्वालियर'));
    assert.ok(res.bodyText.includes('जबलपुर'));
  });

  await t.test('9.3.6: Generates DISTRICT_ROUNDUP with regional developments and source attribution', () => {
    const res = PermanentColumnsEngine.generatePermanentColumn({
      type: PERMANENT_COLUMN_TYPES.DISTRICT_ROUNDUP,
      district: 'रीवा',
    });

    assert.equal(res.type, PERMANENT_COLUMN_TYPES.DISTRICT_ROUNDUP);
    assert.equal(res.sourceAttribution, 'बीएनडब्ल्यू जिला संवाददाता नेटवर्क');
    assert.ok(res.bodyText.includes('रीवा'));
    assert.equal(res.section, 'DISTRICT_FOCUS');
  });
});

test('Step 9: HTTP Endpoints under /api/v1/epaper/ai/* (apiEngine.js)', async (t) => {
  const httpHelper = createMockHttpServer();
  await httpHelper.start();

  const editorToken = signToken({
    id: 'usr-chief-editor',
    identifier: 'riturajtomarorchha@gmail.com',
    role: 'CHIEF_EDITOR',
    roles: ['ROLE_CHIEF_EDITOR'],
    fullName: 'ऋतुराज सिंह तोमर',
  });

  t.after(async () => {
    await httpHelper.stop();
  });

  await t.test('9.4.1: POST /api/v1/epaper/ai/auto-layout rejects unauthenticated request (401)', async () => {
    const res = await httpHelper.request('/api/v1/epaper/ai/auto-layout', {
      method: 'POST',
      body: { elements: [] },
    });
    assert.equal(res.status, 401);
  });

  await t.test('9.4.2: POST /api/v1/epaper/ai/auto-layout executes layout bin-packing for authenticated user (200)', async () => {
    const res = await httpHelper.request('/api/v1/epaper/ai/auto-layout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        elements: [
          { id: 'el-1', elementType: 'HEADLINE', role: 'LEAD', customHeadline: 'शीर्ष समाचार' },
          { id: 'el-2', elementType: 'STORY', customHeadline: 'खबर विवरण', bounds: { width: 300, height: 200 } },
        ],
        gridColumns: 8,
        pageType: 'FRONT_PAGE',
        hasMasthead: true,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.stats.collisionFree, true);
    assert.equal(res.body.gridColumns, 8);
    assert.ok(res.body.elements.length >= 2);
  });

  await t.test('9.4.3: POST /api/v1/epaper/ai/classify-category classifies article with confidence (200)', async () => {
    const res = await httpHelper.request('/api/v1/epaper/ai/classify-category', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        title: 'ग्वालियर में राज्य स्तरीय हॉकी टूर्नामेंट का शुभारंभ',
        content: 'देश भर के 16 प्रमुख क्लब भाग ले रहे हैं।',
        district: 'ग्वालियर',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.canonicalSection, 'SPORTS');
    assert.equal(res.body.suggestedPage, 8);
    assert.ok(res.body.confidence >= 0.85);
  });

  await t.test('9.4.4: POST /api/v1/epaper/ai/permanent-columns generates recurring column (200)', async () => {
    const res = await httpHelper.request('/api/v1/epaper/ai/permanent-columns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        type: 'WEATHER',
        district: 'भोपाल',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.type, 'WEATHER');
    assert.equal(res.body.sourceAttribution, 'OpenWeather / IMD (भारतीय मौसम विज्ञान विभाग)');
    assert.ok(res.body.element);
    assert.equal(res.body.element.elementType, 'COLUMN');
  });

  await t.test('9.4.5: GET /api/v1/epaper/ai/permanent-columns/types returns 5 supported column types (200)', async () => {
    const res = await httpHelper.request('/api/v1/epaper/ai/permanent-columns/types', {
      method: 'GET',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 5);
  });
});

test('Step 8: WhatsApp Card Generation API & Sourcing Refinements', async (t) => {
  const httpHelper = createMockHttpServer();
  await httpHelper.start();

  const adapter = getPersistenceAdapter();
  // Ensure fresh quota for test reporter to guarantee test isolation
  if (Array.isArray(adapter.data?.epaperWhatsAppGenerations)) {
    adapter.data.epaperWhatsAppGenerations = adapter.data.epaperWhatsAppGenerations.filter(
      (g) => g.reporterId !== 'usr-reporter-test-01'
    );
  }
  const reporterToken = signToken({
    id: 'usr-reporter-test-01',
    identifier: 'reporter.test01@breakingnewswala.com',
    role: 'trusted_reporter',
    roles: ['ROLE_REPORTER'],
    fullName: 'दिनेश कुमार',
  });

  t.after(async () => {
    await httpHelper.stop();
  });

  await t.test('8.1: Rejects invalid WhatsApp card format (e.g. 16:9 or custom) with HTTP 400', async () => {
    const res = await httpHelper.request('/api/v1/epaper/whatsapp/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: {
        format: '16:9', // INVALID
        headline: 'परीक्षण शीर्षक',
        body: 'परीक्षण विवरण',
      },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ERR_VALIDATION');
  });

  await t.test('8.2: Accepts valid 1:1 and 4:5 formats', async () => {
    for (const fmt of ['1:1', '4:5']) {
      const res = await httpHelper.request('/api/v1/epaper/whatsapp/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${reporterToken}` },
        body: {
          format: fmt,
          headline: `परीक्षण सोशल कार्ड ${fmt}`,
          body: `यह ${fmt} फॉर्मेट का एक वैध सोशल कार्ड है।`,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.format, fmt);
      assert.equal(res.body.data.isPrivate, true);
    }
  });

  await t.test('8.3: Auto-resolves article when articleId is supplied without headline', async () => {
    // Sourcing article art-001 from adapter
    const res = await httpHelper.request('/api/v1/epaper/whatsapp/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: {
        format: '4:5',
        articleId: 'art-001', // headline and body omitted
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.headline.includes('विधानसभा') || res.body.data.headline.includes('गेहूं'));
    assert.ok(res.body.data.body.includes('किसानों') || res.body.data.body.includes('बोनस'));
    assert.equal(res.body.data.isPrivate, true);
  });

  await t.test('8.4: Rejects request with missing headline and non-existent articleId with HTTP 400', async () => {
    const res = await httpHelper.request('/api/v1/epaper/whatsapp/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: {
        format: '4:5',
        articleId: 'non-existent-article-xyz',
      },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ERR_VALIDATION');
  });

  await t.test('8.5: Daily quota endpoint returns correct remaining and maxDaily quota info', async () => {
    const res = await httpHelper.request('/api/v1/epaper/whatsapp/quota', {
      method: 'GET',
      headers: { Authorization: `Bearer ${reporterToken}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.maxDaily, 20);
    assert.equal(typeof res.body.data.remaining, 'number');
    assert.equal(typeof res.body.data.used, 'number');
  });
});
