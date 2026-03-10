import { AppDataSource } from '../config/database';
import { Notification } from '../models/notification.model';
import { WebSocketService } from './websocket.service';

export class NotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);
  private wsService: WebSocketService;

  constructor() {
    this.wsService = WebSocketService.getInstance();
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      date: new Date()
    });

    const saved = await this.notificationRepository.save(notification);

    // Emit via WebSocket
    if (data.recipientId === 'ALL') {
      this.wsService?.emitToAll?.('NEW_NOTIFICATION', saved);
    } else if (data.recipientId) {
      this.wsService?.emitToUser?.(data.recipientId, 'NEW_NOTIFICATION', saved);
    }

    return saved;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: [
        { recipientId: userId },
        { recipientId: 'ALL' }
      ],
      order: { date: 'DESC' }
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findOneBy({ 
      id: notificationId,
      recipientId: userId 
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update()
      .set({ isRead: true, readAt: new Date() })
      .where('(recipientId = :userId OR recipientId = :all) AND isRead = false', { 
        userId, 
        all: 'ALL' 
      })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: [
        { recipientId: userId, isRead: false },
        { recipientId: 'ALL', isRead: false }
      ]
    });
  }

  async delete(notificationId: string): Promise<void> {
    await this.notificationRepository.delete(notificationId);
  }

  async deleteOldNotifications(days: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('date < :cutoffDate', { cutoffDate })
      .execute();
  }
}