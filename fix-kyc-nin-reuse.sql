-- ==============================================================================
-- FIX FOR: Rejected users cannot re-register with the same NIN
-- This script ensures that the Ninth Identification Number (NIN) is only
-- unique for ACTIVE (pending or approved) applications.
-- If an application is REJECTED, the NIN becomes available for reuse.
-- ==============================================================================

-- 1. First, remove any rigid unique constraint on the id_number column
-- This is often the culprit that blocks all duplicates regardless of status.
ALTER TABLE public.user_verifications 
DROP CONSTRAINT IF EXISTS user_verifications_id_number_key;

-- 2. Drop any old versions of the active index
DROP INDEX IF EXISTS public.active_id_number_idx;

-- 3. Create a partial unique index
-- This only enforces uniqueness for rows where status is 'pending' or 'approved'.
-- Rows with status 'rejected' are ignored by this index, allowing the same
-- id_number to be used in a new 'pending' application.
CREATE UNIQUE INDEX active_id_number_idx 
ON public.user_verifications (id_number) 
WHERE (status = 'pending' OR status = 'approved');

-- 4. Double check: Ensure the status column exists and has the right types
-- (This should already be fine but good for safety)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        -- If you are using a custom type, check it here. 
        -- But based on your schema, it's just TEXT with a CHECK constraint.
    END IF;
END $$;

-- ==============================================================================
-- Done! Now, if you reject a user's KYC, they (or someone else) can 
-- submit a new application with that same ID number.
-- ==============================================================================
