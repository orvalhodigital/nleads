-- EMERGENCY FIX: FORCE ADMIN ROLE
-- Run this in Supabase SQL Editor if you are stuck in the Setup loop

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
    SELECT id 
    FROM public.profiles 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- Check result
SELECT id, role FROM public.profiles WHERE role = 'admin';
