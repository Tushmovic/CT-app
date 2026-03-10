import { body, param, query } from 'express-validator';

export const issueLoanSchema = [
  body('clientId')
    .notEmpty().withMessage('Client ID is required')
    .isUUID().withMessage('Invalid client ID format'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isNumeric().withMessage('Amount must be a number')
    .custom(value => value > 0).withMessage('Amount must be greater than 0')
    .custom(value => value <= 5000000).withMessage('Amount cannot exceed ₦5,000,000')
];

export const getLoanByIdSchema = [
  param('loanId')
    .notEmpty().withMessage('Loan ID is required')
    .isUUID().withMessage('Invalid loan ID format')
];

export const getLoansSchema = [
  query('status')
    .optional()
    .isIn(['ACTIVE', 'PAID']).withMessage('Invalid loan status')
];