-- ============================================================================
-- A44 — Remove políticas RLS duplicadas em support_tickets / ticket_messages
-- ============================================================================
-- Duas migrações criaram versões EN e PT das mesmas políticas. São redundantes
-- (OR-adas, mesmo efeito). Mantemos as versões {authenticated} (PT), que já
-- cobrem o acesso completo, e removemos as duplicatas {public} + subconjuntos.
--
-- Prova de que o acesso NÃO muda:
--   support_tickets SELECT: "Admins podem ver todos os tickets" já é
--     (auth.uid() = user_id OR is_current_user_admin()) — cobre dono + admin.
--     As outras duas ("Users can view own tickets", "Admins can view all
--     tickets") são subconjuntos. Anon não passa em nenhuma (auth.uid() nulo).
--   support_tickets UPDATE: as duas eram admin-only; mantém uma.
--   ticket_messages INSERT/SELECT: EN e PT têm a MESMA checagem
--     (participante do ticket); mantém a {authenticated}.
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all tickets"      ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets"       ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets"        ON public.support_tickets;
DROP POLICY IF EXISTS "Participants can send messages"   ON public.ticket_messages;
DROP POLICY IF EXISTS "Participants can see ticket messages" ON public.ticket_messages;
