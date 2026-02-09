
import { User, Payment, Notification, UserRole, UserStatus, PaymentStatus, Loan, PaymentType } from '../types';
import { INITIAL_ADMINS, PAYMENT_TYPES } from '../constants';

const STORAGE_KEYS = { // These are now conceptual keys for the in-memory state
  USERS: 'hub_users',
  PAYMENTS: 'hub_payments',
  NOTIFICATIONS: 'hub_notifications',
  SETTINGS: 'hub_settings',
  LOANS: 'hub_loans'
};

const DEFAULT_SETTINGS = {
  automatedRemindersEnabled: true
};

// Global in-memory state representing our "cloud database"
interface AppState {
  users: User[];
  payments: Payment[];
  notifications: Notification[];
  settings: any;
  loans: Loan[];
}

let _dbState: AppState = {
  users: [],
  payments: [],
  notifications: [],
  settings: DEFAULT_SETTINGS,
  loans: []
};

// Simple event bus for real-time simulation
type EventCallback = (event: string, payload?: any) => void;
const _eventBus: Record<string, EventCallback[]> = {};

export const _publish = (event: string, payload?: any) => {
  if (_eventBus[event]) {
    _eventBus[event].forEach(callback => callback(event, payload));
  }
};

export const _subscribe = (event: string, callback: EventCallback) => {
  if (!_eventBus[event]) {
    _eventBus[event] = [];
  }
  _eventBus[event].push(callback);
  return () => {
    _eventBus[event] = _eventBus[event].filter(cb => cb !== callback);
  };
};

// Function to seed the database (called once on app load in index.tsx)
export const _seedDatabase = () => {
  _dbState = {
    users: JSON.parse(JSON.stringify(INITIAL_ADMINS)) as User[], // Deep copy to prevent mutations
    payments: [],
    notifications: [],
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    loans: []
  };
  console.log('Simulated backend database seeded.');
};


// Utility functions to access/modify the centralized in-memory state
const _getUsers = (): User[] => _dbState.users;
const _saveUsers = (users: User[]) => {
  _dbState.users = users;
  _publish('USER_UPDATED', users);
};

const _getPayments = (): Payment[] => _dbState.payments;
const _savePayments = (payments: Payment[]) => {
  _dbState.payments = payments;
  _publish('PAYMENT_UPDATED', payments);
};

const _getNotifs = (): Notification[] => _dbState.notifications;
const _saveNotifs = (notifs: Notification[]) => {
  _dbState.notifications = notifs;
  _publish('NOTIFICATION_DISPATCHED', notifs);
};

const _getSettings = () => _dbState.settings;
const _saveSettings = (settings: any) => {
  _dbState.settings = settings;
  _publish('SETTINGS_UPDATED', settings);
};

const _getLoans = (): Loan[] => _dbState.loans;
const _saveLoans = (loans: Loan[]) => {
  _dbState.loans = loans;
  _publish('LOAN_UPDATED', loans);
};


// Simulated Backend API Endpoints
export const backendApi = {
  login: async (jersey: string, pass: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = _getUsers();
        const user = users.find(u => u.jerseyNumber?.toUpperCase() === jersey.toUpperCase());
        if (!user) return reject('User not found.');
        if (user.password !== pass) return reject('Incorrect password.');
        if (user.status === UserStatus.PENDING) return reject('Account pending manager approval.');
        if (user.status === UserStatus.REJECTED) return reject('This account has been deactivated by an Admin.');
        
        const updated = users.map(u => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u);
        _saveUsers(updated); // Update last login in shared state
        
        resolve({ ...user, lastLogin: new Date().toISOString() });
      }, 600);
    });
  },

  register: async (name: string, email: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = _getUsers();
        const newUser: User = {
          id: `u-${Date.now()}`,
          name, 
          email,
          role: UserRole.CLIENT,
          status: UserStatus.PENDING,
          isFirstLogin: true,
          registrationDate: new Date().toISOString()
        };
        _saveUsers([...users, newUser]); // Save to shared state and publish
        resolve();
      }, 500);
    });
  },

  updatePassword: async (userId: string, newPass: string): Promise<User> => {
    return new Promise((resolve) => {
      const users = _getUsers();
      const updated = users.map(u => u.id === userId ? { ...u, password: newPass, isFirstLogin: false } : u);
      _saveUsers(updated); // Save to shared state and publish
      resolve(updated.find(u => u.id === userId)!);
    });
  },

  deleteUser: async (userId: string) => {
    const users = _getUsers();
    _saveUsers(users.filter(u => u.id !== userId)); // Update users
    const payments = _getPayments();
    _savePayments(payments.filter(p => p.clientId !== userId)); // Update payments
    const loans = _getLoans();
    _saveLoans(loans.filter(l => l.clientId !== userId)); // Update loans
    _publish('USER_DELETED', { userId }); // Specific event for deletion
  },

  resetUserPassword: async (userId: string, newPass: string) => {
    const users = _getUsers();
    _saveUsers(users.map(u => u.id === userId ? { ...u, password: newPass, isFirstLogin: true } : u)); // Save to shared state and publish
  },

  approveUser: async (userId: string, jersey: string, pass: string) => {
    const users = _getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, status: UserStatus.APPROVED, jerseyNumber: jersey, password: pass } : u);
    _saveUsers(updated); // Save to shared state and publish
    await backendApi.sendNotification(userId, `Approved! ID: ${jersey}. Login and update password.`);
  },

  rejectUser: async (userId: string) => {
    const users = _getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, status: UserStatus.REJECTED } : u);
    _saveUsers(updated); // Save to shared state and publish
  },

  submitPayment: async (payment: Omit<Payment, 'id' | 'status' | 'date'>) => {
    const payments = _getPayments();
    const newPayment: Payment = {
      ...payment,
      id: `p-${Date.now()}`,
      status: PaymentStatus.PENDING,
      date: new Date().toISOString()
    };
    _savePayments([...payments, newPayment]); // Save to shared state and publish
  },

  updatePaymentStatus: async (paymentId: string, status: PaymentStatus) => {
    const payments = _getPayments();
    const payment = payments.find(p => p.id === paymentId);
    
    if (payment && status === PaymentStatus.APPROVED && payment.type === PaymentType.LOAN_REPAYMENT && payment.loanId) {
      const loans = _getLoans();
      const updatedLoans = loans.map(l => {
        if (l.id === payment.loanId) {
          const newBalance = Math.max(0, l.balance - payment.amount);
          return { 
            ...l, 
            balance: newBalance,
            status: newBalance <= 0 ? 'PAID' : 'ACTIVE' 
          };
        }
        return l;
      });
      _saveLoans(updatedLoans as Loan[]); // Save to shared state and publish
    }

    _savePayments(payments.map(p => p.id === paymentId ? { ...p, status } : p)); // Save to shared state and publish
  },

  issueLoan: async (clientId: string, clientName: string, amount: number) => {
    const loans = _getLoans();
    const upfrontInterest = amount * 0.05;
    const disbursementAmount = amount - upfrontInterest;
    
    const openingDate = new Date();
    const closingDate = new Date();
    closingDate.setMonth(openingDate.getMonth() + 3);

    const newLoan: Loan = {
      id: `l-${Date.now()}`,
      clientId,
      clientName,
      amount: amount, 
      disbursementAmount: disbursementAmount,
      interestAmount: upfrontInterest,
      balance: amount,
      openingDate: openingDate.toISOString(),
      closingDate: closingDate.toISOString(),
      status: 'ACTIVE'
    };

    _saveLoans([...loans, newLoan]); // Save to shared state and publish
    await backendApi.sendNotification(clientId, `Loan issued. Principal: ₦${amount.toLocaleString()}, Disbursed: ₦${disbursementAmount.toLocaleString()}. Next due: ${closingDate.toLocaleDateString()}`);
  },

  _processInterest: async () => { // Internal function for loan interest logic
    const loans = _getLoans();
    const now = new Date();
    let updated = false;

    const updatedLoans = loans.map(l => {
      if (l.status === 'ACTIVE' && l.balance > 0 && new Date(l.closingDate) < now) {
        updated = true;
        const recurringInterest = l.balance * 0.05;
        const newClosing = new Date(l.closingDate);
        newClosing.setMonth(newClosing.getMonth() + 3);
        
        return {
          ...l,
          balance: l.balance + recurringInterest,
          interestAmount: l.interestAmount + recurringInterest,
          closingDate: newClosing.toISOString()
        };
      }
      return l;
    });

    if (updated) {
      _saveLoans(updatedLoans); // Save to shared state and publish
    }
  },

  sendNotification: async (recipientId: string, message: string) => {
    const notifs = _getNotifs();
    const n: Notification = { id: `n-${Date.now()}`, recipientId, message, date: new Date().toISOString() };
    _saveNotifs([...notifs, n]); // Save to shared state and publish
  },

  updateSettings: async (settings: any) => {
    _saveSettings(settings); // Save to shared state and publish
  },

  // Data aggregators for dashboards
  getClientDashboardData: async (clientId: string) => {
    await backendApi._processInterest(); // Process interest before returning data
    return {
      payments: _getPayments().filter(p => p.clientId === clientId),
      notifications: _getNotifs().filter(n => n.recipientId === clientId || n.recipientId === 'ALL'),
      settings: _getSettings(),
      loans: _getLoans().filter(l => l.clientId === clientId)
    };
  },

  getManagerDashboardData: async () => {
    await backendApi._processInterest(); // Process interest before returning data
    const allUsers = _getUsers();
    const allPayments = _getPayments();
    const allLoans = _getLoans();
    return {
      pendingUsers: allUsers.filter(u => u.status === 'PENDING'),
      allUsers: allUsers,
      activeClients: allUsers.filter(u => u.status === 'APPROVED' && u.role === 'CLIENT'),
      pendingPayments: allPayments.filter(p => p.status === 'PENDING'),
      allPayments: allPayments,
      settings: _getSettings(),
      allLoans: allLoans
    };
  }
};