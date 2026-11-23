import { Router, Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { sendSuccess, sendError } from '../utils/response.js';

// Ensure backend/.env is loaded reliably regardless of execution working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = Router();

// In-memory rate limiting map for signed URL generation: max 15 requests per minute per IP
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 15;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
};

/**
 * Returns today's date in Asia/Kolkata timezone formatted as YYYY-MM-DD.
 */
export const getKolkataCurrentDate = (): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

/**
 * GET /api/receptionist/connection-details
 * Generates an ephemeral signed WebSocket conversation URL for the ElevenLabs agent.
 * Security & Safety:
 * - Keeps ELEVENLABS_API_KEY exclusively on the backend.
 * - Fails safely with 503 if configuration is missing (no silent public fallback).
 * - Never returns or logs API keys or generated tokens.
 * - Enforces rate limiting per IP.
 * - Returns today's date in Asia/Kolkata (YYYY-MM-DD) for tool dynamic variable requirements.
 */
router.get('/connection-details', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
  if (!checkRateLimit(clientIp)) {
    sendError(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many voice session initialization requests. Please wait a moment.');
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    sendError(
      res,
      503,
      'ELEVENLABS_CONFIG_MISSING',
      'ELEVENLABS_API_KEY is not configured in backend/.env. Please configure your ElevenLabs API key on the server to enable voice receptionist conversations.'
    );
    return;
  }

  const agentId = process.env.ELEVENLABS_AGENT_ID?.trim();
  const branchId = process.env.ELEVENLABS_BRANCH_ID?.trim() || 'agtbrch_3001m838y2fseayt17cq4hmywhv1';

  if (!agentId) {
    sendError(
      res,
      503,
      'ELEVENLABS_AGENT_MISSING',
      'ELEVENLABS_AGENT_ID is not configured in backend/.env. Please configure the base Agent ID from your ElevenLabs dashboard.'
    );
    return;
  }

  try {
    // Official ElevenLabs ConvAI signed URL endpoint
    const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');
    url.searchParams.set('agent_id', agentId);
    if (branchId && branchId !== agentId) {
      url.searchParams.set('branch_id', branchId);
    }

    const upstreamResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!upstreamResponse.ok) {
      const status = upstreamResponse.status;
      let errDetail = 'Upstream ElevenLabs error';
      try {
        const errJson = (await upstreamResponse.json()) as any;
        errDetail = errJson?.detail?.message || errJson?.message || JSON.stringify(errJson);
      } catch {
        errDetail = await upstreamResponse.text();
      }

      if (status === 401 || status === 403) {
        sendError(res, 401, 'ELEVENLABS_UNAUTHORIZED', `ElevenLabs authentication failed: ${errDetail}`);
        return;
      }
      if (status === 404) {
        sendError(res, 404, 'ELEVENLABS_NOT_FOUND', `ElevenLabs agent '${agentId}' or branch '${branchId}' not found: ${errDetail}`);
        return;
      }

      sendError(res, 502, 'ELEVENLABS_UPSTREAM_ERROR', `ElevenLabs error (${status}): ${errDetail}`);
      return;
    }

    const payload = (await upstreamResponse.json()) as { signed_url: string };

    if (!payload?.signed_url) {
      sendError(res, 502, 'INVALID_UPSTREAM_RESPONSE', 'ElevenLabs did not return a valid signed_url');
      return;
    }

    // Return signed URL and Asia/Kolkata current date safely without logging secrets or full URLs
    const currentDate = getKolkataCurrentDate();
    sendSuccess(res, {
      signedUrl: payload.signed_url,
      currentDate,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network failure';
    sendError(res, 500, 'SIGNED_URL_REQUEST_FAILED', `Failed to request signed conversation URL: ${errorMsg}`);
  }
});

export default router;
