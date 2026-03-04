import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { logSuspiciousActivity, getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        const body = await request.text();
        const sig = request.headers.get('stripe-signature');

        if (!sig) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Step 1: Verify Stripe signature
        let event;
        try {
            event = getStripe().webhooks.constructEvent(
                body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error('[webhook] Signature verification failed:', err);
            await logSuspiciousActivity(supabase, {
                userId: null,
                activityType: 'invalid_webhook_signature',
                severity: 'high',
                description: 'Stripe webhook received with invalid signature',
                ipAddress: getClientIp(request.headers),
                endpoint: '/api/stripe/webhook',
            });
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Step 2: Idempotency — check stripe_events table
        const { data: existingEvent } = await supabase
            .from('stripe_events')
            .select('id, processed')
            .eq('stripe_event_id', event.id)
            .single();

        if (existingEvent) {
            // Already seen this event — skip silently
            console.log(`[webhook] Duplicate event skipped: ${event.id}`);
            return NextResponse.json({ received: true, duplicate: true });
        }

        // Step 3: Insert event record BEFORE processing (mark as unprocessed)
        const { error: insertError } = await supabase
            .from('stripe_events')
            .insert({
                stripe_event_id: event.id,
                event_type: event.type,
                payload: event.data.object as unknown as Record<string, unknown>,
                processed: false,
                user_id: ((event.data.object as unknown as Record<string, Record<string, string>>)?.metadata?.user_id) || null,
            });

        if (insertError) {
            // If insert fails due to unique constraint, another worker got it
            if (insertError.code === '23505') {
                console.log(`[webhook] Race condition caught, event already being processed: ${event.id}`);
                return NextResponse.json({ received: true, duplicate: true });
            }
            console.error('[webhook] Failed to insert event:', insertError);
            return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
        }

        // Step 4: Process the event
        let processingError: string | null = null;

        try {
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object as unknown as Record<string, unknown>;
                const metadata = session.metadata as Record<string, string> | undefined;
                const userId = metadata?.user_id;
                const tokenAmount = parseInt(metadata?.token_amount || '0');
                const sessionId = session.id as string;

                if (!userId || !tokenAmount) {
                    processingError = 'Missing metadata in checkout session';
                    console.error(`[webhook] ${processingError}`);
                } else {
                    // Call credit_tokens() stored procedure
                    const { error: rpcError } = await supabase.rpc('credit_tokens', {
                        p_user_id: userId,
                        p_amount: tokenAmount,
                        p_type: 'purchase',
                        p_description: `Token purchase via Stripe (${tokenAmount} tokens)`,
                        p_stripe_session_id: sessionId,
                        p_idempotency_key: `stripe_${event.id}`,
                    });

                    if (rpcError) {
                        processingError = rpcError.message;
                        console.error('[webhook] credit_tokens failed:', rpcError);
                    } else {
                        console.log(`[webhook] Credited ${tokenAmount} tokens to user ${userId}`);
                    }
                }
            }
            // Add handlers for other event types as needed
        } catch (err) {
            processingError = err instanceof Error ? err.message : 'Unknown error';
            console.error('[webhook] Processing error:', err);
        }

        // Step 5: Mark event as processed
        await supabase
            .from('stripe_events')
            .update({
                processed: processingError === null,
                processing_error: processingError,
                processed_at: new Date().toISOString(),
            })
            .eq('stripe_event_id', event.id);

        if (processingError) {
            return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[webhook] Unhandled error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
