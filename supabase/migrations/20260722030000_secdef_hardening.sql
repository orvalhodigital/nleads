-- ============================================================================
-- A40 / A41 — Endurecimento de funções SECURITY DEFINER (Fase 11)
-- ============================================================================
-- Nenhum destes é exploit ativo — são endurecimento/consistência:
--
-- A41: 5 funções SECURITY DEFINER estavam SEM `SET search_path` fixo
--   (search_path mutável — alerta do próprio linter do Supabase). Em SECURITY
--   DEFINER isso pode permitir que objetos resolvam para o schema errado se um
--   atacante controlar o search_path. Baixa explorabilidade no Supabase (usuário
--   comum não cria schema/objeto), mas é a prática correta para função privileg.
--
-- A40: `admin_update_user_plan` tinha EXECUTE para `anon`. A função já se protege
--   internamente (`IF NOT is_current_user_admin() THEN RAISE`), então não era
--   explorável — mas o irmão `admin_update_user_password` (A24) já teve o EXECUTE
--   do anon revogado. Alinhamos: função de admin não deve ser sequer chamável
--   por anônimo.
-- ============================================================================

-- A41 — fixar search_path
ALTER FUNCTION public.check_lead_limit()            SET search_path = public;
ALTER FUNCTION public.check_vehicle_limit()         SET search_path = public;
ALTER FUNCTION public.handle_new_user()             SET search_path = public;
ALTER FUNCTION public.handle_new_user_onboarding()  SET search_path = public;
ALTER FUNCTION public.create_vehicle_v4(
  text, text, integer, integer, numeric, text, text, text, integer, text,
  text, text, text[], boolean, boolean, boolean, boolean
) SET search_path = public;

-- A40 — admin não é chamável por anônimo (defesa em profundidade)
REVOKE EXECUTE ON FUNCTION
  public.admin_update_user_plan(uuid, text, text, timestamptz) FROM anon;
