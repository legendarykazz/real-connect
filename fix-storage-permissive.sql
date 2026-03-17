-- ==============================================================================
-- FIX FOR ADMIN ACCESS TO KYC DOCUMENTS
-- This script adds a permissive SELECT policy for the kyc_documents bucket.
-- This ensures that any authenticated user (like the Admin) can view the images.
-- ==============================================================================

-- 1. Ensure the bucket is private (if not already)
UPDATE storage.buckets SET public = false WHERE id = 'kyc_documents';

-- 2. Add an "Admins and Authenticated" policy for SELECT
-- This replaces or complements existing specific email policies
CREATE POLICY "Allow authenticated Select"
ON storage.objects
FOR SELECT
TO authenticated
USING ( bucket_id = 'kyc_documents' );

-- Note: We can refine this later to specifically check for an 'admin' role in 
-- user_profiles if such a column is added.
