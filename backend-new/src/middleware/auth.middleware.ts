import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, JwtPayload } from '../types';
import { AuthService } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const authService = new AuthService();

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = await authService.validateToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Please authenticate' 
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = await authService.validateToken(token);
      req.user = decoded;
    }
    next();
  } catch (error) {
    next();
  }
};