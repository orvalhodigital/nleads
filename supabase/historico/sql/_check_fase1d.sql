-- Constraint de role e backfill
SELECT
  COUNT(*) AS total_profiles,
  COUNT(CASE WHEN role = 'empresa' THEN 1 END) AS role_empresa,
  COUNT(CASE WHEN role = 'vendedor' THEN 1 END) AS role_vendedor,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) AS role_admin,
  COUNT(CASE WHEN role IS NULL THEN 1 END) AS role_nulo,
  COUNT(parent_id) AS com_parent_id
FROM public.profiles;
