/**
 * BREAKING NEWS WALA — AI Controller
 * Grounded in docs/13-API.md, docs/17-Agents.md, docs/19-API-Pool.md
 */

import { Request, Response, NextFunction } from 'express';
import { aiService, CallerContext } from './ai.service';
import { AgentId, McpToolId } from './constants';
import { aiUsageTracker } from './usage/usage.tracker';

export class AiController {
  private extractCaller(req: Request): CallerContext {
    return {
      id: req.user?.id || 'usr_anonymous_demo',
      role: req.user?.roles?.[0] || 'editor',
      districtId: req.user?.homeStateId || undefined,
    };
  }

  // ============================================================================
  // 1. Editorial Assistance Endpoints
  // ============================================================================

  public suggestHeadlines = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.suggestHeadlines(req.body, caller);
      res.apiSuccess(result, { message: 'Headline suggestions generated successfully' });
    } catch (err) {
      next(err);
    }
  };

  public structureArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.structureArticle(req.body, caller);
      res.apiSuccess(result, { message: 'Article structured draft generated successfully' });
    } catch (err) {
      next(err);
    }
  };

  public assistFactCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.assistFactCheck(req.body, caller);
      res.apiSuccess(result, { message: 'Fact-check advisory completed successfully' });
    } catch (err) {
      next(err);
    }
  };

  public summarizeOrTranslate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.summarizeOrTranslate(req.body, caller);
      res.apiSuccess(result, { message: 'Translation/summarization completed successfully' });
    } catch (err) {
      next(err);
    }
  };

  public suggestCategorization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.suggestCategorization(req.body, caller);
      res.apiSuccess(result, { message: 'Taxonomy classification completed successfully' });
    } catch (err) {
      next(err);
    }
  };

  public researchNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.researchNews(req.body, caller);
      res.apiSuccess(result, { message: 'Newsroom research dossier generated successfully' });
    } catch (err) {
      next(err);
    }
  };

  public compareSources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.compareSources(req.body, caller);
      res.apiSuccess(result, { message: 'Multi-source comparison completed successfully' });
    } catch (err) {
      next(err);
    }
  };

  public reviewGrammar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.reviewGrammar(req.body, caller);
      res.apiSuccess(result, { message: 'Hindi grammar and journalistic tone review completed' });
    } catch (err) {
      next(err);
    }
  };

  public translateJournalistic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const result = await aiService.translateJournalistic(req.body, caller);
      res.apiSuccess(result, { message: 'Journalistic translation completed successfully' });
    } catch (err) {
      next(err);
    }
  };

  public executeAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const agentId = req.params.id as AgentId;
      const result = await aiService.executeAgent(
        {
          agentId,
          callerId: caller.id,
          callerRole: caller.role,
          callerDistrictId: caller.districtId,
          input: req.body,
        },
        caller
      );
      res.apiSuccess(result, { message: 'Agent executed successfully' });
    } catch (err) {
      next(err);
    }
  };

  // ============================================================================
  // 2. Admin AI Management Endpoints
  // ============================================================================

  public getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const stats = await aiService.getDashboardStats(caller);
      res.apiSuccess(stats);
    } catch (err) {
      next(err);
    }
  };

  public getAgents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const agents = aiService.getAgents(caller);
      res.apiSuccess({ agents, count: agents.length });
    } catch (err) {
      next(err);
    }
  };

  public getAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const agent = aiService.getAgent(req.params.id as AgentId, caller);
      res.apiSuccess({ agent });
    } catch (err) {
      next(err);
    }
  };

  public updateAgentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const { status } = req.body;
      const agent = aiService.updateAgentStatus(req.params.id as AgentId, status, caller);
      res.apiSuccess({ agent }, { message: `Agent status updated to ${status}` });
    } catch (err) {
      next(err);
    }
  };

  public getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const providers = aiService.getProviders(caller);
      res.apiSuccess({ providers, count: providers.length });
    } catch (err) {
      next(err);
    }
  };

  public getProviderHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const health = await aiService.getProviderHealth(caller);
      res.apiSuccess({ health });
    } catch (err) {
      next(err);
    }
  };

  public getKeyReferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const keys = aiService.getKeyReferences(caller);
      res.apiSuccess({ keys });
    } catch (err) {
      next(err);
    }
  };

  public getMcpTools = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const tools = aiService.getMcpTools(caller);
      res.apiSuccess({ tools, count: tools.length });
    } catch (err) {
      next(err);
    }
  };

  public updateMcpToolStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const { status } = req.body;
      const tool = aiService.updateMcpToolStatus(req.params.id as McpToolId, status, caller);
      res.apiSuccess({ tool }, { message: `Tool status updated to ${status}` });
    } catch (err) {
      next(err);
    }
  };

  public executeMcpTool = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const toolId = req.params.id as McpToolId;
      const result = await aiService.executeMcpTool(
        {
          toolId,
          agentId: (req.body.agentId as AgentId) || 'AGT-WRT-001',
          callerId: caller.id,
          callerRole: caller.role,
          parameters: req.body.parameters || {},
          executionId: 'exec_manual_test',
        },
        caller
      );
      res.apiSuccess({ result });
    } catch (err) {
      next(err);
    }
  };

  public getPrompts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const prompts = aiService.getPrompts(caller);
      res.apiSuccess({ prompts, count: prompts.length });
    } catch (err) {
      next(err);
    }
  };

  public getPrompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const prompt = aiService.getPrompt(req.params.id as string, caller);
      res.apiSuccess({ prompt });
    } catch (err) {
      next(err);
    }
  };

  public rollbackPrompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = this.extractCaller(req);
      const { version } = req.body;
      const prompt = aiService.rollbackPrompt(req.params.id as string, version, caller);
      res.apiSuccess({ prompt }, { message: `Prompt rolled back to version ${version}` });
    } catch (err) {
      next(err);
    }
  };

  public getUsageHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Number(req.query.limit) || 20;
      const records = aiUsageTracker.getRecentRecords(limit);
      res.apiSuccess({ records, count: records.length });
    } catch (err) {
      next(err);
    }
  };
}

export const aiController = new AiController();
