import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/creator/leaderboard?creator_id=XXX
 * 
 * Returns the top 50 fans for a given creator,
 * ranked by total_points from creator_points_agg.
 * 
 * If no creator_id is provided, uses the authenticated creator's own ID.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = await createServiceClient();

    const { searchParams } = new URL(request.url);
    let creatorId = searchParams.get('creator_id');

    // If no creator_id param, try to use the logged-in user's ID
    if (!creatorId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized — provide creator_id or log in' }, { status: 401 });
      }
      creatorId = user.id;
    }

    // Query creator_points_agg joined with profiles
    const { data, error } = await serviceClient
      .from('creator_points_agg')
      .select(`
        total_points,
        message_count,
        user_id,
        profiles!inner (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('creator_id', creatorId)
      .order('total_points', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[leaderboard] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Format response
    const leaderboard = (data || []).map((row: Record<string, unknown>, index: number) => {
      const profile = row.profiles as Record<string, unknown> | null;
      return {
        rank: index + 1,
        username: profile?.username || 'unknown',
        display_name: profile?.display_name || profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        total_points: row.total_points,
        message_count: row.message_count,
      };
    });

    return NextResponse.json({
      creator_id: creatorId,
      total: leaderboard.length,
      leaderboard,
    });

  } catch (error) {
    console.error('[leaderboard] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
