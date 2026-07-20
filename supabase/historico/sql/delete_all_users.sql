TRUNCATE TABLE auth.users CASCADE;
-- This will automatically cascade to profiles and other related tables if foreign keys are set up correctly.
-- If not, execute: TRUNCATE TABLE public.profiles CASCADE;
