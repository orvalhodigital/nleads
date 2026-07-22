-- ============================================================================
-- A43 — Anexos de suporte eram mundo-legíveis (bucket público)
-- ============================================================================
-- O bucket `support_attachments` era `public=true` e tinha a política de storage
-- "Public read support_attachments" (SELECT liberado a qualquer um). O código
-- guardava a URL pública (`getPublicUrl`) com nome de arquivo `Math.random()`.
-- Resultado: qualquer pessoa com (ou que adivinhasse) a URL lia anexos de
-- suporte — que podem conter prints do painel do lojista com dados de clientes.
--
-- Correção coordenada com o código (deploy ANTES deste SQL):
--   - `ticketService.uploadAttachment` grava em `tickets/<uid>/<uuid>.<ext>` e
--     retorna o PATH (não URL pública).
--   - `getAttachmentUrl` gera URL ASSINADA (1h) sob demanda.
--   - Renderização via componente `AttachmentChip`.
-- Aqui: bucket privado, leitura só autenticado (via URL assinada), e upload
-- restrito à pasta do próprio usuário.
-- ============================================================================

UPDATE storage.buckets SET public = false WHERE id = 'support_attachments';

DROP POLICY IF EXISTS "Public read support_attachments" ON storage.objects;
CREATE POLICY "Auth read support_attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'support_attachments');

DROP POLICY IF EXISTS "Auth upload support_attachments" ON storage.objects;
CREATE POLICY "Auth upload support_attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support_attachments'
    AND (storage.foldername(name))[1] = 'tickets'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
