import { Response } from 'express';
import { prisma } from '../database/client.js';
import { createBookingSchema, rejectBookingSchema } from '../validators/bookingValidator.js';
import { approveBookingWithLock } from '../services/conflictService.js';
import { sendSuccess, sendError, AppError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { BookingStatus, Prisma } from '@prisma/client';

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parseResult = createBookingSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid booking request parameters', parseResult.error.flatten().fieldErrors);
    return;
  }

  const data = parseResult.data;

  // 1. Verify Hall Exists & is Active
  const hall = await prisma.hall.findUnique({
    where: { id: data.hallId },
  });

  if (!hall) {
    sendError(res, 404, 'HALL_NOT_FOUND', `Community hall '${data.hallId}' does not exist`);
    return;
  }

  if (!hall.isActive) {
    sendError(res, 400, 'HALL_INACTIVE', `Community hall '${hall.name}' is currently unavailable for bookings`);
    return;
  }

  // 2. Preliminary check for Maintenance Blackout
  const maintenance = await prisma.maintenanceSchedule.findFirst({
    where: {
      hallId: data.hallId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      startDate: { lte: data.eventDate },
      endDate: { gte: data.eventDate },
    },
  });

  if (maintenance) {
    sendError(
      res,
      409,
      'MAINTENANCE_BLACKOUT',
      `Hall is scheduled for maintenance on ${data.eventDate}: ${maintenance.description}`
    );
    return;
  }

  // 3. Preliminary check for existing APPROVED slot conflict
  const conflictingApproved = await prisma.booking.findFirst({
    where: {
      hallId: data.hallId,
      eventDate: data.eventDate,
      status: 'APPROVED',
      startTime: { lt: data.endTime },
      endTime: { gt: data.startTime },
    },
  });

  if (conflictingApproved) {
    sendError(
      res,
      409,
      'SLOT_ALREADY_BOOKED',
      `The requested time slot (${data.startTime}–${data.endTime}) on ${data.eventDate} has already been reserved`
    );
    return;
  }

  // 4. Calculate Total Pricing
  // Base daily rate + cleaning fee + deposit
  const totalAmount = Number(hall.baseRatePerDay) + Number(hall.cleaningFee) + Number(hall.depositRequired);

  // 5. Generate Booking Reference ID
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingId = `BK-${todayStr}-${randomSuffix}`;

  // 6. Associate with authenticated user if present
  const userId = req.user?.id || null;

  const newBooking = await prisma.booking.create({
    data: {
      id: bookingId,
      hallId: data.hallId,
      userId,
      eventType: data.eventType,
      eventDate: data.eventDate,
      startTime: data.startTime,
      endTime: data.endTime,
      guestsCount: data.guestsCount,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      specialRequests: data.specialRequests || null,
      status: 'PENDING',
      totalAmount,
    },
    include: {
      hall: {
        select: {
          id: true,
          name: true,
          area: true,
          city: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
  });

  sendSuccess(res, newBooking, 'Booking request submitted successfully', 201);
};

export const getMyBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required to view your bookings');
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { userId: req.user.id },
        { contactEmail: req.user.email },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      hall: {
        select: {
          id: true,
          name: true,
          area: true,
          city: true,
          baseRatePerDay: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
  });

  sendSuccess(res, bookings, undefined, 200, { total: bookings.length });
};

export const getAllBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { hallId, status, eventDate } = req.query;

  const whereClause: Prisma.BookingWhereInput = {};
  if (hallId && typeof hallId === 'string') {
    whereClause.hallId = hallId;
  }
  if (status && typeof status === 'string' && Object.values(BookingStatus).includes(status as BookingStatus)) {
    whereClause.status = status as BookingStatus;
  }
  if (eventDate && typeof eventDate === 'string') {
    whereClause.eventDate = eventDate;
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      hall: {
        select: {
          id: true,
          name: true,
          area: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  sendSuccess(res, bookings, undefined, 200, { total: bookings.length });
};

export const getBookingById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      hall: {
        include: {
          images: { where: { isPrimary: true } },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!booking) {
    sendError(res, 404, 'BOOKING_NOT_FOUND', `Booking '${id}' was not found`);
    return;
  }

  // Access check: Customer can only view their own booking
  if (req.user?.role !== 'ADMIN') {
    const isOwner = req.user?.id === booking.userId || req.user?.email === booking.contactEmail;
    if (!isOwner) {
      sendError(res, 403, 'FORBIDDEN', 'You do not have permission to view this booking record');
      return;
    }
  }

  sendSuccess(res, booking);
};

export const approveBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const approvedBooking = await approveBookingWithLock(id);
    sendSuccess(res, approvedBooking, 'Booking approved successfully');
  } catch (err: unknown) {
    if (err instanceof AppError) {
      sendError(res, err.statusCode, err.code, err.message, err.details);
      return;
    }
    const message = err instanceof Error ? err.message : 'Failed to approve booking';
    sendError(res, 500, 'APPROVAL_FAILED', message);
  }
};

export const rejectBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const parseResult = rejectBookingSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'A valid rejection reason is required', parseResult.error.flatten().fieldErrors);
    return;
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    sendError(res, 404, 'BOOKING_NOT_FOUND', `Booking '${id}' was not found`);
    return;
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason: parseResult.data.reason,
    },
  });

  sendSuccess(res, updatedBooking, 'Booking rejected successfully');
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    sendError(res, 404, 'BOOKING_NOT_FOUND', `Booking '${id}' was not found`);
    return;
  }

  // Access check
  if (req.user?.role !== 'ADMIN') {
    const isOwner = req.user?.id === booking.userId || req.user?.email === booking.contactEmail;
    if (!isOwner) {
      sendError(res, 403, 'FORBIDDEN', 'You do not have permission to cancel this booking');
      return;
    }
  }

  if (booking.status === 'CANCELLED') {
    sendSuccess(res, booking, 'Booking is already cancelled');
    return;
  }

  if (booking.status === 'COMPLETED') {
    sendError(res, 400, 'CANNOT_CANCEL', 'Completed bookings cannot be cancelled');
    return;
  }

  const cancelledBooking = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  sendSuccess(res, cancelledBooking, 'Booking has been cancelled');
};
