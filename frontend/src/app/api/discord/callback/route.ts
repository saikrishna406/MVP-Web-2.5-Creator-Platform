import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/discord/callback
 * --------------------------
 * Discord redirects here after the creator authorizes the app.
 *
 * Flow:
 *  1. Extract `code` from query params
 *  2. Exchange code for access token via Discord's token endpoint
 *  3. Fetch creator's Discord identity (/users/@me)
 *  4. Fetch creator's guilds (/users/@me/guilds)
 *  5. Redirect to /creator/social/discord-connect with guild data
 *     stored in a short-lived query param (base64-encoded JSON)
 *
 * The `guild_id` from the OAuth bot authorization (where the bot was
 * added) is also in the query params — we capture that too.
 */

interface DiscordTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    guild?: {
        id: string;
        name: string;
        icon: string | null;
    };
}

interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    global_name: string | null;
    avatar: string | null;
}

interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
}

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const guildId = searchParams.get('guild_id'); // Set if bot was added to a server
    const error = searchParams.get('error');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // ── Handle denial ────────────────────────────────────────────
    if (error) {
        console.warn('[discord/callback] User denied authorization:', error);
        return NextResponse.redirect(
            `${appUrl}/creator/social?error=discord_denied`
        );
    }

    if (!code) {
        return NextResponse.redirect(
            `${appUrl}/creator/social?error=no_code`
        );
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/discord/callback`;

    if (!clientId || !clientSecret) {
        console.error('[discord/callback] Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET');
        return NextResponse.redirect(
            `${appUrl}/creator/social?error=config_error`
        );
    }

    try {
        // ── Step 1: Exchange code for access token ────────────────
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenResponse.ok) {
            const errBody = await tokenResponse.text();
            console.error('[discord/callback] Token exchange failed:', tokenResponse.status, errBody);
            return NextResponse.redirect(
                `${appUrl}/creator/social?error=token_failed`
            );
        }

        const tokenData: DiscordTokenResponse = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // If the OAuth flow included bot scope, Discord returns the guild info
        const botGuild = tokenData.guild;

        // ── Step 2: Fetch creator's Discord identity ──────────────
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
            console.error('[discord/callback] Failed to fetch user:', userResponse.status);
            return NextResponse.redirect(
                `${appUrl}/creator/social?error=user_fetch_failed`
            );
        }

        const discordUser: DiscordUser = await userResponse.json();

        // ── Step 3: Fetch creator's guilds ────────────────────────
        const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        let guilds: DiscordGuild[] = [];
        if (guildsResponse.ok) {
            guilds = await guildsResponse.json();
            // Filter to guilds where the user is owner or has MANAGE_GUILD permission
            // MANAGE_GUILD = 0x20 = 32
            guilds = guilds.filter(
                (g) => g.owner || (BigInt(g.permissions) & BigInt(0x20)) !== BigInt(0)
            );
        }

        // ── Step 4: Build redirect data ───────────────────────────
        const callbackData = {
            discord_user: {
                id: discordUser.id,
                username: discordUser.username,
                global_name: discordUser.global_name,
                avatar: discordUser.avatar,
            },
            guilds: guilds.map((g) => ({
                id: g.id,
                name: g.name,
                icon: g.icon,
                owner: g.owner,
            })),
            // If bot was added during OAuth, highlight that guild
            bot_guild_id: guildId || botGuild?.id || null,
            bot_guild_name: botGuild?.name || null,
        };

        // Encode as base64 for safe URL transport
        const encoded = Buffer.from(JSON.stringify(callbackData)).toString('base64url');

        return NextResponse.redirect(
            `${appUrl}/creator/social/discord-connect?data=${encoded}`
        );

    } catch (err) {
        console.error('[discord/callback] Unexpected error:', err);
        return NextResponse.redirect(
            `${appUrl}/creator/social?error=unexpected`
        );
    }
}
