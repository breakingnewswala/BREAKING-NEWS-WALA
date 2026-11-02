/**
 * BREAKING NEWS WALA — SEO Routes
 */

import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { seoController } from './seo.controller';
import { validateSeoUpdate } from './seo.validator';

const publicRouter = Router();
const adminRouter = Router();

// Public / Read routes
publicRouter.get('/articles/:articleId', seoController.getArticleSeo);
publicRouter.get('/articles/:articleId/structured-data', seoController.getStructuredData);
publicRouter.get('/articles/:articleId/previews', seoController.getPreviews);
publicRouter.get('/sitemap-status', seoController.getSitemapStatus);

// Admin routes
adminRouter.get('/articles/:articleId', requireAuth, seoController.getArticleSeo);
adminRouter.put('/articles/:articleId', requireAuth, validateSeoUpdate, seoController.updateArticleSeo);
adminRouter.get('/articles/:articleId/validate', requireAuth, seoController.validateArticleSeo);
adminRouter.get('/articles/:articleId/previews', requireAuth, seoController.getPreviews);
adminRouter.get('/sitemap-status', requireAuth, seoController.getSitemapStatus);
adminRouter.get('/search-console', requireAuth, seoController.getSearchConsoleStatus);
adminRouter.put('/search-console', requireAuth, seoController.updateSearchConsoleStatus);

export { publicRouter as seoRouter, adminRouter as adminSeoRouter };
