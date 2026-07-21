-- ============================================================================
-- Feature: registro de consumo de IA (A30 + painel de métricas)
-- ============================================================================
--
-- Cada chamada às funções api/openai/* passa a gravar um evento aqui, para o
-- painel do admin ter números de consumo (por lojista, por recurso, custo
-- estimado) e para embasar decisões futuras de rate-limit/pricing.
--
-- Inserção: feita server-side pelas funções serverless com service_role, que
-- ignora RLS. Leitura: apenas admin.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Dono da loja (empresa) a que o usuário pertence. Preenchido quando dá para
  -- resolver; permite agregar consumo por lojista mesmo quando quem gerou foi
  -- um vendedor.
  admin_id           uuid,
  feature            text NOT NULL,          -- 'descriptions' | 'seo' | 'matching-insights'
  provider           text,                   -- 'openai' | 'openrouter'
  model              text,
  prompt_tokens      integer NOT NULL DEFAULT 0,
  completion_tokens  integer NOT NULL DEFAULT 0,
  total_tokens       integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(12, 6) NOT NULL DEFAULT 0,  -- estimativa, ver api/_lib/aiUsage
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_id    ON public.ai_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_admin_id   ON public.ai_usage_events(admin_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_created_at ON public.ai_usage_events(created_at);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

-- Só admin lê. Inserção é server-side (service_role ignora RLS), então não há
-- política de INSERT para authenticated — o cliente nunca escreve aqui direto.
DROP POLICY IF EXISTS ai_usage_events_select_admin ON public.ai_usage_events;
CREATE POLICY ai_usage_events_select_admin
  ON public.ai_usage_events FOR SELECT TO authenticated
  USING (public.is_current_user_admin());
