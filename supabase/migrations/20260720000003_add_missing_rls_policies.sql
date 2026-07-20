-- ============================================================================
-- Fase 3 da auditoria — A19: tabelas com RLS ligado e ZERO políticas
-- ============================================================================
--
-- PROBLEMA
-- `lead_communications` e `system_settings` têm RLS habilitado mas nenhuma
-- política. No Postgres isso significa negar tudo: nenhum papel (exceto
-- service_role, que ignora RLS) consegue ler ou gravar.
--
-- Consequência: funcionalidade quebrada em silêncio.
--   * lead_communications — histórico de mensagens enviadas ao lead. Usada em 7
--     pontos (Inventory, MotorcycleInventory, LeadDetailPage). Nunca gravou nada:
--     a tabela está com 0 linhas.
--   * system_settings — logo do sistema e janela de logo temporária, lidas pelo
--     AdminLogin (antes do login, portanto como `anon`) e pelo hook
--     useSystemSettings. Também com 0 linhas.
--
-- ============================================================================
-- lead_communications
-- ============================================================================
-- A tabela não tem coluna `user_id`; o vínculo com o lojista é indireto, via
-- `lead_id -> leads`. As políticas reaproveitam exatamente o mesmo predicado das
-- políticas de `leads`, para que o isolamento entre lojistas seja idêntico ao do
-- registro-pai e não abra uma porta lateral.
--
-- Todos os pontos de inserção do código preenchem `lead_id`
-- (LeadDetailPage.tsx:357, Inventory.tsx:247), então o escopo cobre 100% das
-- linhas gravadas pela aplicação.

CREATE POLICY lead_communications_select_policy
  ON public.lead_communications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
       WHERE l.id = lead_communications.lead_id
         AND ( auth.uid() = l.user_id
            OR public.is_empresa_of(l.admin_id)
            OR public.is_vendedor_of(l.admin_id)
            OR public.is_current_user_admin() )
    )
  );

CREATE POLICY lead_communications_insert_policy
  ON public.lead_communications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
       WHERE l.id = lead_communications.lead_id
         AND ( auth.uid() = l.user_id
            OR public.is_empresa_of(l.admin_id)
            OR public.is_vendedor_of(l.admin_id)
            OR public.is_current_user_admin() )
    )
  );

CREATE POLICY lead_communications_update_policy
  ON public.lead_communications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
       WHERE l.id = lead_communications.lead_id
         AND ( auth.uid() = l.user_id
            OR public.is_empresa_of(l.admin_id)
            OR public.is_vendedor_of(l.admin_id)
            OR public.is_current_user_admin() )
    )
  );

CREATE POLICY lead_communications_delete_policy
  ON public.lead_communications FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
       WHERE l.id = lead_communications.lead_id
         AND ( auth.uid() = l.user_id
            OR public.is_empresa_of(l.admin_id)
            OR public.is_vendedor_of(l.admin_id)
            OR public.is_current_user_admin() )
    )
  );

-- Índice para o predicado acima não virar varredura a cada leitura.
CREATE INDEX IF NOT EXISTS idx_lead_communications_lead_id
  ON public.lead_communications(lead_id);

-- ============================================================================
-- system_settings
-- ============================================================================
-- Configuração global do sistema (não é dado de lojista). Duas necessidades:
--   * leitura ANÔNIMA de um conjunto restrito de chaves — a tela de login do
--     admin busca a logo antes de existir sessão;
--   * escrita apenas por administrador.
--
-- A leitura anônima é limitada por uma whitelist de chaves em vez de liberar a
-- tabela inteira. Assim, se alguém guardar um segredo aqui no futuro, ele não
-- vaza automaticamente para a internet.

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

COMMENT ON TABLE public.system_settings IS
  'Configuração global do sistema. As chaves logo_url/temp_logo_* são legíveis publicamente (tela de login). NÃO armazene segredos aqui.';
