-- Function to check if any admin exists
-- Usage: await supabase.rpc('check_has_admins');

CREATE OR REPLACE FUNCTION public.check_has_admins()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  ) INTO admin_exists;
  
  RETURN admin_exists;
END;
$$;
