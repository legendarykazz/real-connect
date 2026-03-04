-- Security Fix: Ensure only admins can query the admin_users_view
-- Run this in your Supabase SQL Editor to resolve the Advisor Warning!

CREATE OR REPLACE VIEW admin_users_view WITH (security_invoker = true) AS
SELECT 
    au.id, 
    au.email, 
    au.created_at,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    au.raw_user_meta_data->>'phone' as phone,
    COALESCE(up.is_verified, false) as is_verified,
    COALESCE(up.is_blocked, false) as is_blocked
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE auth.role() = 'authenticated'
  AND auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com');

-- Grant access to authenticated users (the WHERE clause above protects the data)
GRANT SELECT ON admin_users_view TO authenticated;
