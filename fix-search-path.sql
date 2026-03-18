-- ==============================================================================
-- SECURE FUNCTION SEARCH_PATH FIX
-- This script secures the request_admin_notification function by setting a 
-- fixed search_path, preventing potential search path hijacking.
-- ==============================================================================

-- 1. Redefine the function with a fixed search_path
CREATE OR REPLACE FUNCTION public.request_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- This sends an HTTP POST request to your Supabase Edge Function
  PERFORM
    net.http_post(
      url := 'https://izwsxkpjnuiezhxbqfbl.supabase.co/functions/v1/admin-notify',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, net, pg_temp;

-- Documentation comment
COMMENT ON FUNCTION public.request_admin_notification() 
IS 'Securely triggers admin notifications via Edge Functions with a fixed search_path.';
