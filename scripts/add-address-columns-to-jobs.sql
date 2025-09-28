-- Migration: Add address columns to jobs table
-- This fixes the "Could not find the 'address_city' column of 'jobs'" error

-- Add address columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_country VARCHAR(100) DEFAULT 'Belgium';

-- Add index for address-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_address_city ON jobs(address_city);
CREATE INDEX IF NOT EXISTS idx_jobs_address_postal_code ON jobs(address_postal_code);

-- Update the main schema file comment to reflect this change
COMMENT ON TABLE jobs IS 'Concrete pump jobs with scheduling, tracking, and address information';

-- Note: This migration allows jobs to have direct address fields while still 
-- maintaining the option to reference yards via yard_id for standardized locations
