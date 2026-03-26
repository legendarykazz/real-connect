-- ==============================================================================
-- SECURE CONTACT MESSAGES RLS FIX
-- This script replaces the permissive "Anyone can submit a contact message" 
-- INSERT policy with a validated one to prevent empty submissions and 
-- unauthorized status modification.
-- ==============================================================================

-- 1. Drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;

-- 2. Create a new validated policy
-- We ensure that name, email, and message are not empty strings.
-- We also ensure the status remains 'new' (the default) on insert.
CREATE POLICY "Anyone can submit a contact message" 
ON public.contact_messages FOR INSERT 
WITH CHECK (
    char_length(name) > 0 AND 
    char_length(email) > 5 AND 
    char_length(message) > 0 AND
    (status IS NULL OR status = 'new')
);

-- Documentation comment
COMMENT ON POLICY "Anyone can submit a contact message" ON public.contact_messages 
IS 'Restricts insertion to valid contact messages with "new" status to prevent spam and data manipulation.';
