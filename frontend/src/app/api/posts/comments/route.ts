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

        const { data: comments, error } = await supabase
            .from('post_comments')
            .select(`
        *,
        profile:profiles!post_comments_user_id_fkey(
          id, username, display_name, avatar_url
        )
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Comments fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
        }

        return NextResponse.json({ comments: comments || [] });
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

        // Insert comment
        const { data: comment, error } = await supabase
            .from('post_comments')
            .insert({
                user_id: user.id,
                post_id: postId,
                content: content.trim(),
            })
            .select(`
        *,
        profile:profiles!post_comments_user_id_fkey(
          id, username, display_name, avatar_url
        )
      `)
            .single();

        if (error) {
            console.error('Comment insert error:', error);
            return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
        }

        // Update comment count
        // TODO: Replace with atomic SQL increment RPC to prevent race conditions
        const serviceClient = await createServiceClient();
        const { data: post } = await serviceClient
            .from('posts')
            .select('comments_count')
            .eq('id', postId)
            .single();

        if (post) {
            await serviceClient
                .from('posts')
                .update({ comments_count: (post.comments_count || 0) + 1 })
                .eq('id', postId);
        }

        // Award points for commenting (uses reward_action RPC with daily cap)
        const commentAction = POINT_ACTIONS['comment_post'];
        try {
            await serviceClient.rpc('reward_action', {
                p_user_id: user.id,
                p_action: 'comment_post',
                p_points: commentAction.points,
                p_daily_limit: commentAction.daily_limit,
                p_description: commentAction.description,
                p_reference_id: postId,
                p_cooldown_minutes: 0,
            });
        } catch {
            // Points are bonus — don't fail the comment
        }

        return NextResponse.json({ comment, pointsEarned: commentAction.points }, { status: 201 });
    } catch (error) {
        console.error('Comments POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
