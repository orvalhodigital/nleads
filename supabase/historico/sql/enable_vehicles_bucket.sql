-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Cria o bucket 'vehicles' e configura policies de storage
-- ============================================================

-- Criar o bucket público de veículos (sem restrição de MIME)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('vehicles', 'vehicles', true, NULL)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      allowed_mime_types = NULL;  -- Remove qualquer restrição de tipo de arquivo

-- ── Policies ────────────────────────────────────────────────

-- Leitura pública (site público pode ver as fotos)
DROP POLICY IF EXISTS "Public Access Vehicles" ON storage.objects;
CREATE POLICY "Public Access Vehicles"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicles');

-- Upload para autenticados
DROP POLICY IF EXISTS "Auth Upload Vehicles" ON storage.objects;
CREATE POLICY "Auth Upload Vehicles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicles');

-- Atualização para autenticados
DROP POLICY IF EXISTS "Auth Update Vehicles" ON storage.objects;
CREATE POLICY "Auth Update Vehicles"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicles');

-- Exclusão para autenticados
DROP POLICY IF EXISTS "Auth Delete Vehicles" ON storage.objects;
CREATE POLICY "Auth Delete Vehicles"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicles');

-- Recarrega cache do schema (corrige "The database schema is invalid or incompatible")
NOTIFY pgrst, 'reload schema';

SELECT 'Bucket vehicles configurado com sucesso!' AS resultado;
