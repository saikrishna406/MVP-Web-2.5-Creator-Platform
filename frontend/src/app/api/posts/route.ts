import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all posts (with unlock status for current user)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const url = new URL(request.url);
        const creatorId = url.searchParams.get('creator_id');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        let query = supabase
            .from('posts')
            .select(`
        *,
        creator:profiles!posts_creator_id_fkey(
          id, user_id, username, display_name, avatar_url, role
        )
      `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (creatorId) {
            query = query.eq('creator_id', creatorId);
        }

        const { data: posts, error } = await query;

        if (error) {
            console.error('Posts fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
        }

        // If user is logged in, check unlock status and like status
        let enrichedPosts = posts || [];
        if (user && enrichedPosts.length > 0) {
            const postIds = enrichedPosts.map(p => p.id);

            const { data: unlocks } = await supabase
                .from('post_unlocks')
                .select('post_id')
                .eq('user_id', user.id)
                .in('post_id', postIds);

            const { data: likes } = await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', user.id)
                .in('post_id', postIds);

            const unlockedIds = new Set(unlocks?.map(u => u.post_id) || []);
            const likedIds = new Set(likes?.map(l => l.post_id) || []);

            enrichedPosts = enrichedPosts.map(post => ({
                ...post,
                is_unlocked: unlockedIds.has(post.id) || post.creator_id === user.id,
                is_liked: likedIds.has(post.id),
            }));
        }

        return NextResponse.json({ posts: enrichedPosts });
    } catch (error) {
        console.error('Posts API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - create a new post (creator only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profile?.role !== 'creator') {
            return NextResponse.json({ error: 'Only creators can create posts' }, { status: 403 });
        }

        const body = await request.json();
        const { title, content, access_type, token_cost, threshold_amount, image_url } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
        }

        const validTypes = ['public', 'token_gated', 'threshold_gated'];
        if (!validTypes.includes(access_type)) {
            return NextResponse.json({ error: 'Invalid access type' }, { status: 400 });
        }

        if (access_type === 'token_gated' && (!token_cost || token_cost <= 0)) {
            return NextResponse.json({ error: 'Token cost required for gated posts' }, { status: 400 });
        }

        if (access_type === 'threshold_gated' && (!threshold_amount || threshold_amount <= 0)) {
            return NextResponse.json({ error: 'Threshold amount required' }, { status: 400 });
        }

        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                creator_id: user.id,
                title,
                content,
                image_url: image_url || null,
                access_type,
                token_cost: access_type === 'token_gated' ? token_cost : 0,
                threshold_amount: access_type === 'threshold_gated' ? threshold_amount : 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Post creation error:', error);
            return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
        }

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error('Posts POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
