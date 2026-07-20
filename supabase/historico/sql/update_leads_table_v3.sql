-- Add JSONB columns to the leads table to organize specific phase data
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS scheduling_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS simulation_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS follow_up_data JSONB DEFAULT '{}'::jsonb;
