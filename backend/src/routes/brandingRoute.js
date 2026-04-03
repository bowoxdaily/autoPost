import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperuser } from '../middleware/roleAuth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import {
  getPublicBranding,
  getSuperuserBranding,
  updateBranding,
  toggleBranding,
  previewBranding,
  uploadLogo
} from '../controllers/brandingController.js';

const router = express.Router();

// Public route - get active branding
router.get('/public', getPublicBranding);

// Protected routes - require authentication
router.use(authMiddleware);

// GET: Get superuser branding config
router.get('/', requireSuperuser, getSuperuserBranding);

// PUT: Update branding
router.put('/', requireSuperuser, updateBranding);

// PUT: Toggle branding active/inactive
router.put('/toggle', requireSuperuser, toggleBranding);

// POST: Preview branding changes
router.post('/preview', requireSuperuser, previewBranding);

// POST: Upload logo to storage
router.post('/upload-logo', requireSuperuser, uploadMiddleware.single('logo'), uploadLogo);

export default router;
