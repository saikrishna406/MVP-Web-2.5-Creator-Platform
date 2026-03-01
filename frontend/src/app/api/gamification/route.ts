import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { POINT_ACTIONS } from '@/lib/constants';

// POST - perform a gamification action
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, referenceId } = await request.json();

        if (!action) {
            return NextResponse.json({ error: 'Action required' }, { status: 400 });
        }

        const actionConfig = POINT_ACTIONS[action];
        if (!actionConfig) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Use service client for atomic operation
        const serviceClient = await createServiceClient();

        const { data: result, error } = await serviceClient.rpc('award_points', {
            p_user_id: user.id,
            p_action: action,
            p_points: actionConfig.points,
            p_daily_limit: actionConfig.daily_limit,
            p_description: actionConfig.description,
            p_reference_id: referenceId || null,
        });

        if (error) {
            console.error('Gamification error:', error);
            return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
        }

        if (!result) {
            return NextResponse.json({
                error: 'Daily limit reached for this action',
                dailyLimitReached: true
            }, { status: 429 });
        }

        return NextResponse.json({
            success: true,
            pointsEarned: actionConfig.points,
            message: `+${actionConfig.points} points for ${actionConfig.description}`
        });
    } catch (error) {
        console.error('Gamification API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET - get daily reward status
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

        // Build status for each action
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
        console.error('Gamification GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
