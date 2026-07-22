-- ============================================================================
-- APLICAR: A40/A41 — endurecimento de funções SECURITY DEFINER (Fase 11).
-- Nenhum é exploit ativo; é consistência/defesa em profundidade.
-- Cole no SQL Editor do Supabase. Idempotente. NÃO exige deploy de código.
-- ============================================================================

-- A41 — search_path fixo em funções SECURITY DEFINER
ALTER FUNCTION public.check_lead_limit()            SET search_path = public;
ALTER FUNCTION public.check_vehicle_limit()         SET search_path = public;
ALTER FUNCTION public.handle_new_user()             SET search_path = public;
ALTER FUNCTION public.handle_new_user_onboarding()  SET search_path = public;
ALTER FUNCTION public.create_vehicle_v4(
  text, text, integer, integer, numeric, text, text, text, integer, text,
  text, text, text[], boolean, boolean, boolean, boolean
) SET search_path = public;

-- A40 — revoga EXECUTE do anon na função de admin
REVOKE EXECUTE ON FUNCTION
  public.admin_update_user_plan(uuid, text, text, timestamptz) FROM anon;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260722030000', 'secdef_hardening')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado:
--   secdef_sem_search_path   = 0   (nenhuma função SECURITY DEFINER sem search_path)
--   anon_exec_admin_plan     = f   (anon NÃO executa admin_update_user_plan)
--   esta_migracao            = 1
-- ============================================================================
SELECT 'secdef_sem_search_path' AS verificacao, count(*)::text AS resultado
  FROM pg_proc p
 WHERE p.pronamespace='public'::regnamespace AND p.prosecdef=true
   AND NOT EXISTS (
     SELECT 1 FROM unnest(coalesce(p.proconfig,'{}')) c WHERE c LIKE 'search_path=%'
   )
UNION ALL
SELECT 'anon_exec_admin_plan',
       has_function_privilege('anon',
         'public.admin_update_user_plan(uuid, text, text, timestamptz)', 'EXECUTE')::text
UNION ALL
SELECT 'esta_migracao', count(*)::text
  FROM supabase_migrations.schema_migrations WHERE version='20260722030000';
