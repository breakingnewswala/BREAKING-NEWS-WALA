/**
 * BREAKING NEWS WALA — Anthropic Claude AI Provider Adapter
 * Grounded in docs/19-API-Pool.md and DEC-050
 * Secondary Failover Provider: Anthropic Claude (claude-3-5-haiku, claude-3-5-sonnet)
 */

import { ProviderId, PROVIDER_IDS, MODEL_IDS, ModelIdentifier } from '../constants';
import { IProviderAdapter, ModelRequest, ModelResponse, ProviderError } from './provider.interface';

export class AnthropicProviderAdapter implements IProviderAdapter {
  public readonly providerId: ProviderId = PROVIDER_IDS.ANTHROPIC;
  public readonly providerName: string = 'Anthropic Claude AI';
  public readonly supportedModels: ModelIdentifier[] = [
    MODEL_IDS.CLAUDE_HAIKU,
    MODEL_IDS.CLAUDE_SONNET,
  ];

  private apiKey?: string;
  private endpointBase: string = 'https://api.anthropic.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('DEMO'));
  }

  public async getHealth(): Promise<'healthy' | 'degraded' | 'unhealthy' | 'standby'> {
    if (!this.isConfigured()) {
      return 'standby';
    }
    return 'healthy';
  }

  public async execute(request: ModelRequest): Promise<ModelResponse> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        'Anthropic Claude API key is not configured or in standby mode',
        this.providerId,
        'ERR_PROVIDER_NOT_CONFIGURED',
        false,
        503
      );
    }

    const startTime = Date.now();
    const model = request.modelIdentifier || MODEL_IDS.CLAUDE_HAIKU;
    const url = `${this.endpointBase}/messages`;

    const bodyPayload = {
      model,
      max_tokens: request.maxOutputTokens ?? 2048,
      temperature: request.temperature ?? 0.2,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs || 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey as string,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        const isRateLimit = response.status === 429;
        const isServerUnavailable = response.status >= 500;
        const isAuthFailure = response.status === 401 || response.status === 403;

        throw new ProviderError(
          `Anthropic API HTTP ${response.status}: ${errorBody.slice(0, 200)}`,
          this.providerId,
          isRateLimit
            ? 'ERR_RATE_LIMIT_EXCEEDED'
            : isAuthFailure
            ? 'ERR_AUTHENTICATION_FAILED'
            : 'ERR_PROVIDER_SERVER_ERROR',
          isRateLimit || isServerUnavailable,
          response.status
        );
      }

      const data = (await response.json()) as {
        content?: Array<{ text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const rawText = data.content?.[0]?.text || '';
      let structuredData: Record<string, unknown> | undefined;

      if (request.responseFormat === 'json' && rawText) {
        try {
          structuredData = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          // preserve rawText
        }
      }

      const promptTokens = data.usage?.input_tokens || Math.round(request.userPrompt.length / 4);
      const completionTokens = data.usage?.output_tokens || Math.round(rawText.length / 4);

      return {
        providerId: this.providerId,
        modelIdentifier: model,
        rawText,
        structuredData,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        durationMs: Date.now() - startTime,
        isFallback: false,
      };
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof ProviderError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError(
          `Anthropic API request timed out after ${request.timeoutMs || 15000}ms`,
          this.providerId,
          'ERR_PROVIDER_TIMEOUT',
          true,
          408
        );
      }
      throw new ProviderError(
        `Anthropic network failure: ${err instanceof Error ? err.message : String(err)}`,
        this.providerId,
        'ERR_NETWORK_FAILURE',
        true,
        500
      );
    }
  }
}

