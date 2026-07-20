-- =====================================================================================
-- Migration: Add Meta Ads and Google Ads Connection Fields to Profiles Table
-- Execute this script in the Supabase SQL Editor.
-- =====================================================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_access_token TEXT,
  ADD COLUMN IF NOT EXISTS google_ads_client_id TEXT,
  ADD COLUMN IF NOT EXISTS google_ads_developer_token TEXT;
