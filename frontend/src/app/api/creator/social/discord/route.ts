import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/creator/social/discord
 * Fetch the creator's Discord connection (if any).
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a creator
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'creator') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch the creator's Discord channel connection
        const { data: channel } = await supabase
            .from('creator_channels')
            .select('*')
            .eq('creator_id', user.id)
            .eq('platform', 'discord')
            .maybeSingle();

        return NextResponse.json({
            connected: !!channel,
            channel: channel || null,
        });
    } catch (error) {
        console.error('[social/discord GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/creator/social/discord
 * Save (or update) a Discord guild_id for this creator.
 *
 * Body: { guild_id: string, guild_name?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a creator
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'creator') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { guild_id, guild_name } = body;

        if (!guild_id || typeof guild_id !== 'string' || guild_id.trim().length === 0) {
            return NextResponse.json(
                { error: 'guild_id is required and must be a non-empty string' },
                { status: 400 }
            );
        }

        // Upsert: if this creator already has a Discord channel, update it.
        // If not, insert a new row.
        const { data: existing } = await supabase
            .from('creator_channels')
            .select('id')
            .eq('creator_id', user.id)
            .eq('platform', 'discord')
            .maybeSingle();

        if (existing) {
            // Update existing connection
            const { error } = await supabase
                .from('creator_channels')
                .update({
                    external_channel_id: guild_id.trim(),
                    channel_name: guild_name?.trim() || null,
                    is_active: true,
                })
                .eq('id', existing.id);

            if (error) {
                console.error('[social/discord POST] Update error:', error.message);
                return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
            }
        } else {
            // Insert new connection
            const { error } = await supabase
                .from('creator_channels')
                .insert({
                    creator_id: user.id,
                    platform: 'discord',
                    external_channel_id: guild_id.trim(),
                    channel_name: guild_name?.trim() || null,
                    is_active: true,
                });

            if (error) {
                // Unique constraint: another creator already owns this guild
                if (error.code === '23505') {
                    return NextResponse.json(
                        { error: 'This Discord server is already connected to another creator' },
                        { status: 409 }
                    );
                }
                console.error('[social/discord POST] Insert error:', error.message);
                return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[social/discord POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/creator/social/discord
 * Disconnect the creator's Discord server.
 */
export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('creator_channels')
            .delete()
            .eq('creator_id', user.id)
            .eq('platform', 'discord');

        if (error) {
            console.error('[social/discord DELETE] Error:', error.message);
            return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[social/discord DELETE] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
