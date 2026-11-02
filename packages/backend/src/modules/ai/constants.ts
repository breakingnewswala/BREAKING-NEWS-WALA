/**
 * BREAKING NEWS WALA — AI Subsystem Constants
 * Grounded in docs/17-Agents.md, docs/18-MCP.md, docs/19-API-Pool.md, docs/21-Prompts.md
 */

// 1. Canonical 14 AI Agent Identifiers (docs/17-Agents.md)
export const AGENT_IDS = {
  NEWS_WRITING: 'AGT-WRT-001',
  HEADLINE_GENERATION: 'AGT-HDL-002',
  EDITORIAL_ASSISTANT: 'AGT-EDT-003',
  RSS_PROCESSING: 'AGT-RSS-004',
  URL_TO_NEWS: 'AGT-URL-005',
  RESEARCH_FACT_CHECK: 'AGT-RES-006',
  SEO_ASSISTANT: 'AGT-SEO-007',
  GRAPHICS_ASSISTANT: 'AGT-GRP-008',
  VIDEO_ASSISTANT: 'AGT-VID-009',
  TRANSLATION_SUMMARY: 'AGT-TRN-010',
  NEWS_CLASSIFICATION: 'AGT-CLS-011',
  DUPLICATE_DETECTION: 'AGT-DUP-012',
  NOTIFICATION_CONTENT: 'AGT-NOT-013',
  ANALYTICS_ASSISTANT: 'AGT-ANL-014',
} as const;

export type AgentId = typeof AGENT_IDS[keyof typeof AGENT_IDS];

// 2. Canonical AI Provider Identifiers (docs/19-API-Pool.md)
export const PROVIDER_IDS = {
  GEMINI: 'PRV-GEMINI',
  ANTHROPIC: 'PRV-ANTHROPIC',
  OPENAI: 'PRV-OPENAI',
  LOCAL_OSS: 'PRV-LOCAL-OSS',
  MOCK: 'PRV-MOCK',
} as const;

export type ProviderId = typeof PROVIDER_IDS[keyof typeof PROVIDER_IDS];

// 3. Canonical AI Model Identifiers & Families (docs/19-API-Pool.md)
export const MODEL_IDS = {
  // Primary Provider: Google Gemini
  GEMINI_FLASH: 'gemini-1.5-flash',
  GEMINI_PRO: 'gemini-1.5-pro',
  GEMINI_EMBEDDING: 'text-embedding-004',

  // Secondary Failover: Anthropic Claude
  CLAUDE_HAIKU: 'claude-3-5-haiku',
  CLAUDE_SONNET: 'claude-3-5-sonnet',

  // Tertiary Failover: OpenAI
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4O: 'gpt-4o',
  OPENAI_EMBEDDING: 'text-embedding-3-small',

  // Mock
  MOCK_MODEL: 'mock-model-v1',
} as const;

export type ModelIdentifier = typeof MODEL_IDS[keyof typeof MODEL_IDS];

// 4. Model Capability Tiers (docs/19-API-Pool.md)
export const CAPABILITY_TIERS = {
  FAST: 'fast',
  DEEP: 'deep',
  EMBEDDING: 'embedding',
} as const;

export type CapabilityTier = typeof CAPABILITY_TIERS[keyof typeof CAPABILITY_TIERS];

// 5. Execution Statuses
export const EXECUTION_STATUSES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMED_OUT: 'timed_out',
} as const;

export type ExecutionStatus = typeof EXECUTION_STATUSES[keyof typeof EXECUTION_STATUSES];

// 6. Canonical MCP Tool Identifiers (docs/18-MCP.md)
export const MCP_TOOL_IDS = {
  ARCHIVE_SEARCH: 'mcp_archive_search',
  TAXONOMY_RESOLVE: 'mcp_taxonomy_resolve',
  MEDIA_INSPECT: 'mcp_media_inspect',
  WIRE_INSPECT: 'mcp_wire_inspect',
  AUDIT_QUERY: 'mcp_audit_query',
} as const;

export type McpToolId = typeof MCP_TOOL_IDS[keyof typeof MCP_TOOL_IDS];

// 7. Security and Execution Thresholds
export const AI_CONFIG_DEFAULTS = {
  DEFAULT_TIMEOUT_MS: 15000,
  FAST_TIER_TIMEOUT_MS: 8000,
  DEEP_TIER_TIMEOUT_MS: 30000,
  MAX_RETRY_ATTEMPTS: 2,
  MAX_INPUT_CHARS: 15000,
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 3,
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 30000,
  DAILY_REPORTER_QUOTA_DEFAULT: 25,
} as const;

