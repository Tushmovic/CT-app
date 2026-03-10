export enum UserRole {
  ADMIN1 = 'ADMIN1',
  ADMIN2 = 'ADMIN2',
  CLIENT = 'CLIENT'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PaymentType {
  CONTRIBUTION = 'Contribution',
  SAVING = 'Saving',
  DIAMOND_SAVING = 'Diamond Saving',
  LOAN_REPAYMENT = 'Loan Repayment'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  jerseyNumber?: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  isFirstLogin: boolean;
  registrationDate: string;
  lastLogin?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  type: PaymentType;
  date: string;
  receiptUrl: string;
  status: PaymentStatus;
  loanId?: string;
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  disbursementAmount: number;
  interestAmount: number;
  balance: number;
  openingDate: string;
  closingDate: string;
  status: 'ACTIVE' | 'PAID';
}

export interface Notification {
  id: string;
  recipientId: string;
  message: string;
  date: string;
  isRead?: boolean;
  readAt?: Date;
  isBroadcast?: boolean;
}

export const PAYMENT_TYPES = Object.values(PaymentType);

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}