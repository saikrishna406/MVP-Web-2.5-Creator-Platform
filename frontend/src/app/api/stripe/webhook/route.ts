import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const sig = request.headers.get('stripe-signature');

        if (!sig) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        let event;
        try {
            event = getStripe().webhooks.constructEvent(
                body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Use service role client for admin operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata?.user_id;
            const tokenAmount = parseInt(session.metadata?.token_amount || '0');
            const sessionId = session.id;

            if (!userId || !tokenAmount) {
                console.error('Missing metadata in checkout session');
                return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
            }

            // Check for duplicate processing
            const { data: existingTx } = await supabase
                .from('token_transactions')
                .select('id')
                .eq('stripe_session_id', sessionId)
                .single();

            if (existingTx) {
                console.log('Transaction already processed:', sessionId);
                return NextResponse.json({ received: true });
            }

            // Use the atomic database function
            const { error } = await supabase.rpc('handle_token_purchase', {
                p_user_id: userId,
                p_amount: tokenAmount,
                p_stripe_session_id: sessionId,
            });

            if (error) {
                console.error('Error processing token purchase:', error);
                return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
            }

            console.log(`Credited ${tokenAmount} tokens to user ${userId}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
