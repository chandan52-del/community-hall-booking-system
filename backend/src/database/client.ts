import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// PrismaClient singleton to prevent multiple pool instances during hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    console.log('[DB] Prisma Client disconnected cleanly.');
  } catch (err) {
    console.error('[DB] Error during disconnection:', err);
  }
};

// Graceful cleanup on shutdown signals
const gracefulShutdown = async (signal: string) => {
  console.log(`[DB] Received ${signal}. Disconnecting Prisma Client...`);
  await disconnectPrisma();
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default prisma;
