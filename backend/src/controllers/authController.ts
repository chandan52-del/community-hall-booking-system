import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../database/client.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/authValidator.js';
import { signToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid registration data', parseResult.error.flatten().fieldErrors);
    return;
  }

  const { email, password, name, phone, organization } = parseResult.data;

  // Check duplicate email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    sendError(res, 409, 'EMAIL_EXISTS', 'An account with this email address already exists');
    return;
  }

  // Hash password securely with bcrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phone,
      organization: organization || null,
      role: 'CUSTOMER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      organization: true,
      role: true,
      createdAt: true,
    },
  });

  const token = signToken({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
  });

  sendSuccess(res, { user: newUser, token }, 'Registration successful', 201);
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid login credentials format', parseResult.error.flatten().fieldErrors);
    return;
  }

  const { email, password } = parseResult.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    return;
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const sanitizedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    organization: user.organization,
    role: user.role,
    createdAt: user.createdAt,
  };

  sendSuccess(res, { user: sanitizedUser, token }, 'Login successful');
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      organization: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    sendError(res, 404, 'USER_NOT_FOUND', 'User profile not found');
    return;
  }

  sendSuccess(res, user);
};

export const updateMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    return;
  }

  const parseResult = updateProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid profile update data', parseResult.error.flatten().fieldErrors);
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: parseResult.data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      organization: true,
      role: true,
      updatedAt: true,
    },
  });

  sendSuccess(res, updatedUser, 'Profile updated successfully');
};
