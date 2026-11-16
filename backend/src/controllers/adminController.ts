import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { sendSuccess } from '../utils/response.js';

export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  // Run aggregate queries concurrently
  const [
    totalHalls,
    activeHalls,
    bookingCounts,
    revenueAggregate,
    activeMaintenance,
    recentBookings,
  ] = await Promise.all([
    prisma.hall.count(),
    prisma.hall.count({ where: { isActive: true } }),
    prisma.booking.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.booking.aggregate({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.maintenanceSchedule.count({
      where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
    }),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        hall: {
          select: { id: true, name: true, area: true },
        },
      },
    }),
  ]);

  const bookingStatusMap: Record<string, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
  };

  let totalBookings = 0;
  for (const item of bookingCounts) {
    bookingStatusMap[item.status] = item._count.id;
    totalBookings += item._count.id;
  }

  const stats = {
    halls: {
      total: totalHalls,
      active: activeHalls,
    },
    bookings: {
      total: totalBookings,
      pending: bookingStatusMap.PENDING,
      approved: bookingStatusMap.APPROVED,
      rejected: bookingStatusMap.REJECTED,
      cancelled: bookingStatusMap.CANCELLED,
      completed: bookingStatusMap.COMPLETED,
    },
    maintenance: {
      activeSchedules: activeMaintenance,
    },
    revenue: {
      total: Number(revenueAggregate._sum.totalAmount || 0),
      currency: 'INR',
    },
    recentBookings,
  };

  sendSuccess(res, stats);
};

export const getCalendarFeed = async (req: Request, res: Response): Promise<void> => {
  const { hallId, month, year } = req.query;

  const bookingWhere: any = {
    status: { in: ['APPROVED', 'PENDING'] },
  };
  const maintenanceWhere: any = {
    status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
  };

  if (hallId && typeof hallId === 'string') {
    bookingWhere.hallId = hallId;
    maintenanceWhere.hallId = hallId;
  }

  // Optional month filtering (YYYY-MM)
  if (month && year) {
    const monthPadded = String(month).padStart(2, '0');
    const prefix = `${year}-${monthPadded}`;
    bookingWhere.eventDate = { startsWith: prefix };
  }

  const [bookings, maintenances] = await Promise.all([
    prisma.booking.findMany({
      where: bookingWhere,
      include: {
        hall: { select: { id: true, name: true } },
      },
      orderBy: { eventDate: 'asc' },
    }),
    prisma.maintenanceSchedule.findMany({
      where: maintenanceWhere,
      include: {
        hall: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'asc' },
    }),
  ]);

  const events = [
    ...bookings.map((b) => ({
      id: b.id,
      type: 'BOOKING' as const,
      hallId: b.hallId,
      hallName: b.hall.name,
      title: `${b.eventType} - ${b.contactName}`,
      date: b.eventDate,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      guestsCount: b.guestsCount,
    })),
    ...maintenances.map((m) => ({
      id: m.id,
      type: 'MAINTENANCE' as const,
      hallId: m.hallId,
      hallName: m.hall.name,
      title: `Maintenance: ${m.description}`,
      startDate: m.startDate,
      endDate: m.endDate,
      status: m.status,
    })),
  ];

  sendSuccess(res, events, undefined, 200, { totalEvents: events.length });
};
