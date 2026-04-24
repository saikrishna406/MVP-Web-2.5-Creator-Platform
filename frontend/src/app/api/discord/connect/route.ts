import { NextResponse } from 'next/server';

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
