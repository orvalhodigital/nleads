-- ============================================================
-- FASE 1 — MULTI-USUÁRIOS: Estrutura de Banco de Dados
-- nLeads Veículos | 2026-04-25
--
-- Execute este arquivo INTEIRO no SQL Editor do Supabase.
-- Cada etapa é idempotente (pode rodar mais de uma vez sem dano).
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- ETAPA 1: Adicionar colunas em profiles
-- ══════════════════════════════════════════════════════════════

-- parent_id: vincula vendedor à sua empresa
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- use_company_number: vendedor pode usar o WhatsApp/webhook da empresa
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS use_company_number BOOLEAN DEFAULT false;

-- role: garante que a coluna existe e tem o valor certo
-- (a coluna provavelmente já existe com role='admin' para os admins da nLeads)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'empresa';
  END IF;
END $$;

-- Atualiza o DEFAULT da coluna role para novos cadastros
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'empresa';

-- BACKFILL DO ROLE ANTES DA CONSTRAINT:
-- Qualquer valor que não seja 'admin' (nLeads admin) vira 'empresa'
-- Isso deve rodar ANTES de adicionar a constraint de checagem
UPDATE public.profiles
  SET role = 'empresa'
  WHERE role IS NULL OR role = '' OR role NOT IN ('empresa', 'vendedor', 'super_admin', 'admin');

-- Adiciona constraint de valores válidos (remove a antiga se existir)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('empresa', 'vendedor', 'super_admin', 'admin'));


-- ══════════════════════════════════════════════════════════════
-- ETAPA 2: Adicionar admin_id nas tabelas de dados
-- ══════════════════════════════════════════════════════════════

-- leads: quem é o dono da empresa (admin_id) e quem criou o lead (user_id)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- vehicles: estoque pertence à empresa
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- motorcycles: estoque pertence à empresa
ALTER TABLE public.motorcycles
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;


-- ══════════════════════════════════════════════════════════════
-- ETAPA 3: BACKFILL — preencher dados existentes
-- CRÍTICO: garante que nenhum dado atual fica inacessível após
-- a mudança de RLS
-- ══════════════════════════════════════════════════════════════

-- Preenche admin_id com o user_id para dados existentes
-- Todos os usuários atuais são donos únicos de seus dados (= empresa)
UPDATE public.leads
  SET admin_id = user_id
  WHERE admin_id IS NULL AND user_id IS NOT NULL;

UPDATE public.vehicles
  SET admin_id = user_id
  WHERE admin_id IS NULL AND user_id IS NOT NULL;

UPDATE public.motorcycles
  SET admin_id = user_id
  WHERE admin_id IS NULL AND user_id IS NOT NULL;


-- ══════════════════════════════════════════════════════════════
-- ETAPA 4: Criar tabela de convites (para criar vendedores)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.invitations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL,
    admin_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status     TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, admin_id)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Empresas gerenciam seus convites" ON public.invitations;
CREATE POLICY "Empresas gerenciam seus convites" ON public.invitations
    FOR ALL TO authenticated
    USING (auth.uid() = admin_id)
    WITH CHECK (auth.uid() = admin_id);


-- ══════════════════════════════════════════════════════════════
-- ETAPA 5: Funções helper SECURITY DEFINER para RLS
-- SECURITY DEFINER = executam sem RLS, evitando recursão infinita
-- ══════════════════════════════════════════════════════════════

-- Verifica se o usuário atual É a empresa dona de target_admin_id
CREATE OR REPLACE FUNCTION public.is_empresa_of(target_admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('empresa', 'super_admin', 'admin')
      AND id = target_admin_id
  );
END;
$$;

-- Verifica se o usuário atual É vendedor vinculado ao target_admin_id
CREATE OR REPLACE FUNCTION public.is_vendedor_of(target_admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'vendedor'
      AND parent_id = target_admin_id
  );
END;
$$;

-- Retorna o parent_id do usuário atual sem acionar RLS (para policies de profiles)
CREATE OR REPLACE FUNCTION public.get_my_parent_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT parent_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


-- ══════════════════════════════════════════════════════════════
-- ETAPA 6: Atualizar políticas RLS — profiles
--
-- Preserva:
--   - is_current_user_admin() já existente (para nLeads admin)
--   - profiles_select_public_website (site público)
--   - profiles_insert_own
-- Atualiza:
--   - profiles_select_own: adiciona visibilidade de equipe
--   - profiles_update_own: sem mudança de lógica
-- ══════════════════════════════════════════════════════════════

-- Remove a policy de SELECT antiga (será recriada com nova lógica)
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- SELECT: próprio perfil, admin nLeads vê tudo, empresa vê vendedores, vendedor vê empresa
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id                     -- lê o próprio perfil
  OR public.is_current_user_admin()   -- nLeads admin vê todos
  OR parent_id = auth.uid()           -- empresa lê perfis dos seus vendedores
  OR id = public.get_my_parent_id()   -- vendedor lê o perfil da sua empresa
);

-- INSERT e UPDATE: sem alteração de lógica (apenas o próprio usuário)
-- (as políticas profiles_insert_own e profiles_update_own já existem)


-- ══════════════════════════════════════════════════════════════
-- ETAPA 7: Atualizar políticas RLS — leads
--
-- Preserva:
--   - "Allow public lead inserts from active sites" (leads do site público, anon)
-- Substitui:
--   - as 4 policies antigas de autenticado (view/insert/update/delete own leads)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own leads"   ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads"  ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads"  ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads"  ON public.leads;

CREATE POLICY "leads_select_policy" ON public.leads
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id          -- criador do lead
    OR is_empresa_of(admin_id)    -- empresa vê todos os leads da equipe
    OR is_vendedor_of(admin_id)   -- vendedor vê seus próprios leads
    OR public.is_current_user_admin()  -- nLeads admin vê tudo
  );

CREATE POLICY "leads_insert_policy" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );

CREATE POLICY "leads_update_policy" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );

CREATE POLICY "leads_delete_policy" ON public.leads
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );


-- ══════════════════════════════════════════════════════════════
-- ETAPA 8: Atualizar políticas RLS — vehicles
--
-- Preserva:
--   - "Public can read vehicles for active websites" (anon, já existe)
-- Substitui:
--   - as 4 policies antigas de autenticado
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own vehicles"   ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles"  ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles"  ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles"  ON public.vehicles;

CREATE POLICY "vehicles_select_policy" ON public.vehicles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );

CREATE POLICY "vehicles_insert_policy" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );

CREATE POLICY "vehicles_update_policy" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );

CREATE POLICY "vehicles_delete_policy" ON public.vehicles
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );


-- ══════════════════════════════════════════════════════════════
-- ETAPA 9: Atualizar políticas RLS — motorcycles
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own motorcycles"   ON public.motorcycles;
DROP POLICY IF EXISTS "Users can insert own motorcycles"  ON public.motorcycles;
DROP POLICY IF EXISTS "Users can update own motorcycles"  ON public.motorcycles;
DROP POLICY IF EXISTS "Users can delete own motorcycles"  ON public.motorcycles;

CREATE POLICY "motorcycles_select_policy" ON public.motorcycles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );

CREATE POLICY "motorcycles_insert_policy" ON public.motorcycles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );

CREATE POLICY "motorcycles_update_policy" ON public.motorcycles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );

CREATE POLICY "motorcycles_delete_policy" ON public.motorcycles
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR is_empresa_of(admin_id)
    OR is_vendedor_of(admin_id)
    OR public.is_current_user_admin()
  );


-- ══════════════════════════════════════════════════════════════
-- ETAPA 10: Atualizar trigger de criação de usuário
-- Novos cadastros pelo formulário normal sempre recebem role='empresa'
-- Vendedores são criados pela Edge Function (Fase 2) com role='vendedor'
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, company_name,
    plan, plan_status, trial_ends_at, role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), ''),
    'trial',
    'active',
    NOW() + INTERVAL '7 days',
    -- Se a Edge Function criou o user com role no metadata, usa; senão padrão é 'empresa'
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'empresa')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════
-- ETAPA 11: Notificar PostgREST sobre mudanças de schema
-- ══════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';


-- ══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- Rode esta query separadamente para confirmar que o backfill
-- foi aplicado corretamente
-- ══════════════════════════════════════════════════════════════

SELECT
  'profiles' AS tabela,
  COUNT(*)                                        AS total,
  COUNT(role)                                     AS com_role,
  COUNT(CASE WHEN role = 'empresa' THEN 1 END)    AS role_empresa,
  COUNT(CASE WHEN role = 'vendedor' THEN 1 END)   AS role_vendedor,
  COUNT(CASE WHEN role = 'admin' THEN 1 END)      AS role_admin,
  COUNT(parent_id)                                AS com_parent_id
FROM public.profiles

UNION ALL

SELECT
  'leads',
  COUNT(*),
  COUNT(admin_id),
  COUNT(user_id),
  0, 0, 0
FROM public.leads

UNION ALL

SELECT
  'vehicles',
  COUNT(*),
  COUNT(admin_id),
  COUNT(user_id),
  0, 0, 0
FROM public.vehicles

UNION ALL

SELECT
  'motorcycles',
  COUNT(*),
  COUNT(admin_id),
  COUNT(user_id),
  0, 0, 0
FROM public.motorcycles;
