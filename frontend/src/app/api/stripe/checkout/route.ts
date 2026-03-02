import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { CheckoutSchema } from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSuspiciousActivity, getClientIp } from '@/lib/security';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit
        const rl = checkRateLimit(`checkout:${user.id}`, RATE_LIMITS.checkout);
        if (!rl.allowed) {
            const serviceClient = await createServiceClient();
            await logSuspiciousActivity(serviceClient, {
                userId: user.id,
                activityType: 'rate_limit_checkout',
                severity: 'medium',
                description: `Checkout rate limit exceeded`,
                ipAddress: getClientIp(request.headers),
                endpoint: '/api/stripe/checkout',
            });
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        // Validate input
        const body = await request.json();
        const parsed = CheckoutSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { packageId } = parsed.data;

        // Get the token package — verify server-side
        const { data: pkg, error: pkgError } = await supabase
            .from('token_packages')
            .select('*')
            .eq('id', packageId)
            .eq('is_active', true)
            .single();

        if (pkgError || !pkg) {
            return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 });
        }

        // Create Stripe Checkout Session with server-verified price
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
                        unit_amount: pkg.price_cents, // Server-verified price
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
                price_cents: pkg.price_cents.toString(),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[checkout] Error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
