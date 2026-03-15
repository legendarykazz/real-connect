-- ================================================================
-- REALCONNECT - CONSOLIDATED KYC STORAGE FIX
-- This script ensures the kyc_documents bucket exists and has the correct
-- RLS policies for uploads and admin access.
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/izwsxkpjnuiezhxbqfbl/sql
-- ================================================================

-- 1. Ensure the kyc_documents Storage Bucket exists and is PRIVATE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'kyc_documents', 
    'kyc_documents', 
    false, 
    52428800, -- 50MB limit
    '{image/*,application/pdf}' -- Allowed types
)
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = '{image/*,application/pdf}';

-- 2. Clear existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all KYC documents" ON storage.objects;

-- 3. Policy: Authenticated users can upload to THEIR OWN folder
-- Path format: {user_id}/{filename}
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'kyc_documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Users can read their own documents
CREATE POLICY "Users can read their own KYC documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'kyc_documents'
    AND auth.uid() = owner
);

-- 5. Policy: Admins can read all KYC documents
CREATE POLICY "Admins can read all KYC documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'kyc_documents'
    AND (
        (auth.jwt()->>'email') IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
);

-- 6. Policy: Users can update/delete their own documents (in case of retry/cleanup)
DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
CREATE POLICY "Users can update their own KYC documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'kyc_documents' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;
CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'kyc_documents' AND auth.uid() = owner);

-- ================================================================
-- Done! Please try submitting the KYC form again after running this.
-- ================================================================
