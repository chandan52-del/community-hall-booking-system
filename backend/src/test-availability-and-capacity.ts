import { checkHallAvailability } from './controllers/hallController.js';
import { createBooking } from './controllers/bookingController.js';
import { hallAvailabilityQuerySchema } from './validators/hallValidator.js';
import { createBookingSchema } from './validators/bookingValidator.js';
import { prisma } from './database/client.js';

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

// Simple test harness
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  âœ… PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  â Œ FAIL: ${testName}`);
    if (details) {
      console.error('     Details:', JSON.stringify(details, null, 2));
    }
    failed++;
  }
}

async function runTests() {
  console.log('=================================================================');
  console.log('COMMUNITY HALL BOOKING SYSTEM - LOCAL TEST SUITE');
  console.log('Availability Time-Slot Overlaps & Hall Capacity Validation');
  console.log('=================================================================\n');

  // Save original prisma methods so we can restore them cleanly
  const origTransaction = prisma.$transaction;
  const origFindUniqueHall = prisma.hall.findUnique;
  const origFindManyBooking = prisma.booking.findMany;
  const origFindFirstBooking = prisma.booking.findFirst;
  const origFindFirstMaintenance = prisma.maintenanceSchedule.findFirst;
  const origCreateBooking = prisma.booking.create;

  (prisma as any).$transaction = async (cb: any) => {
    return cb({
      $queryRaw: async () => [],
      hall: prisma.hall,
      maintenanceSchedule: prisma.maintenanceSchedule,
      booking: prisma.booking,
    });
  };

  const mockHall = {
    id: 'test-hall-1',
    name: 'Grand Heritage Sabha',
    tagline: 'Premium community venue',
    address: '100 Main Road',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    description: 'A spacious heritage hall for weddings and events.',
    seatedCapacity: 500,
    floatingCapacity: 800,
    diningCapacity: 300,
    baseRatePerDay: 50000,
    hourlyRate: 6000,
    cleaningFee: 3000,
    depositRequired: 15000,
    currency: 'INR',
    notes: null,
    isActive: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    // =============================================================
    // SUITE 1: Validation Schemas
    // =============================================================
    console.log('[Suite 1: Zod Schema Validation]');

    // 1.1 Invalid time range (startTime >= endTime)
    const invalidTimeRange = hallAvailabilityQuerySchema.safeParse({
      date: '2026-12-15',
      startTime: '18:00',
      endTime: '10:00',
    });
    assert(!invalidTimeRange.success, 'Schema rejects startTime >= endTime');

    // 1.2 Missing endTime when startTime provided
    const missingEndTime = hallAvailabilityQuerySchema.safeParse({
      date: '2026-12-15',
      startTime: '10:00',
    });
    assert(!missingEndTime.success, 'Schema rejects startTime without endTime');

    // 1.3 Missing startTime when endTime provided
    const missingStartTime = hallAvailabilityQuerySchema.safeParse({
      date: '2026-12-15',
      endTime: '14:00',
    });
    assert(!missingStartTime.success, 'Schema rejects endTime without startTime');

    // 1.4 Valid date only
    const validDateOnly = hallAvailabilityQuerySchema.safeParse({
      date: '2026-12-15',
    });
    assert(validDateOnly.success, 'Schema accepts date-only query');

    // 1.5 Valid date + startTime + endTime
    const validSlot = hallAvailabilityQuerySchema.safeParse({
      date: '2026-12-15',
      startTime: '10:00',
      endTime: '14:00',
    });
    assert(validSlot.success, 'Schema accepts valid date and time slot');

    // 1.6 Invalid date format
    const invalidDate = hallAvailabilityQuerySchema.safeParse({
      date: '15-12-2026',
    });
    assert(!invalidDate.success, 'Schema rejects non-YYYY-MM-DD date format');

    // =============================================================
    // SUITE 2: Time-Slot Availability Logic
    // =============================================================
    console.log('\n[Suite 2: Time-Slot Availability Checks]');

    // 2.1 Available time slot (non-overlapping)
    // Setup: Hall exists, no maintenance, approved booking is 09:00 - 13:00
    (prisma.hall.findUnique as any) = async () => mockHall;
    (prisma.maintenanceSchedule.findFirst as any) = async () => null;
    (prisma.booking.findMany as any) = async () => [
      { id: 'BK-1', startTime: '09:00', endTime: '13:00', eventType: 'Reception' },
    ];

    const reqAvailable = {
      params: { id: 'test-hall-1' },
      query: { date: '2026-12-15', startTime: '14:00', endTime: '18:00' },
    } as any;
    const resAvailable = createMockRes();
    await checkHallAvailability(reqAvailable, resAvailable as any);

    assert(
      resAvailable.statusCode === 200 &&
      resAvailable.body.success === true &&
      resAvailable.body.data.isAvailable === true &&
      resAvailable.body.data.reason === 'AVAILABLE',
      'Non-overlapping time slot (14:00-18:00 vs 09:00-13:00) reports AVAILABLE',
      resAvailable.body
    );

    // 2.2 Overlapping approved booking
    // Setup: Requested slot 11:00 - 15:00 overlaps with existing 09:00 - 13:00
    const reqOverlap = {
      params: { id: 'test-hall-1' },
      query: { date: '2026-12-15', startTime: '11:00', endTime: '15:00' },
    } as any;
    const resOverlap = createMockRes();
    await checkHallAvailability(reqOverlap, resOverlap as any);

    assert(
      resOverlap.statusCode === 200 &&
      resOverlap.body.success === true &&
      resOverlap.body.data.isAvailable === false &&
      resOverlap.body.data.reason === 'SLOT_CONFLICT' &&
      resOverlap.body.data.details?.conflictingSlot?.id === 'BK-1',
      'Overlapping approved booking (11:00-15:00 vs 09:00-13:00) reports SLOT_CONFLICT with conflict details',
      resOverlap.body
    );

    // 2.3 Adjacent slot (exact boundary: 13:00 - 17:00 vs existing 09:00 - 13:00)
    // Under interval overlap (start < existingEnd && end > existingStart),
    // 13:00 < 13:00 is false, so adjacent slot does NOT conflict
    const reqAdjacent = {
      params: { id: 'test-hall-1' },
      query: { date: '2026-12-15', startTime: '13:00', endTime: '17:00' },
    } as any;
    const resAdjacent = createMockRes();
    await checkHallAvailability(reqAdjacent, resAdjacent as any);

    assert(
      resAdjacent.statusCode === 200 &&
      resAdjacent.body.data.isAvailable === true &&
      resAdjacent.body.data.reason === 'AVAILABLE',
      'Adjacent boundary time slot (13:00-17:00 vs 09:00-13:00) does not conflict',
      resAdjacent.body
    );

    // 2.4 Pending bookings do not block availability
    // Only APPROVED bookings block; findMany is filtered by status: 'APPROVED'
    (prisma.booking.findMany as any) = async (args: any) => {
      // Confirm the controller specifically filters for status: 'APPROVED'
      assert(args.where.status === 'APPROVED', 'Query specifically filters only status=APPROVED bookings');
      return []; // No approved bookings exist (even if pending exists)
    };
    const reqPending = {
      params: { id: 'test-hall-1' },
      query: { date: '2026-12-15', startTime: '09:00', endTime: '13:00' },
    } as any;
    const resPending = createMockRes();
    await checkHallAvailability(reqPending, resPending as any);

    assert(
      resPending.body.data.isAvailable === true,
      'Pending or unapproved bookings do not block availability',
      resPending.body
    );

    // 2.5 Overlapping maintenance blackout
    (prisma.maintenanceSchedule.findFirst as any) = async () => ({
      id: 'maint-1',
      hallId: 'test-hall-1',
      startDate: '2026-12-14',
      endDate: '2026-12-16',
      description: 'Annual deep clean and flooring polish',
      status: 'SCHEDULED',
    });

    const reqMaint = {
      params: { id: 'test-hall-1' },
      query: { date: '2026-12-15', startTime: '10:00', endTime: '14:00' },
    } as any;
    const resMaint = createMockRes();
    await checkHallAvailability(reqMaint, resMaint as any);

    assert(
      resMaint.statusCode === 200 &&
      resMaint.body.data.isAvailable === false &&
      resMaint.body.data.reason === 'MAINTENANCE',
      'Maintenance blackout blocks the requested time slot with reason MAINTENANCE',
      resMaint.body
    );

    // 2.6 Full-day booking conflict
    (prisma.maintenanceSchedule.findFirst as any) = async () => null;
    (prisma.booking.findMany as any) = async () => [
      { id: 'BK-FULL', startTime: '08:00', endTime: '22:00', eventType: 'Convention' },
    ];

    const reqFullDay = {
      params: { id: 'test-hall-1' },
      query: { date: '2026-12-15', startTime: '10:00', endTime: '14:00' },
    } as any;
    const resFullDay = createMockRes();
    await checkHallAvailability(reqFullDay, resFullDay as any);

    assert(
      resFullDay.body.data.isAvailable === false &&
      resFullDay.body.data.reason === 'FULLY_BOOKED',
      'Full-day booking reserves the day and reports FULLY_BOOKED',
      resFullDay.body
    );

    // 2.7 Backward compatibility for date-only query
    (prisma.booking.findMany as any) = async () => [
      { id: 'BK-MORNING', startTime: '09:00', endTime: '12:00', eventType: 'Seminar' },
    ];
    const reqDateOnly = {
      params: { id: 'test-hall-1' },
      query: { date: '2026-12-15' },
    } as any;
    const resDateOnly = createMockRes();
    await checkHallAvailability(reqDateOnly, resDateOnly as any);

    assert(
      resDateOnly.statusCode === 200 &&
      resDateOnly.body.data.isAvailable === true &&
      resDateOnly.body.data.reason === 'AVAILABLE' &&
      resDateOnly.body.data.bookedSlots.length === 1 &&
      resDateOnly.body.data.startTime === undefined,
      'Date-only query preserves backward-compatible response shape',
      resDateOnly.body
    );

    // =============================================================
    // SUITE 3: Capacity Validation in Booking Creation
    // =============================================================
    console.log('\n[Suite 3: Hall Capacity Validation]');

    // 3.1 Valid guest count (within capacity: 500 <= max(500, 800))
    (prisma.hall.findUnique as any) = async () => mockHall;
    (prisma.maintenanceSchedule.findFirst as any) = async () => null;
    (prisma.booking.findFirst as any) = async () => null;
    let createdPayload: any = null;
    (prisma.booking.create as any) = async (args: any) => {
      createdPayload = args.data;
      return { id: args.data.id, ...args.data, hall: mockHall };
    };

    const validBookingBody = {
      hallId: 'test-hall-1',
      eventType: 'Wedding',
      eventDate: '2026-12-20',
      startTime: '10:00',
      endTime: '16:00',
      guestsCount: 500,
      contactName: 'Ramesh Kumar',
      contactEmail: 'ramesh@example.com',
      contactPhone: '+919876543210',
    };

    const reqValidBooking = { body: validBookingBody } as any;
    const resValidBooking = createMockRes();
    await createBooking(reqValidBooking, resValidBooking as any);

    assert(
      resValidBooking.statusCode === 201 &&
      resValidBooking.body.success === true &&
      createdPayload?.status === 'PENDING',
      'Valid guest count (500 <= 800) successfully creates booking with PENDING status',
      resValidBooking.body
    );

    // 3.2 Guest count exceeding maximum capacity (1000 > 800)
    const excessBookingBody = {
      ...validBookingBody,
      guestsCount: 1000,
    };
    const reqExcessBooking = { body: excessBookingBody } as any;
    const resExcessBooking = createMockRes();
    await createBooking(reqExcessBooking, resExcessBooking as any);

    assert(
      resExcessBooking.statusCode === 400 &&
      resExcessBooking.body.success === false &&
      resExcessBooking.body.error?.code === 'CAPACITY_EXCEEDED' &&
      resExcessBooking.body.error?.details?.maxCapacity === 800,
      'Guest count exceeding capacity (1000 > 800) rejected with 400 CAPACITY_EXCEEDED',
      resExcessBooking.body
    );

    // 3.3 Missing hall (hall does not exist)
    (prisma.hall.findUnique as any) = async () => null;
    const reqMissingHall = {
      body: { ...validBookingBody, hallId: 'unknown-hall-999' },
    } as any;
    const resMissingHall = createMockRes();
    await createBooking(reqMissingHall, resMissingHall as any);

    assert(
      resMissingHall.statusCode === 404 &&
      resMissingHall.body.error?.code === 'HALL_NOT_FOUND',
      'Non-existent hall ID rejected with 404 HALL_NOT_FOUND',
      resMissingHall.body
    );

    // 3.4 Inactive hall
    (prisma.hall.findUnique as any) = async () => ({ ...mockHall, isActive: false });
    const reqInactiveHall = { body: validBookingBody } as any;
    const resInactiveHall = createMockRes();
    await createBooking(reqInactiveHall, resInactiveHall as any);

    assert(
      resInactiveHall.statusCode === 400 &&
      resInactiveHall.body.error?.code === 'HALL_INACTIVE',
      'Inactive hall rejected with 400 HALL_INACTIVE',
      resInactiveHall.body
    );

    // 3.5 Invalid guest count in schema (zero or negative)
    const invalidGuestZero = createBookingSchema.safeParse({
      ...validBookingBody,
      guestsCount: 0,
    });
    const invalidGuestNeg = createBookingSchema.safeParse({
      ...validBookingBody,
      guestsCount: -5,
    });
    assert(!invalidGuestZero.success, 'Booking schema rejects guestsCount = 0');
    assert(!invalidGuestNeg.success, 'Booking schema rejects guestsCount < 0');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // Restore original prisma methods
    prisma.$transaction = origTransaction;
    prisma.hall.findUnique = origFindUniqueHall;
    prisma.booking.findMany = origFindManyBooking;
    prisma.booking.findFirst = origFindFirstBooking;
    prisma.maintenanceSchedule.findFirst = origFindFirstMaintenance;
    prisma.booking.create = origCreateBooking;

    console.log('\n=================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=================================================================');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
