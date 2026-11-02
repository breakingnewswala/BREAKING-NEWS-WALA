/**
 * BREAKING NEWS WALA — Automation Repository & Persistence Layer
 * Grounded in docs/11-Architecture.md and docs/12-Database.md
 */

import {
  AutomationRule,
  AutomationExecutionLog,
} from './types';
import { CANONICAL_SEED_AUTOMATION_RULES } from './constants';

export interface IAutomationRepository {
  listRules(status?: string): Promise<AutomationRule[]>;
  findRuleById(id: string): Promise<AutomationRule | null>;
  createRule(rule: AutomationRule): Promise<AutomationRule>;
  updateRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule>;
  deleteRule(id: string): Promise<boolean>;

  recordExecutionLog(log: AutomationExecutionLog): Promise<AutomationExecutionLog>;
  listExecutionLogs(limit?: number): Promise<AutomationExecutionLog[]>;
}

export class InMemoryAutomationRepository implements IAutomationRepository {
  private rules: Map<string, AutomationRule> = new Map();
  private logs: AutomationExecutionLog[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    for (const rule of CANONICAL_SEED_AUTOMATION_RULES) {
      this.rules.set(rule.id, { ...rule });
    }
  }

  public async listRules(status?: string): Promise<AutomationRule[]> {
    let list = Array.from(this.rules.values());
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    return list;
  }

  public async findRuleById(id: string): Promise<AutomationRule | null> {
    return this.rules.get(id) || null;
  }

  public async createRule(rule: AutomationRule): Promise<AutomationRule> {
    this.rules.set(rule.id, rule);
    return rule;
  }

  public async updateRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const existing = this.rules.get(id);
    if (!existing) {
      throw new Error(`Automation rule "${id}" does not exist`);
    }
    const updated: AutomationRule = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.rules.set(id, updated);
    return updated;
  }

  public async deleteRule(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }

  public async recordExecutionLog(log: AutomationExecutionLog): Promise<AutomationExecutionLog> {
    this.logs.unshift(log);
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }
    return log;
  }

  public async listExecutionLogs(limit = 50): Promise<AutomationExecutionLog[]> {
    return this.logs.slice(0, limit);
  }
}

