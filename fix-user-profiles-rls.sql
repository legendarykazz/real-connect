-- ==============================================================================
-- FIX FOR: new row violates row-levels security policy for table "user_profiles"
-- This script updates the handle_verification_sync function to run as
-- SECURITY DEFINER, allowing it to update profiles even when the user
-- doesn't have direct write access to the user_profiles table.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_verification_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- This function now runs as SECURITY DEFINER (defined below)
    -- so it can bypass RLS on user_profiles to sync the verification status.
    
    -- If status is changed to 'approved', set is_verified to true
    IF (NEW.status = 'approved') THEN
        INSERT INTO public.user_profiles (user_id, is_verified, updated_at)
        VALUES (NEW.user_id, true, now())
        ON CONFLICT (user_id) DO UPDATE 
        SET is_verified = true, updated_at = now();
    
    -- If status is changed to 'rejected' or 'pending', set is_verified to false
    ELSIF (NEW.status = 'rejected' OR NEW.status = 'pending') THEN
        INSERT INTO public.user_profiles (user_id, is_verified, updated_at)
        VALUES (NEW.user_id, false, now())
        ON CONFLICT (user_id) DO UPDATE 
        SET is_verified = false, updated_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- CRITICAL FIX: Run with system permissions

-- Note: Ensure the function is in the public schema and owned by postgres 
-- (which is the default in the SQL Editor) to have correct permissions.

-- ==============================================================================
-- RE-APPLY TRIGGER (to be sure)
-- ==============================================================================
DROP TRIGGER IF EXISTS on_verification_change ON public.user_verifications;
CREATE TRIGGER on_verification_change
AFTER INSERT OR UPDATE OF status ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_verification_sync();

-- ==============================================================================
-- Done! Please try submitting the KYC form again.
-- ==============================================================================
