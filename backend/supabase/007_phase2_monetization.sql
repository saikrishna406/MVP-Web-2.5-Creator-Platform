-- =============================================
-- Stage 7: Phase 2 Loyalty & Monetization MVP
-- Memberships, Events, Founder Passes
-- Strict atomicity, concurrency guards, RLS
-- =============================================

-- ─── 1. EXTEND PROFILES ──────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS banner_image TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- ─── 2. MEMBERSHIP TIERS ─────────────────────
CREATE TABLE IF NOT EXISTS membership_tiers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          VARCHAR(100) NOT NULL CHECK (char_length(name) >= 2),
  price         INTEGER NOT NULL CHECK (price >= 0),           -- Cents. Allows free tiers.
  description   TEXT NOT NULL DEFAULT '',
  member_limit  INTEGER CHECK (member_limit IS NULL OR member_limit > 0),
  members_count INTEGER NOT NULL DEFAULT 0 CHECK (members_count >= 0),
  badge_label   VARCHAR(50),
  is_archived   BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,                    -- Display ordering
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_tier_capacity
    CHECK (member_limit IS NULL OR members_count <= member_limit)
);

CREATE INDEX IF NOT EXISTS idx_tiers_creator ON membership_tiers(creator_id)
  WHERE is_archived = false;

-- Prevent > 3 active tiers per creator (enforced at trigger level)
CREATE OR REPLACE FUNCTION fn_limit_creator_tiers()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM membership_tiers
    WHERE creator_id = NEW.creator_id AND is_archived = false
  ) >= 3 THEN
    RAISE EXCEPTION 'Creators can only have up to 3 active membership tiers.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_limit_tiers ON membership_tiers;
CREATE TRIGGER trg_limit_tiers
  BEFORE INSERT ON membership_tiers
  FOR EACH ROW EXECUTE FUNCTION fn_limit_creator_tiers();

-- ─── 3. SUBSCRIPTIONS ────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fan_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creator_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier_id                 UUID REFERENCES membership_tiers(id) ON DELETE RESTRICT NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'unpaid')),
  stripe_subscription_id  VARCHAR(200) UNIQUE,
  stripe_customer_id      VARCHAR(200),
  current_period_end      TIMESTAMPTZ,
  canceled_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce one active subscription per fan per creator
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_sub
  ON subscriptions (fan_id, creator_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subs_creator ON subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_subs_fan    ON subscriptions(fan_id);
CREATE INDEX IF NOT EXISTS idx_subs_stripe ON subscriptions(stripe_subscription_id);

-- Auto-sync members_count when subscription changes
CREATE OR REPLACE FUNCTION fn_sync_tier_members()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE membership_tiers SET members_count = members_count + 1 WHERE id = NEW.tier_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE membership_tiers SET members_count = GREATEST(0, members_count - 1) WHERE id = NEW.tier_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE membership_tiers SET members_count = members_count + 1 WHERE id = NEW.tier_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE membership_tiers SET members_count = GREATEST(0, members_count - 1) WHERE id = OLD.tier_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_tier_members ON subscriptions;
CREATE TRIGGER trg_sync_tier_members
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION fn_sync_tier_members();

-- ─── 4. EVENTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title         VARCHAR(200) NOT NULL CHECK (char_length(title) >= 3),
  description   TEXT NOT NULL DEFAULT '',
  event_date    TIMESTAMPTZ NOT NULL,
  price         INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),  -- Cents
  capacity      INTEGER CHECK (capacity IS NULL OR capacity > 0),
  tickets_sold  INTEGER NOT NULL DEFAULT 0 CHECK (tickets_sold >= 0),
  status        VARCHAR(20) NOT NULL DEFAULT 'published'
                  CHECK (status IN ('draft', 'published', 'canceled', 'completed')),
  image_url     TEXT,
  stream_url    TEXT,                                           -- For virtual events
  location      TEXT,                                          -- For physical events
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_event_capacity
    CHECK (capacity IS NULL OR tickets_sold <= capacity)
);

CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_date    ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_status  ON events(status);

-- ─── 5. EVENT TICKETS ─────────────────────────
CREATE TABLE IF NOT EXISTS event_tickets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fan_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id          UUID REFERENCES events(id) ON DELETE RESTRICT NOT NULL,
  payment_intent_id VARCHAR(200) UNIQUE,
  status            VARCHAR(20) NOT NULL DEFAULT 'valid'
                      CHECK (status IN ('valid', 'refunded', 'revoked')),
  purchased_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fan_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_event ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_fan   ON event_tickets(fan_id);

-- Auto-sync tickets_sold on event
CREATE OR REPLACE FUNCTION fn_sync_event_tickets()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'valid' THEN
    UPDATE events SET tickets_sold = tickets_sold + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'valid' AND NEW.status != 'valid' THEN
    UPDATE events SET tickets_sold = GREATEST(0, tickets_sold - 1) WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_event_tickets ON event_tickets;
CREATE TRIGGER trg_sync_event_tickets
  AFTER INSERT OR UPDATE ON event_tickets
  FOR EACH ROW EXECUTE FUNCTION fn_sync_event_tickets();

-- ─── 6. FOUNDER PASS ──────────────────────────
CREATE TABLE IF NOT EXISTS founder_pass (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,  -- 1 pass per creator
  price       INTEGER NOT NULL CHECK (price > 0),    -- Cents. Must have a price.
  pass_limit  INTEGER NOT NULL CHECK (pass_limit > 0),
  sold        INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_founder_capacity CHECK (sold <= pass_limit)
);

-- ─── 7. FOUNDER PASS PURCHASES ────────────────
CREATE TABLE IF NOT EXISTS founder_pass_purchases (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fan_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creator_id        UUID REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
  pass_id           UUID REFERENCES founder_pass(id) ON DELETE RESTRICT NOT NULL,
  payment_intent_id VARCHAR(200) UNIQUE,
  purchased_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fan_id, pass_id)   -- 1 founder pass per fan per creator
);

CREATE INDEX IF NOT EXISTS idx_founder_purchases_fan     ON founder_pass_purchases(fan_id);
CREATE INDEX IF NOT EXISTS idx_founder_purchases_creator ON founder_pass_purchases(creator_id);

-- Auto-sync sold count on founder_pass
CREATE OR REPLACE FUNCTION fn_sync_founder_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE founder_pass SET sold = sold + 1 WHERE id = NEW.pass_id;
    -- Check capacity after increment (DB constraint will catch it too, but explicit message)
    IF (SELECT sold FROM founder_pass WHERE id = NEW.pass_id) >
       (SELECT pass_limit FROM founder_pass WHERE id = NEW.pass_id) THEN
      RAISE EXCEPTION 'Founder pass is sold out.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_founder_sold ON founder_pass_purchases;
CREATE TRIGGER trg_sync_founder_sold
  AFTER INSERT ON founder_pass_purchases
  FOR EACH ROW EXECUTE FUNCTION fn_sync_founder_sold();

-- ─── 8. UPDATED_AT TRIGGERS ───────────────────
CREATE TRIGGER trg_tiers_updated    BEFORE UPDATE ON membership_tiers     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subs_updated     BEFORE UPDATE ON subscriptions         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated   BEFORE UPDATE ON events                FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_founder_updated  BEFORE UPDATE ON founder_pass          FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 9. ATOMIC RPCs (Prevent Race-Condition Overselling) ─────────────────
-- Called from the Stripe webhook handler — NOT from the client browser

CREATE OR REPLACE FUNCTION rpc_activate_subscription(
  p_fan_id      UUID,
  p_creator_id  UUID,
  p_tier_id     UUID,
  p_stripe_sub  VARCHAR,
  p_stripe_cust VARCHAR,
  p_period_end  TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO subscriptions (fan_id, creator_id, tier_id, stripe_subscription_id, stripe_customer_id, current_period_end, status)
  VALUES (p_fan_id, p_creator_id, p_tier_id, p_stripe_sub, p_stripe_cust, p_period_end, 'active')
  ON CONFLICT (fan_id, creator_id) WHERE status = 'active'
    DO UPDATE SET
      tier_id = EXCLUDED.tier_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic ticket allocation — called from webhook
CREATE OR REPLACE FUNCTION rpc_allocate_event_ticket(
  p_fan_id          UUID,
  p_event_id        UUID,
  p_payment_intent  VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_id       UUID;
  v_capacity INT;
  v_sold     INT;
BEGIN
  SELECT capacity, tickets_sold INTO v_capacity, v_sold FROM events WHERE id = p_event_id FOR UPDATE;
  IF v_capacity IS NOT NULL AND v_sold >= v_capacity THEN
    RAISE EXCEPTION 'Event is sold out.';
  END IF;
  INSERT INTO event_tickets (fan_id, event_id, payment_intent_id, status)
  VALUES (p_fan_id, p_event_id, p_payment_intent, 'valid')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic founder pass allocation — called from webhook
CREATE OR REPLACE FUNCTION rpc_allocate_founder_pass(
  p_fan_id          UUID,
  p_creator_id      UUID,
  p_pass_id         UUID,
  p_payment_intent  VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_id    UUID;
  v_sold  INT;
  v_limit INT;
BEGIN
  SELECT sold, pass_limit INTO v_sold, v_limit FROM founder_pass WHERE id = p_pass_id FOR UPDATE;
  IF v_sold >= v_limit THEN
    RAISE EXCEPTION 'Founder pass is sold out.';
  END IF;
  INSERT INTO founder_pass_purchases (fan_id, creator_id, pass_id, payment_intent_id)
  VALUES (p_fan_id, p_creator_id, p_pass_id, p_payment_intent)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 10. ROW LEVEL SECURITY ───────────────────
ALTER TABLE membership_tiers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_pass             ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_pass_purchases   ENABLE ROW LEVEL SECURITY;

-- membership_tiers
CREATE POLICY "Tiers are publicly readable"         ON membership_tiers FOR SELECT USING (true);
CREATE POLICY "Creators manage their own tiers"     ON membership_tiers FOR ALL
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

-- subscriptions
CREATE POLICY "Fans see their own subs"             ON subscriptions    FOR SELECT USING (auth.uid() = fan_id);
CREATE POLICY "Creators see subs to their content"  ON subscriptions    FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Service role manages subscriptions"  ON subscriptions    FOR ALL   USING (auth.role() = 'service_role');

-- events
CREATE POLICY "Events are publicly readable"        ON events           FOR SELECT USING (status = 'published');
CREATE POLICY "Creators manage their own events"    ON events           FOR ALL
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

-- event_tickets
CREATE POLICY "Fans see their own tickets"          ON event_tickets    FOR SELECT USING (auth.uid() = fan_id);
CREATE POLICY "Creators see tickets for events"     ON event_tickets    FOR SELECT
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_tickets.event_id AND events.creator_id = auth.uid()));
CREATE POLICY "Service role manages tickets"        ON event_tickets    FOR ALL   USING (auth.role() = 'service_role');

-- founder_pass
CREATE POLICY "Founder passes are publicly readable" ON founder_pass    FOR SELECT USING (true);
CREATE POLICY "Creators manage their founder pass"   ON founder_pass    FOR ALL
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

-- founder_pass_purchases
CREATE POLICY "Fans see their founder purchases"    ON founder_pass_purchases FOR SELECT USING (auth.uid() = fan_id);
CREATE POLICY "Creators see their founder holders" ON founder_pass_purchases FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Service role manages founder purchases" ON founder_pass_purchases FOR ALL USING (auth.role() = 'service_role');
