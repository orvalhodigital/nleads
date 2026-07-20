-- ============================================================================
-- FASE 3 DA AUDITORIA — SCRIPT CONSOLIDADO PARA APLICAÇÃO
-- ============================================================================
--
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute de uma vez.
-- Ele é idempotente: rodar duas vezes não causa dano.
--
-- Contém, em ordem:
--   1. Colunas do Asaas   — migração 20260717230000, que NUNCA foi aplicada.
--                           É a causa de o pagamento não ativar o plano. 🔴
--   2. Escalonamento      — A17/A18: fecha o caminho para virar admin e para
--                           dar plano pago a si mesmo. 🔴
--   3. Site público       — A15: vitrine volta a funcionar para quem está logado.
--   4. Políticas faltantes— A19: lead_communications e system_settings.
--
-- ⚠️ ANTES DE RODAR: aplique junto o deploy do código desta entrega.
--    O passo 2 revoga o UPDATE direto de `plan` — a tela AdminUserDetails já foi
--    migrada para a função admin_update_user_plan(), mas a versão antiga do
--    frontend passaria a falhar ao salvar plano.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 1. COLUNAS DO ASAAS — corrige o bug de receita                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- api/webhook-asaas.ts grava `last_asaas_payment_id` e `asaas_subscription_id`.
-- Essas colunas não existem no banco, então o UPDATE falha e o webhook lança
-- erro: o cliente paga e o plano nunca é ativado.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS asaas_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS last_asaas_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_asaas_subscription_id
  ON public.profiles(asaas_subscription_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 2. ESCALONAMENTO DE PRIVILÉGIO (A17 / A18)                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

REVOKE UPDATE (role, parent_id, plan, plan_status, trial_ends_at)
  ON public.profiles FROM authenticated;

REVOKE UPDATE, INSERT, DELETE ON public.profiles FROM anon;

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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 3. SITE PÚBLICO PARA USUÁRIOS AUTENTICADOS (A15)                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Não amplia exposição: `anon` já é a internet inteira e a condição
-- `website_active = true` permanece.

ALTER POLICY "profiles_select_public_website"
  ON public.profiles TO anon, authenticated;

ALTER POLICY "Public can read vehicles for active websites"
  ON public.vehicles TO anon, authenticated;

ALTER POLICY "Public can read motorcycles for active websites"
  ON public.motorcycles TO anon, authenticated;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 4. POLÍTICAS FALTANTES (A19)                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Ambas as tabelas têm RLS ligado e ZERO políticas — hoje ninguém lê nem grava.

-- ── lead_communications ──────────────────────────────────────────────────────
-- Sem coluna user_id; o vínculo com o lojista é via lead_id -> leads.
-- O predicado replica exatamente o das políticas de `leads`, para o isolamento
-- ser idêntico ao do registro-pai.

DROP POLICY IF EXISTS lead_communications_select_policy ON public.lead_communications;
DROP POLICY IF EXISTS lead_communications_insert_policy ON public.lead_communications;
DROP POLICY IF EXISTS lead_communications_update_policy ON public.lead_communications;
DROP POLICY IF EXISTS lead_communications_delete_policy ON public.lead_communications;

CREATE POLICY lead_communications_select_policy
  ON public.lead_communications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_communications.lead_id
    AND (auth.uid() = l.user_id OR public.is_empresa_of(l.admin_id)
      OR public.is_vendedor_of(l.admin_id) OR public.is_current_user_admin())));

CREATE POLICY lead_communications_insert_policy
  ON public.lead_communications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_communications.lead_id
    AND (auth.uid() = l.user_id OR public.is_empresa_of(l.admin_id)
      OR public.is_vendedor_of(l.admin_id) OR public.is_current_user_admin())));

CREATE POLICY lead_communications_update_policy
  ON public.lead_communications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_communications.lead_id
    AND (auth.uid() = l.user_id OR public.is_empresa_of(l.admin_id)
      OR public.is_vendedor_of(l.admin_id) OR public.is_current_user_admin())));

CREATE POLICY lead_communications_delete_policy
  ON public.lead_communications FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_communications.lead_id
    AND (auth.uid() = l.user_id OR public.is_empresa_of(l.admin_id)
      OR public.is_vendedor_of(l.admin_id) OR public.is_current_user_admin())));

CREATE INDEX IF NOT EXISTS idx_lead_communications_lead_id
  ON public.lead_communications(lead_id);

-- ── system_settings ──────────────────────────────────────────────────────────
-- Config global (não é dado de lojista). A tela de login do admin lê a logo
-- antes de existir sessão, então essas chaves precisam ser públicas.
-- A leitura anônima é limitada por whitelist para que um segredo guardado aqui
-- no futuro não vaze automaticamente.

DROP POLICY IF EXISTS system_settings_select_public ON public.system_settings;
DROP POLICY IF EXISTS system_settings_select_admin  ON public.system_settings;
DROP POLICY IF EXISTS system_settings_insert_admin  ON public.system_settings;
DROP POLICY IF EXISTS system_settings_update_admin  ON public.system_settings;
DROP POLICY IF EXISTS system_settings_delete_admin  ON public.system_settings;

CREATE POLICY system_settings_select_public
  ON public.system_settings FOR SELECT TO anon, authenticated
  USING (key IN ('logo_url', 'temp_logo_url', 'temp_logo_start', 'temp_logo_end'));

CREATE POLICY system_settings_select_admin
  ON public.system_settings FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY system_settings_insert_admin
  ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY system_settings_update_admin
  ON public.system_settings FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY system_settings_delete_admin
  ON public.system_settings FOR DELETE TO authenticated
  USING (public.is_current_user_admin());


-- ============================================================================
-- CONFERÊNCIA — rode depois e compare com o esperado
-- ============================================================================
-- Esperado:
--   asaas_colunas          = 3
--   update_role_revogado   = 0   (nenhuma linha)
--   politicas_publicas     = 3   (todas com {anon,authenticated})
--   lead_communications    = 4
--   system_settings        = 5

SELECT 'asaas_colunas' AS verificacao, count(*)::text AS resultado
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='profiles' AND column_name LIKE '%asaas%'
UNION ALL
SELECT 'update_role_revogado', count(*)::text
  FROM information_schema.column_privileges
 WHERE table_schema='public' AND table_name='profiles' AND grantee='authenticated'
   AND privilege_type='UPDATE' AND column_name IN ('role','parent_id','plan','plan_status','trial_ends_at')
UNION ALL
SELECT 'politicas_publicas_com_authenticated', count(*)::text
  FROM pg_policies
 WHERE schemaname='public' AND roles::text LIKE '%authenticated%'
   AND policyname IN ('profiles_select_public_website',
                      'Public can read vehicles for active websites',
                      'Public can read motorcycles for active websites')
UNION ALL
SELECT 'politicas_lead_communications', count(*)::text
  FROM pg_policies WHERE schemaname='public' AND tablename='lead_communications'
UNION ALL
SELECT 'politicas_system_settings', count(*)::text
  FROM pg_policies WHERE schemaname='public' AND tablename='system_settings';
