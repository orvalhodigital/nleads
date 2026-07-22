-- ============================================================================
-- APLICAR: A48 — coluna cpf_cnpj em profiles (Asaas exige p/ cobrança).
-- Cole no SQL Editor do Supabase. Idempotente. Pode rodar antes ou depois do
-- deploy (o endpoint grava o cpf_cnpj em best-effort até a coluna existir).
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf_cnpj text;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260722050000', 'profiles_cpf_cnpj')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado: coluna_cpf_cnpj = 1, esta_migracao = 1
-- ============================================================================
SELECT 'coluna_cpf_cnpj' AS verificacao, count(*)::text AS resultado
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='profiles' AND column_name='cpf_cnpj'
UNION ALL
SELECT 'esta_migracao', count(*)::text
  FROM supabase_migrations.schema_migrations WHERE version='20260722050000';
