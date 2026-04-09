-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Adiciona coluna gallery_images na tabela vehicles
-- ============================================================

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';

-- Garante que registros existentes tenham array vazio (não null)
UPDATE vehicles SET gallery_images = '{}' WHERE gallery_images IS NULL;

NOTIFY pgrst, 'reload schema';

SELECT 'Coluna gallery_images adicionada com sucesso!' as resultado;
