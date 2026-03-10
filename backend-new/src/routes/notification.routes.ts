import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';
import { body, param } from 'express-validator';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authenticate);

// User routes
router.get('/', notificationController.getUserNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:notificationId/read', 
  param('notificationId').isUUID(),
  notificationController.markAsRead
);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

// Admin broadcast route
router.post('/broadcast', 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2),
  body('message').notEmpty().isString(),
  body('recipientId').optional().isUUID(),
  notificationController.broadcastNotification
);

export default router;