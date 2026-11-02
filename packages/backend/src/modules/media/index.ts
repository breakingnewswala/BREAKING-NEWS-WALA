/**
 * BREAKING NEWS WALA — Media Asset Ingestion & Cloud Storage Module
 * Grounded in docs/16-Storage.md, docs/DECISIONS.md (DEC-020),
 * docs/06-Business-Rules.md (RULE-NEWS-006, RULE-SEC-004),
 * and docs/13-API.md (MED-01 through MED-04)
 */

export * from './media.constants';
export * from './types';
export * from './media.storage';
export * from './media.repository';
export * from './media.validator';
export * from './media.service';
export * from './media.controller';
export * from './media.routes';

export const moduleName = 'media';
