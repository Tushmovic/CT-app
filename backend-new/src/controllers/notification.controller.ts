import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export class NotificationController {
  constructor(private notificationService = new NotificationService()) {}

  getUserNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const notifications = await this.notificationService.getUserNotifications(userId);

      res.json({
        success: true,
        data: notifications,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get notifications', 500);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const notification = await this.notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        data: notification,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark notification as read', 500);
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await this.notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to mark notifications as read', 500);
    }
  };

  broadcastNotification = async (req: AuthRequest, res: Response) => {
    try {
      const { message, recipientId } = req.body;
      const senderId = req.user?.userId;

      if (!senderId) {
        throw new AppError('Admin not authenticated', 401);
      }

      const notification = await this.notificationService.create({
        recipientId: recipientId || 'ALL',
        message,
        isBroadcast: true
      });

      // Emit via WebSocket would happen here

      res.status(201).json({
        success: true,
        data: notification,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to broadcast notification', 500);
    }
  };

  deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
      const { notificationId } = req.params;

      await this.notificationService.delete(notificationId);

      res.json({
        success: true,
        message: 'Notification deleted',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to delete notification', 500);
    }
  };

  getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const count = await this.notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get unread count', 500);
    }
  };
}