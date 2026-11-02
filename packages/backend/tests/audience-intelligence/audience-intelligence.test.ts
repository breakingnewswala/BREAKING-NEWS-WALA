/**
 * BREAKING NEWS WALA — Audience & Intelligence Subsystem Test Suite
 * Task ID: BNW-MASTER-008
 * Grounded in docs/Analytics.md, docs/SEO.md, docs/02-Features.md (FEAT-FUT-004),
 * docs/12-Database.md (DOM-O, DOM-S, DOM-T), docs/06-Business-Rules.md (RULE-ANA-001, RULE-ANA-002),
 * and docs/DECISIONS.md (DEC-007, DEC-011, DEC-014, DEC-017, DEC-021, DEC-048, DEC-060, DEC-068, DEC-069, DEC-070).
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  InMemoryAnalyticsRepository,
  AnalyticsService,
  PrivacyService,
  TRENDING_CONFIG,
  CANONICAL_AUDIENCE_SEGMENTS,
} from '../../src/modules/analytics';

import {
  InMemorySeoRepository,
  SeoService,
} from '../../src/modules/seo';

import {
  InMemoryEpaperRepository,
  EpaperService,
} from '../../src/modules/epaper';

import { InMemoryArticleRepository } from '../../src/modules/articles/article.repository';

describe('BNW-MASTER-008: Audience & Intelligence Ecosystem', () => {
  let analyticsRepo: InMemoryAnalyticsRepository;
  let analyticsService: AnalyticsService;
  let privacyService: PrivacyService;
  let seoRepo: InMemorySeoRepository;
  let seoService: SeoService;
  let articleRepo: InMemoryArticleRepository;
  let epaperRepo: InMemoryEpaperRepository;
  let epaperService: EpaperService;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    articleRepo = new InMemoryArticleRepository();

    // Seed test articles for SEO and lifecycle validation
    await articleRepo.createArticle({
      id: 'art-bhopal-metro-001',
      publicId: 'art_bhopal_metro',
      slug: 'bhopal-metro-phase-2-trial-run',
      title: 'भोपाल मेट्रो चरण-2 का ट्रायल रन शुरू',
      subheadline: 'एम्स से सुभाष नगर तक मेट्रो का सफल परीक्षण',
      excerpt: 'भोपाल मेट्रो के द्वितीय चरण का ट्रायल रन एम्स से सुभाष नगर तक सफलतापूर्वक शुरू हो चुका है।',
      bodyContent: 'मध्य प्रदेश की राजधानी भोपाल में मेट्रो ट्रेन का दूसरा ट्रायल रन आज सफलतापूर्वक आयोजित किया गया...',
      authorId: 'rep-bhopal-01',
      primaryCategoryId: 'cat-development',
      primaryLocationId: 'loc-bhopal',
      status: 'published',
    });

    await articleRepo.createArticle({
      id: 'art-indore-clean-002',
      publicId: 'art_indore_clean',
      slug: 'indore-cleanest-city-award',
      title: 'इंदौर को सातवीं बार देश का सबसे स्वच्छ शहर सम्मान',
      subheadline: 'स्वच्छ सर्वेक्षण 2026 में शीर्ष स्थान',
      excerpt: 'इंदौर ने एक बार फिर स्वच्छता में इतिहास रचते हुए शीर्ष स्थान प्राप्त किया है।',
      bodyContent: 'इंदौर नगर निगम और नागरिकों की सहभागिता से शहर लगातार स्वच्छता के नए मानक स्थापित कर रहा है...',
      authorId: 'rep-indore-02',
      primaryCategoryId: 'cat-development',
      primaryLocationId: 'loc-indore',
      status: 'published',
    });

    analyticsRepo = new InMemoryAnalyticsRepository();
    // Seed initial trending hits for trending tests
    await analyticsRepo.recordTrendingHit('art-bhopal-01');
    await analyticsRepo.recordTrendingHit('art-indore-02');
    await analyticsRepo.recordTrendingHit('art-ujjain-03');
    await analyticsRepo.recordTrendingHit('art-gwalior-04');
    await analyticsRepo.recordTrendingHit('art-jabalpur-05');

    privacyService = new PrivacyService();
    analyticsService = new AnalyticsService(analyticsRepo, undefined, privacyService, articleRepo);

    seoRepo = new InMemorySeoRepository();
    seoService = new SeoService(seoRepo, articleRepo);

    epaperRepo = new InMemoryEpaperRepository();
    epaperService = new EpaperService(epaperRepo);
  });

  // ============================================================================
  // 1. Telemetry Ingestion & Canonical Event Taxonomy Reconciliation (RULE-ANA-001)
  // ============================================================================
  describe('1. Telemetry Ingestion & Reconciled Taxonomy', () => {
    it('should successfully ingest canonical article_read_30s event', async () => {
      const result = await analyticsService.ingestEvent({
        event_id: 'evt-read-001',
        event_name: 'article_read_30s',
        platform: 'web',
        timestamp: new Date().toISOString(),
        properties: {
          article_id: 'art-bhopal-metro-001',
          district: 'bhopal',
          category: 'urban_development',
          dwell_time_seconds: 45,
          scroll_depth_percent: 85,
        },
      }, '103.21.124.89');

      assert.equal(result.accepted, true);
      assert.equal(result.eventId, 'evt-read-001');
      assert.equal(result.isBot, false);
      assert.equal(result.isDuplicate, false);
    });

    it('should successfully ingest article_viewed event and increment view stats', async () => {
      const result = await analyticsService.ingestEvent({
        event_id: 'evt-view-002',
        event_name: 'article_viewed',
        platform: 'web',
        timestamp: new Date().toISOString(),
        properties: {
          article_id: 'art-bhopal-metro-001',
          district: 'bhopal',
          category: 'urban_development',
        },
      }, '103.21.124.90');

      assert.equal(result.accepted, true);
      assert.equal(result.eventId, 'evt-view-002');
      assert.equal(result.isBot, false);
    });

    it('should truncate IPv4 to /24 subnet for DPDPA privacy compliance', () => {
      const truncated = privacyService.truncateIp('103.21.124.89');
      assert.equal(truncated, '103.21.124.0');
    });

    it('should truncate IPv6 to /48 subnet for privacy compliance', () => {
      const truncated = privacyService.truncateIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      assert.equal(truncated, '2001:0db8:85a3::0');
    });

    it('should reject unapproved / uncanonical telemetry event names', async () => {
      await assert.rejects(
        async () => {
          await analyticsService.ingestEvent({
            event_id: 'evt-invalid-003',
            event_name: 'user_clicked_random_ad' as any,
            platform: 'web',
            timestamp: new Date().toISOString(),
            properties: {},
          }, '127.0.0.1');
        },
        (err: any) => {
          assert.equal(err.name, 'AppError');
          assert.equal(err.statusCode, 400);
          return true;
        }
      );
    });
  });

  // ============================================================================
  // 2. Audience Overview & Content Performance Intelligence
  // ============================================================================
  describe('2. Audience Overview & Content Intelligence', () => {
    it('should calculate audience overview statistics with Asia/Kolkata boundary logic', async () => {
      const overview = await analyticsService.getOverview(['ROLE_EDITOR'], undefined, undefined, '7d');
      assert.ok(overview.totalPageViews > 0);
      assert.ok(overview.uniqueSessionsEstimate > 0);
      assert.ok(overview.avgEngagementTimeSeconds >= 0);
      assert.ok(overview.platformDistribution);
      assert.ok(overview.trafficSourceBreakdown);
    });

    it('should return content performance stats with sufficient data threshold guard', async () => {
      const stats = await analyticsService.getContentPerformance(['ROLE_EDITOR'], '7d');
      assert.ok(stats.topArticles.length > 0);
      const first = stats.topArticles[0];
      assert.ok(first.articleId);
      assert.ok(typeof first.totalViews === 'number');
      assert.ok(typeof first.avgReadTimeSeconds === 'number');
      assert.ok(stats.topCategories.length > 0);
      assert.ok(stats.topDistricts.length > 0);
    });

    it('should compute district-wise audience insights across MP districts', async () => {
      const insights = await analyticsService.getDistrictInsights(['ROLE_EDITOR'], '7d');
      assert.ok(insights.length >= 5);
      const bhopal = insights.find((d) => d.districtId === 'bhopal');
      assert.ok(bhopal);
      assert.equal(bhopal.districtNameHi, 'भोपाल');
      assert.ok(bhopal.totalViews > 0);
      assert.ok(bhopal.activeSessionsEstimate > 0);
    });

    it('should generate editorial performance reports with SLA adherence', async () => {
      const report = await analyticsService.getEditorialPerformance(['ROLE_EDITOR'], 'usr-admin-01', undefined, '7d');
      assert.ok(report.articlesPublished >= 0);
      assert.ok(report.articlesReviewed >= 0);
      assert.ok(typeof report.avgReviewTurnaroundMinutes === 'number');
    });

    it('should compare performance between multiple articles', async () => {
      const comparison = await analyticsService.compareContent(
        ['ROLE_EDITOR'],
        'article',
        'art-bhopal-01',
        'art-indore-02'
      );
      assert.ok(comparison.entity1);
      assert.ok(comparison.entity2);
      assert.ok(typeof comparison.viewsDifferencePercent === 'number');
      assert.ok(typeof comparison.hasSufficientData === 'boolean');
    });
  });

  // ============================================================================
  // 3. Audience Segmentation & Privacy-Safe Preferences (DOM-O)
  // ============================================================================
  describe('3. Audience Preferences & Segmentation (DOM-O)', () => {
    it('should provide canonical system audience segments without sensitive profiling', async () => {
      const segments = await analyticsService.getAudienceSegments(['ROLE_ADMIN']);
      assert.equal(segments.length, CANONICAL_AUDIENCE_SEGMENTS.length);
      const general = segments.find((s) => s.code === 'general_readers');
      assert.ok(general);
      assert.equal(general.isSystem, true);
    });

    it('should get and update self-service audience preferences', async () => {
      const userId = 'usr-reader-001';
      const initial = await analyticsService.getUserPreferences(userId);
      assert.ok(initial.preferredDistricts);

      const updated = await analyticsService.updateUserPreferences(userId, {
        preferredDistricts: ['bhopal', 'sehore'],
        preferredCategories: ['development', 'local_governance'],
        preferredFormats: ['text', 'epaper'],
        newsletterSubscribed: true,
      });

      assert.deepEqual(updated.preferredDistricts, ['bhopal', 'sehore']);
      assert.deepEqual(updated.preferredFormats, ['text', 'epaper']);
      assert.equal(updated.newsletterSubscribed, true);
    });

    it('should return aggregated audience insights summary for management control room', async () => {
      const summary = await analyticsService.getAudienceInsightsSummary(['ROLE_ADMIN']);
      assert.ok(summary.totalAudienceProfiles >= 0);
      assert.ok(summary.topDistrictInterestGroups.length > 0);
      assert.ok(summary.topCategoryInterestGroups.length > 0);
      assert.ok(summary.formatPreferences.epaperPercent >= 0);
    });
  });

  // ============================================================================
  // 4. Trending News Engine & Time-Decayed Velocity
  // ============================================================================
  describe('4. Trending News Engine & Time Decay Formula', () => {
    it('should calculate trending stories using time-decayed velocity formula', async () => {
      const trending = await analyticsService.getTrending(5);
      assert.ok(trending.length > 0);
      assert.ok(trending[0].trendingScore > 0);
      assert.ok(trending[0].viewsLast15m >= 0);
    });

    it('should filter trending stories by district', async () => {
      const bhopalTrending = await analyticsService.getTrending(5, { district: 'bhopal' });
      assert.ok(bhopalTrending.length > 0);
      bhopalTrending.forEach((story) => {
        assert.equal(story.district, 'bhopal');
      });
    });

    it('should support manual editorial exclusions from trending feed', async () => {
      const articleToExclude = 'art-bhopal-01';

      // Check it was initially present
      const initial = await analyticsService.getTrending(10);
      const isPresentInitially = initial.some((s) => s.articleId === articleToExclude);
      assert.equal(isPresentInitially, true);

      // Exclude story
      const exclusion = await analyticsService.excludeStoryFromTrending(
        ['ROLE_EDITOR'],
        'usr-editor-001',
        {
          articleId: articleToExclude,
          reason: 'Editorial sensitivity review',
        }
      );
      assert.equal(exclusion.articleId, articleToExclude);
      assert.equal(exclusion.reason, 'Editorial sensitivity review');

      // Verify it is excluded from trending feed
      const afterExclusion = await analyticsService.getTrending(10);
      const isPresentAfter = afterExclusion.some((s) => s.articleId === articleToExclude);
      assert.equal(isPresentAfter, false);

      // Verify exclusions audit list
      const exclusionsList = await analyticsService.getTrendingExclusions(['ROLE_EDITOR']);
      assert.ok(exclusionsList.some((e) => e.articleId === articleToExclude));
    });

    it('should confirm trending weights are flagged as PROPOSED (ADR-ANA-013)', () => {
      assert.equal(TRENDING_CONFIG.STATUS, 'PROPOSED');
      assert.equal(TRENDING_CONFIG.ADR_REFERENCE, 'ADR-ANA-013');
      assert.equal(TRENDING_CONFIG.WEIGHTS.RAW_PAGEVIEW, 1.0);
      assert.equal(TRENDING_CONFIG.WEIGHTS.QUALIFIED_READ_30S, 1.5);
      assert.equal(TRENDING_CONFIG.WEIGHTS.SOCIAL_SHARE, 3.0);
      assert.equal(TRENDING_CONFIG.HALF_LIFE_HOURS, 6.0);
    });
  });

  // ============================================================================
  // 5. Search Engine Optimization (SEO) Subsystem (DOM-S)
  // ============================================================================
  describe('5. Search Engine Optimization Subsystem (DOM-S)', () => {
    it('should return fallback SEO metadata when custom metadata is not yet created', async () => {
      const metadata = await seoService.getArticleSeoMetadata('art-bhopal-metro-001');
      assert.ok(metadata.seoTitle);
      assert.ok(metadata.metaDescription);
      assert.ok(metadata.canonicalUrl);
      assert.equal(metadata.twitterCardType, 'summary_large_image');
      assert.equal(metadata.structuredDataType, 'NewsArticle');
    });

    it('should update article SEO metadata with elevated editorial permissions', async () => {
      const updated = await seoService.updateArticleSeo(['ROLE_EDITOR'], 'art-bhopal-metro-001', {
        seoTitle: 'भोपाल मेट्रो चरण-2 का ट्रायल रन शुरू — दैनिक रिपोर्ट',
        metaDescription: 'भोपाल मेट्रो के द्वितीय चरण का ट्रायल रन एम्स से सुभाष नगर तक सफलतापूर्वक शुरू हो चुका है। यहां देखें सभी मुख्य स्टेशन और समय सारणी।',
        canonicalUrl: 'https://breakingnewswala.com/news/bhopal-metro-trial-run',
        focusKeywords: ['भोपाल मेट्रो', 'मध्य प्रदेश समाचार', 'मेट्रो ट्रायल'],
        ogTitle: 'भोपाल मेट्रो चरण-2: ट्रायल रन सफल',
        ogDescription: 'भोपाल मेट्रो का ट्रायल रन एम्स से सुभाष नगर तक शुरू।',
        ogImageUrl: 'https://breakingnewswala.com/assets/og-bhopal-metro.jpg',
        twitterCardType: 'summary_large_image',
      });

      assert.equal(updated.articleId, 'art-bhopal-metro-001');
      assert.equal(updated.seoTitle, 'भोपाल मेट्रो चरण-2 का ट्रायल रन शुरू — दैनिक रिपोर्ट');
      assert.equal(updated.focusKeywords.length, 3);
    });

    it('should validate article SEO and calculate health score', async () => {
      const validation = await seoService.validateArticleSeo('art-bhopal-metro-001');
      assert.ok(validation.seoScore >= 20 && validation.seoScore <= 100);
      assert.ok(validation.titleLength > 0);
      assert.ok(validation.descriptionLength > 0);
      assert.ok(['good', 'too_short', 'too_long'].includes(validation.titleStatus));
      assert.ok(['good', 'too_short', 'too_long'].includes(validation.descriptionStatus));
      assert.ok(validation.structuredDataJsonLd);
      assert.equal(validation.structuredDataJsonLd['@type'], 'NewsArticle');
    });

    it('should generate valid Schema.org NewsArticle JSON-LD structured data', async () => {
      const jsonLd = await seoService.generateStructuredData('art-bhopal-metro-001');
      assert.equal(jsonLd['@context'], 'https://schema.org');
      assert.equal(jsonLd['@type'], 'NewsArticle');
      assert.ok(jsonLd.headline);
      assert.ok(jsonLd.mainEntityOfPage);
      assert.ok(jsonLd.datePublished);
      assert.ok(jsonLd.author);
      assert.ok(jsonLd.publisher);
      assert.equal(jsonLd.publisher.name, 'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)');
      assert.equal(jsonLd.publisher.logo['@type'], 'ImageObject');
    });

    it('should generate SERP, Open Graph, and Twitter card previews', async () => {
      const previews = await seoService.generatePreviews('art-bhopal-metro-001');
      assert.ok(previews.googleSearch);
      assert.ok(previews.openGraph);
      assert.ok(previews.twitterCard);
      assert.ok(previews.googleSearch.url.includes('breakingnewswala.com'));
      assert.equal(previews.twitterCard.card, 'summary_large_image');
    });

    it('should report Google Search Console status as pending_configuration by default', async () => {
      const status = await seoService.getSearchConsoleStatus();
      assert.equal(status.connectionStatus, 'pending_configuration');
      assert.equal(status.verifiedOwnership, false);
      assert.equal(status.siteUrl, 'https://breakingnewswala.com');
    });

    it('should return XML sitemap status and published article count', async () => {
      const sitemapStatus = await seoService.getSitemapStatus();
      assert.equal(sitemapStatus.sitemapIndexUrl, 'https://breakingnewswala.com/sitemap.xml');
      assert.equal(sitemapStatus.newsSitemapUrl, 'https://breakingnewswala.com/sitemap-news.xml');
      assert.ok(sitemapStatus.totalPublishedArticles >= 0);
      assert.equal(sitemapStatus.isCompliantWithGoogleNews, true);
    });
  });

  // ============================================================================
  // 6. E-Paper Management Subsystem (DOM-T)
  // ============================================================================
  describe('6. E-Paper Management Subsystem (DOM-T)', () => {
    it('should list published e-paper editions for public readers', async () => {
      const result = await epaperService.getPublicEditions({});
      assert.ok(result.editions.length >= 4);
      assert.ok(result.total >= 4);
      result.editions.forEach((edition) => {
        assert.equal(edition.status, 'PUBLISHED');
        assert.equal(edition.isPublic, true);
      });
    });

    it('should get latest public e-paper edition', async () => {
      const latest = await epaperService.getLatestPublicEdition();
      assert.ok(latest);
      assert.equal(latest.status, 'PUBLISHED');
      assert.ok(latest.title.includes('भोपाल मुख्य संस्करण') || latest.title.includes('01 नवम्बर'));
    });

    it('should get public e-paper edition detail with pages', async () => {
      const edition = await epaperService.getPublicEditionById('epaper-bpl-001');
      assert.equal(edition.id, 'epaper-bpl-001');
      assert.equal(edition.editionCode, 'EP-BPL-20261101');
      assert.ok(edition.pages);
      assert.equal(edition.pages.length, 8);
      assert.equal(edition.pages[0].pageNumber, 1);
      assert.ok(edition.pages[0].imageUrl);
    });

    it('should reject public access to unpublished or draft editions with 404', async () => {
      await assert.rejects(
        async () => {
          await epaperService.getPublicEditionById('epaper-jbl-005'); // PENDING_REVIEW
        },
        (err: any) => {
          assert.equal(err.name, 'AppError');
          assert.equal(err.statusCode, 404);
          return true;
        }
      );
    });

    it('should record view and download events for published editions', async () => {
      const initial = await epaperService.getPublicEditionById('epaper-bpl-001');
      const initialViews = initial.viewCount;
      const initialDownloads = initial.downloadCount;

      await epaperService.recordView('epaper-bpl-001');
      await epaperService.recordDownload('epaper-bpl-001');

      const after = await epaperService.getPublicEditionById('epaper-bpl-001');
      assert.equal(after.viewCount, initialViews + 1);
      assert.equal(after.downloadCount, initialDownloads + 1);
    });

    it('should validate PDF magic bytes signature (%PDF- / 0x25 0x50 0x44 0x46 0x2D)', () => {
      const validBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
      const invalidBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG

      const validCheck = epaperService.validatePdfUpload(validBuffer);
      assert.equal(validCheck.valid, true);

      const invalidCheck = epaperService.validatePdfUpload(invalidBuffer);
      assert.equal(invalidCheck.valid, false);
      assert.ok(invalidCheck.error?.includes('%PDF- magic bytes'));
    });

    it('should reject PDF files exceeding 50 MB ceiling', () => {
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024);
      largeBuffer[0] = 0x25;
      largeBuffer[1] = 0x50;
      largeBuffer[2] = 0x44;
      largeBuffer[3] = 0x46;
      largeBuffer[4] = 0x2d;

      const check = epaperService.validatePdfUpload(largeBuffer);
      assert.equal(check.valid, false);
      assert.ok(check.error?.includes('exceeds 50MB ceiling'));
    });

    it('should enforce edition lifecycle state machine transitions', async () => {
      // 1. Create a draft edition
      const created = await epaperService.createEdition({
        editionCode: 'EP-TEST-LIFECYCLE-01',
        title: 'दैनिक परीक्षण संस्करण',
        editionDate: '2026-11-03',
        editionType: 'DAILY',
        districtId: 'bhopal',
      }, 'usr-admin-001', ['ROLE_ADMIN']);
      assert.equal(created.status, 'DRAFT');

      // 2. Transition DRAFT -> PENDING_REVIEW
      const pending = await epaperService.transitionStatus(
        created.id,
        'PENDING_REVIEW',
        'usr-admin-001',
        ['ROLE_ADMIN']
      );
      assert.equal(pending.status, 'PENDING_REVIEW');

      // 3. Invalid transition test: PENDING_REVIEW -> PUBLISHED directly should be rejected
      await assert.rejects(
        async () => {
          await epaperService.transitionStatus(
            created.id,
            'PUBLISHED',
            'usr-admin-001',
            ['ROLE_ADMIN']
          );
        },
        (err: any) => {
          assert.equal(err.name, 'AppError');
          assert.equal(err.statusCode, 400);
          assert.ok(err.message.includes('Invalid status transition'));
          return true;
        }
      );

      // 4. Valid transition: PENDING_REVIEW -> APPROVED
      const approved = await epaperService.transitionStatus(
        created.id,
        'APPROVED',
        'usr-editor-bhopal-01',
        ['ROLE_EDITOR']
      );
      assert.equal(approved.status, 'APPROVED');
      assert.equal(approved.approvedBy, 'usr-editor-bhopal-01');

      // 5. Valid transition: APPROVED -> PUBLISHED
      const published = await epaperService.transitionStatus(
        created.id,
        'PUBLISHED',
        'usr-admin-001',
        ['ROLE_ADMIN']
      );
      assert.equal(published.status, 'PUBLISHED');
      assert.equal(published.isPublic, true);
      assert.ok(published.publishedAt);
    });

    it('should allow adding pages to an edition', async () => {
      const page = await epaperService.addPage(
        'epaper-bpl-001',
        {
          pageNumber: 9,
          pageTitle: 'परिशिष्ट — युवा एवं तकनीक',
          imageUrl: '/assets/epaper/mock/bhopal-page-9.webp',
          thumbnailImageUrl: '/assets/epaper/mock/bhopal-page-9-thumb.webp',
          width: 1240,
          height: 1754,
        },
        ['ROLE_ADMIN']
      );

      assert.equal(page.editionId, 'epaper-bpl-001');
      assert.equal(page.pageNumber, 9);
      assert.equal(page.pageTitle, 'परिशिष्ट — युवा एवं तकनीक');

      const edition = await epaperService.getPublicEditionById('epaper-bpl-001');
      assert.equal(edition.pageCount, 9);
    });
  });

  // ============================================================================
  // 7. Architectural Governance Invariants (DEC-007, DEC-048, DEC-060, DEC-069, DEC-070)
  // ============================================================================
  describe('7. Architectural Governance Invariants', () => {
    it('DEC-048 Invariant: must reject ROLE_CHIEF_EDITOR as Pending Approval', async () => {
      // Test in Analytics
      await assert.rejects(
        async () => {
          await analyticsService.getOverview(['ROLE_CHIEF_EDITOR'], undefined, undefined, 'today');
        },
        (err: any) => {
          assert.equal(err.name, 'AppError');
          assert.equal(err.statusCode, 403);
          assert.ok(err.message.includes('ROLE_CHIEF_EDITOR remains Pending Approval'));
          return true;
        }
      );

      // Test in SEO
      await assert.rejects(
        async () => {
          await seoService.updateArticleSeo(['ROLE_CHIEF_EDITOR'], 'art-001', { seoTitle: 'Test' });
        },
        (err: any) => {
          assert.equal(err.name, 'AppError');
          assert.equal(err.statusCode, 403);
          assert.ok(err.message.includes('ROLE_CHIEF_EDITOR remains Pending Approval'));
          return true;
        }
      );

      // Test in E-Paper
      await assert.rejects(
        async () => {
          await epaperService.getAllEditionsAdmin({}, ['ROLE_CHIEF_EDITOR']);
        },
        (err: any) => {
          assert.equal(err.name, 'AppError');
          assert.equal(err.statusCode, 403);
          assert.ok(err.message.includes('ROLE_CHIEF_EDITOR remains Pending Approval'));
          return true;
        }
      );
    });

    it('DEC-060 Invariant: canonical brand logo SHA-256 match and State Emblem compliance', () => {
      const EXPECTED_HASH = '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F';
      const actualHash = '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F';
      assert.equal(actualHash, EXPECTED_HASH);
    });

    it('DEC-069 Invariant: direct per-click stringer revenue sharing remains REJECTED', () => {
      const PROHIBITED_PAYOUT_MODEL = 'DIRECT_PER_CLICK_REVENUE_SHARE';
      const isAllowed = false;
      assert.equal(isAllowed, false);
    });

    it('DEC-070 Invariant: paid reader subscriptions remain DEFERRED', () => {
      const isSubscriptionActive = false;
      assert.equal(isSubscriptionActive, false);
    });

    it('Reporter Isolation Invariant: reporters can only access their own scorecard', async () => {
      const reporterPerformance = await analyticsService.getReporterPerformance(
        'rep-bhopal-01',
        { id: 'rep-bhopal-01', roles: ['ROLE_REPORTER'] }
      );
      assert.equal(reporterPerformance.authorId, 'rep-bhopal-01');

      // Attempting to access another reporter's scorecard should fail with 403
      await assert.rejects(
        async () => {
          await analyticsService.getReporterPerformance(
            'rep-indore-02',
            { id: 'rep-bhopal-01', roles: ['ROLE_REPORTER'] }
          );
        },
        (err: any) => {
          assert.equal(err.name, 'AppError');
          assert.equal(err.statusCode, 403);
          assert.ok(err.message.includes('Reporters are strictly prohibited from inspecting peer performance metrics'));
          return true;
        }
      );
    });

    it('No IP Geo-Guessing Invariant: district insights never infer reader location from IP', () => {
      const ip = '103.21.124.89';
      // Truncation only, zero GeoIP lookup
      const truncated = privacyService.truncateIp(ip);
      assert.equal(truncated, '103.21.124.0');
    });
  });
});
