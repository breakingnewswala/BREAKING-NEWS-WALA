/**
 * BREAKING NEWS WALA — Automation Engine Express Routes
 * Grounded in docs/13-API.md and docs/DECISIONS.md (DEC-026, DEC-048)
 */

import { Router } from 'express';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';

export function createAutomationRouters(service?: AutomationService) {
  const automationService = service || new AutomationService();
  const controller = new AutomationController(automationService);

  const automationRouter = Router();
  automationRouter.get('/rules', controller.listRules);
  automationRouter.get('/rules/:id', controller.getRuleById);
  automationRouter.post('/rules', controller.createRule);
  automationRouter.put('/rules/:id', controller.updateRule);
  automationRouter.post('/rules/:id/toggle', controller.toggleRule);
  automationRouter.delete('/rules/:id', controller.deleteRule);
  automationRouter.get('/executions', controller.listExecutionLogs);
  automationRouter.post('/trigger', controller.triggerManual);

  const adminAutomationRouter = Router();
  adminAutomationRouter.get('/rules', controller.listRules);
  adminAutomationRouter.get('/rules/:id', controller.getRuleById);
  adminAutomationRouter.post('/rules', controller.createRule);
  adminAutomationRouter.put('/rules/:id', controller.updateRule);
  adminAutomationRouter.post('/rules/:id/toggle', controller.toggleRule);
  adminAutomationRouter.delete('/rules/:id', controller.deleteRule);
  adminAutomationRouter.get('/executions', controller.listExecutionLogs);
  adminAutomationRouter.post('/trigger', controller.triggerManual);

  return { automationRouter, adminAutomationRouter, automationService, controller };
}

