ALTER TABLE public.user_verifications
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;
