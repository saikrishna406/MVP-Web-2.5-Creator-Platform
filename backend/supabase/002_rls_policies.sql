-- =============================================
-- Stage 2: DATABASE HARDENING — RLS Policies
-- =============================================

-- ========== PROFILES ==========
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========== WALLETS ==========
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can only view their own wallet
CREATE POLICY "wallets_select_own"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE from public — only service_role or SECURITY DEFINER functions
-- (Supabase service_role bypasses RLS automatically)

-- ========== TOKEN TRANSACTIONS (Append-Only Ledger) ==========
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "token_tx_select_own"
  ON token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE from public role

-- ========== POINT TRANSACTIONS (Append-Only Ledger) ==========
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_tx_select_own"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE from public role

-- ========== TOKEN PACKAGES ==========
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_select_active"
  ON token_packages FOR SELECT
  USING (true);

-- Only service_role (admin) can INSERT/UPDATE/DELETE

-- ========== POSTS ==========
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_public"
  ON posts FOR SELECT USING (true);

-- Only creators can insert posts (enforced via profile role check in function)
CREATE POLICY "posts_insert_creator"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'creator'
    )
  );

CREATE POLICY "posts_update_own_creator"
  ON posts FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "posts_delete_own_creator"
  ON posts FOR DELETE
  USING (auth.uid() = creator_id);

-- ========== POST UNLOCKS ==========
ALTER TABLE post_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unlocks_select_own"
  ON post_unlocks FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT only via service_role / SECURITY DEFINER functions

-- ========== POST LIKES ==========
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select_public"
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "likes_insert_own"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ========== POST COMMENTS ==========
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_public"
  ON post_comments FOR SELECT USING (true);

CREATE POLICY "comments_insert_own"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========== REDEMPTION ITEMS ==========
ALTER TABLE redemption_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_select_active"
  ON redemption_items FOR SELECT USING (true);

CREATE POLICY "items_insert_creator"
  ON redemption_items FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'creator'
    )
  );

CREATE POLICY "items_update_own_creator"
  ON redemption_items FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "items_delete_own_creator"
  ON redemption_items FOR DELETE
  USING (auth.uid() = creator_id);

-- ========== REDEMPTION ORDERS ==========
ALTER TABLE redemption_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own"
  ON redemption_orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM redemption_items
      WHERE redemption_items.id = redemption_orders.item_id
      AND redemption_items.creator_id = auth.uid()
    )
  );

-- INSERT only via service_role / SECURITY DEFINER functions

-- ========== DAILY REWARDS ==========
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_select_own"
  ON daily_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT only via service_role / SECURITY DEFINER functions

-- ========== STRIPE EVENTS ==========
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- No public access at all — service_role only

-- ========== SUSPICIOUS ACTIVITY LOGS ==========
ALTER TABLE suspicious_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "suspicious_select_admin"
  ON suspicious_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========== SYSTEM SETTINGS ==========
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_public"
  ON system_settings FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "settings_update_admin"
  ON system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- Step 2.3: REVOKE mutations on ledger tables
-- Prevents any direct UPDATE/DELETE even if RLS is bypassed
-- =============================================
REVOKE UPDATE, DELETE ON token_transactions FROM public, anon, authenticated;
REVOKE UPDATE, DELETE ON point_transactions FROM public, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON wallets FROM public, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON stripe_events FROM public, anon, authenticated;
