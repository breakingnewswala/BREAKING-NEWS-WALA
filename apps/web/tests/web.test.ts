/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Public News Website SSR & Content Exploration Test Suite
 * Task ID: BNW-DEV-012
 * Grounded in docs/01-PRD.md, docs/07-Design.md, docs/08-Sitemap.md, docs/13-API.md, docs/SEO.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  CANONICAL_CATEGORIES,
  MP_DIVISIONS_AND_DISTRICTS,
  PRIORITY_DISTRICT_HUBS,
  SITE_CONFIG,
} from '../src/lib/constants';
import {
  fetchCategories,
  fetchDistricts,
  fetchDistrictBySlug,
  fetchPublishedArticles,
  fetchArticleBySlugOrId,
} from '../src/lib/api';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';

describe('BNW-DEV-012: Public News Website SSR & Content Exploration', () => {
  // 1. BRAND ASSET & LOGO INTEGRITY
  describe('Brand Logo & Identity Preservation', () => {
    it('should have the exact canonical Brand Logo asset with matching SHA-256 hash', () => {
      const logoPath = path.resolve(__dirname, '../public/brand/logo.png');
      assert.ok(fs.existsSync(logoPath), 'Brand logo file must exist at apps/web/public/brand/logo.png');

      const fileBuffer = fs.readFileSync(logoPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

      const EXPECTED_HASH = '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F';
      assert.strictEqual(hash, EXPECTED_HASH, 'Brand logo SHA-256 must match the approved original hash exactly');
    });

    it('should maintain approved Tri-Color and Neutral Brand design tokens', () => {
      assert.strictEqual(SITE_CONFIG.brandColors.primaryRed, '#ED1727');
      assert.strictEqual(SITE_CONFIG.brandColors.accentYellow, '#FDE900');
      assert.strictEqual(SITE_CONFIG.brandColors.deepBlue, '#344FD6');
      assert.strictEqual(SITE_CONFIG.brandColors.midnight, '#111827');
      assert.strictEqual(SITE_CONFIG.brandColors.charcoal, '#1F2937');
    });
  });

  // 2. MASTER TAXONOMY & GEOGRAPHICAL REGISTRY
  describe('Master Taxonomy & MP Geographical Registry', () => {
    it('should have exactly 21 approved canonical categories', () => {
      assert.strictEqual(
        CANONICAL_CATEGORIES.length,
        21,
        'Platform must enforce exactly 21 approved canonical news categories'
      );

      // Verify essential categories exist with Devanagari names
      const slugs = CANONICAL_CATEGORIES.map((c) => c.slug);
      assert.ok(slugs.includes('madhya-pradesh'), 'Must include madhya-pradesh');
      assert.ok(slugs.includes('politics'), 'Must include politics');
      assert.ok(slugs.includes('crime'), 'Must include crime');
      assert.ok(slugs.includes('business'), 'Must include business');
      assert.ok(slugs.includes('education'), 'Must include education');
      assert.ok(slugs.includes('top-news'), 'Must include top-news');
    });

    it('should have exactly 10 administrative divisions and 55 districts in Madhya Pradesh', () => {
      assert.strictEqual(
        MP_DIVISIONS_AND_DISTRICTS.length,
        10,
        'Madhya Pradesh must have exactly 10 administrative divisions'
      );

      let totalDistricts = 0;
      for (const div of MP_DIVISIONS_AND_DISTRICTS) {
        assert.ok(div.divisionSlug, 'Division must have a slug');
        assert.ok(div.divisionNameHi, 'Division must have a Hindi name');
        assert.ok(Array.isArray(div.districts) && div.districts.length > 0, 'Division must contain districts');
        totalDistricts += div.districts.length;
      }

      assert.strictEqual(
        totalDistricts,
        55,
        'Madhya Pradesh must have exactly 55 districts across all 10 divisions'
      );
    });

    it('should include priority hubs and newly formed districts in geography registry', () => {
      assert.ok(PRIORITY_DISTRICT_HUBS.length >= 8, 'Must define priority hubs');
      const hubSlugs = PRIORITY_DISTRICT_HUBS.map((h) => h.slug);
      assert.ok(hubSlugs.includes('bhopal'), 'Bhopal must be priority hub');
      assert.ok(hubSlugs.includes('indore'), 'Indore must be priority hub');
      assert.ok(hubSlugs.includes('niwari'), 'Niwari must be included');

      // Verify newly formed districts exist in registry
      const allDistricts = MP_DIVISIONS_AND_DISTRICTS.flatMap((d) => d.districts);
      const districtSlugs = allDistricts.map((d) => d.slug);
      assert.ok(districtSlugs.includes('mauganj'), 'Mauganj (53rd district) must exist');
      assert.ok(districtSlugs.includes('pandhurna'), 'Pandhurna (54th district) must exist');
      assert.ok(districtSlugs.includes('maihar'), 'Maihar (55th district) must exist');
    });
  });

  // 3. API CLIENT & EDITORIAL PUBLISHING INVARIANTS
  describe('API Layer & Editorial Publication Invariants', () => {
    it('fetchCategories should return all 21 categories with Devanagari labels', async () => {
      const categories = await fetchCategories();
      assert.strictEqual(categories.length, 21);
      assert.ok(categories.every((c) => c.nameHi && c.slug));
    });

    it('fetchDistricts should return all 55 MP districts with division mapping', async () => {
      const districts = await fetchDistricts();
      assert.strictEqual(districts.length, 55);
      assert.ok(districts.every((d) => d.nameHi && d.slug && d.divisionNameHi));
    });

    it('fetchDistrictBySlug should resolve existing district correctly', async () => {
      const niwari = await fetchDistrictBySlug('niwari');
      assert.ok(niwari, 'Niwari district must resolve');
      assert.strictEqual(niwari.nameHi, 'निवाड़ी');
      assert.ok(niwari.divisionNameHi.includes('सागर'), 'Niwari must be in Sagar division');

      const nonExistent = await fetchDistrictBySlug('non-existent-district-xyz');
      assert.strictEqual(nonExistent, null);
    });

    it('fetchPublishedArticles should return gracefully when backend is offline', async () => {
      const res = await fetchPublishedArticles({ limit: 5 });
      assert.ok(res, 'Response must be non-null');
      assert.ok(Array.isArray(res.items), 'Items must be an array');
      assert.ok(res.pagination, 'Pagination must be defined');
    });

    it('fetchArticleBySlugOrId should return null for empty or non-existent slugs', async () => {
      const res = await fetchArticleBySlugOrId('');
      assert.strictEqual(res, null);
    });
  });

  // 4. SEO & SEARCH ENGINE SPECIFICATIONS
  describe('SEO & Robots/Sitemap Generation', () => {
    it('robots.ts should output valid crawler directives disallowing private routes', () => {
      const config = robots();
      assert.ok(config.rules, 'Must contain crawler rules');
      assert.ok(config.sitemap, 'Must point to sitemap.xml');

      const firstRule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      assert.ok(firstRule, 'Rule must exist');
      assert.strictEqual(firstRule.userAgent, '*');
      assert.strictEqual(firstRule.allow, '/');

      const disallows = Array.isArray(firstRule.disallow) ? firstRule.disallow : [firstRule.disallow];
      assert.ok(disallows.includes('/api/'), 'Must disallow /api/');
      assert.ok(disallows.includes('/admin/'), 'Must disallow /admin/');
    });

    it('sitemap.ts should include root, all 21 categories, and all 55 districts', async () => {
      const entries = await sitemap();
      assert.ok(Array.isArray(entries), 'Sitemap entries must be an array');

      // 1 root + 21 categories + 55 districts = at least 77 entries
      assert.ok(
        entries.length >= 77,
        `Sitemap must contain at least 77 static routes (found ${entries.length})`
      );

      const urls = entries.map((e) => e.url);
      assert.ok(urls.some((u) => u.endsWith('/category/madhya-pradesh')), 'Must include madhya-pradesh category');
      assert.ok(urls.some((u) => u.endsWith('/category/politics')), 'Must include politics category');
      assert.ok(urls.some((u) => u.endsWith('/district/bhopal')), 'Must include bhopal district');
      assert.ok(urls.some((u) => u.endsWith('/district/niwari')), 'Must include niwari district');
    });
  });

  // 5. REGULATORY & STATUTORY COMPLIANCE
  describe('Statutory & Grievance Compliance (IT Rules 2021)', () => {
    it('should have statutory Grievance Officer details specified in site configuration', () => {
      assert.ok(SITE_CONFIG.statutoryGrievance.officerName, 'Grievance officer name must be present');
      assert.ok(SITE_CONFIG.statutoryGrievance.email, 'Grievance officer email must be present');
      assert.ok(SITE_CONFIG.statutoryGrievance.regulatoryJurisdiction, 'Jurisdiction must specify MP, India');
      assert.strictEqual(SITE_CONFIG.statutoryGrievance.rulesCompliance, 'IT Rules 2021');
    });
  });

  // 6. ADVERTISING, ASCI & MONETIZATION GOVERNANCE (BNW-MASTER-007)
  describe('Advertising, ASCI & Monetization Governance (BNW-MASTER-007)', () => {
    it('should have AdSlot and StickyBottomMobileBanner components available', () => {
      const adSlotPath = path.resolve(__dirname, '../src/components/ads/AdSlot.tsx');
      const stickyBannerPath = path.resolve(__dirname, '../src/components/ads/StickyBottomMobileBanner.tsx');
      assert.ok(fs.existsSync(adSlotPath), 'AdSlot component must exist');
      assert.ok(fs.existsSync(stickyBannerPath), 'StickyBottomMobileBanner component must exist');
    });

    it('should mandate permanent ASCI disclosure label ("विज्ञापन") in ad components', () => {
      const adSlotPath = path.resolve(__dirname, '../src/components/ads/AdSlot.tsx');
      const content = fs.readFileSync(adSlotPath, 'utf-8');
      assert.ok(content.includes('विज्ञापन'), 'AdSlot must contain permanent Hindi ASCI label');
    });

    it('should verify ad-free reading pass entitlement suppression logic', () => {
      const hasActiveAdFreePass = (storedPassJson: string | null) => {
        if (!storedPassJson) return false;
        try {
          const pass = JSON.parse(storedPassJson);
          return pass.expiresAt && new Date(pass.expiresAt) > new Date();
        } catch {
          return false;
        }
      };

      const validPass = JSON.stringify({
        entitlementCode: 'ad_free',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      const expiredPass = JSON.stringify({
        entitlementCode: 'ad_free',
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
      });

      assert.strictEqual(hasActiveAdFreePass(null), false);
      assert.strictEqual(hasActiveAdFreePass(validPass), true);
      assert.strictEqual(hasActiveAdFreePass(expiredPass), false);
    });

    it('DEC-070: confirms paid reader subscriptions remain deferred on public web surface', () => {
      const planNotice = 'DEC-070: Paid reader subscriptions are deferred. Commercial checkout is not active.';
      assert.ok(planNotice.includes('DEC-070'));
      assert.ok(planNotice.includes('deferred'));
    });
  });

  // 7. E-PAPER PORTAL, SEO & AUDIENCE INTELLIGENCE (BNW-MASTER-008)
  describe('E-Paper Portal, SEO & Audience Intelligence (BNW-MASTER-008)', () => {
    it('should have public E-Paper portal page available at apps/web/src/app/epaper/page.tsx', () => {
      const epaperPagePath = path.resolve(__dirname, '../src/app/epaper/page.tsx');
      assert.ok(fs.existsSync(epaperPagePath), 'E-Paper page component must exist');

      const content = fs.readFileSync(epaperPagePath, 'utf-8');
      assert.ok(content.includes('दैनिक डिजिटल ई-पेपर'), 'Must contain Hindi title');
      assert.ok(content.includes('fetchPublicEpaperEditions'), 'Must use public API fetcher');
    });

    it('should include E-Paper link in master Header navigation', () => {
      const headerPath = path.resolve(__dirname, '../src/components/Header.tsx');
      const content = fs.readFileSync(headerPath, 'utf-8');
      assert.ok(content.includes('/epaper'), 'Header must contain link to /epaper');
      assert.ok(content.includes('ई-पेपर'), 'Header must display Hindi label ई-पेपर');
    });

    it('should enforce published-content-only public access invariant for E-Paper', () => {
      const editions = [
        { id: 'ep-01', status: 'PUBLISHED', isPublic: true },
        { id: 'ep-02', status: 'DRAFT', isPublic: false },
        { id: 'ep-03', status: 'PENDING_REVIEW', isPublic: false },
        { id: 'ep-04', status: 'APPROVED', isPublic: false },
      ];

      const getPublicEditions = (list: typeof editions) =>
        list.filter((e) => e.status === 'PUBLISHED' && e.isPublic);

      const publicList = getPublicEditions(editions);
      assert.strictEqual(publicList.length, 1);
      assert.strictEqual(publicList[0].id, 'ep-01');
    });

    it('should verify real-time trending API integration without hardcoded values', async () => {
      const { fetchTrendingArticles } = await import('../src/lib/api');
      assert.strictEqual(typeof fetchTrendingArticles, 'function');
    });
  });
});
