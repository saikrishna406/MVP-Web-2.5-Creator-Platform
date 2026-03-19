# discord-service

Isolated Discord bot service for the Creator Platform.

> **Architecture Rule**: This service is completely separate from the Next.js runtime.  
> `Discord Bot → Next.js API → Supabase → Dashboard`

---

## Files

| File | Purpose |
|---|---|
| `client.js` | Discord.js client singleton with required intents |
| `sender.js` | HTTP sender — POSTs events to the Next.js backend with retries |
| `bot.js` | Bot entry point — listens for Discord events |
| `package.json` | Standalone package — run independently from the frontend |

---

## Setup

### 1. Create a Discord Application & Bot

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** → give it a name
3. Go to **Bot** tab → **Add Bot**
4. Copy the **Bot Token**
5. Under **Privileged Gateway Intents**, enable:
   - **Server Members Intent**
   - **Message Content Intent**
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Permissions: `Read Messages/View Channels`, `Read Message History`
7. Open the generated URL to invite the bot to your server

### 2. Set Environment Variables

Edit `frontend/.env.local` (already updated by migration):

```env
DISCORD_BOT_TOKEN=your_bot_token_from_developer_portal
DISCORD_INTERNAL_SECRET=any_random_secret_string
```

The `DISCORD_INTERNAL_SECRET` is a shared secret used to authenticate
requests from the bot to the Next.js API. It can be any random string.

### 3. Install Dependencies

```bash
cd discord-service
npm install
```

### 4. Run the Bot

```bash
# Make sure the Next.js app is running first
cd frontend && npm run dev

# Then in a separate terminal:
cd discord-service && node bot.js
```

---

## Database Migration

Before running the bot, apply the Supabase migration:

```sql
-- Run this in the Supabase SQL editor or psql:
-- backend/supabase/008_discord_integration.sql
```

This creates two new tables (additive, no existing tables modified):
- `connected_accounts` — links Discord users to platform users
- `discord_activity` — append-only log of all Discord events

---

## Event Points

| Event | Points |
|---|---|
| `message` | 2 |
| `reaction` *(future)* | 1 |
| `join` *(future)* | 5 |
| `voice` *(future)* | 3/min |

---

## Leaderboard Query

```sql
SELECT user_id, SUM(points) AS score
FROM discord_activity
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY score DESC;
```

---

## Future Extensions

- **Connect Discord button** — OAuth flow writes to `connected_accounts`, retroactively credits `discord_activity` rows with `user_id = null`
- **Merge into engagement score** — JOIN `discord_activity` with `point_transactions`
- **Show Discord badge** in fan/creator dashboard

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `DISCORD_BOT_TOKEN is not set` | Add the token to `frontend/.env.local` |
| `Missing Access` error in Discord | Re-invite the bot with correct permissions |
| `MessageContent` intent error | Enable **Message Content Intent** in the Developer Portal |
| Bot sees no messages | The bot must be in the server and have channel read permission |
