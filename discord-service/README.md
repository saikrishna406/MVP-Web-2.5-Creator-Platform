# Discord Service — Bot + OAuth Integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Creator Onboarding                      │
│                                                             │
│  Creator → "Connect with Discord" button                    │
│    → GET /api/discord/connect (generates OAuth URL)         │
│    → Discord OAuth screen (identify + guilds + bot)         │
│    → GET /api/discord/callback (exchanges code, gets guilds)│
│    → /creator/social/discord-connect (server picker UI)     │
│    → POST /api/creator/social/discord (saves guild mapping) │
│                                                             │
│  Result: creator_channels row created                       │
│          bot added to server                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Event Tracking (Bot)                     │
│                                                             │
│  Discord user sends message in guild                        │
│    → bot.js captures messageCreate event                    │
│    → sender.js POSTs to /api/discord/event (HMAC-signed)    │
│    → API validates signature                                │
│    → Maps guild_id → creator_id (via creator_channels)      │
│    → Maps discord_user_id → user_id (via user_identities)   │
│    → Inserts engagement_logs row                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Fan Linking                              │
│                                                             │
│  Fan clicks "Connect Discord" on dashboard                  │
│    → POST /api/link/discord/generate → gets LINK-XXXX code  │
│    → Fan runs /link LINK-XXXX in Discord                    │
│    → bot.js sends to /api/link/discord/verify               │
│    → user_identities row created                            │
│    → Existing engagement_logs backfilled with user_id       │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Discord Developer Portal

1. Go to https://discord.com/developers/applications
2. Select your application (or create a new one)
3. Copy **Application ID** → this is your `DISCORD_CLIENT_ID`

### 2. Bot Setup

1. Go to **Bot** tab
2. Enable Privileged Intents:
   - ✅ MESSAGE CONTENT INTENT
   - ✅ SERVER MEMBERS INTENT
3. Copy **Bot Token** → `DISCORD_BOT_TOKEN`

### 3. OAuth2 Setup

1. Go to **OAuth2 → General**
2. Add redirect URL: `http://localhost:3000/api/discord/callback`
   - For production: `https://yourdomain.com/api/discord/callback`
3. Copy **Client Secret** → `DISCORD_CLIENT_SECRET`

### 4. Environment Variables

Add to `frontend/.env.local`:

```env
# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_INTERNAL_SECRET=a_random_secret_string

# Discord OAuth2
DISCORD_CLIENT_ID=your_application_id
DISCORD_CLIENT_SECRET=your_client_secret
```

### 5. Run the Bot

```bash
cd discord-service
npm install
npm start
```

### 6. Database

Run these migrations in order:
1. `backend/supabase/003_engagement_tracking.sql` — core tables
2. `backend/supabase/008_discord_integration.sql` — discord-specific tables

## Files

| File | Purpose |
|------|---------|
| `discord-service/bot.js` | Bot entry point — message tracking + /link command |
| `discord-service/client.js` | Discord.js client singleton |
| `discord-service/sender.js` | HMAC-signed HTTP sender (bot → backend) |
| `frontend/src/app/api/discord/connect/route.ts` | Generates OAuth URL |
| `frontend/src/app/api/discord/callback/route.ts` | OAuth callback handler |
| `frontend/src/app/api/discord/event/route.ts` | Event ingestion endpoint |
| `frontend/src/app/api/discord/activity/route.ts` | Legacy activity endpoint |
| `frontend/src/app/api/discord/score/route.ts` | User score endpoint |
| `frontend/src/app/api/link/discord/generate/route.ts` | Link code generation |
| `frontend/src/app/api/link/discord/verify/route.ts` | Link code verification |
| `frontend/src/app/api/creator/social/discord/route.ts` | Creator channel CRUD |
| `frontend/src/app/creator/social/page.tsx` | Social Hub UI |
| `frontend/src/app/creator/social/discord-connect/page.tsx` | Server selection UI |
