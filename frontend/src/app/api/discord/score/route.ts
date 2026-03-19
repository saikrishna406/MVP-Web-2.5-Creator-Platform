import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/discord/score
 * ----------------------
 * Returns the current Discord engagement score for the logged-in user.
 *
 * Authentication: requires an active Supabase session (cookie-based).
 * The session gives us auth.uid() → we look up the profile → then scores.
 *
 * Response:
 *   { discord_points: number }
 *
 * Returns 0 if the user has no score row yet (not yet active on Discord).
 * Returns 401 if not authenticated.
 */

export async function GET() {
    try {
        // ── Authenticate via session cookie ───────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Resolve auth.users.id → profiles.id ──────────────────────────────
        // user_engagement_scores references profiles(id), not auth.users(id)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            // Profile not found — return 0 score rather than erroring
            return NextResponse.json({ discord_points: 0 });
        }

        // ── Fetch aggregated Discord score ────────────────────────────────────
        // Use service client so the read isn't blocked by per-row RLS
        const serviceClient = await createServiceClient();
        const { data: score, error: scoreError } = await serviceClient
            .from('user_engagement_scores')
            .select('discord_points')
            .eq('user_id', profile.id)
            .maybeSingle();

        if (scoreError) {
            console.error('[discord/score] Score fetch error:', scoreError.message);
            return NextResponse.json({ discord_points: 0 });
        }

        return NextResponse.json({
            discord_points: score?.discord_points ?? 0,
        });

    } catch (err) {
        console.error('[discord/score] Unexpected error:', err);
        return NextResponse.json({ discord_points: 0 });
    }
}
