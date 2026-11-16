import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { createMaintenanceSchema, updateMaintenanceStatusSchema } from '../validators/maintenanceValidator.js';
import { scheduleMaintenanceWithLock } from '../services/conflictService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { MaintenanceStatus } from '@prisma/client';

export const getMaintenanceSchedules = async (req: Request, res: Response): Promise<void> => {
  const { hallId, status } = req.query;

  const whereClause: any = {};
  if (hallId && typeof hallId === 'string') {
    whereClause.hallId = hallId;
  }
  if (status && typeof status === 'string' && Object.values(MaintenanceStatus).includes(status as any)) {
    whereClause.status = status as MaintenanceStatus;
  }

  const schedules = await prisma.maintenanceSchedule.findMany({
    where: whereClause,
    orderBy: { startDate: 'desc' },
    include: {
      hall: {
        select: {
          id: true,
          name: true,
          area: true,
        },
      },
    },
  });

  sendSuccess(res, schedules, undefined, 200, { total: schedules.length });
};

export const createMaintenance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parseResult = createMaintenanceSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid maintenance window data', parseResult.error.flatten().fieldErrors);
    return;
  }

  const data = parseResult.data;
  const id = `MNT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const maintenance = await scheduleMaintenanceWithLock({
      id,
      hallId: data.hallId,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
    });

    sendSuccess(res, maintenance, 'Maintenance schedule created successfully', 201);
  } catch (err: any) {
    if (err.statusCode === 409) {
      sendError(res, 409, err.code || 'MAINTENANCE_CONFLICT', err.message, err.details);
      return;
    }
    if (err.statusCode === 404) {
      sendError(res, 404, err.code || 'HALL_NOT_FOUND', err.message);
      return;
    }
    sendError(res, 500, 'SCHEDULE_FAILED', err.message || 'Failed to schedule maintenance');
  }
};

export const updateMaintenanceStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const parseResult = updateMaintenanceStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid status value', parseResult.error.flatten().fieldErrors);
    return;
  }

  const existing = await prisma.maintenanceSchedule.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, 'NOT_FOUND', `Maintenance schedule '${id}' does not exist`);
    return;
  }

  const updated = await prisma.maintenanceSchedule.update({
    where: { id },
    data: { status: parseResult.data.status },
  });

  sendSuccess(res, updated, `Maintenance schedule status updated to ${updated.status}`);
};

export const cancelMaintenance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const existing = await prisma.maintenanceSchedule.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, 'NOT_FOUND', `Maintenance schedule '${id}' does not exist`);
    return;
  }

  const cancelled = await prisma.maintenanceSchedule.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  sendSuccess(res, cancelled, 'Maintenance schedule cancelled');
};
