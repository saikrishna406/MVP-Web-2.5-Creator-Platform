import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET - list redemption items
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const url = new URL(request.url);
        const creatorId = url.searchParams.get('creator_id');

        let query = supabase
            .from('redemption_items')
            .select(`
        *,
        creator:profiles!redemption_items_creator_id_fkey(
          id, user_id, username, display_name, avatar_url
        )
      `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (creatorId) {
            query = query.eq('creator_id', creatorId);
        }

        const { data: items, error } = await query;

        if (error) {
            console.error('Redemption items fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
        }

        return NextResponse.json({ items: items || [] });
    } catch (error) {
        console.error('Redemption GET error:', error);
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

        const body = await request.json();
        const { action } = body;

        if (action === 'create') {
            // Creator creating a new item
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (profile?.role !== 'creator') {
                return NextResponse.json({ error: 'Only creators can create items' }, { status: 403 });
            }

            const { name, description, point_cost, quantity_available, image_url } = body;

            if (!name || !point_cost || point_cost <= 0) {
                return NextResponse.json({ error: 'Name and valid point cost required' }, { status: 400 });
            }

            const { data: item, error } = await supabase
                .from('redemption_items')
                .insert({
                    creator_id: user.id,
                    name,
                    description: description || '',
                    point_cost,
                    quantity_available: quantity_available || 0,
                    image_url: image_url || null,
                })
                .select()
                .single();

            if (error) {
                console.error('Item creation error:', error);
                return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
            }

            return NextResponse.json({ item }, { status: 201 });

        } else if (action === 'redeem') {
            // Fan redeeming an item
            const { itemId } = body;

            if (!itemId) {
                return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
            }

            // Get the item
            const { data: item, error: itemError } = await supabase
                .from('redemption_items')
                .select('*')
                .eq('id', itemId)
                .eq('is_active', true)
                .single();

            if (itemError || !item) {
                return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            }

            // Use atomic function for redemption
            const serviceClient = await createServiceClient();
            const { data: result, error } = await serviceClient.rpc('handle_point_redemption', {
                p_user_id: user.id,
                p_item_id: itemId,
                p_point_cost: item.point_cost,
            });

            if (error) {
                console.error('Redemption error:', error);
                return NextResponse.json({ error: 'Failed to process redemption' }, { status: 500 });
            }

            if (!result) {
                return NextResponse.json({ error: 'Insufficient points or item out of stock' }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                message: 'Item redeemed successfully',
                pointsSpent: item.point_cost
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Redemption POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
