import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUserApiKeys,
  createApiKey,
  revokeApiKey,
  updateApiKey
} from '../controllers/apiKeyController.js';

const router = express.Router();

// All routes require JWT authentication
router.use(authMiddleware);

// GET: Get all API keys for current user
router.get('/', getUserApiKeys);

// POST: Create new API key
router.post('/', createApiKey);

// PUT: Update API key name
router.put('/:keyId', updateApiKey);

// DELETE: Revoke API key
router.delete('/:keyId', revokeApiKey);

export default router;
