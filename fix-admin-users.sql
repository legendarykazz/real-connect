-- ==============================================================================
-- Safely recreate the admin_users_view so the Admin Dashboard can list users
-- ==============================================================================

-- Drop it first if it exists to avoid type conflicts
DROP VIEW IF EXISTS public.admin_users_view;

-- Recreate the view securely
-- Extract first_name and last_name from the secure auth.users metadata
CREATE VIEW public.admin_users_view WITH (security_invoker = on) AS
SELECT 
    au.id,
    au.email,
    au.phone,
    au.created_at,
    au.raw_user_meta_data->>'first_name' AS first_name,
    au.raw_user_meta_data->>'last_name' AS last_name,
    COALESCE(up.is_verified, false) AS is_verified,
    COALESCE(up.is_blocked, false) AS is_blocked
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id;

-- Ensure Admins can query it
GRANT SELECT ON public.admin_users_view TO authenticated;
