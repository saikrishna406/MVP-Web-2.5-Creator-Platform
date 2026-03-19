'use strict';

/**
 * sender.js
 * ---------
 * Sends Discord activity events to the Next.js backend API.
 *
 * Architecture: Discord Bot → (this module) → Next.js API → Supabase
 *
 * Future extension points:
 *  - Swap `fetch` for a queue-backed sender (e.g., BullMQ / Redis)
 *  - Add exponential back-off in the retry loop
 *  - Support batching multiple events in one request
 */

const BACKEND_URL =
  process.env.BACKEND_URL || 'http://localhost:3000/api/discord/activity';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // placeholder — extend with exponential back-off

/**
 * Sleep helper for retry delays.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a single Discord activity event to the backend.
 *
 * @param {{
 *   discord_user_id: string,
 *   guild_id: string,
 *   event_type: string,
 *   points: number,
 *   timestamp?: string
 * }} payload
 * @returns {Promise<void>}
 */
async function sendActivity(payload) {
  const body = JSON.stringify({
    ...payload,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  });

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[sender] Attempt ${attempt}/${MAX_RETRIES} — sending activity:`,
        payload.event_type,
        'from',
        payload.discord_user_id
      );

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward a shared secret so the API can reject unauthenticated bots
          'x-discord-secret': process.env.DISCORD_INTERNAL_SECRET || '',
        },
        body,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '(no body)');
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const json = await response.json().catch(() => null);
      console.log('[sender] Activity accepted by backend:', json);
      return; // success — exit retry loop
    } catch (err) {
      lastError = err;
      console.warn(`[sender] Attempt ${attempt} failed:`, err.message);

      if (attempt < MAX_RETRIES) {
        // TODO: replace with exponential back-off (RETRY_DELAY_MS * 2^attempt)
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  // All retries exhausted — log and swallow so the bot never crashes
  console.error(
    '[sender] All retries exhausted. Event could not be delivered:',
    payload,
    '\nLast error:',
    lastError?.message
  );
}

module.exports = { sendActivity };
