-- 1. Drop the rigid unique constraint that blocks all duplicate NINs (if it still exists)
ALTER TABLE public.user_verifications 
DROP CONSTRAINT IF EXISTS user_verifications_id_number_key;

-- 2. Drop the old partial index if we are re-running this
DROP INDEX IF EXISTS active_id_number_idx;

-- 3. Create a smart (partial) unique index.
-- This ensures the NIN is unique ONLY when the status is 'pending' or 'approved'.
-- If an application is 'rejected', the NIN is "freed up" and can be used again 
-- (for example, if the user creates a new account to re-apply).
CREATE UNIQUE INDEX active_id_number_idx 
ON public.user_verifications (id_number) 
WHERE status IN ('pending', 'approved');
