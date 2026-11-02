/**
 * BREAKING NEWS WALA — Media Routes
 * Grounded in docs/13-API.md (Section 14: Media Upload and Download APIs, MED-01 through MED-04)
 */

import { Router } from 'express';
import { requireAuth, optionalAuth } from '../auth/auth.middleware';
import { mediaController } from './media.controller';
import {
  validateArticleAttachment,
  validateConfirmUpload,
  validateDirectUpload,
  validateMediaIdParam,
  validatePresignedUpload,
} from './media.validator';

const router = Router();

// 1. Transactional Upload Ingress (MED-01, MED-02, DEC-020)
router.post('/presigned-upload', requireAuth, validatePresignedUpload, mediaController.createPresignedUpload);
router.post('/confirm-upload', requireAuth, validateConfirmUpload, mediaController.confirmUpload);
router.post('/upload', requireAuth, validateDirectUpload, mediaController.uploadDirect);

// 2. Article & Media Attachment Management
router.post('/attach-article', requireAuth, validateArticleAttachment, mediaController.attachToArticle);
router.post('/detach-article', requireAuth, mediaController.detachFromArticle);

// 3. Media Metadata Retrieval & Management (MED-03, MED-04)
router.get('/:id', optionalAuth, validateMediaIdParam, mediaController.getMedia);
router.get('/', optionalAuth, mediaController.listMedia);
router.delete('/:id', requireAuth, validateMediaIdParam, mediaController.deleteMedia);

export { router as mediaRouter };

