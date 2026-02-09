
import { PaymentType, UserRole, UserStatus } from './types';

export const PAYMENT_TYPES = [
  PaymentType.CONTRIBUTION,
  PaymentType.SAVING,
  PaymentType.DIAMOND_SAVING,
  PaymentType.LOAN_REPAYMENT
];

export const INITIAL_ADMINS = [
  {
    id: 'mgr-001',
    name: 'System Admin One',
    email: 'admin1@contributionteam.com',
    jerseyNumber: 'ADMIN-01',
    password: 'admin1',
    role: UserRole.ADMIN1,
    status: UserStatus.APPROVED,
    isFirstLogin: false,
    registrationDate: new Date().toISOString()
  },
  {
    id: 'mgr-002',
    name: 'System Admin Two',
    email: 'admin2@contributionteam.com',
    jerseyNumber: 'ADMIN-02',
    password: 'admin2',
    role: UserRole.ADMIN2,
    status: UserStatus.APPROVED,
    isFirstLogin: false,
    registrationDate: new Date().toISOString()
  }
];