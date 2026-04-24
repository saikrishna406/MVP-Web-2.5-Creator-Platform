-- =============================================
-- 003: MULTI-PLATFORM ENGAGEMENT TRACKING
-- Phase 1 Foundation — Identity + Channel Mapping + Event Logging
-- =============================================
-- This migration adds the foundation for tracking user engagement
-- across external platforms (Discord, Telegram).
-- It does NOT modify any existing tables or the wallet system.
-- =============================================

-- ─────────────────────────────────────────────
-- TABLE 1: user_identities
-- Maps external platform accounts → internal platform user_id
-- ─────────────────────────────────────────────
CREATE TABLE user_identities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform          VARCHAR(20) NOT NULL CHECK (platform IN ('discord', 'telegram')),
  external_user_id  VARCHAR(100) NOT NULL,
  external_username VARCHAR(100),
  linked_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each external account can only be linked to ONE platform user
  UNIQUE (platform, external_user_id)
);

-- Fast lookup: "given this Discord user, who are they on our platform?"
CREATE INDEX idx_identities_lookup ON user_identities(platform, external_user_id);
-- Fast lookup: "what accounts has this user linked?"
CREATE INDEX idx_identities_user ON user_identities(user_id);


-- ─────────────────────────────────────────────
-- TABLE 2: link_codes
-- Temporary one-time codes for identity linking
-- Flow: User generates code on web → sends to bot → bot verifies
-- ─────────────────────────────────────────────
CREATE TABLE link_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform    VARCHAR(20) NOT NULL DEFAULT 'discord'
              CHECK (platform IN ('discord', 'telegram')),
  code        VARCHAR(20) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used        BOOLEAN NOT NULL DEFAULT false,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup when bot sends a code to verify
CREATE INDEX idx_link_codes_code ON link_codes(code);
-- Lookup existing codes for a user+platform (to invalidate old ones)
CREATE INDEX idx_link_codes_user_platform ON link_codes(user_id, platform);


-- ─────────────────────────────────────────────
-- TABLE 3: creator_channels
-- Maps external channels/guilds/groups → creator_id
-- When a bot event arrives, we look up which creator it belongs to
-- ─────────────────────────────────────────────
CREATE TABLE creator_channels (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform            VARCHAR(20) NOT NULL CHECK (platform IN ('discord', 'telegram')),
  external_channel_id VARCHAR(100) NOT NULL,
  channel_name        VARCHAR(200),
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each external channel belongs to exactly ONE creator
  UNIQUE (platform, external_channel_id)
);

-- Fast lookup: "which creator does this guild/chat belong to?"
CREATE INDEX idx_creator_channels_lookup ON creator_channels(platform, external_channel_id);
-- List all channels for a creator
CREATE INDEX idx_creator_channels_creator ON creator_channels(creator_id);


-- ─────────────────────────────────────────────
-- TABLE 4: engagement_logs
-- Immutable append-only event log (audit trail)
-- Every event from every platform lands here, even if the user
-- is not yet linked. Idempotency is enforced via external_event_id.
-- ─────────────────────────────────────────────
CREATE TABLE engagement_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform            VARCHAR(20) NOT NULL CHECK (platform IN ('discord', 'telegram')),
  external_user_id    VARCHAR(100) NOT NULL,
  external_channel_id VARCHAR(100) NOT NULL,
  external_event_id   VARCHAR(255) UNIQUE NOT NULL,
  action_type         VARCHAR(50) NOT NULL,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency: fast duplicate check
CREATE INDEX idx_eng_logs_event_id ON engagement_logs(external_event_id);
-- Query: "all engagement for a specific creator"
CREATE INDEX idx_eng_logs_creator ON engagement_logs(creator_id);
-- Query: "all engagement for a specific user across creators"
CREATE INDEX idx_eng_logs_user ON engagement_logs(user_id);
-- Query: filter by platform
CREATE INDEX idx_eng_logs_platform ON engagement_logs(platform);
-- Query: recent events
CREATE INDEX idx_eng_logs_created ON engagement_logs(created_at DESC);
-- Query: lookup by external user (useful when linking retroactively)
CREATE INDEX idx_eng_logs_ext_user ON engagement_logs(platform, external_user_id);
