-- Add verification columns to properties table
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS docs_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS survey_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS acquisition_free BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_report_url TEXT;
