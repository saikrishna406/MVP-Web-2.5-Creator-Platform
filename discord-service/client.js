'use strict';

const { Client, GatewayIntentBits } = require('discord.js');

/**
 * Discord client with all required gateway intents.
 * Exported as a singleton — imported by bot.js only.
 *
 * Intents enabled:
 *  - Guilds             : access server/channel info
 *  - GuildMessages      : receive message events
 *  - MessageContent     : read message text (Privileged Intent — enable in Dev Portal)
 *  - GuildMembers       : member join/leave events (Privileged — enable in Dev Portal)
 *  - GuildMessageReactions : reaction events for future tracking
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

module.exports = client;
