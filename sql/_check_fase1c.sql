-- Funções helper criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_empresa_of','is_vendedor_of','get_my_parent_id','is_current_user_admin')
ORDER BY routine_name;
