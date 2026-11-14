/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Notification & Alert Center Manager
 * Governs In-App Notifications, Breaking News Broadcasts, and User Preferences.
 */

import crypto from 'node:crypto';
import {
  NOTIFICATION_TYPES,
  AUDIENCE_LIMITS,
  AUDIENCE_ERROR_CODES,
} from './constants.js';

export class NotificationManager {
  constructor(adapter, preferenceManager) {
    if (!adapter) throw new Error('Persistence adapter required for NotificationManager');
    this.adapter = adapter;
    this.preferenceManager = preferenceManager;
    // Broadcast deduplication cache to prevent alert flooding
    this.alertDedupMap = new Map();
  }

  /**
   * Retrieves notifications for a specific user
   */
  async getNotifications(userId, options = {}, user = null) {
    if (!userId) return [];
    return this.adapter.getNotifications(userId, options);
  }

  /**
   * Marks a specific notification as read
   */
  async markRead(notificationId, userId = null, user = null) {
    if (!notificationId) throw new Error('notificationId required');
    return this.adapter.markNotificationRead(notificationId, userId, user);
  }

  /**
   * Marks all notifications as read for a user
   */
  async markAllRead(userId, user = null) {
    if (!userId) throw new Error('userId required');
    if (this.adapter.markAllNotificationsRead) {
      return this.adapter.markAllNotificationsRead(userId, user);
    }
    return { success: true };
  }

  /**
   * Dispatches a notification to users or broadcasts across districts
   */
  async dispatchNotification({
    type = NOTIFICATION_TYPES.BREAKING_ALERT,
    title,
    message,
    articleId = null,
    district = 'ALL',
    recipientId = 'ALL',
    priority = 'normal',
    data = {},
  } = {}, user = null) {
    if (!title || !message) {
      const err = new Error('title and message are required for notification');
      err.code = AUDIENCE_ERROR_CODES.ERR_NOTIFICATION_DISPATCH_FAILED;
      err.statusCode = 400;
      throw err;
    }

    // Duplicate Prevention (suppress identical broadcast within 10 minutes)
    const dedupKey = `${type}|${title}|${district}`;
    const now = Date.now();
    const lastAlert = this.alertDedupMap.get(dedupKey);
    if (lastAlert && now - lastAlert < 10 * 60 * 1000) {
      return {
        success: true,
        suppressedDuplicate: true,
        message: 'समान शीर्षक वाला अलर्ट हाल ही में प्रसारित किया गया था, डुप्लीकेट रोका गया।',
      };
    }
    this.alertDedupMap.set(dedupKey, now);

    const notificationRecord = {
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type,
      title: String(title).trim(),
      message: String(message).trim(),
      articleId,
      district,
      recipientId,
      priority, // normal, high, critical
      isRead: false,
      data,
      sentBy: user?.fullName || 'सिस्टम',
      createdAt: new Date().toISOString(),
    };

    const saved = await this.adapter.createNotification(notificationRecord, user);

    if (this.adapter.addAuditLog) {
      this.adapter.addAuditLog(
        user?.fullName || 'सिस्टम',
        'NOTIFICATION_CENTER',
        'NOTIFICATION_DISPATCHED',
        `अलर्ट प्रेषित: [${type}] ${title} -> ${district} (${recipientId})`,
        null
      );
    }

    return {
      success: true,
      id: saved.id,
      notification: saved,
      externalPushSent: false, // External push safely disabled until live FCM credentials verified
    };
  }
}
