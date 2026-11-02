/**
 * BREAKING NEWS WALA — Master News Category Registry & Taxonomies Module
 * Grounded in docs/06-Business-Rules.md (RULE-CAT-001 through RULE-CAT-006),
 * docs/12-Database.md (DOM-B), and docs/13-API.md (PUB-07, ADM-11, ADM-12)
 *
 * Single centralized taxonomy registry for Web, Reporter PWA, Newsroom Desk, Admin, and Android.
 */

export * from './types';
export * from './category-data';
export * from './category.repository';
export * from './category.validator';
export * from './category.service';
export * from './category.controller';
export * from './category.routes';

export const moduleName = 'categories';

