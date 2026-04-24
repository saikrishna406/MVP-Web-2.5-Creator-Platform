import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/creator/top-fans
 * Returns the top fans for the authenticated creator,
 * ranked by engagement event count from engagement_logs.
 *
 * Query params:
 *   ?limit=10  (default 10, max 50)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify creator role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'creator') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse limit
        const url = new URL(request.url);
        const limitParam = parseInt(url.searchParams.get('limit') || '10', 10);
        const limit = Math.min(Math.max(limitParam, 1), 50);

        // Query engagement_logs grouped by external_user_id for this creator.
        // We count events as the "score" and join with user_identities
        // to find linked platform users, then join profiles for display names.
        //
        // Using a raw RPC or manual aggregation since Supabase JS
        // doesn't support GROUP BY natively.

        // Step 1: Get all engagement logs for this creator
        const { data: logs, error: logsError } = await supabase
            .from('engagement_logs')
            .select('external_user_id, user_id, action_type')
            .eq('creator_id', user.id);

        if (logsError) {
            console.error('[top-fans] Logs query error:', logsError.message);
            return NextResponse.json({ error: 'Failed to fetch engagement data' }, { status: 500 });
        }

        if (!logs || logs.length === 0) {
            return NextResponse.json({ fans: [], total: 0 });
        }

        // Step 2: Aggregate by external_user_id
        const fanMap: Record<string, {
            external_user_id: string;
            user_id: string | null;
            message_count: number;
            total_events: number;
        }> = {};

        for (const log of logs) {
            const key = log.external_user_id;
            if (!fanMap[key]) {
                fanMap[key] = {
                    external_user_id: key,
                    user_id: log.user_id,
                    message_count: 0,
                    total_events: 0,
                };
            }
            fanMap[key].total_events++;
            if (log.action_type === 'message') {
                fanMap[key].message_count++;
            }
            // Prefer a non-null user_id if we find one
            if (log.user_id && !fanMap[key].user_id) {
                fanMap[key].user_id = log.user_id;
            }
        }

        // Step 3: Sort by total_events descending and limit
        const sortedFans = Object.values(fanMap)
            .sort((a, b) => b.total_events - a.total_events)
            .slice(0, limit);

        // Step 4: Fetch profile info for linked users
        const linkedUserIds = sortedFans
            .map(f => f.user_id)
            .filter((id): id is string => id !== null);

        let profileMap: Record<string, { display_name: string; username: string; avatar_url: string | null }> = {};

        if (linkedUserIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, display_name, username, avatar_url')
                .in('user_id', linkedUserIds);

            if (profiles) {
                for (const p of profiles) {
                    profileMap[p.user_id] = {
                        display_name: p.display_name,
                        username: p.username,
                        avatar_url: p.avatar_url,
                    };
                }
            }
        }

        // Step 5: Also try to fetch Discord usernames from user_identities
        const externalIds = sortedFans.map(f => f.external_user_id);
        let identityMap: Record<string, string> = {};

        if (externalIds.length > 0) {
            const { data: identities } = await supabase
                .from('user_identities')
                .select('external_user_id, external_username')
                .eq('platform', 'discord')
                .in('external_user_id', externalIds);

            if (identities) {
                for (const i of identities) {
                    if (i.external_username) {
                        identityMap[i.external_user_id] = i.external_username;
                    }
                }
            }
        }

        // Step 6: Build response
        const fans = sortedFans.map((fan, index) => {
            const profile = fan.user_id ? profileMap[fan.user_id] : null;
            const discordUsername = identityMap[fan.external_user_id];

            return {
                rank: index + 1,
                external_user_id: fan.external_user_id,
                user_id: fan.user_id,
                display_name: profile?.display_name || discordUsername || `Discord User`,
                username: profile?.username || discordUsername || fan.external_user_id.slice(0, 8),
                avatar_url: profile?.avatar_url || null,
                is_linked: fan.user_id !== null,
                message_count: fan.message_count,
                total_events: fan.total_events,
                score: fan.total_events, // alias for leaderboard
            };
        });

        return NextResponse.json({
            fans,
            total: Object.keys(fanMap).length,
        });
    } catch (error) {
        console.error('[top-fans] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
