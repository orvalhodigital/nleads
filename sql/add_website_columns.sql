-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Passo 1: Adiciona colunas de website na tabela profiles
-- Passo 2: Execute fix_rls_recursion.sql para configurar as policies
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website_active          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_theme           TEXT    DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS website_primary_color   TEXT    DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS website_secondary_color TEXT    DEFAULT '#0891b2',
  ADD COLUMN IF NOT EXISTS website_text_color      TEXT    DEFAULT '#374151',
  ADD COLUMN IF NOT EXISTS website_title_color     TEXT    DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS website_use_gradient    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_hero_image      TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_hero_text       TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_hero_subtitle   TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_whatsapp        TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_cta_text        TEXT    DEFAULT 'Tenho Interesse',
  ADD COLUMN IF NOT EXISTS website_slug            TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_city            TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_google_maps     TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_domain           TEXT    DEFAULT '';

-- Índice único no slug
CREATE UNIQUE INDEX IF NOT EXISTS profiles_website_slug_idx
  ON profiles (website_slug)
  WHERE website_slug IS NOT NULL AND website_slug <> '';

NOTIFY pgrst, 'reload schema';

SELECT 'Colunas de website adicionadas! Execute fix_rls_recursion.sql para configurar as políticas de acesso.' AS resultado;
