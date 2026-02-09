
import { backendApi } from '../backend/api';
import { User, Payment, PaymentStatus } from '../types';

// In a real application, this would be your deployed backend URL (e.g., 'https://your-api.com')
// For this simulation, we directly call backendApi functions.
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api'; 

export const api = {
  login: backendApi.login,
  register: backendApi.register,
  updatePassword: backendApi.updatePassword,
  submitPayment: backendApi.submitPayment,
  
  // Data fetchers - now calling the backend's data aggregation functions
  getClientDashboard: async (clientId: string) => {
    // Conceptually, this would be a fetch call: fetch(`${API_BASE_URL}/client/dashboard/${clientId}`)
    // For simulation, we directly call the backend function:
    return backendApi.getClientDashboardData(clientId);
  },

  getManagerDashboard: async () => {
    // Conceptually: fetch(`${API_BASE_URL}/manager/dashboard`)
    return backendApi.getManagerDashboardData();
  },

  approveClient: backendApi.approveUser,
  rejectClient: backendApi.rejectUser,
  deleteUser: backendApi.deleteUser,
  adminResetPassword: backendApi.resetUserPassword,
  processPayment: backendApi.updatePaymentStatus,
  broadcast: backendApi.sendNotification,
  updateSettings: backendApi.updateSettings,
  issueLoan: backendApi.issueLoan
};