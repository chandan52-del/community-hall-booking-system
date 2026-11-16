import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
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

  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET configuration is missing');
  }

  const options: SignOptions = {
    expiresIn: (env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign(tokenPayload, secret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET configuration is missing');
  }

  const decoded = jwt.verify(token, secret);
  if (typeof decoded === 'string' || !decoded) {
    throw new Error('Invalid token structure');
  }

  const payload = decoded as JwtPayload & {
    userId?: string;
    id?: string;
    email?: string;
    role?: Role;
    name?: string;
  };

  const uid = payload.userId || payload.id || '';
  if (!uid || !payload.email || !payload.role) {
    throw new Error('Token payload is missing required authorization claims');
  }

  return {
    userId: uid,
    id: uid,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
};
