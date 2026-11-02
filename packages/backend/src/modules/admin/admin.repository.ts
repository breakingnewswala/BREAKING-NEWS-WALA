/**
 * BREAKING NEWS WALA — Admin Subsystem Repository Layer
 * Grounded in docs/11-Architecture.md, docs/12-Database.md, and docs/DECISIONS.md (DEC-017, DEC-018)
 */

import { getPrismaClient } from '../../db/client';
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
import { AppError } from '../../errors/app-error';

export interface IAdminRepository {
  getAdminStats(): Promise<AdminStats>;
  getUsers(filter: UserFilter): Promise<{ users: AdminUserItem[]; total: number; totalPages: number }>;
  getUserById(id: string): Promise<any | null>;
  updateUserStatus(id: string, status: string, actorId: string, reason?: string): Promise<any>;
  assignUserRole(userId: string, roleName: string, actorId: string): Promise<any>;
  revokeUserRole(userId: string, roleName: string, actorId: string): Promise<any>;
  getRoles(): Promise<AdminRoleItem[]>;
  getReporters(filter: ReporterFilter): Promise<{ reporters: AdminReporterItem[]; total: number; totalPages: number }>;
  getReporterById(userId: string): Promise<AdminReporterItem | null>;
  verifyReporter(userId: string, status: 'verified' | 'rejected', actorId: string, reason?: string): Promise<any>;
  assignReporterTerritory(reporterId: string, locationId: string, assignmentType: string, actorId: string): Promise<any>;
  revokeReporterTerritory(assignmentId: string, actorId: string): Promise<boolean>;
  updateReporterTrust(reporterId: string, trustScore: number, canDirectPublish: boolean, isTrusted: boolean, actorId: string): Promise<any>;
  getAuditLogs(filter: AuditFilter): Promise<{ logs: AdminAuditLogEntry[]; total: number; totalPages: number }>;
  recordAuditLog(entry: Omit<AdminAuditLogEntry, 'id' | 'createdAt'>): Promise<AdminAuditLogEntry>;
  getSystemSettings(): Promise<AdminSystemSettingItem[]>;
  updateSystemSetting(key: string, value: string, actorId: string): Promise<AdminSystemSettingItem>;
}

export class PrismaAdminRepository implements IAdminRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async getAdminStats(): Promise<AdminStats> {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      deactivatedUsers,
      totalReporters,
      activeReporters,
      pendingReporters,
      totalArticles,
      publishedArticles,
      underReviewArticles,
      pendingArticles,
      rejectedArticles,
      assignments,
      recentAudits,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { status: 'suspended' } }),
      this.prisma.user.count({ where: { status: 'deactivated' } }),
      this.prisma.reporterProfile.count(),
      this.prisma.reporterProfile.count({ where: { verificationStatus: 'verified' } }),
      this.prisma.reporterProfile.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.newsArticle.count(),
      this.prisma.newsArticle.count({ where: { status: 'published' } }),
      this.prisma.newsArticle.count({ where: { status: 'under_review' } }),
      this.prisma.newsArticle.count({ where: { status: 'pending_review' } }),
      this.prisma.newsArticle.count({ where: { status: 'rejected' } }),
      this.prisma.reporterTerritoryAssignment.groupBy({
        by: ['locationId'],
        where: { status: 'active' },
      }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, profile: { select: { fullName: true } } } },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      deactivatedUsers,
      totalReporters,
      activeReporters,
      pendingReporters,
      totalArticles,
      publishedArticles,
      underReviewArticles,
      pendingArticles,
      rejectedArticles,
      districtCoverageCount: assignments.length,
      systemHealth: {
        database: true,
        redis: true,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      recentAuditActions: recentAudits.map((a: any) => ({
        id: a.id,
        actorUserId: a.actorUserId,
        actorName: a.actor?.profile?.fullName || 'सिस्टम',
        action: a.action,
        targetEntityType: a.targetEntityType,
        targetEntityId: a.targetEntityId,
        payloadBefore: a.payloadBefore,
        payloadAfter: a.payloadAfter,
        ipAddress: a.ipAddress,
        userAgent: a.userAgent,
        createdAt: a.createdAt,
      })),
    };
  }

  public async getUsers(filter: UserFilter): Promise<{ users: AdminUserItem[]; total: number; totalPages: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status && filter.status !== 'all') {
      where.status = filter.status;
    }
    if (filter.search) {
      where.OR = [
        { email: { contains: filter.search, mode: 'insensitive' } },
        { phoneNumber: { contains: filter.search } },
        { profile: { fullName: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }
    if (filter.role && filter.role !== 'all') {
      where.userRoles = {
        some: {
          role: { name: filter.role },
        },
      };
    }

    const [total, records] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: { select: { fullName: true } },
          userRoles: { include: { role: true } },
          reporterProfile: true,
        },
      }),
    ]);

    const users: AdminUserItem[] = records.map((u: any) => ({
      id: u.id,
      phoneNumber: u.phoneNumber,
      email: u.email,
      fullName: u.profile?.fullName || 'उपयोगकर्ता',
      roles: u.userRoles.map((ur: any) => ur.role.name),
      status: u.status,
      createdAt: u.createdAt,
      reporterProfile: u.reporterProfile
        ? {
            reporterCode: u.reporterProfile.reporterCode,
            verificationStatus: u.reporterProfile.verificationStatus,
            isTrustedReporter: u.reporterProfile.isTrustedReporter,
            trustScore: u.reporterProfile.trustScore,
          }
        : null,
    }));

    return {
      users,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async getUserById(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userRoles: { include: { role: true } },
        reporterProfile: {
          include: {
            territoryAssignments: {
              include: { location: true },
            },
          },
        },
        authoredArticles: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, status: true, createdAt: true },
        },
      },
    });
  }

  public async updateUserStatus(id: string, status: string, actorId: string, reason?: string): Promise<any> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('User not found.');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: { profile: true },
    });

    await this.recordAuditLog({
      actorUserId: actorId,
      action: `USER_STATUS_${status.toUpperCase()}`,
      targetEntityType: 'USER',
      targetEntityId: id,
      payloadBefore: { status: existing.status },
      payloadAfter: { status, reason },
      ipAddress: '127.0.0.1',
    });

    return updated;
  }

  public async assignUserRole(userId: string, roleName: string, actorId: string): Promise<any> {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw AppError.notFound(`Role "${roleName}" not found.`);

    const userRole = await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {
        assignedBy: actorId,
        assignedAt: new Date(),
      },
      create: {
        userId,
        roleId: role.id,
        assignedBy: actorId,
      },
    });

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'USER_ROLE_ASSIGNED',
      targetEntityType: 'USER',
      targetEntityId: userId,
      payloadAfter: { roleName, roleId: role.id },
      ipAddress: '127.0.0.1',
    });

    return userRole;
  }

  public async revokeUserRole(userId: string, roleName: string, actorId: string): Promise<any> {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw AppError.notFound(`Role "${roleName}" not found.`);

    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'USER_ROLE_REVOKED',
      targetEntityType: 'USER',
      targetEntityId: userId,
      payloadBefore: { roleName, roleId: role.id },
      ipAddress: '127.0.0.1',
    });

    return { success: true };
  }

  public async getRoles(): Promise<AdminRoleItem[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return roles.map((r: any) => ({
      id: r.id,
      name: r.name,
      displayName: r.displayName,
      isSystem: r.isSystem,
      permissions: r.rolePermissions.map((rp: any) => rp.permission.code),
    }));
  }

  public async getReporters(filter: ReporterFilter): Promise<{ reporters: AdminReporterItem[]; total: number; totalPages: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status && filter.status !== 'all') {
      where.verificationStatus = filter.status;
    }
    if (filter.search) {
      where.OR = [
        { reporterCode: { contains: filter.search, mode: 'insensitive' } },
        { pressIdCardNumber: { contains: filter.search, mode: 'insensitive' } },
        { user: { profile: { fullName: { contains: filter.search, mode: 'insensitive' } } } },
      ];
    }
    if (filter.districtId) {
      where.territoryAssignments = {
        some: {
          locationId: filter.districtId,
          status: 'active',
        },
      };
    }

    const [total, records] = await Promise.all([
      this.prisma.reporterProfile.count({ where }),
      this.prisma.reporterProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user: { createdAt: 'desc' } },
        include: {
          user: {
            include: { profile: true },
          },
          territoryAssignments: {
            where: { status: 'active' },
            include: { location: true },
          },
        },
      }),
    ]);

    const reporters: AdminReporterItem[] = records.map((r: any) => ({
      userId: r.userId,
      reporterCode: r.reporterCode,
      fullName: r.user.profile?.fullName || 'संवाददाता',
      phoneNumber: r.user.phoneNumber,
      email: r.user.email,
      pressIdCardNumber: r.pressIdCardNumber,
      verificationStatus: r.verificationStatus,
      isTrustedReporter: r.isTrustedReporter,
      canDirectPublish: r.canDirectPublish,
      trustScore: r.trustScore,
      totalSubmissions: r.totalSubmissions,
      approvedSubmissions: r.approvedSubmissions,
      verifiedAt: r.verifiedAt,
      assignedBeats: r.territoryAssignments.map((ta: any) => ({
        id: ta.id,
        locationId: ta.locationId,
        locationName: ta.location.nameHi || ta.location.nameEn,
        locationType: ta.location.type,
        assignmentType: ta.assignmentType,
      })),
    }));

    return {
      reporters,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async getReporterById(userId: string): Promise<AdminReporterItem | null> {
    const r = await this.prisma.reporterProfile.findUnique({
      where: { userId },
      include: {
        user: { include: { profile: true } },
        territoryAssignments: { include: { location: true } },
      },
    });

    if (!r) return null;

    return {
      userId: r.userId,
      reporterCode: r.reporterCode,
      fullName: r.user.profile?.fullName || 'संवाददाता',
      phoneNumber: r.user.phoneNumber,
      email: r.user.email,
      pressIdCardNumber: r.pressIdCardNumber,
      verificationStatus: r.verificationStatus,
      isTrustedReporter: r.isTrustedReporter,
      canDirectPublish: r.canDirectPublish,
      trustScore: r.trustScore,
      totalSubmissions: r.totalSubmissions,
      approvedSubmissions: r.approvedSubmissions,
      verifiedAt: r.verifiedAt,
      assignedBeats: r.territoryAssignments.map((ta: any) => ({
        id: ta.id,
        locationId: ta.locationId,
        locationName: ta.location.nameHi || ta.location.nameEn,
        locationType: ta.location.type,
        assignmentType: ta.assignmentType,
      })),
    };
  }

  public async verifyReporter(userId: string, status: 'verified' | 'rejected', actorId: string, reason?: string): Promise<any> {
    const existing = await this.prisma.reporterProfile.findUnique({ where: { userId } });
    if (!existing) throw AppError.notFound('Reporter profile not found.');

    const updated = await this.prisma.reporterProfile.update({
      where: { userId },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'verified' ? new Date() : null,
      },
    });

    await this.recordAuditLog({
      actorUserId: actorId,
      action: `REPORTER_VERIFICATION_${status.toUpperCase()}`,
      targetEntityType: 'REPORTER_PROFILE',
      targetEntityId: userId,
      payloadBefore: { verificationStatus: existing.verificationStatus },
      payloadAfter: { verificationStatus: status, reason },
      ipAddress: '127.0.0.1',
    });

    return updated;
  }

  public async assignReporterTerritory(reporterId: string, locationId: string, assignmentType: string, actorId: string): Promise<any> {
    const location = await this.prisma.geoLocation.findUnique({ where: { id: locationId } });
    if (!location) throw AppError.notFound('Geographical location not found.');

    const assignment = await this.prisma.reporterTerritoryAssignment.create({
      data: {
        reporterId,
        locationId,
        assignmentType,
        assignedBy: actorId,
        status: 'active',
      },
      include: { location: true },
    });

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'REPORTER_BEAT_ASSIGNED',
      targetEntityType: 'REPORTER_TERRITORY',
      targetEntityId: assignment.id,
      payloadAfter: { reporterId, locationId, assignmentType },
      ipAddress: '127.0.0.1',
    });

    return assignment;
  }

  public async revokeReporterTerritory(assignmentId: string, actorId: string): Promise<boolean> {
    const existing = await this.prisma.reporterTerritoryAssignment.findUnique({ where: { id: assignmentId } });
    if (!existing) return false;

    await this.prisma.reporterTerritoryAssignment.delete({ where: { id: assignmentId } });

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'REPORTER_BEAT_REVOKED',
      targetEntityType: 'REPORTER_TERRITORY',
      targetEntityId: assignmentId,
      payloadBefore: existing,
      ipAddress: '127.0.0.1',
    });

    return true;
  }

  public async updateReporterTrust(reporterId: string, trustScore: number, canDirectPublish: boolean, isTrusted: boolean, actorId: string): Promise<any> {
    const updated = await this.prisma.reporterProfile.update({
      where: { userId: reporterId },
      data: {
        trustScore,
        canDirectPublish,
        isTrustedReporter: isTrusted,
      },
    });

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'REPORTER_TRUST_UPDATED',
      targetEntityType: 'REPORTER_PROFILE',
      targetEntityId: reporterId,
      payloadAfter: { trustScore, canDirectPublish, isTrusted },
      ipAddress: '127.0.0.1',
    });

    return updated;
  }

  public async getAuditLogs(filter: AuditFilter): Promise<{ logs: AdminAuditLogEntry[]; total: number; totalPages: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.actorId) where.actorUserId = filter.actorId;
    if (filter.action) where.action = { contains: filter.action, mode: 'insensitive' };
    if (filter.targetType) where.targetEntityType = filter.targetType;

    const [total, records] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, profile: { select: { fullName: true } } } },
        },
      }),
    ]);

    const logs: AdminAuditLogEntry[] = records.map((r: any) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      actorName: r.actor?.profile?.fullName || 'सिस्टम',
      action: r.action,
      targetEntityType: r.targetEntityType,
      targetEntityId: r.targetEntityId,
      payloadBefore: r.payloadBefore,
      payloadAfter: r.payloadAfter,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt,
    }));

    return {
      logs,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async recordAuditLog(entry: Omit<AdminAuditLogEntry, 'id' | 'createdAt'>): Promise<AdminAuditLogEntry> {
    try {
      const created = await this.prisma.auditLog.create({
        data: {
          actorUserId: entry.actorUserId || null,
          action: entry.action,
          targetEntityType: entry.targetEntityType,
          targetEntityId: entry.targetEntityId,
          payloadBefore: entry.payloadBefore,
          payloadAfter: entry.payloadAfter,
          ipAddress: entry.ipAddress || '127.0.0.1',
          userAgent: entry.userAgent || null,
        },
      });

      return {
        id: created.id,
        actorUserId: created.actorUserId,
        action: created.action,
        targetEntityType: created.targetEntityType,
        targetEntityId: created.targetEntityId,
        payloadBefore: created.payloadBefore,
        payloadAfter: created.payloadAfter,
        ipAddress: created.ipAddress,
        userAgent: created.userAgent,
        createdAt: created.createdAt,
      };
    } catch (err: any) {
      console.warn('Failed to write persistent audit log:', err.message);
      return {
        id: `mock_audit_${Date.now()}`,
        ...entry,
        createdAt: new Date(),
      };
    }
  }

  public async getSystemSettings(): Promise<AdminSystemSettingItem[]> {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return settings.map((s: any) => ({
      id: s.id,
      key: s.key,
      value: s.value,
      valueType: s.valueType,
      category: s.category,
      updatedBy: s.updatedBy,
      updatedAt: s.updatedAt,
    }));
  }

  public async updateSystemSetting(key: string, value: string, actorId: string): Promise<AdminSystemSettingItem> {
    const updated = await this.prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        updatedBy: actorId,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        updatedBy: actorId,
      },
    });

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'SYSTEM_SETTING_UPDATED',
      targetEntityType: 'SYSTEM_SETTING',
      targetEntityId: updated.id,
      payloadAfter: { key, value },
      ipAddress: '127.0.0.1',
    });

    return {
      id: updated.id,
      key: updated.key,
      value: updated.value,
      valueType: updated.valueType,
      category: updated.category,
      updatedBy: updated.updatedBy,
      updatedAt: updated.updatedAt,
    };
  }
}

/**
 * In-Memory Fallback Admin Repository for Offline / Unit-Testing Scenarios
 */
export class InMemoryAdminRepository implements IAdminRepository {
  private users: Map<string, any> = new Map();
  private reporters: Map<string, any> = new Map();
  private auditLogs: AdminAuditLogEntry[] = [];
  private settings: Map<string, AdminSystemSettingItem> = new Map();
  private roles: AdminRoleItem[] = [];

  constructor() {
    this.seedMockData();
  }

  private seedMockData() {
    // Canonical System Roles (excluding DEC-048 ROLE_CHIEF_EDITOR)
    this.roles = [
      { id: 'r1', name: 'admin', displayName: 'प्रशासक (Administrator)', isSystem: true, permissions: ['*'] },
      { id: 'r2', name: 'super_admin', displayName: 'मुख्य प्रशासक (Super Admin)', isSystem: true, permissions: ['*'] },
      { id: 'r3', name: 'editor', displayName: 'संपादक (Desk Editor)', isSystem: true, permissions: ['article:publish', 'article:review'] },
      { id: 'r4', name: 'reporter', displayName: 'संवाददाता (Field Reporter)', isSystem: true, permissions: ['article:submit'] },
      { id: 'r5', name: 'trusted_reporter', displayName: 'विश्वसनीय संवाददाता (Trusted Reporter)', isSystem: true, permissions: ['article:submit', 'article:direct_publish'] },
      { id: 'r6', name: 'citizen', displayName: 'नागरिक पाठक (Citizen)', isSystem: true, permissions: ['article:read'] },
    ];

    // Seed Initial System Settings
    const defaultSettings: Array<Omit<AdminSystemSettingItem, 'id' | 'updatedAt'>> = [
      { key: 'platform.site_title', value: 'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)', valueType: 'string', category: 'general' },
      { key: 'platform.maintenance_mode', value: 'false', valueType: 'boolean', category: 'general' },
      { key: 'editorial.min_headline_chars', value: '15', valueType: 'number', category: 'editorial' },
      { key: 'editorial.breaking_priority_threshold', value: '9', valueType: 'number', category: 'editorial' },
      { key: 'notifications.breaking_fcm_enabled', value: 'true', valueType: 'boolean', category: 'notifications' },
    ];

    defaultSettings.forEach((s) => {
      const id = `setting_${s.key}`;
      this.settings.set(s.key, { ...s, id, updatedAt: new Date() });
    });

    // Seed Sample Users & Reporters
    const mockUser1 = {
      id: 'usr_admin_01',
      phoneNumber: '+919876543210',
      email: 'admin@breakingnewswala.com',
      fullName: 'सुमित शर्मा (चीफ एडमिन)',
      roles: ['admin', 'editor'],
      status: 'active',
      createdAt: new Date('2026-01-01'),
    };
    this.users.set(mockUser1.id, mockUser1);

    const mockReporter1 = {
      userId: 'usr_rep_bhopal',
      reporterCode: 'REP-MP-BHO-01',
      fullName: 'राजेश वर्मा',
      phoneNumber: '+919826011111',
      email: 'rajesh.bhopal@bnw.in',
      pressIdCardNumber: 'MP-PRESS-2026-089',
      verificationStatus: 'verified',
      isTrustedReporter: true,
      canDirectPublish: false,
      trustScore: 85,
      totalSubmissions: 34,
      approvedSubmissions: 31,
      verifiedAt: new Date('2026-02-15'),
      assignedBeats: [
        {
          id: 'asg_01',
          locationId: 'dist_bhopal',
          locationName: 'भोपाल (Bhopal)',
          locationType: 'DISTRICT',
          assignmentType: 'PRIMARY',
        },
      ],
    };
    this.reporters.set(mockReporter1.userId, mockReporter1);
    this.users.set(mockReporter1.userId, {
      id: mockReporter1.userId,
      phoneNumber: mockReporter1.phoneNumber,
      email: mockReporter1.email,
      fullName: mockReporter1.fullName,
      roles: ['reporter', 'trusted_reporter'],
      status: 'active',
      createdAt: new Date('2026-02-10'),
      reporterProfile: {
        reporterCode: mockReporter1.reporterCode,
        verificationStatus: mockReporter1.verificationStatus,
        isTrustedReporter: mockReporter1.isTrustedReporter,
        trustScore: mockReporter1.trustScore,
      },
    });

    const mockReporter2 = {
      userId: 'usr_rep_indore_pending',
      reporterCode: 'REP-MP-IND-02',
      fullName: 'कविता चौहान',
      phoneNumber: '+919755022222',
      email: 'kavita.indore@bnw.in',
      pressIdCardNumber: 'MP-PRESS-PENDING-44',
      verificationStatus: 'pending',
      isTrustedReporter: false,
      canDirectPublish: false,
      trustScore: 50,
      totalSubmissions: 4,
      approvedSubmissions: 2,
      verifiedAt: null,
      assignedBeats: [],
    };
    this.reporters.set(mockReporter2.userId, mockReporter2);
    this.users.set(mockReporter2.userId, {
      id: mockReporter2.userId,
      phoneNumber: mockReporter2.phoneNumber,
      email: mockReporter2.email,
      fullName: mockReporter2.fullName,
      roles: ['reporter'],
      status: 'active',
      createdAt: new Date('2026-03-01'),
      reporterProfile: {
        reporterCode: mockReporter2.reporterCode,
        verificationStatus: mockReporter2.verificationStatus,
        isTrustedReporter: mockReporter2.isTrustedReporter,
        trustScore: mockReporter2.trustScore,
      },
    });
  }

  public async getAdminStats(): Promise<AdminStats> {
    const allUsers = Array.from(this.users.values());
    const allReporters = Array.from(this.reporters.values());

    return {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u) => u.status === 'active').length,
      suspendedUsers: allUsers.filter((u) => u.status === 'suspended').length,
      deactivatedUsers: allUsers.filter((u) => u.status === 'deactivated').length,
      totalReporters: allReporters.length,
      activeReporters: allReporters.filter((r) => r.verificationStatus === 'verified').length,
      pendingReporters: allReporters.filter((r) => r.verificationStatus === 'pending').length,
      totalArticles: 150,
      publishedArticles: 120,
      underReviewArticles: 8,
      pendingArticles: 15,
      rejectedArticles: 7,
      districtCoverageCount: 42,
      systemHealth: {
        database: true,
        redis: true,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      recentAuditActions: this.auditLogs.slice(0, 10),
    };
  }

  public async getUsers(filter: UserFilter): Promise<{ users: AdminUserItem[]; total: number; totalPages: number }> {
    let items = Array.from(this.users.values());

    if (filter.status && filter.status !== 'all') {
      items = items.filter((u) => u.status === filter.status);
    }
    if (filter.role && filter.role !== 'all') {
      items = items.filter((u) => u.roles.includes(filter.role!));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phoneNumber && u.phoneNumber.includes(q))
      );
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit);

    return {
      users: paginated,
      total: items.length,
      totalPages: Math.ceil(items.length / limit) || 1,
    };
  }

  public async getUserById(id: string): Promise<any | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const rep = this.reporters.get(id);
    return {
      ...user,
      reporterProfile: rep || null,
      authoredArticles: [],
    };
  }

  public async updateUserStatus(id: string, status: string, actorId: string, reason?: string): Promise<any> {
    const user = this.users.get(id);
    if (!user) throw AppError.notFound('User not found.');

    const beforeStatus = user.status;
    user.status = status;
    this.users.set(id, user);

    await this.recordAuditLog({
      actorUserId: actorId,
      action: `USER_STATUS_${status.toUpperCase()}`,
      targetEntityType: 'USER',
      targetEntityId: id,
      payloadBefore: { status: beforeStatus },
      payloadAfter: { status, reason },
      ipAddress: '127.0.0.1',
    });

    return user;
  }

  public async assignUserRole(userId: string, roleName: string, actorId: string): Promise<any> {
    const user = this.users.get(userId);
    if (!user) throw AppError.notFound('User not found.');

    if (!user.roles.includes(roleName)) {
      user.roles.push(roleName);
      this.users.set(userId, user);
    }

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'USER_ROLE_ASSIGNED',
      targetEntityType: 'USER',
      targetEntityId: userId,
      payloadAfter: { roleName },
      ipAddress: '127.0.0.1',
    });

    return { userId, roleName };
  }

  public async revokeUserRole(userId: string, roleName: string, actorId: string): Promise<any> {
    const user = this.users.get(userId);
    if (!user) throw AppError.notFound('User not found.');

    user.roles = user.roles.filter((r: string) => r !== roleName);
    this.users.set(userId, user);

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'USER_ROLE_REVOKED',
      targetEntityType: 'USER',
      targetEntityId: userId,
      payloadBefore: { roleName },
      ipAddress: '127.0.0.1',
    });

    return { success: true };
  }

  public async getRoles(): Promise<AdminRoleItem[]> {
    return this.roles;
  }

  public async getReporters(filter: ReporterFilter): Promise<{ reporters: AdminReporterItem[]; total: number; totalPages: number }> {
    let items = Array.from(this.reporters.values());

    if (filter.status && filter.status !== 'all') {
      items = items.filter((r) => r.verificationStatus === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.reporterCode.toLowerCase().includes(q) ||
          (r.pressIdCardNumber && r.pressIdCardNumber.toLowerCase().includes(q))
      );
    }
    if (filter.districtId) {
      items = items.filter((r) => r.assignedBeats.some((b: any) => b.locationId === filter.districtId));
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit);

    return {
      reporters: paginated,
      total: items.length,
      totalPages: Math.ceil(items.length / limit) || 1,
    };
  }

  public async getReporterById(userId: string): Promise<AdminReporterItem | null> {
    return this.reporters.get(userId) || null;
  }

  public async verifyReporter(userId: string, status: 'verified' | 'rejected', actorId: string, reason?: string): Promise<any> {
    const reporter = this.reporters.get(userId);
    if (!reporter) throw AppError.notFound('Reporter not found.');

    const before = reporter.verificationStatus;
    reporter.verificationStatus = status;
    reporter.verifiedAt = status === 'verified' ? new Date() : null;
    this.reporters.set(userId, reporter);

    // If verified, ensure user has 'reporter' role
    if (status === 'verified') {
      const user = this.users.get(userId);
      if (user && !user.roles.includes('reporter')) {
        user.roles.push('reporter');
        this.users.set(userId, user);
      }
    }

    await this.recordAuditLog({
      actorUserId: actorId,
      action: `REPORTER_VERIFICATION_${status.toUpperCase()}`,
      targetEntityType: 'REPORTER_PROFILE',
      targetEntityId: userId,
      payloadBefore: { verificationStatus: before },
      payloadAfter: { verificationStatus: status, reason },
      ipAddress: '127.0.0.1',
    });

    return reporter;
  }

  public async assignReporterTerritory(reporterId: string, locationId: string, assignmentType: string, actorId: string): Promise<any> {
    const reporter = this.reporters.get(reporterId);
    if (!reporter) throw AppError.notFound('Reporter not found.');

    const assignmentId = `asg_${Date.now()}`;
    const newBeat = {
      id: assignmentId,
      locationId,
      locationName: `जिला कोड: ${locationId}`,
      locationType: 'DISTRICT',
      assignmentType,
    };

    reporter.assignedBeats.push(newBeat);
    this.reporters.set(reporterId, reporter);

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'REPORTER_BEAT_ASSIGNED',
      targetEntityType: 'REPORTER_TERRITORY',
      targetEntityId: assignmentId,
      payloadAfter: { reporterId, locationId, assignmentType },
      ipAddress: '127.0.0.1',
    });

    return newBeat;
  }

  public async revokeReporterTerritory(assignmentId: string, actorId: string): Promise<boolean> {
    for (const [userId, rep] of this.reporters.entries()) {
      const beforeLen = rep.assignedBeats.length;
      rep.assignedBeats = rep.assignedBeats.filter((b: any) => b.id !== assignmentId);
      if (rep.assignedBeats.length < beforeLen) {
        this.reporters.set(userId, rep);
        await this.recordAuditLog({
          actorUserId: actorId,
          action: 'REPORTER_BEAT_REVOKED',
          targetEntityType: 'REPORTER_TERRITORY',
          targetEntityId: assignmentId,
          ipAddress: '127.0.0.1',
        });
        return true;
      }
    }
    return false;
  }

  public async updateReporterTrust(reporterId: string, trustScore: number, canDirectPublish: boolean, isTrusted: boolean, actorId: string): Promise<any> {
    const reporter = this.reporters.get(reporterId);
    if (!reporter) throw AppError.notFound('Reporter not found.');

    reporter.trustScore = trustScore;
    reporter.canDirectPublish = canDirectPublish;
    reporter.isTrustedReporter = isTrusted;
    this.reporters.set(reporterId, reporter);

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'REPORTER_TRUST_UPDATED',
      targetEntityType: 'REPORTER_PROFILE',
      targetEntityId: reporterId,
      payloadAfter: { trustScore, canDirectPublish, isTrusted },
      ipAddress: '127.0.0.1',
    });

    return reporter;
  }

  public async getAuditLogs(filter: AuditFilter): Promise<{ logs: AdminAuditLogEntry[]; total: number; totalPages: number }> {
    let items = [...this.auditLogs];

    if (filter.actorId) items = items.filter((l) => l.actorUserId === filter.actorId);
    if (filter.action) items = items.filter((l) => l.action.toLowerCase().includes(filter.action!.toLowerCase()));
    if (filter.targetType) items = items.filter((l) => l.targetEntityType === filter.targetType);

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit);

    return {
      logs: paginated,
      total: items.length,
      totalPages: Math.ceil(items.length / limit) || 1,
    };
  }

  public async recordAuditLog(entry: Omit<AdminAuditLogEntry, 'id' | 'createdAt'>): Promise<AdminAuditLogEntry> {
    const log: AdminAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      actorUserId: entry.actorUserId,
      actorName: entry.actorName || 'सिस्टम एडमिनिस्ट्रेटर',
      action: entry.action,
      targetEntityType: entry.targetEntityType,
      targetEntityId: entry.targetEntityId,
      payloadBefore: entry.payloadBefore,
      payloadAfter: entry.payloadAfter,
      ipAddress: entry.ipAddress || '127.0.0.1',
      userAgent: entry.userAgent || 'bnw-admin-console',
      createdAt: new Date(),
    };

    this.auditLogs.unshift(log);
    return log;
  }

  public async getSystemSettings(): Promise<AdminSystemSettingItem[]> {
    return Array.from(this.settings.values());
  }

  public async updateSystemSetting(key: string, value: string, actorId: string): Promise<AdminSystemSettingItem> {
    const existing = this.settings.get(key) || {
      id: `setting_${Date.now()}`,
      key,
      value,
      valueType: 'string',
      category: 'general',
      updatedAt: new Date(),
    };

    const updated: AdminSystemSettingItem = {
      ...existing,
      value,
      updatedBy: actorId,
      updatedAt: new Date(),
    };

    this.settings.set(key, updated);

    await this.recordAuditLog({
      actorUserId: actorId,
      action: 'SYSTEM_SETTING_UPDATED',
      targetEntityType: 'SYSTEM_SETTING',
      targetEntityId: updated.id,
      payloadAfter: { key, value },
      ipAddress: '127.0.0.1',
    });

    return updated;
  }
}
