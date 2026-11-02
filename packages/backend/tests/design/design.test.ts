/**
 * BREAKING NEWS WALA — Design & Graphics Studio Test Suite
 * Grounded in docs/07-Design.md, docs/12-Database.md (DOM-H),
 * docs/05-Workflows.md (WF-RGFX-01, WF-AGFX-01), and docs/DECISIONS.md (DEC-048, DEC-057, DEC-060)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DesignEngine,
  ExportEngine,
  DesignService,
  InMemoryDesignRepository,
  CANVAS_PRESETS,
  PRESET_YOUTUBE_THUMBNAIL,
  PRESET_INSTAGRAM_SQUARE,
  CANONICAL_BRAND_ASSET,
  STATUTORY_EMBLEM_WARNING,
  STUDIO_LIMITS,
} from '../../src/modules/design';
import { DesignDocument, TextDesignElement, LogoDesignElement } from '@bnw/types';

describe('BNW-MASTER-003: Design & Graphics Studio Subsystem', () => {
  const mockUserReporter = { id: 'usr-reporter-001', roles: ['reporter'] };
  const mockUserEditor = { id: 'usr-editor-001', roles: ['editor'] };
  const mockUserAdmin = { id: 'usr-admin-001', roles: ['admin'] };
  const mockChiefEditor = { id: 'usr-chief-001', roles: ['ROLE_CHIEF_EDITOR'] };

  const createSampleDoc = (): DesignDocument => ({
    id: 'test-doc-001',
    title: 'परीक्षण न्यूज़ ग्राफिक',
    studioType: 'graphic',
    dimensions: PRESET_YOUTUBE_THUMBNAIL,
    background: { type: 'color', value: '#111827' },
    elements: [
      {
        id: 'el-text-1',
        type: 'text',
        name: 'शीर्षक',
        x: 60,
        y: 100,
        width: 800,
        height: 120,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        isLocked: false,
        isVisible: true,
        text: 'मध्यप्रदेश कैबिनेट का बड़ा निर्णय',
        fontFamily: 'Rozha One',
        fontSize: 48,
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: 0,
        textAlign: 'left',
        color: '#FFFFFF',
      },
      {
        id: 'el-logo-1',
        type: 'logo',
        name: 'चैनल लोगो',
        x: 1000,
        y: 40,
        width: 180,
        height: 60,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        isLocked: true,
        isVisible: true,
        variant: 'official_primary',
        imageUrl: CANONICAL_BRAND_ASSET.logoUrl,
        keepAspectRatio: true,
      },
    ],
    version: 1,
    status: 'draft',
    ownerId: 'usr-reporter-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  describe('1. Design Document Validation & Invariants', () => {
    it('should validate a compliant design document', () => {
      const doc = createSampleDoc();
      const result = DesignEngine.validateDesignDocument(doc);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject a design with empty title or invalid dimensions', () => {
      const invalidDoc = {
        ...createSampleDoc(),
        title: '   ',
        dimensions: { width: 0, height: 720, aspectRatio: '16:9' as any, label: 'Invalid' },
      };
      const result = DesignEngine.validateDesignDocument(invalidDoc);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('title')));
      assert.ok(result.errors.some((e) => e.includes('dimensions')));
    });

    it('should reject canvas dimensions exceeding max cap (4096px)', () => {
      const oversizeDoc = {
        ...createSampleDoc(),
        dimensions: { width: 5000, height: 5000, aspectRatio: 'custom' as any, label: 'Oversize' },
      };
      const result = DesignEngine.validateDesignDocument(oversizeDoc);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('cannot exceed')));
    });

    it('should detect duplicate element IDs', () => {
      const doc = createSampleDoc();
      doc.elements.push({ ...doc.elements[0] });
      const result = DesignEngine.validateDesignDocument(doc);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('Duplicate element ID')));
    });
  });

  describe('2. Element Lifecycle Operations', () => {
    it('should add a new element to the canvas and assign next zIndex', () => {
      const doc = createSampleDoc();
      const updated = DesignEngine.addElement(doc, {
        id: 'el-badge-new',
        type: 'badge',
        name: 'विशेष बैज',
        x: 60,
        y: 40,
        width: 140,
        height: 36,
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        isLocked: false,
        isVisible: true,
        badgeKind: 'breaking_ribbon',
        text: 'BREAKING',
        primaryColor: '#ED1727',
        textColor: '#FFFFFF',
      });

      assert.strictEqual(updated.elements.length, 3);
      assert.strictEqual(updated.elements[2].id, 'el-badge-new');
      assert.strictEqual(updated.elements[2].zIndex, 3);
      assert.strictEqual(updated.version, 2);
    });

    it('should update element properties while preserving immutable IDs and types', () => {
      const doc = createSampleDoc();
      const updated = DesignEngine.updateElement(doc, 'el-text-1', {
        x: 80,
        y: 120,
        color: '#FDE900',
      });

      const textEl = updated.elements.find((e) => e.id === 'el-text-1') as TextDesignElement;
      assert.strictEqual(textEl.x, 80);
      assert.strictEqual(textEl.y, 120);
      assert.strictEqual(textEl.color, '#FDE900');
      assert.strictEqual(textEl.type, 'text');
    });

    it('should duplicate an element with coordinate offset and unlocked state', () => {
      const doc = createSampleDoc();
      const { doc: updated, newElement } = DesignEngine.duplicateElement(doc, 'el-text-1');

      assert.strictEqual(updated.elements.length, 3);
      assert.strictEqual(newElement.x, 80); // 60 + 20
      assert.strictEqual(newElement.y, 120); // 100 + 20
      assert.notStrictEqual(newElement.id, 'el-text-1');
      assert.ok(newElement.name.includes('कॉपी'));
    });

    it('should remove an element from canvas', () => {
      const doc = createSampleDoc();
      const updated = DesignEngine.removeElement(doc, 'el-text-1');
      assert.strictEqual(updated.elements.length, 1);
      assert.strictEqual(updated.elements[0].id, 'el-logo-1');
    });
  });

  describe('3. Layer Ordering & Reindexing', () => {
    it('should move element to front (highest zIndex)', () => {
      const doc = createSampleDoc();
      const updated = DesignEngine.reorderElement(doc, 'el-text-1', 'front');
      const textEl = updated.elements.find((e) => e.id === 'el-text-1');
      const logoEl = updated.elements.find((e) => e.id === 'el-logo-1');
      assert.ok(textEl!.zIndex > logoEl!.zIndex);
    });

    it('should move element to back (lowest zIndex)', () => {
      const doc = createSampleDoc();
      const updated = DesignEngine.reorderElement(doc, 'el-logo-1', 'back');
      const logoEl = updated.elements.find((e) => e.id === 'el-logo-1');
      const textEl = updated.elements.find((e) => e.id === 'el-text-1');
      assert.ok(logoEl!.zIndex < textEl!.zIndex);
    });
  });

  describe('4. Canvas Alignment Snapping', () => {
    it('should align element to canvas center horizontally', () => {
      const doc = createSampleDoc();
      const updated = DesignEngine.alignElement(doc, 'el-text-1', 'center');
      const textEl = updated.elements.find((e) => e.id === 'el-text-1');
      const expectedX = Math.round((1280 - 800) / 2); // 240
      assert.strictEqual(textEl!.x, expectedX);
    });

    it('should align element to canvas middle vertically', () => {
      const doc = createSampleDoc();
      const updated = DesignEngine.alignElement(doc, 'el-text-1', 'middle');
      const textEl = updated.elements.find((e) => e.id === 'el-text-1');
      const expectedY = Math.round((720 - 120) / 2); // 300
      assert.strictEqual(textEl!.y, expectedY);
    });
  });

  describe('5. Element Grouping & Ungrouping', () => {
    it('should group elements and compute parent bounding box', () => {
      const doc = createSampleDoc();
      const { doc: updated, groupElement } = DesignEngine.groupElements(doc, ['el-text-1', 'el-logo-1']);

      assert.strictEqual(updated.elements.length, 3);
      assert.strictEqual(groupElement.type, 'group');
      assert.strictEqual(groupElement.childElementIds.length, 2);
      assert.strictEqual(groupElement.x, 60); // minX
      assert.strictEqual(groupElement.y, 40); // minY
    });

    it('should ungroup elements and restore individual states', () => {
      const doc = createSampleDoc();
      const { doc: grouped, groupElement } = DesignEngine.groupElements(doc, ['el-text-1', 'el-logo-1']);
      const ungrouped = DesignEngine.ungroupElements(grouped, groupElement.id);

      assert.strictEqual(ungrouped.elements.length, 2);
      assert.strictEqual(ungrouped.elements.some((e) => e.type === 'group'), false);
    });
  });

  describe('6. Dynamic Devanagari Typography Auto-Scaling (WF-RGFX-01)', () => {
    it('should keep base font size for short concise headlines', () => {
      const result = DesignEngine.calculateDevanagariAutoFit('भोपाल में भारी बारिश', 800, 200, 48);
      assert.strictEqual(result.fits, true);
      assert.strictEqual(result.fontSize, 48);
    });

    it('should scale down font size for long vernacular headlines', () => {
      const longHeadline =
        'मध्यप्रदेश विधानसभा के शीतकालीन सत्र में किसानों के ऋण माफी मुद्दे पर विपक्ष का जोरदार हंगामा, सदन की कार्यवाही दोपहर 2 बजे तक स्थगित';
      const result = DesignEngine.calculateDevanagariAutoFit(longHeadline, 600, 120, 48);
      assert.strictEqual(result.fits, true);
      assert.ok(result.fontSize < 48);
      assert.ok(result.fontSize >= 18);
    });

    it('should issue warning if headline exceeds 45 words', () => {
      const words = Array.from({ length: 50 }, (_, i) => `शब्द${i + 1}`).join(' ');
      const result = DesignEngine.calculateDevanagariAutoFit(words, 800, 200, 48);
      assert.ok(result.warning);
      assert.ok(result.warning.includes('अधिकतम अनुशंसित सीमा'));
    });
  });

  describe('7. Brand Safety & Statutory Emblem Invariants (DEC-060)', () => {
    it('should pass brand compliance when official logo maintains aspect ratio', () => {
      const doc = createSampleDoc();
      const result = DesignEngine.validateBrandIntegrity(doc);
      assert.strictEqual(result.isCompliant, true);
      assert.strictEqual(result.violations.length, 0);
    });

    it('should reject distorted or stretched logo (keepAspectRatio: false)', () => {
      const doc = createSampleDoc();
      const logoEl = doc.elements.find((e) => e.type === 'logo') as LogoDesignElement;
      (logoEl as any).keepAspectRatio = false;

      const result = DesignEngine.validateBrandIntegrity(doc);
      assert.strictEqual(result.isCompliant, false);
      assert.ok(result.violations.some((v) => v.includes('लोगो का आकार विकृत नहीं किया जा सकता')));
    });

    it('should strictly prohibit MP State Emblem or Ashoka Lion Capital', () => {
      const doc = createSampleDoc();
      (doc.elements[0] as TextDesignElement).text = 'मध्यप्रदेश शासन की शासकीय मुहर / Ashoka Lion';

      const result = DesignEngine.validateBrandIntegrity(doc);
      assert.strictEqual(result.isCompliant, false);
      assert.ok(result.violations.some((v) => v.includes(STATUTORY_EMBLEM_WARNING)));
    });
  });

  describe('8. Template Management & Pre-Seeded Catalog', () => {
    it('should have pre-seeded canonical master templates in memory repository', async () => {
      const repo = new InMemoryDesignRepository();
      const result = await repo.listTemplates({});
      assert.ok(result.total >= 5);
      const flashTpl = result.templates.find((t) => t.id === 'tpl-breaking-flash-16-9');
      assert.ok(flashTpl);
      assert.strictEqual(flashTpl.category, 'breaking');
      assert.strictEqual(flashTpl.isActive, true);
    });

    it('should allow Admin to create a new master template', async () => {
      const service = new DesignService(new InMemoryDesignRepository());
      const created = await service.createTemplate(
        {
          name: 'नया विशेष साक्षात्कार फ्रेम',
          description: 'वीआईपी साक्षात्कार हेतु 16:9 फ्रेम',
          category: 'quote',
          studioType: 'graphic',
          dimensions: PRESET_YOUTUBE_THUMBNAIL,
          schema: createSampleDoc(),
        },
        mockUserAdmin
      );

      assert.ok(created.id);
      assert.strictEqual(created.name, 'नया विशेष साक्षात्कार फ्रेम');
      assert.strictEqual(created.isActive, true);
    });

    it('should allow Admin to archive and publish templates', async () => {
      const service = new DesignService(new InMemoryDesignRepository());
      const archived = await service.archiveTemplate('tpl-breaking-flash-16-9', mockUserAdmin);
      assert.strictEqual(archived.isActive, false);

      const published = await service.publishTemplate('tpl-breaking-flash-16-9', mockUserAdmin);
      assert.strictEqual(published.isActive, true);
    });

    it('should deny non-elevated reporters from creating or archiving templates', async () => {
      const service = new DesignService(new InMemoryDesignRepository());
      await assert.rejects(
        service.createTemplate(
          {
            name: 'अवैध टेम्पलेट',
            description: 'परीक्षण',
            category: 'breaking',
            studioType: 'graphic',
            dimensions: PRESET_YOUTUBE_THUMBNAIL,
            schema: createSampleDoc(),
          },
          mockUserReporter
        ),
        /केवल अधिकृत संपादक या व्यवस्थापक/
      );
    });
  });

  describe('9. Export Engine & Vector Rendering (docs/16-Storage.md)', () => {
    it('should generate valid standards-compliant SVG document', () => {
      const doc = createSampleDoc();
      const svg = ExportEngine.renderToSvg(doc, 1);

      assert.ok(svg.startsWith('<?xml version="1.0"'));
      assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
      assert.ok(svg.includes('Noto Sans Devanagari'));
      assert.ok(svg.includes('मध्यप्रदेश कैबिनेट का बड़ा निर्णय'));
    });

    it('should sanitize text content to prevent script injection in SVG', () => {
      const doc = createSampleDoc();
      (doc.elements[0] as TextDesignElement).text = '<script>alert("xss")</script>ताज़ा खबर';

      const svg = ExportEngine.renderToSvg(doc, 1);
      assert.strictEqual(svg.includes('<script>'), false);
      assert.ok(svg.includes('&lt;script&gt;'));
    });

    it('should simulate high-res PNG and JPEG export with scale factor', async () => {
      const doc = createSampleDoc();
      const result2x = await ExportEngine.exportDesign(doc, 'png', 2);

      assert.ok(result2x.exportId.startsWith('exp_'));
      assert.strictEqual(result2x.width, 2560); // 1280 * 2
      assert.strictEqual(result2x.height, 1440); // 720 * 2
      assert.ok(result2x.fileSizeBytes! > 0);
    });
  });

  describe('10. Governance & Role Invariants (DEC-048)', () => {
    it('DEC-048: ROLE_CHIEF_EDITOR must be strictly rejected across all design operations', async () => {
      const service = new DesignService(new InMemoryDesignRepository());

      await assert.rejects(
        service.createDesign(
          {
            title: 'मुख्य संपादक डिज़ाइन',
            studioType: 'graphic',
            dimensions: PRESET_YOUTUBE_THUMBNAIL,
          },
          mockChiefEditor
        ),
        (err: any) => {
          assert.strictEqual(err.statusCode, 403);
          assert.ok(err.message.includes('Pending Approval'));
          return true;
        }
      );
    });
  });

  describe('11. Article Prefill Workflow (Newsroom Integration)', () => {
    it('should initialize a design prefilled from article metadata', async () => {
      const service = new DesignService(new InMemoryDesignRepository());
      const doc = await service.prefillFromArticle(
        {
          id: 'art-bhopal-metro-123',
          title: 'भोपाल मेट्रो का सफल ट्रायल रन',
          summary: 'मुख्यमंत्री ने हरी झंडी दिखाकर मेट्रो का ट्रायल रन शुरू किया।',
          primaryCategoryNameHi: 'विकास',
          primaryLocationNameHi: 'भोपाल',
          featuredMediaUrl: 'https://cdn.breakingnewswala.in/media/metro.jpg',
        },
        'graphic',
        mockUserEditor
      );

      assert.ok(doc.id);
      assert.ok(doc.title.includes('भोपाल मेट्रो'));
      assert.strictEqual(doc.associatedArticleId, 'art-bhopal-metro-123');
      assert.strictEqual(doc.elements.length, 5); // photo, overlay, badge, headline, logo

      const badgeEl = doc.elements.find((e) => e.type === 'badge');
      assert.strictEqual((badgeEl as any).text, 'भोपाल ग्राउंड रिपोर्ट');
    });
  });

  describe('12. AI Design Assistance (AGT-GRP-008)', () => {
    it('should return design concepts with Devanagari headline and palette recommendations', async () => {
      const service = new DesignService(new InMemoryDesignRepository());
      const concept = await service.generateAiConcept(
        {
          topic: 'इंदौर स्वच्छता अभियान 2026',
          studioType: 'social',
          category: 'district',
          district: 'इंदौर',
        },
        mockUserEditor
      );

      assert.ok(concept.conceptId.startsWith('concept_'));
      assert.ok(concept.headlineSuggestionHi.includes('इंदौर स्वच्छता अभियान 2026'));
      assert.strictEqual(concept.aiAttribution.agentId, 'AGT-GRP-008');
      assert.strictEqual(concept.aiAttribution.isAiAssisted, true);
      assert.ok(concept.recommendedElements.length >= 3);
    });
  });
});

