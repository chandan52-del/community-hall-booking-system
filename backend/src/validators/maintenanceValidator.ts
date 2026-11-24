import { z } from 'zod';
import { MaintenanceStatus } from '@prisma/client';

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const createMaintenanceSchema = z
  .object({
    hallId: z.string().min(1, 'Hall ID is required'),
    startDate: z.string().regex(dateRegex, 'Start date must be formatted as YYYY-MM-DD'),
    endDate: z.string().regex(dateRegex, 'End date must be formatted as YYYY-MM-DD'),
    description: z.string().min(5, 'Maintenance description must be at least 5 characters long').trim(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Maintenance start date must precede or equal end date',
    path: ['startDate'],
  });

export const updateMaintenanceStatusSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus),
});
