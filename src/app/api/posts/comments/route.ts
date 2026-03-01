import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { POINT_ACTIONS } from '@/lib/constants';

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

        const { postId, content } = await request.json();

        if (!postId || !content || !content.trim()) {
            return NextResponse.json({ error: 'Post ID and content required' }, { status: 400 });
        }

        if (content.length > 1000) {
            return NextResponse.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 });
        }

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

        // Award points for commenting
        const commentAction = POINT_ACTIONS['comment_post'];
        await serviceClient.rpc('award_points', {
            p_user_id: user.id,
            p_action: 'comment_post',
            p_points: commentAction.points,
            p_daily_limit: commentAction.daily_limit,
            p_description: commentAction.description,
            p_reference_id: postId,
        });

        return NextResponse.json({ comment, pointsEarned: commentAction.points }, { status: 201 });
    } catch (error) {
        console.error('Comments POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
