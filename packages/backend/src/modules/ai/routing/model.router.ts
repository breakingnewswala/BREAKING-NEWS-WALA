/**
 * BREAKING NEWS WALA — Model Router
 * Grounded in docs/19-API-Pool.md and DEC-050
 */

import {
  ProviderId,
  PROVIDER_IDS,
  MODEL_IDS,
  ModelIdentifier,
  CapabilityTier,
  CAPABILITY_TIERS,
} from '../constants';
import { RoutingPolicy } from '../types';
import { ProviderRegistry } from '../providers/provider.registry';

export class ModelRouter {
  private policies: Map<CapabilityTier, RoutingPolicy> = new Map();
  private mockModeEnabled: boolean = false;

  constructor(private registry: ProviderRegistry) {
    this.initializeDefaultPolicies();
    // Enable mock mode if no commercial keys are present
    this.checkAutoMockMode();
  }

  private initializeDefaultPolicies(): void {
    // 1. Fast Tier Policy (Low Latency / High Throughput)
    this.policies.set(CAPABILITY_TIERS.FAST, {
      tier: CAPABILITY_TIERS.FAST,
      primaryProvider: PROVIDER_IDS.GEMINI,
      primaryModel: MODEL_IDS.GEMINI_FLASH,
      fallbackChain: [
        { provider: PROVIDER_IDS.ANTHROPIC, model: MODEL_IDS.CLAUDE_HAIKU },
        { provider: PROVIDER_IDS.OPENAI, model: MODEL_IDS.GPT_4O_MINI },
        { provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.MOCK_MODEL },
      ],
    });

    // 2. Deep Tier Policy (Reasoning / Journalistic Structuring)
    this.policies.set(CAPABILITY_TIERS.DEEP, {
      tier: CAPABILITY_TIERS.DEEP,
      primaryProvider: PROVIDER_IDS.GEMINI,
      primaryModel: MODEL_IDS.GEMINI_PRO,
      fallbackChain: [
        { provider: PROVIDER_IDS.ANTHROPIC, model: MODEL_IDS.CLAUDE_SONNET },
        { provider: PROVIDER_IDS.OPENAI, model: MODEL_IDS.GPT_4O },
        { provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.MOCK_MODEL },
      ],
    });

    // 3. Embedding Tier Policy (Vector Similarity / Deduplication)
    this.policies.set(CAPABILITY_TIERS.EMBEDDING, {
      tier: CAPABILITY_TIERS.EMBEDDING,
      primaryProvider: PROVIDER_IDS.GEMINI,
      primaryModel: MODEL_IDS.GEMINI_EMBEDDING,
      fallbackChain: [
        { provider: PROVIDER_IDS.OPENAI, model: MODEL_IDS.OPENAI_EMBEDDING },
        { provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.MOCK_MODEL },
      ],
    });
  }

  public checkAutoMockMode(): void {
    const gemini = this.registry.get(PROVIDER_IDS.GEMINI);
    const anthropic = this.registry.get(PROVIDER_IDS.ANTHROPIC);
    const openai = this.registry.get(PROVIDER_IDS.OPENAI);

    const hasRealKey =
      (gemini && gemini.isConfigured()) ||
      (anthropic && anthropic.isConfigured()) ||
      (openai && openai.isConfigured());

    if (!hasRealKey) {
      this.mockModeEnabled = true;
    }
  }

  public setMockMode(enabled: boolean): void {
    this.mockModeEnabled = enabled;
  }

  public isMockMode(): boolean {
    return this.mockModeEnabled;
  }

  public getPolicy(tier: CapabilityTier): RoutingPolicy {
    const policy = this.policies.get(tier);
    if (!policy) {
      // Default to Fast Tier if tier unrecognized
      return this.policies.get(CAPABILITY_TIERS.FAST)!;
    }

    if (this.mockModeEnabled) {
      return {
        tier,
        primaryProvider: PROVIDER_IDS.MOCK,
        primaryModel: MODEL_IDS.MOCK_MODEL,
        fallbackChain: [],
      };
    }

    return policy;
  }

  public updatePolicy(tier: CapabilityTier, policy: Partial<RoutingPolicy>): void {
    const existing = this.getPolicy(tier);
    this.policies.set(tier, {
      ...existing,
      ...policy,
    });
  }

  public resolveExecutionChain(
    tier: CapabilityTier,
    preferredProvider?: ProviderId,
    preferredModel?: ModelIdentifier
  ): Array<{ provider: ProviderId; model: ModelIdentifier }> {
    if (this.mockModeEnabled) {
      return [{ provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.MOCK_MODEL }];
    }

    const policy = this.getPolicy(tier);
    const chain: Array<{ provider: ProviderId; model: ModelIdentifier }> = [];

    // If preferred provider is configured and available, make it primary in this request chain
    if (preferredProvider && preferredModel) {
      const adapter = this.registry.get(preferredProvider);
      if (adapter && adapter.isConfigured() && adapter.supportedModels.includes(preferredModel)) {
        chain.push({ provider: preferredProvider, model: preferredModel });
      }
    }

    // Add configured primary provider if not already added
    if (!chain.some((c) => c.provider === policy.primaryProvider)) {
      const primaryAdapter = this.registry.get(policy.primaryProvider);
      if (primaryAdapter && primaryAdapter.isConfigured()) {
        chain.push({ provider: policy.primaryProvider, model: policy.primaryModel });
      }
    }

    // Add fallback chain
    for (const item of policy.fallbackChain) {
      if (!chain.some((c) => c.provider === item.provider)) {
        const fallbackAdapter = this.registry.get(item.provider);
        if (fallbackAdapter && (fallbackAdapter.isConfigured() || item.provider === PROVIDER_IDS.MOCK)) {
          chain.push(item);
        }
      }
    }

    // Safety fallback: ensure at least Mock provider is present if all external providers are unconfigured
    if (chain.length === 0) {
      chain.push({ provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.MOCK_MODEL });
    }

    return chain;
  }
}

