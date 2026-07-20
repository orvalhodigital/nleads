-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Adiciona coluna para armazenar registros DNS do Vercel
-- ============================================================

-- Adicionar coluna para registros DNS (JSON)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT NULL;

-- Criar índice para buscar rápido
CREATE INDEX IF NOT EXISTS idx_dns_records_exists
ON profiles(id)
WHERE dns_records IS NOT NULL;

NOTIFY pgrst, 'reload schema';

SELECT 'Coluna dns_records adicionada com sucesso!' AS resultado;
