import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  approveUserSchema,
  rejectUserSchema,
  deleteUserSchema,
  resetUserPasswordSchema,
  updateProfileSchema,
  searchUsersSchema
} from '../validators/user.validator';

const router = Router();
const userController = new UserController();

// Profile routes (all authenticated users)
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);

// Admin only routes
router.get('/pending', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  userController.getPendingUsers
);

router.get('/active-clients', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  userController.getActiveClients
);

router.get('/all', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(searchUsersSchema),
  userController.getAllUsers
);

router.post('/:userId/approve', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(approveUserSchema),
  userController.approveUser
);

router.post('/:userId/reject', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(rejectUserSchema),
  userController.rejectUser
);

router.delete('/:userId', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(deleteUserSchema),
  userController.deleteUser
);

router.post('/:userId/reset-password', 
  authenticate, 
  authorize(UserRole.ADMIN1, UserRole.ADMIN2), 
  validate(resetUserPasswordSchema),
  userController.resetUserPassword
);

export default router;