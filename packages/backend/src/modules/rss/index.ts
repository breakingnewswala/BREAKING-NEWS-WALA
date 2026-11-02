/**
 * @bnw/backend — Module: RSS & Content Ingestion (DOM-F)
 * Grounded in docs/11-Architecture.md, docs/12-Database.md, and docs/13-API.md
 */

import { createRssRouters } from './rss.routes';

const { rssRouter, adminRssRouter, rssService, controller: rssController } = createRssRouters();

export {
  rssRouter,
  adminRssRouter,
  rssService,
  rssController,
  createRssRouters,
};

export * from './types';
export * from './constants';
export * from './rss.service';
export * from './rss.repository';
export * from './security/ssrf.validator';
export * from './security/xml.parser';
