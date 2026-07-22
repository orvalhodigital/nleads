-- ============================================================================
-- A37 / A38 — Escritas anônimas indevidas (classe de bug "WITH CHECK (true)
--             para {public}" + GRANT ao anon)
-- ============================================================================
-- Duas tabelas tinham política de INSERT com `WITH CHECK (true)` para o papel
-- `{public}`, e o `anon` tinha GRANT de INSERT — ou seja, qualquer pessoa SEM
-- login, só com a chave anônima (pública), conseguia inserir linhas.
--
-- A37 (notifications): dava para injetar notificações falsas com cara de
--   "sistema" no sino de QUALQUER lojista (phishing/assédio).
-- A38 (admin_audit_logs): dava para FORJAR entradas no log de auditoria do
--   admin — poluir a trilha forense, fabricar ações, incriminar alguém ou
--   soterrar eventos reais. A política até se chamava "Service role can insert",
--   mas o check `true`/{public} deixava qualquer um escrever.
--
-- Fluxos legítimos (todos autenticados) seguem funcionando; inserts server-side
-- (api/ com service_role) ignoram RLS e não são afetados.
-- ============================================================================

-- ---- A37: notifications ----------------------------------------------------
-- Legítimo: troca de fase de lead (vendedor→empresa), tickets (usuário↔admin),
-- broadcast do admin — todos autenticados e cross-user. Basta exigir login.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

REVOKE INSERT ON public.notifications FROM anon;

-- ---- A38: admin_audit_logs -------------------------------------------------
-- Legítimo: `auditLogService.logAction` grava com `admin_id = session.user.id`.
-- Amarrar o insert a isso impede forjar entrada em nome de outro admin.
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_logs;

CREATE POLICY "Admins can insert own audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_audit_logs FROM anon;

-- Resíduo conhecido (planejado p/ Fase 14): mover a criação de notificação e de
-- log de auditoria para o servidor (RPC/endpoint service_role) fecha até o
-- resíduo de spoof entre usuários autenticados.
