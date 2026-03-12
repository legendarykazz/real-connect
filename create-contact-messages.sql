-- Enable the UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for contact form messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new', -- e.g., 'new', 'replied', 'closed'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a message (Insert)
CREATE POLICY "Anyone can submit a contact message" 
ON public.contact_messages FOR INSERT 
WITH CHECK (true);

-- Only admins can view messages
-- Using the same policy pattern as other admin tables
CREATE POLICY "Admins can view contact messages" 
ON public.contact_messages FOR SELECT 
USING (
    auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
);
