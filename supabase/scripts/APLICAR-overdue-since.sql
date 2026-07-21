-- ============================================================================
-- APLICAR: coluna overdue_since (fluxo de assinatura em atraso — A31)
-- Cole no SQL Editor do Supabase.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS overdue_since timestamptz;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260721000000', 'add_overdue_since')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado: coluna=1, migracoes=20
-- ============================================================================
SELECT 'coluna_overdue_since' AS verificacao, count(*)::text AS resultado
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='profiles' AND column_name='overdue_since'
UNION ALL
SELECT 'migracoes_registradas', count(*)::text FROM supabase_migrations.schema_migrations;
