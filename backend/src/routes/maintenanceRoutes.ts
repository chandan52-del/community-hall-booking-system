import { Router } from 'express';
import {
  getMaintenanceSchedules,
  createMaintenance,
  updateMaintenanceStatus,
  cancelMaintenance,
} from '../controllers/maintenanceController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Listing maintenance schedules (public view or admin)
router.get('/', getMaintenanceSchedules);

// Admin-only maintenance actions
router.post('/', authenticate, requireRole('ADMIN'), createMaintenance);
router.patch('/:id/status', authenticate, requireRole('ADMIN'), updateMaintenanceStatus);
router.patch('/:id/cancel', authenticate, requireRole('ADMIN'), cancelMaintenance);

export default router;
