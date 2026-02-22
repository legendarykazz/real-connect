-- ============================================================
-- REALCONNECT - COMPLETE SUPABASE SETUP SCRIPT
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- ---- 1. CREATE THE PROPERTIES TABLE ----
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Contact Info from the submitter
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Property Details
  location TEXT NOT NULL,
  property_type TEXT NOT NULL,
  title_document TEXT NOT NULL,
  size TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Media: store the public URL after uploading to storage
  image_url TEXT,

  -- Admin-controlled status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Link listing to the authenticated user who created it
  user_id UUID REFERENCES auth.users(id)
);

-- ---- 2. ENABLE ROW LEVEL SECURITY (RLS) ----
-- This is the primary defense against hacking / unauthorized access
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (even guests) can view approved properties
CREATE POLICY "Anyone can view approved properties"
  ON properties FOR SELECT
  USING (status = 'approved');

-- Policy: Authenticated users can view their OWN properties at any status
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Authenticated users can submit new properties
CREATE POLICY "Authenticated users can insert properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can update their OWN pending properties
CREATE POLICY "Users can update their own pending properties"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');


-- ---- 3. CREATE IMAGE STORAGE BUCKET ----
-- This bucket will store all uploaded property images

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;


-- ---- 4. STORAGE SECURITY POLICIES ----

-- Policy: Anyone can VIEW images (so public listings show photos)
CREATE POLICY "Public can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Policy: Authenticated users can UPLOAD images
CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Policy: Users can only DELETE their own files
CREATE POLICY "Users can delete their own property images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-images' AND auth.uid() = owner);


-- ============================================================
-- DONE! Your database and storage are fully set up.
-- ============================================================
