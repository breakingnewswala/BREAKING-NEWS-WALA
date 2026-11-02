/**
 * BREAKING NEWS WALA — Notification Repository Boundary
 * Grounded in docs/12-Database.md (DOM-A: DeviceRegistration, DOM-L: Notification & Push System).
 */

import { getPrismaClient } from '../../db/client';
import { DEFAULT_PREFERENCES } from './notification.constants';
import {
  DevicePlatform,
  DeviceRegistrationEntity,
  NotificationDeliveryLogEntity,
  NotificationEntity,
  NotificationPreferencesEntity,
  UpdatePreferencesDto,
} from './types';

export interface INotificationRepository {
  // Device registration
  createOrUpdateDevice(data: {
    userId?: string | null;
    platform: DevicePlatform;
    pushToken: string;
  }): Promise<DeviceRegistrationEntity>;
  findDeviceByToken(pushToken: string): Promise<DeviceRegistrationEntity | null>;
  findDevicesByUserId(userId: string): Promise<DeviceRegistrationEntity[]>;
  deleteDeviceByToken(pushToken: string): Promise<boolean>;
  deleteDeviceById(id: string): Promise<boolean>;
  countRegisteredDevices(): Promise<number>;

  // Notification records
  createNotification(data: {
    recipientUserId?: string | null;
    title: string;
    body: string;
    channel: string;
    targetScreenUri?: string | null;
  }): Promise<NotificationEntity>;
  findNotificationById(id: string): Promise<NotificationEntity | null>;
  findNotificationsByUserId(
    userId: string,
    params: { page?: number; limit?: number; unreadOnly?: boolean }
  ): Promise<{ items: NotificationEntity[]; total: number }>;
  countUnreadByUserId(userId: string): Promise<number>;
  markAsRead(notificationId: string, userId: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<number>;

  // Delivery audit logs
  createDeliveryLog(data: {
    notificationId: string;
    platform: string;
    deliveryStatus: string;
    errorDetails?: string | null;
  }): Promise<NotificationDeliveryLogEntity>;
  findDeliveryLogs(notificationId: string): Promise<NotificationDeliveryLogEntity[]>;

  // User preferences
  getPreferences(userId: string): Promise<NotificationPreferencesEntity>;
  savePreferences(
    userId: string,
    data: UpdatePreferencesDto
  ): Promise<NotificationPreferencesEntity>;

  // Frequency capping & throttling
  countRecentDispatches(targetKey: string, windowMs: number): Promise<number>;
  recordDispatch(targetKey: string): Promise<void>;
}

export class PrismaNotificationRepository implements INotificationRepository {
  private get prisma() {
    return getPrismaClient();
  }

  // Preferences cache / in-memory store since preference model is decoupled
  private static readonly preferencesStore = new Map<string, NotificationPreferencesEntity>();
  private static readonly dispatchLedger = new Map<string, number[]>();

  public async createOrUpdateDevice(data: {
    userId?: string | null;
    platform: DevicePlatform;
    pushToken: string;
  }): Promise<DeviceRegistrationEntity> {
    const record = await this.prisma.deviceRegistration.upsert({
      where: { pushToken: data.pushToken },
      create: {
        userId: data.userId || null,
        platform: data.platform,
        pushToken: data.pushToken,
        lastActiveAt: new Date(),
      },
      update: {
        userId: data.userId !== undefined ? data.userId : undefined,
        platform: data.platform,
        lastActiveAt: new Date(),
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      platform: record.platform as DevicePlatform,
      pushToken: record.pushToken,
      lastActiveAt: record.lastActiveAt,
    };
  }

  public async findDeviceByToken(pushToken: string): Promise<DeviceRegistrationEntity | null> {
    const record = await this.prisma.deviceRegistration.findUnique({
      where: { pushToken },
    });
    if (!record) return null;
    return {
      id: record.id,
      userId: record.userId,
      platform: record.platform as DevicePlatform,
      pushToken: record.pushToken,
      lastActiveAt: record.lastActiveAt,
    };
  }

  public async findDevicesByUserId(userId: string): Promise<DeviceRegistrationEntity[]> {
    const records = await this.prisma.deviceRegistration.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      platform: r.platform as DevicePlatform,
      pushToken: r.pushToken,
      lastActiveAt: r.lastActiveAt,
    }));
  }

  public async deleteDeviceByToken(pushToken: string): Promise<boolean> {
    try {
      await this.prisma.deviceRegistration.delete({
        where: { pushToken },
      });
      return true;
    } catch {
      return false;
    }
  }

  public async deleteDeviceById(id: string): Promise<boolean> {
    try {
      await this.prisma.deviceRegistration.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  public async countRegisteredDevices(): Promise<number> {
    return this.prisma.deviceRegistration.count();
  }

  public async createNotification(data: {
    recipientUserId?: string | null;
    title: string;
    body: string;
    channel: string;
    targetScreenUri?: string | null;
  }): Promise<NotificationEntity> {
    const record = await this.prisma.notification.create({
      data: {
        recipientUserId: data.recipientUserId || null,
        title: data.title,
        body: data.body,
        channel: data.channel,
        targetScreenUri: data.targetScreenUri || null,
        isRead: false,
      },
    });

    return {
      id: record.id,
      recipientUserId: record.recipientUserId,
      title: record.title,
      body: record.body,
      channel: record.channel,
      targetScreenUri: record.targetScreenUri,
      isRead: record.isRead,
      sentAt: record.sentAt,
    };
  }

  public async findNotificationById(id: string): Promise<NotificationEntity | null> {
    const record = await this.prisma.notification.findUnique({
      where: { id },
      include: { deliveryLogs: true },
    });
    if (!record) return null;
    return {
      id: record.id,
      recipientUserId: record.recipientUserId,
      title: record.title,
      body: record.body,
      channel: record.channel,
      targetScreenUri: record.targetScreenUri,
      isRead: record.isRead,
      sentAt: record.sentAt,
      deliveryLogs: record.deliveryLogs.map((l) => ({
        id: l.id,
        notificationId: l.notificationId,
        platform: l.platform,
        deliveryStatus: l.deliveryStatus,
        errorDetails: l.errorDetails,
        attemptedAt: l.attemptedAt,
      })),
    };
  }

  public async findNotificationsByUserId(
    userId: string,
    params: { page?: number; limit?: number; unreadOnly?: boolean }
  ): Promise<{ items: NotificationEntity[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ recipientUserId: userId }, { recipientUserId: null }],
    };
    if (params.unreadOnly) {
      where.isRead = false;
    }

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: records.map((r) => ({
        id: r.id,
        recipientUserId: r.recipientUserId,
        title: r.title,
        body: r.body,
        channel: r.channel,
        targetScreenUri: r.targetScreenUri,
        isRead: r.isRead,
        sentAt: r.sentAt,
      })),
      total,
    };
  }

  public async countUnreadByUserId(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        OR: [{ recipientUserId: userId }, { recipientUserId: null }],
        isRead: false,
      },
    });
  }

  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        OR: [{ recipientUserId: userId }, { recipientUserId: null }],
      },
      data: { isRead: true },
    });
    return result.count > 0;
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        OR: [{ recipientUserId: userId }, { recipientUserId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
    return result.count;
  }

  public async createDeliveryLog(data: {
    notificationId: string;
    platform: string;
    deliveryStatus: string;
    errorDetails?: string | null;
  }): Promise<NotificationDeliveryLogEntity> {
    const record = await this.prisma.notificationDeliveryLog.create({
      data: {
        notificationId: data.notificationId,
        platform: data.platform,
        deliveryStatus: data.deliveryStatus,
        errorDetails: data.errorDetails || null,
      },
    });

    return {
      id: record.id,
      notificationId: record.notificationId,
      platform: record.platform,
      deliveryStatus: record.deliveryStatus,
      errorDetails: record.errorDetails,
      attemptedAt: record.attemptedAt,
    };
  }

  public async findDeliveryLogs(notificationId: string): Promise<NotificationDeliveryLogEntity[]> {
    const records = await this.prisma.notificationDeliveryLog.findMany({
      where: { notificationId },
      orderBy: { attemptedAt: 'asc' },
    });
    return records.map((l) => ({
      id: l.id,
      notificationId: l.notificationId,
      platform: l.platform,
      deliveryStatus: l.deliveryStatus,
      errorDetails: l.errorDetails,
      attemptedAt: l.attemptedAt,
    }));
  }

  public async getPreferences(userId: string): Promise<NotificationPreferencesEntity> {
    const existing = PrismaNotificationRepository.preferencesStore.get(userId);
    if (existing) return existing;

    const initial: NotificationPreferencesEntity = {
      userId,
      ...DEFAULT_PREFERENCES,
      updatedAt: new Date(),
    };
    PrismaNotificationRepository.preferencesStore.set(userId, initial);
    return initial;
  }

  public async savePreferences(
    userId: string,
    data: UpdatePreferencesDto
  ): Promise<NotificationPreferencesEntity> {
    const current = await this.getPreferences(userId);
    const updated: NotificationPreferencesEntity = {
      ...current,
      ...data,
      userId,
      updatedAt: new Date(),
    };
    PrismaNotificationRepository.preferencesStore.set(userId, updated);
    return updated;
  }

  public async countRecentDispatches(targetKey: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const timestamps = PrismaNotificationRepository.dispatchLedger.get(targetKey) || [];
    const valid = timestamps.filter((t) => now - t <= windowMs);
    PrismaNotificationRepository.dispatchLedger.set(targetKey, valid);
    return valid.length;
  }

  public async recordDispatch(targetKey: string): Promise<void> {
    const now = Date.now();
    const timestamps = PrismaNotificationRepository.dispatchLedger.get(targetKey) || [];
    timestamps.push(now);
    PrismaNotificationRepository.dispatchLedger.set(targetKey, timestamps);
  }
}

/**
 * In-Memory Notification Repository
 * High-performance, self-contained repository for testing and offline development.
 */
export class InMemoryNotificationRepository implements INotificationRepository {
  private readonly devices = new Map<string, DeviceRegistrationEntity>();
  private readonly notifications = new Map<string, NotificationEntity>();
  private readonly deliveryLogs = new Map<string, NotificationDeliveryLogEntity[]>();
  private readonly preferences = new Map<string, NotificationPreferencesEntity>();
  private readonly dispatchLedger = new Map<string, number[]>();

  public async createOrUpdateDevice(data: {
    userId?: string | null;
    platform: DevicePlatform;
    pushToken: string;
  }): Promise<DeviceRegistrationEntity> {
    // Check if token already registered
    let existingId: string | null = null;
    for (const [id, dev] of this.devices.entries()) {
      if (dev.pushToken === data.pushToken) {
        existingId = id;
        break;
      }
    }

    const id = existingId || `dev-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entity: DeviceRegistrationEntity = {
      id,
      userId: data.userId || null,
      platform: data.platform,
      pushToken: data.pushToken,
      lastActiveAt: new Date(),
    };

    this.devices.set(id, entity);
    return entity;
  }

  public async findDeviceByToken(pushToken: string): Promise<DeviceRegistrationEntity | null> {
    for (const dev of this.devices.values()) {
      if (dev.pushToken === pushToken) {
        return dev;
      }
    }
    return null;
  }

  public async findDevicesByUserId(userId: string): Promise<DeviceRegistrationEntity[]> {
    return Array.from(this.devices.values())
      .filter((d) => d.userId === userId)
      .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
  }

  public async deleteDeviceByToken(pushToken: string): Promise<boolean> {
    for (const [id, dev] of this.devices.entries()) {
      if (dev.pushToken === pushToken) {
        this.devices.delete(id);
        return true;
      }
    }
    return false;
  }

  public async deleteDeviceById(id: string): Promise<boolean> {
    return this.devices.delete(id);
  }

  public async countRegisteredDevices(): Promise<number> {
    return this.devices.size;
  }

  public async createNotification(data: {
    recipientUserId?: string | null;
    title: string;
    body: string;
    channel: string;
    targetScreenUri?: string | null;
  }): Promise<NotificationEntity> {
    const id = `notif-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entity: NotificationEntity = {
      id,
      recipientUserId: data.recipientUserId || null,
      title: data.title,
      body: data.body,
      channel: data.channel,
      targetScreenUri: data.targetScreenUri || null,
      isRead: false,
      sentAt: new Date(),
    };

    this.notifications.set(id, entity);
    return entity;
  }

  public async findNotificationById(id: string): Promise<NotificationEntity | null> {
    const entity = this.notifications.get(id);
    if (!entity) return null;
    const logs = this.deliveryLogs.get(id) || [];
    return {
      ...entity,
      deliveryLogs: logs,
    };
  }

  public async findNotificationsByUserId(
    userId: string,
    params: { page?: number; limit?: number; unreadOnly?: boolean }
  ): Promise<{ items: NotificationEntity[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    let all = Array.from(this.notifications.values())
      .filter((n) => n.recipientUserId === userId || n.recipientUserId === null);

    if (params.unreadOnly) {
      all = all.filter((n) => !n.isRead);
    }

    all.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    const total = all.length;
    const items = all.slice((page - 1) * limit, page * limit);

    return { items, total };
  }

  public async countUnreadByUserId(userId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(
      (n) => (n.recipientUserId === userId || n.recipientUserId === null) && !n.isRead
    ).length;
  }

  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const n = this.notifications.get(notificationId);
    if (!n) return false;
    if (n.recipientUserId && n.recipientUserId !== userId) return false;

    n.isRead = true;
    this.notifications.set(notificationId, n);
    return true;
  }

  public async markAllAsRead(userId: string): Promise<number> {
    let count = 0;
    for (const [id, n] of this.notifications.entries()) {
      if ((n.recipientUserId === userId || n.recipientUserId === null) && !n.isRead) {
        n.isRead = true;
        this.notifications.set(id, n);
        count++;
      }
    }
    return count;
  }

  public async createDeliveryLog(data: {
    notificationId: string;
    platform: string;
    deliveryStatus: string;
    errorDetails?: string | null;
  }): Promise<NotificationDeliveryLogEntity> {
    const id = `log-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const log: NotificationDeliveryLogEntity = {
      id,
      notificationId: data.notificationId,
      platform: data.platform,
      deliveryStatus: data.deliveryStatus,
      errorDetails: data.errorDetails || null,
      attemptedAt: new Date(),
    };

    const list = this.deliveryLogs.get(data.notificationId) || [];
    list.push(log);
    this.deliveryLogs.set(data.notificationId, list);

    return log;
  }

  public async findDeliveryLogs(notificationId: string): Promise<NotificationDeliveryLogEntity[]> {
    return this.deliveryLogs.get(notificationId) || [];
  }

  public async getPreferences(userId: string): Promise<NotificationPreferencesEntity> {
    const existing = this.preferences.get(userId);
    if (existing) return existing;

    const initial: NotificationPreferencesEntity = {
      userId,
      ...DEFAULT_PREFERENCES,
      updatedAt: new Date(),
    };
    this.preferences.set(userId, initial);
    return initial;
  }

  public async savePreferences(
    userId: string,
    data: UpdatePreferencesDto
  ): Promise<NotificationPreferencesEntity> {
    const current = await this.getPreferences(userId);
    const updated: NotificationPreferencesEntity = {
      ...current,
      ...data,
      userId,
      updatedAt: new Date(),
    };
    this.preferences.set(userId, updated);
    return updated;
  }

  public async countRecentDispatches(targetKey: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const timestamps = this.dispatchLedger.get(targetKey) || [];
    const valid = timestamps.filter((t) => now - t <= windowMs);
    this.dispatchLedger.set(targetKey, valid);
    return valid.length;
  }

  public async recordDispatch(targetKey: string): Promise<void> {
    const now = Date.now();
    const timestamps = this.dispatchLedger.get(targetKey) || [];
    timestamps.push(now);
    this.dispatchLedger.set(targetKey, timestamps);
  }

  public clear(): void {
    this.devices.clear();
    this.notifications.clear();
    this.deliveryLogs.clear();
    this.preferences.clear();
    this.dispatchLedger.clear();
  }
}

let notificationRepositoryInstance: INotificationRepository | null = null;

export function getNotificationRepository(): INotificationRepository {
  if (!notificationRepositoryInstance) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      notificationRepositoryInstance = new InMemoryNotificationRepository();
    } else {
      notificationRepositoryInstance = new PrismaNotificationRepository();
    }
  }
  return notificationRepositoryInstance;
}

export const notificationRepository = getNotificationRepository();

