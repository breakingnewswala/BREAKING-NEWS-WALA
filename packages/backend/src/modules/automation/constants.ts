/**
 * BREAKING NEWS WALA — Automation Engine Constants & Pre-Seeded Rules
 * Grounded in docs/11-Architecture.md and docs/05-Workflows.md
 */

import { AutomationRule } from './types';

export const AUTOMATION_ERROR_CODES = {
  RULE_NOT_FOUND: 'ERR_AUTOMATION_RULE_NOT_FOUND',
  MAX_HOPS_EXCEEDED: 'ERR_LOOP_PREVENTION_TRIGGERED',
  AUTONOMOUS_PUBLISH_FORBIDDEN: 'ERR_AUTONOMOUS_PUBLISH_FORBIDDEN',
  ROLE_PENDING_APPROVAL: 'ERR_ROLE_PENDING_APPROVAL',
} as const;

export const DEFAULT_AUTOMATION_LIMITS = {
  MAX_HOPS: 3,
  DEFAULT_TIMEOUT_MS: 10000,
  MAX_RETRIES: 3,
} as const;

/**
 * Pre-seeded newsroom automation rules for regional and RSS intake
 */
export const CANONICAL_SEED_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-auto-summary-001',
    name: 'RSS वायर समाचारों का स्वचालित AI संक्षेपण',
    description: 'आयातित RSS समाचार फ़ीड्स के लिए संक्षिप्त 60-शब्द बुलेट सारांश तैयार करना',
    trigger: 'rss_item_discovered',
    conditions: [
      { field: 'hasContent', operator: 'equals', value: true },
    ],
    actions: [
      { actionType: 'request_ai_summary', params: { targetWords: 60, language: 'hi' } },
      { actionType: 'add_to_review_queue', params: { priority: 'normal' } },
    ],
    status: 'active',
    executionPolicy: { maxHops: 3, timeoutMs: 10000, preventLoops: true },
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    version: 1,
    createdBy: 'usr-admin-system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-auto-taxonomy-002',
    name: 'फ़ीड सामग्री का स्वतः श्रेणी व ज़िला निर्धारण',
    description: 'मध्य प्रदेश के 55 जिलों एवं 21 श्रेणियों के अनुसार फ़ीड की स्वचालित टैगिंग',
    trigger: 'rss_import_completed',
    conditions: [],
    actions: [
      { actionType: 'suggest_category', params: { targetState: 'Madhya Pradesh' } },
      { actionType: 'suggest_tags', params: { maxTags: 5 } },
    ],
    status: 'active',
    executionPolicy: { maxHops: 3, timeoutMs: 8000, preventLoops: true },
    retryPolicy: { maxRetries: 1, backoffMs: 500 },
    version: 1,
    createdBy: 'usr-admin-system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-breaking-alert-003',
    name: 'सख्त ब्रेकिंग अलर्ट प्राथमिक समीक्षा',
    description: 'वायर में ब्रेकिंग अथवा अतिमहत्वपूर्ण कीवर्ड मिलने पर संपादकीय डेस्क को तत्काल अलर्ट',
    trigger: 'rss_item_discovered',
    conditions: [
      { field: 'isBreakingCandidate', operator: 'equals', value: true },
    ],
    actions: [
      { actionType: 'add_to_review_queue', params: { priority: 'high', alertDesk: true } },
      { actionType: 'notify_editor', params: { channel: 'newsroom_urgent' } },
    ],
    status: 'active',
    executionPolicy: { maxHops: 3, timeoutMs: 5000, preventLoops: true },
    retryPolicy: { maxRetries: 1, backoffMs: 500 },
    version: 1,
    createdBy: 'usr-admin-system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-fetch-audit-004',
    name: 'सिंक पूर्णता पर ऑडिट रिपोर्ट व लॉगिंग',
    description: 'प्रत्येक सफल फ़ीड सिंक के उपरांत सिस्टम ऑडिट लॉग तथा मेट्रिक्स अद्यतन',
    trigger: 'rss_source_fetch_completed',
    conditions: [],
    actions: [
      { actionType: 'generate_processing_report', params: { retentionDays: 90 } },
    ],
    status: 'active',
    executionPolicy: { maxHops: 3, timeoutMs: 5000, preventLoops: true },
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    version: 1,
    createdBy: 'usr-admin-system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

