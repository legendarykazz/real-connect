-- ================================================================
-- REALCONNECT - MAP LOCATION SUPPORT
-- Run this in your Supabase SQL Editor
-- ================================================================

-- STEP 1: Add latitude and longitude columns to the properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Done!
