import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate input
        if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.length > 200) {
            return NextResponse.json({ error: 'Title is required (max 200 characters)' }, { status: 400 });
        }
        if (!body.content || typeof body.content !== 'string' || body.content.trim().length < 1 || body.content.length > 50000) {
            return NextResponse.json({ error: 'Content is required (max 50000 characters)' }, { status: 400 });
        }
        const validAccessTypes = ['public', 'token_gated', 'threshold_gated', 'subscriber_only'];
        if (body.access_type && !validAccessTypes.includes(body.access_type)) {
            return NextResponse.json({ error: 'Invalid access type' }, { status: 400 });
        }
        if (body.token_cost !== undefined && (typeof body.token_cost !== 'number' || body.token_cost < 0)) {
            return NextResponse.json({ error: 'Token cost must be a non-negative number' }, { status: 400 });
        }
        if (body.threshold_amount !== undefined && (typeof body.threshold_amount !== 'number' || body.threshold_amount < 0)) {
            return NextResponse.json({ error: 'Threshold amount must be a non-negative number' }, { status: 400 });
        }

        // Ensure user is the creator of the post
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('creator_id')
            .eq('id', id)
            .single();

        if (fetchError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.creator_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: updatedPost, error: updateError } = await supabase
            .from('posts')
            .update({
                title: body.title.trim(),
                content: body.content.trim(),
                image_url: body.image_url || null,
                access_type: body.access_type,
                token_cost: body.access_type === 'token_gated' ? body.token_cost : 0,
                threshold_amount: body.access_type === 'threshold_gated' ? body.threshold_amount : 0,
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
        }

        return NextResponse.json({ post: updatedPost }, { status: 200 });
    } catch (error) {
        console.error('[posts][id] PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user is the creator of the post
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('creator_id')
            .eq('id', id)
            .single();

        if (fetchError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.creator_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('[posts][id] DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
