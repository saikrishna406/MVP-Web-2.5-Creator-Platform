-- =====================================================================
-- SEED: 100 Fans + 100 Creators (Black Bolts Platform)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- NOTE: This seeds profiles, wallets, posts, unlocks, likes, comments,
--       token/point transactions, and redemption items.
--       It does NOT create auth.users entries — those must exist first,
--       OR you can use the auth.users insert below (service_role only).
-- =====================================================================

-- ── STEP 1: Create 100 Creator auth users ──────────────────────────
DO $$
DECLARE
  i INT;
  uid UUID;
  uname TEXT;
  cats TEXT[] := ARRAY['Gaming','Music','Art','Fitness','Tech','Comedy','Fashion','Food','Travel','Sports'];
  cat TEXT;
BEGIN
  FOR i IN 1..100 LOOP
    uid := gen_random_uuid();
    uname := 'creator' || i;
    cat := cats[1 + ((i-1) % 10)];

    -- Insert into auth.users (requires service_role)
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      uid,
      uname || '@blackbolts-test.com',
      crypt('Test@1234!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', 'Creator ' || i),
      now() - (random() * interval '180 days'),
      now(),
      'authenticated',
      'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

    -- Profile
    INSERT INTO profiles (user_id, username, display_name, bio, role, interests, category)
    VALUES (
      uid,
      uname,
      'Creator ' || i,
      'I am creator ' || i || ', making awesome ' || lower(cat) || ' content. Join my journey! 🔥',
      'creator',
      ARRAY[lower(cat), 'creator', 'community'],
      cat
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Wallet
    INSERT INTO wallets (user_id, token_balance, points_balance)
    VALUES (uid, 0, floor(random() * 500)::int)
    ON CONFLICT (user_id) DO NOTHING;

    -- Token transaction seed for creators
    INSERT INTO token_transactions (user_id, amount, type, description, idempotency_key, balance_before, balance_after)
    VALUES (uid, 0, 'admin_credit', 'Initial creator account setup', 'init_creator_' || uid::text, 0, 0)
    ON CONFLICT (idempotency_key) DO NOTHING;

  END LOOP;
END $$;

-- ── STEP 2: Create 100 Fan auth users ──────────────────────────────
DO $$
DECLARE
  i INT;
  uid UUID;
  uname TEXT;
  token_bal INT;
  point_bal INT;
BEGIN
  FOR i IN 1..100 LOOP
    uid := gen_random_uuid();
    uname := 'fan' || i;
    token_bal := floor(random() * 2000 + 50)::int;
    point_bal := floor(random() * 1000)::int;

    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      uid,
      uname || '@blackbolts-test.com',
      crypt('Test@1234!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', 'Fan ' || i),
      now() - (random() * interval '120 days'),
      now(),
      'authenticated',
      'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

    -- Profile
    INSERT INTO profiles (user_id, username, display_name, bio, role, interests)
    VALUES (
      uid,
      uname,
      'Fan ' || i,
      'Huge fan of amazing creators! Here to support and engage 🙌',
      'fan',
      ARRAY['music', 'gaming', 'art']
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Wallet with tokens
    INSERT INTO wallets (user_id, token_balance, points_balance)
    VALUES (uid, token_bal, point_bal)
    ON CONFLICT (user_id) DO NOTHING;

    -- Token purchase history
    INSERT INTO token_transactions (user_id, amount, type, description, idempotency_key, balance_before, balance_after)
    VALUES (
      uid,
      token_bal,
      'purchase',
      'Token bundle purchase',
      'seed_purchase_' || uid::text,
      0,
      token_bal
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    -- Points earn history
    IF point_bal > 0 THEN
      INSERT INTO point_transactions (user_id, amount, type, action, description, idempotency_key, balance_before, balance_after)
      VALUES (
        uid,
        point_bal,
        'earn',
        'daily_login',
        'Seed: points from engagement',
        'seed_points_' || uid::text,
        0,
        point_bal
      ) ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;

  END LOOP;
END $$;

-- ── STEP 3: Create posts for each creator (5-10 posts each) ────────
DO $$
DECLARE
  c_row RECORD;
  post_count INT;
  j INT;
  access TEXT;
  token_cost INT;
  thresh INT;
  titles TEXT[] := ARRAY[
    'My Journey Begins', 'Exclusive Behind the Scenes', 'Top Tips for 2025',
    'Community Update', 'Special Announcement', 'Monthly Highlights',
    'Fan Appreciation Post', 'New Project Reveal', 'Q&A Answers',
    'Thank You 1000 Fans!'
  ];
BEGIN
  FOR c_row IN
    SELECT user_id FROM profiles WHERE role = 'creator'
  LOOP
    post_count := floor(random() * 6 + 5)::int; -- 5 to 10 posts
    FOR j IN 1..post_count LOOP
      -- Vary access types
      IF j % 3 = 0 THEN
        access := 'token_gated';
        token_cost := (floor(random() * 4 + 1)::int) * 10; -- 10,20,30,40,50
        thresh := 0;
      ELSIF j % 5 = 0 THEN
        access := 'threshold_gated';
        token_cost := 0;
        thresh := (floor(random() * 3 + 1)::int) * 100;
      ELSE
        access := 'public';
        token_cost := 0;
        thresh := 0;
      END IF;

      INSERT INTO posts (creator_id, title, content, access_type, token_cost, threshold_amount, likes_count, comments_count)
      VALUES (
        c_row.user_id,
        titles[1 + ((j-1) % 10)] || ' #' || j,
        'This is post number ' || j || ' from this creator. ' ||
        CASE access
          WHEN 'public' THEN 'This is free content for everyone to enjoy! Thanks for being here.'
          WHEN 'token_gated' THEN 'This is exclusive token-gated content. Unlock it to read the full details!'
          ELSE 'This is premium threshold-gated content for my biggest supporters!'
        END,
        access::varchar,
        token_cost,
        thresh,
        floor(random() * 150)::int,
        floor(random() * 40)::int
      );
    END LOOP;
  END LOOP;
END $$;

-- ── STEP 4: Fans like posts (each fan likes 5-20 random posts) ─────
DO $$
DECLARE
  f_row RECORD;
  p_row RECORD;
  like_count INT;
  done INT;
BEGIN
  FOR f_row IN SELECT user_id FROM profiles WHERE role = 'fan' LOOP
    like_count := floor(random() * 16 + 5)::int;
    done := 0;
    FOR p_row IN
      SELECT id FROM posts ORDER BY random() LIMIT like_count
    LOOP
      INSERT INTO post_likes (user_id, post_id)
      VALUES (f_row.user_id, p_row.id)
      ON CONFLICT (user_id, post_id) DO NOTHING;
      done := done + 1;
    END LOOP;
  END LOOP;
END $$;

-- ── STEP 5: Update like counts on posts ────────────────────────────
UPDATE posts p
SET likes_count = (
  SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id
);

-- ── STEP 6: Fans comment on posts (each fan comments on 2-8 posts) ─
DO $$
DECLARE
  f_row RECORD;
  p_row RECORD;
  comment_count INT;
  comments TEXT[] := ARRAY[
    'This is amazing! Keep it up!',
    'Love this content 🔥',
    'Thanks for sharing!',
    'Can you make more like this?',
    'This is exactly what I needed!',
    'Great post, very helpful!',
    'You are so talented!',
    'Best creator on the platform!'
  ];
BEGIN
  FOR f_row IN SELECT user_id FROM profiles WHERE role = 'fan' LOOP
    comment_count := floor(random() * 7 + 2)::int;
    FOR p_row IN
      SELECT id FROM posts WHERE access_type = 'public' ORDER BY random() LIMIT comment_count
    LOOP
      INSERT INTO post_comments (user_id, post_id, content)
      VALUES (
        f_row.user_id,
        p_row.id,
        comments[1 + floor(random() * 8)::int % 8]
      );
    END LOOP;
  END LOOP;
END $$;

-- ── STEP 7: Update comment counts on posts ─────────────────────────
UPDATE posts p
SET comments_count = (
  SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id
);

-- ── STEP 8: Fans unlock some token_gated posts ─────────────────────
DO $$
DECLARE
  f_row RECORD;
  p_row RECORD;
  unlocks INT;
  ikey TEXT;
BEGIN
  FOR f_row IN SELECT user_id FROM profiles WHERE role = 'fan' LOOP
    unlocks := floor(random() * 4 + 1)::int;
    FOR p_row IN
      SELECT p.id, p.token_cost, p.creator_id
      FROM posts p
      WHERE p.access_type = 'token_gated'
      ORDER BY random()
      LIMIT unlocks
    LOOP
      ikey := 'seed_unlock_' || f_row.user_id::text || '_' || p_row.id::text;
      INSERT INTO post_unlocks (user_id, post_id, tokens_spent)
      VALUES (f_row.user_id, p_row.id, p_row.token_cost)
      ON CONFLICT (user_id, post_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── STEP 9: Creator redemption items (2-4 per creator) ─────────────
DO $$
DECLARE
  c_row RECORD;
  item_count INT;
  item_names TEXT[] := ARRAY[
    'Exclusive Shoutout', 'Custom Fan Art', 'Discord VIP Role',
    'Signed Photo (Digital)', 'Private Chat Session', '1-on-1 Video Call (30 min)'
  ];
  i INT;
BEGIN
  FOR c_row IN SELECT user_id FROM profiles WHERE role = 'creator' LOOP
    item_count := floor(random() * 3 + 2)::int;
    FOR i IN 1..item_count LOOP
      INSERT INTO redemption_items (creator_id, name, description, point_cost, quantity_available, is_active)
      VALUES (
        c_row.user_id,
        item_names[1 + ((i-1) % 6)],
        'Exclusive reward from this creator for dedicated fans.',
        (floor(random() * 5 + 1)::int) * 100, -- 100 to 500 points
        floor(random() * 20 + 5)::int,
        true
      );
    END LOOP;
  END LOOP;
END $$;

-- ── STEP 10: Daily rewards for fans ────────────────────────────────
DO $$
DECLARE
  f_row RECORD;
BEGIN
  FOR f_row IN SELECT user_id FROM profiles WHERE role = 'fan' LOOP
    INSERT INTO daily_rewards (user_id, action, points_earned, date)
    VALUES (f_row.user_id, 'daily_login', 10, CURRENT_DATE)
    ON CONFLICT (user_id, action, date) DO NOTHING;
  END LOOP;
END $$;

-- ── STEP 11: Creator points aggregation (seeded activity) ──────────
DO $$
DECLARE
  f_row RECORD;
  c_row RECORD;
BEGIN
  -- Seed a few fan-creator point relationships
  FOR f_row IN SELECT user_id FROM profiles WHERE role = 'fan' ORDER BY random() LIMIT 50 LOOP
    FOR c_row IN SELECT user_id FROM profiles WHERE role = 'creator' ORDER BY random() LIMIT 3 LOOP
      INSERT INTO creator_points_agg (user_id, creator_id, total_points, message_count)
      VALUES (
        f_row.user_id,
        c_row.user_id,
        floor(random() * 200 + 5)::int,
        floor(random() * 50 + 1)::int
      ) ON CONFLICT (user_id, creator_id) DO UPDATE SET
        total_points = creator_points_agg.total_points + EXCLUDED.total_points,
        message_count = creator_points_agg.message_count + EXCLUDED.message_count,
        updated_at = now();
    END LOOP;
  END LOOP;
END $$;

-- ── Verification queries ────────────────────────────────────────────
SELECT 'Creators' AS type, COUNT(*) AS count FROM profiles WHERE role = 'creator'
UNION ALL
SELECT 'Fans', COUNT(*) FROM profiles WHERE role = 'fan'
UNION ALL
SELECT 'Posts', COUNT(*) FROM posts
UNION ALL
SELECT 'Likes', COUNT(*) FROM post_likes
UNION ALL
SELECT 'Comments', COUNT(*) FROM post_comments
UNION ALL
SELECT 'Unlocks', COUNT(*) FROM post_unlocks
UNION ALL
SELECT 'Redemption Items', COUNT(*) FROM redemption_items
UNION ALL
SELECT 'Wallets', COUNT(*) FROM wallets;
