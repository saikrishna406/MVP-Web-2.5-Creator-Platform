-- Allow public read access to creator_channels so fans can see the Discord invite links
CREATE POLICY "Allow public read creator_channels" 
ON creator_channels 
FOR SELECT 
USING (is_active = true);
