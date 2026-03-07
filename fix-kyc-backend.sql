-- ================================================================
-- REALCONNECT - CONSOLIDATED KYC BACKEND FIX
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/izwsxkpjnuiezhxbqfbl/sql
-- ================================================================

-- 1. Ensure the user_verifications table has all necessary columns
ALTER TABLE public.user_verifications
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Ensure RLS is enabled for the table
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop and Recreate Admin Policies for better reliability
-- This allows anyone with the admin email to see all verifications
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.user_verifications;
CREATE POLICY "Admins can view all verifications" 
ON public.user_verifications 
FOR SELECT 
USING (
    (auth.jwt()->>'email') IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
);

DROP POLICY IF EXISTS "Admins can update verifications" ON public.user_verifications;
CREATE POLICY "Admins can update verifications" 
ON public.user_verifications 
FOR UPDATE 
USING (
    (auth.jwt()->>'email') IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
);

-- 4. Ensure the kyc_documents Storage Bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Fix Storage RLS Policies
-- IMPORTANT: Use auth.jwt()->>'email' for storage policies too to be consistent
DROP POLICY IF EXISTS "Admins can read all KYC documents" ON storage.objects;
CREATE POLICY "Admins can read all KYC documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'kyc_documents'
    AND (auth.jwt()->>'email') IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
);

-- Ensure users can still upload their own
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'kyc_documents'
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can read their own KYC documents" ON storage.objects;
CREATE POLICY "Users can read their own KYC documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'kyc_documents'
    AND auth.uid() = owner
);

-- 6. Grant permissions to authenticated users to ensure they can write
GRANT ALL ON public.user_verifications TO authenticated;
GRANT ALL ON public.user_verifications TO service_role;

-- ================================================================
-- OPTIONAL: RESET DATA (Run this ONLY if you want to start fresh)
-- This deletes all existing KYC records so you can test the new flow.
-- ================================================================
-- DELETE FROM public.user_verifications;

-- ================================================================
-- Done! Please refresh your browser after running this.
-- ================================================================
