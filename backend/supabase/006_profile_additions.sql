-- =============================================
-- Stage 6: Profile Additions & Storage Buckets
-- =============================================

-- 1. Add interests to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- 2. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for Avatars

-- Note: RLS is usually enabled by default on storage.objects in Supabase.
-- It is recommended to create the bucket 'avatars' from the Dashboard.

-- Allow public viewing of avatars
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars (name must start with their user ID)
CREATE POLICY "Users can upload their own avatars."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND name LIKE (auth.uid()::text || '-%')
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars."
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND name LIKE (auth.uid()::text || '-%')
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars."
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND name LIKE (auth.uid()::text || '-%')
);
