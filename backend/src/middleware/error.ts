import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError, AppError } from '../utils/response.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const issues = err.issues || (err as { errors?: Array<{ path: Array<string | number>; message: string }> }).errors || [];
    const formatted = issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
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

  // 3. Application Domain Errors (AppError or objects with statusCode and code)
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (typeof err === 'object' && err !== null && 'statusCode' in err && 'code' in err) {
    const customErr = err as { statusCode: number; code: string; message?: string; details?: unknown };
    sendError(res, customErr.statusCode, customErr.code, customErr.message || 'Error', customErr.details);
    return;
  }

  // 4. Fallback: Unexpected Server Error
  console.error('[Unhandled Error]', err);

  const fallbackMessage = err instanceof Error ? err.message : 'Internal server error';
  const safeMessage =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : fallbackMessage;

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', safeMessage);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, 'ROUTE_NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`);
};
