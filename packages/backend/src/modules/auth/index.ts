/**
 * BREAKING NEWS WALA — Authentication & Identity Module
 * Grounded in docs/11-Architecture.md, docs/12-Database.md, docs/13-API.md, docs/14-Auth.md
 * Single Centralized Authentication Engine for Web, Reporter PWA, Newsroom, Admin, and Android.
 */

export * from './types';
export * from './password.service';
export * from './token.service';
export * from './auth.repository';
export * from './auth.service';
export * from './auth.middleware';
export * from './auth.controller';
export * from './auth.routes';

export const moduleName = 'auth';
