import { Request, Response } from 'express';
import { LoanService } from '../services/loan.service';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export class LoanController {
  constructor(
    private loanService = new LoanService(),
    private notificationService = new NotificationService(),
    private userService = new UserService()
  ) {}

  issueLoan = async (req: AuthRequest, res: Response) => {
    try {
      const { clientId, amount } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new AppError('Admin not authenticated', 401);
      }

      const client = await this.userService.findById(clientId);
      if (!client) {
        throw new AppError('Client not found', 404);
      }

      const loan = await this.loanService.create({
        clientId,
        clientName: client.name,
        amount: parseFloat(amount)
      });

      await this.notificationService.create({
        recipientId: clientId,
        message: `Loan of ₦${amount} approved. 5% upfront interest deducted. ₦${loan.disbursementAmount} disbursed.`,
        isBroadcast: false
      });

      res.status(201).json({
        success: true,
        data: loan,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to issue loan', 500);
    }
  };

  getClientLoans = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const loans = await this.loanService.getUserLoans(userId);

      res.json({
        success: true,
        data: loans,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get loans', 500);
    }
  };

  getAllLoans = async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query;
      const loans = await this.loanService.getAllLoans(status as string);

      res.json({
        success: true,
        data: loans,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get loans', 500);
    }
  };

  getLoanById = async (req: AuthRequest, res: Response) => {
    try {
      const { loanId } = req.params;
      const loan = await this.loanService.findById(loanId);

      if (!loan) {
        throw new AppError('Loan not found', 404);
      }

      res.json({
        success: true,
        data: loan,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get loan', 500);
    }
  };

  processInterest = async (req: AuthRequest, res: Response) => {
    try {
      const processedLoans = await this.loanService.processInterestCharges();

      res.json({
        success: true,
        data: {
          processed: processedLoans.length,
          loans: processedLoans
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to process interest', 500);
    }
  };

  getLoanStats = async (req: AuthRequest, res: Response) => {
    try {
      const stats = await this.loanService.getLoanStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to get loan stats', 500);
    }
  };
}