-- ============================================================================
-- Fase 3 — CORREÇÃO de 20260720000001: o REVOKE por coluna não funcionou
-- ============================================================================
--
-- POR QUE A PRIMEIRA TENTATIVA FALHOU
-- O papel `authenticated` tem GRANT de UPDATE no nível da TABELA `profiles`.
-- No Postgres, um `REVOKE UPDATE (coluna) ... FROM papel` **não subtrai** de um
-- grant de tabela — o grant de tabela cobre todas as colunas, presentes e
-- futuras. O comando foi aceito sem erro e não teve efeito nenhum.
--
-- Confirmado pela consulta de conferência: `update_role_revogado` retornou 5
-- (as 5 colunas continuavam atualizáveis) quando o esperado era 0.
--
-- POR QUE NÃO CORRIGIR COM GRANT POR COLUNA
-- A alternativa seria `REVOKE UPDATE ON profiles FROM authenticated` seguido de
-- `GRANT UPDATE (…86 colunas…)`. Funciona, mas é uma armadilha de manutenção:
-- toda coluna nova nasceria sem permissão de UPDATE, e a falha apareceria longe
-- da causa. Com 91 colunas e um schema ainda em evolução, o custo é alto.
--
-- SOLUÇÃO ADOTADA
-- Trigger BEFORE UPDATE que bloqueia a alteração das colunas privilegiadas.
-- Vantagens: sobrevive a colunas novas, dá mensagem de erro explícita, e não
-- depende da interação sutil entre grants de tabela e de coluna.
--
-- Quem continua podendo alterar:
--   * o servidor (service_role e rotinas internas) — `auth.uid()` é NULL ali,
--     então o webhook do Asaas segue ativando plano normalmente;
--   * administradores do sistema — inclusive através da função
--     `admin_update_user_plan()`, criada na migração anterior.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Sem usuário autenticado = chamada server-side (service_role, webhooks,
  -- triggers internos). Liberado: é assim que a ativação de plano do Asaas
  -- e a edge function `invite_user` operam.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Administrador do sistema pode alterar.
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

COMMENT ON FUNCTION public.protect_profile_privileged_columns IS
  'Impede que um usuario comum altere as proprias colunas privilegiadas de profiles. Criada na Fase 3 da auditoria (achados A17/A18), depois que o REVOKE por coluna se mostrou ineficaz contra o GRANT de tabela.';

DROP TRIGGER IF EXISTS protect_profile_privileged_columns_trg ON public.profiles;

CREATE TRIGGER protect_profile_privileged_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();
