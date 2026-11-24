import { Prisma } from '@prisma/client';
import { prisma } from '../database/client.js';
import { AppError } from '../utils/response.js';

export interface ConflictResult {
  hasConflict: boolean;
  type?: 'MAINTENANCE_BLACKOUT' | 'APPROVED_BOOKING_OVERLAP';
  message?: string;
  conflictDetails?: Record<string, unknown>;
}

/**
 * Concurrency-Safe Booking Approval using MySQL Pessimistic Row Locking
 * ---------------------------------------------------------------------
 * 1. Begins an isolated database transaction.
 * 2. Locks the target Hall row via `SELECT id FROM halls WHERE id = ? FOR UPDATE`.
 *    This forces any concurrent approval or maintenance requests for this hall to queue.
 * 3. Inspects active maintenance blackouts covering the event date.
 * 4. Inspects overlapping APPROVED bookings on that date (startTime < newEnd && endTime > newStart).
 * 5. Atomically transitions the booking to APPROVED if clear, or aborts with 409 Conflict.
 */
export const approveBookingWithLock = async (bookingId: string) => {
  return await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // 1. Fetch target booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new AppError(`Booking with ID ${bookingId} does not exist`, 404, 'BOOKING_NOT_FOUND');
      }

      if (booking.status === 'APPROVED') {
        return booking; // Idempotent approval
      }

      // 2. Acquire Pessimistic Row Lock on the Hall
      // This guarantees no concurrent transaction can modify availability for this hall
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM halls WHERE id = ${booking.hallId} FOR UPDATE`
      );

      // 3. Check for Active Maintenance Blackout on the Event Date
      const activeMaintenance = await tx.maintenanceSchedule.findFirst({
        where: {
          hallId: booking.hallId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          startDate: { lte: booking.eventDate },
          endDate: { gte: booking.eventDate },
        },
      });

      if (activeMaintenance) {
        throw new AppError(
          `Hall is closed for maintenance (${activeMaintenance.description}) from ${activeMaintenance.startDate} to ${activeMaintenance.endDate}`,
          409,
          'MAINTENANCE_CONFLICT',
          {
            maintenanceId: activeMaintenance.id,
            startDate: activeMaintenance.startDate,
            endDate: activeMaintenance.endDate,
            description: activeMaintenance.description,
          }
        );
      }

      // 4. Check for Overlapping Approved Bookings on that Date
      // Two intervals [A, B] and [C, D] overlap if and only if (A < D) and (B > C)
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          hallId: booking.hallId,
          eventDate: booking.eventDate,
          status: 'APPROVED',
          id: { not: booking.id },
          startTime: { lt: booking.endTime },
          endTime: { gt: booking.startTime },
        },
      });

      if (conflictingBooking) {
        throw new AppError(
          `Overlapping approved booking ${conflictingBooking.id} (${conflictingBooking.startTime}–${conflictingBooking.endTime}) already reserves this slot`,
          409,
          'SLOT_OVERLAP_CONFLICT',
          {
            conflictingBookingId: conflictingBooking.id,
            eventDate: conflictingBooking.eventDate,
            startTime: conflictingBooking.startTime,
            endTime: conflictingBooking.endTime,
            eventType: conflictingBooking.eventType,
          }
        );
      }

      // 5. Atomic Approval Transition
      const approved = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
        },
      });

      return approved;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 10000, // 10s maximum wait for lock acquisition
    }
  );
};

/**
 * Concurrency-Safe Maintenance Blackout Scheduling
 * ------------------------------------------------
 * Locks the hall row and verifies that no APPROVED bookings exist inside the requested window.
 */
export const scheduleMaintenanceWithLock = async (data: {
  id: string;
  hallId: string;
  startDate: string;
  endDate: string;
  description: string;
}) => {
  return await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // 1. Verify Hall exists
      const hall = await tx.hall.findUnique({
        where: { id: data.hallId },
      });

      if (!hall) {
        throw new AppError(`Hall with ID ${data.hallId} does not exist`, 404, 'HALL_NOT_FOUND');
      }

      // 2. Acquire Pessimistic Row Lock on the Hall
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM halls WHERE id = ${data.hallId} FOR UPDATE`
      );

      // 3. Verify no Approved Bookings clash with the maintenance window
      const clashingBooking = await tx.booking.findFirst({
        where: {
          hallId: data.hallId,
          status: 'APPROVED',
          eventDate: {
            gte: data.startDate,
            lte: data.endDate,
          },
        },
      });

      if (clashingBooking) {
        throw new AppError(
          `Cannot schedule maintenance: Confirmed booking ${clashingBooking.id} is already approved for ${clashingBooking.eventDate}`,
          409,
          'MAINTENANCE_BOOKING_CLASH',
          {
            bookingId: clashingBooking.id,
            eventDate: clashingBooking.eventDate,
            eventType: clashingBooking.eventType,
          }
        );
      }

      // 4. Create Scheduled Maintenance Record
      const maintenance = await tx.maintenanceSchedule.create({
        data: {
          id: data.id,
          hallId: data.hallId,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description,
          status: 'SCHEDULED',
        },
      });

      return maintenance;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 10000,
    }
  );
};
