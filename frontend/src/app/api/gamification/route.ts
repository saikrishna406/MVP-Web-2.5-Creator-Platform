import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { POINT_ACTIONS } from '@/lib/constants';
import { GamificationActionSchema } from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSuspiciousActivity, getClientIp } from '@/lib/security';

// POST - perform a gamification action
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit
        const rl = checkRateLimit(`reward:${user.id}`, RATE_LIMITS.reward);
        if (!rl.allowed) {
            const svc = await createServiceClient();
            await logSuspiciousActivity(svc, {
                userId: user.id,
                activityType: 'rate_limit_gamification',
                severity: 'high',
                description: 'Gamification rate limit exceeded — possible bot',
                ipAddress: getClientIp(request.headers),
                endpoint: '/api/gamification',
            });
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // Validate
        const body = await request.json();
        const parsed = GamificationActionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { action, referenceId } = parsed.data;
        const actionConfig = POINT_ACTIONS[action];

        if (!actionConfig) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Use reward_action() stored procedure (has daily cap + cooldown + account age)
        const serviceClient = await createServiceClient();
        const { data: result, error } = await serviceClient.rpc('reward_action', {
            p_user_id: user.id,
            p_action: action,
            p_points: actionConfig.points,
            p_daily_limit: actionConfig.daily_limit,
            p_description: actionConfig.description,
            p_reference_id: referenceId || null,
            p_cooldown_minutes: 0,
        });

        if (error) {
            if (error.message?.includes('maintenance mode')) {
                return NextResponse.json({ error: 'System is in maintenance mode' }, { status: 503 });
            }
            console.error('[gamification] error:', error);
            return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
        }

        const row = Array.isArray(result) ? result[0] : result;

        if (!row?.success) {
            return NextResponse.json({
                error: 'Daily limit reached for this action',
                dailyLimitReached: true,
            }, { status: 429 });
        }

        return NextResponse.json({
            success: true,
            pointsEarned: row.points_earned,
            dailyRemaining: row.daily_remaining,
            message: `+${row.points_earned} points for ${actionConfig.description}`,
        });
    } catch (error) {
        console.error('[gamification] API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET - daily reward status
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date().toISOString().split('T')[0];

        const { data: todayRewards } = await supabase
            .from('daily_rewards')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today);

        const status = Object.entries(POINT_ACTIONS).map(([key, config]) => {
            const count = todayRewards?.filter(r => r.action === key).length || 0;
            return {
                ...config,
                action: key,
                todayCount: count,
                remaining: Math.max(0, config.daily_limit - count),
                completed: count >= config.daily_limit,
            };
        });

        const totalPointsToday = todayRewards?.reduce((sum, r) => sum + r.points_earned, 0) || 0;

        return NextResponse.json({ status, totalPointsToday });
    } catch (error) {
        console.error('[gamification] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
