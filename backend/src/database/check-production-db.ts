
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 1. Resolve .env.production path reliably relative to this file
const envPath = path.resolve(__dirname, '../../.env.production');

// 2. Load .env.production with explicit override
dotenv.config({ path: envPath, override: true });

const databaseUrl = process.env.DATABASE_URL;

// 3. Validate existence
if (!databaseUrl || databaseUrl.trim() === '') {
  console.error('❌ Error: DATABASE_URL is missing or empty in .env.production');
  console.error(`Target path resolved: ${envPath}`);
  process.exit(1);
}

// 4. Validate host safety: Reject localhost and 127.0.0.1
try {
  const parsed = new URL(databaseUrl.replace(/^(mysql|postgres|postgresql):\/\//i, 'http://'));
  const hostname = parsed.hostname.toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    console.error('❌ Safety Error: DATABASE_URL in .env.production points to localhost/127.0.0.1.');
    console.error('Refusing to execute against a local database when production is expected.');
    process.exit(1);
  }
} catch {
  if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
    console.error('❌ Safety Error: DATABASE_URL contains localhost or 127.0.0.1.');
    process.exit(1);
  }
}

// 5. Explicitly bind datasource URL to PrismaClient to prevent fallback to .env
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  console.log('Checking production database connection...');

  await prisma.$connect();

  const [hallCount, amenityCount, bookingCount, userCount, maintenanceCount] =
    await Promise.all([
      prisma.hall.count(),
      prisma.amenity.count(),
      prisma.booking.count(),
      prisma.user.count(),
      prisma.maintenanceSchedule.count(),
    ]);

  console.log('Production database connection successful!');
  console.log('Existing database records:');
  console.log({
    hallCount,
    amenityCount,
    bookingCount,
    userCount,
    maintenanceCount,
  });
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Database verification failed:', message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
