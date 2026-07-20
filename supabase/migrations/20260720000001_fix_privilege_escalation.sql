-- ============================================================================
-- Fase 3 da auditoria — A17 e A18: escalonamento de privilégio e burla de plano
-- ============================================================================
--
-- PROBLEMA
-- A política `profiles_update_own` permite ao usuário editar a própria linha,
-- e o papel `authenticated` tinha GRANT de UPDATE em TODAS as colunas —
-- incluindo `role`, `parent_id`, `plan`, `plan_status` e `trial_ends_at`.
-- Não havia trigger nem constraint impedindo, e o CHECK aceita o valor 'admin'.
--
-- Consequência (verificada em pg_policies e information_schema, não explorada):
--   UPDATE profiles SET role='admin' WHERE id = auth.uid();
-- passa a satisfazer is_current_user_admin(), que aparece nas políticas de
-- profiles, leads, vehicles, motorcycles e outras — dando ao lojista leitura de
-- TODOS os dados de TODAS as lojas e DELETE de qualquer perfil.
--
--   UPDATE profiles SET plan='pro', plan_status='active' WHERE id = auth.uid();
-- libera o plano pago sem passar pelo Asaas.
--
--   UPDATE profiles SET role='vendedor', parent_id='<loja alvo>' ...
-- faz is_vendedor_of() liberar os leads e o estoque daquela loja.
--
-- SOLUÇÃO
-- Revogar UPDATE por coluna. A política de linha continua igual; o Postgres
-- rejeita a alteração dessas colunas específicas mesmo quando o USING passa.
--
-- POR QUE É SEGURO REVOGAR (verificado antes de escrever esta migração):
--   * `role` e `parent_id`: nada no cliente os escreve. O whitelist
--     ALLOWED_FIELDS de profileService.updateProfile não os inclui, e a gestão
--     de equipe passa pela edge function `invite_user`, que usa service_role.
--   * `plan`, `plan_status`, `trial_ends_at`: o único ponto no cliente é
--     AdminUserDetails.tsx, migrado nesta mesma entrega para a função
--     admin_update_user_plan() criada abaixo.
--   * Webhooks e funções serverless usam SUPABASE_SERVICE_ROLE_KEY, que ignora
--     RLS e grants de coluna — a cobrança Asaas não é afetada.
--   * INSERT permanece intacto: o perfil é criado pelo trigger
--     `on_auth_user_created` e os defaults das colunas cobrem o cadastro
--     (role='empresa', plan='trial', plan_status='active', trial +7 dias).
-- ============================================================================

-- ── 1. Fecha a escalada ─────────────────────────────────────────────────────
-- ⚠️ ESTE COMANDO NÃO FUNCIONOU. Mantido por honestidade histórica.
-- O papel `authenticated` tem GRANT de UPDATE no nível da TABELA, e no Postgres
-- um REVOKE por coluna não subtrai de um grant de tabela: o comando é aceito
-- sem erro e não tem efeito. A conferência acusou (esperado 0, veio 5).
-- A correção efetiva está em 20260720000004_fix_privilege_escalation_trigger.sql.
REVOKE UPDATE (role, parent_id, plan, plan_status, trial_ends_at)
  ON public.profiles FROM authenticated;

-- Garante que papéis anônimos não tenham nada em profiles além do SELECT
-- público já coberto por `profiles_select_public_website`.
REVOKE UPDATE, INSERT, DELETE ON public.profiles FROM anon;

-- ── 2. Caminho legítimo para o admin alterar plano ───────────────────────────
-- Segue o padrão já existente no projeto (admin_update_user_password).
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(
  target_user_id    uuid,
  new_plan          text        DEFAULT NULL,
  new_plan_status   text        DEFAULT NULL,
  new_trial_ends_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar plano de usuário';
  END IF;

  UPDATE public.profiles
     SET plan          = COALESCE(new_plan, plan),
         plan_status   = COALESCE(new_plan_status, plan_status),
         trial_ends_at = COALESCE(new_trial_ends_at, trial_ends_at)
   WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário % não encontrado', target_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_plan(uuid, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_plan(uuid, text, text, timestamptz) TO authenticated;

COMMENT ON FUNCTION public.admin_update_user_plan IS
  'Altera plano/status/trial de um usuário. Só executa para admins. Criada na Fase 3 da auditoria, quando o UPDATE direto dessas colunas foi revogado do papel authenticated.';
