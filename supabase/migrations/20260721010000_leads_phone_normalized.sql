-- ============================================================================
-- Deduplicação de leads por loja (pedido do dono, 2026-07-21)
-- ============================================================================
--
-- Regra: um lead é único DENTRO de uma loja. Se o mesmo telefone volta por
-- outro canal, não cria de novo (já é uma oportunidade no CRM). O mesmo
-- telefone em lojas DIFERENTES são leads distintos (isolados por RLS).
--
-- `phone_normalized` guarda os últimos 11 dígitos do telefone (formato BR:
-- 2 de DDD + 9 do número), ignorando máscara e o código de país 55. É coluna
-- gerada — sempre em sincronia com `phone`, sem código de app para manter.
-- O índice composto (admin_id, phone_normalized) torna a checagem de duplicata
-- eficiente mesmo com muitos leads por loja.
-- ============================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_normalized text
  GENERATED ALWAYS AS (right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 11)) STORED;

CREATE INDEX IF NOT EXISTS idx_leads_admin_phone
  ON public.leads(admin_id, phone_normalized);
