import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getLogsHandler, clearLogsHandler } from '../controllers/logsController.js';

const router = express.Router();

router.get('/', authMiddleware, getLogsHandler);
router.delete('/', authMiddleware, clearLogsHandler);

export default router;
