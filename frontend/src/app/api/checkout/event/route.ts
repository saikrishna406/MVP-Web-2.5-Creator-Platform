import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

/**
 * GET /api/checkout/event?event_id=xxx
 * One-time event ticket purchase.
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const event_id = request.nextUrl.searchParams.get('event_id');
    if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

    // Server-side verification
    const { data: event } = await supabase
        .from('events')
        .select('id, title, price, capacity, tickets_sold, creator_id, event_date, status')
        .eq('id', event_id)
        .eq('status', 'published')
        .single();

    if (!event) return NextResponse.json({ error: 'Event not found or unavailable' }, { status: 404 });

    // Guard: event hasn't passed
    if (new Date(event.event_date) < new Date()) {
        return NextResponse.json({ error: 'This event has already passed' }, { status: 410 });
    }

    // Guard: capacity
    if (event.capacity !== null && event.tickets_sold >= event.capacity) {
        return NextResponse.json({ error: 'Event is sold out' }, { status: 409 });
    }

    // Guard: already bought
    const { data: existing } = await supabase
        .from('event_tickets')
        .select('id')
        .eq('fan_id', user.id)
        .eq('event_id', event_id)
        .maybeSingle();

    if (existing) return NextResponse.json({ error: 'You already have a ticket' }, { status: 409 });

    // Free event — allocate directly without Stripe
    if (event.price === 0) {
        const { error } = await supabase.from('event_tickets').insert({
            fan_id: user.id,
            event_id,
            status: 'valid',
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.redirect(new URL('/fan?ticket_success=1', request.url));
    }

    // Paid ticket — Stripe Checkout
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: event.title,
                    description: `Event ticket — ${new Date(event.event_date).toLocaleDateString()}`,
                },
                unit_amount: event.price,
            },
            quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/fan?ticket_success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/fan`,
        metadata: {
            type: 'event_ticket',
            user_id: user.id,
            event_id: event.id,
        },
    });

    if (session.url) return NextResponse.redirect(session.url);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
}
