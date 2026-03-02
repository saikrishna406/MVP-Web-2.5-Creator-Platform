import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { POINT_ACTIONS } from '@/lib/constants';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSuspiciousActivity, getClientIp } from '@/lib/security';

// POST - claim daily login reward
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit login rewards
        const rl = checkRateLimit(`daily_login:${user.id}`, RATE_LIMITS.login);
        if (!rl.allowed) {
            const svc = await createServiceClient();
            await logSuspiciousActivity(svc, {
                userId: user.id,
                activityType: 'rate_limit_daily_login',
                severity: 'medium',
                description: 'Daily login claim rate limit exceeded',
                ipAddress: getClientIp(request.headers),
                endpoint: '/api/gamification/daily-login',
            });
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const loginAction = POINT_ACTIONS['daily_login'];
        const serviceClient = await createServiceClient();

        const { data: result, error } = await serviceClient.rpc('reward_action', {
            p_user_id: user.id,
            p_action: 'daily_login',
            p_points: loginAction.points,
            p_daily_limit: loginAction.daily_limit,
            p_description: loginAction.description,
            p_reference_id: null,
            p_cooldown_minutes: 0,
        });

        if (error) {
            if (error.message?.includes('maintenance mode')) {
                return NextResponse.json({ error: 'System is in maintenance mode' }, { status: 503 });
            }
            console.error('[daily-login] error:', error);
            return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
        }

        const row = Array.isArray(result) ? result[0] : result;

        if (!row?.success) {
            return NextResponse.json({ claimed: false, message: 'Already claimed today' });
        }

        return NextResponse.json({
            claimed: true,
            pointsEarned: row.points_earned,
            message: `+${row.points_earned} daily login bonus!`,
        });
    } catch (error) {
        console.error('[daily-login] API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
