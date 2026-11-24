import express from 'express';
import receptionistRoutes from './routes/receptionistRoutes.js';
import { getKolkataTimeDetails } from './utils/time.js';

const app = express();
app.use(express.json());
app.use('/api/receptionist', receptionistRoutes);

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, details?: any) {
  if (cond) {
    console.log(`  âœ… PASS: ${name}`);
    passed++;
  } else {
    console.error(`  â Œ FAIL: ${name}`);
    if (details) console.error('     Details:', details);
    failed++;
  }
}

async function run() {
  console.log('=================================================================');
  console.log('ELEVENLABS BROKER & TIME-BASED GREETING TEST SUITE');
  console.log('=================================================================\n');

  console.log('[Suite 1: Dynamic Time-Based Greeting Scenarios (Asia/Kolkata)]');

  // Exact 7 scenarios required by specification
  const timeScenarios = [
    {
      name: 'Scenario 1: 09:00 IST -> Good morning',
      utcIso: '2026-11-23T03:30:00.000Z',
      expectedTimeOfDay: 'morning',
      expectedGreeting: 'Hey, Namaste! Good morning. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    {
      name: 'Scenario 2: 14:00 IST -> Good afternoon',
      utcIso: '2026-11-23T08:30:00.000Z',
      expectedTimeOfDay: 'afternoon',
      expectedGreeting: 'Hey, Namaste! Good afternoon. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    {
      name: 'Scenario 3: 20:00 IST -> Good evening',
      utcIso: '2026-11-23T14:30:00.000Z',
      expectedTimeOfDay: 'evening',
      expectedGreeting: 'Hey, Namaste! Good evening. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    {
      name: 'Scenario 4: 00:30 IST (Midnight) -> Good evening',
      utcIso: '2026-11-23T19:00:00.000Z',
      expectedTimeOfDay: 'evening',
      expectedGreeting: 'Hey, Namaste! Good evening. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    {
      name: 'Scenario 5: 05:00 IST (Boundary) -> Good morning',
      utcIso: '2026-11-22T23:30:00.000Z',
      expectedTimeOfDay: 'morning',
      expectedGreeting: 'Hey, Namaste! Good morning. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    {
      name: 'Scenario 6: 12:00 IST (Boundary) -> Good afternoon',
      utcIso: '2026-11-23T06:30:00.000Z',
      expectedTimeOfDay: 'afternoon',
      expectedGreeting: 'Hey, Namaste! Good afternoon. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    {
      name: 'Scenario 7: 17:00 IST (Boundary) -> Good evening',
      utcIso: '2026-11-23T11:30:00.000Z',
      expectedTimeOfDay: 'evening',
      expectedGreeting: 'Hey, Namaste! Good evening. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    // Additional minute-edge boundary scenarios
    {
      name: 'Edge: 11:59 IST -> Good morning',
      utcIso: '2026-11-23T06:29:00.000Z',
      expectedTimeOfDay: 'morning',
      expectedGreeting: 'Hey, Namaste! Good morning. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    {
      name: 'Edge: 16:59 IST -> Good afternoon',
      utcIso: '2026-11-23T11:29:00.000Z',
      expectedTimeOfDay: 'afternoon',
      expectedGreeting: 'Hey, Namaste! Good afternoon. Welcome to our Community Hall Booking service. How may I help you today?'
    },
    {
      name: 'Edge: 04:59 IST -> Good evening',
      utcIso: '2026-11-22T23:29:00.000Z',
      expectedTimeOfDay: 'evening',
      expectedGreeting: 'Hey, Namaste! Good evening. Welcome to our Community Hall Booking service. How may I help you today?'
    }
  ];

  for (const s of timeScenarios) {
    const testDate = new Date(s.utcIso);
    const details = getKolkataTimeDetails(testDate);
    assert(
      details.timeOfDay === s.expectedTimeOfDay && details.greeting === s.expectedGreeting,
      `${s.name} [IST: ${details.currentTime} (${details.timeFormatted})] -> ${details.greeting.slice(0, 35)}...`,
      details
    );
  }

  console.log('\n[Suite 2: ElevenLabs Connection Broker Security Tests]');
  const server = app.listen(5678);

  try {
    // 1. Missing API Key check
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_AGENT_ID;

    const resNoKey = await fetch('http://localhost:5678/api/receptionist/connection-details');
    const jsonNoKey = await resNoKey.json() as any;

    assert(
      resNoKey.status === 503 &&
      jsonNoKey.success === false &&
      jsonNoKey.error?.code === 'ELEVENLABS_CONFIG_MISSING',
      'Fails safely with 503 ELEVENLABS_CONFIG_MISSING when API key is not configured',
      jsonNoKey
    );

    // 2. Missing Agent ID check
    process.env.ELEVENLABS_API_KEY = 'test_key_dummy';
    delete process.env.ELEVENLABS_AGENT_ID;

    const resNoAgent = await fetch('http://localhost:5678/api/receptionist/connection-details');
    const jsonNoAgent = await resNoAgent.json() as any;

    assert(
      resNoAgent.status === 503 &&
      jsonNoAgent.success === false &&
      jsonNoAgent.error?.code === 'ELEVENLABS_AGENT_MISSING',
      'Fails safely with 503 ELEVENLABS_AGENT_MISSING when Agent ID is not configured',
      jsonNoAgent
    );

    // 3. Upstream Unauthorized check (using dummy key against real ElevenLabs API)
    process.env.ELEVENLABS_API_KEY = 'invalid_dummy_key_12345';
    process.env.ELEVENLABS_AGENT_ID = 'agtbrch_3001m838y2fseayt17cq4hmywhv1';

    const resUpstreamAuth = await fetch('http://localhost:5678/api/receptionist/connection-details');
    const jsonUpstreamAuth = await resUpstreamAuth.json() as any;

    assert(
      resUpstreamAuth.status === 401 &&
      jsonUpstreamAuth.success === false &&
      jsonUpstreamAuth.error?.code === 'ELEVENLABS_UNAUTHORIZED',
      'Upstream 401 from ElevenLabs is caught and returned cleanly as 401 ELEVENLABS_UNAUTHORIZED',
      jsonUpstreamAuth
    );

    // Clean up
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_AGENT_ID;

    console.log('\n=================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=================================================================');
  } finally {
    server.close();
  }
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
