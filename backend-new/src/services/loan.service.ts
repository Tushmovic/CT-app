import { AppDataSource } from '../config/database';
import { Loan } from '../models/loan.model';
import { Payment } from '../models/payment.model';

export class LoanService {
  private loanRepository = AppDataSource.getRepository(Loan);
  private paymentRepository = AppDataSource.getRepository(Payment);

  async create(loanData: { clientId: string; clientName: string; amount: number }): Promise<Loan> {
    const upfrontInterest = loanData.amount * 0.05;
    const disbursementAmount = loanData.amount - upfrontInterest;
    
    const openingDate = new Date();
    const closingDate = new Date();
    closingDate.setMonth(openingDate.getMonth() + 3);

    const loan = this.loanRepository.create({
      clientId: loanData.clientId,
      clientName: loanData.clientName,
      amount: loanData.amount,
      disbursementAmount,
      interestAmount: upfrontInterest,
      balance: loanData.amount,
      openingDate,
      closingDate,
      status: 'ACTIVE'
    });

    return this.loanRepository.save(loan);
  }

  async getUserLoans(userId: string): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { clientId: userId },
      order: { createdAt: 'DESC' }
    });
  }

  async getAllLoans(status?: string): Promise<Loan[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    
    return this.loanRepository.find({
      where,
      order: { createdAt: 'DESC' }
    });
  }

  async findById(loanId: string): Promise<Loan | null> {
    return this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['payments']
    });
  }

  async processInterestCharges(): Promise<Loan[]> {
    const now = new Date();
    const loans = await this.loanRepository.find({
      where: { status: 'ACTIVE' }
    });

    const processedLoans: Loan[] = [];

    for (const loan of loans) {
      if (loan.balance > 0 && new Date(loan.closingDate) < now) {
        const recurringInterest = loan.balance * 0.05;
        const newClosing = new Date(loan.closingDate);
        newClosing.setMonth(newClosing.getMonth() + 3);
        
        loan.balance = loan.balance + recurringInterest;
        loan.interestAmount = loan.interestAmount + recurringInterest;
        loan.closingDate = newClosing;
        
        await this.loanRepository.save(loan);
        processedLoans.push(loan);
      }
    }

    return processedLoans;
  }

  async getLoanStats() {
    const totalLoans = await this.loanRepository.count();
    const activeLoans = await this.loanRepository.count({ where: { status: 'ACTIVE' } });
    
    const totals = await this.loanRepository
      .createQueryBuilder('loan')
      .select('SUM(loan.amount)', 'totalPrincipal')
      .addSelect('SUM(loan.disbursementAmount)', 'totalDisbursed')
      .addSelect('SUM(loan.interestAmount)', 'totalInterest')
      .addSelect('SUM(loan.balance)', 'totalOutstanding')
      .getRawOne();

    return {
      totalLoans,
      activeLoans,
      totalPrincipal: totals?.totalPrincipal || 0,
      totalDisbursed: totals?.totalDisbursed || 0,
      totalInterest: totals?.totalInterest || 0,
      totalOutstanding: totals?.totalOutstanding || 0
    };
  }
}