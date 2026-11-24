process.env.NODE_ENV = 'test';

import http from 'http';
import app from './server.js';
import { prisma } from './database/client.js';

const PORT = 5555;

// Helper to make HTTP requests
const request = (
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<{ status: number; body: any }> => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

async function runTests() {
  console.log('=================================================================');
  console.log('COMMUNITY HALL BOOKING SYSTEM - BACKEND & CONCURRENCY TEST SUITE');
  console.log('=================================================================\n');

  // Start test server
  const server = app.listen(PORT, '0.0.0.0');
  await new Promise((r) => setTimeout(r, 600));

  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition: boolean, testName: string, failureDetails?: any) => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (failureDetails) console.error('         Details:', failureDetails);
      failedCount++;
    }
  };

  try {
    // -------------------------------------------------------------
    // 1. Health & Database Readiness
    // -------------------------------------------------------------
    console.log('[Suite 1: Health & Readiness Checks]');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200 && healthRes.body.status === 'healthy', 'GET /api/health returns 200 Healthy');

    const readyRes = await request('GET', '/api/health/ready');
    assert(readyRes.status === 200 && readyRes.body.database === 'connected', 'GET /api/health/ready verifies MySQL connection');

    // -------------------------------------------------------------
    // 2. Authentication & Authorization
    // -------------------------------------------------------------
    console.log('\n[Suite 2: Authentication & RBAC]');
    const testEmail = `test_customer_${Date.now()}@example.com`;
    const regRes = await request('POST', '/api/auth/register', {
      email: testEmail,
      password: 'Password123!',
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      organization: 'Sharma Events',
    });
    assert(regRes.status === 201 && regRes.body.success, 'POST /api/auth/register creates customer user');
    const customerToken = regRes.body.data?.token;

    // Login customer
    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'Password123!',
    });
    assert(loginRes.status === 200 && loginRes.body.data?.token, 'POST /api/auth/login succeeds with valid credentials');

    // Customer /me
    const meRes = await request('GET', '/api/auth/me', null, customerToken);
    assert(meRes.status === 200 && meRes.body.data?.email === testEmail, 'GET /api/auth/me returns customer profile');

    // Login Admin seeded account
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: 'admin@sabhahalls.in',
      password: 'AdminPass@2026',
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.data?.user?.role === 'ADMIN', 'Admin login succeeds with ADMIN role');
    const adminToken = adminLoginRes.body.data?.token;

    // RBAC check: Customer cannot access admin stats
    const rbacDeniedRes = await request('GET', '/api/admin/stats', null, customerToken);
    assert(rbacDeniedRes.status === 403, 'Customer correctly forbidden (403) from accessing /api/admin/stats');

    // Admin can access admin stats
    const adminStatsRes = await request('GET', '/api/admin/stats', null, adminToken);
    assert(adminStatsRes.status === 200 && adminStatsRes.body.data?.halls?.total === 5, 'Admin accesses /api/admin/stats (5 halls present)');

    // -------------------------------------------------------------
    // 3. Hall Discovery & Availability
    // -------------------------------------------------------------
    console.log('\n[Suite 3: Hall Discovery & Availability]');
    const hallsRes = await request('GET', '/api/halls');
    assert(hallsRes.status === 200 && hallsRes.body.data?.length === 5, 'GET /api/halls returns all 5 seeded Bengaluru venues');

    const hallDetailRes = await request('GET', '/api/halls/ecc-centre-whitefield');
    assert(hallDetailRes.status === 200 && hallDetailRes.body.data?.name.includes('ECC Centre'), 'GET /api/halls/:id returns hall details');

    // Filter by area
    const filterAreaRes = await request('GET', '/api/halls?area=Whitefield');
    assert(filterAreaRes.status === 200 && filterAreaRes.body.data?.length === 1, 'Filter by area=Whitefield returns 1 venue');

    // Check availability on date with maintenance (Chowdiah Memorial Hall: 2026-11-24 to 2026-11-25)
    const availMaintRes = await request('GET', '/api/halls/chowdiah-memorial-hall/availability?date=2026-11-24');
    assert(availMaintRes.status === 200 && availMaintRes.body.data?.isAvailable === false && availMaintRes.body.data?.reason === 'MAINTENANCE', 'Availability correctly identifies maintenance blackout');

    // -------------------------------------------------------------
    // 4. Concurrency-Safe Booking Approval
    // -------------------------------------------------------------
    console.log('\n[Suite 4: Concurrency-Safe Row Locking & Double-Booking Prevention]');

    const targetDate = '2026-12-25';
    const targetHall = 'ecc-centre-whitefield';

    // Create Booking A: 09:00 to 14:00
    const createBookingARes = await request(
      'POST',
      '/api/bookings',
      {
        hallId: targetHall,
        eventType: 'Wedding Reception A',
        eventDate: targetDate,
        startTime: '09:00',
        endTime: '14:00',
        guestsCount: 400,
        contactName: 'Ramesh Kumar',
        contactEmail: 'ramesh@example.com',
        contactPhone: '+91 98450 11111',
      },
      customerToken
    );
    const bookingAId = createBookingARes.body.data?.id;
    assert(createBookingARes.status === 201 && bookingAId, `Created pending booking A (${bookingAId}, 09:00-14:00)`);

    // Create Booking B: 12:00 to 18:00 (overlaps with Booking A from 12:00 to 14:00)
    const createBookingBRes = await request(
      'POST',
      '/api/bookings',
      {
        hallId: targetHall,
        eventType: 'Corporate Gala B',
        eventDate: targetDate,
        startTime: '12:00',
        endTime: '18:00',
        guestsCount: 300,
        contactName: 'Suresh Patel',
        contactEmail: 'suresh@example.com',
        contactPhone: '+91 98450 22222',
      },
      customerToken
    );
    const bookingBId = createBookingBRes.body.data?.id;
    assert(createBookingBRes.status === 201 && bookingBId, `Created pending booking B (${bookingBId}, 12:00-18:00)`);

    // Fire TWO SIMULTANEOUS APPROVAL REQUESTS
    console.log('  -> Executing simultaneous concurrent approvals for Booking A & Booking B...');
    const [approvalA, approvalB] = await Promise.all([
      request('PATCH', `/api/bookings/${bookingAId}/approve`, null, adminToken),
      request('PATCH', `/api/bookings/${bookingBId}/approve`, null, adminToken),
    ]);

    const statuses = [approvalA.status, approvalB.status];
    const hasOne200 = statuses.filter((s) => s === 200).length === 1;
    const hasOne409 = statuses.filter((s) => s === 409).length === 1;

    assert(
      hasOne200 && hasOne409,
      'CONCURRENCY LOCK TEST: Exactly one approval succeeded (200) and the conflicting approval was aborted (409 Conflict)',
      { approvalAStatus: approvalA.status, approvalBStatus: approvalB.status, approvalABody: approvalA.body, approvalBBody: approvalB.body }
    );

    // -------------------------------------------------------------
    // 5. Maintenance Conflict with Approved Booking
    // -------------------------------------------------------------
    console.log('\n[Suite 5: Maintenance Blackout Conflict Prevention]');
    // Attempt to schedule maintenance on targetDate where an approved booking exists
    const maintConflictRes = await request(
      'POST',
      '/api/maintenance',
      {
        hallId: targetHall,
        startDate: targetDate,
        endDate: targetDate,
        description: 'Emergency HVAC Overhaul',
      },
      adminToken
    );

    assert(
      maintConflictRes.status === 409 && maintConflictRes.body.error?.code === 'MAINTENANCE_BOOKING_CLASH',
      'Cannot schedule maintenance over an existing approved booking (409 Conflict)',
      maintConflictRes.body
    );

    // -------------------------------------------------------------
    // 6. Clean up test records
    // -------------------------------------------------------------
    console.log('\n[Suite 6: Cleanup]');
    await prisma.booking.deleteMany({
      where: { id: { in: [bookingAId, bookingBId] } },
    });
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    console.log('  [PASS] Test records cleaned up successfully');
    passedCount++;

  } catch (err) {
    console.error('Fatal test error:', err);
    failedCount++;
  } finally {
    server.close();
    console.log('\n=================================================================');
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('=================================================================');
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
