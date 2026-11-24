import { Response } from 'express';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  arg3?: string | number,
  arg4?: number | unknown,
  arg5?: unknown
): Response {
  let message: string | undefined;
  let statusCode = 200;
  let meta: unknown = undefined;

  if (typeof arg3 === 'string') {
    message = arg3;
    if (typeof arg4 === 'number') {
      statusCode = arg4;
      meta = arg5;
    } else {
      meta = arg4;
    }
  } else if (typeof arg3 === 'number') {
    statusCode = arg3;
    meta = arg4;
  } else if (arg3 === undefined && typeof arg4 === 'number') {
    statusCode = arg4;
    meta = arg5;
  }

  const payload: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    data,
    ...(meta !== undefined && { meta }),
  };

  return res.status(statusCode).json(payload);
}

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): Response => {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
  return res.status(statusCode).json(payload);
};
