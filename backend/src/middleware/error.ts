import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', formatted);
    return;
  }

  // 2. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      sendError(
        res,
        409,
        'CONFLICT',
        `A record with this ${target.join(', ') || 'field'} already exists`
      );
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Requested database record was not found');
      return;
    }
    if (err.code === 'P2003') {
      sendError(
        res,
        400,
        'FOREIGN_KEY_VIOLATION',
        'Database relation constraint prevents this operation'
      );
      return;
    }
  }

  // 3. Application Domain Errors (with status code attached)
  if (err.statusCode && err.code) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // 4. Fallback: Unexpected Server Error
  console.error('[Unhandled Error]', err);

  const safeMessage =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal server error';

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', safeMessage);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, 'ROUTE_NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`);
};
