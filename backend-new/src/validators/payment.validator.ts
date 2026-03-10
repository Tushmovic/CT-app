import { body, param, query } from 'express-validator';
import { PaymentType } from '../types';

export const submitPaymentSchema = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isNumeric().withMessage('Amount must be a number')
    .custom(value => value > 0).withMessage('Amount must be greater than 0')
    .custom(value => value <= 10000000).withMessage('Amount cannot exceed ₦10,000,000'),
  body('type')
    .notEmpty().withMessage('Payment type is required')
    .isIn(Object.values(PaymentType)).withMessage('Invalid payment type'),
  body('receiptUrl')
    .notEmpty().withMessage('Receipt is required')
    .isString().withMessage('Receipt must be a valid URL')
    .isURL().withMessage('Receipt must be a valid URL'),
  body('loanId')
    .optional()
    .isUUID().withMessage('Invalid loan ID format')
    .custom((value, { req }) => {
      if (req.body?.type === PaymentType.LOAN_REPAYMENT && !value) {
        throw new Error('Loan ID is required for loan repayments');
      }
      return true;
    })
];

export const updatePaymentStatusSchema = [
  param('paymentId')
    .notEmpty().withMessage('Payment ID is required')
    .isUUID().withMessage('Invalid payment ID format'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid payment status')
];

export const getPaymentsSchema = [
  query('status')
    .optional()
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];