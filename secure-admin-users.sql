-- ==============================================================================
-- SECURE ADMIN USER ACCESS FIX
-- This script replaces the public admin_users_view with a secure 
-- SECURITY DEFINER function to prevent unauthorized access to auth.users.
-- ==============================================================================

-- 1. Drop the existing view (and any dependent objects if any)
DROP VIEW IF EXISTS public.admin_users_view CASCADE;

-- 2. Create a secure function to fetch user data
-- This function runs with the privileges of the creator (postgres/superuser)
-- allowing it to read from the auth.users table which is otherwise restricted.
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ,
    first_name TEXT,
    last_name TEXT,
    is_verified BOOLEAN,
    is_blocked BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- STRICT ACCESS CONTROL:
    -- Only allow execution if the caller's email is in the authorized admin list.
    IF auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com') THEN
        RETURN QUERY
        SELECT 
            au.id, 
            au.email, 
            au.phone,
            au.created_at,
            au.raw_user_meta_data->>'first_name',
            au.raw_user_meta_data->>'last_name',
            COALESCE(up.is_verified, false),
            COALESCE(up.is_blocked, false)
        FROM auth.users au
        LEFT JOIN public.user_profiles up ON au.id = up.user_id;
    ELSE
        -- If not an admin, return nothing (or you could raise an exception)
        RETURN;
    END IF;
END;
$$;

-- 3. Grant execute permission to the authenticated role
-- The internal check inside the function handles the fine-grained authorization.
REVOKE ALL ON FUNCTION public.get_admin_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION public.get_admin_users() IS 'Securely fetches user data for admins, replacing the previous public view.';
