import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { 
  startCronHandler, 
  stopCronHandler, 
  getCronStatusHandler,
  runPostNowHandler 
} from '../controllers/cronController.js';

const router = express.Router();

router.post('/start', authMiddleware, startCronHandler);
router.post('/stop', authMiddleware, stopCronHandler);
router.get('/status', authMiddleware, getCronStatusHandler);
router.post('/run-now', authMiddleware, runPostNowHandler);

export default router;
