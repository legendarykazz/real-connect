-- ================================================================
-- REALCONNECT - ADD MISSING LOCATION COLUMNS
-- Run this in your Supabase SQL Editor to fix the schema cache error
-- ================================================================

ALTER TABLE IF EXISTS public.properties
ADD COLUMN IF NOT EXISTS latitude FLOAT8,
ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Notify PostgREST to reload the schema cache so the web app can see the new columns immediately
NOTIFY pgrst, 'reload schema';
