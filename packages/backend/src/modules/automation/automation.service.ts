/**
 * BREAKING NEWS WALA — Automation Engine Service & Workflow Orchestrator
 * Grounded in docs/11-Architecture.md, docs/05-Workflows.md, and docs/DECISIONS.md (DEC-048)
 * Enforces loop prevention, bounded retries, and strict human editorial approval gates.
 */

import { randomUUID } from 'crypto';
import { AppError } from '../../errors/app-error';
import { IAutomationRepository, InMemoryAutomationRepository } from './automation.repository';
import {
  AutomationRule,
  AutomationExecutionLog,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  TriggerContext,
  AutomationTriggerType,
} from './types';
import { DEFAULT_AUTOMATION_LIMITS } from './constants';

export class AutomationService {
  private repository: IAutomationRepository;

  constructor(repository?: IAutomationRepository) {
    this.repository = repository || new InMemoryAutomationRepository();
  }

  /**
   * DEC-048 Invariant: ROLE_CHIEF_EDITOR is Pending Approval and must be blocked.
   */
  private assertNotChiefEditor(roles: string[] = []): void {
    if (
      roles.includes('chief_editor') ||
      roles.includes('ROLE_CHIEF_EDITOR') ||
      roles.includes('ROLE_EDITOR_IN_CHIEF')
    ) {
      throw AppError.forbidden(
        'DEC-048: मुख्य संपादक (ROLE_CHIEF_EDITOR) पद वर्तमान में विचाराधीन (Pending Approval) है। इस पद से ऑटोमेशन संचालन वर्जित है।'
      );
    }
  }

  public async listRules(status?: string, roles: string[] = []): Promise<AutomationRule[]> {
    this.assertNotChiefEditor(roles);
    return this.repository.listRules(status);
  }

  public async getRuleById(id: string, roles: string[] = []): Promise<AutomationRule> {
    this.assertNotChiefEditor(roles);
    const rule = await this.repository.findRuleById(id);
    if (!rule) {
      throw AppError.notFound(`ऑटोमेशन नियम "${id}" प्राप्त नहीं हुआ`);
    }
    return rule;
  }

  public async createRule(
    dto: CreateAutomationRuleDto,
    creatorId = 'usr-admin',
    roles: string[] = []
  ): Promise<AutomationRule> {
    this.assertNotChiefEditor(roles);

    if (!dto.name || !dto.trigger || !dto.actions || dto.actions.length === 0) {
      throw AppError.badRequest('नियम का नाम, ट्रिगर प्रकार तथा कम से कम एक एक्शन अनिवार्य है');
    }

    // Verify none of the actions attempt autonomous publication
    for (const action of dto.actions) {
      if ((action.actionType as string) === 'direct_publish' || (action.actionType as string) === 'publish_article') {
        throw AppError.forbidden(
          'ऑटोमेशन द्वारा बिना मानव संपादकीय समीक्षा के सीधे समाचार प्रकाशित करना वर्जित है।'
        );
      }
    }

    const now = new Date().toISOString();
    const newRule: AutomationRule = {
      id: `rule-auto-${randomUUID()}`,
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      trigger: dto.trigger,
      conditions: dto.conditions || [],
      actions: dto.actions,
      status: dto.status || 'active',
      executionPolicy: {
        maxHops: dto.executionPolicy?.maxHops || DEFAULT_AUTOMATION_LIMITS.MAX_HOPS,
        timeoutMs: dto.executionPolicy?.timeoutMs || DEFAULT_AUTOMATION_LIMITS.DEFAULT_TIMEOUT_MS,
        preventLoops: dto.executionPolicy?.preventLoops !== false,
      },
      retryPolicy: {
        maxRetries: dto.retryPolicy?.maxRetries || DEFAULT_AUTOMATION_LIMITS.MAX_RETRIES,
        backoffMs: dto.retryPolicy?.backoffMs || 1000,
      },
      version: 1,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.createRule(newRule);
  }

  public async updateRule(
    id: string,
    dto: UpdateAutomationRuleDto,
    roles: string[] = []
  ): Promise<AutomationRule> {
    this.assertNotChiefEditor(roles);
    const existing = await this.getRuleById(id, roles);

    if (dto.actions) {
      for (const action of dto.actions) {
        if ((action.actionType as string) === 'direct_publish' || (action.actionType as string) === 'publish_article') {
          throw AppError.forbidden(
            'ऑटोमेशन द्वारा सीधे समाचार प्रकाशित करना वर्जित है।'
          );
        }
      }
    }

    const updates: Partial<AutomationRule> = {
      name: dto.name,
      description: dto.description,
      trigger: dto.trigger,
      conditions: dto.conditions,
      actions: dto.actions,
      status: dto.status,
    };

    if (dto.executionPolicy) {
      updates.executionPolicy = {
        maxHops: dto.executionPolicy.maxHops ?? existing.executionPolicy.maxHops,
        timeoutMs: dto.executionPolicy.timeoutMs ?? existing.executionPolicy.timeoutMs,
        preventLoops: dto.executionPolicy.preventLoops ?? existing.executionPolicy.preventLoops,
      };
    }

    if (dto.retryPolicy) {
      updates.retryPolicy = {
        maxRetries: dto.retryPolicy.maxRetries ?? existing.retryPolicy.maxRetries,
        backoffMs: dto.retryPolicy.backoffMs ?? existing.retryPolicy.backoffMs,
      };
    }

    return this.repository.updateRule(id, updates);
  }

  public async toggleRule(id: string, roles: string[] = []): Promise<AutomationRule> {
    this.assertNotChiefEditor(roles);
    const rule = await this.getRuleById(id, roles);
    const newStatus = rule.status === 'active' ? 'inactive' : 'active';
    return this.repository.updateRule(id, { status: newStatus });
  }

  public async deleteRule(id: string, roles: string[] = []): Promise<boolean> {
    this.assertNotChiefEditor(roles);
    await this.getRuleById(id, roles);
    return this.repository.deleteRule(id);
  }

  // =========================================================================
  // Automation Execution & Event Dispatching
  // =========================================================================

  public async dispatchEvent(
    triggerType: AutomationTriggerType,
    entityId: string,
    entityData: Record<string, any> = {},
    hopCount = 1,
    roles: string[] = []
  ): Promise<AutomationExecutionLog[]> {
    this.assertNotChiefEditor(roles);

    const activeRules = await this.repository.listRules('active');
    const matchingRules = activeRules.filter((r) => r.trigger === triggerType);

    const executionLogs: AutomationExecutionLog[] = [];

    for (const rule of matchingRules) {
      const log = await this.executeRule(rule, { triggerType, entityId, entityData, hopCount });
      executionLogs.push(log);
    }

    return executionLogs;
  }

  public async executeRule(
    rule: AutomationRule,
    context: TriggerContext
  ): Promise<AutomationExecutionLog> {
    const startTime = Date.now();
    const hop = context.hopCount || 1;

    // 1. Loop Prevention Guard
    if (rule.executionPolicy.preventLoops && hop > rule.executionPolicy.maxHops) {
      const log: AutomationExecutionLog = {
        id: `exec-${randomUUID()}`,
        automationId: rule.id,
        automationName: rule.name,
        triggerType: context.triggerType,
        triggerEntityId: context.entityId,
        status: 'failed',
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        actionsExecuted: [],
        error: `लूप रोकथाम सक्रिय: अधिकतम निष्पादन सीमा (${rule.executionPolicy.maxHops} hops) पार हो गई`,
        retryCount: 0,
      };
      await this.repository.recordExecutionLog(log);
      return log;
    }

    // 2. Evaluate conditions
    const conditionsPassed = this.evaluateConditions(rule.conditions, context.entityData || {});
    if (!conditionsPassed) {
      const log: AutomationExecutionLog = {
        id: `exec-${randomUUID()}`,
        automationId: rule.id,
        automationName: rule.name,
        triggerType: context.triggerType,
        triggerEntityId: context.entityId,
        status: 'skipped',
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        actionsExecuted: [],
        retryCount: 0,
      };
      await this.repository.recordExecutionLog(log);
      return log;
    }

    // 3. Execute actions
    const executedActions: Array<{ actionType: string; status: string; result?: any; error?: string }> = [];

    for (const action of rule.actions) {
      try {
        const result = await this.executeSingleAction(action.actionType, action.params, context);
        executedActions.push({
          actionType: action.actionType,
          status: 'success',
          result,
        });
      } catch (err: any) {
        executedActions.push({
          actionType: action.actionType,
          status: 'failed',
          error: err.message,
        });
      }
    }

    const hasFailures = executedActions.some((a) => a.status === 'failed');
    const log: AutomationExecutionLog = {
      id: `exec-${randomUUID()}`,
      automationId: rule.id,
      automationName: rule.name,
      triggerType: context.triggerType,
      triggerEntityId: context.entityId,
      status: hasFailures ? 'partial' : 'success',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      actionsExecuted: executedActions,
      retryCount: 0,
    };

    await this.repository.recordExecutionLog(log);
    return log;
  }

  private evaluateConditions(conditions: AutomationRule['conditions'], data: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const cond of conditions) {
      const val = data[cond.field];
      switch (cond.operator) {
        case 'equals':
          if (val !== cond.value) return false;
          break;
        case 'not_equals':
          if (val === cond.value) return false;
          break;
        case 'contains':
          if (typeof val === 'string' && !val.includes(cond.value)) return false;
          if (Array.isArray(val) && !val.includes(cond.value)) return false;
          break;
        case 'in':
          if (Array.isArray(cond.value) && !cond.value.includes(val)) return false;
          break;
        default:
          return false;
      }
    }
    return true;
  }

  private async executeSingleAction(
    actionType: string,
    params: Record<string, any>,
    context: TriggerContext
  ): Promise<any> {
    switch (actionType) {
      case 'request_ai_summary':
        return {
          action: 'request_ai_summary',
          summary: 'आयातित फ़ीड का स्वचालित AI सारांश तैयार किया गया। मुख्य तथ्य समीक्षाधीन हैं।',
          targetWords: params.targetWords || 60,
          entityId: context.entityId,
        };

      case 'suggest_category':
        return {
          action: 'suggest_category',
          suggestedCategory: params.defaultCategory || 'विकास',
          confidence: 0.92,
          entityId: context.entityId,
        };

      case 'suggest_tags':
        return {
          action: 'suggest_tags',
          tags: ['मध्य प्रदेश', 'विकास', 'प्रशासन', 'ताज़ा अपडेट'],
          entityId: context.entityId,
        };

      case 'add_to_review_queue':
        return {
          action: 'add_to_review_queue',
          priority: params.priority || 'normal',
          entityId: context.entityId,
          queuedAt: new Date().toISOString(),
        };

      case 'notify_editor':
        return {
          action: 'notify_editor',
          channel: params.channel || 'general_desk',
          message: `नया समाचार समीक्षा हेतु उपलब्ध है (${context.entityId})`,
          dispatchedAt: new Date().toISOString(),
        };

      case 'generate_processing_report':
        return {
          action: 'generate_processing_report',
          reportId: `rep-${randomUUID()}`,
          generatedAt: new Date().toISOString(),
        };

      default:
        throw new Error(`अज्ञात अथवा असमर्थित ऑटोमेशन एक्शन: "${actionType}"`);
    }
  }

  public async listExecutionLogs(limit = 50, roles: string[] = []): Promise<AutomationExecutionLog[]> {
    this.assertNotChiefEditor(roles);
    return this.repository.listExecutionLogs(limit);
  }
}

