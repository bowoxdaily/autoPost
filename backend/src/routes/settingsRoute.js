import express from 'express';
import { getSettingsHandler, updateSettingsHandler } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', getSettingsHandler);
router.post('/', updateSettingsHandler);

export default router;
