-- ============================================================================
-- BASELINE DE MIGRAÇÕES — achado A21
-- ============================================================================
--
-- PROBLEMA
-- O banco de produção não tem a tabela `supabase_migrations.schema_migrations`.
-- As migrações em `supabase/migrations/` nunca foram aplicadas pelo CLI: o
-- schema foi construído colando SQL à mão no editor.
--
-- Consequência real (achado A20): a migração `add_asaas_subscription_fields`
-- ficou três dias no repositório sem ser aplicada. O webhook do Asaas gravava
-- colunas inexistentes e falhava em silêncio — o cliente pagava e o plano não
-- era ativado. Ninguém percebeu até a auditoria.
--
-- O QUE ESTE SCRIPT FAZ
-- Cria a tabela de controle e registra as 15 migrações JÁ APLICADAS
-- (sem executá-las — os efeitos já estão no banco). A partir daí,
-- `npx supabase db push --linked` passa a funcionar e só aplica o que for novo.
--
-- ⚠️ RODE UMA VEZ SÓ, e só depois de conferir que todas as migrações listadas
--    abaixo realmente já estão no banco. Registrar como aplicada uma migração
--    que NÃO foi aplicada faz o CLI pular a aplicação dela para sempre.
--
-- Idempotente: usa ON CONFLICT DO NOTHING.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version   text PRIMARY KEY,
  statements text[],
  name      text
);

INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
  ('20260409151130', 'remote_schema'),
  ('20260423093221', 'add_website_diffs'),
  ('20260424000001', 'add_missing_website_columns'),
  ('20260424000002', 'add_motorcycle_new_fields'),
  ('20260424000003', 'add_vehicle_new_fields'),
  ('20260424000004', 'append_lead_interaction_atomic'),
  ('20260522000001', 'add_funnel_goals'),
  ('20260522000002', 'add_show_on_website'),
  ('20260604000000', 'add_sales_flow_and_warranty'),
  ('20260605000000', 'add_onboarding_completed'),
  ('20260717230000', 'add_asaas_subscription_fields'),
  ('20260720000001', 'fix_privilege_escalation'),
  ('20260720000002', 'fix_public_website_policies'),
  ('20260720000003', 'add_missing_rls_policies'),
  ('20260720000004', 'fix_privilege_escalation_trigger')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado: 15 migrações registradas
-- ============================================================================
SELECT count(*)::text AS migracoes_registradas
  FROM supabase_migrations.schema_migrations;
