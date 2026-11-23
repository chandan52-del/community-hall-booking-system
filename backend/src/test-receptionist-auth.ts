import express from 'express';
import receptionistRoutes from './routes/receptionistRoutes.js';

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
  console.log('ELEVENLABS CONNECTION BROKER SECURITY TESTS');
  console.log('=================================================================\n');

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
    console.log(`BROKER TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=================================================================');
  } finally {
    server.close();
  }
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
