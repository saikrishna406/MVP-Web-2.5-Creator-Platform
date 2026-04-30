import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/discord/connect
 * -------------------------
 * Generates the Discord OAuth2 authorization URL and redirects
 * the creator to Discord's authorization screen.
 *
 * Scopes requested:
 *   - identify : get the creator's Discord identity
 *   - guilds   : list the creator's servers (so they can pick one)
 *   - bot      : add the bot to the selected server
 *
 * Bot permissions (274877975552):
 *   - Read Messages/View Channels
 *   - Send Messages
 *   - Read Message History
 */
export async function GET() {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/discord/callback`;

    if (!clientId) {
        return NextResponse.json(
            { error: 'DISCORD_CLIENT_ID not configured' },
            { status: 500 }
        );
    }

    // Bot permissions:
    //   View Channels (1024) + Send Messages (2048) + Read Message History (65536)
    //   = 68608
    const botPermissions = '68608';

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'identify guilds bot',
        permissions: botPermissions,
        // Prevent CSRF: use the state param to carry a nonce
        // (for production, store in a signed cookie and verify on callback)
        state: 'discord_oauth',
    });

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

    return NextResponse.redirect(discordAuthUrl);
}

/**
 * POST /api/discord/connect
 * -------------------------
 * Save a creator's Discord server guild_id after bot is added.
 *
 * Body: { guild_id: string }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Parse and validate input
        const body = await request.json();
        const { guild_id } = body;

        if (!guild_id || typeof guild_id !== 'string' || guild_id.trim().length === 0) {
            return NextResponse.json(
                { error: 'guild_id is required and must be a non-empty string' },
                { status: 400 }
            );
        }

        // 3. Verify user is a creator
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        if (profile.role !== 'creator') {
            return NextResponse.json(
                { error: 'Only creators can connect a Discord server' },
                { status: 403 }
            );
        }

        // 4. Fetch guild name + create invite from Discord API using bot token
        let guildName: string | null = null;
        let discordInviteUrl: string | null = null;
        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (botToken) {
            try {
                // Fetch guild info
                const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guild_id.trim()}`, {
                    headers: { Authorization: `Bot ${botToken}` },
                });
                if (guildRes.ok) {
                    const guildData = await guildRes.json();
                    guildName = guildData.name || null;
                } else {
                    console.warn('[discord/connect] Could not fetch guild info:', guildRes.status);
                }

                // Fetch guild channels to find a text channel for the invite
                const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guild_id.trim()}/channels`, {
                    headers: { Authorization: `Bot ${botToken}` },
                });
                if (channelsRes.ok) {
                    const channels = await channelsRes.json();
                    // Find the first text channel (type 0) the bot can access
                    const textChannel = channels.find((ch: { type: number }) => ch.type === 0);
                    if (textChannel) {
                        // Create a permanent invite (max_age=0 means never expires, max_uses=0 means unlimited)
                        const inviteRes = await fetch(`https://discord.com/api/v10/channels/${textChannel.id}/invites`, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bot ${botToken}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ max_age: 0, max_uses: 0, unique: false }),
                        });
                        if (inviteRes.ok) {
                            const inviteData = await inviteRes.json();
                            discordInviteUrl = `https://discord.gg/${inviteData.code}`;
                        } else {
                            console.warn('[discord/connect] Could not create invite:', inviteRes.status);
                        }
                    }
                }
            } catch (e) {
                console.warn('[discord/connect] Discord API error:', e);
            }
        }

        // 5. Check if creator already has a Discord connection
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
                    channel_name: guildName,
                    discord_invite_url: discordInviteUrl,
                    is_active: true,
                })
                .eq('id', existing.id);

            if (error) {
                console.error('[discord/connect POST] Update error:', error.message);
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
                    channel_name: guildName,
                    discord_invite_url: discordInviteUrl,
                    is_active: true,
                });

            if (error) {
                if (error.code === '23505') {
                    return NextResponse.json(
                        { error: 'This Discord server is already connected to another creator' },
                        { status: 409 }
                    );
                }
                console.error('[discord/connect POST] Insert error:', error.message);
                return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
            }
        }

        // 5. Return success
        return NextResponse.json({
            success: true,
            guild_id: guild_id.trim(),
        });
    } catch (error) {
        console.error('[discord/connect] POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
