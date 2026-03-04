import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { POINT_ACTIONS } from '@/lib/constants';
import { InteractPostSchema } from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// POST - like/unlike a post
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate
        const body = await request.json();
        const parsed = InteractPostSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { postId, action } = parsed.data;

        // Rate limit
        const rl = checkRateLimit(`interact:${user.id}`, RATE_LIMITS.api);
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        if (action === 'like') {
            const serviceClient = await createServiceClient();

            // Check if already liked (UNIQUE constraint also protects this)
            const { data: existing } = await supabase
                .from('post_likes')
                .select('id')
                .eq('user_id', user.id)
                .eq('post_id', postId)
                .single();

            if (existing) {
                // Unlike
                await supabase
                    .from('post_likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('post_id', postId);

                // Decrement count
                const { data: unlikePost } = await serviceClient
                    .from('posts')
                    .select('likes_count')
                    .eq('id', postId)
                    .single();

                if (unlikePost) {
                    await serviceClient
                        .from('posts')
                        .update({ likes_count: Math.max(0, (unlikePost.likes_count || 1) - 1) })
                        .eq('id', postId);
                }

                return NextResponse.json({ liked: false });
            } else {
                // Like — UNIQUE(user_id, post_id) prevents duplicate likes (Step 5.2)
                const { error: likeError } = await supabase
                    .from('post_likes')
                    .insert({ user_id: user.id, post_id: postId });

                if (likeError) {
                    if (likeError.code === '23505') {
                        // Unique violation — already liked (race condition caught)
                        return NextResponse.json({ liked: true, message: 'Already liked' });
                    }
                    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
                }

                // Increment count
                const { data: post } = await serviceClient
                    .from('posts')
                    .select('likes_count')
                    .eq('id', postId)
                    .single();

                if (post) {
                    await serviceClient
                        .from('posts')
                        .update({ likes_count: (post.likes_count || 0) + 1 })
                        .eq('id', postId);
                }

                // Award points (uses reward_action with daily cap)
                const likeAction = POINT_ACTIONS['like_post'];
                try {
                    await serviceClient.rpc('reward_action', {
                        p_user_id: user.id,
                        p_action: 'like_post',
                        p_points: likeAction.points,
                        p_daily_limit: likeAction.daily_limit,
                        p_description: likeAction.description,
                        p_reference_id: postId,
                        p_cooldown_minutes: 0,
                    });
                } catch {
                    // Points are bonus — don't fail the like
                }

                return NextResponse.json({ liked: true, pointsEarned: likeAction.points });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('[interact] API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
