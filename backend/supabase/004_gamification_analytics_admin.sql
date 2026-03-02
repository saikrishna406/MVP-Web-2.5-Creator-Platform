-- =============================================
-- Stage 5: GAMIFICATION ENGINE
-- =============================================

-- 5.1: reward_action() — Award points with daily cap, cooldown, account age
CREATE OR REPLACE FUNCTION reward_action(
  p_user_id UUID,
  p_action VARCHAR,
  p_points INTEGER,
  p_daily_limit INTEGER,
  p_description VARCHAR,
  p_reference_id UUID DEFAULT NULL,
  p_cooldown_minutes INTEGER DEFAULT 0
)
RETURNS TABLE(success BOOLEAN, points_earned INTEGER, daily_remaining INTEGER) AS $$
DECLARE
  v_today_sum INTEGER;
  v_today_count INTEGER;
  v_last_action TIMESTAMPTZ;
  v_account_created TIMESTAMPTZ;
  v_min_age_hours INTEGER;
  v_balance_before INTEGER;
  v_balance_after INTEGER;
BEGIN
  PERFORM check_maintenance_mode();

  IF p_points <= 0 THEN
    RAISE EXCEPTION 'reward_action: points must be positive';
  END IF;

  -- 5.3: Check minimum account age
  SELECT created_at INTO v_account_created
  FROM auth.users WHERE id = p_user_id;

  SELECT (value)::integer INTO v_min_age_hours
  FROM system_settings WHERE key = 'min_account_age_hours';

  IF v_min_age_hours IS NOT NULL AND v_account_created IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (NOW() - v_account_created)) / 3600 < v_min_age_hours THEN
      RETURN QUERY SELECT false, 0, 0;
      RETURN;
    END IF;
  END IF;

  -- Lock wallet to prevent race conditions (FOR UPDATE)
  SELECT w.points_balance INTO v_balance_before
  FROM wallets w WHERE w.user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reward_action: wallet not found for user %', p_user_id;
  END IF;

  -- Daily cap: use SUM + COUNT with FOR UPDATE on daily_rewards
  SELECT COALESCE(SUM(points_earned), 0), COUNT(*)
  INTO v_today_sum, v_today_count
  FROM daily_rewards
  WHERE user_id = p_user_id
    AND action = p_action
    AND date = CURRENT_DATE;

  IF v_today_count >= p_daily_limit THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  -- Cooldown check
  IF p_cooldown_minutes > 0 THEN
    SELECT MAX(created_at) INTO v_last_action
    FROM daily_rewards
    WHERE user_id = p_user_id AND action = p_action;

    IF v_last_action IS NOT NULL
       AND EXTRACT(EPOCH FROM (NOW() - v_last_action)) / 60 < p_cooldown_minutes THEN
      RETURN QUERY SELECT false, 0, (p_daily_limit - v_today_count);
      RETURN;
    END IF;
  END IF;

  v_balance_after := v_balance_before + p_points;

  -- Update wallet
  UPDATE wallets
  SET points_balance = v_balance_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record daily reward (UNIQUE index prevents dupes for once-per-day actions)
  INSERT INTO daily_rewards (user_id, action, points_earned, date)
  VALUES (p_user_id, p_action, p_points, CURRENT_DATE);

  -- Ledger entry
  INSERT INTO point_transactions (
    user_id, amount, type, action, description, reference_id,
    balance_before, balance_after
  ) VALUES (
    p_user_id, p_points, 'earn', p_action, p_description, p_reference_id,
    v_balance_before, v_balance_after
  );

  RETURN QUERY SELECT true, p_points, (p_daily_limit - v_today_count - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Stage 7: ANALYTICS — Materialized Views
-- =============================================

-- 7.1a: Creator revenue summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_creator_revenue AS
SELECT
  p.creator_id,
  pr.username,
  pr.display_name,
  COUNT(DISTINCT pu.id) AS total_unlocks,
  COALESCE(SUM(pu.tokens_spent), 0) AS total_tokens_earned,
  COUNT(DISTINCT pu.user_id) AS unique_fans,
  COUNT(DISTINCT p.id) AS total_posts
FROM posts p
JOIN profiles pr ON pr.user_id = p.creator_id
LEFT JOIN post_unlocks pu ON pu.post_id = p.id
GROUP BY p.creator_id, pr.username, pr.display_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_creator_rev ON mv_creator_revenue(creator_id);

-- 7.1b: Daily token sales
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_token_sales AS
SELECT
  DATE(tt.created_at) AS sale_date,
  COUNT(*) AS transaction_count,
  SUM(tt.amount) AS total_tokens_sold,
  COUNT(DISTINCT tt.user_id) AS unique_buyers
FROM token_transactions tt
WHERE tt.type = 'purchase' AND tt.amount > 0
GROUP BY DATE(tt.created_at)
ORDER BY sale_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales ON mv_daily_token_sales(sale_date);

-- Refresh function (called by cron)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_creator_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_token_sales;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Stage 8: ADMIN CONTROLS
-- =============================================

-- 8.1: admin_adjust_balance()
CREATE OR REPLACE FUNCTION admin_adjust_balance(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_currency VARCHAR,  -- 'tokens' or 'points'
  p_amount INTEGER,     -- positive=credit, negative=debit
  p_reason TEXT
)
RETURNS TABLE(success BOOLEAN, balance_before INTEGER, balance_after INTEGER) AS $$
DECLARE
  v_admin_role VARCHAR;
  v_bal_before INTEGER;
  v_bal_after INTEGER;
  v_type VARCHAR;
BEGIN
  -- Verify admin
  SELECT role INTO v_admin_role
  FROM profiles WHERE user_id = p_admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'admin_adjust_balance: caller % is not admin', p_admin_id;
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'admin_adjust_balance: amount cannot be zero';
  END IF;

  IF p_currency = 'tokens' THEN
    SELECT token_balance INTO v_bal_before
    FROM wallets WHERE user_id = p_target_user_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Wallet not found for user %', p_target_user_id;
    END IF;

    v_bal_after := v_bal_before + p_amount;
    IF v_bal_after < 0 THEN
      RAISE EXCEPTION 'Cannot reduce token balance below zero';
    END IF;

    UPDATE wallets SET token_balance = v_bal_after, updated_at = NOW()
    WHERE user_id = p_target_user_id;

    v_type := CASE WHEN p_amount > 0 THEN 'admin_credit' ELSE 'admin_debit' END;

    INSERT INTO token_transactions (
      user_id, amount, type, description,
      idempotency_key, balance_before, balance_after
    ) VALUES (
      p_target_user_id, p_amount, v_type,
      format('Admin adjustment by %s: %s', p_admin_id, p_reason),
      'admin_' || gen_random_uuid()::text, v_bal_before, v_bal_after
    );

  ELSIF p_currency = 'points' THEN
    SELECT points_balance INTO v_bal_before
    FROM wallets WHERE user_id = p_target_user_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Wallet not found for user %', p_target_user_id;
    END IF;

    v_bal_after := v_bal_before + p_amount;
    IF v_bal_after < 0 THEN
      RAISE EXCEPTION 'Cannot reduce points balance below zero';
    END IF;

    UPDATE wallets SET points_balance = v_bal_after, updated_at = NOW()
    WHERE user_id = p_target_user_id;

    v_type := CASE WHEN p_amount > 0 THEN 'admin_credit' ELSE 'admin_debit' END;

    INSERT INTO point_transactions (
      user_id, amount, type, action, description,
      idempotency_key, balance_before, balance_after
    ) VALUES (
      p_target_user_id, p_amount, v_type, 'admin_adjustment',
      format('Admin adjustment by %s: %s', p_admin_id, p_reason),
      'admin_' || gen_random_uuid()::text, v_bal_before, v_bal_after
    );
  ELSE
    RAISE EXCEPTION 'Invalid currency: %. Must be tokens or points', p_currency;
  END IF;

  -- Log to suspicious activity for audit trail
  INSERT INTO suspicious_activity_logs (
    user_id, activity_type, severity, description, metadata
  ) VALUES (
    p_target_user_id, 'admin_balance_adjustment', 'medium',
    format('Balance adjusted by admin %s: %s %s (%s)', p_admin_id, p_amount, p_currency, p_reason),
    jsonb_build_object(
      'admin_id', p_admin_id,
      'currency', p_currency,
      'amount', p_amount,
      'balance_before', v_bal_before,
      'balance_after', v_bal_after,
      'reason', p_reason
    )
  );

  RETURN QUERY SELECT true, v_bal_before, v_bal_after;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Stage 9: RECONCILIATION
-- =============================================

-- 9.1: Reconciliation query — compares SUM(ledger) vs wallet balance
CREATE OR REPLACE FUNCTION reconcile_balances()
RETURNS TABLE(
  user_id UUID,
  wallet_token_balance INTEGER,
  ledger_token_sum BIGINT,
  token_mismatch BOOLEAN,
  wallet_points_balance INTEGER,
  ledger_points_sum BIGINT,
  points_mismatch BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.user_id,
    w.token_balance,
    COALESCE(tt.token_sum, 0)::BIGINT AS ledger_token_sum,
    (w.token_balance != COALESCE(tt.token_sum, 0)) AS token_mismatch,
    w.points_balance,
    COALESCE(pt.points_sum, 0)::BIGINT AS ledger_points_sum,
    (w.points_balance != COALESCE(pt.points_sum, 0)) AS points_mismatch
  FROM wallets w
  LEFT JOIN (
    SELECT t.user_id AS uid, SUM(t.amount) AS token_sum
    FROM token_transactions t GROUP BY t.user_id
  ) tt ON tt.uid = w.user_id
  LEFT JOIN (
    SELECT p.user_id AS uid, SUM(p.amount) AS points_sum
    FROM point_transactions p GROUP BY p.user_id
  ) pt ON pt.uid = w.user_id
  WHERE w.token_balance != COALESCE(tt.token_sum, 0)
     OR w.points_balance != COALESCE(pt.points_sum, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
