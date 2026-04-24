import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate input
        if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.length > 200) {
            return NextResponse.json({ error: 'Name is required (max 200 characters)' }, { status: 400 });
        }
        if (body.description && (typeof body.description !== 'string' || body.description.length > 2000)) {
            return NextResponse.json({ error: 'Description too long (max 2000 characters)' }, { status: 400 });
        }
        if (typeof body.point_cost !== 'number' || body.point_cost < 1 || !Number.isInteger(body.point_cost)) {
            return NextResponse.json({ error: 'Point cost must be a positive integer' }, { status: 400 });
        }
        if (body.quantity_available !== undefined && body.quantity_available !== null) {
            if (typeof body.quantity_available !== 'number' || body.quantity_available < 0 || !Number.isInteger(body.quantity_available)) {
                return NextResponse.json({ error: 'Quantity must be a non-negative integer' }, { status: 400 });
            }
        }

        // Check ownership
        const { data: item, error: fetchError } = await supabase
            .from('redemption_items')
            .select('creator_id')
            .eq('id', id)
            .single();

        if (fetchError || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.creator_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: updatedItem, error: updateError } = await supabase
            .from('redemption_items')
            .update({
                name: body.name.trim(),
                description: body.description?.trim() || null,
                point_cost: body.point_cost,
                quantity_available: body.quantity_available,
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
        }

        return NextResponse.json({ item: updatedItem }, { status: 200 });
    } catch (error) {
        console.error('[redemption][id] PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check ownership
        const { data: item, error: fetchError } = await supabase
            .from('redemption_items')
            .select('creator_id')
            .eq('id', id)
            .single();

        if (fetchError || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.creator_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // For audit purposes or simply delete
        const { error: deleteError } = await supabase
            .from('redemption_items')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('[redemption][id] DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
