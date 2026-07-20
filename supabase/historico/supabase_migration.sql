-- =====================================================================================
-- Migration: Add Advanced Website Fields to Profiles Table
-- Execute this script in the Supabase SQL Editor to support the new features.
-- =====================================================================================

-- 1. Adding flat text fields for Advanced Styling and Content
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS website_typography TEXT DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS website_card_style TEXT DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS website_hero_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS website_video_url TEXT,
  ADD COLUMN IF NOT EXISTS website_privacy_policy TEXT,
  ADD COLUMN IF NOT EXISTS website_terms_of_use TEXT,
  ADD COLUMN IF NOT EXISTS website_business_hours TEXT,
  ADD COLUMN IF NOT EXISTS website_about_text TEXT;

-- 2. Adding Social Media Links
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS website_instagram TEXT,
  ADD COLUMN IF NOT EXISTS website_facebook TEXT,
  ADD COLUMN IF NOT EXISTS website_youtube TEXT,
  ADD COLUMN IF NOT EXISTS website_tiktok TEXT;

-- 3. Adding Differentials (if they don't already exist from a previous version)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS website_diff1_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_diff1_title TEXT,
  ADD COLUMN IF NOT EXISTS website_diff1_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS website_diff2_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_diff2_title TEXT,
  ADD COLUMN IF NOT EXISTS website_diff2_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS website_diff3_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_diff3_title TEXT,
  ADD COLUMN IF NOT EXISTS website_diff3_subtitle TEXT;

-- Note: Complex nested fields such as 'website_sections', 'website_branding' 
-- and 'website_optimization' are stored as JSONB and do not require new columns.
