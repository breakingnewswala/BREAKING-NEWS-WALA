/**
 * BREAKING NEWS WALA — News Ingestion, Drafting & Article Lifecycle Module
 * Grounded in docs/05-Workflows.md (WF-CRE-01, WF-CRE-03, WF-EDT-01, WF-EDT-02, WF-EDT-03, WF-TRU-01),
 * docs/06-Business-Rules.md (RULE-NEWS-003, RULE-NEWS-004, RULE-NEWS-005, RULE-EDIT-001 through RULE-EDIT-007),
 * and docs/13-API.md (REP-03 through REP-08)
 */

export * from './types';
export * from './article.workflow';
export * from './article.repository';
export * from './article.validator';
export * from './article.service';
export * from './article.controller';
export * from './article.routes';

export const moduleName = 'articles';

