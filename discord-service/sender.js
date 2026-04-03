'use strict';

/**
 * sender.js — Sends events to the Next.js backend
 * -------------------------------------------------
 * Architecture: Discord Bot → (this module) → Next.js API → Supabase
 *
 * Two sender functions:
 *   sendEvent()      → POST /api/discord/event  (engagement tracking)
 *   sendLinkVerify() → POST /api/link/discord/verify (identity linking)
 *
 * All requests are HMAC-SHA256 signed using DISCORD_INTERNAL_SECRET.
 */

const crypto = require('crypto');

const BACKEND_BASE =
  process.env.BACKEND_URL || 'http://localhost:3000';

const EVENT_URL = `${BACKEND_BASE}/api/discord/event`;
const LINK_URL = `${BACKEND_BASE}/api/link/discord/verify`;

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;

/**
 * Sleep helper for retry delays.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate HMAC-SHA256 signature for a request body.
 */
function signBody(body) {
  const secret = process.env.DISCORD_INTERNAL_SECRET || '';
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Send a request to the backend with HMAC signing and retry logic.
 *
 * @param {string} url    - Backend endpoint URL
 * @param {object} payload - Request body object
 * @param {object} options - { retries, throwOnFailure }
 * @returns {Promise<object>} - Parsed JSON response
 */
async function sendWithRetry(url, payload, options = {}) {
  const { retries = MAX_RETRIES, throwOnFailure = false } = options;
  const body = JSON.stringify(payload);
  const signature = signBody(body);

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-signature': signature,
          // Keep legacy header for backward compat with old activity endpoint
          'x-discord-secret': process.env.DISCORD_INTERNAL_SECRET || '',
        },
        body,
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok && response.status >= 500) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(json)}`);
      }

      // 4xx responses are not retryable — return immediately
      return json;

    } catch (err) {
      lastError = err;
      console.warn(
        `[sender] Attempt ${attempt}/${retries} to ${url} failed:`,
        err.message
      );

      if (attempt < retries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await sleep(BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  // All retries exhausted
  console.error(
    `[sender] All ${retries} retries exhausted for ${url}. Payload:`,
    payload,
    '\nLast error:',
    lastError?.message
  );

  if (throwOnFailure) {
    throw lastError || new Error('All retries exhausted');
  }

  return { success: false, error: 'All retries exhausted' };
}

/**
 * Send an engagement event to POST /api/discord/event
 *
 * @param {{
 *   external_user_id: string,
 *   channel_id: string,
 *   event_id: string,
 *   action_type: string,
 *   metadata?: object
 * }} payload
 */
async function sendEvent(payload) {
  console.log(
    `[sender] Sending event: ${payload.action_type} from ${payload.external_user_id}`
  );
  return sendWithRetry(EVENT_URL, payload);
}

/**
 * Send a link verification to POST /api/link/discord/verify
 * This DOES throw on failure so the bot can show an error to the user.
 *
 * @param {{
 *   code: string,
 *   external_user_id: string,
 *   external_username: string
 * }} payload
 */
async function sendLinkVerify(payload) {
  console.log(`[sender] Verifying link code: ${payload.code}`);
  return sendWithRetry(LINK_URL, payload, { throwOnFailure: true });
}

module.exports = { sendEvent, sendLinkVerify };
