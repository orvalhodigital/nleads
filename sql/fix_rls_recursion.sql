-- ============================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE DASHBOARD
-- Corrige o erro "infinite recursion detected in policy for relation profiles"
-- ============================================================
--
-- CAUSA: Políticas em outras tabelas fazem EXISTS (SELECT FROM profiles)
-- para checar role = 'admin'. Quando o Supabase avalia essas subqueries,
-- ele também avalia as policies de profiles, que por sua vez podem
-- acionar outras subqueries — causando recursão infinita.
--
-- SOLUÇÃO: Criar uma função SECURITY DEFINER que lê profiles SEM RLS
-- e usar essa função nas policies em vez de subqueries diretas.
-- ============================================================

-- ── 1. Função auxiliar: verifica se o usuário atual é admin ──────────────

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- ── 2. Limpar TODAS as policies de profiles e recriar sem recursão ────────

DROP POLICY IF EXISTS "Users can view own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"           ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles"         ON public.profiles;
DROP POLICY IF EXISTS "Public can read active website profiles" ON public.profiles;

-- SELECT: usuário lê o próprio perfil OU é admin (sem subquery em profiles)
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_current_user_admin());

-- SELECT: anon lê perfis de lojas com website ativo
CREATE POLICY "profiles_select_public_website"
ON public.profiles FOR SELECT
TO anon
USING (website_active = true);

-- INSERT: usuário insere apenas o próprio perfil
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: usuário atualiza o próprio perfil OU é admin
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_current_user_admin())
WITH CHECK (auth.uid() = id OR public.is_current_user_admin());

-- DELETE: apenas admin pode deletar perfis
CREATE POLICY "profiles_delete_admin"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_current_user_admin());

-- ── 3. Recriar policies de outras tabelas usando a função ─────────────────

-- support_tickets
DROP POLICY IF EXISTS "Admins podem ver todos os tickets"  ON public.support_tickets;
DROP POLICY IF EXISTS "Admins podem atualizar tickets"     ON public.support_tickets;

CREATE POLICY "Admins podem ver todos os tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_current_user_admin());

CREATE POLICY "Admins podem atualizar tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (public.is_current_user_admin());

-- ticket_messages
DROP POLICY IF EXISTS "Participantes podem ver mensagens do ticket" ON public.ticket_messages;
DROP POLICY IF EXISTS "Participantes podem enviar mensagens"        ON public.ticket_messages;

CREATE POLICY "Participantes podem ver mensagens do ticket"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE id = ticket_id
          AND (user_id = auth.uid() OR public.is_current_user_admin())
    )
);

CREATE POLICY "Participantes podem enviar mensagens"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE id = ticket_id
          AND (user_id = auth.uid() OR public.is_current_user_admin())
    )
);

-- onboarding_sessions
DROP POLICY IF EXISTS "Admins have full access to onboarding" ON public.onboarding_sessions;

CREATE POLICY "Admins have full access to onboarding"
ON public.onboarding_sessions
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- ── 4. Vehicles: política pública para sites ativos ───────────────────────

DROP POLICY IF EXISTS "Public can read vehicles for active websites" ON public.vehicles;

CREATE POLICY "Public can read vehicles for active websites"
ON public.vehicles FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE public.profiles.id = vehicles.user_id
          AND public.profiles.website_active = true
    )
);

-- ── 5. Finalizar ──────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

SELECT 'Recursão RLS corrigida com sucesso! Função is_current_user_admin() criada.' AS resultado;
