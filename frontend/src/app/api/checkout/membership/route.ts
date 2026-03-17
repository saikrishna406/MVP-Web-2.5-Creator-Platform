import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

/**
 * POST /api/checkout/membership
 * Body: { tier_id: string }
 * Redirects to Stripe Checkout for recurring subscription.
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier_id } = await request.json();
    if (!tier_id) return NextResponse.json({ error: 'tier_id required' }, { status: 400 });

    // Server-side price verification — never trust the client
    const { data: tier } = await supabase
        .from('membership_tiers')
        .select('id, name, price, member_limit, members_count, creator_id, is_archived')
        .eq('id', tier_id)
        .eq('is_archived', false)
        .single();

    if (!tier) return NextResponse.json({ error: 'Tier not found' }, { status: 404 });

    // Guard capacity
    if (tier.member_limit !== null && tier.members_count >= tier.member_limit) {
        return NextResponse.json({ error: 'This tier is full' }, { status: 409 });
    }

    // Guard: fan cannot subscribe to own tier if they're also a creator
    if (user.id === tier.creator_id) {
        return NextResponse.json({ error: 'Creators cannot subscribe to their own tiers' }, { status: 400 });
    }

    // Guard: already subscribed?
    const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('fan_id', user.id)
        .eq('tier_id', tier_id)
        .eq('status', 'active')
        .maybeSingle();

    if (existing) return NextResponse.json({ error: 'Already subscribed to this tier' }, { status: 409 });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
            price_data: {
                currency: 'usd',
                recurring: { interval: 'month' },
                product_data: {
                    name: tier.name,
                    description: `Monthly membership to ${tier.name}`,
                },
                unit_amount: tier.price,
            },
            quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/fan?sub_success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/fan`,
        metadata: {
            type: 'membership',
            user_id: user.id,
            tier_id: tier.id,
            creator_id: tier.creator_id,
        },
    });

    return NextResponse.json({ url: session.url });
}

/**
 * GET /api/checkout/membership?tier_id=xxx
 * Allows direct link navigation (e.g. from the fan hub page).
 */
export async function GET(request: NextRequest) {
    const tier_id = request.nextUrl.searchParams.get('tier_id');
    if (!tier_id) return NextResponse.redirect(new URL('/fan', request.url));

    const res = await POST(new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ tier_id }),
        headers: request.headers,
    }));
    const json = await res.json();
    if (json.url) return NextResponse.redirect(json.url);
    return NextResponse.json(json, { status: res.status });
}
