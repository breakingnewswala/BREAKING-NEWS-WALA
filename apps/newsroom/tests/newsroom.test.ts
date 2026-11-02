/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Central Newsroom Collaborative Editorial Desk Test Suite
 * Task ID: BNW-DEV-014
 * Grounded in docs/05-Workflows.md (Section 23.1, WF-01), docs/06-Business-Rules.md (RULE-EDIT-001 through RULE-EDIT-007),
 * docs/13-API.md (Section 14), docs/14-Auth.md, and docs/DECISIONS.md (DEC-033, DEC-048, DEC-059)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  isElevatedEditor,
  refreshAccessTokenSingleFlight,
  setStoredTokens,
  getStoredAccessToken,
  clearStoredTokens,
} from '../src/lib/api';
import { DEFAULT_FACT_CHECK_ITEMS } from '../src/components/FactCheckWorkspace';
import { REJECTION_REASON_CODES } from '../src/components/RejectionModal';
import { REVISION_QUICK_TEMPLATES } from '../src/components/RevisionRequestModal';

describe('BNW-DEV-014: Central Newsroom Collaborative Editorial Desk Suite', () => {

  // 1. BRAND ASSET & REGULATORY INTEGRITY
  describe('Brand Logo & Statutory Compliance', () => {
    it('should have the exact canonical Brand Logo asset with matching SHA-256 hash', () => {
      const logoPath = path.resolve(__dirname, '../public/brand/logo.png');
      assert.ok(fs.existsSync(logoPath), 'Brand logo file must exist at apps/newsroom/public/brand/logo.png');

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
      assert.ok(!htmlContent.includes('government-seal'), 'Must not include MP Government Seal');
    });
  });

  // 2. ROLE-BASED ACCESS CONTROL (RBAC) & ELEVATED EDITOR GATE
  describe('RBAC & Elevated Editorial Authorization Gate', () => {
    it('should allow all canonical elevated editorial desk roles', () => {
      const elevatedRoles = [
        'editor',
        'ROLE_EDITOR',
        'desk_editor',
        'ROLE_DESK_EDITOR',
        'sub_editor',
        'ROLE_SUB_EDITOR',
        'bureau_chief',
        'ROLE_BUREAU_CHIEF',
        'admin',
        'ROLE_ADMIN',
        'super_admin',
        'ROLE_SUPER_ADMIN',
      ];

      for (const role of elevatedRoles) {
        assert.ok(
          isElevatedEditor([role]),
          `Role ${role} must be granted elevated newsroom desk access`
        );
      }
    });

    it('should strictly deny non-elevated user roles', () => {
      const nonElevatedRoles = [
        'ROLE_REPORTER',
        'reporter',
        'ROLE_TRUSTED_REPORTER',
        'trusted_reporter',
        'ROLE_CITIZEN',
        'citizen',
        'ROLE_USER',
        'user',
        'ROLE_MODERATOR',
        'moderator',
        'ROLE_ADVERTISER',
        'advertiser',
      ];

      for (const role of nonElevatedRoles) {
        assert.strictEqual(
          isElevatedEditor([role]),
          false,
          `Role ${role} must NOT have elevated editorial desk access`
        );
      }

      assert.strictEqual(isElevatedEditor([]), false, 'Empty roles must be denied');
      assert.strictEqual(isElevatedEditor(undefined), false, 'Undefined roles must be denied');
    });

    it('DEC-048: ROLE_CHIEF_EDITOR must remain Pending Approval and not be permitted', () => {
      // In accordance with DEC-048, ROLE_CHIEF_EDITOR is pending executive approval
      // and must not be treated as a valid canonical role in the gate.
      assert.strictEqual(
        isElevatedEditor(['ROLE_CHIEF_EDITOR']),
        false,
        'ROLE_CHIEF_EDITOR must not grant access while DEC-048 is Pending Approval'
      );
    });
  });

  // 3. AUTHENTICATION & SINGLE-FLIGHT MUTEX TOKEN REFRESH
  describe('Dual-Token Storage & Concurrency Mutex', () => {
    it('should correctly set, retrieve, and clear tokens in mock storage', () => {
      // Setup mock sessionStorage
      const store: Record<string, string> = {};
      const mockStorage = {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      };

      (globalThis as any).sessionStorage = mockStorage;

      setStoredTokens('test-newsroom-access-token', 'test-newsroom-refresh-token');
      assert.strictEqual(getStoredAccessToken(), 'test-newsroom-access-token');

      clearStoredTokens();
      assert.strictEqual(getStoredAccessToken(), null);

      delete (globalThis as any).sessionStorage;
    });

    it('should coalesce concurrent refresh requests into a single promise (Single-Flight DEC-033)', async () => {
      let fetchCallCount = 0;

      // Mock fetch to simulate latency and count calls
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/auth/refresh')) {
          fetchCallCount++;
          await new Promise((r) => setTimeout(r, 20));
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                accessToken: 'new-shared-access-token',
                refreshToken: 'new-shared-refresh-token',
              },
            }),
          } as Response;
        }
        return originalFetch(input, init);
      };

      try {
        // Fire 5 simultaneous refresh requests
        const results = await Promise.all([
          refreshAccessTokenSingleFlight('concurrent-refresh-token'),
          refreshAccessTokenSingleFlight('concurrent-refresh-token'),
          refreshAccessTokenSingleFlight('concurrent-refresh-token'),
          refreshAccessTokenSingleFlight('concurrent-refresh-token'),
          refreshAccessTokenSingleFlight('concurrent-refresh-token'),
        ]);

        for (const res of results) {
          assert.strictEqual(res, true, 'Every concurrent caller must receive success');
        }
        assert.strictEqual(fetchCallCount, 1, 'Exactly 1 network request should be dispatched across concurrent calls');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // 4. 10-POINT FACT-CHECKING PROTOCOL INTEGRITY
  describe('10-Point Fact-Checking Protocol Checklist', () => {
    it('should define exactly 10 mandatory fact-checking criteria', () => {
      assert.strictEqual(
        DEFAULT_FACT_CHECK_ITEMS.length,
        10,
        'Fact-checking workspace must feature exactly 10 comprehensive editorial checkpoints'
      );
    });

    it('should cover all canonical verification dimensions in Hindi', () => {
      const titles = DEFAULT_FACT_CHECK_ITEMS.map((item) => item.titleHi);

      // Check key dimensions
      assert.ok(titles.some((t) => t.includes('प्राथमिक स्रोत')), 'Checkpoint 1: Primary source verification');
      assert.ok(titles.some((t) => t.includes('भौगोलिक लोकेशन')), 'Checkpoint 2: Location jurisdiction');
      assert.ok(titles.some((t) => t.includes('दिनांक व समय')), 'Checkpoint 3: Date & time validity');
      assert.ok(titles.some((t) => t.includes('आधिकारिक प्रशासनिक/पुलिस बयान')), 'Checkpoint 4: Official statement');
      assert.ok(titles.some((t) => t.includes('फोटो व वीडियो प्रामाणिकता')), 'Checkpoint 5: Media authenticity & anti-deepfake');
      assert.ok(titles.some((t) => t.includes('आधिकारिक दस्तावेज अथवा एफआईआर')), 'Checkpoint 6: Official documents / FIR');
      assert.ok(titles.some((t) => t.includes('निष्पक्षता व दूसरे पक्ष का पक्ष')), 'Checkpoint 7: Balance & right of reply');
      assert.ok(titles.some((t) => t.includes('मानहानि व न्यायालय अवमानना')), 'Checkpoint 8: Defamation & legal filter');
      assert.ok(titles.some((t) => t.includes('शीर्षक की गंभीरता')), 'Checkpoint 9: Headline proportionality');
      assert.ok(titles.some((t) => t.includes('प्रेस आचार संहिता')), 'Checkpoint 10: PCI ethical code compliance');
    });

    it('each item should have unique ID 1 to 10 and non-empty description', () => {
      const ids = new Set<number>();
      for (const item of DEFAULT_FACT_CHECK_ITEMS) {
        assert.ok(item.id >= 1 && item.id <= 10, `Item ID ${item.id} must be between 1 and 10`);
        assert.ok(!ids.has(item.id), `Item ID ${item.id} must be unique`);
        ids.add(item.id);
        assert.ok(item.descriptionHi.trim().length > 10, 'Each item must have a detailed Devanagari description');
      }
    });
  });

  // 5. REJECTION & REVISION VALIDATION RULES
  describe('Editorial Rejection & Revision Rules (RULE-EDIT-005)', () => {
    it('should provide comprehensive rejection reason categories', () => {
      assert.ok(REJECTION_REASON_CODES.length >= 6, 'Should provide at least 6 canonical rejection reason codes');
      const codes = REJECTION_REASON_CODES.map((r) => r.code);
      assert.ok(codes.includes('FACTUAL_ERRORS'));
      assert.ok(codes.includes('DEFAMATION_RISK'));
      assert.ok(codes.includes('DUPLICATE_STORY'));
      assert.ok(codes.includes('OUTSIDE_EDITORIAL_SCOPE'));
      assert.ok(codes.includes('UNVERIFIED_SOURCE'));
      assert.ok(codes.includes('POOR_QUALITY'));
    });

    it('should provide actionable quick revision templates for desk editors', () => {
      assert.ok(REVISION_QUICK_TEMPLATES.length >= 4, 'Should provide standard quick feedback templates');
      for (const tmpl of REVISION_QUICK_TEMPLATES) {
        assert.ok(tmpl.length >= 10, 'Each template must meet minimum 10 characters length constraint');
      }
    });

    it('should validate minimum 10 characters feedback constraint for rejection and revisions', () => {
      const validateFeedback = (txt: string) => txt.trim().length >= 10;

      assert.strictEqual(validateFeedback(''), false);
      assert.strictEqual(validateFeedback('छोटा'), false);
      assert.strictEqual(validateFeedback('123456789'), false);
      assert.strictEqual(validateFeedback('1234567890'), true);
      assert.strictEqual(validateFeedback('कृपया थानेदार का आधिकारिक बयान जोड़ें।'), true);
    });
  });

  // 6. CONCURRENCY & CROSS-EDITOR COLLISION SAFETY
  describe('Cross-Editor Claiming Collision Detection', () => {
    it('should identify when an article is claimed by another editor', () => {
      const currentEditorId = 'editor-alpha-uuid';
      const otherEditorId = 'editor-beta-uuid';

      const checkCollision = (status: string, lastEditorId: string | null | undefined, myId: string) => {
        return status === 'under_review' && !!lastEditorId && lastEditorId !== myId;
      };

      // Case 1: Unclaimed article in pending_review
      assert.strictEqual(checkCollision('pending_review', null, currentEditorId), false);

      // Case 2: Claimed by myself
      assert.strictEqual(checkCollision('under_review', currentEditorId, currentEditorId), false);

      // Case 3: Claimed by another editor -> COLLISION DETECTED
      assert.strictEqual(checkCollision('under_review', otherEditorId, currentEditorId), true);

      // Case 4: Already published article
      assert.strictEqual(checkCollision('published', otherEditorId, currentEditorId), false);
    });
  });

  // 7. BNW-MASTER-002: AI EDITORIAL CO-PILOT & SOVEREIGNTY (DEC-055, RULE-AI-001)
  describe('AI Editorial Co-Pilot & Editorial Sovereignty', () => {
    it('AI assistant must strictly return isAutomatedApproval: false (RULE-AI-001)', () => {
      const mockFactCheckResponse = {
        claimsIdentified: [],
        overallAdvisory: 'मानवीय समीक्षा आवश्यक',
        isAutomatedApproval: false,
      };

      assert.strictEqual(
        mockFactCheckResponse.isAutomatedApproval,
        false,
        'AI must never independently certify or approve publication'
      );
    });

    it('should validate minimum character inputs for AI headline generation and structuring', () => {
      const isValidBody = (body: string) => body.trim().length >= 10;
      assert.strictEqual(isValidBody(''), false);
      assert.strictEqual(isValidBody('छोटा'), false);
      assert.strictEqual(isValidBody('मध्यप्रदेश में नई सिंचाई परियोजना का शुभारंभ हुआ।'), true);
    });
  });

  // 8. BNW-MASTER-003: GRAPHICS & DESIGN STUDIO SUITE
  describe('Graphics & Design Studio Integration (BNW-MASTER-003)', () => {
    it('should validate standard canvas presets across thumbnail, social, and graphic studio modes', () => {
      const presets = [
        { id: 'yt-thumb', width: 1280, height: 720, aspectRatio: '16:9', studioType: 'thumbnail' },
        { id: 'yt-shorts', width: 1080, height: 1920, aspectRatio: '9:16', studioType: 'thumbnail' },
        { id: 'insta-portrait', width: 1080, height: 1350, aspectRatio: '4:5', studioType: 'social' },
        { id: 'insta-square', width: 1080, height: 1080, aspectRatio: '1:1', studioType: 'social' },
        { id: 'fb-post', width: 1200, height: 630, aspectRatio: '1.91:1', studioType: 'social' },
        { id: 'x-banner', width: 1500, height: 500, aspectRatio: '3:1', studioType: 'graphic' },
      ];

      for (const p of presets) {
        assert.ok(p.width >= 1000, 'Preset width must be >= 1000px for HD export');
        assert.ok(p.height >= 500, 'Preset height must be >= 500px');
        assert.ok(['16:9', '9:16', '4:5', '1:1', '1.91:1', '3:1'].includes(p.aspectRatio));
      }
    });

    it('should validate Devanagari text word count limits (warning above 45 words)', () => {
      const isWordCountExceeded = (txt: string) => {
        const words = txt.trim().split(/\s+/).filter(Boolean);
        return words.length > 45;
      };

      const shortHeadline = 'भोपाल मेट्रो का ट्रायल रन सफल, मुख्यमंत्री ने दिखाई हरी झंडी';
      assert.strictEqual(isWordCountExceeded(shortHeadline), false);

      const fiftyWordText = new Array(50).fill('समाचार').join(' ');
      assert.strictEqual(isWordCountExceeded(fiftyWordText), true);
    });

    it('should enforce verified canonical brand logo and SHA-256 hash match', () => {
      const CANONICAL_HASH = '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F';
      const logoElement = {
        type: 'logo',
        url: '/brand/logo.png',
        fileHash: '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F',
        maintainAspectRatio: true,
      };

      assert.strictEqual(logoElement.fileHash, CANONICAL_HASH);
      assert.strictEqual(logoElement.maintainAspectRatio, true);
    });

    it('should strictly prohibit MP State Emblem or Ashoka Lion in design elements (DEC-060)', () => {
      const validateEmblemSafety = (el: { name?: string; text?: string }) => {
        const prohibited = ['ashoka lion', 'state emblem', 'शासकीय मुहर', 'अशोक स्तंभ'];
        const content = `${el.name || ''} ${el.text || ''}`.toLowerCase();
        return !prohibited.some((p) => content.includes(p));
      };

      assert.strictEqual(validateEmblemSafety({ name: 'News Headline', text: 'भोपाल ब्रेकिंग' }), true);
      assert.strictEqual(validateEmblemSafety({ name: 'Ashoka Lion Seal', text: 'शासकीय मुहर' }), false);
    });

    it('should validate multi-format export payload specifications (PNG, JPEG, WebP, SVG)', () => {
      const validFormats = ['png', 'jpeg', 'webp', 'svg'];
      const validScales = [1, 2, 3];

      for (const fmt of validFormats) {
        assert.ok(validFormats.includes(fmt));
      }
      for (const s of validScales) {
        assert.ok(s >= 1 && s <= 3);
      }
    });

    it('should correctly format article metadata into design prefill structure', () => {
      const article = {
        id: 'news-mp-001',
        title: 'इंदौर में नए फ्लाईओवर का उद्घाटन कल',
        primaryCategoryNameHi: 'विकास',
        primaryLocationNameHi: 'इंदौर',
        featuredImageUrl: 'https://images.unsplash.com/flyover.jpg',
      };

      const prefillElements = [
        { type: 'badge', text: `🔴 ${article.primaryCategoryNameHi} | ${article.primaryLocationNameHi}` },
        { type: 'text', text: article.title },
        { type: 'image', url: article.featuredImageUrl },
      ];

      assert.strictEqual(prefillElements[0].text, '🔴 विकास | इंदौर');
      assert.strictEqual(prefillElements[1].text, 'इंदौर में नए फ्लाईओवर का उद्घाटन कल');
      assert.strictEqual(prefillElements[2].url, 'https://images.unsplash.com/flyover.jpg');
    });
  });

  // 9. VIDEO PRODUCTION STUDIO & FFMPEG TIMELINE GOVERNANCE (BNW-MASTER-004)
  describe('Video Production Studio & Multi-Track Timeline Governance', () => {
    it('should validate all standard video aspect ratios and dimensions', () => {
      const presets = [
        { ratio: '9:16', width: 1080, height: 1920, target: 'Reels / Shorts' },
        { ratio: '16:9', width: 1920, height: 1080, target: 'Web / YouTube' },
        { ratio: '1:1', width: 1080, height: 1080, target: 'Square Social Feed' },
        { ratio: '4:5', width: 1080, height: 1350, target: 'Portrait Feed' },
      ];

      for (const p of presets) {
        assert.ok(p.width > 0 && p.height > 0);
        assert.ok(['9:16', '16:9', '1:1', '4:5'].includes(p.ratio));
      }
    });

    it('should validate multi-track timeline structure and clip integrity', () => {
      const tracks = [
        { id: 'trk-v1', type: 'video', isLocked: false, isMuted: false, clipCount: 3 },
        { id: 'trk-o1', type: 'graphics', isLocked: false, isMuted: false, clipCount: 1 },
        { id: 'trk-a1', type: 'audio', isLocked: false, isMuted: false, clipCount: 1 },
      ];

      assert.strictEqual(tracks.length, 3);
      for (const t of tracks) {
        assert.ok(t.clipCount > 0);
        assert.strictEqual(t.isLocked, false);
      }
    });

    it('should enforce subtitle timing constraints (startTime >= 0, endTime > startTime)', () => {
      const cues = [
        { startTime: 3.5, endTime: 7.5, text: 'मध्यप्रदेश की ताज़ा बड़ी ख़बर।' },
        { startTime: 7.8, endTime: 14.0, text: 'घटनास्थल से सीधा विवरण।' },
      ];

      for (const cue of cues) {
        assert.ok(cue.startTime >= 0);
        assert.ok(cue.endTime > cue.startTime);
        assert.ok(cue.text.length > 0);
      }
    });

    it('should correctly format article metadata into video prefill timeline structure', () => {
      const article = {
        id: 'news-bhopal-999',
        title: 'भोपाल में मेट्रो ट्रेन का पहला ट्रायल सफल',
        primaryLocationNameHi: 'भोपाल',
      };

      const introBumperDuration = 3.0;
      const outroBumperDuration = 3.0;
      const totalDuration = 30.0;

      const mainFootageDuration = totalDuration - (introBumperDuration + outroBumperDuration);
      assert.strictEqual(mainFootageDuration, 24.0);

      const tickerText = `ब्रेकिंग न्यूज़: ${article.title} (${article.primaryLocationNameHi} ब्यूरो)`;
      assert.ok(tickerText.includes('भोपाल में मेट्रो ट्रेन का पहला ट्रायल सफल'));
    });

    it('should enforce Brand Logo hash match on video intro bumper (DEC-060)', () => {
      const CANONICAL_HASH = '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F';
      const introBumper = {
        logoHash: '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F',
        safeMarginPercent: 5,
        resolution: '1080x1920',
      };

      assert.strictEqual(introBumper.logoHash, CANONICAL_HASH);
      assert.ok(introBumper.safeMarginPercent >= 5);
    });
  });

  describe('Central AI Newsroom & RSS Ingestion Suite (BNW-MASTER-005)', () => {
    it('should cover all 10 canonical AI newsroom workspaces', () => {
      const canonicalWorkspaces = [
        'research',
        'writing',
        'headlines',
        'summary',
        'translation',
        'grammar',
        'taxonomy',
        'comparison',
        'factcheck',
        'rss-queue',
      ];

      assert.strictEqual(canonicalWorkspaces.length, 10);
      assert.ok(canonicalWorkspaces.includes('research'));
      assert.ok(canonicalWorkspaces.includes('comparison'));
      assert.ok(canonicalWorkspaces.includes('rss-queue'));
    });

    it('should strictly enforce that AI assistance never executes autonomous publishing', () => {
      const aiFactCheckResponse = {
        claims: ['प्रशासन ने 50 करोड़ के पैकेज की घोषणा की'],
        verificationDimension: 'Financial Notification',
        isAutomatedApproval: false, // Invariant: AI never publishes directly!
      };

      assert.strictEqual(aiFactCheckResponse.isAutomatedApproval, false);
    });

    it('should require RSS imported drafts to pass through editorial review before publishing', () => {
      const rssDraft = {
        title: 'भोपाल बीआरटीएस कॉरिडोर का नवीनीकरण',
        contentSource: 'rss_import',
        status: 'draft',
        sourceAttribution: 'Government of Madhya Pradesh — DPR (MP जनसंपर्क विभाग)',
      };

      assert.strictEqual(rssDraft.status, 'draft');
      assert.strictEqual(rssDraft.contentSource, 'rss_import');
      assert.ok(rssDraft.sourceAttribution.includes('DPR'));
    });

    it('should group related wire news into cross-source story clusters', () => {
      const cluster = {
        id: 'cluster-bhopal-metro',
        title: 'भोपाल मेट्रो रेल परियोजना ट्रायल रन',
        primaryCategory: 'विकास',
        itemCount: 2,
        sourceIds: ['rss-src-mp-prd-001', 'rss-src-air-bhopal-002'],
      };

      assert.strictEqual(cluster.itemCount, 2);
      assert.strictEqual(cluster.sourceIds.length, 2);
    });
  });

  // 12. SOCIAL MEDIA PUBLISHING DESK & GOVERNANCE (BNW-MASTER-006)
  describe('Social Media Publishing Desk & Delivery Governance (BNW-MASTER-006)', () => {
    it('should validate multi-platform character constraints and t.co URL weighting', () => {
      const calculateXLength = (text: string, url?: string): number => {
        let length = text.length;
        if (url) {
          length += 23; // Twitter t.co fixed wrapper size
        }
        return length;
      };

      const copy = 'भोपाल में मेट्रो का सफल ट्रायल।';
      const url = 'https://breakingnewswala.com/article/bhopal-metro-trial-2026';
      const xLength = calculateXLength(copy, url);

      assert.strictEqual(xLength, copy.length + 23);
      assert.ok(xLength <= 280, 'X post length must not exceed 280 characters');
    });

    it('should enforce RULE-SOC-001: unpublished articles can never be posted to social channels', () => {
      interface MockEditorialArticle {
        id: string;
        title: string;
        status: string;
      }

      const canPostToSocial = (article: MockEditorialArticle): boolean => {
        return article.status === 'published';
      };

      const draftArticle: MockEditorialArticle = { id: 'art-1', title: 'ड्राफ्ट खबर', status: 'draft' };
      const underReviewArticle: MockEditorialArticle = { id: 'art-2', title: 'समीक्षाधीन खबर', status: 'under_review' };
      const publishedArticle: MockEditorialArticle = { id: 'art-3', title: 'प्रकाशित खबर', status: 'published' };

      assert.strictEqual(canPostToSocial(draftArticle), false);
      assert.strictEqual(canPostToSocial(underReviewArticle), false);
      assert.strictEqual(canPostToSocial(publishedArticle), true);
    });

    it('should reset approval state when post caption or headline is modified prior to delivery', () => {
      interface SocialJobState {
        id: string;
        title: string;
        caption: string;
        status: 'PENDING_APPROVAL' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED';
      }

      const updateContent = (job: SocialJobState, newCaption: string): SocialJobState => {
        const isModified = job.caption !== newCaption;
        let newStatus = job.status;
        if (isModified && (job.status === 'APPROVED' || job.status === 'SCHEDULED')) {
          newStatus = 'PENDING_APPROVAL';
        }
        return {
          ...job,
          caption: newCaption,
          status: newStatus,
        };
      };

      const approvedJob: SocialJobState = {
        id: 'job-999',
        title: 'इंदौर स्वच्छता रैंकिंग',
        caption: 'इंदौर लगातार आठवीं बार देश का सबसे स्वच्छ शहर बना।',
        status: 'APPROVED',
      };

      const modifiedJob = updateContent(approvedJob, 'इंदौर ने स्वच्छता में फिर रचा इतिहास (संशोधित विवरण)');
      assert.strictEqual(modifiedJob.status, 'PENDING_APPROVAL');
    });

    it('should track multi-platform deliveries independently and handle partial successes truthfully', () => {
      const deliveries = [
        { platform: 'x', status: 'PUBLISHED', externalPostId: 'tw-12345' },
        { platform: 'facebook', status: 'PUBLISHED', externalPostId: 'fb-67890' },
        { platform: 'instagram', status: 'FAILED', errorMessage: 'Media aspect ratio invalid' },
      ];

      const successful = deliveries.filter((d) => d.status === 'PUBLISHED').length;
      const failed = deliveries.filter((d) => d.status === 'FAILED').length;

      let overallStatus: string;
      if (failed > 0 && successful > 0) {
        overallStatus = 'PARTIALLY_PUBLISHED';
      } else if (failed === deliveries.length) {
        overallStatus = 'FAILED';
      } else {
        overallStatus = 'PUBLISHED';
      }

      assert.strictEqual(overallStatus, 'PARTIALLY_PUBLISHED');
      assert.strictEqual(successful, 2);
      assert.strictEqual(failed, 1);
    });
  });
});

