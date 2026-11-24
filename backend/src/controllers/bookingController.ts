import { Response } from 'express';
import { prisma } from '../database/client.js';
import { createBookingSchema, rejectBookingSchema } from '../validators/bookingValidator.js';
import { approveBookingWithLock } from '../services/conflictService.js';
import { sendSuccess, sendError, AppError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { BookingStatus, Prisma } from '@prisma/client';
import { normalizePhoneNumber } from '../utils/phone.js';

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parseResult = createBookingSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid booking request parameters', parseResult.error.flatten().fieldErrors);
    return;
  }

  const data = parseResult.data;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Acquire Pessimistic Row Lock on the Hall row to serialize concurrent booking submissions
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM halls WHERE id = ${data.hallId} FOR UPDATE`
      );

      // 2. Verify Hall Exists & is Active
      const hall = await tx.hall.findUnique({
        where: { id: data.hallId },
      });

      if (!hall) {
        throw new AppError(`Community hall '${data.hallId}' does not exist`, 404, 'HALL_NOT_FOUND');
      }

      if (!hall.isActive) {
        throw new AppError(`Community hall '${hall.name}' is currently unavailable for bookings`, 400, 'HALL_INACTIVE');
      }

      // 3. Validate Guests Count against Hall Maximum Capacity
      const maxCapacity = Math.max(hall.floatingCapacity, hall.seatedCapacity);
      if (data.guestsCount > maxCapacity) {
        throw new AppError(
          `Requested guest count (${data.guestsCount}) exceeds the maximum capacity of ${hall.name} (${maxCapacity} guests)`,
          400,
          'CAPACITY_EXCEEDED',
          {
            requestedGuests: data.guestsCount,
            maxCapacity,
            seatedCapacity: hall.seatedCapacity,
            floatingCapacity: hall.floatingCapacity,
          }
        );
      }

      // 4. Preliminary check for Maintenance Blackout
      const maintenance = await tx.maintenanceSchedule.findFirst({
        where: {
          hallId: data.hallId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          startDate: { lte: data.eventDate },
          endDate: { gte: data.eventDate },
        },
      });

      if (maintenance) {
        throw new AppError(
          `Hall is scheduled for maintenance on ${data.eventDate}: ${maintenance.description}`,
          409,
          'MAINTENANCE_BLACKOUT'
        );
      }

      // 5. Preliminary check for existing APPROVED slot conflict
      const conflictingApproved = await tx.booking.findFirst({
        where: {
          hallId: data.hallId,
          eventDate: data.eventDate,
          status: 'APPROVED',
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime },
        },
      });

      if (conflictingApproved) {
        throw new AppError(
          `The requested time slot (${data.startTime}–${data.endTime}) on ${data.eventDate} has already been reserved`,
          409,
          'SLOT_ALREADY_BOOKED'
        );
      }

      // 6. Duplicate-Submission Protection: Check for matching PENDING booking within 5-minute window
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const normalizedPhone = normalizePhoneNumber(data.contactPhone);

      const recentPendingBookings = await tx.booking.findMany({
        where: {
          hallId: data.hallId,
          eventDate: data.eventDate,
          startTime: data.startTime,
          endTime: data.endTime,
          status: 'PENDING',
          createdAt: { gte: fiveMinutesAgo },
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
        orderBy: { createdAt: 'desc' },
      });

      const duplicate = recentPendingBookings.find(
        (b) => normalizePhoneNumber(b.contactPhone) === normalizedPhone
      );

      if (duplicate) {
        return { booking: duplicate, isDuplicate: true };
      }

      // 7. Calculate Total Pricing (Base daily rate + cleaning fee + deposit)
      const totalAmount = Number(hall.baseRatePerDay) + Number(hall.cleaningFee) + Number(hall.depositRequired);

      // 8. Generate Booking Reference ID
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `BK-${todayStr}-${randomSuffix}`;

      // 9. Associate with authenticated user if present
      const userId = req.user?.id || null;

      const newBooking = await tx.booking.create({
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

      return { booking: newBooking, isDuplicate: false };
    });

    if (result.isDuplicate) {
      sendSuccess(res, result.booking, 'Booking request was already received and is pending review', 200);
    } else {
      sendSuccess(res, result.booking, 'Booking request submitted successfully', 201);
    }
  } catch (err: unknown) {
    if (err instanceof AppError) {
      sendError(res, err.statusCode, err.code, err.message, err.details);
      return;
    }
    const message = err instanceof Error ? err.message : 'Failed to process booking request';
    sendError(res, 500, 'BOOKING_CREATION_FAILED', message);
  }
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
