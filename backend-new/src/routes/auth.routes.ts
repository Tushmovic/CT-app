import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/security.middleware';
import { 
  loginSchema, 
  registerSchema, 
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;