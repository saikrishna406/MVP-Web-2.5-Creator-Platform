-- =============================================
-- Production-Grade Creator Platform Schema
-- Stage 1: Database Foundation
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(10) NOT NULL CHECK (role IN ('fan', 'creator', 'admin')),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =============================================
-- 2. WALLETS TABLE
-- =============================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  token_balance INTEGER NOT NULL DEFAULT 0 CHECK (token_balance >= 0),
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- =============================================
-- 3. TOKEN TRANSACTIONS (Append-Only Ledger)
-- =============================================
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'spend', 'refund', 'admin_credit', 'admin_debit')),
  description TEXT NOT NULL,
  reference_id UUID,
  stripe_session_id VARCHAR(200),
  idempotency_key VARCHAR(200) UNIQUE,
  balance_before INTEGER,
  balance_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_tx_user ON token_transactions(user_id);
CREATE INDEX idx_token_tx_stripe ON token_transactions(stripe_session_id);
CREATE INDEX idx_token_tx_idemp ON token_transactions(idempotency_key);
CREATE INDEX idx_token_tx_created ON token_transactions(created_at DESC);

-- =============================================
-- 4. POINT TRANSACTIONS (Append-Only Ledger)
-- =============================================
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('earn', 'spend', 'admin_credit', 'admin_debit')),
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  idempotency_key VARCHAR(200) UNIQUE,
  balance_before INTEGER,
  balance_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_point_tx_user ON point_transactions(user_id);
CREATE INDEX idx_point_tx_action ON point_transactions(action);
CREATE INDEX idx_point_tx_idemp ON point_transactions(idempotency_key);
CREATE INDEX idx_point_tx_created ON point_transactions(created_at DESC);

-- =============================================
-- 5. TOKEN PACKAGES TABLE
-- =============================================
CREATE TABLE token_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  token_amount INTEGER NOT NULL CHECK (token_amount > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  stripe_price_id VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO token_packages (name, description, token_amount, price_cents, sort_order) VALUES
  ('Starter', 'Perfect for trying out the platform', 100, 499, 1),
  ('Popular', 'Most popular choice for fans', 500, 1999, 2),
  ('Pro', 'Best value for dedicated supporters', 1200, 3999, 3),
  ('Whale', 'Maximum tokens for power users', 5000, 14999, 4);

-- =============================================
-- 6. POSTS TABLE
-- =============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  access_type VARCHAR(20) NOT NULL DEFAULT 'public'
    CHECK (access_type IN ('public', 'token_gated', 'threshold_gated')),
  token_cost INTEGER NOT NULL DEFAULT 0 CHECK (token_cost >= 0),
  threshold_amount INTEGER NOT NULL DEFAULT 0 CHECK (threshold_amount >= 0),
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_creator ON posts(creator_id);
CREATE INDEX idx_posts_access ON posts(access_type);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- =============================================
-- 7. POST UNLOCKS TABLE
-- =============================================
CREATE TABLE post_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  tokens_spent INTEGER NOT NULL DEFAULT 0 CHECK (tokens_spent >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_unlocks_user ON post_unlocks(user_id);
CREATE INDEX idx_unlocks_post ON post_unlocks(post_id);

-- =============================================
-- 8. POST LIKES TABLE
-- =============================================
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_likes_post ON post_likes(post_id);

-- =============================================
-- 9. POST COMMENTS TABLE
-- =============================================
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON post_comments(post_id);

-- =============================================
-- 10. REDEMPTION ITEMS TABLE
-- =============================================
CREATE TABLE redemption_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  point_cost INTEGER NOT NULL CHECK (point_cost > 0),
  quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_redemption_items_creator ON redemption_items(creator_id);

-- =============================================
-- 11. REDEMPTION ORDERS TABLE
-- =============================================
CREATE TABLE redemption_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES redemption_items(id) ON DELETE CASCADE NOT NULL,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON redemption_orders(user_id);
CREATE INDEX idx_orders_item ON redemption_orders(item_id);
CREATE INDEX idx_orders_status ON redemption_orders(status);

-- =============================================
-- 12. DAILY REWARDS TABLE
-- =============================================
CREATE TABLE daily_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL,
  points_earned INTEGER NOT NULL CHECK (points_earned > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_user_date ON daily_rewards(user_id, date);
CREATE UNIQUE INDEX idx_daily_unique ON daily_rewards(user_id, action, date);

-- =============================================
-- 13. STRIPE EVENTS TABLE (Idempotency)
-- =============================================
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id VARCHAR(200) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_stripe_event_id ON stripe_events(stripe_event_id);
CREATE INDEX idx_stripe_processed ON stripe_events(processed);

-- =============================================
-- 14. SUSPICIOUS ACTIVITY LOGS TABLE
-- =============================================
CREATE TABLE suspicious_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  endpoint VARCHAR(200),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suspicious_user ON suspicious_activity_logs(user_id);
CREATE INDEX idx_suspicious_type ON suspicious_activity_logs(activity_type);
CREATE INDEX idx_suspicious_severity ON suspicious_activity_logs(severity);
CREATE INDEX idx_suspicious_created ON suspicious_activity_logs(created_at DESC);

-- =============================================
-- 15. SYSTEM SETTINGS TABLE (Stage 8)
-- =============================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT 'null',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'When true, all financial operations are disabled'),
  ('max_daily_points', '500', 'Maximum points a user can earn per day'),
  ('min_account_age_hours', '24', 'Minimum account age in hours for gamification');

-- =============================================
-- TRIGGERS: auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_redemption_items_updated BEFORE UPDATE ON redemption_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_redemption_orders_updated BEFORE UPDATE ON redemption_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
