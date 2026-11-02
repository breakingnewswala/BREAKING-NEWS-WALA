/**
 * BREAKING NEWS WALA — Admin Subsystem TypeScript Contracts
 * Grounded in docs/01-PRD.md, docs/02-Features.md, docs/11-Architecture.md,
 * docs/12-Database.md, docs/13-API.md, docs/14-Auth.md, and docs/DECISIONS.md (DEC-048)
 */

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  deactivatedUsers: number;
  totalReporters: number;
  activeReporters: number;
  pendingReporters: number;
  totalArticles: number;
  publishedArticles: number;
  underReviewArticles: number;
  pendingArticles: number;
  rejectedArticles: number;
  districtCoverageCount: number;
  systemHealth: {
    database: boolean;
    redis: boolean;
    uptimeSeconds: number;
  };
  recentAuditActions: AdminAuditLogEntry[];
}

export interface AdminUserItem {
  id: string;
  phoneNumber?: string | null;
  email?: string | null;
  fullName: string;
  roles: string[];
  status: string;
  createdAt: Date | string;
  reporterProfile?: {
    reporterCode: string;
    verificationStatus: string;
    isTrustedReporter: boolean;
    trustScore: number;
  } | null;
}

export interface UserFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

export interface AdminReporterItem {
  userId: string;
  reporterCode: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
  pressIdCardNumber?: string | null;
  verificationStatus: string;
  isTrustedReporter: boolean;
  canDirectPublish: boolean;
  trustScore: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  verifiedAt?: Date | string | null;
  assignedBeats: Array<{
    id: string;
    locationId: string;
    locationName: string;
    locationType: string;
    assignmentType: string;
  }>;
}

export interface ReporterFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  districtId?: string;
}

export interface AdminAuditLogEntry {
  id: string;
  actorUserId?: string | null;
  actorName?: string | null;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  payloadBefore?: any;
  payloadAfter?: any;
  ipAddress: string;
  userAgent?: string | null;
  createdAt: Date | string;
}

export interface AuditFilter {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: string;
  targetType?: string;
}

export interface AdminSystemSettingItem {
  id: string;
  key: string;
  value: string;
  valueType: string;
  category: string;
  updatedBy?: string | null;
  updatedAt: Date | string;
}

export interface AdminRoleItem {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  permissions: string[];
}

