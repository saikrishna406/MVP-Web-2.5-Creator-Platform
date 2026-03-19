'use strict';

/**
 * test-api.js
 * -----------
 * Simulates a Discord bot sending an activity event to the Next.js API.
 * Run this WITHOUT a real Discord bot to verify the full pipeline:
 *   test-api.js → POST /api/discord/activity → Supabase (discord_activity table)
 *
 * Usage:
 *   node discord-service/test-api.js
 */

require('dotenv').config({ path: '../frontend/.env.local' });

const API_URL = 'http://localhost:3000/api/discord/activity';

const testPayload = {
  discord_user_id: 'test_discord_user_123',   // fake Discord user ID
  guild_id:        'test_guild_456',           // fake guild/server ID
  event_type:      'message',
  points:          2,
  timestamp:       new Date().toISOString(),
};

async function runTest() {
  console.log('🚀 Sending test payload to:', API_URL);
  console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
  console.log('');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-discord-secret': process.env.DISCORD_INTERNAL_SECRET || '',
      },
      body: JSON.stringify(testPayload),
    });

    const json = await res.json();

    console.log('✅ Response status:', res.status);
    console.log('📬 Response body:', JSON.stringify(json, null, 2));
    console.log('');

    if (json.success) {
      console.log('🎉 SUCCESS! Check your Supabase discord_activity table for a new row.');
      console.log('   discord_user_id = "test_discord_user_123"');
    } else {
      console.log('⚠️  The API returned success=false:', json.error);
      console.log('   Possible causes:');
      console.log('   1. Migration 008 not applied yet (no discord_activity table)');
      console.log('   2. SUPABASE_SERVICE_ROLE_KEY is still set to the placeholder');
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message);
    console.log('   Is Next.js running on port 3000?  →  cd frontend && npm run dev');
  }
}

runTest();
