import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET wallet data
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get wallet
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (walletError) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // Get recent token transactions
        const { data: tokenTxs } = await supabase
            .from('token_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        // Get recent point transactions
        const { data: pointTxs } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        // Get token packages
        const { data: packages } = await supabase
            .from('token_packages')
            .select('*')
            .eq('is_active', true)
            .order('price_cents', { ascending: true });

        return NextResponse.json({
            wallet,
            tokenTransactions: tokenTxs || [],
            pointTransactions: pointTxs || [],
            packages: packages || [],
        });
    } catch (error) {
        console.error('Wallet API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - unlock a post with tokens
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId } = await request.json();

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        // Get the post to check cost
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.access_type === 'public') {
            return NextResponse.json({ error: 'Post is already public' }, { status: 400 });
        }

        // Check if already unlocked
        const { data: existingUnlock } = await supabase
            .from('post_unlocks')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .single();

        if (existingUnlock) {
            return NextResponse.json({ error: 'Already unlocked' }, { status: 400 });
        }

        let tokenCost = 0;

        if (post.access_type === 'token_gated') {
            tokenCost = post.token_cost || 0;
        } else if (post.access_type === 'threshold_gated') {
            // For threshold gated, check if user meets threshold
            const { data: wallet } = await supabase
                .from('wallets')
                .select('token_balance')
                .eq('user_id', user.id)
                .single();

            if (!wallet || wallet.token_balance < (post.threshold_amount || 0)) {
                return NextResponse.json({
                    error: `You need at least ${post.threshold_amount} tokens to access this content`
                }, { status: 403 });
            }

            // Threshold gated doesn't cost tokens, just requires holding them
            // Create unlock record without spending
            const serviceClient = await createServiceClient();
            await serviceClient
                .from('post_unlocks')
                .insert({ user_id: user.id, post_id: postId, tokens_spent: 0 });

            return NextResponse.json({ success: true, message: 'Content unlocked' });
        }

        // For token_gated, use the atomic function
        const serviceClient = await createServiceClient();
        const { data: result, error } = await serviceClient.rpc('handle_token_spend', {
            p_user_id: user.id,
            p_post_id: postId,
            p_amount: tokenCost,
        });

        if (error) {
            console.error('Token spend error:', error);
            return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
        }

        if (!result) {
            return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Content unlocked', tokensSpent: tokenCost });
    } catch (error) {
        console.error('Wallet POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
