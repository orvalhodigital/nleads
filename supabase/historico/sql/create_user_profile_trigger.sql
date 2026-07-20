-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Cria um trigger que insere uma linha em `profiles` toda vez
-- que um novo usuário se cadastra via auth.users
-- ============================================================

-- 1. Função que cria o perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name, plan, plan_status, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    -- Google OAuth stores name in 'name'; email/password signup stores in 'full_name'
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

-- 2. Trigger que executa a função acima a cada novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Política RLS para permitir que usuários insiram seu próprio perfil
--    (necessário como fallback caso o trigger não rode)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

-- 4. Backfill: cria perfis para usuários existentes que ainda não têm linha em profiles
INSERT INTO public.profiles (id, email, full_name, company_name, plan, plan_status, trial_ends_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'company_name',
  'trial',
  'active',
  NOW() + INTERVAL '7 days'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Atualiza full_name/company_name para perfis que existem mas estão vazios
--    Suporta tanto cadastro email/senha (full_name) quanto Google OAuth (name)
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
