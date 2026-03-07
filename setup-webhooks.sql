-- =========================================================================================
-- This script creates triggers (webhooks) to call the your admin-notify edge function.
-- Run this entire script in your Supabase SQL Editor.
-- =========================================================================================

-- 1. Create Webhook to fire when a NEW PROPERTY is added
DROP TRIGGER IF EXISTS on_property_inserted ON public.properties;
CREATE TRIGGER on_property_inserted
  AFTER INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
    -- Replace 'izwsxkpjnuiezhxbqfbl' with your actual project reference ID if it is different
    'https://izwsxkpjnuiezhxbqfbl.supabase.co/functions/v1/admin-notify',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '1000'
  );


-- 2. Create Webhook to fire when a NEW KYC VERIFICATION is added
DROP TRIGGER IF EXISTS on_verification_inserted ON public.user_verifications;
CREATE TRIGGER on_verification_inserted
  AFTER INSERT ON public.user_verifications
  FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
    -- Replace 'izwsxkpjnuiezhxbqfbl' with your actual project reference ID if it is different
    'https://izwsxkpjnuiezhxbqfbl.supabase.co/functions/v1/admin-notify',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '1000'
  );
