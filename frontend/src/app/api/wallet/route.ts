import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { UnlockPostSchema } from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSuspiciousActivity, getClientIp } from '@/lib/security';

// GET wallet data
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (walletError) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        const [{ data: tokenTxs }, { data: pointTxs }, { data: packages }] = await Promise.all([
            supabase.from('token_transactions').select('*')
                .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
            supabase.from('point_transactions').select('*')
                .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
            supabase.from('token_packages').select('*')
                .eq('is_active', true).order('price_cents', { ascending: true }),
        ]);

        return NextResponse.json({
            wallet,
            tokenTransactions: tokenTxs || [],
            pointTransactions: pointTxs || [],
            packages: packages || [],
        });
    } catch (error) {
        console.error('[wallet] GET error:', error);
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

        // Rate limit
        const rl = checkRateLimit(`unlock:${user.id}`, RATE_LIMITS.unlock);
        if (!rl.allowed) {
            const svc = await createServiceClient();
            await logSuspiciousActivity(svc, {
                userId: user.id,
                activityType: 'rate_limit_unlock',
                severity: 'medium',
                description: 'Unlock rate limit exceeded',
                ipAddress: getClientIp(request.headers),
                endpoint: '/api/wallet',
            });
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // Validate
        const body = await request.json();
        const parsed = UnlockPostSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { postId } = parsed.data;
        const idempotencyKey = `unlock_${user.id}_${postId}`;

        // Use atomic unlock_post() stored procedure
        const serviceClient = await createServiceClient();
        const { data: result, error } = await serviceClient.rpc('unlock_post', {
            p_user_id: user.id,
            p_post_id: postId,
            p_idempotency_key: idempotencyKey,
        });

        if (error) {
            console.error('[wallet] unlock_post error:', error);

            // Check for maintenance mode
            if (error.message?.includes('maintenance mode')) {
                return NextResponse.json({ error: 'System is in maintenance mode' }, { status: 503 });
            }
            return NextResponse.json({ error: 'Failed to process unlock' }, { status: 500 });
        }

        const row = Array.isArray(result) ? result[0] : result;

        if (!row?.success) {
            return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
        }

        if (row.already_unlocked) {
            return NextResponse.json({ success: true, message: 'Already unlocked', tokensSpent: 0 });
        }

        return NextResponse.json({
            success: true,
            message: 'Content unlocked',
            tokensSpent: row.tokens_spent,
        });
    } catch (error) {
        console.error('[wallet] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
