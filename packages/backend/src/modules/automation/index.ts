/**
 * @bnw/backend — Module: Automation Engine (DOM-K)
 * Grounded in docs/11-Architecture.md, docs/05-Workflows.md, and docs/13-API.md
 */

import { createAutomationRouters } from './automation.routes';

const {
  automationRouter,
  adminAutomationRouter,
  automationService,
  controller: automationController,
} = createAutomationRouters();

export {
  automationRouter,
  adminAutomationRouter,
  automationService,
  automationController,
  createAutomationRouters,
};

export * from './types';
export * from './constants';
export * from './automation.service';
export * from './automation.repository';

