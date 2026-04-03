import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUserSettings,
  updateUserSettings,
  verifyUserCredentials
} from '../controllers/userSettingsController.js';

const router = express.Router();

// Get user settings (GET /api/user-settings)
router.get('/', authMiddleware, getUserSettings);

// Update user settings (PUT /api/user-settings)
router.put('/', authMiddleware, updateUserSettings);

// Verify user credentials (POST /api/user-settings/verify)
router.post('/verify', authMiddleware, verifyUserCredentials);

export default router;
