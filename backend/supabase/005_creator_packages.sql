-- =============================================
-- Stage 5: Creator Profile Extensions & Packages
-- =============================================

-- Add new profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}';

-- =============================================
-- CREATOR PACKAGES TABLE
-- =============================================
-- Each creator can define up to 3 monetization packages
CREATE TABLE creator_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  token_price INTEGER NOT NULL CHECK (token_price > 0),
  post_limit INTEGER NOT NULL CHECK (post_limit > 0),
  description TEXT,
  badge_name VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_packages_creator ON creator_packages(creator_id);

-- Trigger for updated_at
CREATE TRIGGER trg_creator_packages_updated BEFORE UPDATE ON creator_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enforce max 3 active packages per creator via function
CREATE OR REPLACE FUNCTION check_max_packages()
RETURNS TRIGGER AS $$
DECLARE
  package_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO package_count
  FROM creator_packages
  WHERE creator_id = NEW.creator_id AND is_active = true;

  IF package_count >= 3 AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Creator can have a maximum of 3 active packages';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_max_packages BEFORE INSERT ON creator_packages
  FOR EACH ROW EXECUTE FUNCTION check_max_packages();
