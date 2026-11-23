import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const hallQuerySchema = z.object({
  search: z.string().optional(),
  area: z.string().optional(),
  minCapacity: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  amenities: z.string().optional(), // comma-separated amenity IDs
  isActive: z.string().optional().transform((val) => (val === 'false' ? false : true)),
  sortBy: z.enum(['recommended', 'price_asc', 'price_desc', 'capacity_desc']).optional().default('recommended'),
});

export const hallAvailabilityQuerySchema = z
  .object({
    date: z.string().regex(dateRegex, 'Query parameter date is required in YYYY-MM-DD format'),
    startTime: z.string().regex(timeRegex, 'startTime must be formatted as HH:mm (24h)').optional(),
    endTime: z.string().regex(timeRegex, 'endTime must be formatted as HH:mm (24h)').optional(),
  })
  .refine(
    (data) => {
      if ((data.startTime && !data.endTime) || (!data.startTime && data.endTime)) {
        return false;
      }
      return true;
    },
    {
      message: 'Both startTime and endTime must be provided together',
      path: ['startTime'],
    }
  )
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: 'startTime must precede endTime',
      path: ['startTime'],
    }
  );

export const createHallSchema = z.object({
  id: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Hall ID must be URL-safe slug format'),
  name: z.string().min(3).trim(),
  tagline: z.string().min(5).trim(),
  address: z.string().min(5).trim(),
  area: z.string().min(2).trim(),
  city: z.string().default('Bengaluru'),
  pincode: z.string().min(5).trim(),
  description: z.string().min(20).trim(),
  seatedCapacity: z.number().int().positive('Seated capacity must be positive'),
  floatingCapacity: z.number().int().positive('Floating capacity must be positive'),
  diningCapacity: z.number().int().nonnegative().default(0),
  baseRatePerDay: z.number().positive('Base rate must be positive'),
  hourlyRate: z.number().positive().optional(),
  cleaningFee: z.number().nonnegative().default(0),
  depositRequired: z.number().nonnegative().default(0),
  currency: z.string().default('INR'),
  notes: z.string().optional(),
  isFeatured: z.boolean().default(false),
  amenityIds: z.array(z.string()).default([]),
  images: z.array(z.object({
    url: z.string().url(),
    isPrimary: z.boolean().default(false),
    order: z.number().default(0),
  })).default([]),
});

export const updateHallSchema = createHallSchema.partial().omit({ id: true });
