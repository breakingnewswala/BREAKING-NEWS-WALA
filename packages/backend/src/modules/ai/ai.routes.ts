/**
 * BREAKING NEWS WALA — AI Subsystem Routes
 * Grounded in docs/13-API.md, docs/17-Agents.md, docs/19-API-Pool.md
 */

import { Router } from 'express';
import { aiController } from './ai.controller';
import { requireAuth } from '../auth/auth.middleware';

// 1. Editorial Assistance Router (Mounted at /api/v1/ai)
const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.post('/assist/headlines', aiController.suggestHeadlines);
aiRouter.post('/assist/structure', aiController.structureArticle);
aiRouter.post('/assist/fact-check', aiController.assistFactCheck);
aiRouter.post('/assist/summarize', aiController.summarizeOrTranslate);
aiRouter.post('/assist/categorize', aiController.suggestCategorization);
aiRouter.post('/assist/research', aiController.researchNews);
aiRouter.post('/assist/compare-sources', aiController.compareSources);
aiRouter.post('/assist/grammar', aiController.reviewGrammar);
aiRouter.post('/assist/translate', aiController.translateJournalistic);
aiRouter.post('/agents/:id/execute', aiController.executeAgent);

// 2. Admin AI Management Router (Mounted at /api/v1/admin/ai)
const adminAiRouter = Router();

adminAiRouter.use(requireAuth);

adminAiRouter.get('/dashboard', aiController.getDashboardStats);
adminAiRouter.get('/agents', aiController.getAgents);
adminAiRouter.get('/agents/:id', aiController.getAgent);
adminAiRouter.patch('/agents/:id/status', aiController.updateAgentStatus);

adminAiRouter.get('/providers', aiController.getProviders);
adminAiRouter.get('/providers/health', aiController.getProviderHealth);
adminAiRouter.get('/keys', aiController.getKeyReferences);

adminAiRouter.get('/mcp-tools', aiController.getMcpTools);
adminAiRouter.patch('/mcp-tools/:id/status', aiController.updateMcpToolStatus);
adminAiRouter.post('/mcp-tools/:id/execute', aiController.executeMcpTool);

adminAiRouter.get('/prompts', aiController.getPrompts);
adminAiRouter.get('/prompts/:id', aiController.getPrompt);
adminAiRouter.post('/prompts/:id/rollback', aiController.rollbackPrompt);

adminAiRouter.get('/usage', aiController.getUsageHistory);

export { aiRouter, adminAiRouter };

