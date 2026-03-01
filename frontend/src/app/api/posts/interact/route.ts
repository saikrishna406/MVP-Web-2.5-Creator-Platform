import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { POINT_ACTIONS } from '@/lib/constants';

// POST - like/unlike a post
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId, action } = await request.json();

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        if (action === 'like') {
            const serviceClient = await createServiceClient();

            // Check if already liked
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
                const { data: post } = await serviceClient
                    .from('posts')
                    .select('likes_count')
                    .eq('id', postId)
                    .single();

                if (post) {
                    await serviceClient
                        .from('posts')
                        .update({ likes_count: Math.max(0, (post.likes_count || 1) - 1) })
                        .eq('id', postId);
                }

                return NextResponse.json({ liked: false });
            } else {
                // Like
                await supabase
                    .from('post_likes')
                    .insert({ user_id: user.id, post_id: postId });

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

                // Award points for liking
                const likeAction = POINT_ACTIONS['like_post'];
                await serviceClient.rpc('award_points', {
                    p_user_id: user.id,
                    p_action: 'like_post',
                    p_points: likeAction.points,
                    p_daily_limit: likeAction.daily_limit,
                    p_description: likeAction.description,
                    p_reference_id: postId,
                });

                return NextResponse.json({ liked: true, pointsEarned: likeAction.points });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Interact API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
