-- ================================================================
-- REALCONNECT - FIX KYC RLS UPSERT ISSUE
-- This script allows users to update their own KYC records if they 
-- were rejected or need to resubmit, which is required for 'upsert' to work.
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/izwsxkpjnuiezhxbqfbl/sql
-- ================================================================

-- 1. Allow users to UPDATE their own verification record
-- We allow this if the current record is NOT 'approved' to ensure security.
DROP POLICY IF EXISTS "Users can update their own verification" ON public.user_verifications;

CREATE POLICY "Users can update their own verification" 
ON public.user_verifications 
FOR UPDATE 
USING (
    auth.uid() = user_id 
    AND status != 'approved'
)
WITH CHECK (
    auth.uid() = user_id
);

-- Note: The INSERT policy (Users can insert their own verification) should already exist.
-- If not, you can run this as well:
-- DROP POLICY IF EXISTS "Users can insert their own verification" ON public.user_verifications;
-- CREATE POLICY "Users can insert their own verification" ON public.user_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- Done! Please try submitting the KYC form again after running this.
-- ================================================================
