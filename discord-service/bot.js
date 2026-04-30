'use strict';

/**
 * bot.js — Discord bot entry point
 * ---------------------------------
 * Run with:   node discord-service/bot.js
 *
 * Environment variables required:
 *   DISCORD_BOT_TOKEN       — your bot token from the Discord Developer Portal
 *   BACKEND_URL             — defaults to http://localhost:3000
 *   DISCORD_INTERNAL_SECRET — shared secret for HMAC signing API requests
 *
 * Events handled:
 *   messageCreate — tracks messages in guild channels
 *   interactionCreate — handles /link slash command
 *
 * Future extension points:
 *   - messageReactionAdd  → action_type: "reaction"
 *   - guildMemberAdd      → action_type: "join"
 *   - voiceStateUpdate    → action_type: "voice"
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'frontend', '.env.local') });

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const client = require('./client');
const { sendEvent, sendLinkVerify } = require('./sender');

// ── Slash Command Registration ───────────────────────────────────
const linkCommand = new SlashCommandBuilder()
  .setName('link')
  .setDescription('Link your Discord account to the Creator Platform')
  .addStringOption((option) =>
    option
      .setName('code')
      .setDescription('Your link code (e.g., LINK-A3F9)')
      .setRequired(true)
  );

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('[bot] Registering slash commands...');
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: [linkCommand.toJSON()],
    });
    console.log('[bot] Slash commands registered.');
  } catch (err) {
    console.error('[bot] Failed to register commands:', err.message);
  }
}

// ── Event: Ready ──────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`[bot] Logged in as ${client.user?.tag}`);
  console.log(`[bot] Watching ${client.guilds.cache.size} guild(s)`);
  await registerCommands();
});

// ── Event: interactionCreate (Slash Commands) ────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'link') return;

  const code = interaction.options.getString('code');

  if (!code) {
    await interaction.reply({
      content: '❌ Please provide a link code. Example: `/link LINK-A3F9`',
      ephemeral: true,
    });
    return;
  }

  // Defer reply so we have time to call the backend
  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await sendLinkVerify({
      code: code.toUpperCase().trim(),
      external_user_id: interaction.user.id,
      external_username: `${interaction.user.username}#${interaction.user.discriminator}`,
    });

    if (result.success) {
      await interaction.editReply({
        content:
          '✅ **Discord account linked!**\n' +
          'Your activity in this server will now be tracked on the Creator Platform.\n' +
          'Keep chatting to earn engagement credit!',
      });
    } else {
      const errorMsg = result.error || 'Unknown error';
      await interaction.editReply({
        content: `❌ **Link failed:** ${errorMsg}\n\nGenerate a new code at the Creator Platform dashboard.`,
      });
    }
  } catch (err) {
    console.error('[bot] Link command error:', err.message);
    await interaction.editReply({
      content: '❌ Something went wrong. Please try again later.',
    });
  }
});

// ── Event: messageCreate ──────────────────────────────────────
client.on('messageCreate', async (message) => {
  // Ignore all bot messages (including our own) to prevent feedback loops
  if (message.author.bot) return;

  // Ignore DMs — we only track guild activity
  if (!message.guildId) return;

  console.log(
    `[bot] Message from ${message.author.tag} in guild ${message.guildId}`
  );

  await sendEvent({
    external_user_id: message.author.id,
    channel_id: message.guildId,
    event_id: message.id,
    action_type: 'message',
    metadata: {
      channel_id: message.channelId,
      content_length: message.content?.length ?? 0,
      has_attachments: message.attachments.size > 0,
    },
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
