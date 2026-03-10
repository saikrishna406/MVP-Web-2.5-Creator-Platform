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
}
