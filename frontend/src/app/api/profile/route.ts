<<<<<<< HEAD
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: fetch current user's profile + stats
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get stats
    const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('creator_id', user.id);

    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // Get total likes across all posts
    const { data: allPosts } = await supabase
        .from('posts')
        .select('likes_count, comments_count')
        .eq('creator_id', user.id);

    const totalLikes = allPosts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
    const totalComments = allPosts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;

    // Get unique fans (from post unlocks)
    const postIds = posts?.map(p => p.id) || [];
    let uniqueFans = 0;
    if (postIds.length > 0) {
        const { data: unlocks } = await supabase
            .from('post_unlocks')
            .select('user_id')
            .in('post_id', postIds);
        uniqueFans = new Set(unlocks?.map(u => u.user_id) || []).size;
    }

    return NextResponse.json({
        profile,
        stats: {
            totalPosts: posts?.length || 0,
            totalLikes,
            totalComments,
            uniqueFans,
            tokenBalance: wallet?.token_balance || 0,
            pointsBalance: wallet?.points_balance || 0,
        },
    });
}

// PUT: update profile (bio, avatar_url, display_name)
export async function PUT(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { display_name, bio, avatar_url } = body;

    // Validate
    if (display_name !== undefined && (typeof display_name !== 'string' || display_name.trim().length < 1)) {
        return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }
    if (bio !== undefined && typeof bio !== 'string') {
        return NextResponse.json({ error: 'Bio must be a string' }, { status: 400 });
    }
    if (avatar_url !== undefined && avatar_url !== null && typeof avatar_url !== 'string') {
        return NextResponse.json({ error: 'Avatar URL must be a string' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) updates.display_name = display_name.trim();
    if (bio !== undefined) updates.bio = bio.trim() || null;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url?.trim() || null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });
=======
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch profile by user_id or username
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const url = new URL(request.url);
        const userId = url.searchParams.get('user_id');
        const username = url.searchParams.get('username');

        let query = supabase.from('profiles').select('*');

        if (userId) {
            query = query.eq('user_id', userId);
        } else if (username) {
            query = query.eq('username', username);
        } else {
            // Return current user's profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            query = query.eq('user_id', user.id);
        }

        const { data: profile, error } = await query.single();
        if (error || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get post count
        const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', profile.user_id);

        // Get fan count (unique users who unlocked this creator's posts)
        const { data: creatorPosts } = await supabase
            .from('posts')
            .select('id')
            .eq('creator_id', profile.user_id);

        let fanCount = 0;
        if (creatorPosts && creatorPosts.length > 0) {
            const postIds = creatorPosts.map(p => p.id);
            const { data: unlocks } = await supabase
                .from('post_unlocks')
                .select('user_id')
                .in('post_id', postIds);
            fanCount = new Set(unlocks?.map(u => u.user_id) || []).size;
        }

        return NextResponse.json({
            profile,
            stats: {
                post_count: postCount || 0,
                fan_count: fanCount,
            },
        });
    } catch (error) {
        console.error('[profile] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update profile
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { display_name, bio, avatar_url, banner_url, category, social_links } = body;

        // Validation
        if (display_name && (display_name.length < 1 || display_name.length > 100)) {
            return NextResponse.json({ error: 'Display name must be 1-100 characters' }, { status: 400 });
        }
        if (bio && bio.length > 250) {
            return NextResponse.json({ error: 'Bio must be 250 characters or less' }, { status: 400 });
        }

        const updates: Record<string, unknown> = {};
        if (display_name !== undefined) updates.display_name = display_name;
        if (bio !== undefined) updates.bio = bio;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;
        if (banner_url !== undefined) updates.banner_url = banner_url;
        if (category !== undefined) updates.category = category;
        if (social_links !== undefined) updates.social_links = social_links;

        const { data: profile, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('[profile] Update error:', error);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return NextResponse.json({ profile });
    } catch (error) {
        console.error('[profile] PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
>>>>>>> hasif_branch
}
