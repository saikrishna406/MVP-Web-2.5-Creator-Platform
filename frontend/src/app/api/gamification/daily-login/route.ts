import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { POINT_ACTIONS } from '@/lib/constants';

// POST - claim daily login reward
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const loginAction = POINT_ACTIONS['daily_login'];
        const serviceClient = await createServiceClient();

        const { data: result, error } = await serviceClient.rpc('award_points', {
            p_user_id: user.id,
            p_action: 'daily_login',
            p_points: loginAction.points,
            p_daily_limit: loginAction.daily_limit,
            p_description: loginAction.description,
            p_reference_id: null,
        });

        if (error) {
            console.error('Daily login error:', error);
            return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
        }

        if (!result) {
            return NextResponse.json({
                claimed: false,
                message: 'Already claimed today'
            });
        }

        return NextResponse.json({
            claimed: true,
            pointsEarned: loginAction.points,
            message: `+${loginAction.points} daily login bonus!`
        });
    } catch (error) {
        console.error('Daily login API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
