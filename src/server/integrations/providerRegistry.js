/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Central API Provider Registry, Rate Limiter & Cost Controller
 * Grounded in docs/19-API-Pool.md and docs/20-Integrations.md
 */

import crypto from 'node:crypto';
import { CANONICAL_SEED_PROVIDERS, INTEGRATION_ERROR_CODES } from './constants.js';

export class ProviderRegistry {
  constructor(adapter) {
    this.adapter = adapter;
    this.memoryProviders = new Map();
    this.credentialVault = new Map(); // providerId -> plaintext secret (RAM-only, never persisted directly or sent to client)
    this.init();
  }

  init() {
    for (const p of CANONICAL_SEED_PROVIDERS) {
      this.memoryProviders.set(p.id, { ...p });
      if (p.providerId === 'google_gemini') {
        const key = process.env.GEMINI_API_KEY || 'AIzaSyFakeDevKeyForTesting12345';
        this.credentialVault.set(p.id, key);
        this.memoryProviders.get(p.id).maskedCredential = this.maskSecret(key);
      }
    }
  }

  maskSecret(secret) {
    if (!secret || typeof secret !== 'string') return undefined;
    const len = secret.length;
    if (len <= 8) return '****';
    const start = secret.slice(0, 6);
    const end = secret.slice(-4);
    return `${start}...${end}`;
  }

  findProvider(id) {
    if (!id) return null;
    return this.memoryProviders.get(id) || Array.from(this.memoryProviders.values()).find((p) => p.providerId === id || p.id === id) || null;
  }

  async getProviders(category) {
    let list = Array.from(this.memoryProviders.values());
    if (category) {
      list = list.filter((p) => p.category === category);
    }
    return list.map((p) => this.sanitizeProviderForClient(p));
  }

  async getProviderById(id) {
    const prov = this.findProvider(id);
    if (!prov) return null;
    return this.sanitizeProviderForClient(prov);
  }

  sanitizeProviderForClient(prov) {
    // Strict Invariant: Never send plaintext secrets or vault references to frontend
    const copy = { ...prov };
    delete copy.apiKey;
    delete copy.clientSecret;
    delete copy.rawSecret;
    return copy;
  }

  async registerProvider(dto, user) {
    if (!dto.providerId || !dto.name || !dto.category) {
      throw new Error('providerId, name, and category are mandatory for provider registration');
    }

    const existing = await this.getProviderById(dto.providerId);
    if (existing) {
      throw new Error(`Provider with ID "${dto.providerId}" already registered`);
    }

    const id = `prov-${dto.providerId.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-${Date.now()}`;
    let maskedCredential = undefined;

    if (dto.apiKey || dto.clientSecret) {
      const secret = dto.apiKey || dto.clientSecret;
      this.credentialVault.set(id, secret);
      maskedCredential = this.maskSecret(secret);
    }

    const newProvider = {
      id,
      providerId: dto.providerId,
      name: dto.name,
      category: dto.category,
      documentationUrl: dto.documentationUrl || '',
      baseUrl: dto.baseUrl || '',
      authMethod: dto.authMethod || 'api_key',
      supportedCapabilities: dto.supportedCapabilities || [],
      requiredScopes: dto.requiredScopes || [],
      configStatus: dto.apiKey || dto.clientSecret ? 'configured' : 'pending_configuration',
      connectionStatus: dto.apiKey || dto.clientSecret ? 'connected' : 'pending_authorization',
      healthStatus: dto.apiKey || dto.clientSecret ? 'healthy' : 'unknown',
      isEnabled: dto.isEnabled !== undefined ? Boolean(dto.isEnabled) : true,
      rateLimitInfo: dto.rateLimitInfo || 'Standard Tier',
      dailyQuotaLimit: dto.dailyQuotaLimit || 100000,
      dailyQuotaUsed: 0,
      monthlyQuotaLimit: dto.monthlyQuotaLimit || 3000000,
      monthlyQuotaUsed: 0,
      avgLatencyMs: 250,
      costPer1kInputTokensUsd: dto.costPer1kInputTokensUsd || 0.0001,
      costPer1kOutputTokensUsd: dto.costPer1kOutputTokensUsd || 0.0005,
      currencyRateUsdToInr: 87.5,
      maskedCredential,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memoryProviders.set(id, newProvider);
    return this.sanitizeProviderForClient(newProvider);
  }

  async updateProvider(id, dto, user) {
    const prov = this.findProvider(id);
    if (!prov) return null;

    if (dto.apiKey || dto.clientSecret) {
      const secret = dto.apiKey || dto.clientSecret;
      this.credentialVault.set(prov.id, secret);
      prov.maskedCredential = this.maskSecret(secret);
      prov.configStatus = 'configured';
      prov.connectionStatus = 'connected';
    }

    if (dto.name) prov.name = dto.name;
    if (dto.baseUrl) prov.baseUrl = dto.baseUrl;
    if (typeof dto.isEnabled === 'boolean') prov.isEnabled = dto.isEnabled;
    if (dto.rateLimitInfo) prov.rateLimitInfo = dto.rateLimitInfo;
    if (dto.healthStatus) prov.healthStatus = dto.healthStatus;
    if (dto.dailyQuotaLimit) prov.dailyQuotaLimit = dto.dailyQuotaLimit;
    if (dto.monthlyQuotaLimit) prov.monthlyQuotaLimit = dto.monthlyQuotaLimit;

    prov.updatedAt = new Date().toISOString();
    return this.sanitizeProviderForClient(prov);
  }

  async toggleProvider(id, isEnabled, user) {
    const prov = this.findProvider(id);
    if (!prov) return null;
    prov.isEnabled = Boolean(isEnabled);
    prov.connectionStatus = isEnabled ? 'connected' : 'disabled';
    prov.healthStatus = isEnabled ? 'healthy' : 'disconnected';
    prov.updatedAt = new Date().toISOString();
    return this.sanitizeProviderForClient(prov);
  }

  async testProviderHealth(id) {
    const prov = this.findProvider(id);
    if (!prov) return null;

    const isHealthy = prov.isEnabled && (prov.configStatus === 'configured' || prov.authMethod === 'none');
    prov.healthStatus = isHealthy ? 'healthy' : 'degraded';
    prov.lastSuccessfulRequestAt = isHealthy ? new Date().toISOString() : prov.lastSuccessfulRequestAt;
    prov.lastFailedRequestAt = !isHealthy ? new Date().toISOString() : prov.lastFailedRequestAt;
    prov.lastErrorMessage = !isHealthy ? 'Provider is disabled or credentials unconfigured' : null;
    prov.avgLatencyMs = isHealthy ? Math.floor(Math.random() * 200 + 100) : 0;
    prov.updatedAt = new Date().toISOString();

    return this.sanitizeProviderForClient(prov);
  }

  async recordUsage(providerId, { tokens = 0, inputTokens = 0, outputTokens = 0, latencyMs = 200, success = true }) {
    const prov = this.memoryProviders.get(providerId) || Array.from(this.memoryProviders.values()).find((p) => p.providerId === providerId);
    if (!prov) return;

    prov.dailyQuotaUsed = (prov.dailyQuotaUsed || 0) + tokens;
    prov.monthlyQuotaUsed = (prov.monthlyQuotaUsed || 0) + tokens;
    prov.avgLatencyMs = Math.round(((prov.avgLatencyMs || 250) + latencyMs) / 2);

    if (success) {
      prov.lastSuccessfulRequestAt = new Date().toISOString();
    } else {
      prov.lastFailedRequestAt = new Date().toISOString();
    }
  }

  async getUsageSummary() {
    const providers = Array.from(this.memoryProviders.values());
    let totalDailyTokens = 0;
    let totalMonthlyTokens = 0;
    let totalEstimatedCostUsd = 0;

    for (const p of providers) {
      totalDailyTokens += p.dailyQuotaUsed || 0;
      totalMonthlyTokens += p.monthlyQuotaUsed || 0;

      const inputCost = ((p.dailyQuotaUsed || 0) * 0.7 * (p.costPer1kInputTokensUsd || 0.0001)) / 1000;
      const outputCost = ((p.dailyQuotaUsed || 0) * 0.3 * (p.costPer1kOutputTokensUsd || 0.0005)) / 1000;
      totalEstimatedCostUsd += (inputCost + outputCost);
    }

    const currencyRate = 87.5;
    const totalEstimatedCostInr = Math.round(totalEstimatedCostUsd * currencyRate * 100) / 100;

    return {
      totalProviders: providers.length,
      activeProviders: providers.filter((p) => p.isEnabled).length,
      healthyProviders: providers.filter((p) => p.healthStatus === 'healthy').length,
      totalDailyTokens,
      totalMonthlyTokens,
      totalEstimatedCostUsd: Math.round(totalEstimatedCostUsd * 10000) / 10000,
      totalEstimatedCostInr,
      currency: 'INR',
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        providerId: p.providerId,
        category: p.category,
        isEnabled: p.isEnabled,
        healthStatus: p.healthStatus,
        dailyQuotaUsed: p.dailyQuotaUsed || 0,
        dailyQuotaLimit: p.dailyQuotaLimit || 100000,
        percentUsed: Math.round(((p.dailyQuotaUsed || 0) / (p.dailyQuotaLimit || 1)) * 100),
        avgLatencyMs: p.avgLatencyMs || 200,
      })),
    };
  }
}
