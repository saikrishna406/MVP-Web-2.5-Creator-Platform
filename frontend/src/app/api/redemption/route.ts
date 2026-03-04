import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { RedemptionSchema } from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSuspiciousActivity, getClientIp } from '@/lib/security';

// GET - list redemption items
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const url = new URL(request.url);
        const creatorId = url.searchParams.get('creator_id');

        let query = supabase
            .from('redemption_items')
            .select(`*, creator:profiles!redemption_items_creator_id_fkey(
        id, user_id, username, display_name, avatar_url
      )`)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (creatorId) {
            query = query.eq('creator_id', creatorId);
        }

        const { data: items, error } = await query;

        if (error) {
            console.error('[redemption] GET error:', error);
            return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
        }

        return NextResponse.json({ items: items || [] });
    } catch (error) {
        console.error('[redemption] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - create item or redeem
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate input
        const body = await request.json();
        const parsed = RedemptionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = parsed.data;

        if (data.action === 'create') {
            // Creator creating a new item
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (profile?.role !== 'creator') {
                return NextResponse.json({ error: 'Only creators can create items' }, { status: 403 });
            }

            const { data: item, error } = await supabase
                .from('redemption_items')
                .insert({
                    creator_id: user.id,
                    name: data.name,
                    description: data.description || '',
                    point_cost: data.point_cost,
                    quantity_available: data.quantity_available || 0,
                    image_url: data.image_url || null,
                })
                .select()
                .single();

            if (error) {
                console.error('[redemption] Create error:', error);
                return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
            }

            return NextResponse.json({ item }, { status: 201 });

        } else {
            // Fan redeeming an item
            const rl = checkRateLimit(`redeem:${user.id}`, RATE_LIMITS.redeem);
            if (!rl.allowed) {
                const svc = await createServiceClient();
                await logSuspiciousActivity(svc, {
                    userId: user.id,
                    activityType: 'rate_limit_redeem',
                    severity: 'high',
                    description: 'Redemption rate limit exceeded — possible abuse',
                    ipAddress: getClientIp(request.headers),
                    endpoint: '/api/redemption',
                });
                return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            }

            const idempotencyKey = `redeem_${user.id}_${data.itemId}_${Date.now()}`;

            const serviceClient = await createServiceClient();
            const { data: result, error } = await serviceClient.rpc('redeem_item', {
                p_user_id: user.id,
                p_item_id: data.itemId,
                p_idempotency_key: idempotencyKey,
            });

            if (error) {
                if (error.message?.includes('maintenance mode')) {
                    return NextResponse.json({ error: 'System is in maintenance mode' }, { status: 503 });
                }
                console.error('[redemption] Redeem error:', error);
                return NextResponse.json({ error: 'Failed to process redemption' }, { status: 500 });
            }

            const row = Array.isArray(result) ? result[0] : result;

            if (!row?.success) {
                return NextResponse.json({ error: 'Insufficient points or item out of stock' }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                message: 'Item redeemed successfully',
                pointsSpent: row.points_spent,
                orderId: row.order_id,
            });
        }
    } catch (error) {
        console.error('[redemption] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
