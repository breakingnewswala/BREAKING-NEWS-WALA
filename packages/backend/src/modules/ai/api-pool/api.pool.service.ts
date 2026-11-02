/**
 * BREAKING NEWS WALA — Central Multi-Provider API Pool Service
 * Grounded in docs/19-API-Pool.md, DEC-050, DEC-054
 */

import { PROVIDER_IDS } from '../constants';
import { KeyReferenceInfo, ProviderConfig } from '../types';
import { ProviderRegistry } from '../providers/provider.registry';

export class ApiPoolService {
  private keyReferences: Map<string, KeyReferenceInfo> = new Map();

  constructor(private providerRegistry: ProviderRegistry) {
    this.seedDefaultKeyReferences();
  }

  private seedDefaultKeyReferences(): void {
    // 1. Google Gemini Primary Key Vault
    this.keyReferences.set('key_gemini_primary', {
      id: 'key_gemini_primary',
      providerId: PROVIDER_IDS.GEMINI,
      keyAlias: 'KMS-VAULT-GEMINI-PRIMARY',
      maskedKey: process.env.GEMINI_API_KEY
        ? `${process.env.GEMINI_API_KEY.slice(0, 6)}...${process.env.GEMINI_API_KEY.slice(-4)}`
        : 'AIzaSy...PROD',
      quotaLimitQpm: 120,
      currentStatus: 'healthy',
      lastUsedAt: new Date().toISOString(),
    });

    // 2. Anthropic Standby Vault
    this.keyReferences.set('key_anthropic_standby', {
      id: 'key_anthropic_standby',
      providerId: PROVIDER_IDS.ANTHROPIC,
      keyAlias: 'KMS-VAULT-ANTHROPIC-STANDBY',
      maskedKey: process.env.ANTHROPIC_API_KEY
        ? `${process.env.ANTHROPIC_API_KEY.slice(0, 6)}...${process.env.ANTHROPIC_API_KEY.slice(-4)}`
        : 'sk-ant...STANDBY',
      quotaLimitQpm: 60,
      currentStatus: 'healthy',
    });

    // 3. OpenAI Standby Vault
    this.keyReferences.set('key_openai_standby', {
      id: 'key_openai_standby',
      providerId: PROVIDER_IDS.OPENAI,
      keyAlias: 'KMS-VAULT-OPENAI-STANDBY',
      maskedKey: process.env.OPENAI_API_KEY
        ? `${process.env.OPENAI_API_KEY.slice(0, 6)}...${process.env.OPENAI_API_KEY.slice(-4)}`
        : 'sk-proj...STANDBY',
      quotaLimitQpm: 60,
      currentStatus: 'healthy',
    });
  }

  public getKeyReferences(): KeyReferenceInfo[] {
    return Array.from(this.keyReferences.values());
  }

  public getKeyReference(id: string): KeyReferenceInfo | undefined {
    return this.keyReferences.get(id);
  }

  public updateKeyStatus(id: string, status: 'healthy' | 'rate_limited' | 'quarantined'): void {
    const key = this.keyReferences.get(id);
    if (key) {
      key.currentStatus = status;
      key.lastUsedAt = new Date().toISOString();
    }
  }

  public getProviderCatalog(): ProviderConfig[] {
    const adapters = this.providerRegistry.getAll();
    return adapters.map((adapter) => {
      const isConfigured = adapter.isConfigured();
      return {
        id: adapter.providerId,
        name: adapter.providerName,
        type: adapter.providerId === PROVIDER_IDS.MOCK ? 'mock' : 'commercial',
        status: isConfigured ? 'active' : 'pending_configuration',
        healthStatus: isConfigured ? 'healthy' : 'standby',
        priority: adapter.providerId === PROVIDER_IDS.GEMINI ? 1 : 2,
        baseUrl:
          adapter.providerId === PROVIDER_IDS.GEMINI
            ? 'https://generativelanguage.googleapis.com'
            : adapter.providerId === PROVIDER_IDS.ANTHROPIC
            ? 'https://api.anthropic.com'
            : adapter.providerId === PROVIDER_IDS.OPENAI
            ? 'https://api.openai.com'
            : 'internal://mock',
        approvedModels: adapter.supportedModels,
        supportedCapabilities: ['fast', 'deep'],
        timeoutMs: 15000,
        maxRetries: 2,
        hasKmsSecret: isConfigured,
        keyAliases: Array.from(this.keyReferences.values())
          .filter((k) => k.providerId === adapter.providerId)
          .map((k) => k.keyAlias),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }
}

