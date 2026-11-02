/**
 * BREAKING NEWS WALA — Auth Repository Boundary
 * Grounded in docs/12-Database.md (DOM-A: Identity & Access) and docs/14-Auth.md
 * Encapsulates all Prisma database operations for User, UserProfile, UserRole, and AuthSession.
 */

import { getPrismaClient } from '../../db/client';
import { SessionRecord, UserEntity } from './types';
import crypto from 'crypto';

export interface CreateUserData {
  phoneNumber?: string;
  email?: string;
  passwordHash: string;
  fullName: string;
  homeStateId?: string;
  homeDistrictId?: string;
  initialRole?: string;
}

export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  clientType?: string;
}

export interface IAuthRepository {
  findUserById(id: string): Promise<UserEntity | null>;
  findUserByPhone(phone: string): Promise<UserEntity | null>;
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserByIdentifier(identifier: string): Promise<UserEntity | null>;
  createUser(data: CreateUserData): Promise<UserEntity>;
  createSession(data: CreateSessionData): Promise<SessionRecord>;
  findSessionByTokenHash(refreshTokenHash: string): Promise<SessionRecord | null>;
  findSessionById(sessionId: string): Promise<SessionRecord | null>;
  revokeSession(sessionId: string): Promise<boolean>;
  revokeAllUserSessions(userId: string): Promise<number>;
  listActiveSessions(userId: string): Promise<SessionRecord[]>;
}

export class PrismaAuthRepository implements IAuthRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async findUserById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return (user as UserEntity) || null;
  }

  public async findUserByPhone(phoneNumber: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return (user as UserEntity) || null;
  }

  public async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return (user as UserEntity) || null;
  }

  public async findUserByIdentifier(identifier: string): Promise<UserEntity | null> {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return this.findUserByEmail(trimmed);
    }
    return this.findUserByPhone(trimmed);
  }

  public async createUser(data: CreateUserData): Promise<UserEntity> {
    const initialRoleName = data.initialRole || 'public_user';

    // Transactionally create User, UserProfile, and assign initial role
    return this.prisma.$transaction(async (tx) => {
      // Find or create default role
      let role = await tx.role.findUnique({
        where: { name: initialRoleName },
      });

      if (!role) {
        role = await tx.role.create({
          data: {
            name: initialRoleName,
            displayName: initialRoleName === 'public_user' ? 'Public Citizen Reader' : initialRoleName,
            isSystem: true,
          },
        });
      }

      // Create User record
      const newUser = await tx.user.create({
        data: {
          phoneNumber: data.phoneNumber || null,
          email: data.email ? data.email.toLowerCase() : null,
          passwordHash: data.passwordHash,
          status: 'active',
          profile: {
            create: {
              fullName: data.fullName,
              preferredLanguage: 'hi',
              homeStateId: data.homeStateId || null,
              homeDistrictId: data.homeDistrictId || null,
            },
          },
          userRoles: {
            create: {
              roleId: role.id,
            },
          },
        },
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      return newUser as UserEntity;
    });
  }

  public async createSession(data: CreateSessionData): Promise<SessionRecord> {
    const session = await this.prisma.authSession.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        ipAddress: data.ipAddress || null,
        clientType: data.clientType || 'web',
        expiresAt: data.expiresAt,
      },
    });

    return session as SessionRecord;
  }

  public async findSessionByTokenHash(refreshTokenHash: string): Promise<SessionRecord | null> {
    const session = await this.prisma.authSession.findFirst({
      where: { refreshTokenHash },
    });

    return (session as SessionRecord) || null;
  }

  public async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
    });

    return (session as SessionRecord) || null;
  }

  public async revokeSession(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.authSession.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  public async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count;
  }

  public async listActiveSessions(userId: string): Promise<SessionRecord[]> {
    const sessions = await this.prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions as SessionRecord[];
  }
}

/**
 * In-Memory Mock Repository for High-Speed Unit & Offline Testing
 */
export class InMemoryAuthRepository implements IAuthRepository {
  private users: Map<string, UserEntity> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();

  public async findUserById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  public async findUserByPhone(phone: string): Promise<UserEntity | null> {
    for (const u of this.users.values()) {
      if (u.phoneNumber === phone && !u.deletedAt) return u;
    }
    return null;
  }

  public async findUserByEmail(email: string): Promise<UserEntity | null> {
    const lower = email.toLowerCase();
    for (const u of this.users.values()) {
      if (u.email?.toLowerCase() === lower && !u.deletedAt) return u;
    }
    return null;
  }

  public async findUserByIdentifier(identifier: string): Promise<UserEntity | null> {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return this.findUserByEmail(trimmed);
    }
    return this.findUserByPhone(trimmed);
  }

  public async createUser(data: CreateUserData): Promise<UserEntity> {
    const id = `usr-${crypto.randomUUID()}`;
    const user: UserEntity = {
      id,
      phoneNumber: data.phoneNumber || null,
      email: data.email ? data.email.toLowerCase() : null,
      passwordHash: data.passwordHash,
      status: 'active',
      phoneVerified: false,
      emailVerified: false,
      mfaEnabled: false,
      mfaSecret: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      profile: {
        fullName: data.fullName,
        avatarMediaId: null,
        bio: null,
        preferredLanguage: 'hi',
        homeStateId: data.homeStateId || null,
        homeDistrictId: data.homeDistrictId || null,
      },
      userRoles: [
        {
          role: {
            name: data.initialRole || 'public_user',
            displayName: data.initialRole === 'public_user' ? 'Public Citizen Reader' : (data.initialRole || 'public_user'),
          },
        },
      ],
    };

    this.users.set(id, user);
    return user;
  }

  public async createSession(data: CreateSessionData): Promise<SessionRecord> {
    const id = `ses-${crypto.randomUUID()}`;
    const session: SessionRecord = {
      id,
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      ipAddress: data.ipAddress || null,
      clientType: data.clientType || 'web',
      expiresAt: data.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };

    this.sessions.set(id, session);
    return session;
  }

  public async findSessionByTokenHash(refreshTokenHash: string): Promise<SessionRecord | null> {
    for (const s of this.sessions.values()) {
      if (s.refreshTokenHash === refreshTokenHash) return s;
    }
    return null;
  }

  public async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    return this.sessions.get(sessionId) || null;
  }

  public async revokeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.revokedAt = new Date();
    return true;
  }

  public async revokeAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const s of this.sessions.values()) {
      if (s.userId === userId && !s.revokedAt) {
        s.revokedAt = now;
        count++;
      }
    }
    return count;
  }

  public async listActiveSessions(userId: string): Promise<SessionRecord[]> {
    const now = new Date();
    const active: SessionRecord[] = [];
    for (const s of this.sessions.values()) {
      if (s.userId === userId && !s.revokedAt && s.expiresAt > now) {
        active.push(s);
      }
    }
    return active.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public clear(): void {
    this.users.clear();
    this.sessions.clear();
  }
}

// Export default singleton instance
export const authRepository = new PrismaAuthRepository();

