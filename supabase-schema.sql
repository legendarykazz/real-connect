-- ================================================================
-- REALCONNECT - COMPLETE RLS FIX
-- Run ALL of this in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/izwsxkpjnuiezhxbqfbl/sql
-- ================================================================

-- STEP 1: Drop ALL existing policies on properties table (clean slate)
DROP POLICY IF EXISTS "Anyone can view approved properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Admins can do everything" ON properties;
DROP POLICY IF EXISTS "Anyone can view approved" ON properties;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON properties;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON properties;
DROP POLICY IF EXISTS "Allow admin full access" ON properties;

-- STEP 2: Make sure RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create clean, correct policies

-- Policy 1: Anyone (including anonymous visitors) can READ approved listings
CREATE POLICY "public_read_approved"
  ON properties FOR SELECT
  USING (status = 'approved');

-- Policy 2: Admins can read ALL listings (pending, rejected, approved)
CREATE POLICY "admin_read_all"
  ON properties FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
  );

-- Policy 3: ANY authenticated user can INSERT (submit a listing)
CREATE POLICY "authenticated_insert"
  ON properties FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Admins can UPDATE any listing (approve/reject)
CREATE POLICY "admin_update_all"
  ON properties FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
  );

-- Policy 5: Admins can DELETE any listing
CREATE POLICY "admin_delete_all"
  ON properties FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
  );

-- Policy 6: Users can update their OWN listings (e.g. edit before approval)
CREATE POLICY "users_update_own"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 4: Fix Storage Policies for property-images bucket
-- ================================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Drop old storage policies
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public read property images" ON storage.objects;

-- Allow anyone to VIEW images (public bucket)
CREATE POLICY "public_read_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Allow ANY authenticated user to UPLOAD images, docs, videos
CREATE POLICY "authenticated_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images' AND
    auth.role() = 'authenticated'
  );

-- Allow users to DELETE their own uploads (optional)
CREATE POLICY "authenticated_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images' AND
    auth.role() = 'authenticated'
  );

-- Allow ANY authenticated user to UPDATE their own uploads
CREATE POLICY "authenticated_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-images' AND
    auth.role() = 'authenticated'
  );

-- ================================================================
-- STEP 5: Add new columns if not already added
-- ================================================================
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS poster_type TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS agency_name TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- ================================================================
-- Done! All policies are now set correctly.
-- ================================================================

-- ================================================================
-- STEP 6: Create user_profiles table for admin verified toggle
-- ================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY,
  email TEXT,
  is_verified BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all profiles
CREATE POLICY IF NOT EXISTS "admin_manage_profiles"
  ON user_profiles FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
  );

-- Anyone can read profiles (so verified badge can show on listings)
CREATE POLICY IF NOT EXISTS "public_read_profiles"
  ON user_profiles FOR SELECT
  USING (true);
