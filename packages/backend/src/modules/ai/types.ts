/**
 * BREAKING NEWS WALA — AI Domain Types & Contracts
 * Grounded in docs/17-Agents.md, docs/18-MCP.md, docs/19-API-Pool.md, docs/21-Prompts.md
 */

import {
  AgentId,
  ProviderId,
  ModelIdentifier,
  CapabilityTier,
  ExecutionStatus,
  McpToolId,
} from './constants';

// ============================================================================
// 1. Agent Registry & Orchestration Types
// ============================================================================

export type AgentCategory = 'creation' | 'editorial' | 'ingestion' | 'media' | 'distribution' | 'platform';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  hindiName: string;
  description: string;
  category: AgentCategory;
  purpose: string;
  status: 'active' | 'disabled' | 'pending_approval';
  version: string;
  assignedTier: CapabilityTier;
  defaultModelId: ModelIdentifier;
  promptTemplateId: string;
  promptVersion: string;
  allowedRoles: string[];
  allowedTools: McpToolId[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  timeoutMs: number;
  maxRetries: number;
  dailyQuotaLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentExecutionRequest {
  agentId: AgentId;
  callerId: string;
  callerRole: string;
  callerDistrictId?: string;
  input: Record<string, unknown>;
  correlationId?: string;
  preferredTier?: CapabilityTier;
}

export interface AgentExecutionResult {
  executionId: string;
  agentId: AgentId;
  agentVersion: string;
  status: ExecutionStatus;
  providerId: ProviderId;
  modelIdentifier: string;
  output: Record<string, unknown>;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  executionDurationMs: number;
  fallbackOccurred: boolean;
  attemptedProviders: ProviderId[];
  isAiAssisted: true;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// ============================================================================
// 2. Provider, Model & API Pool Types
// ============================================================================

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  type: 'commercial' | 'self_hosted' | 'mock';
  status: 'active' | 'disabled' | 'pending_configuration';
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'standby';
  priority: number; // 1 = highest primary, 2 = secondary, etc.
  baseUrl: string;
  approvedModels: ModelIdentifier[];
  supportedCapabilities: CapabilityTier[];
  timeoutMs: number;
  maxRetries: number;
  hasKmsSecret: boolean;
  keyAliases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ModelConfig {
  id: string;
  providerId: ProviderId;
  modelIdentifier: ModelIdentifier;
  name: string;
  tier: CapabilityTier;
  contextWindowTokens: number;
  maxOutputTokens: number;
  isDefault: boolean;
  isActive: boolean;
  approvedTasks: string[];
}

export interface KeyReferenceInfo {
  id: string;
  providerId: ProviderId;
  keyAlias: string;
  maskedKey: string; // e.g. "AIzaSy...XXXX"
  quotaLimitQpm: number;
  currentStatus: 'healthy' | 'rate_limited' | 'quarantined';
  lastUsedAt?: string;
}

// ============================================================================
// 3. MCP (Model Context Protocol) Types
// ============================================================================

export interface McpToolDefinition {
  id: McpToolId;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  status: 'active' | 'disabled';
  allowedAgents: AgentId[];
  allowedRoles: string[];
  permissionScope: string;
  timeoutMs: number;
  rateLimitPerMinute: number;
  auditEnabled: boolean;
}

export interface McpToolInvocation {
  toolId: McpToolId;
  agentId: AgentId;
  callerId: string;
  callerRole: string;
  parameters: Record<string, unknown>;
  executionId: string;
}

export interface McpToolResult {
  toolId: McpToolId;
  status: 'success' | 'error';
  data?: Record<string, unknown>;
  error?: string;
  durationMs: number;
}

// ============================================================================
// 4. Prompt Engineering & Versioning Types
// ============================================================================

export interface PromptTemplate {
  id: string;
  name: string;
  purpose: string;
  targetAgentId: AgentId;
  currentVersion: string;
  status: 'active' | 'draft' | 'archived';
  versions: PromptVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  version: string; // SemVer e.g. "1.0.0"
  templateText: string;
  systemDirective: string;
  safetyGuardrails: string[];
  inputVariables: string[];
  outputSchema: Record<string, unknown>;
  changelog: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface CompiledPromptPayload {
  systemPrompt: string;
  userPrompt: string;
  estimatedTokens: number;
  layerProvenance: string[];
}

// ============================================================================
// 5. Model Routing & Fallback Types
// ============================================================================

export interface RoutingPolicy {
  tier: CapabilityTier;
  primaryProvider: ProviderId;
  primaryModel: ModelIdentifier;
  fallbackChain: Array<{
    provider: ProviderId;
    model: ModelIdentifier;
  }>;
}

export interface CircuitBreakerState {
  providerId: ProviderId;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

// ============================================================================
// 6. Editorial Assistance DTOs (Newsroom Integration)
// ============================================================================

export interface HeadlineSuggestionInput {
  articleBody: string;
  category?: string;
  district?: string;
  currentHeadline?: string;
  tone?: 'informative' | 'urgent' | 'engaging';
  count?: number;
}

export interface HeadlineSuggestionOutput {
  options: Array<{
    headline: string;
    subheadline?: string;
    tone: string;
    characterCount: number;
  }>;
  suggestedTags: string[];
  isFactPreserved: boolean;
}

export interface ArticleStructuringInput {
  rawNotes: string;
  category: string;
  district: string;
  witnessStatement?: string;
  officialStatement?: string;
}

export interface ArticleStructuringOutput {
  suggestedHeadline: string;
  leadStandfirst: string;
  bodyParagraphs: string[];
  contextBackground: string;
  missingInformationNotices: string[];
  suggestedCategory: string;
  suggestedDistrict: string;
}

export interface SummarizeTranslateInput {
  text: string;
  mode: 'short_summary' | 'detailed_summary' | 'en_to_hi' | 'hi_to_en' | 'grammar_audit';
}

export interface SummarizeTranslateOutput {
  resultText: string;
  keyEntities: string[];
  wordCount: number;
  correctionsIdentified?: string[];
}

export interface CategorizationSuggestionInput {
  title: string;
  body: string;
}

export interface CategorizationSuggestionOutput {
  suggestedCategory: string;
  suggestedSubcategory?: string;
  suggestedDistrict?: string;
  confidenceScore: number;
  keywords: string[];
}

export interface FactCheckAssistanceInput {
  articleTitle: string;
  articleBody: string;
  sourcesClaimed: string[];
  district: string;
}

export interface FactCheckAssistanceOutput {
  claimsIdentified: Array<{
    claimText: string;
    verificationDimension: string;
    status: 'VERIFIABLE' | 'NEEDS_OFFICIAL_STATEMENT' | 'HIGH_SENSITIVITY' | 'AMBIGUOUS';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    editorialAdvice: string;
  }>;
  overallAdvisory: string;
  potentialContradictions: string[];
  missingEvidenceNotes: string[];
  humanReviewChecklist: string[];
  isAutomatedApproval: false; // Invariant: AI never approves publication!
}

export interface ResearchNewsInput {
  query: string;
  category?: string;
  district?: string;
  contextSources?: string[];
}

export interface ResearchNewsOutput {
  query: string;
  verifiedClaims: string[];
  sourceClaims: string[];
  contradictionsFound: string[];
  missingEvidence: string[];
  recommendedFollowUps: string[];
  suggestedAngle: string;
  sourceAttributions: string[];
}

export interface SourceComparisonInput {
  items: Array<{
    sourceName: string;
    title: string;
    content: string;
    publishedAt?: string;
  }>;
}

export interface SourceComparisonOutput {
  commonPoints: string[];
  conflictingDetails: Array<{
    topic: string;
    differences: Record<string, string>;
  }>;
  uniqueInsights: Record<string, string[]>;
  recommendedSynthesis: string;
}

export interface GrammarReviewInput {
  hindiText: string;
}

export interface GrammarReviewOutput {
  originalText: string;
  correctedText: string;
  corrections: Array<{
    original: string;
    replacement: string;
    reason: string;
    ruleType: 'matra' | 'spelling' | 'journalistic_tone' | 'syntax';
  }>;
  toneScore: number;
}

export interface JournalisticTranslateInput {
  text: string;
  sourceLang: 'en' | 'hi';
  targetLang: 'en' | 'hi';
  domain?: string;
}

export interface JournalisticTranslateOutput {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  preservedEntities: string[];
}

// ============================================================================
// 7. Admin AI Management & Operational Telemetry Types
// ============================================================================

export interface AiDashboardStats {
  registeredAgentsCount: number;
  activeAgentsCount: number;
  disabledAgentsCount: number;
  configuredProvidersCount: number;
  healthyProvidersCount: number;
  totalExecutionsCount: number;
  successfulExecutionsCount: number;
  failedExecutionsCount: number;
  fallbackExecutionsCount: number;
  averageLatencyMs: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  recentExecutions: AgentExecutionResult[];
}

