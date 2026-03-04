import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cron job: Daily analytics refresh
// Refreshes materialized views for dashboards
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        const { error } = await supabase.rpc('refresh_analytics_views');

        if (error) {
            console.error('[analytics-refresh] RPC error:', error);
            return NextResponse.json({ error: 'Analytics refresh failed' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Analytics views refreshed successfully',
        });
    } catch (error) {
        console.error('[analytics-refresh] Error:', error);
        return NextResponse.json({ error: 'Analytics refresh failed' }, { status: 500 });
    }
}
