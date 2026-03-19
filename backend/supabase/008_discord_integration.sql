-- =============================================
-- Migration 008: Discord Integration (v2)
-- =============================================
-- Additive only — DOES NOT modify any existing table.
-- Safe to run on a live database.
-- Run in Supabase SQL Editor or via psql.
-- =============================================

-- =============================================
-- TABLE 1: connected_accounts
-- =============================================
-- Links Discord (and future) platform accounts to platform profiles.
-- user_id → profiles(id) — follows the platform identity model.
-- UNIQUE (platform, platform_user_id) prevents duplicate links.
-- =============================================

CREATE TABLE IF NOT EXISTS connected_accounts (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  platform         TEXT        NOT NULL,
  platform_user_id TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user
  ON connected_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_platform_user
  ON connected_accounts(platform, platform_user_id);

COMMENT ON TABLE connected_accounts IS
  'External platform account links (Discord, Twitter, etc.). '
  'Populated when a user completes the OAuth linking flow.';

-- =============================================
-- TABLE 2: discord_activity
-- =============================================
-- Append-only event log, written ONLY for linked users.
-- user_id is required here (NOT NULL) — unlinked Discord users
-- are ignored at the API layer before reaching this table.
-- =============================================

CREATE TABLE IF NOT EXISTS discord_activity (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  discord_user_id  TEXT        NOT NULL,
  guild_id         TEXT,
  event_type       TEXT,
  points           INTEGER     NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_activity_discord_user
  ON discord_activity(discord_user_id);

CREATE INDEX IF NOT EXISTS idx_discord_activity_user
  ON discord_activity(user_id);

CREATE INDEX IF NOT EXISTS idx_discord_activity_created
  ON discord_activity(created_at DESC);

COMMENT ON TABLE discord_activity IS
  'Append-only Discord event log. Only contains rows for linked (known) users. '
  'Unlinked Discord accounts are discarded at the API layer.';

-- =============================================
-- TABLE 3: user_engagement_scores
-- =============================================
-- Aggregated score table — one row per user.
-- Updated atomically via the increment_discord_points() RPC.
-- Separating aggregation here keeps leaderboard queries fast
-- without scanning the full discord_activity log.
--
-- Leaderboard query (ready to use):
--   SELECT user_id, discord_points
--   FROM user_engagement_scores
--   ORDER BY discord_points DESC;
-- =============================================

CREATE TABLE IF NOT EXISTS user_engagement_scores (
  user_id        UUID        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  discord_points INTEGER     NOT NULL DEFAULT 0 CHECK (discord_points >= 0),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_engagement_scores IS
  'Aggregated engagement scores per user. discord_points is updated atomically '
  'via the increment_discord_points() RPC on every Discord event.';

-- =============================================
-- RPC: increment_discord_points
-- =============================================
-- Atomically upserts user_engagement_scores.
-- Called by /api/discord/activity after each valid event.
--
-- Usage:
--   SELECT increment_discord_points('user-uuid', 2);
-- =============================================

CREATE OR REPLACE FUNCTION increment_discord_points(
  user_id_input UUID,
  points_input  INT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_engagement_scores (user_id, discord_points, updated_at)
  VALUES (user_id_input, points_input, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    discord_points = user_engagement_scores.discord_points + EXCLUDED.discord_points,
    updated_at     = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_discord_points IS
  'Atomically increments the discord_points for a user in user_engagement_scores. '
  'Uses SECURITY DEFINER so it can run with elevated privileges via the service role.';

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE connected_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_activity       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_scores ENABLE ROW LEVEL SECURITY;

-- connected_accounts: users can only read their own rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'connected_accounts'
      AND policyname = 'Users can view own connected accounts'
  ) THEN
    CREATE POLICY "Users can view own connected accounts"
      ON connected_accounts FOR SELECT TO authenticated
      USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- discord_activity: users can only read their own events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'discord_activity'
      AND policyname = 'Users can view own discord activity'
  ) THEN
    CREATE POLICY "Users can view own discord activity"
      ON discord_activity FOR SELECT TO authenticated
      USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- user_engagement_scores: users can only read their own score
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_engagement_scores'
      AND policyname = 'Users can view own engagement score'
  ) THEN
    CREATE POLICY "Users can view own engagement score"
      ON user_engagement_scores FOR SELECT TO authenticated
      USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;
