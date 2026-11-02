/**
 * BREAKING NEWS WALA — AI Agent Orchestration Engine
 * Grounded in docs/17-Agents.md (12-Step Centralized Execution Lifecycle)
 */

import { randomUUID } from 'crypto';
import { AgentRegistry } from './agent.registry';
import { PromptRegistry } from '../prompts/prompt.registry';
import { PromptCompiler } from '../prompts/prompt.compiler';
import { ModelRouter } from '../routing/model.router';
import { FallbackHandler } from '../fallback/fallback.handler';
import { McpToolExecutor } from '../mcp/mcp.executor';
import { AgentExecutionRequest, AgentExecutionResult } from '../types';
import { EXECUTION_STATUSES, AI_CONFIG_DEFAULTS } from '../constants';
import { AppError } from '../../../errors/app-error';

export class AgentOrchestrator {
  constructor(
    private agentRegistry: AgentRegistry,
    private promptRegistry: PromptRegistry,
    private promptCompiler: PromptCompiler,
    private modelRouter: ModelRouter,
    private fallbackHandler: FallbackHandler,
    private mcpExecutor: McpToolExecutor
  ) {}

  public getMcpExecutor(): McpToolExecutor {
    return this.mcpExecutor;
  }

  public async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = randomUUID();

    // 1. Resolve & Validate Agent Status
    const agent = this.agentRegistry.get(request.agentId);
    if (!agent) {
      throw AppError.notFound(`AI Agent "${request.agentId}" is not registered`);
    }

    if (agent.status !== 'active') {
      throw AppError.badRequest(
        `AI Agent "${agent.name}" is currently ${agent.status} and cannot be executed`
      );
    }

    // 2. Validate Caller Role Permissions
    const normalizedRole = request.callerRole.toLowerCase().replace('role_', '');
    const isRolePermitted = agent.allowedRoles.some((r) => r.toLowerCase() === normalizedRole);
    if (!isRolePermitted) {
      throw AppError.forbidden(
        `User role "${request.callerRole}" is not authorized to execute Agent "${agent.name}"`
      );
    }

    // 3. Schema Parameter Validation
    const requiredProps = (agent.inputSchema.required as string[]) || [];
    for (const reqField of requiredProps) {
      if (
        request.input[reqField] === undefined ||
        request.input[reqField] === null ||
        request.input[reqField] === ''
      ) {
        throw AppError.validationFailed(
          `Missing required input field "${reqField}" for agent "${agent.name}"`,
          [{ field: reqField, code: 'ERR_REQUIRED_FIELD', message: `Field ${reqField} is required` }]
        );
      }
    }

    // 4. Input Sanitization & DPDP Act Data Minimization
    const sanitizedInput = this.sanitizeInput(request.input);

    // 5. Resolve Active Prompt Template & Version
    const promptTemplate = this.promptRegistry.getByAgent(agent.id);
    const activeVersion = promptTemplate
      ? this.promptRegistry.getActiveVersion(promptTemplate.id)
      : undefined;

    // 6. Compile 8-Layer Prompt
    const compiledPrompt = this.promptCompiler.compile({
      agentName: agent.name,
      agentHindiName: agent.hindiName,
      agentPersona: agent.purpose,
      taskTemplate: activeVersion?.templateText || 'Execute task with factual accuracy.',
      sourceData:
        typeof sanitizedInput.articleBody === 'string'
          ? sanitizedInput.articleBody
          : typeof sanitizedInput.rawNotes === 'string'
          ? sanitizedInput.rawNotes
          : typeof sanitizedInput.text === 'string'
          ? sanitizedInput.text
          : JSON.stringify(sanitizedInput),
      runtimeVariables: {
        category: (sanitizedInput.category as string) || 'सामान्य',
        district: (sanitizedInput.district as string) || (request.callerDistrictId || 'मध्यप्रदेश'),
      },
      outputSchemaDirectives:
        'Return response strictly in valid JSON format matching the schema without conversational preamble.',
    });

    // 7. Resolve Model Policy & Execution Chain via ModelRouter
    const tier = request.preferredTier || agent.assignedTier;
    const executionChain = this.modelRouter.resolveExecutionChain(tier);

    // 8. Execute via FallbackHandler with Timeout & Circuit Breakers
    const timeoutMs = agent.timeoutMs || AI_CONFIG_DEFAULTS.DEFAULT_TIMEOUT_MS;

    try {
      const fallbackResult = await this.fallbackHandler.executeWithFallback(executionChain, {
        modelIdentifier: executionChain[0]!.model,
        systemPrompt: compiledPrompt.systemPrompt,
        userPrompt: compiledPrompt.userPrompt,
        timeoutMs,
        responseFormat: 'json',
        correlationId: request.correlationId || executionId,
      });

      const modelResponse = fallbackResult.response;

      // 9. Output Schema Validation & Normalization
      let structuredOutput = modelResponse.structuredData;
      if (!structuredOutput) {
        try {
          structuredOutput = JSON.parse(modelResponse.rawText) as Record<string, unknown>;
        } catch {
          structuredOutput = {
            rawText: modelResponse.rawText,
            warning: 'Model output was non-JSON format and preserved as rawText',
          };
        }
      }

      const durationMs = Date.now() - startTime;

      // 10. Construct Normalized Result
      return {
        executionId,
        agentId: agent.id,
        agentVersion: agent.version,
        status: EXECUTION_STATUSES.COMPLETED,
        providerId: modelResponse.providerId,
        modelIdentifier: modelResponse.modelIdentifier,
        output: structuredOutput,
        promptTokens: modelResponse.promptTokens,
        completionTokens: modelResponse.completionTokens,
        totalTokens: modelResponse.totalTokens,
        executionDurationMs: durationMs,
        fallbackOccurred: fallbackResult.fallbackOccurred,
        attemptedProviders: fallbackResult.attemptedProviders,
        isAiAssisted: true,
        createdAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      return {
        executionId,
        agentId: agent.id,
        agentVersion: agent.version,
        status: EXECUTION_STATUSES.FAILED,
        providerId: executionChain[0]?.provider || 'PRV-GEMINI',
        modelIdentifier: executionChain[0]?.model || 'gemini-1.5-flash',
        output: {},
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        executionDurationMs: durationMs,
        fallbackOccurred: false,
        attemptedProviders: [executionChain[0]?.provider || 'PRV-GEMINI'],
        isAiAssisted: true,
        createdAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }

  private sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...input };
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'accessToken', 'refreshToken'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        delete sanitized[key];
      }
    }

    return sanitized;
  }
}
