/**
 * BREAKING NEWS WALA — Article Routes
 * Grounded in docs/13-API.md (REP-03 through REP-08) and docs/05-Workflows.md
 * Mounts article drafting, updating, review submission, direct publishing, and version history.
 */

import { Router } from 'express';
import { requireAuth, optionalAuth } from '../auth/auth.middleware';
import { articleController } from './article.controller';
import {
  validateArticleId,
  validateCreateArticle,
  validateIngestArticle,
  validateReviewAction,
  validateUpdateArticle,
} from './article.validator';

const router = Router();

// 1. Author Draft Operations
router.post('/drafts', requireAuth, validateCreateArticle, articleController.createDraft);
router.patch('/drafts/:id', requireAuth, validateArticleId, validateUpdateArticle, articleController.updateDraft);
router.get('/drafts/:id', requireAuth, validateArticleId, articleController.getDraft);

// 2. Author News Portfolio
router.get('/my-articles', requireAuth, articleController.listMyArticles);

// 3. Workflow State Transition Ingress
router.post('/:id/submit', requireAuth, validateArticleId, articleController.submitDraft);
router.post('/:id/direct-publish', requireAuth, validateArticleId, articleController.directPublish);

// 4. Central Newsroom Editorial Review Operations
router.get('/editorial/stats', requireAuth, articleController.getEditorialStats);
router.get('/editorial/activity', requireAuth, articleController.getRecentActivity);
router.post('/:id/review', requireAuth, validateArticleId, validateReviewAction, articleController.reviewArticle);

// 5. Auditability & History Inquiries
router.get('/:id/reviews', requireAuth, validateArticleId, articleController.getReviews);
router.get('/:id/feedback', requireAuth, validateArticleId, articleController.getReviews); // REP-08 compatibility alias
router.get('/:id/revisions', requireAuth, validateArticleId, articleController.getRevisions);

// 6. Controlled External Ingestion
router.post('/ingest', requireAuth, validateIngestArticle, articleController.ingestArticle);

// 7. General Article Lookup & Feed
router.get('/:id', optionalAuth, validateArticleId, articleController.getArticle);
router.get('/', optionalAuth, articleController.listArticles);

export { router as articleRouter };

