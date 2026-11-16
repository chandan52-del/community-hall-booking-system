import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const createBookingSchema = z
  .object({
    hallId: z.string().min(1, 'Hall ID is required'),
    eventType: z.string().min(2, 'Event type is required').trim(),
    eventDate: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD'),
    startTime: z.string().regex(timeRegex, 'Start time must be formatted as HH:mm (24h)'),
    endTime: z.string().regex(timeRegex, 'End time must be formatted as HH:mm (24h)'),
    guestsCount: z.number().int().positive('Guests count must be greater than zero'),
    contactName: z.string().min(2, 'Contact name is required').trim(),
    contactEmail: z.string().email('Valid contact email is required').toLowerCase().trim(),
    contactPhone: z.string().min(8, 'Valid contact phone number is required').trim(),
    specialRequests: z.string().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Event start time must precede end time',
    path: ['startTime'],
  });

export const rejectBookingSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters long').trim(),
});
