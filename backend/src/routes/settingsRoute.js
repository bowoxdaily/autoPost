import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getSettingsHandler, updateSettingsHandler } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', authMiddleware, getSettingsHandler);
router.post('/', authMiddleware, updateSettingsHandler);

export default router;
