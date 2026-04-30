-- Create the creator_points_agg table
CREATE TABLE IF NOT EXISTS creator_points_agg (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    total_points INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, creator_id)
);

-- Index for fast leaderboard lookups
CREATE INDEX IF NOT EXISTS idx_creator_points_agg_creator_id ON creator_points_agg(creator_id);

-- Create the RPC for atomic upsert
CREATE OR REPLACE FUNCTION increment_creator_points(p_user_id UUID, p_creator_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO creator_points_agg (user_id, creator_id, total_points, message_count)
    VALUES (p_user_id, p_creator_id, 1, 1)
    ON CONFLICT (user_id, creator_id)
    DO UPDATE SET 
        total_points = creator_points_agg.total_points + 1,
        message_count = creator_points_agg.message_count + 1,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
