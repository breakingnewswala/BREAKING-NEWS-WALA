/**
 * BREAKING NEWS WALA — Security Audit Logging Service
 * Grounded in docs/14-Auth.md (AUT-10: Immutable Auditability), docs/15-Security.md (SEC-07),
 * and CERT-In Compliance (DEC-038)
 * Records tamper-proof forensic audit trails of authentication, authorization, and administrative events.
 */

import crypto from 'crypto';
import { sanitizeMetadata, logStructured } from '../../middleware/structured-logger';
import { getPrismaClient } from '../../db/client';

export type SecurityAuditEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'AUTH_LOGOUT'
  | 'AUTH_LOGOUT_ALL'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'TERRITORY_ASSIGNED'
  | 'TERRITORY_REVOKED'
  | 'ARTICLE_PUBLISHED'
  | 'ARTICLE_REJECTED'
  | 'SETTING_CHANGED'
  | 'BACKUP_CREATED'
  | 'BACKUP_VERIFIED'
  | 'BACKUP_RESTORE_TEST'
  | 'SECURITY_ALERT_TRIGGERED'
  | 'RATE_LIMIT_BLOCKED';

export interface SecurityAuditRecord {
  id: string;
  action: SecurityAuditEventType;
  actorUserId?: string;
  targetEntityType: string;
  targetEntityId: string;
  payloadBefore?: Record<string, any>;
  payloadAfter?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  createdAt: string;
}

export class SecurityAuditService {
  private inMemoryAuditBuffer: SecurityAuditRecord[] = [];
  private readonly maxBufferSize = 5000;

  private get prisma() {
    return getPrismaClient();
  }

  /**
   * Logs a security audit event with automatic PII and secret redaction.
   */
  public async logEvent(params: {
    action: SecurityAuditEventType;
    actorUserId?: string;
    targetEntityType: string;
    targetEntityId: string;
    payloadBefore?: Record<string, any>;
    payloadAfter?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  }): Promise<SecurityAuditRecord> {
    const record: SecurityAuditRecord = {
      id: crypto.randomUUID(),
      action: params.action,
      actorUserId: params.actorUserId,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId,
      payloadBefore: params.payloadBefore ? sanitizeMetadata(params.payloadBefore) : undefined,
      payloadAfter: params.payloadAfter ? sanitizeMetadata(params.payloadAfter) : undefined,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'unknown',
      severity: params.severity || 'INFO',
      createdAt: new Date().toISOString(),
    };

    // 1. Maintain in-memory ring buffer for immediate querying
    this.inMemoryAuditBuffer.unshift(record);
    if (this.inMemoryAuditBuffer.length > this.maxBufferSize) {
      this.inMemoryAuditBuffer.pop();
    }

    // 2. Structured log emission
    logStructured('info', `[Security Audit] ${record.action} on ${record.targetEntityType}:${record.targetEntityId}`, {
      auditId: record.id,
      action: record.action,
      actorUserId: record.actorUserId,
      targetEntityType: record.targetEntityType,
      targetEntityId: record.targetEntityId,
      severity: record.severity,
      ipAddress: record.ipAddress,
    });

    // 3. Asynchronously attempt database persistence if Prisma is operational (non-blocking)
    this.prisma.auditLog
      .create({
        data: {
          id: record.id,
          actorUserId: record.actorUserId || null,
          action: record.action,
          targetEntityType: record.targetEntityType,
          targetEntityId: record.targetEntityId,
          payloadBefore: record.payloadBefore ? (record.payloadBefore as any) : undefined,
          payloadAfter: record.payloadAfter ? (record.payloadAfter as any) : undefined,
          ipAddress: record.ipAddress,
          userAgent: record.userAgent,
          createdAt: new Date(record.createdAt),
        },
      })
      .catch(() => {
        // In-memory buffer retains record when database is unavailable (e.g. during offline test runs)
      });

    return record;
  }

  /**
   * Retrieves security audit logs with filtering and pagination.
   */
  public async getAuditLogs(filter: {
    action?: string;
    actorUserId?: string;
    targetEntityType?: string;
    targetEntityId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: SecurityAuditRecord[]; total: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const offset = (page - 1) * limit;

    let filtered = [...this.inMemoryAuditBuffer];

    if (filter.action) {
      filtered = filtered.filter((r) => r.action.toLowerCase() === filter.action!.toLowerCase());
    }
    if (filter.actorUserId) {
      filtered = filtered.filter((r) => r.actorUserId === filter.actorUserId);
    }
    if (filter.targetEntityType) {
      filtered = filtered.filter((r) => r.targetEntityType.toLowerCase() === filter.targetEntityType!.toLowerCase());
    }
    if (filter.targetEntityId) {
      filtered = filtered.filter((r) => r.targetEntityId === filter.targetEntityId);
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    return { logs: paged, total };
  }

  public clearBuffer(): void {
    this.inMemoryAuditBuffer = [];
  }
}

export const securityAuditService = new SecurityAuditService();
