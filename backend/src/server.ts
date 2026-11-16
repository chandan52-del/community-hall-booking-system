import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Prisma } from '@prisma/client';
import { env } from './config/env.js';
import { prisma, disconnectPrisma } from './database/client.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import hallRoutes from './routes/hallRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const PORT = env.PORT;

// Global Middleware
const allowedOrigins = [env.FRONTEND_URL].concat(
  process.env.ADDITIONAL_ALLOWED_ORIGINS
    ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : []
);

app.use(
  cors({
    origin: (origin, callback) => {
      // In development or test, allow requests with no origin (curl/mobile/local) or localhost
      if (!origin || env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation: Origin ${origin} is not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check endpoint (Liveness)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'Community Hall Booking and Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Database Readiness check (Readiness)
app.get('/api/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      error: env.NODE_ENV === 'production' ? 'Database connection failure' : err.message,
    });
  }
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/halls', hallRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/admin', adminRoutes);

// Root Welcome Endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Community Hall Booking and Management System REST API',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      readiness: '/api/health/ready',
      auth: '/api/auth',
      halls: '/api/halls',
      bookings: '/api/bookings',
      maintenance: '/api/maintenance',
      admin: '/api/admin',
    },
  });
});

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

// Server startup
let server: any;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API] Server is actively listening on http://0.0.0.0:${PORT} (env: ${env.NODE_ENV})`);
  });
}

// Graceful Shutdown handling
const handleGracefulShutdown = async (signal: string) => {
  console.log(`[API] Received ${signal}. Commencing graceful server shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[API] HTTP server closed.');
      await disconnectPrisma();
      console.log('[API] Database connections closed. Process terminating.');
      process.exit(0);
    });
  } else {
    await disconnectPrisma();
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default app;
