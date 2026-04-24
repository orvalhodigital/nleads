-- Add missing website columns to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS website_background_color text,
ADD COLUMN IF NOT EXISTS website_bg_color2 text,
ADD COLUMN IF NOT EXISTS website_bg_gradient boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS website_hero_button_text text,
ADD COLUMN IF NOT EXISTS website_about_text text,
ADD COLUMN IF NOT EXISTS website_instagram text,
ADD COLUMN IF NOT EXISTS website_facebook text,
ADD COLUMN IF NOT EXISTS website_youtube text,
ADD COLUMN IF NOT EXISTS website_show_sold boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS website_show_filters boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS website_diff1_icon text,
ADD COLUMN IF NOT EXISTS website_diff2_icon text,
ADD COLUMN IF NOT EXISTS website_diff3_icon text,
ADD COLUMN IF NOT EXISTS website_diff4_icon text;
