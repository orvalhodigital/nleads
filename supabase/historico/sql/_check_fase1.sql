SELECT 'profiles' AS tabela, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND column_name IN ('role','parent_id','use_company_number')
UNION ALL
SELECT 'leads', column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
  AND column_name IN ('admin_id','user_id')
UNION ALL
SELECT 'vehicles', column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vehicles'
  AND column_name IN ('admin_id','user_id')
UNION ALL
SELECT 'motorcycles', column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'motorcycles'
  AND column_name IN ('admin_id','user_id')
ORDER BY tabela, column_name;
