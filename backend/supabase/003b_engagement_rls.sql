-- =============================================
-- 003b: RLS Policies for Engagement Tracking Tables
-- =============================================

-- ========== USER IDENTITIES ==========
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;

-- Users can see their own linked accounts
CREATE POLICY "identities_select_own"
  ON user_identities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own identity links (also done via service_role)
CREATE POLICY "identities_insert_own"
  ON user_identities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own links (unlink)
CREATE POLICY "identities_delete_own"
  ON user_identities FOR DELETE
  USING (auth.uid() = user_id);


-- ========== LINK CODES ==========
ALTER TABLE link_codes ENABLE ROW LEVEL SECURITY;

-- Users can see their own codes (to show active code in UI)
CREATE POLICY "link_codes_select_own"
  ON link_codes FOR SELECT
  USING (auth.uid() = user_id);

-- No public INSERT/UPDATE — handled by service_role in API routes


-- ========== CREATOR CHANNELS ==========
ALTER TABLE creator_channels ENABLE ROW LEVEL SECURITY;

-- Anyone can read active channels (needed for public channel lists)
CREATE POLICY "creator_channels_select_active"
  ON creator_channels FOR SELECT
  USING (is_active = true);

-- Only the owning creator can insert their channels
CREATE POLICY "creator_channels_insert_own"
  ON creator_channels FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'creator'
    )
  );

-- Only the owning creator can update their channels
CREATE POLICY "creator_channels_update_own"
  ON creator_channels FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Only the owning creator can delete their channels
CREATE POLICY "creator_channels_delete_own"
  ON creator_channels FOR DELETE
  USING (auth.uid() = creator_id);


-- ========== ENGAGEMENT LOGS ==========
ALTER TABLE engagement_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own engagement
CREATE POLICY "eng_logs_select_own"
  ON engagement_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Creators can see engagement in their communities
CREATE POLICY "eng_logs_select_creator"
  ON engagement_logs FOR SELECT
  USING (auth.uid() = creator_id);

-- No public INSERT/UPDATE/DELETE — only via service_role from bot API routes

-- Protect ledger: no public mutations on engagement_logs
REVOKE UPDATE, DELETE ON engagement_logs FROM public, anon, authenticated;
