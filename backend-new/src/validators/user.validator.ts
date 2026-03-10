import { body, param, query } from 'express-validator';

export const approveUserSchema = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('Invalid user ID format'),
  body('jerseyNumber')
    .notEmpty().withMessage('Jersey number is required')
    .isString().withMessage('Jersey number must be a string')
    .trim()
    .toUpperCase()
    .isLength({ min: 3, max: 20 }).withMessage('Jersey number must be between 3 and 20 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 4 }).withMessage('Password must be at least 4 characters')
];

export const rejectUserSchema = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('Invalid user ID format')
];

export const deleteUserSchema = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('Invalid user ID format')
];

export const resetUserPasswordSchema = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('Invalid user ID format'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isString().withMessage('New password must be a string')
    .isLength({ min: 4 }).withMessage('New password must be at least 4 characters')
];

export const updateProfileSchema = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
];

export const searchUsersSchema = [
  query('search')
    .optional()
    .isString().withMessage('Search term must be a string')
    .trim()
];