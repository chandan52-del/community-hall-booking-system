import { createBooking } from './controllers/bookingController.js';
import { prisma } from './database/client.js';
import { normalizePhoneNumber } from './utils/phone.js';
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

async function runTests() {
  console.log('=================================================================');
  console.log('COMMUNITY HALL BOOKING SYSTEM - DUPLICATE PROTECTION TEST SUITE');
  console.log('Isolated In-Memory Mock Harness (Zero Writes to Real Database)');
  console.log('=================================================================\n');

  // Test Phone Normalizer directly first
  console.log('[Suite 1: Phone Number Normalization]');
  assert(normalizePhoneNumber('+91 98765 43210') === '9876543210', 'Normalizes "+91 98765 43210" to "9876543210"');
  assert(normalizePhoneNumber('09876543210') === '9876543210', 'Normalizes leading-zero "09876543210" to "9876543210"');
  assert(normalizePhoneNumber('+91-98765-43210') === '9876543210', 'Normalizes hyphenated "+91-98765-43210" to "9876543210"');
  assert(normalizePhoneNumber('+91 (98765) 43210') === '9876543210', 'Normalizes bracketed "+91 (98765) 43210" to "9876543210"');
  assert(normalizePhoneNumber('98765.43210') === '9876543210', 'Normalizes dotted "98765.43210" to "9876543210"');
  assert(normalizePhoneNumber('+91 80 2345 6789') === '8023456789', 'Normalizes landline with STD code "+91 80 2345 6789"');
  assert(normalizePhoneNumber('+1 415 555 2671') === '4155552671', 'Normalizes international US "+1 415 555 2671"');
  assert(normalizePhoneNumber('9876543210') === '9876543210', 'Preserves plain 10-digit "9876543210"');

  // Mock in-memory database store
  const mockHalls: Record<string, any> = {
    'test-hall-1': {
      id: 'test-hall-1',
      name: 'Grand Heritage Sabha',
      area: 'KR Puram',
      city: 'Bengaluru',
      seatedCapacity: 250,
      floatingCapacity: 400,
      baseRatePerDay: 35000,
      cleaningFee: 3000,
      depositRequired: 10000,
      isActive: true,
    },
    'test-hall-2': {
      id: 'test-hall-2',
      name: 'Royal Palace Hall',
      area: 'Whitefield',
      city: 'Bengaluru',
      seatedCapacity: 500,
      floatingCapacity: 800,
      baseRatePerDay: 65000,
      cleaningFee: 5000,
      depositRequired: 20000,
      isActive: true,
    },
    'test-hall-inactive': {
      id: 'test-hall-inactive',
      name: 'Closed Community Centre',
      area: 'Indiranagar',
      city: 'Bengaluru',
      seatedCapacity: 200,
      floatingCapacity: 300,
      baseRatePerDay: 25000,
      cleaningFee: 2000,
      depositRequired: 5000,
      isActive: false,
    },
  };

  let mockBookings: any[] = [];
  let mockMaintenance: any[] = [
    {
      id: 'maint-1',
      hallId: 'test-hall-1',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      description: 'Annual electrical rewiring',
      status: 'SCHEDULED',
    },
  ];

  // Save original prisma methods
  const origTransaction = prisma.$transaction;

  // Mutex per hall to model MySQL InnoDB row-locking (SELECT id FROM halls WHERE id = ? FOR UPDATE)
  const hallLocks: Record<string, Promise<void>> = {};

  (prisma as any).$transaction = async (callback: any) => {
    const mockTx = {
      $queryRaw: async (query: any) => {
        // Models row lock on hall
        return [];
      },
      hall: {
        findUnique: async ({ where }: any) => mockHalls[where.id] || null,
      },
      maintenanceSchedule: {
        findFirst: async ({ where }: any) => {
          return mockMaintenance.find((m) => {
            if (m.hallId !== where.hallId) return false;
            if (!where.status?.in?.includes(m.status)) return false;
            return m.startDate <= where.startDate.lte && m.endDate >= where.endDate.gte;
          }) || null;
        },
      },
      booking: {
        findFirst: async ({ where }: any) => {
          return mockBookings.find((b) => {
            if (b.hallId !== where.hallId) return false;
            if (b.eventDate !== where.eventDate) return false;
            if (where.status && b.status !== where.status) return false;
            if (where.startTime && where.endTime) {
              const startLt = b.startTime < where.startTime.lt;
              const endGt = b.endTime > where.endTime.gt;
              return startLt && endGt;
            }
            return true;
          }) || null;
        },
        findMany: async ({ where }: any) => {
          return mockBookings.filter((b) => {
            if (b.hallId !== where.hallId) return false;
            if (b.eventDate !== where.eventDate) return false;
            if (where.status && b.status !== where.status) return false;
            if (where.startTime && b.startTime !== where.startTime) return false;
            if (where.endTime && b.endTime !== where.endTime) return false;
            if (where.createdAt?.gte && b.createdAt < where.createdAt.gte) return false;
            return true;
          });
        },
        create: async ({ data }: any) => {
          const newRec = {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            hall: {
              id: data.hallId,
              name: mockHalls[data.hallId]?.name || 'Unknown',
              area: mockHalls[data.hallId]?.area || 'Bengaluru',
              city: 'Bengaluru',
              images: [],
            },
          };
          mockBookings.push(newRec);
          return newRec;
        },
      },
    };

    // Serialize transaction per mock invocation to mirror row-locking
    const prevLock = hallLocks['global'] || Promise.resolve();
    let release: () => void = () => {};
    hallLocks['global'] = new Promise<void>((r) => { release = r; });
    await prevLock;

    try {
      return await callback(mockTx);
    } finally {
      release();
    }
  };

  try {
    console.log('\n[Suite 2: Ten Required Duplicate Protection & Business Rule Tests]');

    const validPayload1 = {
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

    // -------------------------------------------------------------
    // Test 1: First valid booking creates one PENDING record
    // -------------------------------------------------------------
    const res1 = createMockRes();
    await createBooking(createMockReq(validPayload1), res1 as any);
    assert(
      res1.statusCode === 201 &&
      res1.body.success === true &&
      res1.body.data?.status === 'PENDING' &&
      mockBookings.length === 1,
      'Test 1: First valid booking creates one PENDING record (HTTP 201 Created)'
    );
    const originalBookingId = res1.body.data?.id;

    // -------------------------------------------------------------
    // Test 2: Identical request within 5 minutes does not create another record
    // -------------------------------------------------------------
    const res2 = createMockRes();
    // Same details, with slightly different phone formatting to test normalization
    const identicalPayload = {
      ...validPayload1,
      contactPhone: '9876543210', // Without +91 prefix
    };
    await createBooking(createMockReq(identicalPayload), res2 as any);
    assert(
      res2.statusCode === 200 &&
      res2.body.success === true &&
      mockBookings.length === 1,
      'Test 2: Identical request within 5 minutes does not create another record (count remains 1)'
    );

    // -------------------------------------------------------------
    // Test 3: Duplicate response returns the original booking reference
    // -------------------------------------------------------------
    assert(
      res2.body.data?.id === originalBookingId &&
      res2.body.message.includes('already received'),
      `Test 3: Duplicate response returns original booking reference '${originalBookingId}'`
    );

    // -------------------------------------------------------------
    // Test 4: Same customer can submit a different date
    // -------------------------------------------------------------
    const diffDatePayload = {
      ...validPayload1,
      eventDate: '2026-12-20', // Different date
    };
    const res4 = createMockRes();
    await createBooking(createMockReq(diffDatePayload), res4 as any);
    assert(
      res4.statusCode === 201 &&
      mockBookings.length === 2 &&
      res4.body.data?.eventDate === '2026-12-20',
      'Test 4: Same customer can submit a different date (creates 2nd record)'
    );

    // -------------------------------------------------------------
    // Test 5: Same customer can submit a different hall
    // -------------------------------------------------------------
    const diffHallPayload = {
      ...validPayload1,
      hallId: 'test-hall-2', // Different hall
    };
    const res5 = createMockRes();
    await createBooking(createMockReq(diffHallPayload), res5 as any);
    assert(
      res5.statusCode === 201 &&
      mockBookings.length === 3 &&
      res5.body.data?.hallId === 'test-hall-2',
      'Test 5: Same customer can submit a different hall (creates 3rd record)'
    );

    // -------------------------------------------------------------
    // Test 6: Same customer can submit a different time slot
    // -------------------------------------------------------------
    const diffSlotPayload = {
      ...validPayload1,
      startTime: '17:00',
      endTime: '21:00', // Different time slot
    };
    const res6 = createMockRes();
    await createBooking(createMockReq(diffSlotPayload), res6 as any);
    assert(
      res6.statusCode === 201 &&
      mockBookings.length === 4 &&
      res6.body.data?.startTime === '17:00',
      'Test 6: Same customer can submit a different time slot (creates 4th record)'
    );

    // -------------------------------------------------------------
    // Test 7: A request after the 5-minute window is not treated as duplicate
    // -------------------------------------------------------------
    // Age the 1st booking by 6 minutes (simulate past window)
    mockBookings[0].createdAt = new Date(Date.now() - 6 * 60 * 1000);
    const res7 = createMockRes();
    await createBooking(createMockReq(validPayload1), res7 as any);
    assert(
      res7.statusCode === 201 &&
      mockBookings.length === 5,
      'Test 7: Request after 5-minute window creates a new record (not blocked as duplicate)'
    );

    // -------------------------------------------------------------
    // Test 8: Different customers can submit independent requests
    // -------------------------------------------------------------
    const diffCustomerPayload = {
      ...validPayload1,
      contactName: 'Ananya Roy',
      contactPhone: '9845012345', // Different phone
      contactEmail: 'ananya.roy@example.com',
    };
    const res8 = createMockRes();
    await createBooking(createMockReq(diffCustomerPayload), res8 as any);
    assert(
      res8.statusCode === 201 &&
      mockBookings.length === 6 &&
      res8.body.data?.contactName === 'Ananya Roy',
      'Test 8: Different customers can submit independent requests for the same slot'
    );

    // -------------------------------------------------------------
    // Test 9: Capacity and availability validation still work
    // -------------------------------------------------------------
    // 9a. Capacity exceeded (700 > 400 for test-hall-1)
    const capacityExceededPayload = {
      ...validPayload1,
      guestsCount: 700,
    };
    const res9a = createMockRes();
    await createBooking(createMockReq(capacityExceededPayload), res9a as any);
    assert(
      res9a.statusCode === 400 && res9a.body.error?.code === 'CAPACITY_EXCEEDED',
      'Test 9a: Capacity validation rejects requests exceeding max capacity (400 CAPACITY_EXCEEDED)'
    );

    // 9b. Maintenance blackout (2026-12-02 is inside maint-1)
    const maintenancePayload = {
      ...validPayload1,
      eventDate: '2026-12-02',
    };
    const res9b = createMockRes();
    await createBooking(createMockReq(maintenancePayload), res9b as any);
    assert(
      res9b.statusCode === 409 && res9b.body.error?.code === 'MAINTENANCE_BLACKOUT',
      'Test 9b: Maintenance blackout rejects conflicting dates (409 MAINTENANCE_BLACKOUT)'
    );

    // 9c. Inactive hall
    const inactiveHallPayload = {
      ...validPayload1,
      hallId: 'test-hall-inactive',
    };
    const res9c = createMockRes();
    await createBooking(createMockReq(inactiveHallPayload), res9c as any);
    assert(
      res9c.statusCode === 400 && res9c.body.error?.code === 'HALL_INACTIVE',
      'Test 9c: Inactive hall correctly rejected (400 HALL_INACTIVE)'
    );

    // 9d. Non-existent hall
    const notFoundPayload = {
      ...validPayload1,
      hallId: 'non-existent-hall-id',
    };
    const res9d = createMockRes();
    await createBooking(createMockReq(notFoundPayload), res9d as any);
    assert(
      res9d.statusCode === 404 && res9d.body.error?.code === 'HALL_NOT_FOUND',
      'Test 9d: Non-existent hall correctly returns 404 HALL_NOT_FOUND'
    );

    // 9e. Approved booking slot conflict takes precedence over duplicate detection
    mockBookings.push({
      id: 'BK-APPROVED-EXISTING',
      hallId: 'test-hall-1',
      eventDate: '2026-12-30',
      startTime: '10:00',
      endTime: '16:00',
      status: 'APPROVED',
      contactPhone: '+91 98765 43210',
      createdAt: new Date(),
    });

    const approvedConflictPayload = {
      ...validPayload1,
      eventDate: '2026-12-30',
    };
    const res9e = createMockRes();
    await createBooking(createMockReq(approvedConflictPayload), res9e as any);
    assert(
      res9e.statusCode === 409 && res9e.body.error?.code === 'SLOT_ALREADY_BOOKED',
      'Test 9e: Approved booking slot conflict takes precedence over duplicate handling (409 SLOT_ALREADY_BOOKED)'
    );

    // -------------------------------------------------------------
    // Test 10: Simultaneous duplicate requests do not create duplicates
    // -------------------------------------------------------------
    // Reset bookings for simultaneous test
    mockBookings = [];
    const simultaneousPayload = {
      ...validPayload1,
      eventDate: '2026-12-25',
    };

    const simRes1 = createMockRes();
    const simRes2 = createMockRes();

    // Fire two concurrent calls
    await Promise.all([
      createBooking(createMockReq(simultaneousPayload), simRes1 as any),
      createBooking(createMockReq(simultaneousPayload), simRes2 as any),
    ]);

    const statuses = [simRes1.statusCode, simRes2.statusCode].sort();
    assert(
      mockBookings.length === 1 &&
      statuses[0] === 200 &&
      statuses[1] === 201,
      'Test 10: Concurrent twin requests result in exactly 1 created record (201) and 1 duplicate return (200)'
    );

  } finally {
    // Restore original prisma method
    prisma.$transaction = origTransaction;
  }

  console.log('\n=================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test harness execution failed:', err);
  process.exit(1);
});
