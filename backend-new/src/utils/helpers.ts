import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';

export const generateId = (): string => {
  return uuidv4();
};

export const generateJerseyNumber = (name: string): string => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
  
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${initials}-${randomNum}`;
};

export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString(undefined, { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
};

export const calculateLoanDisbursement = (
  principal: number,
  interestRate: number
): { disbursementAmount: number; interestAmount: number } => {
  const interestAmount = principal * interestRate;
  const disbursementAmount = principal - interestAmount;
  return { disbursementAmount, interestAmount };
};

export const calculateDueDate = (months: number = 3): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
};

export const sanitizeFileName = (fileName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop();
  return `receipt_${timestamp}_${random}.${extension}`;
};

export const sendSuccess = (res: Response, data: any, message?: string) => {
  return res.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

export const sendError = (res: Response, error: string, statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  });
};

export const generateRandomPassword = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};