-- =====================================================================
-- Performance Indexes for 100+ Users Scale
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =====================================================================

-- creator_points_agg: leaderboard sorting by creator
CREATE INDEX IF NOT EXISTS idx_creator_points_agg_total_points
  ON creator_points_agg(creator_id, total_points DESC);

-- post_unlocks: fast creator revenue lookup (via joined query)
CREATE INDEX IF NOT EXISTS idx_unlocks_post_user
  ON post_unlocks(post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_unlocks_user_created
  ON post_unlocks(user_id, created_at DESC);

-- post_comments: fast fetch by post
CREATE INDEX IF NOT EXISTS idx_comments_post_created
  ON post_comments(post_id, created_at ASC);

-- post_likes: fast lookup by user (fan's liked posts)
CREATE INDEX IF NOT EXISTS idx_likes_user_post
  ON post_likes(user_id, post_id);

-- redemption_orders: creator filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON redemption_orders(status, created_at DESC);

-- profiles: username + role search (public page)
CREATE INDEX IF NOT EXISTS idx_profiles_username_role
  ON profiles(username, role);

-- posts: efficient creator + time-based queries
CREATE INDEX IF NOT EXISTS idx_posts_creator_created
  ON posts(creator_id, created_at DESC);

-- subscriptions: fan's active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_fan_status
  ON subscriptions(fan_id, status)
  WHERE status = 'active';

-- token_transactions: user's recent history
CREATE INDEX IF NOT EXISTS idx_token_tx_user_created
  ON token_transactions(user_id, created_at DESC);

-- point_transactions: user's recent history
CREATE INDEX IF NOT EXISTS idx_point_tx_user_created
  ON point_transactions(user_id, created_at DESC);

-- daily_rewards: fast daily cap check
CREATE INDEX IF NOT EXISTS idx_daily_user_action_date
  ON daily_rewards(user_id, action, date);

SELECT 'All performance indexes created successfully.' AS status;
