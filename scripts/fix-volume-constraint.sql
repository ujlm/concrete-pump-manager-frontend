-- Fix volume constraint to allow 0 volume for planning purposes
-- This fixes the "new row for relation 'jobs' violates check constraint 'jobs_positive_volume'" error

-- Drop the existing constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_positive_volume;

-- Add a new constraint that allows 0 or positive volume
ALTER TABLE jobs ADD CONSTRAINT jobs_non_negative_volume CHECK (volume_expected >= 0);

-- Also update the pipe constraint to be consistent
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_positive_pipe_length;
ALTER TABLE jobs ADD CONSTRAINT jobs_non_negative_pipe_length CHECK (pipe_expected >= 0);

-- Note: 0 volume is valid for planning purposes where the exact volume isn't known yet
