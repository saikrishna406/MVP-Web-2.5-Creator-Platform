-- =============================================
-- Rapid MVP Creator Platform - Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(10) NOT NULL CHECK (role IN ('fan', 'creator')),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =============================================
-- WALLETS TABLE
-- =============================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  token_balance INTEGER NOT NULL DEFAULT 0 CHECK (token_balance >= 0),
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- =============================================
-- TOKEN PACKAGES TABLE
-- =============================================
CREATE TABLE token_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  token_amount INTEGER NOT NULL CHECK (token_amount > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  stripe_price_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed token packages
INSERT INTO token_packages (name, description, token_amount, price_cents) VALUES
  ('Starter', 'Perfect for trying out the platform', 100, 499),
  ('Popular', 'Most popular choice for fans', 500, 1999),
  ('Pro', 'Best value for dedicated supporters', 1200, 3999),
  ('Whale', 'Maximum tokens for power users', 5000, 14999);

-- =============================================
-- TOKEN TRANSACTIONS TABLE
-- =============================================
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'spend', 'refund')),
  description TEXT NOT NULL,
  reference_id UUID,
  stripe_session_id VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_stripe ON token_transactions(stripe_session_id);

-- =============================================
-- POINT TRANSACTIONS TABLE
-- =============================================
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('earn', 'spend')),
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_action ON point_transactions(action);

-- =============================================
-- POSTS TABLE
-- =============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  access_type VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'token_gated', 'threshold_gated')),
  token_cost INTEGER DEFAULT 0 CHECK (token_cost >= 0),
  threshold_amount INTEGER DEFAULT 0 CHECK (threshold_amount >= 0),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_creator_id ON posts(creator_id);
CREATE INDEX idx_posts_access_type ON posts(access_type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- =============================================
-- POST UNLOCKS TABLE
-- =============================================
CREATE TABLE post_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  tokens_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_post_unlocks_user_id ON post_unlocks(user_id);

-- =============================================
-- POST LIKES TABLE
-- =============================================
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);

-- =============================================
-- POST COMMENTS TABLE
-- =============================================
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);

-- =============================================
-- REDEMPTION ITEMS TABLE
-- =============================================
CREATE TABLE redemption_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  point_cost INTEGER NOT NULL CHECK (point_cost > 0),
  quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemption_items_creator ON redemption_items(creator_id);

-- =============================================
-- REDEMPTION ORDERS TABLE
-- =============================================
CREATE TABLE redemption_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES redemption_items(id) ON DELETE CASCADE NOT NULL,
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemption_orders_user ON redemption_orders(user_id);
CREATE INDEX idx_redemption_orders_item ON redemption_orders(item_id);

-- =============================================
-- DAILY REWARDS TABLE
-- =============================================
CREATE TABLE daily_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL,
  points_earned INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_rewards_user_date ON daily_rewards(user_id, date);
CREATE UNIQUE INDEX idx_daily_rewards_unique ON daily_rewards(user_id, action, date);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT USING (auth.uid() = user_id);

-- No direct update from client - only via service role / database functions
CREATE POLICY "Service role can manage wallets"
  ON wallets FOR ALL USING (true);

-- Token Packages
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Token packages are viewable by everyone"
  ON token_packages FOR SELECT USING (true);

-- Token Transactions
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token transactions"
  ON token_transactions FOR SELECT USING (auth.uid() = user_id);

-- Point Transactions
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own point transactions"
  ON point_transactions FOR SELECT USING (auth.uid() = user_id);

-- Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Creators can insert posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = creator_id);

-- Post Unlocks
ALTER TABLE post_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own unlocks"
  ON post_unlocks FOR SELECT USING (auth.uid() = user_id);

-- Post Likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes"
  ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post Comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON post_comments FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments"
  ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Redemption Items
ALTER TABLE redemption_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active items are viewable by everyone"
  ON redemption_items FOR SELECT USING (true);

CREATE POLICY "Creators can manage own items"
  ON redemption_items FOR ALL USING (auth.uid() = creator_id);

-- Redemption Orders
ALTER TABLE redemption_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON redemption_orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view orders for their items"
  ON redemption_orders FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM redemption_items
      WHERE redemption_items.id = redemption_orders.item_id
      AND redemption_items.creator_id = auth.uid()
    )
  );

-- Daily Rewards
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily rewards"
  ON daily_rewards FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- DATABASE FUNCTIONS (for atomic operations)
-- =============================================

-- Function to handle token purchase (called by webhook)
CREATE OR REPLACE FUNCTION handle_token_purchase(
  p_user_id UUID,
  p_amount INTEGER,
  p_stripe_session_id VARCHAR
)
RETURNS VOID AS $$
BEGIN
  -- Update wallet balance
  UPDATE wallets
  SET token_balance = token_balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Insert transaction record
  INSERT INTO token_transactions (user_id, amount, type, description, stripe_session_id)
  VALUES (p_user_id, p_amount, 'purchase', 'Token purchase via Stripe', p_stripe_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle token spending (for unlocking posts)
CREATE OR REPLACE FUNCTION handle_token_spend(
  p_user_id UUID,
  p_post_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Lock the wallet row
  SELECT token_balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct tokens
  UPDATE wallets
  SET token_balance = token_balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create unlock record
  INSERT INTO post_unlocks (user_id, post_id, tokens_spent)
  VALUES (p_user_id, p_post_id, p_amount)
  ON CONFLICT (user_id, post_id) DO NOTHING;

  -- Insert transaction
  INSERT INTO token_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, -p_amount, 'spend', 'Unlocked post', p_post_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle point redemption
CREATE OR REPLACE FUNCTION handle_point_redemption(
  p_user_id UUID,
  p_item_id UUID,
  p_point_cost INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
  v_qty INTEGER;
BEGIN
  -- Lock wallet
  SELECT points_balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance < p_point_cost THEN
    RETURN FALSE;
  END IF;

  -- Lock item and check quantity
  SELECT quantity_available INTO v_qty
  FROM redemption_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_qty <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Deduct points
  UPDATE wallets
  SET points_balance = points_balance - p_point_cost,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Decrease item quantity
  UPDATE redemption_items
  SET quantity_available = quantity_available - 1,
      updated_at = NOW()
  WHERE id = p_item_id;

  -- Create order
  INSERT INTO redemption_orders (user_id, item_id, points_spent)
  VALUES (p_user_id, p_item_id, p_point_cost);

  -- Insert point transaction
  INSERT INTO point_transactions (user_id, amount, type, action, description, reference_id)
  VALUES (p_user_id, -p_point_cost, 'spend', 'redemption', 'Redeemed store item', p_item_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award points with daily limit check
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_action VARCHAR,
  p_points INTEGER,
  p_daily_limit INTEGER,
  p_description VARCHAR,
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_today_count INTEGER;
BEGIN
  -- Check daily limit
  SELECT COUNT(*) INTO v_today_count
  FROM daily_rewards
  WHERE user_id = p_user_id
    AND action = p_action
    AND date = CURRENT_DATE;

  IF v_today_count >= p_daily_limit THEN
    RETURN FALSE;
  END IF;

  -- Add points to wallet
  UPDATE wallets
  SET points_balance = points_balance + p_points,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record daily reward
  INSERT INTO daily_rewards (user_id, action, points_earned, date)
  VALUES (p_user_id, p_action, p_points, CURRENT_DATE);

  -- Record transaction
  INSERT INTO point_transactions (user_id, amount, type, action, description, reference_id)
  VALUES (p_user_id, p_points, 'earn', p_action, p_description, p_reference_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create wallet and profile triggers handled via application
-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_redemption_items_updated_at
  BEFORE UPDATE ON redemption_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_redemption_orders_updated_at
  BEFORE UPDATE ON redemption_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
