-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Adiciona novas colunas de website na tabela profiles
-- Cor de fundo customizável, degradê, e horários de funcionamento
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website_background_color  TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_bg_color2         TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_bg_gradient       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_hours            JSONB   DEFAULT '[]';

NOTIFY pgrst, 'reload schema';

SELECT 'Novas colunas de website adicionadas com sucesso!' AS resultado;
