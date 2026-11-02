/**
 * BREAKING NEWS WALA — AI Provider Registry
 * Grounded in docs/19-API-Pool.md and DEC-050
 */

import { ProviderId, PROVIDER_IDS, ModelIdentifier } from '../constants';
import { IProviderAdapter } from './provider.interface';
import { GeminiProviderAdapter } from './gemini.adapter';
import { AnthropicProviderAdapter } from './anthropic.adapter';
import { OpenAiProviderAdapter } from './openai.adapter';
import { MockProviderAdapter } from './mock.adapter';

export class ProviderRegistry {
  private adapters: Map<ProviderId, IProviderAdapter> = new Map();

  constructor() {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    // Register Canonical Adapters
    this.register(new GeminiProviderAdapter());
    this.register(new AnthropicProviderAdapter());
    this.register(new OpenAiProviderAdapter());
    this.register(new MockProviderAdapter());
  }

  public register(adapter: IProviderAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  public get(providerId: ProviderId): IProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  public getMockAdapter(): MockProviderAdapter {
    return this.adapters.get(PROVIDER_IDS.MOCK) as MockProviderAdapter;
  }

  public getGeminiAdapter(): GeminiProviderAdapter {
    return this.adapters.get(PROVIDER_IDS.GEMINI) as GeminiProviderAdapter;
  }

  public getAll(): IProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  public isModelSupportedByProvider(providerId: ProviderId, modelId: ModelIdentifier): boolean {
    const adapter = this.adapters.get(providerId);
    if (!adapter) return false;
    return adapter.supportedModels.includes(modelId);
  }

  public async getProviderHealthSummary(): Promise<
    Array<{
      providerId: ProviderId;
      name: string;
      isConfigured: boolean;
      health: 'healthy' | 'degraded' | 'unhealthy' | 'standby';
      supportedModels: ModelIdentifier[];
    }>
  > {
    const summary = [];
    for (const adapter of this.adapters.values()) {
      const isConfigured = adapter.isConfigured();
      const health = await adapter.getHealth();
      summary.push({
        providerId: adapter.providerId,
        name: adapter.providerName,
        isConfigured,
        health,
        supportedModels: adapter.supportedModels,
      });
    }
    return summary;
  }
}

export const providerRegistry = new ProviderRegistry();

