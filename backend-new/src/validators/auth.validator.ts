import { body } from 'express-validator';

export const loginSchema = [
  body('jerseyNumber')
    .notEmpty().withMessage('Jersey number is required')
    .isString().withMessage('Jersey number must be a string')
    .trim()
    .toUpperCase(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 4 }).withMessage('Password must be at least 4 characters')
];

export const registerSchema = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .toLowerCase()
];

export const changePasswordSchema = [
  body('oldPassword')
    .notEmpty().withMessage('Old password is required')
    .isString().withMessage('Old password must be a string'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isString().withMessage('New password must be a string')
    .isLength({ min: 4 }).withMessage('New password must be at least 4 characters')
    .custom((value, { req }) => {
      if (value === req.body?.oldPassword) {
        throw new Error('New password must be different from old password');
      }
      return true;
    })
];

export const forgotPasswordSchema = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
];

export const resetPasswordSchema = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isString().withMessage('New password must be a string')
    .isLength({ min: 4 }).withMessage('New password must be at least 4 characters')
];

export const refreshTokenSchema = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
];