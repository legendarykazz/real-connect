-- Add trigger for Contact Messages to the existing notification system

-- 1. Ensure the trigger function exists (it should have been created by setup-webhooks.sql)
-- But we'll re-define it just in case to ensure it points to the correct URL and handles the table name correctly.

CREATE OR REPLACE FUNCTION public.request_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger for NEW CONTACT MESSAGE
DROP TRIGGER IF EXISTS on_message_inserted ON public.contact_messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.request_admin_notification();

-- Note: Ensure permissions are set correctly for pg_net if not already enabled
GRANT USAGE ON SCHEMA net TO postgres;
