-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Cria política RLS para permite inserção anônima de leads
-- Do site público para lojas com website ativo
-- ============================================================

CREATE POLICY "Allow public lead inserts from active sites"
ON leads FOR INSERT TO anon
WITH CHECK (
  user_id IN (
    SELECT id FROM profiles WHERE website_active = true
  )
);

SELECT 'Política RLS para leads públicos criada com sucesso!' AS resultado;
