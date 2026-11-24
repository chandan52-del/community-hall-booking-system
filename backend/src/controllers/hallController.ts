import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../database/client.js';
import { hallQuerySchema, createHallSchema, updateHallSchema, hallAvailabilityQuerySchema } from '../validators/hallValidator.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Checks whether an unknown error is caused by database server unavailability
 * (e.g. Prisma initialization error, connection refused, unreachable port/host, timeouts).
 */
function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1000 - P1017 indicate database connection/server reachability issues
    return ['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1017'].includes(error.code);
  }
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("can't reach database server") ||
      msg.includes('database server is not reachable') ||
      msg.includes('connection refused') ||
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('connection closed') ||
      msg.includes('timed out')
    );
  }
  return false;
}

/**
 * Handles unexpected database or server exceptions cleanly, returning HTTP 503
 * if the database is unreachable without terminating the Node.js process.
 */
const handleDatabaseError = (res: Response, error: unknown, action: string): void => {
  console.error(`[HallController] Error during ${action}:`, error instanceof Error ? error.message : error);
  if (isDatabaseUnavailable(error)) {
    sendError(
      res,
      503,
      'DATABASE_UNAVAILABLE',
      'Database service is currently unavailable. Please check database connectivity.'
    );
    return;
  }
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', `Failed to ${action} due to an unexpected server error`);
};

export const getHalls = async (req: Request, res: Response): Promise<void> => {
  const queryResult = hallQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters', queryResult.error.flatten().fieldErrors);
    return;
  }

  const { search, area, minCapacity, maxPrice, amenities, isActive, sortBy } = queryResult.data;

  const whereClause: Prisma.HallWhereInput = {};

  if (typeof isActive === 'boolean') {
    whereClause.isActive = isActive;
  }

  if (area) {
    whereClause.area = { equals: area };
  }

  if (minCapacity) {
    whereClause.seatedCapacity = { gte: minCapacity };
  }

  if (maxPrice) {
    whereClause.baseRatePerDay = { lte: maxPrice };
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { tagline: { contains: search } },
      { description: { contains: search } },
      { area: { contains: search } },
    ];
  }

  if (amenities) {
    const amenityList = amenities.split(',').map((s) => s.trim()).filter(Boolean);
    if (amenityList.length > 0) {
      whereClause.amenities = {
        some: {
          amenityId: { in: amenityList },
        },
      };
    }
  }

  let orderBy: Prisma.HallOrderByWithRelationInput | Prisma.HallOrderByWithRelationInput[] = [{ isFeatured: 'desc' }, { seatedCapacity: 'desc' }];
  if (sortBy === 'price_asc') {
    orderBy = { baseRatePerDay: 'asc' };
  } else if (sortBy === 'price_desc') {
    orderBy = { baseRatePerDay: 'desc' };
  } else if (sortBy === 'capacity_desc') {
    orderBy = { seatedCapacity: 'desc' };
  }

  try {
    const halls = await prisma.hall.findMany({
      where: whereClause,
      orderBy,
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Transform relational data cleanly
    const formattedHalls = halls.map((hall) => ({
      ...hall,
      baseRatePerDay: Number(hall.baseRatePerDay),
      hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
      cleaningFee: Number(hall.cleaningFee),
      depositRequired: Number(hall.depositRequired),
      amenities: hall.amenities.map((ha) => ha.amenity),
      images: hall.images.map((img) => ({
        id: img.id,
        url: img.imageUrl,
        isPrimary: img.isPrimary,
        order: img.sortOrder,
      })),
    }));

    sendSuccess(res, formattedHalls, undefined, 200, {
      total: formattedHalls.length,
    });
  } catch (error: unknown) {
    handleDatabaseError(res, error, 'retrieve halls');
  }
};

export const getHallById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const hall = await prisma.hall.findUnique({
      where: { id },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!hall) {
      sendError(res, 404, 'HALL_NOT_FOUND', `Community hall '${id}' was not found`);
      return;
    }

    const formattedHall = {
      ...hall,
      baseRatePerDay: Number(hall.baseRatePerDay),
      hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
      cleaningFee: Number(hall.cleaningFee),
      depositRequired: Number(hall.depositRequired),
      amenities: hall.amenities.map((ha) => ha.amenity),
      images: hall.images.map((img) => ({
        id: img.id,
        url: img.imageUrl,
        isPrimary: img.isPrimary,
        order: img.sortOrder,
      })),
    };

    sendSuccess(res, formattedHall);
  } catch (error: unknown) {
    handleDatabaseError(res, error, `retrieve hall '${id}'`);
  }
};

export const checkHallAvailability = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const parseResult = hallAvailabilityQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid availability query parameters', parseResult.error.flatten().fieldErrors);
    return;
  }

  const { date, startTime, endTime } = parseResult.data;

  try {
    const hall = await prisma.hall.findUnique({ where: { id } });
    if (!hall) {
      sendError(res, 404, 'HALL_NOT_FOUND', `Community hall '${id}' was not found`);
      return;
    }

    // 1. Check Maintenance Blackout (Scheduled or In-Progress)
    const activeMaintenance = await prisma.maintenanceSchedule.findFirst({
      where: {
        hallId: id,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (activeMaintenance) {
      sendSuccess(res, {
        hallId: id,
        date,
        ...(startTime && endTime ? { startTime, endTime } : {}),
        isAvailable: false,
        reason: 'MAINTENANCE',
        details: {
          description: activeMaintenance.description,
          startDate: activeMaintenance.startDate,
          endDate: activeMaintenance.endDate,
          status: activeMaintenance.status,
        },
        bookedSlots: [],
      });
      return;
    }

    // 2. Fetch all approved bookings on this date (only APPROVED bookings block availability)
    const approvedBookings = await prisma.booking.findMany({
      where: {
        hallId: id,
        eventDate: date,
        status: 'APPROVED',
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        eventType: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const isFullDayBooked = approvedBookings.some(
      (b) => b.startTime <= '09:00' && b.endTime >= '21:00'
    );

    // 3. Time slot availability evaluation if startTime and endTime are provided
    if (startTime && endTime) {
      // Check interval overlap: requestedStart < existingEnd AND requestedEnd > existingStart
      const conflictingBooking = approvedBookings.find(
        (b) => startTime < b.endTime && endTime > b.startTime
      );

      if (conflictingBooking) {
        sendSuccess(res, {
          hallId: id,
          date,
          startTime,
          endTime,
          isAvailable: false,
          reason: isFullDayBooked ? 'FULLY_BOOKED' : 'SLOT_CONFLICT',
          details: {
            conflictingSlot: {
              id: conflictingBooking.id,
              startTime: conflictingBooking.startTime,
              endTime: conflictingBooking.endTime,
              eventType: conflictingBooking.eventType,
            },
          },
          bookedSlots: approvedBookings,
        });
        return;
      }

      // Time slot is clear
      sendSuccess(res, {
        hallId: id,
        date,
        startTime,
        endTime,
        isAvailable: !isFullDayBooked,
        reason: isFullDayBooked ? 'FULLY_BOOKED' : 'AVAILABLE',
        bookedSlots: approvedBookings,
      });
      return;
    }

    // 4. Date-only check (Preserves backward compatibility)
    sendSuccess(res, {
      hallId: id,
      date,
      isAvailable: !isFullDayBooked,
      reason: isFullDayBooked ? 'FULLY_BOOKED' : 'AVAILABLE',
      bookedSlots: approvedBookings,
    });
  } catch (error: unknown) {
    handleDatabaseError(res, error, `check availability for hall '${id}'`);
  }
};

export const createHall = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parseResult = createHallSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid hall data', parseResult.error.flatten().fieldErrors);
    return;
  }

  const data = parseResult.data;

  try {
    const existing = await prisma.hall.findUnique({ where: { id: data.id } });
    if (existing) {
      sendError(res, 409, 'HALL_EXISTS', `A hall with ID/slug '${data.id}' already exists`);
      return;
    }

    const newHall = await prisma.hall.create({
      data: {
        id: data.id,
        name: data.name,
        tagline: data.tagline,
        address: data.address,
        area: data.area,
        city: data.city,
        pincode: data.pincode,
        description: data.description,
        seatedCapacity: data.seatedCapacity,
        floatingCapacity: data.floatingCapacity,
        diningCapacity: data.diningCapacity,
        baseRatePerDay: data.baseRatePerDay,
        hourlyRate: data.hourlyRate || null,
        cleaningFee: data.cleaningFee,
        depositRequired: data.depositRequired,
        currency: data.currency,
        notes: data.notes || null,
        isFeatured: data.isFeatured,
        amenities: {
          create: data.amenityIds.map((amenityId) => ({
            amenity: { connect: { id: amenityId } },
          })),
        },
        images: {
          create: data.images.map((img) => ({
            imageUrl: img.url,
            isPrimary: img.isPrimary,
            sortOrder: img.order,
          })),
        },
      },
      include: {
        amenities: { include: { amenity: true } },
        images: true,
      },
    });

    sendSuccess(res, newHall, 'Community hall created successfully', 201);
  } catch (error: unknown) {
    handleDatabaseError(res, error, 'create hall');
  }
};

export const updateHall = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const parseResult = updateHallSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid update data', parseResult.error.flatten().fieldErrors);
    return;
  }

  const data = parseResult.data;

  try {
    const existing = await prisma.hall.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 404, 'HALL_NOT_FOUND', `Hall '${id}' not found`);
      return;
    }

    // Handle amenity updates if provided
    if (data.amenityIds) {
      await prisma.hallAmenity.deleteMany({ where: { hallId: id } });
      await prisma.hallAmenity.createMany({
        data: data.amenityIds.map((aId) => ({ hallId: id, amenityId: aId })),
      });
    }

    // Handle image updates if provided
    if (data.images) {
      await prisma.hallImage.deleteMany({ where: { hallId: id } });
      await prisma.hallImage.createMany({
        data: data.images.map((img) => ({
          hallId: id,
          imageUrl: img.url,
          isPrimary: img.isPrimary,
          sortOrder: img.order,
        })),
      });
    }

    const { amenityIds, images, ...updateFields } = data;
    const updatePayload: Prisma.HallUpdateInput = { ...updateFields };

    const updatedHall = await prisma.hall.update({
      where: { id },
      data: updatePayload,
      include: {
        amenities: { include: { amenity: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    sendSuccess(res, updatedHall, 'Hall updated successfully');
  } catch (error: unknown) {
    handleDatabaseError(res, error, `update hall '${id}'`);
  }
};

export const toggleHallStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const hall = await prisma.hall.findUnique({ where: { id } });
    if (!hall) {
      sendError(res, 404, 'HALL_NOT_FOUND', `Hall '${id}' not found`);
      return;
    }

    const updated = await prisma.hall.update({
      where: { id },
      data: { isActive: !hall.isActive },
    });

    sendSuccess(res, updated, `Hall marked as ${updated.isActive ? 'Active' : 'Inactive'}`);
  } catch (error: unknown) {
    handleDatabaseError(res, error, `toggle status for hall '${id}'`);
  }
};

export const getAmenitiesCatalog = async (_req: Request, res: Response): Promise<void> => {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, amenities);
  } catch (error: unknown) {
    handleDatabaseError(res, error, 'retrieve amenities catalog');
  }
};
