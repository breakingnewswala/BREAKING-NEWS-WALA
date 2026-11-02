/**
 * BREAKING NEWS WALA — AI Repository & Persistence Layer
 * Grounded in docs/12-Database.md (DOM-G) and docs/19-API-Pool.md
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AgentExecutionResult } from './types';

export interface IAiRepository {
  recordProcessingRequest(result: AgentExecutionResult, callerId?: string): Promise<void>;
  getProcessingHistory(limit?: number): Promise<AgentExecutionResult[]>;
  updateProviderStatus(id: string, isActive: boolean): Promise<void>;
}

export class PrismaAiRepository implements IAiRepository {
  constructor(private prisma: PrismaClient) {}

  public async recordProcessingRequest(result: AgentExecutionResult, _callerId?: string): Promise<void> {
    try {
      await this.prisma.aiProcessingRequest.create({
        data: {
          id: result.executionId || randomUUID(),
          taskType: result.agentId,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          executionDurationMs: result.executionDurationMs,
          status: result.status,
          createdAt: new Date(),
        },
      });
    } catch (err: unknown) {
      // Graceful fallback if database connection is offline or table is unavailable during tests
      console.warn('PrismaAiRepository: failed to persist processing request to Postgres:', err);
    }
  }

  public async getProcessingHistory(limit = 20): Promise<AgentExecutionResult[]> {
    try {
      const records = await this.prisma.aiProcessingRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return records.map((r) => ({
        executionId: r.id,
        agentId: r.taskType as any,
        agentVersion: '1.0.0',
        status: r.status as any,
        providerId: 'PRV-GEMINI' as any,
        modelIdentifier: 'gemini-1.5-flash',
        output: {},
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        totalTokens: r.promptTokens + r.completionTokens,
        executionDurationMs: r.executionDurationMs,
        fallbackOccurred: false,
        attemptedProviders: ['PRV-GEMINI' as any],
        isAiAssisted: true,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  public async updateProviderStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.prisma.aiProvider.update({
        where: { id },
        data: { isActive },
      });
    } catch (err) {
      console.warn('PrismaAiRepository: failed to update provider status:', err);
    }
  }
}

export class InMemoryAiRepository implements IAiRepository {
  private processingRecords: AgentExecutionResult[] = [];

  public async recordProcessingRequest(result: AgentExecutionResult): Promise<void> {
    this.processingRecords.unshift({ ...result });
    if (this.processingRecords.length > 500) {
      this.processingRecords.pop();
    }
  }

  public async getProcessingHistory(limit = 20): Promise<AgentExecutionResult[]> {
    return this.processingRecords.slice(0, limit);
  }

  public async updateProviderStatus(_id: string, _isActive: boolean): Promise<void> {
    // In-memory acknowledged
  }
}

