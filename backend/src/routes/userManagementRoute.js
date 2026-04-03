import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperuser } from '../middleware/roleAuth.js';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateSubscriptionPlan,
  deleteUser,
  getSystemStats
} from '../controllers/userManagementController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET: System stats (Superuser only)
router.get('/stats', requireSuperuser, getSystemStats);

// GET: All users (Superuser only)
router.get('/', requireSuperuser, getAllUsers);

// GET: User by ID (Superuser or own profile)
router.get('/:userId', getUserById);

// PUT: Update user role (Superuser only)
router.put('/:userId/role', requireSuperuser, updateUserRole);

// PUT: Update subscription plan (Superuser only)
router.put('/:userId/subscription', requireSuperuser, updateSubscriptionPlan);

// DELETE: Delete user (Superuser only)
router.delete('/:userId', requireSuperuser, deleteUser);

export default router;
