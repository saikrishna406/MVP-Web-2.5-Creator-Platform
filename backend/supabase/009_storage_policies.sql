-- =========================================================
-- Storage RLS Policies for "post-images" bucket
-- Run this ONCE in Supabase SQL Editor
-- =========================================================

-- 1. Allow authenticated users to UPLOAD (INSERT) files
CREATE POLICY "Authenticated creators can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- 2. Allow anyone to READ (SELECT) files (since bucket is public)
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- 3. Allow users to DELETE their own files
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);
