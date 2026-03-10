import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.model';
import { Payment } from './payment.model';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  clientName: string;

  @ManyToOne(() => User, user => user.loans)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  disbursementAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  interestAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  balance: number;

  @Column()
  openingDate: Date;

  @Column()
  closingDate: Date;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'PAID'],
    default: 'ACTIVE'
  })
  status: 'ACTIVE' | 'PAID';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  issuedBy: string;

  @OneToMany(() => Payment, payment => payment.loan)
  payments: Payment[];
}