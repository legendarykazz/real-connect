-- ==============================================================================
-- 1. Create the user_verifications table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Status of the verification
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- ID Document Details
    id_type TEXT NOT NULL, -- e.g., 'National ID', 'Passport', 'Driver License'
    id_number TEXT UNIQUE NOT NULL, -- Unique constraint to prevent duplicates
    id_document_url TEXT NOT NULL,
    
    -- Proof of Address Details
    address_document_url TEXT NOT NULL,
    
    -- Selfie / Liveness 
    selfie_url TEXT NOT NULL,
    
    -- Admin Review specific metadata
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a user can only have one active verification record
    UNIQUE(user_id)
);

-- Turn on Row Level Security
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own verification requests
CREATE POLICY "Users can insert their own verification" 
ON public.user_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own verification status
CREATE POLICY "Users can view their own verification" 
ON public.user_verifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Only Admins can view ALL verifications
CREATE POLICY "Admins can view all verifications" 
ON public.user_verifications 
FOR SELECT 
USING (
    (auth.jwt()->>'email') IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
    OR
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Only Admins can update verifications
CREATE POLICY "Admins can update verifications" 
ON public.user_verifications 
FOR UPDATE 
USING (
    (auth.jwt()->>'email') IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
    OR
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_verifications_updated_at ON public.user_verifications;
CREATE TRIGGER set_user_verifications_updated_at
BEFORE UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 2. Setup the kyc_documents Storage Bucket
-- ==============================================================================
-- This safely creates the bucket if it doesn't already exist.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Users can upload documents to the kyc_documents bucket if they are authenticated
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'kyc_documents'
    AND auth.role() = 'authenticated'
);

-- Users can read their own documents (if needed for the UI)
CREATE POLICY "Users can read their own KYC documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'kyc_documents'
    AND auth.uid() = owner
);

-- Admins can read (and download) any document in the kyc_documents bucket
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
