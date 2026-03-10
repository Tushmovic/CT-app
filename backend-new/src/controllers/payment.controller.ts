import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { PaymentStatus } from '../types';

export class PaymentController {
  constructor(
    private paymentService = new PaymentService(),
    private notificationService = new NotificationService()
  ) {}

  submitPayment = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const paymentData = req.body;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const payment = await this.paymentService.create({
        ...paymentData,
        clientId: userId
      });

      // Notify admins
      await this.notificationService.create({
        recipientId: 'ALL',
        message: `New payment of ₦${payment.amount} submitted by ${payment.clientName}`,
        isBroadcast: true
      });

      res.status(201).json({
        success: true,
        data: payment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to submit payment', 500);
    }
  };

  getClientPayments = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { status } = req.query;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const payments = await this.paymentService.getUserPayments(
        userId, 
        status as PaymentStatus | undefined
      );

      res.json({
        success: true,
        data: payments,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get payments', 500);
    }
  };

  getAllPayments = async (req: AuthRequest, res: Response) => {
    try {
      const { status, page, limit } = req.query;

      const result = await this.paymentService.getAllPayments({
        status: status as PaymentStatus,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get payments', 500);
    }
  };

  getPendingPayments = async (req: AuthRequest, res: Response) => {
    try {
      const payments = await this.paymentService.getPendingPayments();

      res.json({
        success: true,
        data: payments,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get pending payments', 500);
    }
  };

  updatePaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { paymentId } = req.params;
      const { status } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new AppError('Admin not authenticated', 401);
      }

      const payment = await this.paymentService.updateStatus(
        paymentId, 
        status as PaymentStatus,
        adminId
      );

      // Notify client
      await this.notificationService.create({
        recipientId: payment.clientId,
        message: `Your payment of ₦${payment.amount} has been ${status.toLowerCase()}`,
        isBroadcast: false
      });

      res.json({
        success: true,
        data: payment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update payment status', 500);
    }
  };

  getPaymentStats = async (req: AuthRequest, res: Response) => {
    try {
      const stats = await this.paymentService.getPaymentStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get payment stats', 500);
    }
  };
}