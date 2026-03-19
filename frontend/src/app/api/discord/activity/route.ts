import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/discord/activity
 * --------------------------
 * Receives activity events from the Discord bot service.
 *
 * Flow:
 *  1. Validate payload fields
 *  2. Look up connected_accounts for the Discord user
 *  3. If NOT linked → return { success: true, ignored: true } silently
 *  4. If linked →
 *     a. Insert row into discord_activity
 *     b. Call increment_discord_points() RPC to update aggregated score
 *
 * Safety rules:
 *  - Uses Supabase SERVICE ROLE key (bypasses RLS for writes)
 *  - Never touches wallets, point_transactions, or any existing table
 *  - Returns success=true on every path so the bot never crashes/retries
 *  - Optional DISCORD_INTERNAL_SECRET header for bot authentication
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface DiscordActivityPayload {
    discord_user_id: string;
    guild_id?: string;
    event_type: string;
    points: number;
    timestamp?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validatePayload(body: unknown): body is DiscordActivityPayload {
    if (!body || typeof body !== 'object') return false;
    const b = body as Record<string, unknown>;
    return (
        typeof b.discord_user_id === 'string' && b.discord_user_id.length > 0 &&
        typeof b.event_type === 'string' && b.event_type.length > 0 &&
        typeof b.points === 'number' && Number.isFinite(b.points) && b.points > 0
    );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // ── Optional: verify shared secret ───────────────────────────────────
        const internalSecret = process.env.DISCORD_INTERNAL_SECRET;
        if (internalSecret && internalSecret !== 'your_discord_internal_secret_here') {
            const provided = request.headers.get('x-discord-secret');
            if (provided !== internalSecret) {
                console.warn('[discord/activity] Rejected — invalid internal secret');
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // ── Parse body ────────────────────────────────────────────────────────
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        if (!validatePayload(body)) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    required: ['discord_user_id', 'event_type', 'points (number > 0)'],
                },
                { status: 400 }
            );
        }

        const { discord_user_id, guild_id, event_type, points, timestamp } = body;

        // ── Supabase service client (bypasses RLS for writes) ─────────────────
        const supabase = await createServiceClient();

        // ── Step 1: Look up linked platform user ──────────────────────────────
        const { data: linked, error: lookupError } = await supabase
            .from('connected_accounts')
            .select('user_id')
            .eq('platform', 'discord')
            .eq('platform_user_id', discord_user_id)
            .maybeSingle();

        if (lookupError) {
            // Don't crash the bot over a lookup failure
            console.error('[discord/activity] Lookup error:', lookupError.message);
            return NextResponse.json({ success: true, ignored: true });
        }

        // ── Step 2: Ignore unlinked users ─────────────────────────────────────
        if (!linked?.user_id) {
            console.log(
                `[discord/activity] Ignored — Discord user ${discord_user_id} is not linked to any platform account.`
            );
            return NextResponse.json({ success: true, ignored: true });
        }

        const profileId = linked.user_id;

        // ── Step 3a: Insert activity row ──────────────────────────────────────
        const { error: insertError } = await supabase.from('discord_activity').insert({
            user_id: profileId,
            discord_user_id,
            guild_id: guild_id ?? null,
            event_type,
            points,
            created_at: timestamp ?? new Date().toISOString(),
        });

        if (insertError) {
            console.error('[discord/activity] Insert error:', insertError.message);
            // Return 200 to prevent bot retry storm
            return NextResponse.json({ success: false, error: 'DB insert failed' });
        }

        // ── Step 3b: Increment aggregated score via RPC ───────────────────────
        const { error: rpcError } = await supabase.rpc('increment_discord_points', {
            user_id_input: profileId,
            points_input: points,
        });

        if (rpcError) {
            // Activity was already stored; score update failure is recoverable
            console.error('[discord/activity] RPC increment_discord_points error:', rpcError.message);
        }

        console.log(
            `[discord/activity] Stored — profile=${profileId} discord=${discord_user_id} ` +
            `event=${event_type} points=+${points}`
        );

        return NextResponse.json({ success: true, stored: true });

    } catch (err) {
        // Catch-all — never crash the bot
        console.error('[discord/activity] Unexpected error:', err);
        return NextResponse.json({ success: true, ignored: true });
    }
}

// ── GET /api/discord/activity?discord_user_id=xxx ─────────────────────────────
// Returns recent event history for a Discord user (for future OAuth linking page)

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const discordUserId = searchParams.get('discord_user_id');

        if (!discordUserId) {
            return NextResponse.json({ error: 'discord_user_id is required' }, { status: 400 });
        }

        const supabase = await createServiceClient();

        const { data, error } = await supabase
            .from('discord_activity')
            .select('event_type, points, created_at')
            .eq('discord_user_id', discordUserId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[discord/activity] GET error:', error.message);
            return NextResponse.json({ error: 'Query failed' }, { status: 500 });
        }

        const totalPoints = data?.reduce((sum, row) => sum + (row.points ?? 0), 0) ?? 0;

        return NextResponse.json({
            discord_user_id: discordUserId,
            total_points: totalPoints,
            activity: data ?? [],
        });
    } catch (err) {
        console.error('[discord/activity] GET unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
