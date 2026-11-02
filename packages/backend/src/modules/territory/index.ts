/**
 * BREAKING NEWS WALA — Territory Management & Master Geographic Registry Module
 * Grounded in docs/06-Business-Rules.md (RULE-LOC-001, RULE-LOC-002), docs/11-Architecture.md, docs/12-Database.md
 * Single Centralized Geographic Registry for Web, Reporter PWA, Newsroom, Admin, and Android.
 */

export * from './types';
export * from './territory.repository';
export * from './territory.validator';
export * from './territory.service';
export * from './territory.controller';
export * from './territory.routes';

export const moduleName = 'territory';
