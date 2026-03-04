-- =============================================
-- Stage 3: LEDGER-FIRST FINANCIAL ENGINE
-- All functions run as SECURITY DEFINER (service-role level)
-- =============================================

-- =============================================
-- Helper: Check maintenance mode
-- =============================================
CREATE OR REPLACE FUNCTION check_maintenance_mode()
RETURNS VOID AS $$
DECLARE
  v_maintenance BOOLEAN;
BEGIN
  SELECT (value)::boolean INTO v_maintenance
  FROM system_settings
  WHERE key = 'maintenance_mode';

  IF v_maintenance IS TRUE THEN
    RAISE EXCEPTION 'System is in maintenance mode. Financial operations are disabled.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3.1a: credit_tokens()
-- Credits tokens to a user's wallet with ledger entry
-- =============================================
CREATE OR REPLACE FUNCTION credit_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_type VARCHAR DEFAULT 'purchase',
  p_description TEXT DEFAULT 'Token credit',
  p_reference_id UUID DEFAULT NULL,
  p_stripe_session_id VARCHAR DEFAULT NULL,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, tx_id UUID) AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_tx_id UUID;
  v_existing UUID;
BEGIN
  -- Maintenance check
  PERFORM check_maintenance_mode();

  -- Validate
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'credit_tokens: amount must be positive, got %', p_amount;
  END IF;

  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM token_transactions
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing IS NOT NULL THEN
      -- Already processed — return existing result safely
      SELECT w.token_balance INTO v_balance_after
      FROM wallets w WHERE w.user_id = p_user_id;

      RETURN QUERY SELECT true, v_balance_after, v_existing;
      RETURN;
    END IF;
  END IF;

  -- Lock wallet row (FOR UPDATE prevents concurrent modification)
  SELECT w.token_balance INTO v_balance_before
  FROM wallets w
  WHERE w.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'credit_tokens: wallet not found for user %', p_user_id;
  END IF;

  v_balance_after := v_balance_before + p_amount;

  -- Update wallet
  UPDATE wallets
  SET token_balance = v_balance_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Insert ledger entry
  INSERT INTO token_transactions (
    user_id, amount, type, description, reference_id,
    stripe_session_id, idempotency_key, balance_before, balance_after
  ) VALUES (
    p_user_id, p_amount, p_type, p_description, p_reference_id,
    p_stripe_session_id, p_idempotency_key, v_balance_before, v_balance_after
  ) RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT true, v_balance_after, v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3.1b: spend_tokens()
-- Deducts tokens with non-negative balance enforcement
-- =============================================
CREATE OR REPLACE FUNCTION spend_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Token spend',
  p_reference_id UUID DEFAULT NULL,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, tx_id UUID) AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_tx_id UUID;
  v_existing UUID;
BEGIN
  PERFORM check_maintenance_mode();

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'spend_tokens: amount must be positive, got %', p_amount;
  END IF;

  -- Idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM token_transactions
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing IS NOT NULL THEN
      SELECT w.token_balance INTO v_balance_after
      FROM wallets w WHERE w.user_id = p_user_id;
      RETURN QUERY SELECT true, v_balance_after, v_existing;
      RETURN;
    END IF;
  END IF;

  -- Lock wallet
  SELECT w.token_balance INTO v_balance_before
  FROM wallets w
  WHERE w.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'spend_tokens: wallet not found for user %', p_user_id;
  END IF;

  IF v_balance_before < p_amount THEN
    RETURN QUERY SELECT false, v_balance_before, NULL::UUID;
    RETURN;
  END IF;

  v_balance_after := v_balance_before - p_amount;

  UPDATE wallets
  SET token_balance = v_balance_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO token_transactions (
    user_id, amount, type, description, reference_id,
    idempotency_key, balance_before, balance_after
  ) VALUES (
    p_user_id, -p_amount, 'spend', p_description, p_reference_id,
    p_idempotency_key, v_balance_before, v_balance_after
  ) RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT true, v_balance_after, v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3.1c: credit_points()
-- =============================================
CREATE OR REPLACE FUNCTION credit_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_action VARCHAR DEFAULT 'manual',
  p_description TEXT DEFAULT 'Points credit',
  p_reference_id UUID DEFAULT NULL,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, tx_id UUID) AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_tx_id UUID;
  v_existing UUID;
BEGIN
  PERFORM check_maintenance_mode();

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'credit_points: amount must be positive, got %', p_amount;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM point_transactions WHERE idempotency_key = p_idempotency_key;
    IF v_existing IS NOT NULL THEN
      SELECT w.points_balance INTO v_balance_after
      FROM wallets w WHERE w.user_id = p_user_id;
      RETURN QUERY SELECT true, v_balance_after, v_existing;
      RETURN;
    END IF;
  END IF;

  SELECT w.points_balance INTO v_balance_before
  FROM wallets w WHERE w.user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'credit_points: wallet not found for user %', p_user_id;
  END IF;

  v_balance_after := v_balance_before + p_amount;

  UPDATE wallets
  SET points_balance = v_balance_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO point_transactions (
    user_id, amount, type, action, description, reference_id,
    idempotency_key, balance_before, balance_after
  ) VALUES (
    p_user_id, p_amount, 'earn', p_action, p_description, p_reference_id,
    p_idempotency_key, v_balance_before, v_balance_after
  ) RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT true, v_balance_after, v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3.1d: spend_points()
-- =============================================
CREATE OR REPLACE FUNCTION spend_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_action VARCHAR DEFAULT 'manual',
  p_description TEXT DEFAULT 'Points spend',
  p_reference_id UUID DEFAULT NULL,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, tx_id UUID) AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_tx_id UUID;
  v_existing UUID;
BEGIN
  PERFORM check_maintenance_mode();

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'spend_points: amount must be positive, got %', p_amount;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM point_transactions WHERE idempotency_key = p_idempotency_key;
    IF v_existing IS NOT NULL THEN
      SELECT w.points_balance INTO v_balance_after
      FROM wallets w WHERE w.user_id = p_user_id;
      RETURN QUERY SELECT true, v_balance_after, v_existing;
      RETURN;
    END IF;
  END IF;

  SELECT w.points_balance INTO v_balance_before
  FROM wallets w WHERE w.user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'spend_points: wallet not found for user %', p_user_id;
  END IF;

  IF v_balance_before < p_amount THEN
    RETURN QUERY SELECT false, v_balance_before, NULL::UUID;
    RETURN;
  END IF;

  v_balance_after := v_balance_before - p_amount;

  UPDATE wallets
  SET points_balance = v_balance_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO point_transactions (
    user_id, amount, type, action, description, reference_id,
    idempotency_key, balance_before, balance_after
  ) VALUES (
    p_user_id, -p_amount, 'spend', p_action, p_description, p_reference_id,
    p_idempotency_key, v_balance_before, v_balance_after
  ) RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT true, v_balance_after, v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3.2: unlock_post() — Atomic post unlock
-- Deducts tokens + inserts unlock in single TX
-- =============================================
CREATE OR REPLACE FUNCTION unlock_post(
  p_user_id UUID,
  p_post_id UUID,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, tokens_spent INTEGER, already_unlocked BOOLEAN) AS $$
DECLARE
  v_post RECORD;
  v_existing_unlock UUID;
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_cost INTEGER;
BEGIN
  PERFORM check_maintenance_mode();

  -- Check if already unlocked
  SELECT id INTO v_existing_unlock
  FROM post_unlocks
  WHERE user_id = p_user_id AND post_id = p_post_id;

  IF v_existing_unlock IS NOT NULL THEN
    RETURN QUERY SELECT true, 0, true;
    RETURN;
  END IF;

  -- Get post details
  SELECT access_type, token_cost, threshold_amount INTO v_post
  FROM posts WHERE id = p_post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unlock_post: post % not found', p_post_id;
  END IF;

  IF v_post.access_type = 'public' THEN
    RETURN QUERY SELECT true, 0, false;
    RETURN;
  END IF;

  -- Lock wallet
  SELECT w.token_balance INTO v_balance_before
  FROM wallets w WHERE w.user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unlock_post: wallet not found for user %', p_user_id;
  END IF;

  IF v_post.access_type = 'threshold_gated' THEN
    -- Threshold: just check balance, don't deduct
    IF v_balance_before < v_post.threshold_amount THEN
      RETURN QUERY SELECT false, 0, false;
      RETURN;
    END IF;
    v_cost := 0;
  ELSE
    -- Token gated: deduct tokens
    v_cost := v_post.token_cost;
    IF v_balance_before < v_cost THEN
      RETURN QUERY SELECT false, 0, false;
      RETURN;
    END IF;

    v_balance_after := v_balance_before - v_cost;

    UPDATE wallets
    SET token_balance = v_balance_after, updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Ledger entry
    INSERT INTO token_transactions (
      user_id, amount, type, description, reference_id,
      idempotency_key, balance_before, balance_after
    ) VALUES (
      p_user_id, -v_cost, 'spend', 'Unlocked post', p_post_id,
      p_idempotency_key, v_balance_before, v_balance_after
    );
  END IF;

  -- Insert unlock record
  INSERT INTO post_unlocks (user_id, post_id, tokens_spent)
  VALUES (p_user_id, p_post_id, v_cost)
  ON CONFLICT (user_id, post_id) DO NOTHING;

  RETURN QUERY SELECT true, v_cost, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3.3: redeem_item() — Atomic item redemption
-- Deducts points + decrements stock + creates order
-- =============================================
CREATE OR REPLACE FUNCTION redeem_item(
  p_user_id UUID,
  p_item_id UUID,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, points_spent INTEGER, order_id UUID) AS $$
DECLARE
  v_item RECORD;
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_order_id UUID;
  v_existing UUID;
BEGIN
  PERFORM check_maintenance_mode();

  -- Idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM point_transactions WHERE idempotency_key = p_idempotency_key;
    IF v_existing IS NOT NULL THEN
      SELECT ro.id, ro.points_spent INTO v_order_id, v_balance_before
      FROM redemption_orders ro
      WHERE ro.user_id = p_user_id
      ORDER BY ro.created_at DESC LIMIT 1;
      RETURN QUERY SELECT true, v_balance_before, v_order_id;
      RETURN;
    END IF;
  END IF;

  -- Lock item row to check stock
  SELECT point_cost, quantity_available, is_active INTO v_item
  FROM redemption_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'redeem_item: item % not found', p_item_id;
  END IF;

  IF NOT v_item.is_active THEN
    RETURN QUERY SELECT false, 0, NULL::UUID;
    RETURN;
  END IF;

  IF v_item.quantity_available <= 0 THEN
    RETURN QUERY SELECT false, 0, NULL::UUID;
    RETURN;
  END IF;

  -- Lock wallet
  SELECT w.points_balance INTO v_balance_before
  FROM wallets w WHERE w.user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'redeem_item: wallet not found for user %', p_user_id;
  END IF;

  IF v_balance_before < v_item.point_cost THEN
    RETURN QUERY SELECT false, 0, NULL::UUID;
    RETURN;
  END IF;

  v_balance_after := v_balance_before - v_item.point_cost;

  -- Deduct points
  UPDATE wallets
  SET points_balance = v_balance_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Decrement stock
  UPDATE redemption_items
  SET quantity_available = quantity_available - 1, updated_at = NOW()
  WHERE id = p_item_id;

  -- Create order
  INSERT INTO redemption_orders (user_id, item_id, points_spent)
  VALUES (p_user_id, p_item_id, v_item.point_cost)
  RETURNING id INTO v_order_id;

  -- Ledger entry
  INSERT INTO point_transactions (
    user_id, amount, type, action, description, reference_id,
    idempotency_key, balance_before, balance_after
  ) VALUES (
    p_user_id, -v_item.point_cost, 'spend', 'redemption',
    'Redeemed store item', p_item_id,
    p_idempotency_key, v_balance_before, v_balance_after
  );

  RETURN QUERY SELECT true, v_item.point_cost, v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
