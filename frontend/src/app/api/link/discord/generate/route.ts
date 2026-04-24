import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import crypto from 'crypto';

/**
 * POST /api/link/discord/generate
 * --------------------------------
 * Generates a one-time link code that the user sends to the Discord bot.
 *
 * Flow:
 *  1. Verify authenticated session
 *  2. Rate-limit (prevent code spam)
 *  3. Invalidate any existing unused codes for this user+platform
 *  4. Generate a fresh LINK-XXXX code
 *  5. Store in link_codes table (expires in 10 min)
 *  6. Return code + instructions
 *
 * Requires: Authenticated Supabase session (any role)
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit: 5 code generations per 5 minutes ────────────
    const rl = checkRateLimit(`link-generate:${user.id}`, {
      maxRequests: 5,
      windowSeconds: 300,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many code requests. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    const serviceClient = await createServiceClient();
    const platform = 'discord';

    // ── Check if user already has this platform linked ──────────
    const { data: existing } = await serviceClient
      .from('user_identities')
      .select('id, external_username')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: 'Discord account already linked',
          linked_as: existing.external_username,
        },
        { status: 409 }
      );
    }

    // ── Invalidate any existing unused codes for this user+platform
    await serviceClient
      .from('link_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('used', false);

    // ── Generate unique link code ───────────────────────────────
    const code = 'LINK-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await serviceClient
      .from('link_codes')
      .insert({
        user_id: user.id,
        platform,
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      // Code collision (extremely unlikely). If it happens, user can retry.
      console.error('[link/generate] Insert error:', insertError.message);
      return NextResponse.json(
        { error: 'Failed to generate code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code,
      platform,
      expires_at: expiresAt,
      instructions: `Go to any Discord server with our bot and type:\n/link ${code}\n\nThis code expires in 10 minutes.`,
    });

  } catch (error) {
    console.error('[link/generate] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
