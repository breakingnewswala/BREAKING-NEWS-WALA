/**
 * BREAKING NEWS WALA — Analytics & Telemetry Routes
 * Grounded in docs/13-API.md (ANL-01 to ANL-03, REP-12) and docs/Analytics.md.
 */

import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { analyticsController } from './analytics.controller';
import {
  validateEventIngress,
  validateLegacyPageview,
  validateLegacyVideoHeartbeat,
} from './analytics.validator';

const router = Router();
const adminRouter = Router();
const reporterRouter = Router();
const audienceRouter = Router();

// 1. Primary Telemetry Ingestion (Public / Authenticated)
router.post('/events', validateEventIngress, analyticsController.ingestEvent);
router.post('/event', validateEventIngress, analyticsController.ingestEvent); // Canonical alias

// 2. Legacy Telemetry Ingestion (ANL-01, ANL-02)
router.post('/pageview', validateLegacyPageview, analyticsController.ingestLegacyPageview);
router.post('/video-heartbeat', validateLegacyVideoHeartbeat, analyticsController.ingestLegacyVideoHeartbeat);

// 3. Real-Time Trending Stories (Public Feed / Newsroom)
router.get('/trending', analyticsController.getTrending);

// 4. Article-Specific Telemetry (Authenticated; Author or Elevated Editor)
router.get('/articles/:articleId', requireAuth, analyticsController.getArticleAnalytics);

// 5. Newsroom / Platform Overview & Content Intelligence
router.get('/overview', requireAuth, analyticsController.getOverview);
router.get('/content', requireAuth, analyticsController.getContentPerformance);
router.get('/districts', requireAuth, analyticsController.getDistrictInsights);
router.get('/editorial-performance', requireAuth, analyticsController.getEditorialPerformance);
router.get('/compare', requireAuth, analyticsController.compareContent);

// 6. Admin Dedicated Analytics Endpoints
adminRouter.get('/overview', requireAuth, analyticsController.getOverview);
adminRouter.get('/content', requireAuth, analyticsController.getContentPerformance);
adminRouter.get('/districts', requireAuth, analyticsController.getDistrictInsights);
adminRouter.get('/editorial-performance', requireAuth, analyticsController.getEditorialPerformance);
adminRouter.get('/compare', requireAuth, analyticsController.compareContent);
adminRouter.get('/articles/:articleId', requireAuth, analyticsController.getArticleAnalytics);
adminRouter.post('/trending/exclude', requireAuth, analyticsController.excludeStoryFromTrending);
adminRouter.get('/trending/exclusions', requireAuth, analyticsController.getTrendingExclusions);
adminRouter.get('/audience/segments', requireAuth, analyticsController.getAudienceSegments);
adminRouter.get('/audience/insights', requireAuth, analyticsController.getAudienceInsights);

// 7. Audience Preferences (Self-Service)
audienceRouter.get('/preferences', requireAuth, analyticsController.getUserPreferences);
audienceRouter.put('/preferences', requireAuth, analyticsController.updateUserPreferences);

// 8. Reporter Performance Endpoints (REP-12)
reporterRouter.get('/performance', requireAuth, analyticsController.getReporterPerformance);

export {
  router as analyticsRouter,
  adminRouter as adminAnalyticsRouter,
  reporterRouter as reporterPerformanceRouter,
  audienceRouter,
};
