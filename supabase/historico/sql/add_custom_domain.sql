-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Adiciona campo para domínio customizado na tabela profiles
-- ============================================================

-- 1. Adicionar colunas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255),
  ADD COLUMN IF NOT EXISTS custom_domain_status VARCHAR(50) DEFAULT 'pending';

-- 2. Limpar valores vazios/inválidos (deixar apenas valores válidos ou NULL)
UPDATE profiles
SET custom_domain = NULL
WHERE custom_domain = '' OR TRIM(custom_domain) = '';

-- 3. Remover índice antigo se existir
DROP INDEX IF EXISTS idx_custom_domain_unique;

-- 4. Criar índice único para domínios customizados (para evitar duplicatas)
CREATE UNIQUE INDEX idx_custom_domain_unique
ON profiles(custom_domain)
WHERE custom_domain IS NOT NULL AND custom_domain != '';

NOTIFY pgrst, 'reload schema';

SELECT 'Coluna custom_domain adicionada com sucesso!' AS resultado;
