import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  issueLoanSchema,
  getLoanByIdSchema,
  getLoansSchema
} from '../validators/loan.validator';

const router = Router();
const loanController = new LoanController();

// Client routes
router.get('/my-loans', 
  authenticate, 
  loanController.getClientLoans
);

// Admin routes
router.post('/issue', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(issueLoanSchema),
  loanController.issueLoan
);

router.get('/all', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(getLoansSchema),
  loanController.getAllLoans
);

router.get('/stats', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  loanController.getLoanStats
);

router.post('/process-interest', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  loanController.processInterest
);

router.get('/:loanId', 
  authenticate, 
  validate(getLoanByIdSchema),
  loanController.getLoanById
);

export default router;