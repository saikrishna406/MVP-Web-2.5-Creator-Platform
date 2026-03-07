import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch packages for a creator
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const url = new URL(request.url);
        const creatorId = url.searchParams.get('creator_id');

        if (!creatorId) {
            // Return current user's packages
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const { data: packages, error } = await supabase
                .from('creator_packages')
                .select('*')
                .eq('creator_id', user.id)
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) {
                console.error('[packages] GET error:', error);
                return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
            }

            return NextResponse.json({ packages: packages || [] });
        }

        // Public: fetch packages by creator_id
        const { data: packages, error } = await supabase
            .from('creator_packages')
            .select('*')
            .eq('creator_id', creatorId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('[packages] GET error:', error);
            return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
        }

        return NextResponse.json({ packages: packages || [] });
    } catch (error) {
        console.error('[packages] API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new package
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify creator
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profile?.role !== 'creator') {
            return NextResponse.json({ error: 'Only creators can manage packages' }, { status: 403 });
        }

        // Check existing count
        const { count } = await supabase
            .from('creator_packages')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', user.id)
            .eq('is_active', true);

        if ((count || 0) >= 3) {
            return NextResponse.json({ error: 'Maximum 3 packages allowed' }, { status: 400 });
        }

        const body = await request.json();
        const { name, token_price, post_limit, description, badge_name } = body;

        // Validation
        if (!name || name.length < 1 || name.length > 100) {
            return NextResponse.json({ error: 'Package name is required (max 100 characters)' }, { status: 400 });
        }
        if (!token_price || token_price < 1) {
            return NextResponse.json({ error: 'Token price must be positive' }, { status: 400 });
        }
        if (!post_limit || post_limit < 1) {
            return NextResponse.json({ error: 'Post limit must be greater than 0' }, { status: 400 });
        }

        const { data: pkg, error } = await supabase
            .from('creator_packages')
            .insert({
                creator_id: user.id,
                name,
                token_price,
                post_limit,
                description: description || null,
                badge_name: badge_name || null,
                sort_order: (count || 0),
            })
            .select()
            .single();

        if (error) {
            console.error('[packages] Create error:', error);
            return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
        }

        return NextResponse.json({ package: pkg }, { status: 201 });
    } catch (error) {
        console.error('[packages] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update an existing package
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, token_price, post_limit, description, badge_name } = body;

        if (!id) {
            return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
        }

        // Verify ownership
        const { data: existing } = await supabase
            .from('creator_packages')
            .select('creator_id')
            .eq('id', id)
            .single();

        if (!existing || existing.creator_id !== user.id) {
            return NextResponse.json({ error: 'Package not found or unauthorized' }, { status: 404 });
        }

        // Validation
        if (name && name.length > 100) {
            return NextResponse.json({ error: 'Package name max 100 characters' }, { status: 400 });
        }
        if (token_price !== undefined && token_price < 1) {
            return NextResponse.json({ error: 'Token price must be positive' }, { status: 400 });
        }
        if (post_limit !== undefined && post_limit < 1) {
            return NextResponse.json({ error: 'Post limit must be greater than 0' }, { status: 400 });
        }

        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (token_price !== undefined) updates.token_price = token_price;
        if (post_limit !== undefined) updates.post_limit = post_limit;
        if (description !== undefined) updates.description = description;
        if (badge_name !== undefined) updates.badge_name = badge_name;

        const { data: pkg, error } = await supabase
            .from('creator_packages')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[packages] Update error:', error);
            return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
        }

        return NextResponse.json({ package: pkg });
    } catch (error) {
        console.error('[packages] PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Soft-delete a package
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
        }

        // Verify ownership
        const { data: existing } = await supabase
            .from('creator_packages')
            .select('creator_id')
            .eq('id', id)
            .single();

        if (!existing || existing.creator_id !== user.id) {
            return NextResponse.json({ error: 'Package not found or unauthorized' }, { status: 404 });
        }

        const { error } = await supabase
            .from('creator_packages')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('[packages] Delete error:', error);
            return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Package deleted' });
    } catch (error) {
        console.error('[packages] DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
