-- Add availability column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';
