import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: any;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  arg3?: string | number,
  arg4?: number | any,
  arg5?: any
): Response {
  let message: string | undefined;
  let statusCode = 200;
  let meta: any = undefined;

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
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(payload);
}

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): Response => {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(payload);
};
