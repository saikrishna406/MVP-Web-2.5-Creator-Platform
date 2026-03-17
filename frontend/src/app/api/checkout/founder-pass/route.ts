import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

/**
 * GET /api/checkout/founder-pass?pass_id=xxx
 * One-time founder pass purchase with strict concurrency guard.
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pass_id = request.nextUrl.searchParams.get('pass_id');
    if (!pass_id) return NextResponse.json({ error: 'pass_id required' }, { status: 400 });

    // Server-side verification (select FOR UPDATE equivalent via RPC will handle final race)
    const { data: pass } = await supabase
        .from('founder_pass')
        .select('id, price, pass_limit, sold, is_active, creator_id')
        .eq('id', pass_id)
        .eq('is_active', true)
        .single();

    if (!pass) return NextResponse.json({ error: 'Founder pass not found or inactive' }, { status: 404 });

    // Guard: sold out (preliminary check — DB constraint is the authoritative guard)
    if (pass.sold >= pass.pass_limit) {
        return NextResponse.json({ error: 'Founder pass is sold out' }, { status: 409 });
    }

    // Guard: already purchased
    const { data: existing } = await supabase
        .from('founder_pass_purchases')
        .select('id')
        .eq('fan_id', user.id)
        .eq('pass_id', pass_id)
        .maybeSingle();

    if (existing) return NextResponse.json({ error: 'You already own this founder pass' }, { status: 409 });

    // Guard: creator cannot buy own pass
    if (user.id === pass.creator_id) {
        return NextResponse.json({ error: 'Creators cannot purchase their own founder pass' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Founder Supporter Pass',
                    description: 'Limited early supporter access. Non-refundable. Permanent badge.',
                },
                unit_amount: pass.price,
            },
            quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/fan?founder_success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/fan`,
        metadata: {
            type: 'founder_pass',
            user_id: user.id,
            pass_id: pass.id,
            creator_id: pass.creator_id,
        },
    });

    if (session.url) return NextResponse.redirect(session.url);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
}
