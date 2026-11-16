import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
} from '../controllers/bookingController.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Create booking (Authenticated or Guest booking)
router.post('/', optionalAuthenticate, createBooking);

// Customer-specific bookings
router.get('/my', authenticate, getMyBookings);

// Admin listing
router.get('/', authenticate, requireRole('ADMIN'), getAllBookings);

// Get single booking
router.get('/:id', authenticate, getBookingById);

// Admin actions
router.patch('/:id/approve', authenticate, requireRole('ADMIN'), approveBooking);
router.patch('/:id/reject', authenticate, requireRole('ADMIN'), rejectBooking);

// Cancel booking (Customer or Admin)
router.patch('/:id/cancel', authenticate, cancelBooking);

export default router;
