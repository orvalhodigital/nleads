-- ============================================================================
-- APLICAR: A44 — remove políticas RLS duplicadas (EN+PT) em tickets.
-- Não muda o acesso (as {authenticated} mantidas já cobrem tudo). Idempotente.
-- Cole no SQL Editor do Supabase.
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all tickets"      ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets"       ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets"        ON public.support_tickets;
DROP POLICY IF EXISTS "Participants can send messages"   ON public.ticket_messages;
DROP POLICY IF EXISTS "Participants can see ticket messages" ON public.ticket_messages;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260722060000', 'dedup_ticket_policies')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado:
--   support_tickets_policies = 3   (1 INSERT, 1 SELECT, 1 UPDATE)
--   ticket_messages_policies = 2   (1 INSERT, 1 SELECT)
--   esta_migracao            = 1
-- ============================================================================
SELECT 'support_tickets_policies' AS verificacao, count(*)::text AS resultado
  FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets'
UNION ALL
SELECT 'ticket_messages_policies', count(*)::text
  FROM pg_policies WHERE schemaname='public' AND tablename='ticket_messages'
UNION ALL
SELECT 'esta_migracao', count(*)::text
  FROM supabase_migrations.schema_migrations WHERE version='20260722060000';
