import { AppDataSource } from '../config/database';
import { Payment } from '../models/payment.model';
import { Loan } from '../models/loan.model';
import { PaymentStatus, PaymentType } from '../types';

export class PaymentService {
  private paymentRepository = AppDataSource.getRepository(Payment);
  private loanRepository = AppDataSource.getRepository(Loan);

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(paymentData);
    return this.paymentRepository.save(payment);
  }

  async getUserPayments(userId: string, status?: PaymentStatus): Promise<Payment[]> {
    const where: any = { clientId: userId };
    if (status) {
      where.status = status;
    }
    
    return this.paymentRepository.find({
      where,
      order: { date: 'DESC' }
    });
  }

  async getAllPayments(options?: { status?: PaymentStatus; page?: number; limit?: number }) {
    const query = this.paymentRepository.createQueryBuilder('payment');
    
    if (options?.status) {
      query.where('payment.status = :status', { status: options.status });
    }
    
    query.orderBy('payment.date', 'DESC');
    
    if (options?.page && options?.limit) {
      const skip = (options.page - 1) * options.limit;
      query.skip(skip).take(options.limit);
    }
    
    const [items, total] = await query.getManyAndCount();
    
    return {
      items,
      total,
      page: options?.page || 1,
      limit: options?.limit || items.length,
      totalPages: options?.limit ? Math.ceil(total / options.limit) : 1
    };
  }

  async getPendingPayments(): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { status: PaymentStatus.PENDING },
      order: { date: 'ASC' }
    });
  }

  async updateStatus(paymentId: string, status: PaymentStatus, adminId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOneBy({ id: paymentId });
    if (!payment) {
      throw new Error('Payment not found');
    }

    // If approving a loan repayment, update loan balance
    if (status === PaymentStatus.APPROVED && 
        payment.type === PaymentType.LOAN_REPAYMENT && 
        payment.loanId) {
      const loan = await this.loanRepository.findOneBy({ id: payment.loanId });
      if (loan) {
        const newBalance = Math.max(0, loan.balance - payment.amount);
        loan.balance = newBalance;
        loan.status = newBalance <= 0 ? 'PAID' : 'ACTIVE';
        await this.loanRepository.save(loan);
      }
    }

    payment.status = status;
    payment.processedBy = adminId;
    payment.processedAt = new Date();
    
    return this.paymentRepository.save(payment);
  }

  async getPaymentStats() {
    const stats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.type', 'type')
      .addSelect('SUM(CASE WHEN payment.status = :approved THEN payment.amount ELSE 0 END)', 'approved')
      .addSelect('SUM(CASE WHEN payment.status = :pending THEN payment.amount ELSE 0 END)', 'pending')
      .addSelect('COUNT(payment.id)', 'count')
      .setParameter('approved', PaymentStatus.APPROVED)
      .setParameter('pending', PaymentStatus.PENDING)
      .groupBy('payment.type')
      .getRawMany();

    const totalApproved = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.APPROVED })
      .getRawOne();

    return {
      byType: stats,
      totalApproved: totalApproved?.total || 0,
      pendingCount: await this.paymentRepository.count({ where: { status: PaymentStatus.PENDING } })
    };
  }
}