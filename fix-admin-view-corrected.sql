-- ==============================================================================
-- Fix admin_users_view missing data
-- The previous view used security_invoker = true which caused permission denied
-- errors for the `authenticated` role trying to read `auth.users`.
-- We must run the view with default definer privileges, but still protect it
-- with a WHERE clause that checks auth.email() matching admin emails.
-- ==============================================================================

DROP VIEW IF EXISTS public.admin_users_view CASCADE;

CREATE VIEW public.admin_users_view AS
SELECT 
    au.id, 
    au.email, 
    au.phone,
    au.created_at,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    COALESCE(up.is_verified, false) as is_verified,
    COALESCE(up.is_blocked, false) as is_blocked
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com');

-- Grant access to authenticated users (the WHERE clause above protects the data)
GRANT SELECT ON public.admin_users_view TO authenticated;
