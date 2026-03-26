-- ==========================================
-- 1. FIX USER PROFILES RLS
-- ==========================================

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "public_read_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_manage_profiles" ON public.user_profiles;

-- Anyone can read profiles
CREATE POLICY "public_read_profiles"
ON public.user_profiles FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "users_insert_own_profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins have full access
CREATE POLICY "admin_manage_profiles"
ON public.user_profiles FOR ALL
USING (
  auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
);

-- Ensure sync function is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_verification_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'approved') THEN
        INSERT INTO public.user_profiles (user_id, is_verified, updated_at)
        VALUES (NEW.user_id, true, now())
        ON CONFLICT (user_id) DO UPDATE 
        SET is_verified = true, updated_at = now();
    ELSIF (NEW.status = 'rejected' OR NEW.status = 'pending') THEN
        INSERT INTO public.user_profiles (user_id, is_verified, updated_at)
        VALUES (NEW.user_id, false, now())
        ON CONFLICT (user_id) DO UPDATE 
        SET is_verified = false, updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. FIX KYC STORAGE BUCKET
-- ==========================================

-- Ensure the kyc_documents bucket exists and is PUBLIC
-- Public=true often resolves "Failed to fetch" (CORS) issues in browser
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'kyc_documents', 
    'kyc_documents', 
    true, 
    52428800, -- 50MB
    '{image/*,application/pdf}'
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = '{image/*,application/pdf}';

-- Clear existing storage policies
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated Select" ON storage.objects;

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'kyc_documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to select (required for admin review)
CREATE POLICY "Allow authenticated Select"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'kyc_documents' );

-- Policy: Users can update/delete their own
CREATE POLICY "Users can manage own docs"
ON storage.objects FOR ALL
USING (bucket_id = 'kyc_documents' AND auth.uid() = owner);
