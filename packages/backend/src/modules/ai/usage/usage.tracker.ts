/**
 * BREAKING NEWS WALA — AI Usage & Cost Accounting Tracker
 * Grounded in docs/19-API-Pool.md and DEC-054
 */

import { AgentId, ProviderId } from '../constants';
import { AgentExecutionResult, AiDashboardStats } from '../types';

export interface UsageRecord {
  executionId: string;
  agentId: AgentId;
  providerId: ProviderId;
  modelIdentifier: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  status: string;
  fallbackOccurred: boolean;
  timestamp: string;
}

export class AiUsageTracker {
  private records: UsageRecord[] = [];
  private maxStoredRecords: number = 500;

  public recordExecution(result: AgentExecutionResult): void {
    const record: UsageRecord = {
      executionId: result.executionId,
      agentId: result.agentId,
      providerId: result.providerId,
      modelIdentifier: result.modelIdentifier,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      durationMs: result.executionDurationMs,
      status: result.status,
      fallbackOccurred: result.fallbackOccurred,
      timestamp: result.createdAt,
    };

    this.records.unshift(record);

    if (this.records.length > this.maxStoredRecords) {
      this.records.pop();
    }
  }

  public getRecentRecords(limit = 20): UsageRecord[] {
    return this.records.slice(0, limit);
  }

  public getDashboardStats(
    totalRegisteredAgents: number,
    activeAgents: number,
    disabledAgents: number,
    totalConfiguredProviders: number,
    healthyProviders: number
  ): AiDashboardStats {
    const totalExecutions = this.records.length;
    const successfulExecutions = this.records.filter((r) => r.status === 'completed').length;
    const failedExecutions = this.records.filter((r) => r.status === 'failed').length;
    const fallbackExecutions = this.records.filter((r) => r.fallbackOccurred).length;

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalDurationMs = 0;

    for (const r of this.records) {
      totalPromptTokens += r.promptTokens;
      totalCompletionTokens += r.completionTokens;
      totalDurationMs += r.durationMs;
    }

    const averageLatencyMs = totalExecutions > 0 ? Math.round(totalDurationMs / totalExecutions) : 0;

    return {
      registeredAgentsCount: totalRegisteredAgents,
      activeAgentsCount: activeAgents,
      disabledAgentsCount: disabledAgents,
      configuredProvidersCount: totalConfiguredProviders,
      healthyProvidersCount: healthyProviders,
      totalExecutionsCount: totalExecutions,
      successfulExecutionsCount: successfulExecutions,
      failedExecutionsCount: failedExecutions,
      fallbackExecutionsCount: fallbackExecutions,
      averageLatencyMs,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      recentExecutions: this.records.slice(0, 10) as unknown as AgentExecutionResult[],
    };
  }
}

export const aiUsageTracker = new AiUsageTracker();

