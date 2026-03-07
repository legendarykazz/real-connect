-- ==============================================================================
-- FIX FOR PROPERTY-IMAGES BUCKET SECURITY VULNERABILITY
-- This script adds the missing ownership check (auth.uid() = owner) to ensure
-- users can only update or delete their own property images.
-- ==============================================================================

-- 1. Fix: Allow users to UPDATE only their own uploads
DROP POLICY IF EXISTS "authenticated_update_own" ON storage.objects;

CREATE POLICY "authenticated_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-images' AND
    auth.uid() = owner AND -- CRITICAL FIX: Ensure user owns the file
    NOT EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND is_blocked = true
    )
  );

-- 2. Fix: Allow users to DELETE only their own uploads
DROP POLICY IF EXISTS "authenticated_delete_own" ON storage.objects;

CREATE POLICY "authenticated_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images' AND
    auth.uid() = owner AND -- CRITICAL FIX: Ensure user owns the file
    NOT EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND is_blocked = true
    )
  );

-- Keep the existing INSERT and SELECT policies as they are secure
-- (Anyone can read, authenticated non-blocked users can insert)
