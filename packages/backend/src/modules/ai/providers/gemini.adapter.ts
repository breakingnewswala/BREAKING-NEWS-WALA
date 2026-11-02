/**
 * BREAKING NEWS WALA — Google Gemini AI Provider Adapter
 * Grounded in docs/19-API-Pool.md and DEC-050
 * Primary Enterprise Provider: Google Gemini (gemini-1.5-flash, gemini-1.5-pro, text-embedding-004)
 */

import { ProviderId, PROVIDER_IDS, MODEL_IDS, ModelIdentifier } from '../constants';
import { IProviderAdapter, ModelRequest, ModelResponse, ProviderError } from './provider.interface';

export class GeminiProviderAdapter implements IProviderAdapter {
  public readonly providerId: ProviderId = PROVIDER_IDS.GEMINI;
  public readonly providerName: string = 'Google Gemini AI';
  public readonly supportedModels: ModelIdentifier[] = [
    MODEL_IDS.GEMINI_FLASH,
    MODEL_IDS.GEMINI_PRO,
    MODEL_IDS.GEMINI_EMBEDDING,
  ];

  private apiKey?: string;
  private endpointBase: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
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
        'Google Gemini API key is not configured or pending approval',
        this.providerId,
        'ERR_PROVIDER_NOT_CONFIGURED',
        false,
        503
      );
    }

    const startTime = Date.now();
    const model = request.modelIdentifier || MODEL_IDS.GEMINI_FLASH;
    const url = `${this.endpointBase}/models/${model}:generateContent?key=${this.apiKey}`;

    const bodyPayload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${request.systemPrompt}\n\n${request.userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: request.temperature ?? 0.2,
        maxOutputTokens: request.maxOutputTokens ?? 2048,
        responseMimeType: request.responseFormat === 'json' ? 'application/json' : 'text/plain',
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs || 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          `Gemini API HTTP ${response.status}: ${errorBody.slice(0, 200)}`,
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
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let structuredData: Record<string, unknown> | undefined;

      if (request.responseFormat === 'json' && rawText) {
        try {
          structuredData = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          // If JSON parse fails, rawText is preserved for error validation
        }
      }

      const promptTokens = data.usageMetadata?.promptTokenCount || Math.round(request.userPrompt.length / 4);
      const completionTokens = data.usageMetadata?.candidatesTokenCount || Math.round(rawText.length / 4);
      const totalTokens = data.usageMetadata?.totalTokenCount || promptTokens + completionTokens;

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
          `Gemini API request timed out after ${request.timeoutMs || 15000}ms`,
          this.providerId,
          'ERR_PROVIDER_TIMEOUT',
          true,
          408
        );
      }
      throw new ProviderError(
        `Gemini network failure: ${err instanceof Error ? err.message : String(err)}`,
        this.providerId,
        'ERR_NETWORK_FAILURE',
        true,
        500
      );
    }
  }
}

