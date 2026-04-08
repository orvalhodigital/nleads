-- Add company_name column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Update RLS policies if necessary to allow users to update their own company_name
-- (Assuming existing update policy covers "own profile" updates generally)
