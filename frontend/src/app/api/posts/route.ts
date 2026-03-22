import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreatePostSchema } from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// GET all posts (with creator profile, unlock status, and like status for current user)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const url = new URL(request.url);
        const creatorId = url.searchParams.get('creator_id');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
        const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

        // Fetch posts without the broken FK hint.
        // posts.creator_id → auth.users(id), NOT profiles — there is no direct FK to profiles.
        let query = supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (creatorId) {
            query = query.eq('creator_id', creatorId);
        }

        const { data: posts, error } = await query;

        if (error) {
            console.error('[posts] GET error:', error);
            return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
        }

        let enrichedPosts = posts || [];

        // Batch-fetch creator profiles by user_id (posts.creator_id === profiles.user_id)
        if (enrichedPosts.length > 0) {
            const creatorIds = [...new Set(enrichedPosts.map(p => p.creator_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, user_id, username, display_name, avatar_url, role')
                .in('user_id', creatorIds);

            const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
            enrichedPosts = enrichedPosts.map(post => ({
                ...post,
                creator: profileMap.get(post.creator_id) ?? null,
            }));
        }

        // Enrich with unlock/like status for the logged-in user
        if (user && enrichedPosts.length > 0) {
            const postIds = enrichedPosts.map(p => p.id);

            const [{ data: unlocks }, { data: likes }] = await Promise.all([
                supabase.from('post_unlocks').select('post_id')
                    .eq('user_id', user.id).in('post_id', postIds),
                supabase.from('post_likes').select('post_id')
                    .eq('user_id', user.id).in('post_id', postIds),
            ]);

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
        console.error('[posts] API error:', error);
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

        // Rate limit
        const rl = checkRateLimit(`post_create:${user.id}`, RATE_LIMITS.api);
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // Verify creator role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profile?.role !== 'creator') {
            return NextResponse.json({ error: 'Only creators can create posts' }, { status: 403 });
        }

        // Validate with Zod
        const body = await request.json();
        const parsed = CreatePostSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = parsed.data;

        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                creator_id: user.id,
                title: data.title,
                content: data.content,
                image_url: data.image_url || null,
                access_type: data.access_type,
                token_cost: data.access_type === 'token_gated' ? data.token_cost : 0,
                threshold_amount: data.access_type === 'threshold_gated' ? data.threshold_amount : 0,
            })
            .select()
            .single();

        if (error) {
            console.error('[posts] Create error:', error);
            return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
        }

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error('[posts] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
