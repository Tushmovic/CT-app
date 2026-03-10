import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './error.middleware';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors: any = [];
    errors.array().map(err => extractedErrors.push({ [err.type]: err.msg }));

    throw new AppError('Validation failed', 400);
  };
};

export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file && !req.files) {
    throw new AppError('No file uploaded', 400);
  }
  next();
};