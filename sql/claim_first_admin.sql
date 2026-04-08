CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
  target_user_id uuid;
BEGIN
  -- Get the ID of the calling user
  target_user_id := auth.uid();
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated (auth.uid() is null). Check if email confirmation is required.';
  END IF;

  -- Check if there are any existing admins
  SELECT count(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin';

  -- If no admins exist, promote the calling user
  IF admin_count = 0 THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
       -- If we reached here, profile SHOULD exist if frontend waited.
       RAISE EXCEPTION 'Profile row not found for user %. Trigger creation might be lagging.', target_user_id;
    END IF;
    
    RETURN true;
  ELSE
    -- If admin already exists, we return false
    RETURN false;
  END IF;
END;
$$;
