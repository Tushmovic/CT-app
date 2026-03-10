import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  submitPaymentSchema,
  updatePaymentStatusSchema,
  getPaymentsSchema
} from '../validators/payment.validator';

const router = Router();
const paymentController = new PaymentController();

// Client routes
router.post('/submit', 
  authenticate, 
  validate(submitPaymentSchema), 
  paymentController.submitPayment
);

router.get('/my-payments', 
  authenticate, 
  validate(getPaymentsSchema),
  paymentController.getClientPayments
);

// Admin routes
router.get('/all', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(getPaymentsSchema),
  paymentController.getAllPayments
);

router.get('/pending', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  paymentController.getPendingPayments
);

router.get('/stats', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  paymentController.getPaymentStats
);

router.patch('/:paymentId/status', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(updatePaymentStatusSchema),
  paymentController.updatePaymentStatus
);

export default router;