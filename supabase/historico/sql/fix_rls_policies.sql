-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Corrige todas as políticas RLS para que os usuários possam
-- ler e escrever seus próprios dados corretamente.
-- ============================================================

-- ══════════════════════════════════════
-- TABELA: profiles
-- ══════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas conflitantes (se existirem)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- SELECT: usuário lê o próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- INSERT: usuário cria o próprio perfil
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: usuário atualiza o próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ══════════════════════════════════════
-- TABELA: vehicles
-- ══════════════════════════════════════
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;

CREATE POLICY "Users can view own vehicles"
ON vehicles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
ON vehicles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
ON vehicles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
ON vehicles FOR DELETE
USING (auth.uid() = user_id);

-- ══════════════════════════════════════
-- TABELA: leads
-- ══════════════════════════════════════
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

CREATE POLICY "Users can view own leads"
ON leads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
ON leads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
ON leads FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
ON leads FOR DELETE
USING (auth.uid() = user_id);

-- ══════════════════════════════════════
-- TABELA: motorcycles (se existir)
-- ══════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'motorcycles') THEN
    ALTER TABLE motorcycles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own motorcycles" ON motorcycles;
    DROP POLICY IF EXISTS "Users can insert own motorcycles" ON motorcycles;
    DROP POLICY IF EXISTS "Users can update own motorcycles" ON motorcycles;
    DROP POLICY IF EXISTS "Users can delete own motorcycles" ON motorcycles;

    EXECUTE 'CREATE POLICY "Users can view own motorcycles" ON motorcycles FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own motorcycles" ON motorcycles FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own motorcycles" ON motorcycles FOR UPDATE USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own motorcycles" ON motorcycles FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ══════════════════════════════════════
-- TRIGGER: cria perfil automaticamente no cadastro
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name, plan, plan_status, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), ''),
    'trial',
    'active',
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════
-- BACKFILL: cria perfil para usuários existentes sem perfil
-- ══════════════════════════════════════
INSERT INTO public.profiles (id, email, full_name, company_name, plan, plan_status, trial_ends_at)
SELECT
  au.id,
  au.email,
  COALESCE(NULLIF(au.raw_user_meta_data->>'full_name', ''), au.raw_user_meta_data->>'name', ''),
  COALESCE(NULLIF(au.raw_user_meta_data->>'company_name', ''), ''),
  'trial',
  'active',
  NOW() + INTERVAL '7 days'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════
-- PATCH: corrige perfis com nome vazio
-- ══════════════════════════════════════
UPDATE public.profiles p
SET
  full_name = COALESCE(
    NULLIF(p.full_name, ''),
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    au.raw_user_meta_data->>'name',
    ''
  ),
  company_name = COALESCE(NULLIF(p.company_name, ''), au.raw_user_meta_data->>'company_name', '')
FROM auth.users au
WHERE p.id = au.id
  AND (p.full_name IS NULL OR p.full_name = '');

NOTIFY pgrst, 'reload schema';

SELECT 'RLS policies e trigger configurados com sucesso!' as resultado;
