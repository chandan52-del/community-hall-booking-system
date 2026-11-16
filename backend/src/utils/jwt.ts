import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  id: string;
  email: string;
  role: Role;
  name?: string;
}

export const signToken = (payload: { userId?: string; id?: string; email: string; role: Role; name?: string }): string => {
  const uid = payload.userId || payload.id || '';
  const tokenPayload: TokenPayload = {
    userId: uid,
    id: uid,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };

  return jwt.sign(tokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as any;
  const uid = decoded.userId || decoded.id || '';
  return {
    ...decoded,
    userId: uid,
    id: uid,
  };
};
