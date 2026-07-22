-- ============================================================================
-- APLICAR: deduplicação de leads por loja + visibilidade (A33)
-- Cole no SQL Editor do Supabase.
-- ============================================================================
--
-- Coluna gerada com os últimos 11 dígitos do telefone (ignora máscara e o
-- código 55), + índice (admin_id, phone_normalized) para dedup eficiente.
-- O código é resiliente: sem esta coluna, a dedup vira no-op (não quebra) —
-- mas só passa a valer depois de aplicada.
-- ============================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_normalized text
  GENERATED ALWAYS AS (right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 11)) STORED;

CREATE INDEX IF NOT EXISTS idx_leads_admin_phone
  ON public.leads(admin_id, phone_normalized);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260721010000', 'leads_phone_normalized')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado: coluna=1, indice=1, migracoes=21
-- ============================================================================
SELECT 'coluna_phone_normalized' AS verificacao, count(*)::text AS resultado
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='leads' AND column_name='phone_normalized'
UNION ALL
SELECT 'indice_admin_phone', count(*)::text FROM pg_indexes
 WHERE schemaname='public' AND indexname='idx_leads_admin_phone'
UNION ALL
SELECT 'migracoes_registradas', count(*)::text FROM supabase_migrations.schema_migrations;
