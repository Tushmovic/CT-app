import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { UserRole, UserStatus } from '../types';

export class UserController {
  constructor(
    private userService = new UserService(),
    private notificationService = new NotificationService()
  ) {}

  getProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await this.userService.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: user.toJSON(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get profile', 500);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { name, email } = req.body;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await this.userService.update(userId, { name, email });
      
      res.json({
        success: true,
        data: user?.toJSON(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to update profile', 500);
    }
  };

  getPendingUsers = async (req: AuthRequest, res: Response) => {
    try {
      const users = await this.userService.getPendingUsers();
      
      res.json({
        success: true,
        data: users.map(u => u.toJSON()),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get pending users', 500);
    }
  };

  getActiveClients = async (req: AuthRequest, res: Response) => {
    try {
      const users = await this.userService.getActiveClients();
      
      res.json({
        success: true,
        data: users.map(u => u.toJSON()),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get active clients', 500);
    }
  };

  getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
      const { search } = req.query;
      const users = await this.userService.getAllUsers(search as string);
      
      res.json({
        success: true,
        data: users.map(u => u.toJSON()),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get users', 500);
    }
  };

  approveUser = async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { jerseyNumber, password } = req.body;

      const user = await this.userService.approveUser(userId, jerseyNumber, password);
      
      await this.notificationService.create({
        recipientId: user.id,
        message: `Your account has been approved! Your jersey number is ${jerseyNumber}. Please login and change your password.`,
        isBroadcast: false
      });

      res.json({
        success: true,
        message: 'User approved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to approve user', 500);
    }
  };

  rejectUser = async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;

      await this.userService.rejectUser(userId);

      res.json({
        success: true,
        message: 'User rejected successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to reject user', 500);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;

      await this.userService.delete(userId);

      res.json({
        success: true,
        message: 'User deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to delete user', 500);
    }
  };

  resetUserPassword = async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      await this.userService.resetPassword(userId, newPassword);

      await this.notificationService.create({
        recipientId: userId,
        message: 'Your password has been reset by an administrator. Please login with your new password.',
        isBroadcast: false
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to reset password', 500);
    }
  };
}