-- Add Authorization Header to the Webhook

CREATE OR REPLACE FUNCTION public.request_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://izwsxkpjnuiezhxbqfbl.supabase.co/functions/v1/admin-notify',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable__PE0OxxgZm2-yf9_vbXxwg_hSbB7p1z"}'::jsonb,
      body := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
