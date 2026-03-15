-- ==============================================================================
-- AUTOMATIC KYC SYNC TRIGGER
-- This trigger ensures that when an admin approves a verification, 
-- the user_profiles table is automatically updated.
-- ==============================================================================

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
$$ LANGUAGE plpgsql;

-- Apply the trigger to the user_verifications table
DROP TRIGGER IF EXISTS on_verification_change ON public.user_verifications;
CREATE TRIGGER on_verification_change
AFTER INSERT OR UPDATE OF status ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_verification_sync();

-- ==============================================================================
-- BACKFILL: Cleanup any existing discrepancies now
-- ==============================================================================
UPDATE public.user_profiles up
SET is_verified = true
FROM public.user_verifications uv
WHERE up.user_id = uv.user_id AND uv.status = 'approved';
