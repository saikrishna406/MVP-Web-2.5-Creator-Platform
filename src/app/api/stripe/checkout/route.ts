import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { packageId } = await request.json();

        if (!packageId) {
            return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
        }

        // Get the token package
        const { data: pkg, error: pkgError } = await supabase
            .from('token_packages')
            .select('*')
            .eq('id', packageId)
            .eq('is_active', true)
            .single();

        if (pkgError || !pkg) {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        // Create Stripe Checkout Session
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${pkg.name} Token Package`,
                            description: `${pkg.token_amount} Creator Tokens`,
                        },
                        unit_amount: pkg.price_cents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/fan/wallet?success=true&tokens=${pkg.token_amount}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/fan/wallet?cancelled=true`,
            metadata: {
                user_id: user.id,
                token_amount: pkg.token_amount.toString(),
                package_id: pkg.id,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
