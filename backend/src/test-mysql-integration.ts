import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// -------------------------------------------------------------
// STEP 1: Strict Database Isolation Setup
// -------------------------------------------------------------
const envPath = fs.existsSync('.env') ? path.resolve('.env') : path.resolve('community-hall-booking-system/backend/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL=([^\r\n]+)/);
if (!match) {
  throw new Error('DATABASE_URL not found in .env');
}
const baseMatch = match[1].trim().replace(/^"|"$/g, '');
const devDatabaseUrl = baseMatch;
const testDatabaseUrl = baseMatch.replace('/community_hall_management_v2', '/community_hall_management_test');

// Safety assertion
if (!testDatabaseUrl.includes('community_hall_management_test') || testDatabaseUrl.includes('community_hall_management_v2')) {
  console.error('FATAL SAFETY VIOLATION: Test database URL points to development or production database!');
  process.exit(1);
}

// Override environment variable before importing any app modules
process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = 'test';

// Initialize dedicated Test Prisma Client
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl,
    },
  },
});

// Set global singleton so bookingController uses testPrisma
(global as any).__prisma = testPrisma;

// Dynamically import bookingController after setting global.__prisma
import { createBooking } from './controllers/bookingController.js';
import { AuthenticatedRequest } from './middleware/auth.js';

interface MockResponse {
  statusCode: number;
  body: any;
  status(code: number): MockResponse;
  json(data: any): MockResponse;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
  return res;
}

function createMockReq(body: any, user?: any): AuthenticatedRequest {
  return {
    body,
    user,
    headers: {},
  } as unknown as AuthenticatedRequest;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (details) {
      console.error('         Details:', JSON.stringify(details, null, 2));
    }
    failed++;
  }
}

async function runRealMySQLTests() {
  console.log('=================================================================');
  console.log('COMMUNITY HALL BOOKING SYSTEM - REAL MYSQL INTEGRATION & CONCURRENCY');
  console.log('Isolated Test Database: community_hall_management_test');
  console.log('=================================================================\n');

  // 1. Double-check connected database name
  const currentDbResult = await testPrisma.$queryRawUnsafe<Array<{ current_db: string }>>(
    'SELECT DATABASE() as current_db;'
  );
  const activeDbName = currentDbResult[0]?.current_db;
  console.log(`Active Test Database: ${activeDbName}`);

  if (activeDbName !== 'community_hall_management_test') {
    console.error(`FATAL ERROR: Test connected to '${activeDbName}' instead of 'community_hall_management_test'! Aborting immediately.`);
    process.exit(1);
  }

  // 2. Check development database baseline row count for non-interference verification
  const devPrisma = new PrismaClient({
    datasources: { db: { url: devDatabaseUrl } },
  });
  const devInitialCount = await devPrisma.booking.count();
  console.log(`Development Database ('community_hall_management_v2') Baseline Bookings: ${devInitialCount}\n`);

  // 3. Reset and Seed Test Database Minimal Fixtures
  console.log('[Setup: Seeding Minimal Test Fixtures in community_hall_management_test]');
  await testPrisma.booking.deleteMany({});
  await testPrisma.maintenanceSchedule.deleteMany({});
  await testPrisma.hallAmenity.deleteMany({});
  await testPrisma.hallImage.deleteMany({});
  await testPrisma.hall.deleteMany({});

  // Seed test halls
  await testPrisma.hall.createMany({
    data: [
      {
        id: 'test-hall-1',
        name: 'Grand Sabha Test Hall',
        tagline: 'Ideal for functions',
        address: '123 Test St, KR Puram',
        area: 'KR Puram',
        city: 'Bengaluru',
        pincode: '560036',
        description: 'Spacious test venue',
        seatedCapacity: 250,
        floatingCapacity: 400,
        diningCapacity: 150,
        baseRatePerDay: 35000,
        cleaningFee: 3000,
        depositRequired: 10000,
        isActive: true,
      },
      {
        id: 'test-hall-2',
        name: 'Royal Palace Test Hall',
        tagline: 'Luxury celebrations',
        address: '456 Test Rd, Whitefield',
        area: 'Whitefield',
        city: 'Bengaluru',
        pincode: '560066',
        description: 'Grand ballroom test venue',
        seatedCapacity: 500,
        floatingCapacity: 800,
        diningCapacity: 300,
        baseRatePerDay: 65000,
        cleaningFee: 5000,
        depositRequired: 20000,
        isActive: true,
      },
      {
        id: 'test-hall-inactive',
        name: 'Inactive Test Centre',
        tagline: 'Closed for public',
        address: '789 Indiranagar 100ft Rd',
        area: 'Indiranagar',
        city: 'Bengaluru',
        pincode: '560038',
        description: 'Currently decommissioned',
        seatedCapacity: 100,
        floatingCapacity: 150,
        diningCapacity: 50,
        baseRatePerDay: 15000,
        cleaningFee: 1000,
        depositRequired: 5000,
        isActive: false,
      },
    ],
  });

  // Seed test maintenance blackout
  await testPrisma.maintenanceSchedule.create({
    data: {
      id: 'maint-test-1',
      hallId: 'test-hall-1',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      description: 'Scheduled AC overhaul',
      status: 'SCHEDULED',
    },
  });

  // Seed test pre-existing approved booking for conflict testing
  await testPrisma.booking.create({
    data: {
      id: 'BK-TEST-APPROVED-1',
      hallId: 'test-hall-1',
      eventType: 'Corporate Summit',
      eventDate: '2026-12-30',
      startTime: '10:00',
      endTime: '16:00',
      guestsCount: 200,
      contactName: 'Executive Host',
      contactEmail: 'corp@example.com',
      contactPhone: '+91 99999 88888',
      status: 'APPROVED',
      totalAmount: 48000,
    },
  });

  let currentCount = await testPrisma.booking.count();
  console.log(`Initial Test Database Booking Count: ${currentCount} (1 pre-seeded APPROVED record)\n`);

  const baseBookingPayload = {
    hallId: 'test-hall-1',
    eventType: 'Birthday party',
    eventDate: '2026-12-15',
    startTime: '10:00',
    endTime: '16:00',
    guestsCount: 150,
    contactName: 'Rajesh Sharma',
    contactEmail: 'rajesh.sharma@example.com',
    contactPhone: '+91 98765 43210',
    specialRequests: 'Audio and stage setup',
  };

  let originalBookingId = '';

  // -------------------------------------------------------------
  // Test 1: First request creates one PENDING booking
  // -------------------------------------------------------------
  console.log('[Test 1: First Valid Booking Creation]');
  const countBefore1 = await testPrisma.booking.count();
  const res1 = createMockRes();
  await createBooking(createMockReq(baseBookingPayload), res1 as any);
  const countAfter1 = await testPrisma.booking.count();

  assert(
    res1.statusCode === 201 &&
    res1.body.success === true &&
    res1.body.data?.status === 'PENDING' &&
    countAfter1 === countBefore1 + 1,
    `Test 1: Creates 1 PENDING booking (HTTP 201 Created, row count ${countBefore1} -> ${countAfter1})`,
    res1.body
  );
  originalBookingId = res1.body.data?.id;

  // -------------------------------------------------------------
  // Test 2: Exact duplicate returns original booking
  // -------------------------------------------------------------
  console.log('\n[Test 2: Exact Duplicate Submission Within 5 Minutes]');
  const countBefore2 = await testPrisma.booking.count();
  const res2 = createMockRes();
  await createBooking(createMockReq(baseBookingPayload), res2 as any);
  const countAfter2 = await testPrisma.booking.count();

  assert(
    res2.statusCode === 200 &&
    res2.body.success === true &&
    res2.body.data?.id === originalBookingId &&
    res2.body.message.includes('already received') &&
    countAfter2 === countBefore2,
    `Test 2: Returns original booking '${originalBookingId}' with HTTP 200 (row count unchanged at ${countAfter2})`,
    res2.body
  );

  // -------------------------------------------------------------
  // Test 3: Phone formatting variations are recognized
  // -------------------------------------------------------------
  console.log('\n[Test 3: Phone Formatting Variations Duplicate Detection]');
  const countBefore3 = await testPrisma.booking.count();
  const res3 = createMockRes();
  const phoneVariantPayload = {
    ...baseBookingPayload,
    contactPhone: '9876543210', // Plain 10 digits without +91 or spaces
  };
  await createBooking(createMockReq(phoneVariantPayload), res3 as any);
  const countAfter3 = await testPrisma.booking.count();

  assert(
    res3.statusCode === 200 &&
    res3.body.data?.id === originalBookingId &&
    countAfter3 === countBefore3,
    `Test 3: Unformatted phone '9876543210' matches '+91 98765 43210' (HTTP 200, row count unchanged at ${countAfter3})`,
    res3.body
  );

  // -------------------------------------------------------------
  // Test 4: Different dates are allowed
  // -------------------------------------------------------------
  console.log('\n[Test 4: Different Date Allowed]');
  const countBefore4 = await testPrisma.booking.count();
  const res4 = createMockRes();
  const diffDatePayload = {
    ...baseBookingPayload,
    eventDate: '2026-12-20',
  };
  await createBooking(createMockReq(diffDatePayload), res4 as any);
  const countAfter4 = await testPrisma.booking.count();

  assert(
    res4.statusCode === 201 &&
    res4.body.data?.eventDate === '2026-12-20' &&
    countAfter4 === countBefore4 + 1,
    `Test 4: Same customer on different date creates new booking (HTTP 201, row count ${countBefore4} -> ${countAfter4})`
  );

  // -------------------------------------------------------------
  // Test 5: Different halls are allowed
  // -------------------------------------------------------------
  console.log('\n[Test 5: Different Hall Allowed]');
  const countBefore5 = await testPrisma.booking.count();
  const res5 = createMockRes();
  const diffHallPayload = {
    ...baseBookingPayload,
    hallId: 'test-hall-2',
  };
  await createBooking(createMockReq(diffHallPayload), res5 as any);
  const countAfter5 = await testPrisma.booking.count();

  assert(
    res5.statusCode === 201 &&
    res5.body.data?.hallId === 'test-hall-2' &&
    countAfter5 === countBefore5 + 1,
    `Test 5: Same customer on different hall creates new booking (HTTP 201, row count ${countBefore5} -> ${countAfter5})`
  );

  // -------------------------------------------------------------
  // Test 6: Different time slots are allowed
  // -------------------------------------------------------------
  console.log('\n[Test 6: Different Time Slot Allowed]');
  const countBefore6 = await testPrisma.booking.count();
  const res6 = createMockRes();
  const diffSlotPayload = {
    ...baseBookingPayload,
    startTime: '17:00',
    endTime: '21:00',
  };
  await createBooking(createMockReq(diffSlotPayload), res6 as any);
  const countAfter6 = await testPrisma.booking.count();

  assert(
    res6.statusCode === 201 &&
    res6.body.data?.startTime === '17:00' &&
    countAfter6 === countBefore6 + 1,
    `Test 6: Same customer on different time slot creates new booking (HTTP 201, row count ${countBefore6} -> ${countAfter6})`
  );

  // -------------------------------------------------------------
  // Test 7: Requests after five minutes are allowed
  // -------------------------------------------------------------
  console.log('\n[Test 7: Requests After 5 Minutes Allowed]');
  // Age original booking by 6 minutes directly in MySQL
  await testPrisma.$executeRawUnsafe(
    `UPDATE bookings SET created_at = DATE_SUB(NOW(), INTERVAL 6 MINUTE) WHERE id = '${originalBookingId}'`
  );

  const countBefore7 = await testPrisma.booking.count();
  const res7 = createMockRes();
  await createBooking(createMockReq(baseBookingPayload), res7 as any);
  const countAfter7 = await testPrisma.booking.count();

  assert(
    res7.statusCode === 201 &&
    res7.body.data?.id !== originalBookingId &&
    countAfter7 === countBefore7 + 1,
    `Test 7: Resubmission after 5 minutes creates independent booking (HTTP 201, row count ${countBefore7} -> ${countAfter7})`
  );

  // -------------------------------------------------------------
  // Test 8: Simultaneous identical submissions create exactly one booking
  // -------------------------------------------------------------
  console.log('\n[Test 8: Real Concurrent MySQL Transactions with SELECT ... FOR UPDATE]');
  const simultaneousPayload = {
    ...baseBookingPayload,
    eventDate: '2026-12-25',
    contactPhone: '+91 98111 22233',
  };

  const countBefore8 = await testPrisma.booking.count();
  const simRes1 = createMockRes();
  const simRes2 = createMockRes();

  // Execute two concurrent requests simultaneously against real MySQL
  await Promise.all([
    createBooking(createMockReq(simultaneousPayload), simRes1 as any),
    createBooking(createMockReq(simultaneousPayload), simRes2 as any),
  ]);

  const countAfter8 = await testPrisma.booking.count();
  const statuses = [simRes1.statusCode, simRes2.statusCode].sort();
  const simCreated = simRes1.statusCode === 201 ? simRes1.body.data : simRes2.body.data;
  const simDuplicate = simRes1.statusCode === 200 ? simRes1.body.data : simRes2.body.data;

  assert(
    countAfter8 === countBefore8 + 1 &&
    statuses[0] === 200 &&
    statuses[1] === 201 &&
    simCreated?.id === simDuplicate?.id,
    `Test 8: Simultaneous submissions serialize via MySQL InnoDB row lock: exactly 1 created (201) & 1 duplicate caught (200), row count ${countBefore8} -> ${countAfter8}`
  );

  // -------------------------------------------------------------
  // Test 9: Different customers can create independent requests
  // -------------------------------------------------------------
  console.log('\n[Test 9: Different Customers for Same Slot]');
  const diffCustomerPayload = {
    ...baseBookingPayload,
    eventDate: '2026-12-25',
    contactName: 'Ananya Roy',
    contactEmail: 'ananya.roy@example.com',
    contactPhone: '+91 98222 33344', // Different customer phone
  };

  const countBefore9 = await testPrisma.booking.count();
  const res9 = createMockRes();
  await createBooking(createMockReq(diffCustomerPayload), res9 as any);
  const countAfter9 = await testPrisma.booking.count();

  assert(
    res9.statusCode === 201 &&
    res9.body.data?.contactName === 'Ananya Roy' &&
    countAfter9 === countBefore9 + 1,
    `Test 9: Different customer for same slot creates independent pending booking (HTTP 201, row count ${countBefore9} -> ${countAfter9})`
  );

  // -------------------------------------------------------------
  // Test 10: Capacity and maintenance validation remain enforced
  // -------------------------------------------------------------
  console.log('\n[Test 10: Capacity & Maintenance Validation Enforcement in MySQL]');
  // 10a: Capacity exceeded (600 > 400 for test-hall-1)
  const countBefore10a = await testPrisma.booking.count();
  const res10a = createMockRes();
  await createBooking(createMockReq({ ...baseBookingPayload, guestsCount: 600 }), res10a as any);
  const countAfter10a = await testPrisma.booking.count();
  assert(
    res10a.statusCode === 400 &&
    res10a.body.error?.code === 'CAPACITY_EXCEEDED' &&
    countAfter10a === countBefore10a,
    `Test 10a: Over-capacity rejected with 400 CAPACITY_EXCEEDED (row count unchanged at ${countAfter10a})`
  );

  // 10b: Maintenance blackout (2026-12-02 is in maint-test-1)
  const countBefore10b = await testPrisma.booking.count();
  const res10b = createMockRes();
  await createBooking(createMockReq({ ...baseBookingPayload, eventDate: '2026-12-02' }), res10b as any);
  const countAfter10b = await testPrisma.booking.count();
  assert(
    res10b.statusCode === 409 &&
    res10b.body.error?.code === 'MAINTENANCE_BLACKOUT' &&
    countAfter10b === countBefore10b,
    `Test 10b: Maintenance blackout rejected with 409 MAINTENANCE_BLACKOUT (row count unchanged at ${countAfter10b})`
  );

  // 10c: Inactive hall
  const countBefore10c = await testPrisma.booking.count();
  const res10c = createMockRes();
  await createBooking(createMockReq({ ...baseBookingPayload, hallId: 'test-hall-inactive' }), res10c as any);
  const countAfter10c = await testPrisma.booking.count();
  assert(
    res10c.statusCode === 400 &&
    res10c.body.error?.code === 'HALL_INACTIVE' &&
    countAfter10c === countBefore10c,
    `Test 10c: Inactive hall rejected with 400 HALL_INACTIVE (row count unchanged at ${countAfter10c})`
  );

  // 10d: Non-existent hall
  const countBefore10d = await testPrisma.booking.count();
  const res10d = createMockRes();
  await createBooking(createMockReq({ ...baseBookingPayload, hallId: 'non-existent-hall' }), res10d as any);
  const countAfter10d = await testPrisma.booking.count();
  assert(
    res10d.statusCode === 404 &&
    res10d.body.error?.code === 'HALL_NOT_FOUND' &&
    countAfter10d === countBefore10d,
    `Test 10d: Non-existent hall rejected with 404 HALL_NOT_FOUND (row count unchanged at ${countAfter10d})`
  );

  // -------------------------------------------------------------
  // Test 11: Approved booking conflicts remain enforced
  // -------------------------------------------------------------
  console.log('\n[Test 11: Approved Booking Conflict Enforcement in MySQL]');
  // Conflicting slot on 2026-12-30 (12:00-15:00 overlaps 10:00-16:00 of BK-TEST-APPROVED-1)
  const countBefore11 = await testPrisma.booking.count();
  const res11 = createMockRes();
  const approvedConflictPayload = {
    ...baseBookingPayload,
    eventDate: '2026-12-30',
    startTime: '12:00',
    endTime: '15:00',
  };
  await createBooking(createMockReq(approvedConflictPayload), res11 as any);
  const countAfter11 = await testPrisma.booking.count();

  assert(
    res11.statusCode === 409 &&
    res11.body.error?.code === 'SLOT_ALREADY_BOOKED' &&
    countAfter11 === countBefore11,
    `Test 11: Approved booking slot conflict rejected with 409 SLOT_ALREADY_BOOKED (row count unchanged at ${countAfter11})`
  );

  // -------------------------------------------------------------
  // FINAL SAFETY VERIFICATION: Check Development Database Count
  // -------------------------------------------------------------
  console.log('\n=================================================================');
  console.log('SAFETY AUDIT: VERIFYING DEVELOPMENT DATABASE NON-INTERFERENCE');
  console.log('=================================================================');
  const devFinalCount = await devPrisma.booking.count();
  console.log(`Development Database ('community_hall_management_v2') Final Bookings: ${devFinalCount}`);
  assert(
    devFinalCount === devInitialCount,
    `Safety Check: Development database remained 100% untouched (${devInitialCount} bookings before, ${devFinalCount} bookings after)`
  );

  const finalTestDbCount = await testPrisma.booking.count();
  console.log(`Test Database ('community_hall_management_test') Final Bookings: ${finalTestDbCount}`);

  await testPrisma.$disconnect();
  await devPrisma.$disconnect();

  console.log('\n=================================================================');
  console.log(`INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRealMySQLTests().catch((err) => {
  console.error('Real MySQL integration test failed:', err);
  process.exit(1);
});
