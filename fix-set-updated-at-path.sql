-- ==============================================================================
-- SECURE SET_UPDATED_AT SEARCH_PATH FIX
-- This script secures the set_updated_at function by setting a 
-- fixed search_path, preventing potential search path hijacking.
-- ==============================================================================

-- 1. Redefine the function with a fixed search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Documentation comment
COMMENT ON FUNCTION public.set_updated_at() 
IS 'Helper function to automatically update the updated_at timestamp with a fixed search_path.';
