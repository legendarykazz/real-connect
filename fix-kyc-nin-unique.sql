-- Remove the UNIQUE constraint from id_number to allow users to reuse their NIN if rejected
ALTER TABLE public.user_verifications 
DROP CONSTRAINT IF EXISTS user_verifications_id_number_key;
