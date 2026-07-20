-- Add onboarding_completed column to profiles table
-- Tracks if a user has completed the initial onboarding tour

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create index for fast filtering of users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
ON profiles(onboarding_completed)
WHERE onboarding_completed = false;
