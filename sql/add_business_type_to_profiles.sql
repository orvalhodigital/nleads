-- Add business_type column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'vehicles';
