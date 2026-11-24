import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  phone: z.string().min(8, 'Phone number must be at least 8 characters long').trim(),
  organization: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  organization: z.string().optional(),
});
