-- ============================================================================
-- APLICAR: A43 — fecha os anexos de suporte (bucket público → privado + assinado).
-- ⚠️ RODAR DEPOIS do deploy do código (o front já grava PATH e gera URL assinada).
-- Não há anexos legados (bucket vazio), então nada quebra. Idempotente.
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

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260722040000', 'support_attachments_private')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado:
--   bucket_publico          = false  (bucket agora é privado)
--   policy_publica_removida = 0      ("Public read support_attachments" sumiu)
--   policy_auth_read        = 1      (leitura só autenticado)
--   policy_upload_escopada  = 1      (upload restrito à pasta do usuário)
--   esta_migracao           = 1
-- ============================================================================
SELECT 'bucket_publico' AS verificacao, public::text AS resultado
  FROM storage.buckets WHERE id = 'support_attachments'
UNION ALL
SELECT 'policy_publica_removida', count(*)::text
  FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
   AND policyname='Public read support_attachments'
UNION ALL
SELECT 'policy_auth_read', count(*)::text
  FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
   AND policyname='Auth read support_attachments'
UNION ALL
SELECT 'policy_upload_escopada', count(*)::text
  FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
   AND policyname='Auth upload support_attachments'
UNION ALL
SELECT 'esta_migracao', count(*)::text
  FROM supabase_migrations.schema_migrations WHERE version='20260722040000';
