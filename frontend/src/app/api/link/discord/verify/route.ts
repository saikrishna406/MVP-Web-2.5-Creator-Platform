import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

/**
 * POST /api/link/discord/verify
 * ------------------------------
 * Called by the Discord bot (NOT by the user's browser) to complete
 * the identity linking flow.
 *
 * Flow:
 *  1. Validate HMAC signature (bot authentication)
 *  2. Look up the link code
 *  3. Verify: not expired, not used
 *  4. Check for duplicate identity
 *  5. In one transaction: insert user_identity + mark code as used
 *  6. Return success/failure for the bot to relay to the user
 *
 * Security:
 *  - HMAC-SHA256 signature verification (shared secret)
 *  - Rate limiting on the endpoint (keyed by external_user_id)
 *  - DB constraints prevent duplicate identities
 */

// ── HMAC Verification ────────────────────────────────────────────
function verifyHmac(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ── Input validation ─────────────────────────────────────────────
interface VerifyPayload {
  code: string;
  external_user_id: string;
  external_username: string;
}

function validatePayload(body: unknown): body is VerifyPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.code === 'string' && b.code.length > 0 &&
    typeof b.external_user_id === 'string' && b.external_user_id.length > 0 &&
    typeof b.external_username === 'string' && b.external_username.length > 0
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
        console.warn('[link/verify] Rejected — invalid HMAC signature');
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
        { error: 'Missing required fields: code, external_user_id, external_username' },
        { status: 400 }
      );
    }

    const { code, external_user_id, external_username } = body;

    // ── Rate limit: 10 verify attempts per minute per Discord user ──
    const rl = checkRateLimit(`link-verify:${external_user_id}`, {
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait.' },
        { status: 429 }
      );
    }

    const supabase = await createServiceClient();

    // ── Step 1: Look up the code ───────────────────────────────
    const { data: linkCode, error: lookupError } = await supabase
      .from('link_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .maybeSingle();

    if (lookupError) {
      console.error('[link/verify] DB lookup error:', lookupError.message);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    if (!linkCode) {
      return NextResponse.json(
        { error: 'Invalid code. Please generate a new one on the platform.' },
        { status: 404 }
      );
    }

    // ── Step 2: Check expiry ───────────────────────────────────
    if (new Date(linkCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Code expired. Please generate a new one on the platform.' },
        { status: 410 }
      );
    }

    // ── Step 3: Check if already used ──────────────────────────
    if (linkCode.used) {
      return NextResponse.json(
        { error: 'Code already used. Please generate a new one.' },
        { status: 410 }
      );
    }

    // ── Step 4: Check if this Discord account is already linked ─
    const { data: existingIdentity } = await supabase
      .from('user_identities')
      .select('id, user_id')
      .eq('platform', 'discord')
      .eq('external_user_id', external_user_id)
      .maybeSingle();

    if (existingIdentity) {
      // Mark the code as used so it can't be retried
      await supabase
        .from('link_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', linkCode.id);

      return NextResponse.json(
        { error: 'This Discord account is already linked to a platform account.' },
        { status: 409 }
      );
    }

    // ── Step 5: Insert identity + mark code used ───────────────
    // Using two sequential operations (Supabase doesn't support
    // client-side transactions, but the UNIQUE constraint on
    // user_identities guarantees no duplicates even in a race).

    const { error: identityError } = await supabase
      .from('user_identities')
      .insert({
        user_id: linkCode.user_id,
        platform: 'discord',
        external_user_id,
        external_username,
      });

    if (identityError) {
      // UNIQUE violation = race condition (another request got there first)
      if (identityError.code === '23505') {
        return NextResponse.json(
          { error: 'This Discord account is already linked.' },
          { status: 409 }
        );
      }
      console.error('[link/verify] Identity insert error:', identityError.message);
      return NextResponse.json({ error: 'Failed to link account' }, { status: 500 });
    }

    // Mark code as used (even if this fails, the identity is linked)
    await supabase
      .from('link_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', linkCode.id);

    // ── Step 6: Backfill — update any existing engagement_logs for this Discord user
    // that have user_id = NULL (logged before the user linked their account)
    await supabase
      .from('engagement_logs')
      .update({ user_id: linkCode.user_id })
      .eq('platform', 'discord')
      .eq('external_user_id', external_user_id)
      .is('user_id', null);

    console.log(
      `[link/verify] Success — linked Discord ${external_username} (${external_user_id}) → user ${linkCode.user_id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Discord account linked successfully!',
      user_id: linkCode.user_id,
    });

  } catch (error) {
    console.error('[link/verify] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
