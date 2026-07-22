-- ============================================================================
-- APLICAR: A37 + A38 — bloqueia escritas anônimas indevidas.
--   A37: anon inseria notificações falsas (phishing) para qualquer usuário.
--   A38: anon forjava entradas no log de auditoria do admin.
-- Cole no SQL Editor do Supabase e rode. Idempotente. NÃO exige deploy de código.
-- ============================================================================

-- A37: notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
REVOKE INSERT ON public.notifications FROM anon;

-- A38: admin_audit_logs
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert own audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_audit_logs FROM anon;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260722020000', 'notifications_insert_authenticated')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado:
--   notif_politica_antiga   = 0   (a "System can insert notifications" sumiu)
--   notif_politica_nova     = 1
--   notif_anon_insert       = 0   (anon sem INSERT em notifications)
--   audit_politica_antiga   = 0   (a "Service role can insert audit logs" sumiu)
--   audit_politica_nova     = 1
--   audit_anon_insert       = 0   (anon sem INSERT em admin_audit_logs)
--   esta_migracao           = 1
-- ============================================================================
SELECT 'notif_politica_antiga' AS verificacao, count(*)::text AS resultado
  FROM pg_policies WHERE schemaname='public' AND tablename='notifications'
   AND policyname='System can insert notifications'
UNION ALL
SELECT 'notif_politica_nova', count(*)::text
  FROM pg_policies WHERE schemaname='public' AND tablename='notifications'
   AND policyname='Authenticated can insert notifications'
UNION ALL
SELECT 'notif_anon_insert', count(*)::text
  FROM information_schema.role_table_grants
 WHERE table_schema='public' AND table_name='notifications'
   AND grantee='anon' AND privilege_type='INSERT'
UNION ALL
SELECT 'audit_politica_antiga', count(*)::text
  FROM pg_policies WHERE schemaname='public' AND tablename='admin_audit_logs'
   AND policyname='Service role can insert audit logs'
UNION ALL
SELECT 'audit_politica_nova', count(*)::text
  FROM pg_policies WHERE schemaname='public' AND tablename='admin_audit_logs'
   AND policyname='Admins can insert own audit logs'
UNION ALL
SELECT 'audit_anon_insert', count(*)::text
  FROM information_schema.role_table_grants
 WHERE table_schema='public' AND table_name='admin_audit_logs'
   AND grantee='anon' AND privilege_type='INSERT'
UNION ALL
SELECT 'esta_migracao', count(*)::text
  FROM supabase_migrations.schema_migrations WHERE version='20260722020000';
