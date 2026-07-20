-- ============================================================================
-- FASE 3 — PARTE 2: corrige o único item que não pegou na primeira aplicação
-- ============================================================================
--
-- Na parte 1, tudo aplicou EXCETO o bloqueio do escalonamento de privilégio.
-- Motivo: `authenticated` tem GRANT de UPDATE no nível da TABELA `profiles`,
-- e no Postgres um REVOKE por coluna não subtrai de um grant de tabela — o
-- comando é aceito sem erro e não faz nada. A conferência acusou:
-- `update_role_revogado` retornou 5, quando o esperado era 0.
--
-- Esta parte troca a abordagem por um trigger BEFORE UPDATE, que é robusto a
-- colunas novas e dá mensagem de erro explícita.
--
-- Continua podendo alterar as colunas privilegiadas:
--   * o servidor (service_role): `auth.uid()` é NULL — o webhook do Asaas
--     segue ativando plano normalmente;
--   * administradores, inclusive via admin_update_user_plan().
--
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_current_user_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role          IS DISTINCT FROM OLD.role
  OR NEW.parent_id     IS DISTINCT FROM OLD.parent_id
  OR NEW.plan          IS DISTINCT FROM OLD.plan
  OR NEW.plan_status   IS DISTINCT FROM OLD.plan_status
  OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
  THEN
    RAISE EXCEPTION
      'Alteracao nao permitida: role, parent_id, plan, plan_status e trial_ends_at so podem ser alterados por administrador ou pelo servidor.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns_trg ON public.profiles;

CREATE TRIGGER protect_profile_privileged_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();


-- ============================================================================
-- CONFERÊNCIA — esperado: as duas linhas com resultado 1
-- ============================================================================
SELECT 'trigger_de_protecao_criado' AS verificacao, count(*)::text AS resultado
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
 WHERE c.relname = 'profiles'
   AND t.tgname = 'protect_profile_privileged_columns_trg'
UNION ALL
SELECT 'funcao_de_protecao_criada', count(*)::text
  FROM pg_proc
 WHERE pronamespace = 'public'::regnamespace
   AND proname = 'protect_profile_privileged_columns';
