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
                const sessionId = session.id as string;
                const paymentIntentId = session.payment_intent as string | null;
                const stripeSubId = session.subscription as string | null;
                const stripeCustomerId = session.customer as string | null;
                const eventType = metadata?.type;

                if (!userId) {
                    processingError = 'Missing user_id in checkout metadata';
                    console.error(`[webhook] ${processingError}`);
                // ─── Phase 1: Token Package Purchase ───
                } else if (!eventType || eventType === 'token_package') {
                    const tokenAmount = parseInt(metadata?.token_amount || '0');
                    if (!tokenAmount) {
                        processingError = 'Missing token_amount in checkout metadata';
                    } else {
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
                // ─── Phase 2: Membership Subscription ───
                } else if (eventType === 'membership') {
                    const tierId = metadata?.tier_id;
                    const creatorId = metadata?.creator_id;
                    if (!tierId || !creatorId || !stripeSubId) {
                        processingError = 'Missing tier_id/creator_id/subscription in membership metadata';
                    } else {
                        // Resolve subscription period end from Stripe
                        let periodEnd = new Date();
                        periodEnd.setMonth(periodEnd.getMonth() + 1);
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const stripeSub = await getStripe().subscriptions.retrieve(stripeSubId) as any;
                            if (typeof stripeSub.current_period_end === 'number') {
                                periodEnd = new Date(stripeSub.current_period_end * 1000);
                            }
                        } catch { /* use fallback */ }

                        const { error: rpcError } = await supabase.rpc('rpc_activate_subscription', {
                            p_fan_id: userId,
                            p_creator_id: creatorId,
                            p_tier_id: tierId,
                            p_stripe_sub: stripeSubId,
                            p_stripe_cust: stripeCustomerId || '',
                            p_period_end: periodEnd.toISOString(),
                        });
                        if (rpcError) {
                            processingError = rpcError.message;
                            console.error('[webhook] rpc_activate_subscription failed:', rpcError);
                        } else {
                            console.log(`[webhook] Membership activated: fan=${userId} tier=${tierId}`);
                        }
                    }
                // ─── Phase 2: Event Ticket ───
                } else if (eventType === 'event_ticket') {
                    const eventId = metadata?.event_id;
                    if (!eventId) {
                        processingError = 'Missing event_id in ticket metadata';
                    } else {
                        const { error: rpcError } = await supabase.rpc('rpc_allocate_event_ticket', {
                            p_fan_id: userId,
                            p_event_id: eventId,
                            p_payment_intent: paymentIntentId || sessionId,
                        });
                        if (rpcError) {
                            processingError = rpcError.message;
                            console.error('[webhook] rpc_allocate_event_ticket failed:', rpcError);
                        } else {
                            console.log(`[webhook] Event ticket allocated: fan=${userId} event=${eventId}`);
                        }
                    }
                // ─── Phase 2: Founder Pass ───
                } else if (eventType === 'founder_pass') {
                    const passId = metadata?.pass_id;
                    const creatorId = metadata?.creator_id;
                    if (!passId || !creatorId) {
                        processingError = 'Missing pass_id/creator_id in founder pass metadata';
                    } else {
                        const { error: rpcError } = await supabase.rpc('rpc_allocate_founder_pass', {
                            p_fan_id: userId,
                            p_creator_id: creatorId,
                            p_pass_id: passId,
                            p_payment_intent: paymentIntentId || sessionId,
                        });
                        if (rpcError) {
                            processingError = rpcError.message;
                            console.error('[webhook] rpc_allocate_founder_pass failed:', rpcError);
                        } else {
                            console.log(`[webhook] Founder pass allocated: fan=${userId} pass=${passId}`);
                        }
                    }
                }
            // ─── Subscription lifecycle ───
            } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
                const subObj = event.data.object;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sub = subObj as unknown as any;
                const stripeSubId = sub.id as string;
                const newStatus = event.type === 'customer.subscription.deleted' ? 'canceled' :
                    sub.status === 'active' ? 'active' :
                    sub.status === 'past_due' ? 'past_due' : 'unpaid';

                await supabase.from('subscriptions')
                    .update({
                        status: newStatus,
                        current_period_end: typeof sub.current_period_end === 'number'
                            ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
                        canceled_at: event.type === 'customer.subscription.deleted' ? new Date().toISOString() : undefined,
                    })
                    .eq('stripe_subscription_id', stripeSubId);

                console.log(`[webhook] Subscription updated: ${stripeSubId} → ${newStatus}`);
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
