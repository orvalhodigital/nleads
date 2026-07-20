-- Fix motorcycles table missing columns and cache
ALTER TABLE motorcycles 
ADD COLUMN IF NOT EXISTS brake_type TEXT,
ADD COLUMN IF NOT EXISTS start_type TEXT,
ADD COLUMN IF NOT EXISTS fuel_system TEXT,
ADD COLUMN IF NOT EXISTS cooling TEXT,
ADD COLUMN IF NOT EXISTS has_spare_key BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_owner_manual BOOLEAN DEFAULT FALSE;

-- Notify postgrest to reload schema
NOTIFY pgrst, 'reload schema';
