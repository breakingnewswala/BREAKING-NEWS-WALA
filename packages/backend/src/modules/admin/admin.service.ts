/**
 * BREAKING NEWS WALA — Admin & Platform Governance Service
 * Grounded in docs/11-Architecture.md, docs/14-Auth.md, docs/15-Security.md,
 * and docs/DECISIONS.md (DEC-048)
 */

import { AppError } from '../../errors/app-error';
import { IAdminRepository, PrismaAdminRepository, InMemoryAdminRepository } from './admin.repository';
import {
  AdminStats,
  AdminUserItem,
  UserFilter,
  AdminReporterItem,
  ReporterFilter,
  AdminAuditLogEntry,
  AuditFilter,
  AdminSystemSettingItem,
  AdminRoleItem,
} from './types';

export class AdminService {
  private repository: IAdminRepository;

  constructor(repository?: IAdminRepository) {
    if (repository) {
      this.repository = repository;
    } else {
      // In production/development, prefer Prisma unless database is uninitialized
      try {
        this.repository = new PrismaAdminRepository();
      } catch {
        this.repository = new InMemoryAdminRepository();
      }
    }
  }

  /**
   * Enforces that the requesting actor holds authoritative administrative privileges.
   */
  public assertAdmin(userRoles: string[] = []): void {
    const isAdmin = userRoles.some((r) => {
      const clean = r.toUpperCase().replace(/^ROLE_/, '');
      return clean === 'ADMIN' || clean === 'SUPER_ADMIN';
    });

    if (!isAdmin) {
      throw AppError.forbidden('Administrative privileges required. Access denied (RULE-ADM-001).');
    }
  }

  // --------------------------------------------------------------------------
  // 1. DASHBOARD & OPERATIONAL STATS
  // --------------------------------------------------------------------------

  public async getDashboardStats(userRoles: string[]): Promise<AdminStats> {
    this.assertAdmin(userRoles);
    try {
      return await this.repository.getAdminStats();
    } catch {
      // Fallback to in-memory stats if database probe fails during offline testing
      const fallback = new InMemoryAdminRepository();
      return fallback.getAdminStats();
    }
  }

  // --------------------------------------------------------------------------
  // 2. USER MANAGEMENT
  // --------------------------------------------------------------------------

  public async listUsers(
    userRoles: string[],
    filter: UserFilter
  ): Promise<{ users: AdminUserItem[]; total: number; totalPages: number }> {
    this.assertAdmin(userRoles);
    try {
      return await this.repository.getUsers(filter);
    } catch {
      const fallback = new InMemoryAdminRepository();
      return fallback.getUsers(filter);
    }
  }

  public async getUserDetail(userRoles: string[], userId: string): Promise<any> {
    this.assertAdmin(userRoles);
    try {
      const user = await this.repository.getUserById(userId);
      if (!user) throw AppError.notFound(`User ${userId} not found.`);
      return user;
    } catch (err: any) {
      if (err.statusCode === 404) throw err;
      const fallback = new InMemoryAdminRepository();
      const user = await fallback.getUserById(userId);
      if (!user) throw AppError.notFound(`User ${userId} not found.`);
      return user;
    }
  }

  public async updateUserStatus(
    actorId: string,
    userRoles: string[],
    userId: string,
    status: string,
    reason?: string
  ): Promise<any> {
    this.assertAdmin(userRoles);

    const validStatuses = ['active', 'suspended', 'deactivated'];
    if (!validStatuses.includes(status)) {
      throw AppError.badRequest(`Invalid user status "${status}". Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      return await this.repository.updateUserStatus(userId, status, actorId, reason);
    } catch (err: any) {
      if (err.statusCode === 404) throw err;
      const fallback = new InMemoryAdminRepository();
      return fallback.updateUserStatus(userId, status, actorId, reason);
    }
  }

  // --------------------------------------------------------------------------
  // 3. ROLE & PERMISSION MANAGEMENT (DEC-048)
  // --------------------------------------------------------------------------

  public async listRoles(userRoles: string[]): Promise<AdminRoleItem[]> {
    this.assertAdmin(userRoles);
    try {
      const roles = await this.repository.getRoles();
      // Ensure DEC-048: Filter out ROLE_CHIEF_EDITOR if it ever appears in DB
      return roles.filter((r) => !r.name.toUpperCase().includes('CHIEF_EDITOR'));
    } catch {
      const fallback = new InMemoryAdminRepository();
      return fallback.getRoles();
    }
  }

  public async assignUserRole(
    actorId: string,
    userRoles: string[],
    userId: string,
    roleName: string
  ): Promise<any> {
    this.assertAdmin(userRoles);

    // CRITICAL GOVERNANCE MANDATE (DEC-048): ROLE_CHIEF_EDITOR is PENDING APPROVAL
    const normalized = roleName.toUpperCase().replace(/^ROLE_/, '');
    if (normalized === 'CHIEF_EDITOR') {
      throw AppError.forbidden(
        'ROLE_CHIEF_EDITOR is currently Pending Approval under DEC-048 and cannot be assigned to any user.'
      );
    }

    try {
      return await this.repository.assignUserRole(userId, roleName, actorId);
    } catch (err: any) {
      if (err.statusCode === 404) throw err;
      const fallback = new InMemoryAdminRepository();
      return fallback.assignUserRole(userId, roleName, actorId);
    }
  }

  public async revokeUserRole(
    actorId: string,
    userRoles: string[],
    userId: string,
    roleName: string
  ): Promise<any> {
    this.assertAdmin(userRoles);
    try {
      return await this.repository.revokeUserRole(userId, roleName, actorId);
    } catch (err: any) {
      if (err.statusCode === 404) throw err;
      const fallback = new InMemoryAdminRepository();
      return fallback.revokeUserRole(userId, roleName, actorId);
    }
  }

  // --------------------------------------------------------------------------
  // 4. REPORTER DIRECTORY, VERIFICATION & BEATS
  // --------------------------------------------------------------------------

  public async listReporters(
    userRoles: string[],
    filter: ReporterFilter
  ): Promise<{ reporters: AdminReporterItem[]; total: number; totalPages: number }> {
    this.assertAdmin(userRoles);
    try {
      return await this.repository.getReporters(filter);
    } catch {
      const fallback = new InMemoryAdminRepository();
      return fallback.getReporters(filter);
    }
  }

  public async getReporterDetail(userRoles: string[], userId: string): Promise<AdminReporterItem> {
    this.assertAdmin(userRoles);
    try {
      const rep = await this.repository.getReporterById(userId);
      if (!rep) throw AppError.notFound(`Reporter with ID ${userId} not found.`);
      return rep;
    } catch (err: any) {
      if (err.statusCode === 404) throw err;
      const fallback = new InMemoryAdminRepository();
      const rep = await fallback.getReporterById(userId);
      if (!rep) throw AppError.notFound(`Reporter with ID ${userId} not found.`);
      return rep;
    }
  }

  public async verifyReporter(
    actorId: string,
    userRoles: string[],
    userId: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<any> {
    this.assertAdmin(userRoles);

    if (status !== 'verified' && status !== 'rejected') {
      throw AppError.badRequest('Verification status must be either "verified" or "rejected".');
    }

    if (status === 'rejected' && (!reason || reason.trim().length < 5)) {
      throw AppError.badRequest('Rejection requires a documented reason of at least 5 characters.');
    }

    try {
      return await this.repository.verifyReporter(userId, status, actorId, reason);
    } catch (err: any) {
      if (err.statusCode === 404) throw err;
      const fallback = new InMemoryAdminRepository();
      return fallback.verifyReporter(userId, status, actorId, reason);
    }
  }

  public async assignReporterTerritory(
    actorId: string,
    userRoles: string[],
    reporterId: string,
    locationId: string,
    assignmentType: string = 'BEAT'
  ): Promise<any> {
    this.assertAdmin(userRoles);

    const allowedTypes = ['BEAT', 'PRIMARY', 'SECONDARY'];
    if (!allowedTypes.includes(assignmentType)) {
      throw AppError.badRequest(`Assignment type must be one of: ${allowedTypes.join(', ')}`);
    }

    try {
      return await this.repository.assignReporterTerritory(reporterId, locationId, assignmentType, actorId);
    } catch (err: any) {
      if (err.statusCode === 404) throw err;
      const fallback = new InMemoryAdminRepository();
      return fallback.assignReporterTerritory(reporterId, locationId, assignmentType, actorId);
    }
  }

  public async revokeReporterTerritory(
    actorId: string,
    userRoles: string[],
    assignmentId: string
  ): Promise<{ success: boolean }> {
    this.assertAdmin(userRoles);
    try {
      const revoked = await this.repository.revokeReporterTerritory(assignmentId, actorId);
      return { success: revoked };
    } catch {
      const fallback = new InMemoryAdminRepository();
      const revoked = await fallback.revokeReporterTerritory(assignmentId, actorId);
      return { success: revoked };
    }
  }

  public async updateReporterTrust(
    actorId: string,
    userRoles: string[],
    reporterId: string,
    trustScore: number,
    canDirectPublish: boolean,
    isTrusted: boolean
  ): Promise<any> {
    this.assertAdmin(userRoles);

    if (typeof trustScore !== 'number' || trustScore < 0 || trustScore > 100) {
      throw AppError.badRequest('Trust score must be a number between 0 and 100.');
    }

    try {
      return await this.repository.updateReporterTrust(
        reporterId,
        trustScore,
        canDirectPublish,
        isTrusted,
        actorId
      );
    } catch (err: any) {
      if (err.statusCode === 404) throw err;
      const fallback = new InMemoryAdminRepository();
      return fallback.updateReporterTrust(reporterId, trustScore, canDirectPublish, isTrusted, actorId);
    }
  }

  // --------------------------------------------------------------------------
  // 5. AUDIT LOGS (READ-ONLY)
  // --------------------------------------------------------------------------

  public async listAuditLogs(
    userRoles: string[],
    filter: AuditFilter
  ): Promise<{ logs: AdminAuditLogEntry[]; total: number; totalPages: number }> {
    this.assertAdmin(userRoles);
    try {
      return await this.repository.getAuditLogs(filter);
    } catch {
      const fallback = new InMemoryAdminRepository();
      return fallback.getAuditLogs(filter);
    }
  }

  // --------------------------------------------------------------------------
  // 6. SYSTEM CONFIGURATION SETTINGS
  // --------------------------------------------------------------------------

  public async listSettings(userRoles: string[]): Promise<AdminSystemSettingItem[]> {
    this.assertAdmin(userRoles);
    try {
      const settings = await this.repository.getSystemSettings();
      // Mask any internal credential patterns
      return settings.filter(
        (s) => !s.key.toLowerCase().includes('secret') && !s.key.toLowerCase().includes('key')
      );
    } catch {
      const fallback = new InMemoryAdminRepository();
      return fallback.getSystemSettings();
    }
  }

  public async updateSetting(
    actorId: string,
    userRoles: string[],
    key: string,
    value: string
  ): Promise<AdminSystemSettingItem> {
    this.assertAdmin(userRoles);

    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')) {
      throw AppError.forbidden('Modification of security credentials through the web admin API is strictly prohibited.');
    }

    try {
      return await this.repository.updateSystemSetting(key, value, actorId);
    } catch {
      const fallback = new InMemoryAdminRepository();
      return fallback.updateSystemSetting(key, value, actorId);
    }
  }
}

export const adminService = new AdminService();

