'use strict';

/**
 * bot.js — Discord bot entry point
 * ---------------------------------
 * Run with:   node discord-service/bot.js
 *
 * Environment variables required:
 *   DISCORD_BOT_TOKEN       — your bot token from the Discord Developer Portal
 *   BACKEND_URL             — (optional) defaults to http://localhost:3000/api/discord/activity
 *   DISCORD_INTERNAL_SECRET — (optional) shared secret validated by the API route
 *
 * Events handled:
 *   messageCreate — fires when a user sends a message in any channel the bot can see
 *
 * Future extension points (see sender.js):
 *   - messageReactionAdd  → event_type: "reaction",  points: 1
 *   - guildMemberAdd      → event_type: "join",       points: 5
 *   - voiceStateUpdate    → event_type: "voice",      points: 3/min
 */

require('dotenv').config({ path: '../frontend/.env.local' });

const client = require('./client');
const { sendActivity } = require('./sender');

// ── Event: Ready ──────────────────────────────────────────────
client.once('ready', () => {
  console.log(`[bot] Logged in as ${client.user?.tag}`);
  console.log(`[bot] Watching ${client.guilds.cache.size} guild(s)`);
});

// ── Event: messageCreate ──────────────────────────────────────
client.on('messageCreate', async (message) => {
  // Ignore all bot messages (including our own) to prevent feedback loops
  if (message.author.bot) return;

  // Ignore DMs — we only track guild activity
  if (!message.guildId) return;

  console.log(
    `[bot] Discord event captured — message from ${message.author.tag} in guild ${message.guildId}`
  );

  await sendActivity({
    discord_user_id: message.author.id,
    guild_id: message.guildId,
    event_type: 'message',
    points: 2,
    timestamp: message.createdAt.toISOString(),
  });
});

// ── Error handling ────────────────────────────────────────────
client.on('error', (err) => {
  console.error('[bot] Discord client error:', err.message);
  // Do NOT throw — the bot should stay alive
});

process.on('unhandledRejection', (reason) => {
  console.error('[bot] Unhandled rejection:', reason);
});

// ── Login ─────────────────────────────────────────────────────
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error(
    '[bot] DISCORD_BOT_TOKEN is not set. ' +
      'Add it to frontend/.env.local or export it in your shell.'
  );
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error('[bot] Login failed:', err.message);
  process.exit(1);
});
