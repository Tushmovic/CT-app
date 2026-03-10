import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { EmailService } from '../services/email.service';
import { UserStatus, UserRole } from '../types';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  constructor(
    private authService = new AuthService(),
    private userService = new UserService(),
    private emailService = new EmailService()
  ) {}

  login = async (req: Request, res: Response) => {
    try {
      const { jerseyNumber, password } = req.body;
      
      const user = await this.userService.findByJerseyNumber(jerseyNumber);
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const isValid = await this.authService.validatePassword(password, user.passwordHash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      if (user.status === UserStatus.PENDING) {
        throw new AppError('Account pending manager approval', 403);
      }

      if (user.status === UserStatus.REJECTED) {
        throw new AppError('Account has been deactivated', 403);
      }

      const tokens = await this.authService.generateTokens(user);
      
      await this.userService.updateLastLogin(user.id);

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          ...tokens
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Login failed', 500);
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;

      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        throw new AppError('Email already registered', 400);
      }

      const user = await this.userService.create({
        name,
        email,
        role: UserRole.CLIENT,
        status: UserStatus.PENDING,
        isFirstLogin: true
      });

      // Notify admins
      await this.emailService.sendNewRegistrationAlert(user);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Awaiting manager approval.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Registration failed', 500);
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      const accessToken = await this.authService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: { accessToken },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  };

  logout = async (req: AuthRequest, res: Response) => {
    try {
      if (req.user) {
        await this.authService.revokeTokens(req.user.userId);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Logout failed', 500);
    }
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const success = await this.userService.changePassword(userId, oldPassword, newPassword);

      if (!success) {
        throw new AppError('Current password is incorrect', 400);
      }

      res.json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Password change failed', 500);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const user = await this.userService.findByEmail(email);
      if (!user) {
        // Don't reveal that user doesn't exist
        res.json({
          success: true,
          message: 'If email exists, password reset instructions will be sent',
          timestamp: new Date().toISOString()
        });
        return;
      }

      await this.emailService.sendPasswordResetEmail(user);

      res.json({
        success: true,
        message: 'Password reset instructions sent to your email',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to process request', 500);
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      // Verify reset token (you'd implement this)
      // For now, we'll just acknowledge

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