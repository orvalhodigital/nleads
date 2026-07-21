-- ============================================================================
-- Fase 7 — A29: corrige a estrutura de planos
-- ============================================================================
--
-- MODELO DE NEGÓCIO (confirmado pelo dono em 2026-07-20):
--   trial               → limitado, 7 dias
--   basico  (R$47)      → PAGO, mas limitado: 10 veículos, 50 leads
--   pro     (R$97)      → Ilimitado
--   estrutura-ecv       (R$697) → ilimitado + serviço de tráfego (Meta Ads)
--   estrutura-ecv-plus  (R$997) → ilimitado + serviço de tráfego
--
-- PROBLEMAS CORRIGIDOS
-- 1. O "Plano Básico" (pago) tinha slug 'free'. Isso o confundia com o tier
--    gratuito/trial nos relatórios e no painel admin. Ganha o slug próprio
--    'basico'.
-- 2. Os triggers de limite (check_lead_limit / check_vehicle_limit) só
--    limitavam 'free' e 'trial'. Como o Básico agora tem slug 'basico', os
--    triggers precisam incluí-lo — senão um assinante do Básico ficaria sem
--    limite no banco.
--
-- O webhook (api/webhook-asaas.ts) já foi ajustado para gravar o slug real do
-- plano pago em vez de 'pro' fixo. Antes, quem pagava R$47 recebia acesso
-- ilimitado (perda de receita).
--
-- Nenhum assinante do Básico existe hoje (só trials e 1 estrutura-ecv-plus),
-- então nenhum cliente atual é afetado.
-- ============================================================================

-- ── 1. Renomeia o slug do plano Básico ──────────────────────────────────────
UPDATE public.plans
   SET slug = 'basico'
 WHERE slug = 'free' AND price > 0;

-- ── 2. Triggers de limite passam a cobrir 'basico' ──────────────────────────
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

  IF v_plan IS NULL OR v_plan IN ('free', 'trial', 'basico') THEN
    SELECT COUNT(*) INTO v_lead_count
      FROM public.leads
     WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    IF v_lead_count >= 50 THEN
      RAISE EXCEPTION 'Limite de leads do plano atingido (máximo 50 leads). Faça upgrade para o Ilimitado!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  IF v_plan IS NULL OR v_plan IN ('free', 'trial', 'basico') THEN
    SELECT COUNT(*) INTO v_vehicle_count
      FROM public.vehicles
     WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    SELECT COUNT(*) INTO v_moto_count
      FROM public.motorcycles
     WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    v_total_count := v_vehicle_count + v_moto_count;

    IF v_total_count >= 10 THEN
      RAISE EXCEPTION 'Limite de veículos do plano atingido (máximo 10 veículos). Faça upgrade para o Ilimitado!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Registra no controle de migrações
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260720110000', 'fix_basico_plan_slug_and_limits')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado: basico_slug=1, triggers_com_basico=2, migracoes=18
-- ============================================================================
SELECT 'basico_slug' AS verificacao, count(*)::text AS resultado
  FROM public.plans WHERE slug = 'basico'
UNION ALL
SELECT 'nenhum_plano_pago_com_slug_free',
       count(*)::text FROM public.plans WHERE slug = 'free' AND price > 0
UNION ALL
SELECT 'triggers_com_basico',
       (SELECT count(*) FROM pg_proc
         WHERE proname IN ('check_lead_limit','check_vehicle_limit')
           AND pg_get_functiondef(oid) LIKE '%basico%')::text
UNION ALL
SELECT 'migracoes_registradas', count(*)::text FROM supabase_migrations.schema_migrations;
