/**
 * BREAKING NEWS WALA — Notification Controller
 * Grounded in docs/13-API.md (Section 15, NOTIF-01 through NOTIF-06)
 * and docs/DECISIONS.md (DEC-026).
 */

import { Request, Response, NextFunction } from 'express';
import { NotificationService, notificationService } from './notification.service';

export class NotificationController {
  constructor(private readonly service: NotificationService = notificationService) {}

  /**
   * GET /api/v1/notifications
   * (NOTIF-01: Paginated list of user notifications, breaking alerts, editorial feedback)
   */
  public getUserNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { page, limit, unreadOnly } = req.query as Record<string, string>;

      const result = await this.service.getUserNotifications(userId, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        unreadOnly: unreadOnly === 'true',
      });

      res.apiSuccess(
        { notifications: result.items },
        {
          pagination: {
            total: result.total,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            totalPages: Math.ceil(result.total / (limit ? parseInt(limit, 10) : 20)),
          },
        }
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/notifications/unread-count
   * (Retrieves total unread notifications count)
   */
  public getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const count = await this.service.getUnreadCount(userId);
      res.apiSuccess({ unreadCount: count });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/notifications/:id/read
   * (NOTIF-02: Marks a specific notification as read)
   */
  public markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.service.markAsRead(id as string, userId);
      res.apiSuccess({ notificationId: id, isRead: true });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/notifications/mark-all-read
   * (NOTIF-03: Marks all unread notifications as read for current user)
   */
  public markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const count = await this.service.markAllAsRead(userId);
      res.apiSuccess({ markedCount: count, allRead: true });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/notifications/preferences
   * (NOTIF-04: Retrieves user notification channel preferences)
   */
  public getPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const preferences = await this.service.getPreferences(userId);
      res.apiSuccess({ preferences });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/v1/notifications/preferences
   * (NOTIF-05: Updates notification preferences)
   */
  public updatePreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const updated = await this.service.updatePreferences(userId, req.body);
      res.apiSuccess({ preferences: updated });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/notifications/broadcast
   * (NOTIF-06: Broadcasts breaking news push notification to Web and Android devices)
   */
  public broadcastAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = req.user!.id;
      const adminRoles = req.user!.roles;
      const result = await this.service.broadcastAdminNotification(adminId, adminRoles, req.body);
      res.status(202).apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/notifications/register-device
   * (Registers or updates hardware push token for authenticated or anonymous user)
   */
  public registerDevice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id || null;
      const device = await this.service.registerDevice(userId, req.body);
      res.status(201).apiSuccess({
        registered: true,
        deviceId: device.id,
        platform: device.platform,
        lastActiveAt: device.lastActiveAt,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/notifications/devices/:token
   * (Unregisters a device push token)
   */
  public unregisterDevice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id || null;
      const { token } = req.params;
      await this.service.unregisterDevice(userId, token as string);
      res.apiSuccess({ unregistered: true });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/notifications/devices
   * (Lists active devices registered to authenticated user)
   */
  public getUserDevices = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const devices = await this.service.getUserDevices(userId);
      res.apiSuccess({ devices });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/notifications/events/article-published
   * (Internal event receiver for published news stories)
   */
  public onArticlePublished = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.handleArticlePublished(req.body);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };
}

export const notificationController = new NotificationController();

