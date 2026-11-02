/**
 * BREAKING NEWS WALA — AI Provider Adapter Interface
 * Grounded in docs/19-API-Pool.md and DEC-050
 */

import { ProviderId, ModelIdentifier } from '../constants';

export interface ModelRequest {
  modelIdentifier: ModelIdentifier;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  responseFormat?: 'json' | 'text';
  correlationId?: string;
}

export interface ModelResponse {
  providerId: ProviderId;
  modelIdentifier: ModelIdentifier;
  rawText: string;
  structuredData?: Record<string, unknown>;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  isFallback: boolean;
}

export class ProviderError extends Error {
  public readonly providerId: ProviderId;
  public readonly isRetryable: boolean;
  public readonly statusCode?: number;
  public readonly errorCode: string;

  constructor(
    message: string,
    providerId: ProviderId,
    errorCode: string,
    isRetryable = false,
    statusCode?: number
  ) {
    super(message);
    this.name = 'ProviderError';
    this.providerId = providerId;
    this.errorCode = errorCode;
    this.isRetryable = isRetryable;
    this.statusCode = statusCode;
  }
}

export interface IProviderAdapter {
  readonly providerId: ProviderId;
  readonly providerName: string;
  readonly supportedModels: ModelIdentifier[];

  isConfigured(): boolean;
  getHealth(): Promise<'healthy' | 'degraded' | 'unhealthy' | 'standby'>;
  execute(request: ModelRequest): Promise<ModelResponse>;
}

