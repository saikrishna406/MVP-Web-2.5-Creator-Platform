import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { POINT_ACTIONS } from '@/lib/constants';
import { CommentSchema } from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// GET - get comments for a post
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const url = new URL(request.url);
        const postId = url.searchParams.get('post_id');

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        // Fetch comments without FK join hint (post_comments.user_id → auth.users, NOT profiles)
        const { data: comments, error } = await supabase
            .from('post_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Comments fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
        }

        // Batch-fetch profiles by user_id (same pattern as the posts API)
        let enrichedComments = comments || [];
        if (enrichedComments.length > 0) {
            const userIds = [...new Set(enrichedComments.map(c => c.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, user_id, username, display_name, avatar_url')
                .in('user_id', userIds);

            const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
            enrichedComments = enrichedComments.map(comment => ({
                ...comment,
                profile: profileMap.get(comment.user_id) ?? null,
            }));
        }

        return NextResponse.json({ comments: enrichedComments });
    } catch (error) {
        console.error('Comments GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - add a comment
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit
        const rl = checkRateLimit(`comment:${user.id}`, RATE_LIMITS.comment);
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // Validate with Zod
        const body = await request.json();
        const parsed = CommentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { postId, content } = parsed.data;

        // Insert comment without FK join hint (post_comments.user_id → auth.users, NOT profiles)
        const { data: comment, error } = await supabase
            .from('post_comments')
            .insert({
                user_id: user.id,
                post_id: postId,
                content: content.trim(),
            })
            .select('*')
            .single();

        if (error) {
            console.error('Comment insert error:', error);
            return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
        }

        // Fetch the commenter's profile separately
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, user_id, username, display_name, avatar_url')
            .eq('user_id', user.id)
            .single();

        const enrichedComment = { ...comment, profile: profile ?? null };

        // Update comment count
        // TODO: Replace with atomic SQL increment RPC to prevent race conditions
        try {
            const serviceClient = await createServiceClient();
            const { data: post, error: postFetchError } = await serviceClient
                .from('posts')
                .select('comments_count')
                .eq('id', postId)
                .single();

            if (postFetchError) {
                console.warn('[comments] Failed to fetch post for count update:', postFetchError.message);
            } else if (post) {
                const { error: updateError } = await serviceClient
                    .from('posts')
                    .update({ comments_count: (post.comments_count || 0) + 1 })
                    .eq('id', postId);

                if (updateError) {
                    console.warn('[comments] Failed to update comments_count:', updateError.message);
                }
            }
        } catch (err) {
            console.warn('[comments] Service client error during count update:', err);
        }

        // Award points for commenting (uses reward_action RPC with daily cap)
        const commentAction = POINT_ACTIONS['comment_post'];
        try {
            const serviceClient = await createServiceClient();
            await serviceClient.rpc('reward_action', {
                p_user_id: user.id,
                p_action: 'comment_post',
                p_points: commentAction.points,
                p_daily_limit: commentAction.daily_limit,
                p_description: commentAction.description,
                p_reference_id: postId,
                p_cooldown_minutes: 0,
            });
        } catch (err) {
            // Points are bonus — don't fail the comment, but log so we can debug
            console.warn('[comments] reward_action RPC failed (points not awarded):', err);
        }

        return NextResponse.json({ comment: enrichedComment, pointsEarned: commentAction.points }, { status: 201 });
    } catch (error) {
        console.error('Comments POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
