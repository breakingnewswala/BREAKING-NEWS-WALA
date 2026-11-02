/**
 * BREAKING NEWS WALA — RSS Module Express Routes
 * Grounded in docs/13-API.md and docs/DECISIONS.md (DEC-026, DEC-048)
 */

import { Router } from 'express';
import { RssService } from './rss.service';
import { RssController } from './rss.controller';

export function createRssRouters(service?: RssService) {
  const rssService = service || new RssService();
  const controller = new RssController(rssService);

  // 1. Newsroom Public/Editorial Router (/api/v1/rss/*)
  const rssRouter = Router();
  rssRouter.get('/sources', controller.listSources);
  rssRouter.get('/sources/:id', controller.getSourceById);
  rssRouter.post('/validate', controller.validateFeed);
  rssRouter.get('/items', controller.listImportedItems);
  rssRouter.get('/items/:id', controller.getImportedItemById);
  rssRouter.get('/clusters', controller.listStoryClusters);
  rssRouter.get('/health', controller.getHealthSummary);

  // 2. Admin Management Router (/api/v1/admin/rss/*)
  const adminRssRouter = Router();
  adminRssRouter.get('/sources', controller.listSources);
  adminRssRouter.post('/sources', controller.createSource);
  adminRssRouter.get('/sources/:id', controller.getSourceById);
  adminRssRouter.put('/sources/:id', controller.updateSource);
  adminRssRouter.post('/sources/:id/approve', controller.approveSource);
  adminRssRouter.post('/sources/:id/pause', controller.pauseSource);
  adminRssRouter.post('/sources/:id/disable', controller.disableSource);
  adminRssRouter.post('/sources/:id/archive', controller.archiveSource);
  adminRssRouter.post('/sources/:id/re-enable', controller.reEnableSource);
  adminRssRouter.delete('/sources/:id', controller.deleteSource);
  adminRssRouter.post('/sources/:id/sync', controller.syncSource);
  adminRssRouter.post('/validate', controller.validateFeed);
  adminRssRouter.get('/items', controller.listImportedItems);
  adminRssRouter.get('/clusters', controller.listStoryClusters);
  adminRssRouter.get('/health', controller.getHealthSummary);

  return { rssRouter, adminRssRouter, rssService, controller };
}

