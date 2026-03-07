-- 0. Enable the required extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Create a helper function to send the webhook
CREATE OR REPLACE FUNCTION public.request_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      -- Replace 'izwsxkpjnuiezhxbqfbl' with your actual project reference ID
      url := 'https://izwsxkpjnuiezhxbqfbl.supabase.co/functions/v1/admin-notify',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger for NEW PROPERTY
DROP TRIGGER IF EXISTS on_property_inserted ON public.properties;
CREATE TRIGGER on_property_inserted
  AFTER INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.request_admin_notification();


-- 3. Create Trigger for NEW KYC VERIFICATION
DROP TRIGGER IF EXISTS on_verification_inserted ON public.user_verifications;
CREATE TRIGGER on_verification_inserted
  AFTER INSERT ON public.user_verifications
  FOR EACH ROW EXECUTE FUNCTION public.request_admin_notification();
