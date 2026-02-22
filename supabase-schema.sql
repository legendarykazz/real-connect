-- Run this in Supabase SQL editor to add new columns for media and agency posting

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS poster_type TEXT DEFAULT 'user' CHECK (poster_type IN ('user', 'admin', 'agency')),
  ADD COLUMN IF NOT EXISTS agency_name TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- Allow admins to bypass RLS and read/write all properties
-- (Run this so pending listings show up for admins)
CREATE POLICY IF NOT EXISTS "Admins can do everything"
  ON properties FOR ALL
  USING (auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com'))
  WITH CHECK (auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com'));
