/**
 * BREAKING NEWS WALA — OpenAI Provider Adapter
 * Grounded in docs/19-API-Pool.md and DEC-050
 * Tertiary Failover Provider: OpenAI (gpt-4o-mini, gpt-4o, text-embedding-3-small)
 */

import { ProviderId, PROVIDER_IDS, MODEL_IDS, ModelIdentifier } from '../constants';
import { IProviderAdapter, ModelRequest, ModelResponse, ProviderError } from './provider.interface';

export class OpenAiProviderAdapter implements IProviderAdapter {
  public readonly providerId: ProviderId = PROVIDER_IDS.OPENAI;
  public readonly providerName: string = 'OpenAI';
  public readonly supportedModels: ModelIdentifier[] = [
    MODEL_IDS.GPT_4O_MINI,
    MODEL_IDS.GPT_4O,
    MODEL_IDS.OPENAI_EMBEDDING,
  ];

  private apiKey?: string;
  private endpointBase: string = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
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
        'OpenAI API key is not configured or in standby mode',
        this.providerId,
        'ERR_PROVIDER_NOT_CONFIGURED',
        false,
        503
      );
    }

    const startTime = Date.now();
    const model = request.modelIdentifier || MODEL_IDS.GPT_4O_MINI;
    const url = `${this.endpointBase}/chat/completions`;

    const bodyPayload = {
      model,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxOutputTokens ?? 2048,
      response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      messages: [
        {
          role: 'system',
          content: request.systemPrompt,
        },
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
          Authorization: `Bearer ${this.apiKey}`,
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
          `OpenAI API HTTP ${response.status}: ${errorBody.slice(0, 200)}`,
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
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const rawText = data.choices?.[0]?.message?.content || '';
      let structuredData: Record<string, unknown> | undefined;

      if (request.responseFormat === 'json' && rawText) {
        try {
          structuredData = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          // preserve rawText
        }
      }

      const promptTokens = data.usage?.prompt_tokens || Math.round(request.userPrompt.length / 4);
      const completionTokens = data.usage?.completion_tokens || Math.round(rawText.length / 4);
      const totalTokens = data.usage?.total_tokens || promptTokens + completionTokens;

      return {
        providerId: this.providerId,
        modelIdentifier: model,
        rawText,
        structuredData,
        promptTokens,
        completionTokens,
        totalTokens,
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
          `OpenAI API request timed out after ${request.timeoutMs || 15000}ms`,
          this.providerId,
          'ERR_PROVIDER_TIMEOUT',
          true,
          408
        );
      }
      throw new ProviderError(
        `OpenAI network failure: ${err instanceof Error ? err.message : String(err)}`,
        this.providerId,
        'ERR_NETWORK_FAILURE',
        true,
        500
      );
    }
  }
}

