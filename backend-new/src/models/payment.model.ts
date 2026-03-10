import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentType, PaymentStatus } from '../types';
import { User } from './user.model';
import { Loan } from './loan.model';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  clientName: string;

  @ManyToOne(() => User, user => user.payments)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentType
  })
  type: PaymentType;

  @CreateDateColumn()
  date: Date;

  @Column()
  receiptUrl: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  loanId: string;

  @ManyToOne(() => Loan, loan => loan.payments, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ nullable: true })
  processedAt: Date;
}