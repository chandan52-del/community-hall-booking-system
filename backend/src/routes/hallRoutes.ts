import { Router } from 'express';
import {
  getHalls,
  getHallById,
  checkHallAvailability,
  createHall,
  updateHall,
  toggleHallStatus,
  getAmenitiesCatalog,
} from '../controllers/hallController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getHalls);
router.get('/amenities', getAmenitiesCatalog);
router.get('/:id', getHallById);
router.get('/:id/availability', checkHallAvailability);

// Admin-only routes
router.post('/', authenticate, requireRole('ADMIN'), createHall);
router.put('/:id', authenticate, requireRole('ADMIN'), updateHall);
router.patch('/:id/toggle-status', authenticate, requireRole('ADMIN'), toggleHallStatus);

export default router;
