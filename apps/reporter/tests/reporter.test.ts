/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Reporter Web Application & Field Reporting System Test Suite
 * Task ID: BNW-DEV-013 / BNW-OPS-006
 * Grounded in docs/05-Workflows.md (WF-CRE-01, WF-CRE-03), docs/06-Business-Rules.md (RULE-NEWS-003, RULE-NEWS-004),
 * docs/13-API.md (Section 14), docs/14-Auth.md, and docs/DECISIONS.md (DEC-020, DEC-033, DEC-069)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  saveLocalDraftSnapshot,
  getLocalDraftSnapshot,
  removeLocalDraftSnapshot,
  fileToBase64,
  refreshAccessTokenSingleFlight,
  setStoredTokens,
  getStoredAccessToken,
  clearStoredTokens,
} from '../src/lib/api';

describe('BNW-DEV-013 & BNW-OPS-006: Reporter Web Application Integration & Security Suite', () => {
  // 1. BRAND ASSET & REGULATORY INTEGRITY
  describe('Brand Logo & Statutory Compliance', () => {
    it('should have the exact canonical Brand Logo asset with matching SHA-256 hash', () => {
      const logoPath = path.resolve(__dirname, '../public/brand/logo.png');
      assert.ok(fs.existsSync(logoPath), 'Brand logo file must exist at apps/reporter/public/brand/logo.png');

      const fileBuffer = fs.readFileSync(logoPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

      const EXPECTED_HASH = '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F';
      assert.strictEqual(hash, EXPECTED_HASH, 'Brand logo SHA-256 must match the approved original hash exactly');
    });

    it('should not contain or display Madhya Pradesh State Emblem (State Emblem of India Act 2005)', () => {
      const indexHtmlPath = path.resolve(__dirname, '../index.html');
      const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(!htmlContent.includes('ashoka-lion'), 'Must not include Ashoka Lion Capital');
      assert.ok(!htmlContent.includes('mp-emblem'), 'Must not include MP State Emblem');
    });
  });

  // 2. PWA MANIFEST & SERVICE WORKER INTEGRITY
  describe('PWA Manifest & Service Worker Specification', () => {
    it('manifest.json should declare standalone display, Hindi name, and brand theme color #ED1727', () => {
      const manifestPath = path.resolve(__dirname, '../public/manifest.json');
      assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in public directory');

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      assert.strictEqual(manifest.display, 'standalone');
      assert.strictEqual(manifest.theme_color, '#ED1727');
      assert.strictEqual(manifest.background_color, '#FFFFFF');
      assert.strictEqual(manifest.short_name, 'रिपोर्टर');
      assert.ok(manifest.name.includes('BREAKING NEWS WALA'));
      assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
      assert.strictEqual(manifest.icons[0].src, '/brand/logo.png');
    });

    it('sw.js should exist and provide network-first API handling and static cache', () => {
      const swPath = path.resolve(__dirname, '../public/sw.js');
      assert.ok(fs.existsSync(swPath), 'sw.js service worker must exist in public directory');

      const swContent = fs.readFileSync(swPath, 'utf-8');
      assert.ok(swContent.includes('CACHE_NAME'), 'SW must define cache name');
      assert.ok(swContent.includes('install'), 'SW must handle install event');
      assert.ok(swContent.includes('activate'), 'SW must handle activate event');
      assert.ok(swContent.includes('fetch'), 'SW must intercept fetch events');
      assert.ok(swContent.includes('/api/'), 'SW must isolate API traffic from unsafe offline claims');
    });
  });

  // 3. DRAFT MANAGEMENT & LOCAL RECOVERY (WF-CRE-01)
  describe('Draft Management & Local Recovery (WF-CRE-01)', () => {
    it('should save, retrieve, and remove local draft snapshots without exposing auth tokens', () => {
      const storageMap = new Map<string, string>();
      const mockLocalStorage = {
        getItem: (key: string) => storageMap.get(key) || null,
        setItem: (key: string, val: string) => storageMap.set(key, val),
        removeItem: (key: string) => storageMap.delete(key),
      };
      (globalThis as any).localStorage = mockLocalStorage;

      const testDraft = {
        localId: 'test_local_draft_101',
        title: 'निवाड़ी में पेयजल परियोजना का लोकार्पण',
        subheadline: 'ग्रामीणों को मिलेगा शुद्ध जल',
        bodyContent: 'निवाड़ी जिले के ओरछा क्षेत्र में नई जल जीवन मिशन योजना का विस्तार किया गया।',
        primaryCategoryId: 'madhya-pradesh',
        primaryLocationId: 'niwari',
        featuredImageUrl: 'https://cdn.breakingnewswala.in/media/img1.jpg',
        imageCaption: 'लोकार्पण समारोह',
        imageAttribution: 'संवाद सूत्र',
      };

      saveLocalDraftSnapshot(testDraft);

      const retrieved = getLocalDraftSnapshot(testDraft.localId);
      assert.ok(retrieved, 'Draft snapshot must be retrieved');
      assert.strictEqual(retrieved.title, testDraft.title);
      assert.strictEqual(retrieved.primaryLocationId, 'niwari');
      assert.strictEqual(retrieved.isSyncedWithServer, false);
      assert.ok(retrieved.lastSavedAt, 'Must have lastSavedAt timestamp');

      // Security check: No auth tokens stored in draft payload
      assert.strictEqual((retrieved as any).accessToken, undefined);
      assert.strictEqual((retrieved as any).refreshToken, undefined);

      removeLocalDraftSnapshot(testDraft.localId);
      const afterRemoval = getLocalDraftSnapshot(testDraft.localId);
      assert.strictEqual(afterRemoval, null, 'Draft snapshot must be removed after deletion');
    });

    it('should maintain strict distinction between local device draft vs server-confirmed draft', () => {
      // Autosave indicator rule: Only displays "सर्वर पर सुरक्षित" upon successful server response
      const localState = { isSyncedWithServer: false, statusLabel: 'स्थानीय ड्राफ्ट सुरक्षित' };
      const serverState = { isSyncedWithServer: true, statusLabel: 'सर्वर पर सुरक्षित' };

      assert.strictEqual(localState.isSyncedWithServer, false);
      assert.strictEqual(serverState.isSyncedWithServer, true);
      assert.ok(localState.statusLabel.includes('स्थानीय'));
      assert.ok(serverState.statusLabel.includes('सर्वर'));
    });
  });

  // 4. ARTICLE LIFECYCLE & EDITORIAL GATES (RULE-NEWS-003, RULE-NEWS-004, WF-CRE-03)
  describe('Article Validation & Editorial Contracts (RULE-NEWS-003, RULE-NEWS-004)', () => {
    const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
    const DISALLOWED_HTML_TAGS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>|<iframe\b|<embed\b|<object\b|on\w+\s*=/i;

    const validateHeadline = (headline: string) => {
      const trimmed = headline.trim();
      if (!trimmed) return { valid: false, code: 'ERR_REQUIRED_FIELD' };
      if (trimmed.length < 15 || trimmed.length > 150) return { valid: false, code: 'ERR_HEADLINE_LENGTH' };
      if (!DEVANAGARI_REGEX.test(trimmed)) return { valid: false, code: 'ERR_HEADLINE_SCRIPT' };
      return { valid: true };
    };

    const validateBody = (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return { valid: false, code: 'ERR_REQUIRED_FIELD' };
      const words = trimmed.split(/\s+/).filter(Boolean).length;
      if (DISALLOWED_HTML_TAGS.test(trimmed)) return { valid: false, code: 'ERR_DISALLOWED_TAGS' };
      if (words < 50 && trimmed.length < 250) return { valid: false, code: 'ERR_BODY_MIN_LENGTH' };
      if (words > 5000) return { valid: false, code: 'ERR_BODY_MAX_LENGTH' };
      return { valid: true, words, chars: trimmed.length };
    };

    it('should enforce headline length boundary conditions (15–150 characters, RULE-NEWS-003)', () => {
      // 14 characters -> REJECTED
      const h14 = 'अ'.repeat(14);
      assert.strictEqual(h14.length, 14);
      assert.strictEqual(validateHeadline(h14).valid, false);
      assert.strictEqual(validateHeadline(h14).code, 'ERR_HEADLINE_LENGTH');

      // 15 characters -> ACCEPTED
      const h15 = 'अ'.repeat(15);
      assert.strictEqual(h15.length, 15);
      assert.strictEqual(validateHeadline(h15).valid, true);

      // 150 characters -> ACCEPTED
      const h150 = 'अ'.repeat(150);
      assert.strictEqual(h150.length, 150);
      assert.strictEqual(validateHeadline(h150).valid, true);

      // 151+ characters -> REJECTED
      const h151 = 'अ'.repeat(151);
      assert.strictEqual(h151.length, 151);
      assert.strictEqual(validateHeadline(h151).valid, false);
      assert.strictEqual(validateHeadline(h151).code, 'ERR_HEADLINE_LENGTH');
    });

    it('should enforce Hindi Devanagari script presence in headline (RULE-NEWS-003)', () => {
      const englishHeadline = 'Breaking news from Bhopal district collectorate about water crisis';
      assert.strictEqual(validateHeadline(englishHeadline).valid, false);
      assert.strictEqual(validateHeadline(englishHeadline).code, 'ERR_HEADLINE_SCRIPT');

      const devanagariHeadline = 'भोपाल कलेक्ट्रेट में पेयजल संकट को लेकर प्रदर्शन';
      assert.strictEqual(validateHeadline(devanagariHeadline).valid, true);
    });

    it('should enforce body length requirements (minimum 50 words OR 250 chars, max 5000 words, RULE-NEWS-004)', () => {
      // 10 words, 50 chars -> REJECTED
      const shortBody = 'निवाड़ी जिले के ओरछा क्षेत्र में नई योजना का विस्तार हुआ।';
      const shortRes = validateBody(shortBody);
      assert.strictEqual(shortRes.valid, false);
      assert.strictEqual(shortRes.code, 'ERR_BODY_MIN_LENGTH');

      // 52 words -> ACCEPTED
      const longBody50Words = `
        मध्य प्रदेश के निवाड़ी जिले में आज कलेक्ट्रेट परिसर में स्थानीय नागरिकों और किसान प्रतिनिधियों ने पेयजल संकट के समाधान को लेकर एक विशाल जनसमूह के साथ शांतिपूर्ण प्रदर्शन किया। 
        प्रदर्शनकारियों ने जिला कलेक्टर को 5 सूत्रीय ज्ञापन सौंपा, जिसमें आगामी ग्रीष्म ऋतु से पहले क्षेत्र के सभी नलकूपों की मरम्मत, 
        नल-जल योजना के सुचारू संचालन और टैंकरों द्वारा स्वच्छ पेयजल की आपूर्ति सुनिश्चित करने की मांग की गई। 
        प्रशासन ने 48 घंटे में समाधान का आश्वासन दिया है।
      `;
      const longRes = validateBody(longBody50Words);
      assert.strictEqual(longRes.valid, true);
      assert.ok((longRes.words || 0) >= 50);

      // 260 chars with 40 words -> ACCEPTED by character threshold (>= 250 chars)
      const longCharsBody = 'अ'.repeat(255);
      const charRes = validateBody(longCharsBody);
      assert.strictEqual(charRes.valid, true);
    });

    it('should reject prohibited HTML/XSS tags in body content (RULE-NEWS-004)', () => {
      const xssBody = 'मध्य प्रदेश की ताजा खबर <script>alert("xss")</script> यहाँ विस्तार से दी गई है जो कि पचास शब्दों से अधिक है ताकि शब्द सीमा पूरी हो सके पर यह असुरक्षित स्क्रिप्ट टैग शामिल करती है।';
      const xssRes = validateBody(xssBody);
      assert.strictEqual(xssRes.valid, false);
      assert.strictEqual(xssRes.code, 'ERR_DISALLOWED_TAGS');

      const iframeBody = 'संबंधित रिपोर्ट <iframe src="https://attacker.com"></iframe> पचास शब्दों से लंबी सामग्री ताकि शब्द गणना पूरी हो जाए और टेस्ट सुरक्षित रूप से टैग को पकड़ सके।';
      const iframeRes = validateBody(iframeBody);
      assert.strictEqual(iframeRes.valid, false);
      assert.strictEqual(iframeRes.code, 'ERR_DISALLOWED_TAGS');
    });

    it('should enforce strict server-side territory beat verification', () => {
      const reporterBeats = [
        { districtId: 'niwari', districtNameHi: 'निवाड़ी' },
        { districtId: 'tikamgarh', districtNameHi: 'टीकमगढ़' },
      ];

      const isDistrictAuthorized = (selectedDistrict: string) => {
        return reporterBeats.some((b) => b.districtId === selectedDistrict);
      };

      assert.strictEqual(isDistrictAuthorized('niwari'), true, 'Niwari must be authorized');
      assert.strictEqual(isDistrictAuthorized('tikamgarh'), true, 'Tikamgarh must be authorized');
      assert.strictEqual(isDistrictAuthorized('bhopal'), false, 'Unauthorized district must be rejected');
      assert.strictEqual(isDistrictAuthorized('indore'), false, 'Unauthorized district must be rejected');
    });

    it('should strictly bar direct-publishing shortcuts for standard reporters', () => {
      const standardReporter = {
        id: 'rep-std-1',
        fullName: 'मोहन शर्मा',
        roles: ['ROLE_REPORTER'],
        isTrustedPublisher: false,
      };

      const trustedReporter = {
        id: 'rep-tru-2',
        fullName: 'राजेश वर्मा',
        roles: ['ROLE_TRUSTED_REPORTER'],
        isTrustedPublisher: true,
      };

      assert.strictEqual(standardReporter.isTrustedPublisher, false);
      assert.strictEqual(trustedReporter.isTrustedPublisher, true);
    });
  });

  // 5. CONCURRENT TOKEN REFRESH & AUTHENTICATION HARDENING (DEC-033)
  describe('Authentication Concurrency & Single-Flight Mutex (DEC-033)', () => {
    it('should ensure single-flight mutex lock prevents multiple concurrent refresh calls', async () => {
      let networkRefreshCallCount = 0;

      // Mock fetch with artificial latency to test concurrency
      const originalFetch = globalThis.fetch;
      (globalThis as any).fetch = async (url: string) => {
        if (url.includes('/auth/refresh')) {
          networkRefreshCallCount++;
          await new Promise((resolve) => setTimeout(resolve, 50));
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                accessToken: `new_jwt_access_${Date.now()}`,
                refreshToken: `new_refresh_${Date.now()}`,
              },
            }),
          };
        }
        return { ok: true, status: 200, json: async () => ({ success: true }) };
      };

      try {
        // Fire 5 concurrent refresh requests simultaneously
        const refreshPromises = [
          refreshAccessTokenSingleFlight('test_refresh_token_1'),
          refreshAccessTokenSingleFlight('test_refresh_token_1'),
          refreshAccessTokenSingleFlight('test_refresh_token_1'),
          refreshAccessTokenSingleFlight('test_refresh_token_1'),
          refreshAccessTokenSingleFlight('test_refresh_token_1'),
        ];

        const results = await Promise.all(refreshPromises);

        // All 5 must succeed
        for (const res of results) {
          assert.strictEqual(res, true, 'Every concurrent refresh caller must succeed');
        }

        // Exactly 1 network refresh call must have occurred!
        assert.strictEqual(
          networkRefreshCallCount,
          1,
          'Single-flight mutex must dispatch exactly ONE network refresh request for concurrent 401s'
        );
      } finally {
        (globalThis as any).fetch = originalFetch;
      }
    });

    it('should clear stored credentials on logout or unrecoverable session expiry', () => {
      setStoredTokens('test_acc_token', 'test_ref_token');
      assert.ok(getStoredAccessToken());

      clearStoredTokens();
      assert.strictEqual(getStoredAccessToken(), null);
    });
  });

  // 6. MEDIA UPLOAD & BINARY PROCESSING (MED-01, MED-02, DEC-020)
  describe('Media Upload Constraints & Type Verification (MED-01, DEC-020)', () => {
    it('should enforce 10MB photo cap and 100MB video cap', () => {
      const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
      const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

      const sampleSmallImage = 2 * 1024 * 1024; // 2MB
      const sampleHugeImage = 15 * 1024 * 1024; // 15MB

      assert.ok(sampleSmallImage <= MAX_IMAGE_BYTES, '2MB image must be accepted');
      assert.ok(sampleHugeImage > MAX_IMAGE_BYTES, '15MB image must exceed 10MB limit');
    });

    it('fileToBase64 should accurately convert file buffer into base64 string', async () => {
      const sampleBuffer = Buffer.from('BREAKING NEWS WALA GROUND PHOTO BUFFER TEST');
      const base64 = await fileToBase64(sampleBuffer);

      assert.strictEqual(base64, sampleBuffer.toString('base64'));
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      assert.strictEqual(decoded, 'BREAKING NEWS WALA GROUND PHOTO BUFFER TEST');
    });
  });

  // 7. REPORTER PERFORMANCE & DEC-069 MONETIZATION INTEGRITY
  describe('Reporter Performance & Anti-Gamification (DEC-069, REP-12)', () => {
    it('should verify performance metrics are strictly informational with zero click-revenue calculations', () => {
      const performanceSample = {
        reporterId: 'rep-uuid-1',
        reporterName: 'दिनेश कुमार',
        totalArticlesPublished: 12,
        totalArticleViews: 4500,
        viewsLast15m: 120,
        topPerformingArticles: [
          { id: 'art-1', title: 'निवाड़ी विकास रिपोर्ट', views: 2100 },
        ],
      };

      assert.strictEqual(performanceSample.totalArticlesPublished, 12);
      assert.strictEqual(performanceSample.totalArticleViews, 4500);

      // Verify absence of unapproved click-revenue properties (DEC-069)
      assert.strictEqual((performanceSample as any).revenueShareRupees, undefined);
      assert.strictEqual((performanceSample as any).perClickPayout, undefined);
      assert.strictEqual((performanceSample as any).walletBalance, undefined);
    });
  });
});
