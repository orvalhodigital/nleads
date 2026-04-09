-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Execute mesmo se já executou versão anterior (usa IF NOT EXISTS)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website_active          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_theme           TEXT    DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS website_primary_color   TEXT    DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS website_secondary_color TEXT    DEFAULT '#0891b2',
  ADD COLUMN IF NOT EXISTS website_text_color      TEXT    DEFAULT '#374151',
  ADD COLUMN IF NOT EXISTS website_title_color     TEXT    DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS website_use_gradient    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_hero_text       TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_hero_subtitle   TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_whatsapp        TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_cta_text        TEXT    DEFAULT 'Tenho Interesse',
  ADD COLUMN IF NOT EXISTS website_slug            TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_city            TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_google_maps     TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_domain           TEXT    DEFAULT '';

-- Índice único no slug para lookups rápidos
CREATE UNIQUE INDEX IF NOT EXISTS profiles_website_slug_idx
  ON profiles (website_slug)
  WHERE website_slug IS NOT NULL AND website_slug <> '';

-- RLS: perfis com website ativo podem ser lidos por anônimos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Public can read active website profiles'
  ) THEN
    CREATE POLICY "Public can read active website profiles"
      ON profiles FOR SELECT
      TO anon
      USING (website_active = true);
  END IF;
END $$;

-- RLS: veículos de lojas com website ativo podem ser lidos por anônimos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vehicles'
      AND policyname = 'Public can read vehicles for active websites'
  ) THEN
    CREATE POLICY "Public can read vehicles for active websites"
      ON vehicles FOR SELECT
      TO anon
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = vehicles.user_id
            AND profiles.website_active = true
        )
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

SELECT 'Colunas de website e políticas públicas criadas com sucesso!' AS resultado;
