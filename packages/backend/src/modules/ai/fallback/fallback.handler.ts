/**
 * BREAKING NEWS WALA — AI Fallback & Failover Handler
 * Grounded in docs/19-API-Pool.md and DEC-051
 */

import { ProviderId, ModelIdentifier } from '../constants';
import { ModelRequest, ModelResponse, ProviderError } from '../providers/provider.interface';
import { ProviderRegistry } from '../providers/provider.registry';
import { CircuitBreakerRegistry } from './circuit.breaker';

export interface FallbackExecutionResult {
  response: ModelResponse;
  fallbackOccurred: boolean;
  attemptedProviders: ProviderId[];
}

export class FallbackHandler {
  constructor(
    private registry: ProviderRegistry,
    private circuitBreakers: CircuitBreakerRegistry
  ) {}

  public async executeWithFallback(
    chain: Array<{ provider: ProviderId; model: ModelIdentifier }>,
    request: ModelRequest
  ): Promise<FallbackExecutionResult> {
    const attemptedProviders: ProviderId[] = [];
    let lastError: unknown;

    for (let i = 0; i < chain.length; i++) {
      const { provider: providerId, model: modelId } = chain[i]!;
      attemptedProviders.push(providerId);

      // Check circuit breaker status
      if (!this.circuitBreakers.canExecute(providerId)) {
        continue;
      }

      const adapter = this.registry.get(providerId);
      if (!adapter || (!adapter.isConfigured() && providerId !== 'PRV-MOCK')) {
        continue;
      }

      try {
        const reqWithModel: ModelRequest = {
          ...request,
          modelIdentifier: modelId,
        };

        const response = await adapter.execute(reqWithModel);
        this.circuitBreakers.recordSuccess(providerId);

        const isFallback = i > 0;
        return {
          response: {
            ...response,
            isFallback,
          },
          fallbackOccurred: isFallback,
          attemptedProviders,
        };
      } catch (err: unknown) {
        lastError = err;

        if (err instanceof ProviderError) {
          // If NOT retryable (e.g. auth failure, bad request, content policy violation), do not fall back!
          if (!err.isRetryable) {
            throw err;
          }

          // Record retryable failure in circuit breaker
          this.circuitBreakers.recordFailure(providerId);
        } else {
          this.circuitBreakers.recordFailure(providerId);
        }

        // Continue loop to attempt next provider in fallback chain
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new ProviderError(
      'All configured AI providers in fallback chain failed or were unavailable',
      chain[0]?.provider || 'PRV-GEMINI',
      'ERR_ALL_PROVIDERS_FAILED',
      true,
      503
    );
  }
}

