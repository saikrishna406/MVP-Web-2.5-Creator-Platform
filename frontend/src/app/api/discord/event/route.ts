import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

/**
 * POST /api/discord/event
 * ------------------------
 * Receives normalized engagement events from the Discord bot.
 *
 * This is the new Phase 1 event ingestion endpoint that replaces the
 * old /api/discord/activity for multi-creator tracking. The old endpoint
 * remains functional for backward compatibility.
 *
 * Pipeline:
 *  1. Validate HMAC signature (bot authentication)
 *  2. Validate payload fields
 *  3. Idempotency check (external_event_id)
 *  4. Map channel_id → creator_id (via creator_channels)
 *  5. Map external_user_id → user_id (via user_identities)
 *  6. Insert into engagement_logs
 *
 * Phase 1 scope: LOG ONLY — no points, no wallet updates.
 */

// ── HMAC Verification ────────────────────────────────────────────
function verifyHmac(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

// ── Types & Validation ───────────────────────────────────────────
interface EventPayload {
  external_user_id: string;
  channel_id: string;
  event_id: string;
  action_type: string;
  metadata?: Record<string, unknown>;
}

const VALID_ACTIONS = ['message', 'reaction', 'join', 'voice', 'checkin'];

function validatePayload(body: unknown): body is EventPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.external_user_id === 'string' && b.external_user_id.length > 0 &&
    typeof b.channel_id === 'string' && b.channel_id.length > 0 &&
    typeof b.event_id === 'string' && b.event_id.length > 0 &&
    typeof b.action_type === 'string' && VALID_ACTIONS.includes(b.action_type)
  );
}

export async function POST(request: NextRequest) {
  try {
    // ── Read raw body for HMAC verification ────────────────────
    const rawBody = await request.text();

    // ── Verify HMAC signature ──────────────────────────────────
    const secret = process.env.DISCORD_INTERNAL_SECRET;
    if (secret && secret !== 'your_discord_internal_secret_here') {
      const signature = request.headers.get('x-bot-signature');
      if (!verifyHmac(rawBody, signature, secret)) {
        console.warn('[discord/event] Rejected — invalid HMAC signature');
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // ── Parse body ─────────────────────────────────────────────
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!validatePayload(body)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          required: {
            external_user_id: 'string',
            channel_id: 'string (guild_id)',
            event_id: 'string (unique message/event ID)',
            action_type: `one of: ${VALID_ACTIONS.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    const { external_user_id, channel_id, event_id, action_type, metadata } = body;

    // ── Rate limit: per guild (60 events/min is generous) ──────
    const rl = checkRateLimit(`discord-event:${channel_id}`, {
      maxRequests: 120,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      // Don't crash the bot — return 200 with a flag
      return NextResponse.json({ success: true, throttled: true });
    }

    // ── Build idempotency key ──────────────────────────────────
    // Prefix with platform to ensure global uniqueness
    const externalEventId = `discord:${event_id}`;

    const supabase = await createServiceClient();

    // ── Step 1: Idempotency check ──────────────────────────────
    const { data: existing } = await supabase
      .from('engagement_logs')
      .select('id')
      .eq('external_event_id', externalEventId)
      .maybeSingle();

    if (existing) {
      // Already processed — return success to prevent bot retries
      return NextResponse.json({ success: true, duplicate: true });
    }

    // ── Step 2: Map channel → creator ──────────────────────────
    const { data: channel } = await supabase
      .from('creator_channels')
      .select('creator_id')
      .eq('platform', 'discord')
      .eq('external_channel_id', channel_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!channel) {
      // Guild not registered to any creator — log and ignore
      console.log(
        `[discord/event] Ignored — guild ${channel_id} not mapped to any creator`
      );
      return NextResponse.json({ success: true, ignored: true, reason: 'unknown_channel' });
    }

    // ── Step 3: Map external user → platform user ──────────────
    const { data: identity } = await supabase
      .from('user_identities')
      .select('user_id')
      .eq('platform', 'discord')
      .eq('external_user_id', external_user_id)
      .maybeSingle();

    const userId = identity?.user_id ?? null;

    // ── Step 4: Insert engagement log ──────────────────────────
    const { error: insertError } = await supabase
      .from('engagement_logs')
      .insert({
        user_id: userId,
        creator_id: channel.creator_id,
        platform: 'discord',
        external_user_id,
        external_channel_id: channel_id,
        external_event_id: externalEventId,
        action_type,
        metadata: metadata ?? {},
      });

    if (insertError) {
      // UNIQUE violation on external_event_id = race-condition duplicate
      if (insertError.code === '23505') {
        return NextResponse.json({ success: true, duplicate: true });
      }
      console.error('[discord/event] Insert error:', insertError.message);
      return NextResponse.json({ success: false, error: 'DB insert failed' });
    }

    console.log(
      `[discord/event] Logged — creator=${channel.creator_id} ` +
      `user=${userId ?? 'unlinked'} action=${action_type} event=${event_id}`
    );

    // ── Step 5: Message Reward Processing (AFTER log) ──────────
    // Only award points for messages from linked, non-bot users
    if (action_type === 'message' && userId) {
      try {
        const content = typeof metadata?.content === 'string' ? metadata.content : '';
        const isBot = metadata?.is_bot === true;

        // Skip: bot messages or content too short
        if (!isBot && content.length >= 5) {
          // Anti-spam: 30-second cooldown per user
          const cooldownKey = `discord_reward_cooldown:${userId}`;
          const cooldownRl = checkRateLimit(cooldownKey, { maxRequests: 1, windowSeconds: 30 });

          if (cooldownRl.allowed) {
            // Anti-spam: reject duplicate content (same as last message)
            const { data: lastMsg } = await supabase
              .from('engagement_logs')
              .select('metadata')
              .eq('user_id', userId)
              .eq('action_type', 'message')
              .neq('external_event_id', externalEventId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const lastContent = typeof lastMsg?.metadata?.content === 'string' ? lastMsg.metadata.content : '';
            const isDuplicate = lastContent.length > 0 && lastContent === content;

            if (!isDuplicate) {
              // Call reward_action() RPC — handles daily cap + cooldown internally
              const idempotencyKey = `discord_msg_${event_id}`;
              const { data: rewardResult, error: rewardError } = await supabase.rpc('reward_action', {
                p_user_id: userId,
                p_action: 'discord_message',
                p_points: 1,
                p_daily_limit: 100,
                p_description: 'Discord message reward',
                p_reference_id: idempotencyKey,
                p_cooldown_minutes: 0.5,
              });

              const row = Array.isArray(rewardResult) ? rewardResult[0] : rewardResult;

              if (!rewardError && row?.success) {
                // Atomic increment in creator_points_agg (INSERT ON CONFLICT)
                await supabase.rpc('increment_creator_points', {
                  p_user_id: userId,
                  p_creator_id: channel.creator_id,
                });

                console.log(`[discord/event] Rewarded user=${userId} +1pt for message in creator=${channel.creator_id}`);
              }
            } else {
              console.log(`[discord/event] Skipped reward — duplicate content for user=${userId}`);
            }
          } else {
            console.log(`[discord/event] Skipped reward — cooldown active for user=${userId}`);
          }
        }
      } catch (rewardErr) {
        // Never let reward failures crash the event pipeline
        console.error('[discord/event] Reward processing error (non-fatal):', rewardErr);
      }
    }

    return NextResponse.json({
      success: true,
      logged: true,
      user_linked: userId !== null,
    });

  } catch (error) {
    // Never crash the bot — always return 200-level on unexpected errors
    console.error('[discord/event] Unexpected error:', error);
    return NextResponse.json({ success: true, ignored: true });
  }
}
