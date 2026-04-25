-- ============================================================
-- FASE 1 — CLEANUP: Remover policies antigas que não foram
-- dropadas porque tinham nomes diferentes do esperado.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- ── LEADS: remover policies antigas ──────────────────────────
DROP POLICY IF EXISTS "Users can manage own leads"  ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads"   ON public.leads;

-- ── VEHICLES: remover policies antigas ───────────────────────
DROP POLICY IF EXISTS "Users can manage own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicles"  ON public.vehicles;

-- ── MOTORCYCLES: remover policies antigas ────────────────────
DROP POLICY IF EXISTS "Anyone can view motorcycles"            ON public.motorcycles;
DROP POLICY IF EXISTS "Users can manage own motorcycles"       ON public.motorcycles;
DROP POLICY IF EXISTS "Users can manage their own motorcycles" ON public.motorcycles;

-- ── MOTORCYCLES: adicionar policy pública (consistente com vehicles) ─
DROP POLICY IF EXISTS "Public can read motorcycles for active websites" ON public.motorcycles;
CREATE POLICY "Public can read motorcycles for active websites"
ON public.motorcycles FOR SELECT TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE public.profiles.id = motorcycles.user_id
          AND public.profiles.website_active = true
    )
);

NOTIFY pgrst, 'reload schema';

-- Verificação final — deve mostrar apenas as policies novas
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('leads','vehicles','motorcycles')
ORDER BY tablename, policyname;
