-- ============================================================================
-- Fluxo de assinatura em atraso (refinamento do A31)
-- ============================================================================
--
-- Regra do dono (2026-07-20): vencimento + 1 dia → "Pagamento Atrasado"; o
-- sistema ainda funciona por 3 dias (com banner de renovação); depois disso
-- bloqueia todas as telas exceto Configurações. A entrada de leads pelo
-- Supabase continua (é server-side).
--
-- `overdue_since` marca QUANDO a assinatura ficou em atraso, para o frontend
-- contar os 3 dias de graça. É preenchido pelo webhook do Asaas em
-- PAYMENT_OVERDUE e zerado quando o pagamento é recebido ou a assinatura
-- cancelada.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS overdue_since timestamptz;
