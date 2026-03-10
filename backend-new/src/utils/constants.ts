import { UserRole, UserStatus, PaymentType, PaymentStatus } from '../types';

export const INITIAL_ADMINS = [
  {
    name: 'System Admin One',
    email: 'admin1@contributionteam.com',
    jerseyNumber: 'ADMIN-01',
    password: 'admin1',
    role: UserRole.ADMIN1,
    status: UserStatus.APPROVED,
    isFirstLogin: false
  },
  {
    name: 'System Admin Two',
    email: 'admin2@contributionteam.com',
    jerseyNumber: 'ADMIN-02',
    password: 'admin2',
    role: UserRole.ADMIN2,
    status: UserStatus.APPROVED,
    isFirstLogin: false
  }
];

export const PAYMENT_TYPES = Object.values(PaymentType);

export const DEFAULT_SETTINGS = {
  automatedRemindersEnabled: true,
  loanInterestRate: 0.05, // 5%
  loanTermMonths: 3,
  maxLoanAmount: 5000000,
  minContribution: 1000,
  maxContribution: 1000000
};

export const INTEREST_RATES = {
  UPFRONT: 0.05,
  RECURRING: 0.05
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_DIR: 'uploads/receipts'
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};