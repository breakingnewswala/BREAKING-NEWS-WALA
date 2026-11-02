/**
 * BREAKING NEWS WALA — Notification Routes
 * Grounded in docs/13-API.md (Section 15, NOTIF-01 through NOTIF-06)
 * and docs/DECISIONS.md (DEC-031).
 */

import { Router } from 'express';
import { requireAuth, optionalAuth } from '../auth/auth.middleware';
import { notificationController } from './notification.controller';
import {
  validateAdminBroadcast,
  validateNotificationIdParam,
  validateRegisterDevice,
  validateUpdatePreferences,
} from './notification.validator';

const router = Router();
const adminRouter = Router();

// 1. User In-App Notification Inbox (NOTIF-01 through NOTIF-03)
router.get('/', requireAuth, notificationController.getUserNotifications);
router.get('/unread-count', requireAuth, notificationController.getUnreadCount);
router.patch('/:id/read', requireAuth, validateNotificationIdParam, notificationController.markAsRead);
router.post('/mark-all-read', requireAuth, notificationController.markAllAsRead);

// 2. User Notification Preferences (NOTIF-04, NOTIF-05)
router.get('/preferences', requireAuth, notificationController.getPreferences);
router.put('/preferences', requireAuth, validateUpdatePreferences, notificationController.updatePreferences);

// 3. Hardware Device & Push Token Registration (DEC-031, Area E)
router.post('/register-device', optionalAuth, validateRegisterDevice, notificationController.registerDevice);
router.post('/register-token', optionalAuth, validateRegisterDevice, notificationController.registerDevice); // Canonical alias
router.delete('/devices/:token', optionalAuth, notificationController.unregisterDevice);
router.get('/devices', requireAuth, notificationController.getUserDevices);

// 4. Admin Manual Broadcast (NOTIF-06, RULE-NOT-001)
router.post('/broadcast', requireAuth, validateAdminBroadcast, notificationController.broadcastAdmin);
router.post('/admin/broadcast', requireAuth, validateAdminBroadcast, notificationController.broadcastAdmin);

// 5. Internal Article Publication Event Hook
router.post('/events/article-published', requireAuth, notificationController.onArticlePublished);

// Standalone admin router specifically for mounting at /api/v1/admin/notifications
adminRouter.post('/broadcast', requireAuth, validateAdminBroadcast, notificationController.broadcastAdmin);

export { router as notificationRouter, adminRouter as adminNotificationRouter };

