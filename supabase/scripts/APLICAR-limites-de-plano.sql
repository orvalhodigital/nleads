-- ============================================================================
-- A23 — aplica os limites de plano no banco (migração esquecida)
-- ============================================================================
--
-- ⚠️ RODE **DEPOIS** DE `BASELINE-migracoes.sql`.
--
-- PROBLEMA
-- A migração `20260715220000_add_plan_limit_triggers` foi escrita em
-- 2026-07-15 e nunca aplicada. As funções check_lead_limit/check_vehicle_limit
-- e seus triggers não existem no banco.
--
-- Consequência: os limites do plano gratuito (50 leads, 10 veículos) só são
-- validados no navegador, por src/services/planService.ts. Quem chamar a API do
-- Supabase diretamente cadastra sem limite — o plano grátis é ilimitado na
-- prática.
--
-- Este script aplica a migração E a registra na tabela de controle, para o
-- histórico não nascer torto de novo.
--
-- Idempotente: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.
-- ============================================================================

-- ── 1. Limite de leads ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_lead_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_lead_count INT;
  v_target_admin_id UUID;
BEGIN
  SELECT COALESCE(
    NEW.admin_id,
    (SELECT parent_id FROM public.profiles WHERE id = NEW.user_id),
    NEW.user_id
  ) INTO v_target_admin_id;

  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_target_admin_id;

  IF v_plan IS NULL OR v_plan = 'free' OR v_plan = 'trial' THEN
    SELECT COUNT(*) INTO v_lead_count
      FROM public.leads
     WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    IF v_lead_count >= 50 THEN
      RAISE EXCEPTION 'Limite de leads do plano gratuito atingido (máximo 50 leads). Faça upgrade para Pro!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Limite de veículos (carros + motos) ──────────────────────────────────
CREATE OR REPLACE FUNCTION check_vehicle_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_vehicle_count INT;
  v_moto_count INT;
  v_total_count INT;
  v_target_admin_id UUID;
BEGIN
  SELECT COALESCE(
    NEW.admin_id,
    (SELECT parent_id FROM public.profiles WHERE id = NEW.user_id),
    NEW.user_id
  ) INTO v_target_admin_id;

  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_target_admin_id;

  IF v_plan IS NULL OR v_plan = 'free' OR v_plan = 'trial' THEN
    SELECT COUNT(*) INTO v_vehicle_count
      FROM public.vehicles
     WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    SELECT COUNT(*) INTO v_moto_count
      FROM public.motorcycles
     WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    v_total_count := v_vehicle_count + v_moto_count;

    IF v_total_count >= 10 THEN
      RAISE EXCEPTION 'Limite de veículos em estoque do plano gratuito atingido (máximo 10 veículos). Faça upgrade para Pro!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Triggers ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_check_lead_limit ON public.leads;
CREATE TRIGGER trigger_check_lead_limit
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION check_lead_limit();

DROP TRIGGER IF EXISTS trigger_check_vehicle_limit ON public.vehicles;
CREATE TRIGGER trigger_check_vehicle_limit
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION check_vehicle_limit();

DROP TRIGGER IF EXISTS trigger_check_motorcycle_limit ON public.motorcycles;
CREATE TRIGGER trigger_check_motorcycle_limit
  BEFORE INSERT ON public.motorcycles
  FOR EACH ROW EXECUTE FUNCTION check_vehicle_limit();

-- ── 4. Registra no controle de migrações ────────────────────────────────────
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260715220000', 'add_plan_limit_triggers')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado: as 4 primeiras linhas com 1, e migracoes = 16
-- ============================================================================
SELECT 'fn check_lead_limit'       AS item, count(*)::text AS resultado FROM pg_proc    WHERE proname = 'check_lead_limit'
UNION ALL SELECT 'fn check_vehicle_limit',  count(*)::text FROM pg_proc    WHERE proname = 'check_vehicle_limit'
UNION ALL SELECT 'trg leads',               count(*)::text FROM pg_trigger WHERE tgname  = 'trigger_check_lead_limit'
UNION ALL SELECT 'trg vehicles',            count(*)::text FROM pg_trigger WHERE tgname  = 'trigger_check_vehicle_limit'
UNION ALL SELECT 'trg motorcycles',         count(*)::text FROM pg_trigger WHERE tgname  = 'trigger_check_motorcycle_limit'
UNION ALL SELECT 'migracoes registradas',   count(*)::text FROM supabase_migrations.schema_migrations;
