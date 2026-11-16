import { Router } from 'express';
import { getAdminStats, getCalendarFeed } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Public / client calendar feed
router.get('/calendar', getCalendarFeed);

// Protected Admin Overview Statistics
router.get('/stats', authenticate, requireRole('ADMIN'), getAdminStats);

export default router;
