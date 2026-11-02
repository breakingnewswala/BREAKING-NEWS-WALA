/**
 * BREAKING NEWS WALA — API v1 Root Router
 * Grounded in docs/DECISIONS.md (DEC-026) and docs/13-API.md
 * Aggregates all v1 infrastructure routes and modular domain routers.
 */

import { Router, Request, Response } from 'express';
import { healthRouter } from './health.router';
import { authRouter } from '../../modules/auth';
import { territoryRouter } from '../../modules/territory';
import { categoryRouter, categoryController } from '../../modules/categories';
import { articleRouter } from '../../modules/articles';
import { mediaRouter } from '../../modules/media';
import { notificationRouter, adminNotificationRouter } from '../../modules/notifications';
import { coinRouter, adminCoinRouter } from '../../modules/coins';
import {
  analyticsRouter,
  adminAnalyticsRouter,
  reporterPerformanceRouter,
  audienceRouter,
} from '../../modules/analytics';
import { seoRouter, adminSeoRouter } from '../../modules/seo';
import { epaperRouter, adminEpaperRouter } from '../../modules/epaper';
import { adminRouter } from '../../modules/admin';
import { aiRouter, adminAiRouter } from '../../modules/ai';
import { designRouter, templateRouter, adminDesignRouter } from '../../modules/design';
import { videoRouter, adminVideoRouter } from '../../modules/video';
import { rssRouter, adminRssRouter } from '../../modules/rss';
import { automationRouter, adminAutomationRouter } from '../../modules/automation';
import { socialRouter, adminIntegrationsRouter, adminSocialRouter } from '../../modules/integrations';
import { monetizationRouter, adminMonetizationRouter } from '../../modules/monetization';
import { adminBackupRouter } from '../../modules/backup';
import { adminMonitoringRouter } from '../../modules/monitoring';

const router = Router();

// 1. Infrastructure Health & Readiness Endpoints
router.use('/', healthRouter);

// 2. Authentication & Identity Domain Endpoints
router.use('/auth', authRouter);

// 3. Territory & Geographic Registry Domain Endpoints
router.use('/territory', territoryRouter);
router.use('/public/locations', territoryRouter); // Canonical PUB-08 support

// 4. Category & Content Taxonomy Domain Endpoints
router.use('/categories', categoryRouter);
router.get('/public/categories', categoryController.getPublicCategories); // Canonical PUB-07 primary hierarchy
router.use('/public/categories', categoryRouter); // Canonical PUB-07 nested support (overview, idOrSlug)

// 5. News Ingestion, Drafting & Article Lifecycle Domain Endpoints
router.use('/articles', articleRouter);
router.use('/reporter/news', articleRouter); // Canonical REP-03 to REP-08 compatibility

// 6. Media Asset Ingestion & Cloud Storage Pipeline Endpoints
router.use('/media', mediaRouter);
router.use('/reporter/media', mediaRouter); // Canonical REP media compatibility

// 7. Multi-Channel Notification Dispatcher Endpoints (NOTIF-01 to NOTIF-06, DEC-031)
router.use('/notifications', notificationRouter);
router.use('/admin/notifications', adminNotificationRouter); // Canonical NOTIF-06 path

// 8. Coin Ledger & Rewards Subsystem Endpoints (COIN-01 to COIN-03, DEC-007)
router.use('/coins', coinRouter);
router.use('/admin/coins', adminCoinRouter);

// 9. Analytics Telemetry & Redis Stream Aggregator Endpoints (ANL-01 to ANL-03, REP-12, DEC-021)
router.use('/analytics', analyticsRouter);
router.use('/admin/analytics', adminAnalyticsRouter);
router.use('/reporter', reporterPerformanceRouter);

// 10. Platform Administration & Governance Endpoints (ADM-01 to ADM-06)
router.use('/admin', adminRouter);

// 11. AI Agent Fleet, MCP & API Pool Endpoints (DEC-050 to DEC-055)
router.use('/ai', aiRouter);
router.use('/admin/ai', adminAiRouter);

// 12. Graphics & Design Studio Endpoints (BNW-MASTER-003, DOM-H)
router.use('/design', designRouter);
router.use('/templates', templateRouter);
router.use('/admin/design', adminDesignRouter);

// 13. Video Production Studio & FFmpeg Pipeline Endpoints (BNW-MASTER-004, DOM-I)
router.use('/video', videoRouter);
router.use('/admin/video', adminVideoRouter);

// 14. RSS Source Management & Ingestion Pipeline Endpoints (BNW-MASTER-005, DOM-F)
router.use('/rss', rssRouter);
router.use('/admin/rss', adminRssRouter);

// 15. Newsroom Automation Engine Endpoints (BNW-MASTER-005, DOM-K)
router.use('/automation', automationRouter);
router.use('/admin/automation', adminAutomationRouter);

// 16. Central Integrations, API Pool & Social Publishing Endpoints (BNW-MASTER-006, DOM-Q)
router.use('/social', socialRouter);
router.use('/admin/integrations', adminIntegrationsRouter);
router.use('/admin/social', adminSocialRouter);

// 17. Business & Monetization Endpoints (BNW-MASTER-007, DOM-R)
router.use('/monetization', monetizationRouter);
router.use('/admin/monetization', adminMonetizationRouter);

// 18. Audience Intelligence & User Preferences (BNW-MASTER-008, DOM-O)
router.use('/audience', audienceRouter);

// 19. Search Engine Optimization (SEO) & Metadata (BNW-MASTER-008, DOM-S)
router.use('/seo', seoRouter);
router.use('/admin/seo', adminSeoRouter);

// 20. E-Paper Management & Digital Editions (BNW-MASTER-008, DOM-T)
router.use('/epaper', epaperRouter);
router.use('/admin/epaper', adminEpaperRouter);

// 21. Enterprise Backup & Disaster Recovery (BNW-MASTER-009)
router.use('/admin/backup', adminBackupRouter);

// 22. System Monitoring, Telemetry Metrics & Alert Management (BNW-MASTER-009)
router.use('/admin/monitoring', adminMonitoringRouter);

// 14. API v1 Service Manifest
router.get('/', (_req: Request, res: Response) => {
  return res.apiSuccess({
    title: 'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) — Shared Backend API Engine',
    version: 'v1',
    status: 'ACTIVE',
    documentation: 'docs/13-API.md',
    governance: 'Single Shared Monolith Backend (DEC-011)',
    availableEndpoints: [
      'GET /api/v1/health',
      'GET /api/v1/ready',
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/refresh',
      'POST /api/v1/auth/logout',
      'POST /api/v1/auth/logout-all',
      'GET /api/v1/auth/me',
      'GET /api/v1/auth/sessions',
      'DELETE /api/v1/auth/sessions/:id',
      'GET /api/v1/territory/overview',
      'GET /api/v1/territory/states',
      'GET /api/v1/territory/states/:idOrSlug',
      'GET /api/v1/territory/divisions',
      'GET /api/v1/territory/divisions/:idOrSlug',
      'GET /api/v1/territory/districts',
      'GET /api/v1/territory/districts/:idOrSlug',
      'GET /api/v1/territory/my-assignments',
      'GET /api/v1/public/locations/overview',
      'GET /api/v1/categories/overview',
      'GET /api/v1/categories',
      'GET /api/v1/categories/:idOrSlug',
      'GET /api/v1/categories/:idOrSlug/subcategories',
      'POST /api/v1/categories/validate-taxonomy',
      'GET /api/v1/public/categories',
      'POST /api/v1/articles/drafts',
      'PATCH /api/v1/articles/drafts/:id',
      'GET /api/v1/articles/drafts/:id',
      'GET /api/v1/articles/my-articles',
      'POST /api/v1/articles/:id/submit',
      'POST /api/v1/articles/:id/direct-publish',
      'POST /api/v1/articles/:id/review',
      'GET /api/v1/articles/:id/reviews',
      'GET /api/v1/articles/:id/revisions',
      'POST /api/v1/articles/ingest',
      'GET /api/v1/articles/:id',
      'GET /api/v1/articles',
      'POST /api/v1/reporter/news/drafts',
      'POST /api/v1/reporter/news/:id/submit',
      'POST /api/v1/reporter/news/:id/direct-publish',
      'GET /api/v1/reporter/news',
      'GET /api/v1/reporter/news/:id/feedback',
      'POST /api/v1/media/presigned-upload',
      'POST /api/v1/media/confirm-upload',
      'POST /api/v1/media/upload',
      'POST /api/v1/media/attach-article',
      'POST /api/v1/media/detach-article',
      'GET /api/v1/media/:id',
      'GET /api/v1/media',
      'DELETE /api/v1/media/:id',
      'GET /api/v1/notifications',
      'GET /api/v1/notifications/unread-count',
      'PATCH /api/v1/notifications/:id/read',
      'POST /api/v1/notifications/mark-all-read',
      'GET /api/v1/notifications/preferences',
      'PUT /api/v1/notifications/preferences',
      'POST /api/v1/notifications/register-device',
      'DELETE /api/v1/notifications/devices/:token',
      'GET /api/v1/notifications/devices',
      'POST /api/v1/admin/notifications/broadcast',
      'GET /api/v1/coins/wallet',
      'GET /api/v1/coins/transactions',
      'GET /api/v1/coins/transactions/:id',
      'GET /api/v1/coins/rewards',
      'GET /api/v1/coins/referral',
      'POST /api/v1/coins/referral/apply',
      'POST /api/v1/coins/credit',
      'POST /api/v1/coins/debit',
      'POST /api/v1/admin/coins/adjust',
      'POST /api/v1/admin/coins/compensate/:id',
      'GET /api/v1/admin/coins/users/:userId/wallet',
      'POST /api/v1/analytics/events',
      'POST /api/v1/analytics/event',
      'POST /api/v1/analytics/pageview',
      'POST /api/v1/analytics/video-heartbeat',
      'GET /api/v1/analytics/trending',
      'GET /api/v1/analytics/articles/:articleId',
      'GET /api/v1/analytics/overview',
      'GET /api/v1/admin/analytics/overview',
      'GET /api/v1/reporter/performance',
      'POST /api/v1/ai/assist/headlines',
      'POST /api/v1/ai/assist/structure',
      'POST /api/v1/ai/assist/fact-check',
      'POST /api/v1/ai/assist/summarize',
      'POST /api/v1/ai/assist/categorize',
      'POST /api/v1/ai/agents/:id/execute',
      'GET /api/v1/admin/ai/dashboard',
      'GET /api/v1/admin/ai/agents',
      'GET /api/v1/admin/ai/providers',
      'GET /api/v1/admin/ai/providers/health',
      'GET /api/v1/admin/ai/keys',
      'GET /api/v1/admin/ai/mcp-tools',
      'GET /api/v1/admin/ai/prompts',
      'GET /api/v1/admin/ai/usage',
      'POST /api/v1/video/projects',
      'GET /api/v1/video/projects',
      'GET /api/v1/video/templates',
      'POST /api/v1/video/render',
      'GET /api/v1/video/render/jobs',
      'POST /api/v1/video/ai/script',
      'GET /api/v1/video/health',
      'GET /api/v1/admin/video/health',
      'GET /api/v1/admin/video/queue/status',
      'GET /api/v1/rss/sources',
      'GET /api/v1/rss/sources/:id',
      'POST /api/v1/rss/validate',
      'GET /api/v1/rss/items',
      'GET /api/v1/rss/clusters',
      'GET /api/v1/rss/health',
      'GET /api/v1/admin/rss/sources',
      'POST /api/v1/admin/rss/sources',
      'POST /api/v1/admin/rss/sources/:id/approve',
      'POST /api/v1/admin/rss/sources/:id/pause',
      'POST /api/v1/admin/rss/sources/:id/disable',
      'POST /api/v1/admin/rss/sources/:id/archive',
      'POST /api/v1/admin/rss/sources/:id/sync',
      'GET /api/v1/automation/rules',
      'POST /api/v1/automation/rules',
      'GET /api/v1/automation/executions',
      'POST /api/v1/automation/trigger',
      'GET /api/v1/audience/preferences',
      'PUT /api/v1/audience/preferences',
      'GET /api/v1/admin/analytics/audience/segments',
      'GET /api/v1/admin/analytics/audience/insights',
      'GET /api/v1/admin/analytics/content',
      'GET /api/v1/admin/analytics/districts',
      'GET /api/v1/admin/analytics/editorial-performance',
      'GET /api/v1/admin/analytics/compare',
      'POST /api/v1/admin/analytics/trending/exclude',
      'GET /api/v1/admin/analytics/trending/exclusions',
      'GET /api/v1/seo/articles/:articleId',
      'GET /api/v1/seo/articles/:articleId/structured-data',
      'GET /api/v1/seo/articles/:articleId/previews',
      'GET /api/v1/seo/sitemap-status',
      'GET /api/v1/admin/seo/articles/:articleId',
      'PUT /api/v1/admin/seo/articles/:articleId',
      'GET /api/v1/admin/seo/articles/:articleId/validate',
      'GET /api/v1/admin/seo/search-console',
      'PUT /api/v1/admin/seo/search-console',
      'GET /api/v1/epaper/editions',
      'GET /api/v1/epaper/latest',
      'GET /api/v1/epaper/editions/:id',
      'POST /api/v1/epaper/editions/:id/view',
      'POST /api/v1/epaper/editions/:id/download',
      'GET /api/v1/admin/epaper/editions',
      'GET /api/v1/admin/epaper/editions/:id',
      'POST /api/v1/admin/epaper/editions',
      'PUT /api/v1/admin/epaper/editions/:id',
      'POST /api/v1/admin/epaper/editions/:id/transition',
      'POST /api/v1/admin/epaper/editions/:id/pages',
      'DELETE /api/v1/admin/epaper/editions/:id',
    ],
  });
});

export { router as v1Router };

