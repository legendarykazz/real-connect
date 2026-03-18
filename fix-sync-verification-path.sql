-- ==============================================================================
-- SECURE HANDLE_VERIFICATION_SYNC SEARCH_PATH FIX
-- This script secures the handle_verification_sync function by setting a 
-- fixed search_path, preventing potential search path hijacking.
-- ==============================================================================

-- 1. Redefine the function with a fixed search_path
CREATE OR REPLACE FUNCTION public.handle_verification_sync()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Documentation comment
COMMENT ON FUNCTION public.handle_verification_sync() 
IS 'Helper function to synchronize verification status to user profiles with a fixed search_path.';
