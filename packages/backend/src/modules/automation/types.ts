/**
 * BREAKING NEWS WALA — Automation Engine Types & DTOs
 * Grounded in docs/11-Architecture.md and docs/13-API.md
 */

import type {
  AutomationRule,
  AutomationTriggerType,
  AutomationActionType,
  AutomationCondition,
  AutomationActionConfig,
  AutomationExecutionLog,
} from '@bnw/types';

export type {
  AutomationRule,
  AutomationTriggerType,
  AutomationActionType,
  AutomationCondition,
  AutomationActionConfig,
  AutomationExecutionLog,
};

export interface CreateAutomationRuleDto {
  name: string;
  description: string;
  trigger: AutomationTriggerType;
  conditions?: AutomationCondition[];
  actions: AutomationActionConfig[];
  status?: 'active' | 'inactive' | 'paused';
  executionPolicy?: {
    maxHops?: number;
    timeoutMs?: number;
    preventLoops?: boolean;
  };
  retryPolicy?: {
    maxRetries?: number;
    backoffMs?: number;
  };
}

export interface UpdateAutomationRuleDto {
  name?: string;
  description?: string;
  trigger?: AutomationTriggerType;
  conditions?: AutomationCondition[];
  actions?: AutomationActionConfig[];
  status?: 'active' | 'inactive' | 'paused';
  executionPolicy?: {
    maxHops?: number;
    timeoutMs?: number;
    preventLoops?: boolean;
  };
  retryPolicy?: {
    maxRetries?: number;
    backoffMs?: number;
  };
}

export interface TriggerContext {
  triggerType: AutomationTriggerType;
  entityId: string;
  entityData?: Record<string, any>;
  hopCount?: number;
}

